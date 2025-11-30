import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Play, Pause, AlertOctagon, ShieldCheck, Activity, Download, Upload, Smartphone, Mic, Trash2, X, FileText, Globe, Link as LinkIcon, Scan, EyeOff, Cuboid } from 'lucide-react';
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
  
  // Smart Control State (Lifted from VideoFeed)
  const [zoneRect, setZoneRect] = useState<ZoneRect | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [privacyMode, setPrivacyMode] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Throttle state updates
  const lastUpdateRef = useRef<number>(0);

  // Cleanup object URL when component unmounts or file changes
  useEffect(() => {
    return () => {
        if (videoFile && videoFile.startsWith('blob:')) {
            URL.revokeObjectURL(videoFile);
        }
    };
  }, [videoFile]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setUploadError(null);
    setShowIpInput(false);
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
      if (!file.type.startsWith('video/') || (!validTypes.includes(file.type) && file.type !== '')) {
         console.warn("Unknown video type:", file.type);
      }
      
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && !['mp4', 'webm', 'ogg', 'mov'].includes(extension)) {
         setUploadError("Warning: This video format might not be supported. Recommended: MP4, WebM.");
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
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
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

  // Generate and Download CSV Report
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

  // Callback from VideoFeed
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
                message: `Suspicious ${actionType} pattern detected`,
                thumbnail: snapshot
            };

            if ('speechSynthesis' in window && isMonitoring) {
                if (!window.speechSynthesis.speaking) {
                    const utterance = new SpeechSynthesisUtterance("Warning. Intruder detected.");
                    utterance.rate = 1.3;
                    window.speechSynthesis.speak(utterance);
                }
            }
            
            setStats(s => ({ ...s, totalAlerts: s.totalAlerts + 1 }));
            return [...prev.slice(-49), newEvent];
        } 
        else if (confidence > 0.6 && timeDiff > 10000 && actionType !== 'none') {
             const newEvent: DetectionEvent = {
                id: now.toString(),
                timestamp: new Date(),
                type: actionType as any,
                confidence: confidence,
                status: SecurityStatus.SAFE,
                message: `Activity monitored: ${actionType}`,
            };
            return [...prev.slice(-49), newEvent];
        }

        return prev;
    });

  }, [isMonitoring]);

  // Determine Source Label
  const getSourceLabel = () => {
    if (!videoFile) return 'WEBCAM';
    if (videoFile.startsWith('http')) return 'IP CAM';
    return 'FILE';
  };

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="video/mp4,video/webm,video/ogg,video/quicktime" 
      />

      {/* Header */}
      <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 p-2 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white leading-tight">IntruderNet</h1>
            <p className="text-xs text-slate-400">Dashboard v2.6 (Smart Zones)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2 text-sm text-slate-400">
             <span className={`w-2 h-2 rounded-full ${isMonitoring ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
             <span>System Status: <span className={isMonitoring ? 'text-emerald-400' : 'text-slate-500'}>{isMonitoring ? 'ONLINE' : 'OFFLINE'}</span></span>
          </div>
          
          <button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-colors ${
              isMonitoring 
                ? 'bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20' 
                : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-900/20'
            }`}
          >
            {isMonitoring ? 
              <><Pause className="w-4 h-4" /> <span>{videoFile ? 'Pause Feed' : 'Stop Camera'}</span></> : 
              <><Play className="w-4 h-4" /> <span>{videoFile ? 'Play Feed' : 'Start Camera'}</span></>
            }
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Column: Video & Stats */}
        <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto">
          
          {/* Top Bar Stats (Modified for Smart Controls) */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            {/* Input Source */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex items-center space-x-4">
              <div className="p-2 bg-blue-500/20 rounded-full text-blue-400"><Activity className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Input Source</p>
                <p className="text-xl font-mono font-bold text-white truncate max-w-[100px]">{getSourceLabel()}</p>
              </div>
            </div>

            {/* Smart Controls: Privacy */}
            <div className={`cursor-pointer border p-4 rounded-lg flex items-center space-x-4 transition-colors ${privacyMode ? 'bg-indigo-900/30 border-indigo-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`} onClick={() => setPrivacyMode(!privacyMode)}>
               <div className={`p-2 rounded-full ${privacyMode ? 'bg-indigo-500 text-white' : 'bg-slate-700 text-slate-400'}`}>
                  <EyeOff className="w-5 h-5" />
               </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Privacy Blur</p>
                <p className={`text-xl font-mono font-bold ${privacyMode ? 'text-indigo-400' : 'text-slate-500'}`}>{privacyMode ? 'ACTIVE' : 'OFF'}</p>
              </div>
            </div>

             {/* Smart Controls: Zones */}
            <div 
                className={`cursor-pointer border p-4 rounded-lg flex items-center space-x-4 transition-colors ${isDrawing || zoneRect ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'}`}
                onClick={() => {
                    if (zoneRect) setZoneRect(null);
                    else setIsDrawing(!isDrawing);
                }}
            >
               <div className={`p-2 rounded-full ${zoneRect ? 'bg-emerald-500 text-white' : (isDrawing ? 'bg-emerald-500/50 text-emerald-100 animate-pulse' : 'bg-slate-700 text-slate-400')}`}>
                  <Scan className="w-5 h-5" />
               </div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Smart Zone</p>
                <p className={`text-xl font-mono font-bold ${zoneRect ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {zoneRect ? 'ACTIVE' : (isDrawing ? 'DRAWING...' : 'OFF')}
                </p>
              </div>
            </div>

            {/* Total Alerts */}
            <div className="bg-slate-800/50 border border-slate-700 p-4 rounded-lg flex items-center space-x-4">
               <div className="p-2 bg-red-500/20 rounded-full text-red-400"><AlertOctagon className="w-5 h-5" /></div>
              <div>
                <p className="text-xs text-slate-400 uppercase">Total Alerts</p>
                <p className="text-xl font-mono font-bold text-white">{stats.totalAlerts}</p>
              </div>
            </div>
          </div>

          {/* Video Feed Area */}
          <div className="flex-1 min-h-[400px] flex flex-col relative bg-slate-900 rounded-xl overflow-hidden shadow-2xl border border-slate-800">
             
             {/* Error Banner */}
             {uploadError && (
              <div className="absolute top-0 left-0 right-0 z-40 m-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center shadow-lg backdrop-blur-md">
                <AlertOctagon className="w-5 h-5 mr-3 shrink-0" />
                <p className="text-sm font-medium">{uploadError}</p>
                <button onClick={() => setUploadError(null)} className="ml-auto hover:text-red-300 transition-colors p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
             )}

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
             />
          </div>

          {/* Bottom Controls */}
          <div className="h-48 grid grid-cols-3 gap-4 shrink-0">
            {/* Quick Actions */}
             <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 flex flex-col justify-between relative overflow-hidden">
                <h3 className="text-sm font-semibold text-slate-300 mb-2">System Controls</h3>
                
                {showIpInput ? (
                    <div className="absolute inset-0 bg-slate-800 p-4 z-10 flex flex-col justify-center space-y-2">
                        <h4 className="text-sm text-cyan-400 font-medium">Connect to IP Camera</h4>
                        <input 
                            type="text" 
                            placeholder="http://192.168.1.x:8080/video" 
                            className="bg-slate-900 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
                            value={ipUrl}
                            onChange={(e) => setIpUrl(e.target.value)}
                        />
                        <div className="flex space-x-2">
                            <button onClick={handleConnectIpCam} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-sm py-1.5 rounded transition-colors">Connect</button>
                            <button onClick={() => setShowIpInput(false)} className="px-3 bg-slate-700 hover:bg-slate-600 text-white text-sm py-1.5 rounded transition-colors">Cancel</button>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-2">
                    {videoFile ? (
                        <button 
                            onClick={clearVideo}
                            className="flex items-center justify-center space-x-2 bg-red-900/50 hover:bg-red-900/80 text-sm py-2 rounded text-red-200 col-span-2 border border-red-800"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span>Disconnect Source</span>
                        </button>
                    ) : (
                        <>
                            <button 
                                onClick={handleUploadClick}
                                className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-sm py-2 rounded text-slate-200"
                            >
                                <Upload className="w-4 h-4" />
                                <span>Upload Video</span>
                            </button>
                            <button 
                                onClick={() => setShowIpInput(true)}
                                className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-sm py-2 rounded text-slate-200"
                            >
                                <Globe className="w-4 h-4" />
                                <span>IP Camera</span>
                            </button>
                        </>
                    )}
                    
                    <button 
                        onClick={generateReport}
                        className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-sm py-2 rounded text-slate-200"
                        >
                        <Download className="w-4 h-4" />
                        <span>Report CSV</span>
                    </button>
                    <button className="flex items-center justify-center space-x-2 bg-slate-700 hover:bg-slate-600 text-sm py-2 rounded text-slate-200 opacity-50 cursor-not-allowed">
                        <Smartphone className="w-4 h-4" />
                        <span>Mobile Link</span>
                    </button>
                    </div>
                )}
                
                <div className="mt-2 text-xs text-slate-500 truncate">
                  {videoFile ? (videoFile.startsWith('http') ? `Streaming: ${videoFile}` : 'Analyzing uploaded file...') : 'Ready for inputs.'}
                </div>
             </div>
             
             {/* Live Confidence Chart */}
             <div className="col-span-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
                <h3 className="text-sm font-semibold text-slate-300 mb-2 flex justify-between">
                    <span>Live Confidence Matrix</span>
                    <span className="text-xs font-normal text-slate-500">Real-time</span>
                </h3>
                <div className="h-32 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={graphData}>
                      <defs>
                        <linearGradient id="colorConfidence" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }}
                        itemStyle={{ color: '#0ea5e9' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="confidence" 
                        stroke="#0ea5e9" 
                        fillOpacity={1} 
                        fill="url(#colorConfidence)" 
                        isAnimationActive={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
             </div>
          </div>
        </div>

        {/* Right Column: Alert Panel */}
        <div className="w-80 bg-slate-900 border-l border-slate-800 flex flex-col shrink-0">
          <div className="p-4 bg-slate-800/50">
             <h2 className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">System Logs</h2>
          </div>
          <div className="flex-1 overflow-hidden p-2">
            <AlertPanel events={events} onDismiss={handleDismissEvent} />
          </div>
        </div>
      </main>
    </div>
  );
};