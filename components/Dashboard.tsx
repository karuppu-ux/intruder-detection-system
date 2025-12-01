import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, AlertOctagon, ShieldCheck, Activity, Download, Upload, Smartphone, Mic, Trash2, X, FileText, Globe, Link as LinkIcon, Scan, EyeOff, Cuboid, Flame, Settings, Sliders, ChevronLeft, Menu } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { VideoFeed } from './VideoFeed';
import { AlertPanel } from './AlertPanel';
import { DetectionEvent, SecurityStatus, ZoneRect } from '../types';
import { INITIAL_STATS } from '../constants';

export const Dashboard: React.FC = () => {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [status, setStatus] = useState<SecurityStatus>(SecurityStatus.SAFE);
  const [events, setEvents] = useState<DetectionEvent[]>([]);
  const [stats, setStats] = useState(INITIAL_STATS);
  const [graphData, setGraphData] = useState<any[]>([]);
  
  // Video Source State
  const [videoFile, setVideoFile] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showIpInput, setShowIpInput] = useState(false);
  const [ipUrl, setIpUrl] = useState('');
  
  // Smart Control State
  const [zoneRect, setZoneRect] = useState<ZoneRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  // Interactive Tuning State
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.5);
  const [sensitivity, setSensitivity] = useState(5);
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    return () => {
        if (videoFile && videoFile.startsWith('blob:')) {
            URL.revokeObjectURL(videoFile);
        }
    };
  }, [videoFile]);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setShowIpInput(false);
    const file = event.target.files?.[0];
    if (file) {
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!file.type.startsWith('video/') || (!validTypes.includes(file.type) && file.type !== '')) {
         console.warn("Unknown video type:", file.type);
      }
      const url = URL.createObjectURL(file);
      setVideoFile(url);
      setIsMonitoring(true); 
      setStatus(SecurityStatus.SAFE);
    }
  };

  const handleConnectIpCam = () => {
    if (!ipUrl) {
        setUploadError("Please enter a valid URL");
        return;
    }
    setUploadError(null);
    setShowIpInput(false);
    setVideoFile(ipUrl);
    setIsMonitoring(true);
    setStatus(SecurityStatus.SAFE);
  };

  const clearVideo = () => {
    setVideoFile(null);
    setIsMonitoring(false);
    setUploadError(null);
    setShowIpInput(false);
    setIpUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleVideoError = (msg: string) => {
    setUploadError(msg);
    setIsMonitoring(false);
    setVideoFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDismissEvent = (id: string) => {
    setEvents(prev => prev.filter(event => event.id !== id));
  };

  const generateReport = () => {
    if (events.length === 0) {
        alert("No events to report.");
        return;
    }
    const headers = "Timestamp,Type,Confidence,Message\n";
    const rows = events.map(e => 
        `"${e.timestamp.toLocaleString()}","${e.type}","${(e.confidence * 100).toFixed(1)}%","${e.message}"`
    ).join("\n");
    
    const content = headers + rows;
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `security_report_${new Date().toISOString().slice(0,19).replace(/[:]/g,"-")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDetectionUpdate = useCallback((isSuspicious: boolean, confidence: number, actionType: string, snapshot?: string) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < 200) return; 
    lastUpdateRef.current = now;

    if (actionType === 'none') {
        setStatus(SecurityStatus.SAFE);
        return;
    }

    const newStatus = isSuspicious ? SecurityStatus.DANGER : SecurityStatus.SAFE;
    setStatus(newStatus);

    setGraphData(prev => {
        const newData = [...prev, {
            time: new Date().toLocaleTimeString(),
            confidence: (confidence * 100).toFixed(1),
            danger: isSuspicious ? 100 : 20
        }];
        return newData.slice(-30); 
    });

    setEvents(prev => {
        const lastEvent = prev[prev.length - 1];
        const timeDiff = lastEvent ? (now - lastEvent.timestamp.getTime()) : Infinity;

        if (isSuspicious) {
            if (timeDiff < 3000) return prev;
            const newEvent: DetectionEvent = {
                id: now.toString(),
                timestamp: new Date(),
                type: actionType as any,
                confidence: confidence,
                status: SecurityStatus.DANGER,
                message: `Suspicious ${actionType} detected`,
                thumbnail: snapshot
            };
            if ('speechSynthesis' in window && isMonitoring) {
                if (!window.speechSynthesis.speaking) {
                    const utterance = new SpeechSynthesisUtterance(`Warning. ${actionType} detected.`);
                    utterance.rate = 1.3;
                    window.speechSynthesis.speak(utterance);
                }
            }
            setStats(s => ({ ...s, totalAlerts: s.totalAlerts + 1 }));
            return [...prev.slice(-49), newEvent];
        } 
        else if (confidence > 0.6 && timeDiff > 10000 && actionType !== 'none' && actionType !== 'normal') {
             const newEvent: DetectionEvent = {
                id: now.toString(),
                timestamp: new Date(),
                type: actionType as any,
                confidence: confidence,
                status: SecurityStatus.SAFE,
                message: `Activity: ${actionType}`,
            };
            return [...prev.slice(-49), newEvent];
        }
        return prev;
    });
  }, [isMonitoring]);

  const getSourceLabel = () => !videoFile ? 'WEBCAM' : (videoFile.startsWith('http') ? 'IP CAM' : 'FILE');

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans relative selection:bg-cyan-500/30">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>

      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="video/*" />

      {/* Header */}
      <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-white/10 flex items-center justify-between px-6 shrink-0 z-30">
        <div className="flex items-center space-x-4">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white transition-colors">
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-white leading-tight tracking-tight">IntruderNet <span className="text-cyan-400">Pro</span></h1>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="hidden md:flex items-center space-x-2 text-sm bg-slate-800/50 px-3 py-1.5 rounded-full border border-white/5">
             <div className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
             <span className="text-slate-400 font-medium">Status: <span className={isMonitoring ? 'text-emerald-400' : 'text-slate-500'}>{isMonitoring ? 'ONLINE' : 'OFFLINE'}</span></span>
          </div>
          
          <button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center space-x-2 px-5 py-2 rounded-lg font-semibold transition-all duration-300 transform hover:scale-105 active:scale-95 ${
              isMonitoring 
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.2)]' 
                : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isMonitoring ? <><Pause className="w-4 h-4" /> <span>Pause System</span></> : <><Play className="w-4 h-4" /> <span>Start System</span></>}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden relative z-10">
        
        {/* Left Sidebar */}
        <div className={`${sidebarOpen ? 'w-80' : 'w-0'} bg-slate-900/95 border-r border-white/10 flex flex-col transition-all duration-300 overflow-hidden relative shadow-2xl`}>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
                
                {/* Input Source Panel */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center">
                        <Activity className="w-3 h-3 mr-2" /> Input Source
                    </h3>
                    
                    {showIpInput ? (
                        <div className="bg-slate-800 p-3 rounded-xl border border-white/10 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <input 
                                type="text" 
                                placeholder="http://192.168.1.x:8080" 
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder-slate-600 transition-colors"
                                value={ipUrl}
                                onChange={(e) => setIpUrl(e.target.value)}
                                autoFocus
                            />
                            <div className="flex space-x-2">
                                <button onClick={handleConnectIpCam} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs py-1.5 rounded-lg font-medium transition-colors">Connect</button>
                                <button onClick={() => setShowIpInput(false)} className="px-3 bg-slate-700 hover:bg-slate-600 text-white text-xs py-1.5 rounded-lg font-medium transition-colors">Cancel</button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-800/40 rounded-xl border border-white/5 p-1">
                            {videoFile ? (
                                <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className="p-1.5 bg-blue-500/20 rounded text-blue-400">
                                            {videoFile.startsWith('http') ? <Globe className="w-4 h-4"/> : <FileText className="w-4 h-4"/>}
                                        </div>
                                        <span className="text-sm font-medium text-slate-200 truncate">{getSourceLabel()}</span>
                                    </div>
                                    <button onClick={clearVideo} className="text-slate-500 hover:text-red-400 transition-colors p-1 hover:bg-red-500/10 rounded">
                                        <Trash2 className="w-4 h-4"/>
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-1">
                                    <button onClick={handleUploadClick} className="bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-600 p-4 rounded-lg flex flex-col items-center justify-center text-xs text-slate-400 hover:text-cyan-400 transition-all group">
                                        <Upload className="w-6 h-6 mb-2 text-slate-500 group-hover:text-cyan-400 transition-colors" /> 
                                        <span>Upload File</span>
                                    </button>
                                    <button onClick={() => setShowIpInput(true)} className="bg-slate-800/50 hover:bg-slate-800 border border-transparent hover:border-slate-600 p-4 rounded-lg flex flex-col items-center justify-center text-xs text-slate-400 hover:text-cyan-400 transition-all group">
                                        <Globe className="w-6 h-6 mb-2 text-slate-500 group-hover:text-cyan-400 transition-colors" /> 
                                        <span>IP Stream</span>
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Smart Tools Panel */}
                <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1 flex items-center">
                        <Scan className="w-3 h-3 mr-2" /> Detection Tools
                    </h3>
                    
                    <div className="space-y-2">
                        {/* Privacy Toggle */}
                        <button 
                            onClick={() => setPrivacyMode(!privacyMode)}
                            className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${privacyMode ? 'bg-indigo-500/10 border-indigo-500/50' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 transition-colors ${privacyMode ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                                    <EyeOff className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <div className={`text-sm font-medium ${privacyMode ? 'text-indigo-300' : 'text-slate-300'}`}>Privacy Blur</div>
                                    <div className="text-[10px] text-slate-500">Anonymize faces</div>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${privacyMode ? 'bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]' : 'bg-slate-700'}`}></div>
                        </button>
                        
                        {/* Zone Toggle */}
                        <button 
                            onClick={() => { if(zoneRect) setZoneRect(null); else setIsDrawing(!isDrawing); }}
                            className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${isDrawing || zoneRect ? 'bg-emerald-500/10 border-emerald-500/50' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 transition-colors ${zoneRect ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30' : (isDrawing ? 'bg-emerald-500/50 text-white animate-pulse' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600')}`}>
                                    <Scan className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <div className={`text-sm font-medium ${zoneRect ? 'text-emerald-300' : 'text-slate-300'}`}>Smart Zone</div>
                                    <div className="text-[10px] text-slate-500">{zoneRect ? 'Active Region' : (isDrawing ? 'Draw box...' : 'Set boundary')}</div>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${zoneRect ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-slate-700'}`}></div>
                        </button>

                        {/* Heatmap Toggle */}
                        <button 
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={`w-full group flex items-center justify-between p-3 rounded-xl border transition-all duration-300 ${showHeatmap ? 'bg-orange-500/10 border-orange-500/50' : 'bg-slate-800/40 border-white/5 hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center">
                                <div className={`p-2 rounded-lg mr-3 transition-colors ${showHeatmap ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30' : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'}`}>
                                    <Flame className="w-4 h-4" />
                                </div>
                                <div className="text-left">
                                    <div className={`text-sm font-medium ${showHeatmap ? 'text-orange-300' : 'text-slate-300'}`}>Heatmap</div>
                                    <div className="text-[10px] text-slate-500">Track movement</div>
                                </div>
                            </div>
                            <div className={`w-2 h-2 rounded-full ${showHeatmap ? 'bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]' : 'bg-slate-700'}`}></div>
                        </button>
                    </div>
                </div>

                {/* AI Tuning Panel */}
                <div>
                    <div className="flex items-center justify-between px-1">
                        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center">
                            <Sliders className="w-3 h-3 mr-2" /> Neural Config
                        </h3>
                    </div>
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-white/5 space-y-5">
                        {/* Confidence Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-400 font-medium">Min Confidence</span>
                                <span className="text-cyan-400 font-mono bg-cyan-950/50 px-1.5 rounded border border-cyan-900">{(confidenceThreshold * 100).toFixed(0)}%</span>
                            </div>
                            <input 
                                type="range" min="0.1" max="0.9" step="0.05"
                                value={confidenceThreshold}
                                onChange={(e) => setConfidenceThreshold(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none"
                            />
                        </div>

                        {/* Sensitivity Slider */}
                        <div>
                            <div className="flex justify-between text-xs mb-2">
                                <span className="text-slate-400 font-medium">Motion Sensitivity</span>
                                <span className="text-cyan-400 font-mono bg-cyan-950/50 px-1.5 rounded border border-cyan-900">{sensitivity}/10</span>
                            </div>
                            <input 
                                type="range" min="1" max="10" step="1"
                                value={sensitivity}
                                onChange={(e) => setSensitivity(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 focus:outline-none"
                            />
                            <p className="text-[10px] text-slate-500 mt-2 leading-tight">
                                High sensitivity detects crawling faster but increases false positives.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Action */}
            <div className="p-4 border-t border-white/10 bg-slate-900/50 backdrop-blur shrink-0">
                <button 
                    onClick={generateReport} 
                    className="w-full group flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-sm py-3 rounded-xl border border-white/10 hover:border-white/20 transition-all shadow-lg hover:shadow-cyan-900/20"
                >
                    <Download className="w-4 h-4 group-hover:translate-y-0.5 transition-transform"/> 
                    <span className="font-medium">Export System Logs</span>
                </button>
            </div>
        </div>

        {/* Center Video Area */}
        <div className={`flex-1 flex flex-col p-4 bg-slate-950/50 transition-all duration-300 ${isFocused ? 'absolute inset-0 z-50 bg-slate-950 p-0' : 'relative'}`}>
             
             {isFocused && (
                 <button onClick={() => setIsFocused(false)} className="absolute top-6 left-6 z-50 bg-slate-900/90 text-white px-4 py-2 rounded-lg border border-white/10 hover:bg-slate-800 shadow-xl backdrop-blur-md transition-colors font-medium text-sm flex items-center">
                    <ChevronLeft className="w-4 h-4 mr-2"/> Exit Focus Mode
                 </button>
             )}

             {uploadError && (
              <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-red-500/10 border border-red-500/50 text-red-200 px-6 py-3 rounded-full flex items-center shadow-lg backdrop-blur-md animate-in slide-in-from-top-4">
                <AlertOctagon className="w-5 h-5 mr-3 shrink-0 text-red-500" />
                <p className="text-sm font-medium">{uploadError}</p>
                <button onClick={() => setUploadError(null)} className="ml-4 hover:text-white"><X className="w-4 h-4" /></button>
              </div>
             )}

             <div className={`flex-1 bg-black overflow-hidden shadow-2xl border border-white/10 relative group ${isFocused ? '' : 'rounded-2xl'}`}>
                 {/* Decorative Corner Accents */}
                 <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-cyan-500/30 rounded-tl-lg pointer-events-none z-20"></div>
                 <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-cyan-500/30 rounded-tr-lg pointer-events-none z-20"></div>
                 <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-cyan-500/30 rounded-bl-lg pointer-events-none z-20"></div>
                 <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-cyan-500/30 rounded-br-lg pointer-events-none z-20"></div>

                 <VideoFeed 
                    status={status} 
                    isSimulating={isMonitoring} 
                    onDetectionUpdate={handleDetectionUpdate}
                    videoSource={videoFile}
                    onTogglePlay={() => setIsMonitoring(!isMonitoring)}
                    onStop={() => setIsMonitoring(false)}
                    onError={handleVideoError}
                    
                    // Smart Props
                    zoneRect={zoneRect}
                    isDrawing={isDrawing}
                    onZoneChange={setZoneRect}
                    onDrawingChange={setIsDrawing}
                    privacyMode={privacyMode}
                    onPrivacyChange={setPrivacyMode}

                    // Interactive Props
                    confidenceThreshold={confidenceThreshold}
                    sensitivity={sensitivity}
                    showHeatmap={showHeatmap}
                    onToggleHeatmap={setShowHeatmap}
                    isFocused={isFocused}
                    onToggleFocus={() => setIsFocused(!isFocused)}
                 />
             </div>
        </div>

        {/* Right Stats Column */}
        {!isFocused && (
        <div className="w-80 bg-slate-900/95 border-l border-white/10 flex flex-col shrink-0 z-20 shadow-2xl">
             {/* Live Chart */}
             <div className="h-56 border-b border-white/5 p-5 bg-slate-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-cyan-900/5 to-transparent pointer-events-none"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Confidence</h3>
                    <div className="flex items-center space-x-1.5 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-900/50">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse"></div>
                        <span className="text-[10px] text-cyan-400 font-mono font-bold">LIVE</span>
                    </div>
                </div>
                <div className="h-32 w-full relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graphData}>
                      <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.3} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', fontSize: '11px', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} 
                        itemStyle={{ color: '#22d3ee' }} 
                        labelStyle={{ display: 'none' }}
                        cursor={{ stroke: '#22d3ee', strokeWidth: 1, strokeDasharray: '4 4' }}
                      />
                      <Area type="monotone" dataKey="confidence" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorConfidence)" isAnimationActive={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>

             {/* Alerts Panel */}
             <div className="flex-1 overflow-hidden p-0 flex flex-col bg-slate-900/50">
                 <AlertPanel events={events} onDismiss={handleDismissEvent} />
             </div>
        </div>
        )}
      </main>
    </div>
  );
};