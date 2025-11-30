import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle, Clock, X } from 'lucide-react';
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
    <div className="flex flex-col h-full bg-slate-800 rounded-lg border border-slate-700 shadow-lg overflow-hidden">
      <div className="p-4 border-b border-slate-700 bg-slate-850 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider flex items-center">
          <Clock className="w-4 h-4 mr-2 text-cyan-400" />
          Event Log
        </h3>
        <span className="text-xs text-slate-400">{events.length} Events</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {events.length === 0 ? (
          <div className="text-center text-slate-500 py-10 text-sm">
            No events detected yet.
          </div>
        ) : (
          events.map((event) => (
            <div 
              key={event.id} 
              className={`p-3 rounded-md flex items-start space-x-3 transition-all duration-300 animate-in fade-in slide-in-from-right-4 group relative ${
                event.status === SecurityStatus.DANGER 
                  ? 'bg-red-500/10 border border-red-500/30' 
                  : 'bg-slate-700/50 border border-slate-600'
              }`}
            >
              <div className="mt-1">
                {event.status === SecurityStatus.DANGER ? (
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <p className={`text-sm font-bold ${event.status === SecurityStatus.DANGER ? 'text-red-400' : 'text-emerald-400'}`}>
                    {event.type.toUpperCase()}
                  </p>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-slate-500 font-mono">
                      {event.timestamp.toLocaleTimeString()}
                    </span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        onDismiss(event.id);
                      }}
                      className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-700/50"
                      title="Dismiss Alert"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-300 mt-1 pr-4">{event.message}</p>
                <div className="mt-2 w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full ${event.status === SecurityStatus.DANGER ? 'bg-red-500' : 'bg-emerald-500'}`} 
                    style={{ width: `${event.confidence * 100}%` }}
                  ></div>
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5 text-right">Confidence: {(event.confidence * 100).toFixed(0)}%</p>
              </div>
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};