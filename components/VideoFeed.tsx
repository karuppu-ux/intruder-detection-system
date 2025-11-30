import React, { useEffect, useRef, useState } from 'react';
import { Camera, RefreshCw, AlertTriangle, Video, Lock, Play, Pause, Square, Cuboid, Globe, Scan, EyeOff, MousePointer2, Flame, Maximize2, Minimize2, Radio } from 'lucide-react';
import { SecurityStatus, ZoneRect } from '../types';

interface VideoFeedProps {
  status: SecurityStatus;
  isSimulating: boolean;
  onDetectionUpdate: (isSuspicious: boolean, confidence: number, actionType: string, snapshot?: string) => void;
  videoSource: string | null;
  onTogglePlay?: () => void;
  onStop?: () => void;
  onError?: (error: string) => void;

  // Smart Props
  zoneRect: ZoneRect | null;
  isDrawing: boolean;
  onZoneChange: (rect: ZoneRect | null) => void;
  onDrawingChange: (isDrawing: boolean) => void;
  privacyMode: boolean;
  onPrivacyChange: (active: boolean) => void;
  
  // Interactive Tuning Props
  confidenceThreshold: number;
  sensitivity: number;
  showHeatmap: boolean;
  onToggleHeatmap: (active: boolean) => void;
  isFocused: boolean;
  onToggleFocus: () => void;
}

declare global {
  interface Window {
    Pose: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    POSE_CONNECTIONS: any;
  }
}

// Helper to load scripts dynamically with robust checking
const loadScript = (src: string, globalName: string) => {
  return new Promise((resolve, reject) => {
    if (window[globalName as keyof Window]) {
      resolve(true);
      return;
    }
    const existingScript = document.querySelector(`script[src="${src}"]`);
    if (existingScript) {
      let retries = 0;
      const checkGlobal = setInterval(() => {
        if (window[globalName as keyof Window]) {
          clearInterval(checkGlobal);
          resolve(true);
        }
        retries++;
        if (retries > 50) { 
          clearInterval(checkGlobal);
          resolve(true); 
        }
      }, 100);
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = "anonymous";
    script.onload = () => resolve(true);
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.body.appendChild(script);
  });
};

export const VideoFeed: React.FC<VideoFeedProps> = ({ 
  status, 
  isSimulating, 
  onDetectionUpdate, 
  videoSource,
  onTogglePlay,
  onStop,
  onError,
  zoneRect,
  isDrawing,
  onZoneChange,
  onDrawingChange,
  privacyMode,
  onPrivacyChange,
  confidenceThreshold,
  sensitivity,
  showHeatmap,
  onToggleHeatmap,
  isFocused,
  onToggleFocus
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas3DRef = useRef<HTMLCanvasElement>(null);
  const heatmapRef = useRef<HTMLCanvasElement>(null);
  
  const [loadingModel, setLoadingModel] = useState(false);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 640, height: 480 });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [show3D, setShow3D] = useState(false);
  
  const drawingStartRef = useRef<{x: number, y: number} | null>(null);
  const consecutiveFramesRef = useRef(0);
  const onDetectionUpdateRef = useRef(onDetectionUpdate);
  const lastSnapshotTimeRef = useRef(0);
  
  const zoneRectRef = useRef(zoneRect);
  const privacyModeRef = useRef(privacyMode);
  const confidenceRef = useRef(confidenceThreshold);
  const sensitivityRef = useRef(sensitivity);
  const showHeatmapRef = useRef(showHeatmap);

  useEffect(() => {
    onDetectionUpdateRef.current = onDetectionUpdate;
  }, [onDetectionUpdate]);

  useEffect(() => {
    zoneRectRef.current = zoneRect;
    privacyModeRef.current = privacyMode;
    confidenceRef.current = confidenceThreshold;
    sensitivityRef.current = sensitivity;
    showHeatmapRef.current = showHeatmap;
  }, [zoneRect, privacyMode, confidenceThreshold, sensitivity, showHeatmap]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    drawingStartRef.current = { x, y };
    onZoneChange({ x, y, w: 0, h: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !drawingStartRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const currentX = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const currentY = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    
    onZoneChange({
        x: Math.min(drawingStartRef.current.x, currentX),
        y: Math.min(drawingStartRef.current.y, currentY),
        w: Math.abs(currentX - drawingStartRef.current.x),
        h: Math.abs(currentY - drawingStartRef.current.y)
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    drawingStartRef.current = null;
    onDrawingChange(false); 
  };

  useEffect(() => {
    let camera: any = null;
    let pose: any = null;
    let animationFrameId: number;
    let isMounted = true;

    setPermissionDenied(false);
    setErrorMsg(null);
    consecutiveFramesRef.current = 0;

    const startProcessing = async () => {
        setLoadingModel(true);
        try {
          await Promise.all([
            loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js", "Camera"),
            loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js", "drawConnectors"),
            loadScript("https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js", "Pose")
          ]);

          let attempts = 0;
          while ((!window.Pose || !window.Camera) && attempts < 20) {
             await new Promise(resolve => setTimeout(resolve, 200));
             attempts++;
          }

          if (!window.Pose) throw new Error("MediaPipe libraries failed to initialize.");

          pose = new window.Pose({
            locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
          });

          pose.setOptions({
            modelComplexity: 1,
            smoothLandmarks: true,
            enableSegmentation: false,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
          });

          pose.onResults((results: any) => onResults(results));

          if (videoSource) {
              const videoElement = videoRef.current;
              if (videoElement) {
                  if (videoElement.srcObject) {
                      const stream = videoElement.srcObject as MediaStream;
                      stream.getTracks().forEach(track => track.stop());
                      videoElement.srcObject = null;
                  }

                  videoElement.removeAttribute('src');
                  if (videoSource.startsWith('http')) {
                      videoElement.setAttribute('crossOrigin', 'anonymous');
                  } else {
                      videoElement.removeAttribute('crossOrigin');
                  }
                  
                  videoElement.load();
                  videoElement.src = videoSource;
                  videoElement.loop = true;
                  videoElement.muted = true;
                  videoElement.load();
                  
                  await new Promise((resolve, reject) => {
                      if (videoElement.readyState >= 1) { resolve(true); return; }
                      const timeout = setTimeout(() => { cleanup(); reject(new Error("Video load timeout.")); }, 10000);
                      const onLoaded = () => { cleanup(); resolve(true); };
                      const onError = (e: Event) => {
                          cleanup();
                          let msg = "Failed to load video.";
                          const err = (e.target as HTMLVideoElement).error;
                          if (err?.code === 3) msg = "Video decoding failed.";
                          if (err?.code === 4) msg = "Video format not supported.";
                          reject(new Error(msg));
                      };
                      const cleanup = () => {
                          clearTimeout(timeout);
                          videoElement.removeEventListener('loadedmetadata', onLoaded);
                          videoElement.removeEventListener('error', onError);
                      };
                      videoElement.addEventListener('loadedmetadata', onLoaded);
                      videoElement.addEventListener('error', onError);
                  });

                  if (!isMounted) return;
                  setDimensions({ width: videoElement.videoWidth || 640, height: videoElement.videoHeight || 480 });

                  if (isSimulating) {
                    videoElement.play().catch(console.error);
                    const processVideoFrame = async () => {
                        if (!isMounted) return;
                        if (videoElement.paused || videoElement.ended) {
                            animationFrameId = requestAnimationFrame(processVideoFrame);
                            return;
                        }
                        if (videoElement.readyState >= 2) {
                            const startTime = performance.now();
                            try {
                                await pose.send({image: videoElement});
                                const endTime = performance.now();
                                if (isMounted) setInferenceTime(Math.round(endTime - startTime));
                            } catch (e) { console.warn("Frame processing error:", e); }
                        }
                        animationFrameId = requestAnimationFrame(processVideoFrame);
                    };
                    processVideoFrame();
                  } else {
                      videoElement.pause();
                  }
              }
          } 
          else if (isSimulating) {
            if (videoRef.current) {
              if (videoRef.current.src) {
                  videoRef.current.pause();
                  videoRef.current.removeAttribute('src');
                  videoRef.current.removeAttribute('crossOrigin');
                  videoRef.current.load();
              }
              if (videoRef.current.srcObject) {
                  const stream = videoRef.current.srcObject as MediaStream;
                  stream.getTracks().forEach(track => track.stop());
                  videoRef.current.srcObject = null;
              }

              setDimensions({ width: 640, height: 480 });

              camera = new window.Camera(videoRef.current, {
                onFrame: async () => {
                  if (!isMounted) return;
                  const startTime = performance.now();
                  await pose.send({image: videoRef.current});
                  const endTime = performance.now();
                  if (isMounted) setInferenceTime(Math.round(endTime - startTime));
                },
                width: 640,
                height: 480
              });
              await camera.start();
            }
          }
          if (isMounted) setLoadingModel(false);
        } catch (error: any) {
          console.error("Pipeline Error:", error);
          if (isMounted) {
            setLoadingModel(false);
            if (error.name === 'NotAllowedError' || error.message?.includes('Permission denied')) {
                setPermissionDenied(true);
            } else {
                const msg = error.message || "An unknown error occurred";
                setErrorMsg(msg);
                if (onError) onError(msg);
            }
          }
        }
    };

    if (isSimulating || videoSource) startProcessing();
    else if (isMounted) setLoadingModel(false);

    return () => {
       isMounted = false;
       if (camera) camera.stop();
       if (pose) pose.close();
       cancelAnimationFrame(animationFrameId);
       if (videoRef.current) {
           videoRef.current.pause();
           if (videoRef.current.srcObject) {
               const stream = videoRef.current.srcObject as MediaStream;
               stream.getTracks().forEach(track => track.stop());
           }
       }
    };
  }, [isSimulating, videoSource]);

  const updateHeatmap = (landmarks: any[], width: number, height: number) => {
      if (!heatmapRef.current) return;
      const ctx = heatmapRef.current.getContext('2d');
      if (!ctx) return;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.fillRect(0, 0, width, height);
      
      ctx.globalCompositeOperation = 'source-over';
      const hips = [landmarks[23], landmarks[24]];
      for (const hip of hips) {
          if (hip && hip.visibility > 0.5) {
              const x = hip.x * width;
              const y = hip.y * height;
              const gradient = ctx.createRadialGradient(x, y, 5, x, y, 40);
              gradient.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
              gradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
              ctx.fillStyle = gradient;
              ctx.beginPath();
              ctx.arc(x, y, 40, 0, 2 * Math.PI);
              ctx.fill();
          }
      }
  };

  const draw3D = (worldLandmarks: any) => {
    if (!canvas3DRef.current) return;
    const ctx = canvas3DRef.current.getContext('2d');
    if (!ctx) return;
    
    const w = canvas3DRef.current.width;
    const h = canvas3DRef.current.height;
    
    ctx.fillStyle = '#0f172a'; 
    ctx.fillRect(0, 0, w, h);
    
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = -5; i <= 5; i++) {
        ctx.moveTo(0, h/2 + i * 20 + 50);
        ctx.lineTo(w, h/2 + i * 20 + 50);
    }
    ctx.stroke();

    const time = Date.now() * 0.001;
    const angle = time; 
    
    const project = (lm: any) => {
        const x = lm.x;
        const y = lm.y;
        const z = lm.z;
        const rx = x * Math.cos(angle) - z * Math.sin(angle);
        const rz = x * Math.sin(angle) + z * Math.cos(angle);
        const camDist = 2.5;
        const scale = 200 / (camDist + rz); 
        return {
            x: w/2 + rx * scale,
            y: h/2 + y * scale,
            z: rz 
        };
    };
    const projected = worldLandmarks.map(project);
    
    if (window.POSE_CONNECTIONS) {
        ctx.lineWidth = 2;
        for (const [startIdx, endIdx] of window.POSE_CONNECTIONS) {
            const p1 = projected[startIdx];
            const p2 = projected[endIdx];
            const avgZ = (p1.z + p2.z) / 2;
            const alpha = Math.max(0.2, 1 - (avgZ + 1) / 2); 
            ctx.strokeStyle = `rgba(14, 165, 233, ${alpha})`; 
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
        }
    }
    for (const p of projected) {
        const alpha = Math.max(0.2, 1 - (p.z + 1) / 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${alpha})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3 * alpha + 1, 0, 2 * Math.PI);
        ctx.fill();
    }
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px monospace';
    ctx.fillText("3D RECONSTRUCTION", 10, 20);
  };

  const onResults = (results: any) => {
    if (!canvasRef.current || !videoRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    const currentZone = zoneRectRef.current;
    const currentPrivacy = privacyModeRef.current;
    const minConf = confidenceRef.current;
    const sens = sensitivityRef.current;
    const isHeatmapActive = showHeatmapRef.current;

    ctx.save();
    ctx.clearRect(0, 0, width, height);
    ctx.drawImage(results.image, 0, 0, width, height);
    
    if (isHeatmapActive && results.poseLandmarks && heatmapRef.current) {
        updateHeatmap(results.poseLandmarks, width, height);
        ctx.globalAlpha = 0.6;
        ctx.drawImage(heatmapRef.current, 0, 0);
        ctx.globalAlpha = 1.0;
    }

    if (show3D && results.poseWorldLandmarks && canvas3DRef.current) {
        draw3D(results.poseWorldLandmarks);
    } else if (!show3D && canvas3DRef.current) {
        const ctx3d = canvas3DRef.current.getContext('2d');
        if (ctx3d) ctx3d.clearRect(0, 0, canvas3DRef.current.width, canvas3DRef.current.height);
    }

    if (currentZone) {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(currentZone.x, currentZone.y, currentZone.w, currentZone.h);
        ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
        ctx.fillRect(currentZone.x, currentZone.y, currentZone.w, currentZone.h);
        ctx.setLineDash([]);
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText("RESTRICTED ZONE", currentZone.x, currentZone.y - 5);
    }
    
    if (results.poseLandmarks && results.poseLandmarks.length > 0) {
      const landmarks = results.poseLandmarks;
      const visibilityScore = landmarks.reduce((acc: number, curr: any) => acc + curr.visibility, 0) / 33;

      if (visibilityScore >= minConf) {
          if (currentPrivacy) {
              const nose = landmarks[0];
              const leftEye = landmarks[2];
              const rightEye = landmarks[5];
              
              if (nose && nose.visibility > 0.5) {
                const faceX = nose.x * width;
                const faceY = nose.y * height;
                const eyeDist = Math.abs(leftEye.x - rightEye.x) * width;
                const blurSize = Math.max(eyeDist * 4, 60);

                ctx.filter = 'blur(15px)';
                ctx.beginPath();
                ctx.arc(faceX, faceY, blurSize / 2, 0, 2 * Math.PI);
                ctx.fillStyle = 'rgba(255,255,255,0.8)'; 
                ctx.fill();
                ctx.filter = 'none';
              }
          }

          if (window.drawConnectors && window.POSE_CONNECTIONS) {
              window.drawConnectors(ctx, landmarks, window.POSE_CONNECTIONS, {color: '#0ea5e9', lineWidth: 4});
          }
          if (window.drawLandmarks) {
              window.drawLandmarks(ctx, landmarks, {color: '#fbbf24', lineWidth: 2, radius: 4});
          }

          const nose = landmarks[0];
          const leftShoulder = landmarks[11];
          const rightShoulder = landmarks[12];
          const leftHip = landmarks[23];
          const rightHip = landmarks[24];
          const leftWrist = landmarks[15];
          const rightWrist = landmarks[16];

          let actionScore = 0; 
          
          if (leftShoulder && rightShoulder && leftHip && rightHip) {
            
            const xValues = landmarks.map((l: any) => l.x);
            const yValues = landmarks.map((l: any) => l.y);
            const minX = Math.min(...xValues) * width;
            const maxX = Math.max(...xValues) * width;
            const minY = Math.min(...yValues) * height;
            const maxY = Math.max(...yValues) * height;
            const centerX = minX + (maxX - minX) / 2;
            const centerY = minY + (maxY - minY) / 2;

            let isInsideZone = true;
            if (currentZone) {
                if (centerX < currentZone.x || centerX > currentZone.x + currentZone.w ||
                    centerY < currentZone.y || centerY > currentZone.y + currentZone.h) {
                    isInsideZone = false;
                }
            }

            const shoulderMidX = (leftShoulder.x + rightShoulder.x) / 2;
            const shoulderMidY = (leftShoulder.y + rightShoulder.y) / 2;
            const hipMidX = (leftHip.x + rightHip.x) / 2;
            const hipMidY = (leftHip.y + rightHip.y) / 2;

            const spineDx = Math.abs(shoulderMidX - hipMidX);
            const spineDy = Math.abs(shoulderMidY - hipMidY);
            const sensFactor = sens / 5;

            if (spineDx > spineDy * (0.8 / sensFactor)) {
                actionScore += 2;
            }

            const boxW = maxX - minX;
            const boxH = maxY - minY;
            const aspectRatio = boxW / boxH;

            if (aspectRatio > 0.9) actionScore += 1;
            if (aspectRatio > (1.2 / sensFactor)) actionScore += 1; 

            const hipsY = hipMidY; 
            let handsDown = false;
            if (leftWrist && leftWrist.visibility > 0.5 && leftWrist.y > hipsY) handsDown = true;
            if (rightWrist && rightWrist.visibility > 0.5 && rightWrist.y > hipsY) handsDown = true;
            
            if (handsDown) actionScore += 1;

            if (nose && nose.visibility > 0.5) {
                const headHipDistY = Math.abs(nose.y - hipMidY);
                const normalizedBoxH = (maxY - minY) / height;
                if (headHipDistY < normalizedBoxH * (0.4 * sensFactor)) { 
                    actionScore += 1; 
                }
            }

            let currentAction = 'walking';
            if (actionScore >= 2.5) {
                currentAction = 'crawling';
            }

            if (currentAction === 'crawling') {
                consecutiveFramesRef.current += 1;
            } else {
                consecutiveFramesRef.current = Math.max(0, consecutiveFramesRef.current - 1);
            }

            let finalAction = consecutiveFramesRef.current > (15 - sens) ? 'crawling' : 'walking';
            let isCrawling = finalAction === 'crawling';
            
            if (!isInsideZone && isCrawling) {
                isCrawling = false;
                finalAction = 'loitering outside zone'; 
            }

            ctx.beginPath();
            ctx.lineWidth = 3;
            ctx.strokeStyle = isCrawling ? '#f43f5e' : (isInsideZone ? '#10b981' : '#64748b'); 
            ctx.rect(minX, minY, boxW, boxH);
            ctx.stroke();

            ctx.fillStyle = isCrawling ? '#f43f5e' : (isInsideZone ? '#10b981' : '#64748b');
            ctx.fillRect(minX, minY - 30, boxW, 30);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 14px monospace';
            ctx.fillText(
              `${finalAction.toUpperCase()} ${(visibilityScore * 100).toFixed(0)}%`, 
              minX + 5, 
              minY - 10
            );

            let snapshotData: string | undefined = undefined;
            if (isCrawling && Date.now() - lastSnapshotTimeRef.current > 5000) {
                snapshotData = canvasRef.current.toDataURL('image/jpeg', 0.6);
                lastSnapshotTimeRef.current = Date.now();
            }

            if (onDetectionUpdateRef.current) {
              onDetectionUpdateRef.current(isCrawling, visibilityScore, finalAction, snapshotData);
            }
          }
      } else {
           if (onDetectionUpdateRef.current) onDetectionUpdateRef.current(false, 0, 'none');
      }
    } else {
        if (onDetectionUpdateRef.current) onDetectionUpdateRef.current(false, 0, 'none');
    }
    ctx.restore();
  };

  const handleStop = () => {
    if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
    }
    if (onStop) onStop();
  };

  const getStatusLabel = () => {
    if (videoSource) {
      return videoSource.startsWith('http') ? 'IP CAMERA' : 'FILE PLAYBACK';
    }
    return 'LIVE FEED';
  };

  return (
    <div 
        className={`relative w-full h-full bg-black rounded-lg overflow-hidden border border-white/5 shadow-2xl group ${isDrawing ? 'cursor-crosshair' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
    >
      <video ref={videoRef} className="hidden" playsInline muted></video>
      <canvas ref={heatmapRef} width={dimensions.width} height={dimensions.height} className="hidden" />
      <canvas 
        ref={canvasRef}
        width={dimensions.width} 
        height={dimensions.height}
        className={`w-full h-full object-contain bg-black ${!videoSource ? 'transform scale-x-[-1]' : ''}`} 
      />
      
      {/* 3D View Overlay */}
      {isSimulating && !loadingModel && !errorMsg && (
        <div className={`absolute bottom-4 right-4 w-48 h-48 bg-slate-900/90 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 ${show3D ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
             <div className="absolute top-2 left-2 text-[10px] text-slate-400 font-mono">SPATIAL VIEW</div>
             <canvas ref={canvas3DRef} width={192} height={192} className="w-full h-full"/>
        </div>
      )}

      {/* Standby Screen */}
      {(!isSimulating && !videoSource) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 backdrop-blur-md z-10">
           <div className="bg-slate-900/50 p-8 rounded-full mb-6 border border-white/5 relative">
             <div className="absolute inset-0 rounded-full border border-cyan-500/20 animate-ping opacity-20"></div>
             {videoSource ? <Video className="w-16 h-16 text-slate-400" /> : <Camera className="w-16 h-16 text-slate-400" />}
           </div>
           <h3 className="text-2xl font-bold text-white tracking-tight">System Standby</h3>
           <p className="text-slate-500 mt-2 font-medium">Waiting for input stream initialization...</p>
        </div>
      )}

      {/* Permission Denied Error */}
      {permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-30 p-8 text-center">
             <div className="p-4 bg-red-500/10 rounded-full mb-4"><Lock className="w-10 h-10 text-red-500" /></div>
             <h3 className="text-xl font-bold text-white mb-2">Signal Blocked</h3>
             <p className="text-slate-400 mb-6 max-w-sm">Camera access was denied. Check browser permissions or switch to file upload.</p>
             <button onClick={() => window.location.reload()} className="px-6 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white hover:bg-slate-700">Retry Connection</button>
        </div>
      )}

      {errorMsg && !permissionDenied && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/95 z-30 p-8 text-center">
             <AlertTriangle className="w-12 h-12 text-amber-500 mb-4" />
             <h3 className="text-lg font-bold text-white">Stream Error</h3>
             <p className="text-slate-400 text-sm mt-2 max-w-xs font-mono">{errorMsg}</p>
        </div>
      )}

      {loadingModel && !errorMsg && !permissionDenied && (
         <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/90 z-20 backdrop-blur-sm">
            <div className="relative">
                <RefreshCw className="w-12 h-12 text-cyan-500 animate-spin" />
                <div className="absolute inset-0 blur-md bg-cyan-500/30 animate-pulse"></div>
            </div>
            <p className="text-cyan-400 font-mono mt-4 text-sm tracking-widest uppercase">Initializing Neural Engine</p>
         </div>
      )}

      {/* Video Control Bar */}
      {videoSource && !loadingModel && !errorMsg && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center space-x-2 px-4 py-2 bg-slate-900/80 backdrop-blur-md border border-white/10 rounded-full shadow-2xl z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-y-2 group-hover:translate-y-0">
              <button onClick={onTogglePlay} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
                  {isSimulating ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
              </button>
              <button onClick={handleStop} className="p-2 hover:bg-white/10 rounded-full transition-colors text-red-400">
                  <Square className="w-5 h-5 fill-current" />
              </button>
              <div className="h-4 w-px bg-white/20 mx-2"></div>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider pr-2">
                 {isSimulating ? 'Playing' : 'Paused'}
              </span>
          </div>
      )}

      {/* OSD (On Screen Display) Overlays */}
      {isSimulating && !loadingModel && !errorMsg && (
        <>
            <div className="absolute top-4 left-4 flex items-center space-x-3 z-20 pointer-events-none">
                <div className="flex items-center space-x-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded text-white border border-white/10">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                    <span className="text-[10px] font-mono font-bold tracking-widest">{getStatusLabel()}</span>
                </div>
                {videoSource?.startsWith('http') && <Globe className="w-4 h-4 text-slate-400"/>}
            </div>

            <div className="absolute top-4 right-4 flex items-center space-x-2 z-20 pointer-events-auto">
                 <button onClick={onToggleFocus} className="bg-black/60 hover:bg-black/80 p-2 rounded text-white border border-white/10 transition-colors backdrop-blur-md">
                    {isFocused ? <Minimize2 className="w-4 h-4"/> : <Maximize2 className="w-4 h-4"/>}
                 </button>
            </div>

            <div className="absolute bottom-4 left-4 z-20 pointer-events-auto">
                <div className="flex items-center space-x-3">
                    <div className="text-[10px] font-mono text-cyan-400 bg-black/80 border border-cyan-900/50 px-3 py-1.5 rounded backdrop-blur-md shadow-lg">
                        YOLO11-POSE <span className="mx-2 text-slate-600">|</span> {inferenceTime}ms
                    </div>
                    
                    <button 
                        onClick={() => setShow3D(!show3D)}
                        className={`p-1.5 rounded border transition-colors ${show3D ? 'bg-cyan-600 border-cyan-400 text-white' : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'}`}
                        title="Toggle 3D"
                    >
                        <Cuboid className="w-4 h-4" />
                    </button>
                    
                    <button 
                        onClick={() => onToggleHeatmap(!showHeatmap)}
                        className={`p-1.5 rounded border transition-colors ${showHeatmap ? 'bg-orange-600 border-orange-400 text-white' : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'}`}
                        title="Toggle Heatmap"
                    >
                        <Flame className="w-4 h-4" />
                    </button>
                    
                    <button 
                        onClick={() => onPrivacyChange(!privacyMode)}
                        className={`p-1.5 rounded border transition-colors ${privacyMode ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-black/60 border-white/10 text-slate-400 hover:text-white'}`}
                        title="Toggle Privacy Blur"
                    >
                        <EyeOff className="w-4 h-4" />
                    </button>

                    <button 
                        onClick={() => {
                            if (zoneRect) onZoneChange(null);
                            else onDrawingChange(!isDrawing);
                        }}
                        className={`p-1.5 rounded border transition-colors ${isDrawing ? 'bg-emerald-600 border-emerald-400 text-white' : (zoneRect ? 'bg-red-900/80 border-red-500 text-red-200' : 'bg-black/60 border-white/10 text-slate-400 hover:text-white')}`}
                        title="Draw Zone"
                    >
                        <Scan className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isDrawing && !zoneRect && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/70 px-4 py-2 rounded-lg text-white text-sm font-medium border border-white/20 pointer-events-none z-30 flex items-center backdrop-blur">
                    <MousePointer2 className="w-4 h-4 mr-2" />
                    Click and drag to set perimeter
                </div>
            )}

            {status === SecurityStatus.DANGER && (
                <div className="absolute top-16 right-4 animate-in slide-in-from-right-10 duration-300 z-20">
                     <div className="bg-red-600/90 text-white font-bold px-4 py-3 rounded border border-red-400 shadow-[0_0_30px_rgba(220,38,38,0.6)] flex items-center backdrop-blur-sm">
                        <AlertTriangle className="w-6 h-6 mr-3 animate-pulse" />
                        <div>
                            <div className="text-sm leading-none">THREAT DETECTED</div>
                            <div className="text-[10px] font-mono opacity-80 font-normal mt-1">RECORDING EVENT...</div>
                        </div>
                     </div>
                </div>
            )}
        </>
      )}
    </div>
  );
};