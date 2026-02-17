
import React, { useMemo } from 'react';
import { Activity, Cpu, Terminal, ShieldCheck, ShieldAlert, Radio, ScanLine, Fingerprint, GitCommit, Ruler, Footprints, BarChart3 } from 'lucide-react';
import { SecurityStatus, ActionType, SkeletalSignature, RegisteredProfile } from '../types';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';

interface SystemAnalystProps {
  currentAction: ActionType;
  confidence: number;
  status: SecurityStatus;
  inferenceTime: number;
  signature: SkeletalSignature | null;
  matchedIdentity?: string;
  matchedProfile?: RegisteredProfile | null;
}

export const SystemAnalyst: React.FC<SystemAnalystProps> = ({ 
  currentAction, 
  confidence, 
  status,
  signature,
  matchedIdentity,
  matchedProfile
}) => {
  const radarData = useMemo(() => {
    if (!signature) return [];
    return [
      { subject: 'Torso', A: signature.ratios.torsoAspect * 100, fullMark: 150 },
      { subject: 'Limb', A: signature.ratios.limbProportion * 100, fullMark: 150 },
      { subject: 'Frame', A: signature.ratios.frameScale * 100, fullMark: 150 },
      { subject: 'Extremity', A: signature.ratios.extremityRatio * 100, fullMark: 150 },
      { subject: 'Stability', A: signature.stabilityScore * 100, fullMark: 150 },
    ];
  }, [signature]);

  const matchDelta = useMemo(() => {
    if (!signature || !matchedProfile) return null;
    const s = signature.ratios;
    const p = matchedProfile.signature.ratios;
    return {
      torso: Math.abs(s.torsoAspect - p.torsoAspect),
      limb: Math.abs(s.limbProportion - p.limbProportion),
      frame: Math.abs(s.frameScale - p.frameScale),
    };
  }, [signature, matchedProfile]);

  return (
    <div className="flex flex-col h-full bg-[#0f172a] font-mono border-l border-white/5">
      {/* Top Monitor Bar */}
      <div className="p-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <h3 className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">System Monitor</h3>
           </div>
           <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${status === SecurityStatus.SAFE ? 'bg-emerald-500 animate-pulse' : 'bg-red-500 animate-ping'}`}></div>
              <span className={`text-[9px] font-bold uppercase ${status === SecurityStatus.SAFE ? 'text-emerald-500' : 'text-red-500'}`}>{status}</span>
           </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
            <div className="bg-slate-900/50 p-2 rounded border border-white/5 flex flex-col items-center justify-center">
               <Cpu className="w-3.5 h-3.5 text-slate-500 mb-1" />
               <span className="text-[8px] text-slate-500 uppercase">Engine</span>
               <span className="text-[9px] text-emerald-400 font-bold">ONLINE</span>
            </div>
            <div className="bg-slate-900/50 p-2 rounded border border-white/5 flex flex-col items-center justify-center">
               <Radio className="w-3.5 h-3.5 text-slate-500 mb-1" />
               <span className="text-[8px] text-slate-500 uppercase">Signal</span>
               <span className="text-[9px] text-cyan-400 font-bold">-42 dBm</span>
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          
          {/* Behavioral Analysis Section */}
          <div className="space-y-3">
             <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <ScanLine className="w-3.5 h-3.5 text-purple-400" />
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Behavioral State</h4>
             </div>
             
             <div className="bg-slate-900 border border-white/10 rounded-lg p-3 relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                <span className="text-[8px] text-slate-500 uppercase tracking-wider block mb-1">Detected Action</span>
                <div className="flex items-baseline space-x-2 mb-3">
                   <h2 className="text-base font-black text-white uppercase tracking-wider">
                     {currentAction === 'none' ? 'SCANNING...' : currentAction.replace('_', ' ')}
                   </h2>
                </div>
                
                <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden mb-2">
                   <div 
                     className="h-full bg-gradient-to-r from-purple-500 to-cyan-400 transition-all duration-300" 
                     style={{ width: `${confidence * 100}%` }}
                   ></div>
                </div>
                <div className="flex justify-between text-[8px]">
                   <span className="text-slate-500 uppercase">Certainty</span>
                   <span className="text-cyan-400 font-mono">{(confidence * 100).toFixed(1)}%</span>
                </div>
             </div>
          </div>

          {/* Biometric Analysis Section */}
          <div className="space-y-4">
             <div className="flex items-center space-x-2 border-b border-white/5 pb-2">
                <Fingerprint className="w-3.5 h-3.5 text-cyan-400" />
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Biometric ID</h4>
             </div>
             
             <div className={`bg-slate-900 border rounded-lg p-4 transition-all ${matchedIdentity ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-white/10'}`}>
                <div className="flex items-center justify-between mb-4">
                   <span className="text-[8px] text-slate-500 uppercase tracking-wider">Identity Match</span>
                   {matchedIdentity ? (
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                   ) : (
                      <ShieldAlert className="w-4 h-4 text-slate-600" />
                   )}
                </div>
                
                <div className="text-center py-2">
                   {matchedIdentity ? (
                      <div className="space-y-1">
                         <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/50 mx-auto flex items-center justify-center mb-2">
                            <span className="text-emerald-400 font-bold text-xs">{matchedIdentity.charAt(0)}</span>
                         </div>
                         <h3 className="text-sm font-bold text-white italic">{matchedIdentity}</h3>
                         <span className="text-[8px] text-emerald-500 uppercase bg-emerald-500/10 px-2 py-0.5 rounded">Identity Verified</span>
                      </div>
                   ) : (
                      <div className="space-y-1 opacity-50">
                         <div className="w-10 h-10 rounded-full bg-slate-800 mx-auto animate-pulse flex items-center justify-center">
                            <Activity className="w-4 h-4 text-slate-600" />
                         </div>
                         <h3 className="text-[10px] font-bold text-slate-400 uppercase">Searching...</h3>
                         <span className="text-[8px] text-slate-600 uppercase tracking-tighter">Skeletal Mesh Active</span>
                      </div>
                   )}
                </div>

                {signature && (
                  <div className="mt-4 pt-4 border-t border-white/5 space-y-4">
                    {/* Visual Radar Map */}
                    <div className="h-32 w-full bg-black/40 rounded flex items-center justify-center overflow-hidden">
                       <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                           <PolarGrid stroke="#1e293b" />
                           <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 7 }} />
                           <Radar
                             name="Subject"
                             dataKey="A"
                             stroke="#22d3ee"
                             fill="#22d3ee"
                             fillOpacity={0.3}
                           />
                         </RadarChart>
                       </ResponsiveContainer>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                       <div className="bg-black/20 p-2 rounded">
                          <div className="flex items-center text-[7px] text-slate-500 uppercase mb-1">
                             <Ruler className="w-2.5 h-2.5 mr-1" /> Proportions
                          </div>
                          <div className="space-y-1">
                             <div className="flex justify-between text-[8px] text-slate-300">
                                <span>Torso</span>
                                <span>{signature.ratios.torsoAspect.toFixed(2)}</span>
                             </div>
                             <div className="flex justify-between text-[8px] text-slate-300">
                                <span>Limb</span>
                                <span>{signature.ratios.limbProportion.toFixed(2)}</span>
                             </div>
                          </div>
                       </div>
                       <div className="bg-black/20 p-2 rounded">
                          <div className="flex items-center text-[7px] text-slate-500 uppercase mb-1">
                             <Footprints className="w-2.5 h-2.5 mr-1" /> Gait Tech
                          </div>
                          <div className="space-y-1">
                             <div className="flex justify-between text-[8px] text-slate-300">
                                <span>Cadence</span>
                                <span>{signature.gaitCadence.toFixed(2)}Hz</span>
                             </div>
                             <div className="flex justify-between text-[8px] text-slate-300">
                                <span>Stability</span>
                                <span>{signature.stabilityScore.toFixed(2)}</span>
                             </div>
                          </div>
                       </div>
                    </div>

                    {matchDelta && (
                      <div className="bg-emerald-500/5 border border-emerald-500/10 p-2 rounded space-y-2">
                        <span className="text-[7px] text-emerald-500 uppercase font-black tracking-widest block">Match Accuracy Delta</span>
                        <div className="space-y-1">
                           {Object.entries(matchDelta).map(([key, val]) => (
                             <div key={key} className="flex items-center space-x-2">
                               <div className="w-10 text-[7px] text-slate-500 uppercase">{key}</div>
                               <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                                 <div className="h-full bg-emerald-500" style={{ width: `${Math.max(0, 100 - ((val as number) * 500))}%` }}></div>
                               </div>
                               <div className="text-[7px] text-emerald-400">{(100 - ((val as number) * 100)).toFixed(0)}%</div>
                             </div>
                           ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-slate-600">
                        <span className="flex items-center">
                           <GitCommit className="w-3 h-3 mr-1" />
                           {signature.hash.toUpperCase()}
                        </span>
                        <span className="uppercase">v1.3-BIOM</span>
                    </div>
                  </div>
                )}
             </div>
          </div>

          {/* Telemetry Visualizer */}
          <div className="p-3 bg-black/40 rounded border border-white/5 space-y-2">
             <div className="flex justify-between items-center mb-1">
                <span className="text-[8px] text-slate-600 uppercase tracking-widest block flex items-center">
                   <BarChart3 className="w-2.5 h-2.5 mr-2" /> Neural Stream
                </span>
                <span className="text-[7px] text-cyan-700 animate-pulse font-bold uppercase">Streaming</span>
             </div>
             <div className="flex items-end space-x-1 h-8">
                {[40, 65, 30, 80, 50, 90, 20, 45, 70, 60, 35, 85].map((h, i) => (
                   <div key={i} className="flex-1 bg-slate-900 rounded-sm relative overflow-hidden">
                      <div 
                        className="absolute bottom-0 w-full bg-cyan-500/20 transition-all duration-300" 
                        style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
                      ></div>
                   </div>
                ))}
             </div>
          </div>

      </div>
    </div>
  );
};
