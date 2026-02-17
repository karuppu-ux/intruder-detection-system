
import React from 'react';
import { BrainCircuit, MessageSquare, ShieldAlert, Volume2, Loader2, Send, Zap, ShieldCheck } from 'lucide-react';
import { AIAnalysis, ChatMessage } from '../types';

interface GeminiAnalystProps {
  analysis: AIAnalysis | null;
  isAnalyzing: boolean;
  chatHistory: ChatMessage[];
  onSendMessage: (msg: string) => void;
  isGeneratingSpeech: boolean;
}

export const GeminiAnalyst: React.FC<GeminiAnalystProps> = ({ 
  analysis, 
  isAnalyzing, 
  chatHistory, 
  onSendMessage,
  isGeneratingSpeech
}) => {
  const [input, setInput] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    onSendMessage(input);
    setInput('');
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/40 backdrop-blur-md">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-widest">AI Analysis</h3>
        </div>
        {isAnalyzing && (
          <div className="flex items-center space-x-1">
             <Loader2 className="w-3 h-3 text-cyan-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Analysis Panel */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
        {isAnalyzing ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 opacity-60">
             <Zap className="w-8 h-8 text-cyan-500 animate-pulse" />
             <p className="text-[10px] font-mono text-cyan-400 animate-pulse">THINKING...</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
             <div className={`border rounded-xl p-4 shadow-lg transition-all ${analysis.riskScore > 70 ? 'bg-red-500/10 border-red-500/30' : 'bg-emerald-500/10 border-emerald-500/30'}`}>
                <div className="flex items-center justify-between mb-2">
                   <span className="text-[10px] font-bold text-slate-500 uppercase">Risk Level</span>
                   <div className={`px-2 py-0.5 rounded text-[10px] font-bold ${analysis.riskScore > 70 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {analysis.riskScore}% DANGER
                   </div>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">"{analysis.summary}"</p>
                
                <div className={`mt-4 p-3 rounded border flex items-start space-x-3 ${analysis.riskScore > 70 ? 'bg-red-500/20 border-red-500/40' : 'bg-cyan-950/30 border-cyan-500/20'}`}>
                   {analysis.riskScore > 70 ? <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" /> : <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />}
                   <div className="space-y-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider block opacity-70">What to do</span>
                      <p className="text-[10px] text-white leading-tight">{analysis.recommendation}</p>
                   </div>
                </div>
             </div>
          </div>
        ) : (
          <div className="h-40 flex flex-col items-center justify-center text-slate-600 border border-dashed border-white/5 rounded-xl">
             <ShieldAlert className="w-8 h-8 opacity-20 mb-2" />
             <p className="text-[10px] font-medium text-center px-4">AI is standing by. It will show a report here if a major alert is detected.</p>
          </div>
        )}

        {/* Chat Interface */}
        <div className="pt-4 border-t border-white/5">
           <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Chat with AI</span>
              </div>
           </div>
           
           <div className="space-y-3 mb-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar flex flex-col">
              {chatHistory.length === 0 && (
                <p className="text-[10px] text-slate-600 italic text-center py-4">No messages yet</p>
              )}
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                   <div className={`max-w-[85%] px-3 py-2 rounded-xl text-[10px] leading-snug ${
                     msg.role === 'user' 
                       ? 'bg-cyan-600 text-white rounded-tr-none' 
                       : 'bg-slate-800 text-slate-300 border border-white/5 rounded-tl-none'
                   }`}>
                      {msg.text}
                   </div>
                </div>
              ))}
           </div>

           <form onSubmit={handleSubmit} className="relative">
              <input 
                type="text" 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="w-full bg-slate-950/50 border border-white/10 rounded-xl px-4 py-3 pr-10 text-[11px] text-white placeholder-slate-700 focus:outline-none focus:border-cyan-500 transition-all"
              />
              <button type="submit" className="absolute right-2 top-2 p-1.5 text-slate-600 hover:text-cyan-400 transition-colors">
                 <Send className="w-4 h-4" />
              </button>
           </form>
        </div>
      </div>
    </div>
  );
};
