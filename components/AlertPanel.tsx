import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, Terminal } from 'lucide-react';
import { DetectionEvent, SecurityStatus } from '../types';

interface AlertPanelProps {
  events: DetectionEvent[];
  onDismiss: (id: string) => void;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ events, onDismiss }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-4 border-b border-white/5 bg-slate-900 flex justify-between items-center sticky top-0 z-10 backdrop-blur-sm">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
          <Terminal className="w-3 h-3 mr-2" />
          System Logs
        </h3>
        <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
            {events.length}
        </span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Terminal className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-xs font-medium">No activity recorded</p>
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id} 
              className={`relative pl-3 pr-2 py-2.5 rounded-lg border flex flex-col transition-all duration-300 animate-in fade-in slide-in-from-right-2 group ${
                event.status === SecurityStatus.DANGER 
                  ? 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10' 
                  : 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10'
              }`}
            >
              {/* Status Color Strip */}
              <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-lg ${event.status === SecurityStatus.DANGER ? 'bg-red-500' : 'bg-emerald-500'}`}></div>

              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center space-x-2">
                    {event.status === SecurityStatus.DANGER ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span className={`text-xs font-bold tracking-wide ${event.status === SecurityStatus.DANGER ? 'text-red-400' : 'text-emerald-400'}`}>
                        {event.type.toUpperCase()}
                    </span>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(event.id);
                  }}
                  className="text-slate-600 hover:text-slate-300 opacity-0 group-hover:opacity-100 transition-all p-0.5 hover:bg-white/5 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="pl-5.5">
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-2">{event.message}</p>
                  
                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-1">
                    <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 opacity-50" />
                        {event.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={event.confidence > 0.8 ? 'text-cyan-600' : 'text-slate-600'}>
                        CONF: {(event.confidence * 100).toFixed(0)}%
                    </span>
                  </div>

                  {event.thumbnail && (
                     <div className="mt-2 rounded overflow-hidden border border-white/10 group-hover:border-white/20 transition-colors">
                        <img src={event.thumbnail} alt="Evidence" className="w-full h-16 object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                     </div>
                  )}
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};