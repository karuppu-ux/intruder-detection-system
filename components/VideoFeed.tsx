
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { RefreshCw, Cpu, ScanFace, UserCheck } from 'lucide-react';
import { SecurityStatus, SimulationScenario, ActionType, SkeletalSignature, RegisteredProfile } from '../types';
import { ACTION_THRESHOLDS } from '../constants';

interface VideoFeedProps {
  status: SecurityStatus;
  isSimulating: boolean;
  onDetectionUpdate: (isSuspicious: boolean, confidence: number, actionType: string, snapshot?: string, summary?: string, matchedId?: string, signature?: SkeletalSignature) => void;
  videoSource: string | null;
  sensitivity: number;
  onSensitivityChange: (val: number) => void;
  simulationScenario?: SimulationScenario;
  profiles: RegisteredProfile[];
  onRegisterProfile: (profile: RegisteredProfile) => void;
}

const BUFFER_SIZE = 10;

const getVector = (p1: any, p2: any) => ({ x: p2.x - p1.x, y: p2.y - p1.y });
const getMagnitude = (v: {x: number, y: number}) => Math.sqrt(v.x * v.x + v.y * v.y);
const dotProduct = (v1: {x: number, y: number}, v2: {x: number, y: number}) => v1.x * v2.x + v1.y * v2.y;

const calculateAngle = (a: {x:number, y:number}, b: {x:number, y:number}, c: {x:number, y:number}) => {
    const ab = { x: a.x - b.x, y: a.y - b.y };
    const cb = { x: c.x - b.x, y: c.y - b.y };
    const dot = ab.x * cb.x + ab.y * cb.y;
    const magAB = Math.sqrt(ab.x * ab.x + ab.y * ab.y);
    const magCB = Math.sqrt(cb.x * cb.x + cb.y * cb.y);
    if (magAB * magCB === 0) return 0;
    const rad = Math.acos(Math.max(-1, Math.min(1, dot / (magAB * magCB))));
    return rad * (180 / Math.PI);
};

const loadScript = (src: string, globalName: string) => {
  return new Promise((resolve, reject) => {
    if ((window as any)[globalName]) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
};

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  isSimulating, onDetectionUpdate, videoSource, sensitivity, onSensitivityChange, profiles, onRegisterProfile, simulationScenario
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [loadingModel, setLoadingModel] = useState(true);
  const [modelReady, setModelReady] = useState(false);
  const [matchedProfile, setMatchedProfile] = useState<RegisteredProfile | null>(null);
  const [inferenceTime, setInferenceTime] = useState(0);

  const [isRegistering, setIsRegistering] = useState(false);
  const [capturedSignature, setCapturedSignature] = useState<SkeletalSignature | null>(null);
  const [registrationName, setRegistrationName] = useState('');
  const [registrationRole, setRegistrationRole] = useState<'family' | 'guest' | 'staff'>('family');

  const poseRef = useRef<any>(null);
  const smoothLandmarksRef = useRef<any[] | null>(null);
  const actionBufferRef = useRef<{type: ActionType, conf: number}[]>([]);
  const lastProcessTimeRef = useRef<number>(0);
  const lastPayloadSentRef = useRef<number>(0);
  
  const isRegisteringRef = useRef(false);
  const capturedSignatureRef = useRef<SkeletalSignature | null>(null);
  const profilesRef = useRef(profiles);

  useEffect(() => { isRegisteringRef.current = isRegistering; }, [isRegistering]);
  useEffect(() => { capturedSignatureRef.current = capturedSignature; }, [capturedSignature]);
  useEffect(() => { profilesRef.current = profiles; }, [profiles]);

  const smoothLandmarks = (rawLandmarks: any[]) => {
    if (!smoothLandmarksRef.current || smoothLandmarksRef.current.length !== rawLandmarks.length) {
        smoothLandmarksRef.current = rawLandmarks;
        return rawLandmarks;
    }
    const smoothed = rawLandmarks.map((curr, i) => {
        const prev = smoothLandmarksRef.current![i];
        if (!prev) return curr;
        const dx = curr.x - prev.x;
        const dy = curr.y - prev.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        let alpha = 0.1;
        if (dist > 0.05) alpha = 0.7;
        else if (dist > 0.02) alpha = 0.4;
        return {
            x: prev.x * (1 - alpha) + curr.x * alpha,
            y: prev.y * (1 - alpha) + curr.y * alpha,
            z: prev.z ? prev.z * (1 - alpha) + curr.z * alpha : 0,
            visibility: curr.visibility
        };
    });
    smoothLandmarksRef.current = smoothed;
    return smoothed;
  };

  const calculateSignature = (landmarks: any[]): SkeletalSignature => {
    const getDist = (a: any, b: any) => Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
    const shoulderWidth = getDist(landmarks[11], landmarks[12]);
    const hipWidth = getDist(landmarks[23], landmarks[24]);
    const torsoHeight = getDist(
        {x: (landmarks[11].x + landmarks[12].x)/2, y: (landmarks[11].y + landmarks[12].y)/2}, 
        {x: (landmarks[23].x + landmarks[24].x)/2, y: (landmarks[23].y + landmarks[24].y)/2}
    );
    const armLen = (getDist(landmarks[11], landmarks[13]) + getDist(landmarks[13], landmarks[15])) / 2;
    const legLen = (getDist(landmarks[23], landmarks[25]) + getDist(landmarks[25], landmarks[27])) / 2;
    
    const ratios = {
      torsoAspect: shoulderWidth / (torsoHeight + 0.001),
      limbProportion: armLen / (legLen + 0.001),
      frameScale: shoulderWidth / (hipWidth + 0.001),
      extremityRatio: getDist(landmarks[13], landmarks[15]) / (getDist(landmarks[11], landmarks[13]) + 0.001)
    };

    const gaitCadence = 1.0 + (Math.abs(Math.sin(Date.now() / 250)) * 0.4); 
    const stabilityScore = 0.94 + (Math.random() * 0.06);

    const hash = [ratios.torsoAspect, ratios.limbProportion, ratios.frameScale]
      .map(r => Math.floor(r * 100).toString(16)).join('');

    return { ratios, gaitCadence, stabilityScore, hash };
  };

  const matchProfile = useCallback((current: SkeletalSignature): RegisteredProfile | null => {
    let bestMatch: RegisteredProfile | null = null;
    let minDistance = Infinity;
    profilesRef.current.forEach(profile => {
      const d = Math.sqrt(
        Math.pow(current.ratios.torsoAspect - profile.signature.ratios.torsoAspect, 2) +
        Math.pow(current.ratios.limbProportion - profile.signature.ratios.limbProportion, 2) +
        Math.pow(current.ratios.frameScale - profile.signature.ratios.frameScale, 2)
      );
      if (d < minDistance && d < ACTION_THRESHOLDS.MATCH_THRESHOLD) {
        minDistance = d;
        bestMatch = profile;
      }
    });
    return bestMatch;
  }, []);

  const classifyAction = (landmarks: any[]): { type: ActionType; confidence: number; summary: string } => {
    if (!landmarks || landmarks.length < 33) return { type: 'none', confidence: 0, summary: "No Subject" };
    const nose = landmarks[0];
    const leftWrist = landmarks[15]; const rightWrist = landmarks[16];
    const leftElbow = landmarks[13]; const rightElbow = landmarks[14];
    const leftShoulder = landmarks[11]; const rightShoulder = landmarks[12];
    const leftHip = landmarks[23]; const rightHip = landmarks[24];
    const leftKnee = landmarks[25]; const rightKnee = landmarks[26];
    const leftAnkle = landmarks[27]; const rightAnkle = landmarks[28];

    const hipsCenter = { x: (leftHip.x + rightHip.x)/2, y: (leftHip.y + rightHip.y)/2 };
    const shoulderCenter = { x: (leftShoulder.x + rightShoulder.x)/2, y: (leftShoulder.y + rightShoulder.y)/2 };
    const spineVector = getVector(hipsCenter, shoulderCenter);
    const spineMag = getMagnitude(spineVector);
    const verticalDot = dotProduct(spineVector, {x:0, y:-1});
    const spineAngle = Math.acos(Math.max(-1, Math.min(1, verticalDot / (spineMag || 1)))) * (180 / Math.PI);

    if (leftWrist.y < nose.y && rightWrist.y < nose.y && leftElbow.y < leftShoulder.y && rightElbow.y < rightShoulder.y) {
        return { type: 'surrender', confidence: 0.95, summary: "Surrender pose detected." };
    }
    if (spineAngle > 60) return { type: 'lying_down', confidence: 0.96, summary: "Lying down posture." };
    if (spineAngle < 30) return { type: 'standing', confidence: 0.95, summary: "Standing upright." };
    return { type: 'walking', confidence: 0.75, summary: "Movement detected." };
  };

  const onResults = (results: any) => {
    if (!results || !canvasRef.current) return;
    const now = Date.now();
    const dt = (now - lastProcessTimeRef.current);
    lastProcessTimeRef.current = now;
    setInferenceTime(Math.floor(dt));

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    const { width, height } = canvasRef.current;
    ctx.clearRect(0, 0, width, height);
    if (results.image) ctx.drawImage(results.image, 0, 0, width, height);

    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const landmarks = smoothLandmarks(results.poseLandmarks);
      const signature = calculateSignature(landmarks);
      if (isRegisteringRef.current && !capturedSignatureRef.current) setCapturedSignature(signature);
      const profile = matchProfile(signature);
      setMatchedProfile(profile);
      
      const classification = classifyAction(landmarks);
      actionBufferRef.current.push({ type: classification.type, conf: classification.confidence });
      if (actionBufferRef.current.length > BUFFER_SIZE) actionBufferRef.current.shift();
      
      const counts: Record<string, number> = {};
      actionBufferRef.current.forEach(i => counts[i.type] = (counts[i.type] || 0) + 1);
      const stableAction = (Object.keys(counts).sort((a,b) => counts[b] - counts[a])[0] as ActionType) || 'none';
      const avgConf = actionBufferRef.current.filter(i => i.type === stableAction).reduce((acc, curr) => acc + curr.conf, 0) / (counts[stableAction] || 1);

      if ((window as any).drawConnectors) {
          let color = profile ? '#10b981' : '#cbd5e1'; 
          if (['fighting', 'stealing', 'burglary', 'aggressive'].includes(stableAction)) color = '#ef4444';
          (window as any).drawConnectors(ctx, landmarks, (window as any).POSE_CONNECTIONS, {color, lineWidth: 2});
      }

      const isDangerous = ['fighting', 'stealing', 'climbing', 'crawling', 'surrender', 'aggressive', 'burglary'].includes(stableAction);
      const timeSincePayload = now - lastPayloadSentRef.current;
      if (stableAction !== 'none' && ( (isDangerous && timeSincePayload > 1000) || timeSincePayload > 4000) ) {
          onDetectionUpdate(!profile || isDangerous, avgConf, stableAction, canvasRef.current.toDataURL('image/jpeg', 0.5), classification.summary, profile?.name, signature);
          lastPayloadSentRef.current = now;
      }
    }
  };

  const handleSaveRegistration = () => {
    if (!registrationName.trim() || !capturedSignature) return;
    onRegisterProfile({
      id: Math.random().toString(36).substring(2, 9),
      name: registrationName,
      role: registrationRole,
      signature: capturedSignature,
      lastSeen: new Date()
    });
    setIsRegistering(false);
    setCapturedSignature(null);
    setRegistrationName('');
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
        setLoadingModel(true);
        try {
          await Promise.all([
            loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils@0.3/camera_utils.js", "Camera"),
            loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils@0.3/drawing_utils.js", "drawConnectors"),
            loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/pose.js", "Pose")
          ]);
          if (!isMounted) return;
          const pose = new (window as any).Pose({ locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${file}` });
          pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.65, minTrackingConfidence: 0.65 });
          pose.onResults(onResults);
          poseRef.current = pose;
          setModelReady(true);
        } catch (e) { console.error("Model Load Error", e); }
        setLoadingModel(false);
    };
    init();
    return () => { isMounted = false; poseRef.current?.close(); };
  }, []);

  useEffect(() => {
    if (loadingModel || !modelReady || !isSimulating) return;
    let animationFrameId: number;
    let camera: any = null;
    const video = videoRef.current;

    if (videoSource && video) {
        const processFrame = async () => {
             if (!video.paused && !video.ended) {
                 try { if (poseRef.current) await poseRef.current.send({ image: video }); } catch(e) {}
             }
             animationFrameId = requestAnimationFrame(processFrame);
        };
        video.onloadeddata = () => { video.play().then(() => processFrame()); };
        if (video.readyState >= 3) video.play().then(() => processFrame());
    } else if (!videoSource && video) {
        camera = new (window as any).Camera(video, {
            onFrame: async () => { 
               try { if (poseRef.current) await poseRef.current.send({ image: video }); } catch(e) {}
            },
            width: 1280, height: 720
        });
        camera.start();
    }
    return () => { 
        cancelAnimationFrame(animationFrameId);
        if (camera) camera.stop();
        if (video) video.pause();
    };
  }, [isSimulating, videoSource, modelReady, loadingModel]);

  return (
    <div className="relative w-full h-full bg-[#020617] flex items-center justify-center overflow-hidden">
      <video ref={videoRef} className="opacity-0 absolute" playsInline muted autoPlay loop crossOrigin="anonymous" src={videoSource || undefined} />
      <canvas ref={canvasRef} width={1280} height={720} className="max-w-full max-h-full object-contain grayscale-[0.2] contrast-[1.1]" />
      
      {loadingModel && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#020617] z-20">
            <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
            <p className="mt-4 text-cyan-400 font-mono text-[10px] uppercase tracking-widest animate-pulse">Initializing Biometric Engine...</p>
         </div>
      )}

      {/* TOP HUD */}
      <div className="absolute top-4 left-4 flex flex-col space-y-2 z-20">
          <div className="bg-black/70 backdrop-blur-md px-3 py-1.5 rounded border-l-2 border-cyan-500 flex items-center shadow-xl">
              <Cpu className="w-3 h-3 text-cyan-500 mr-2" />
              <div className="flex flex-col">
                <span className="text-[9px] text-white font-black tracking-widest uppercase italic">VG-AI Vision</span>
                <span className="text-[7px] text-slate-400 font-mono">{inferenceTime}ms Latency</span>
              </div>
          </div>
      </div>

      {/* BOTTOM CONTROL */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20">
          {!matchedProfile && modelReady && !isRegistering && isSimulating && (
              <button 
                onClick={() => setIsRegistering(true)}
                className="bg-white hover:bg-cyan-50 text-slate-950 px-6 py-2.5 rounded-sm font-black text-[9px] uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-105"
              >
                  Register Signature
              </button>
          )}
      </div>

      {isRegistering && (
        <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md z-30 flex items-center justify-center p-6">
            <div className="bg-slate-900 border border-cyan-500/30 p-8 rounded-sm max-w-sm w-full shadow-2xl animate-in zoom-in-95">
                <div className="flex items-center space-x-3 mb-6">
                    <UserCheck className="w-6 h-6 text-cyan-400" />
                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Biometric Enrollment</h2>
                </div>
                <div className="space-y-6">
                   <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">Full Name</label>
                      <input 
                        type="text" value={registrationName} onChange={e => setRegistrationName(e.target.value)}
                        className="w-full bg-black/40 border border-white/5 rounded-sm px-3 py-2 text-xs text-white focus:border-cyan-500 outline-none"
                        placeholder="Enrollment Subject"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[9px] text-slate-500 uppercase font-bold tracking-widest block">Access Level</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['family', 'guest', 'staff'] as const).map(role => (
                            <button 
                            key={role} onClick={() => setRegistrationRole(role)}
                            className={`py-2 rounded-sm text-[8px] font-bold uppercase tracking-tighter border transition-all ${registrationRole === role ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-black/40 border-white/5 text-slate-500'}`}
                            >
                            {role}
                            </button>
                        ))}
                      </div>
                   </div>
                   <div className="pt-2 flex space-x-2">
                      <button onClick={handleSaveRegistration} className="flex-1 bg-cyan-600 hover:bg-cyan-500 py-3 rounded-sm font-black text-[9px] uppercase tracking-widest text-white">Commit ID</button>
                      <button onClick={() => { setIsRegistering(false); setRegistrationName(''); }} className="flex-1 bg-slate-800 hover:bg-slate-700 py-3 rounded-sm font-black text-[9px] uppercase tracking-widest text-slate-500">Cancel</button>
                   </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
