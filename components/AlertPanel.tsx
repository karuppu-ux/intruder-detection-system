
import React, { useEffect, useRef, useState } from 'react';
import { AlertTriangle, CheckCircle, Clock, X, Terminal, Search, Sparkles } from 'lucide-react';
import { DetectionEvent, SecurityStatus } from '../types';

interface AlertPanelProps {
  events: DetectionEvent[];
  onDismiss: (id: string) => void;
  onForensicSearch: (query: string) => void;
  isSearching: boolean;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({ events, onDismiss, onForensicSearch, isSearching }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onForensicSearch(searchQuery);
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/50">
      <div className="p-4 border-b border-white/5 bg-slate-900 sticky top-0 z-10 backdrop-blur-sm space-y-3">
        <div className="flex justify-between items-center">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center">
            <Terminal className="w-3 h-3 mr-2" />
            Activity Log
            </h3>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full border border-slate-700">
                {events.length}
            </span>
        </div>

        <form onSubmit={handleSearch} className="relative group">
            <Search className={`absolute left-3 top-2.5 w-3.5 h-3.5 transition-colors ${isSearching ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search history (e.g. 'climbing' or 'Dad')"
              className="w-full bg-slate-950 border border-white/10 rounded-lg pl-9 pr-10 py-2 text-[10px] text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-all"
            />
            <div className="absolute right-3 top-2.5 flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-cyan-600 opacity-50" />
            </div>
        </form>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {events.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-800/50 flex items-center justify-center">
                <Terminal className="w-6 h-6 opacity-20" />
            </div>
            <p className="text-xs font-medium">No activity found</p>
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
                  
                  {event.aiSummary && (
                    <div className="mb-2 p-1.5 bg-cyan-950/20 border border-cyan-500/20 rounded text-[9px] text-cyan-300 italic">
                      "{event.aiSummary}"
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono border-t border-white/5 pt-2 mt-1">
                    <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1 opacity-50" />
                        {event.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={event.confidence > 0.8 ? 'text-cyan-600' : 'text-slate-600'}>
                        {(event.confidence * 100).toFixed(0)}% Certain
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
