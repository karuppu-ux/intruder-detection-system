
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Play, Pause, ShieldCheck, Activity, Globe, Menu, Search, Sliders, Fingerprint, UserCheck, AlertTriangle, Plus, Terminal, Eye, EyeOff, ShieldAlert, Zap, Upload, Video, XCircle, Trash2, Edit2, Check, X, Settings2, ShieldQuestion } from 'lucide-react';
import { VideoFeed } from './VideoFeed';
import { SystemAnalyst } from './SystemAnalyst';
import { GeminiAnalyst } from './GeminiAnalyst';
import { AlertPanel } from './AlertPanel';
import { DetectionEvent, SecurityStatus, ZoneRect, SimulationScenario, ActionType, AIAnalysis, ChatMessage, SkeletalSignature, RegisteredProfile } from '../types';
import { INITIAL_STATS, MOCK_PROFILES } from '../constants';
import { GoogleGenAI, Type } from "@google/genai";

export const Dashboard: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState<SecurityStatus>(SecurityStatus.SAFE);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [profiles, setProfiles] = useState<RegisteredProfile[]>(MOCK_PROFILES);
  
  const [currentAction, setCurrentAction] = useState<ActionType>('none');
  const [currentConfidence, setCurrentConfidence] = useState(0);
  const [skeletalSignature, setSkeletalSignature] = useState<SkeletalSignature | null>(null);
  const [matchedIdentity, setMatchedIdentity] = useState<string | undefined>(undefined);

  const [sensitivity, setSensitivity] = useState(10);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showLogs, setShowLogs] = useState(true);
  const [simulationScenario, setSimulationScenario] = useState<SimulationScenario>('none');
  const [videoSourceUrl, setVideoSourceUrl] = useState<string | null>(null);

  const [activeAnalyst, setActiveAnalyst] = useState<'local' | 'gemini'>('local');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastUpdateRef = useRef<number>(0);
  const lastAnalysisTimeRef = useRef<number>(0);

  const matchedProfile = useMemo(() => {
    return profiles.find(p => p.name === matchedIdentity) || null;
  }, [profiles, matchedIdentity]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (videoSourceUrl) URL.revokeObjectURL(videoSourceUrl);
      const url = URL.createObjectURL(file);
      setVideoSourceUrl(url);
      setIsMonitoring(true);
      setSimulationScenario('none');
    }
  };

  const clearVideoSource = () => {
    if (videoSourceUrl) URL.revokeObjectURL(videoSourceUrl);
    setVideoSourceUrl(null);
    setIsMonitoring(false);
  };

  const performAIAnalysis = async (action: string, identity: string | undefined, confidence: number, summary: string) => {
    const now = Date.now();
    if (now - lastAnalysisTimeRef.current < 20000) return;
    lastAnalysisTimeRef.current = now;

    setIsAnalyzing(true);
    setActiveAnalyst('gemini');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `URGENT SECURITY NOTIFICATION: Suspicious activity "${action}" by ${identity || 'UNKNOWN PERSON'}. What happened: ${summary}. Provide riskScore (0-100), summary, and recommendation in JSON.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        config: { 
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              riskScore: { type: Type.NUMBER },
              summary: { type: Type.STRING },
              recommendation: { type: Type.STRING }
            },
            required: ['riskScore', 'summary', 'recommendation']
          }
        }
      });
      const result = JSON.parse(response.text || '{}');
      setAnalysis(result);
      setChatHistory(prev => [...prev, { role: 'model', text: `SECURITY UPDATE: ${result.summary}` }]);
    } catch (err) { console.error("AI Analysis failed:", err); } finally { setIsAnalyzing(false); }
  };

  const handleDetectionUpdate = useCallback(async (isSuspicious: boolean, confidence: number, actionType: string, snapshot?: string, localSummary?: string, matchedId?: string, signature?: SkeletalSignature) => {
    const now = Date.now();
    setCurrentAction(actionType as ActionType);
    setCurrentConfidence(confidence);
    setMatchedIdentity(matchedId);
    if (signature) setSkeletalSignature(signature);
    
    const isMajorThreat = ['fighting', 'stealing', 'burglary', 'climbing', 'concealment'].includes(actionType);
    const newStatus = (isSuspicious && isMajorThreat) ? SecurityStatus.DANGER : SecurityStatus.SAFE;
    if (newStatus !== status) setStatus(newStatus);

    if (now - lastUpdateRef.current < 400) return;
    lastUpdateRef.current = now;

    if (actionType === 'none') return;

    if (isSuspicious && isMonitoring) {
        if (confidence > 0.85) performAIAnalysis(actionType, matchedId, confidence, localSummary || '');
        setEvents(prev => {
            const lastEvent = prev[0];
            if (lastEvent && (now - lastEvent.timestamp.getTime()) < 5000) return prev; 
            return [{
                id: now.toString(),
                timestamp: new Date(),
                type: actionType as any,
                confidence: confidence,
                status: isMajorThreat ? SecurityStatus.DANGER : SecurityStatus.SAFE,
                message: matchedId ? `${matchedId} - Activity: ${actionType}` : `Unauthorized Person: ${actionType}`,
                thumbnail: snapshot,
                aiSummary: localSummary,
                matchedIdentity: matchedId
            }, ...prev].slice(0, 50);
        });
        setStats(s => ({ ...s, totalAlerts: s.totalAlerts + 1 }));
    }
  }, [isMonitoring, status]);

  const handleRegisterProfile = useCallback((profile: RegisteredProfile) => {
    setProfiles(prev => [...prev, profile]);
  }, []);

  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = { role: 'user', text };
    const updatedHistory = [...chatHistory, userMsg];
    setChatHistory(updatedHistory);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: updatedHistory.map(m => ({ role: m.role, parts: [{ text: m.text }] })),
      });
      if (response.text) setChatHistory(prev => [...prev, { role: 'model', text: response.text! }]);
    } catch (err) { setChatHistory(prev => [...prev, { role: 'model', text: "Service unavailable." }]); }
  };

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-slate-200 overflow-hidden font-sans relative">
      {status === SecurityStatus.DANGER && isMonitoring && (
        <div className="absolute inset-0 pointer-events-none z-40 border-[8px] border-red-600/10 animate-pulse"></div>
      )}

      <header className="h-14 bg-slate-950 border-b border-white/5 flex items-center justify-between px-6 shrink-0 z-30 shadow-xl">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 hover:text-white transition-colors">
            <Menu className="w-4 h-4" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded-sm">
              <ShieldCheck className="w-4 h-4 text-slate-950" />
            </div>
            <h1 className="font-black text-[10px] text-white tracking-[0.3em] uppercase italic">VisionGuard <span className="text-cyan-500 not-italic">AI</span></h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setShowLogs(!showLogs)} 
            className={`flex items-center space-x-2 px-3 py-1.5 rounded-sm text-[9px] font-bold uppercase tracking-widest transition-all border ${showLogs ? 'bg-slate-800 border-white/5 text-slate-400' : 'bg-cyan-600 border-cyan-400 text-white'}`}
          >
            {showLogs ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            <span>History</span>
          </button>

          <button onClick={() => setIsMonitoring(!isMonitoring)} className={`px-5 py-2 rounded-sm font-black text-[9px] transition-all uppercase tracking-[0.2em] border ${isMonitoring ? 'bg-red-600 border-red-500 text-white shadow-lg' : 'bg-cyan-600 border-cyan-500 text-white shadow-xl shadow-cyan-900/10'}`}>
            {isMonitoring ? 'Secure Stop' : 'Initiate Guard'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden relative z-10">
        <div className={`${sidebarOpen ? 'w-64' : 'w-0'} bg-black/60 border-r border-white/5 flex flex-col transition-all duration-300 overflow-hidden`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-8 custom-scrollbar">
                <div className="space-y-3">
                    <h3 className="text-[9px] font-black text-cyan-500 uppercase tracking-widest px-1">Source Logic</h3>
                    <div className="bg-slate-900/50 rounded-sm border border-white/5 p-3 space-y-3">
                        {!videoSourceUrl ? (
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex flex-col items-center justify-center p-6 border border-dashed border-white/5 rounded-sm hover:bg-white/5 transition-all group"
                          >
                            <Upload className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 mb-2" />
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Load Video</span>
                            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileUpload} />
                          </button>
                        ) : (
                          <div className="flex items-center justify-between p-2 bg-cyan-500/5 border border-cyan-500/10 rounded-sm">
                             <div className="flex items-center space-x-2 overflow-hidden">
                               <Video className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                               <span className="text-[9px] text-cyan-100 font-mono truncate">FILE_BUFFER</span>
                             </div>
                             <button onClick={clearVideoSource} className="text-slate-600 hover:text-red-400"><XCircle className="w-3.5 h-3.5" /></button>
                          </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[9px] font-black text-cyan-500 uppercase tracking-widest px-1">Registry</h3>
                    <div className="bg-slate-900/50 rounded-sm border border-white/5 p-1 space-y-1">
                        {profiles.map(p => (
                          <div key={p.id} className="bg-black/30 border border-white/5 rounded-sm p-2 flex items-center justify-between group">
                             <div className="flex items-center space-x-2">
                                <div className={`w-1 h-1 rounded-full ${p.role === 'family' ? 'bg-cyan-400' : 'bg-purple-500'}`}></div>
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tighter">{p.name}</span>
                             </div>
                             <span className="text-[8px] font-mono text-slate-600 group-hover:text-cyan-500">#{p.signature.hash.substring(0,4)}</span>
                          </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <h3 className="text-[9px] font-black text-cyan-500 uppercase tracking-widest px-1">Simulation</h3>
                    <div className="grid grid-cols-1 gap-1">
                        {['none', 'walking', 'crawling', 'fighting'].map(scen => (
                            <button key={scen} onClick={() => { setSimulationScenario(scen as any); setIsMonitoring(true); setVideoSourceUrl(null); }} className={`w-full text-left px-3 py-2 rounded-sm text-[9px] font-bold transition-all border ${simulationScenario === scen ? 'bg-white border-white text-slate-950' : 'border-transparent text-slate-600 hover:bg-white/5'}`}>
                                {scen === 'none' ? 'LIVE FEED' : scen.toUpperCase()}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 p-4 relative bg-black/20">
                 <div className="w-full h-full bg-black overflow-hidden shadow-inner border border-white/5 relative rounded-sm">
                     <VideoFeed 
                        status={status} isSimulating={isMonitoring} 
                        onDetectionUpdate={handleDetectionUpdate}
                        videoSource={videoSourceUrl} 
                        sensitivity={sensitivity}
                        onSensitivityChange={setSensitivity}
                        simulationScenario={simulationScenario}
                        profiles={profiles}
                        onRegisterProfile={handleRegisterProfile}
                     />
                 </div>
                 
                 {isMonitoring && (
                   <div className="absolute top-8 left-1/2 -translate-x-1/2 flex space-x-4 pointer-events-none">
                      <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-sm border border-white/10 flex flex-col items-center">
                         <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Subject ID</span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${matchedIdentity ? 'text-emerald-400' : 'text-amber-500 animate-pulse'}`}>
                             {matchedIdentity || 'Resolving...'}
                         </span>
                      </div>
                      <div className="bg-black/80 backdrop-blur-md px-4 py-2 rounded-sm border border-white/10 flex flex-col items-center">
                         <span className="text-[8px] text-slate-500 uppercase font-black tracking-widest mb-1">Dynamic Action</span>
                         <span className={`text-[10px] font-black uppercase tracking-widest ${status === SecurityStatus.DANGER ? 'text-red-500' : 'text-cyan-500'}`}>
                           {currentAction === 'none' ? 'IDLE' : currentAction.toUpperCase()}
                         </span>
                      </div>
                   </div>
                 )}
            </div>
            
            {showLogs && (
              <div className="h-64 border-t border-white/5 shrink-0 bg-black/40 backdrop-blur-xl transition-all duration-300">
                  <AlertPanel events={events} onDismiss={() => {}} onForensicSearch={() => {}} isSearching={false} />
              </div>
            )}
        </div>

        <div className="w-72 flex flex-col shrink-0 z-20 bg-slate-950 shadow-2xl">
            <div className="flex border-b border-white/5 shrink-0">
              <button onClick={() => setActiveAnalyst('local')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeAnalyst === 'local' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-600'}`}>Analyst</button>
              <button onClick={() => setActiveAnalyst('gemini')} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all ${activeAnalyst === 'gemini' ? 'text-cyan-400 border-b-2 border-cyan-500' : 'text-slate-600'}`}>Gemini</button>
            </div>
            <div className="flex-1 overflow-hidden">
              {activeAnalyst === 'local' ? (
                <SystemAnalyst 
                  currentAction={currentAction} 
                  confidence={currentConfidence} 
                  status={status} 
                  inferenceTime={0} 
                  signature={skeletalSignature} 
                  matchedIdentity={matchedIdentity}
                  matchedProfile={matchedProfile}
                />
              ) : (
                <GeminiAnalyst analysis={analysis} isAnalyzing={isAnalyzing} chatHistory={chatHistory} onSendMessage={handleSendMessage} isGeneratingSpeech={false} />
              )}
            </div>
        </div>
      </main>
    </div>
  );
};
