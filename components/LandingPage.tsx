import React from 'react';
import { ChevronRight, Eye, Brain, Shield, ShieldCheck, Lock, Smartphone, FileText, Activity, AlertTriangle, Scan } from 'lucide-react';
import { MOCK_FEATURES } from '../constants';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-blue-900/20 to-transparent pointer-events-none"></div>
      <div className="absolute -top-40 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      
      {/* Navbar */}
      <nav className="border-b border-white/5 bg-slate-950/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="bg-gradient-to-tr from-blue-600 to-cyan-500 p-2 rounded-lg shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-shadow">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">IntruderNet</span>
           </div>
           <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
              <a href="#features" className="hover:text-white transition-colors">Technology</a>
              <a href="#privacy" className="hover:text-white transition-colors">Privacy</a>
              <a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
           </div>
           <button 
             onClick={onStart}
             className="bg-white text-slate-950 px-6 py-2.5 rounded-full font-semibold transition-all hover:bg-cyan-50 hover:scale-105 shadow-lg shadow-white/10"
           >
             Launch Dashboard
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32">
        <div className="max-w-7xl mx-auto px-6 text-center relative z-10">
           <div className="inline-flex items-center space-x-2 bg-slate-900/80 border border-slate-700 rounded-full px-4 py-1.5 mb-8 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">New: YOLO11-Pose Engine</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000">
             Security That Actually <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600">Understands Human Action.</span>
           </h1>
           
           <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
             IntruderNet uses advanced <span className="text-slate-200 font-semibold">Pose Estimation</span> to distinguish between harmless movement and real threats like crawling or climbing.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 animate-in fade-in slide-in-from-bottom-10 duration-1000 delay-300">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-cyan-600 text-white rounded-xl font-bold text-lg hover:bg-cyan-500 transition-all flex items-center justify-center group shadow-xl shadow-cyan-900/20"
              >
                Start Live Demo
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-slate-900/50 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors border border-slate-700 backdrop-blur-sm">
                View Documentation
              </button>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900/30 border-y border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The Intelligence Inside</h2>
            <p className="text-slate-400">Next-gen AI architecture running directly in your browser.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {MOCK_FEATURES.map((feature, idx) => (
              <div key={idx} className="bg-slate-950 p-8 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all duration-300 group hover:-translate-y-1">
                <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/10 transition-colors shadow-inner">
                  {feature.icon === 'eye' && <Eye className="w-7 h-7 text-cyan-400" />}
                  {feature.icon === 'brain' && <Brain className="w-7 h-7 text-purple-400" />}
                  {feature.icon === 'shield-alert' && <Shield className="w-7 h-7 text-emerald-400" />}
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-100">{feature.title}</h3>
                <h4 className="text-xs font-mono text-cyan-500 mb-4 bg-cyan-950/30 inline-block px-2 py-1 rounded">{feature.subtitle}</h4>
                <p className="text-slate-400 leading-relaxed text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Features Preview */}
      <section id="use-cases" className="py-24 relative overflow-hidden">
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[100px] -z-10"></div>
        
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
           <div>
             <h2 className="text-3xl font-bold mb-8">Enterprise-Grade Security</h2>
             <div className="space-y-8">
                <div className="flex items-start space-x-5">
                   <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 shadow-lg"><Smartphone className="w-6 h-6 text-blue-400"/></div>
                   <div>
                     <h3 className="font-bold text-lg text-slate-200">Mobile Ready</h3>
                     <p className="text-slate-400 mt-1 leading-relaxed">Responsive design that works on tablets and phones. Monitor your feed from anywhere.</p>
                   </div>
                </div>
                <div className="flex items-start space-x-5">
                   <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 shadow-lg"><Lock className="w-6 h-6 text-emerald-400"/></div>
                   <div>
                     <h3 className="font-bold text-lg text-slate-200">Privacy First Architecture</h3>
                     <p className="text-slate-400 mt-1 leading-relaxed">Video processing happens locally. We only store anonymous skeletal metadata, never faces.</p>
                   </div>
                </div>
                <div className="flex items-start space-x-5">
                   <div className="bg-slate-800 p-3.5 rounded-xl border border-slate-700 shadow-lg"><FileText className="w-6 h-6 text-amber-400"/></div>
                   <div>
                     <h3 className="font-bold text-lg text-slate-200">Automated Incident Reports</h3>
                     <p className="text-slate-400 mt-1 leading-relaxed">Generates CSV logs of all suspicious activities, perfect for security audits and evidence.</p>
                   </div>
                </div>
             </div>
           </div>
           
           {/* Dashboard Mockup */}
           <div className="relative group perspective-1000">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl transform rotate-2 scale-105 blur-xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
              
              <div className="relative bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-1">
                 {/* Mock Header */}
                 <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center px-4 space-x-2">
                    <div className="flex space-x-2">
                       <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50"></div>
                    </div>
                    <div className="ml-4 h-2 w-24 bg-slate-800 rounded-full"></div>
                 </div>
                 
                 {/* Mock Content */}
                 <div className="flex h-80">
                    {/* Sidebar */}
                    <div className="w-16 border-r border-slate-800 bg-slate-900/30 flex flex-col items-center py-6 space-y-4">
                       <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
                       <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
                       <div className="w-8 h-8 bg-cyan-900/30 rounded-lg border border-cyan-500/30 shadow-inner"></div>
                       <div className="w-8 h-8 bg-slate-800 rounded-lg"></div>
                    </div>
                    
                    {/* Main Feed */}
                    <div className="flex-1 p-4 bg-slate-950 relative overflow-hidden flex flex-col">
                       <div className="flex-1 bg-slate-900 rounded-lg border border-slate-800 relative flex items-center justify-center overflow-hidden">
                           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-900">
                              <div className="absolute inset-0" style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '40px 40px', opacity: 0.1 }}></div>
                              
                              {/* Skeleton Visualization */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-56 transform translate-y-4">
                                  {/* Nodes */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 bg-yellow-400 rounded-full shadow-[0_0_10px_rgba(250,204,21,0.5)] z-10"></div>
                                  <div className="absolute top-12 left-1/2 -translate-x-1/2 w-2 h-2 bg-cyan-400 rounded-full z-10"></div>
                                  
                                  {/* Connecting Lines */}
                                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                      <path d="M 80 6 L 80 50 L 40 60 M 80 50 L 120 60" stroke="#06b6d4" strokeWidth="2" fill="none" />
                                      <path d="M 80 50 L 80 120 L 50 180 M 80 120 L 110 180" stroke="#06b6d4" strokeWidth="2" fill="none" />
                                  </svg>
                                  
                                  {/* Bounding Box */}
                                  <div className="absolute -inset-2 border border-red-500/50 rounded bg-red-500/5">
                                      <div className="absolute -top-3 left-0 bg-red-500 text-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-lg">SUSPICIOUS 98%</div>
                                  </div>
                              </div>
                           </div>
                       </div>
                    </div>
                    
                    {/* Right Panel */}
                    <div className="w-36 border-l border-slate-800 bg-slate-900/30 p-3 space-y-3">
                       <div className="h-2 w-16 bg-slate-700 rounded mb-4"></div>
                       {[1, 2, 3].map((i) => (
                           <div key={i} className="h-12 bg-slate-900 border border-slate-800 rounded-lg p-2 relative overflow-hidden">
                               <div className={`absolute left-0 top-0 bottom-0 w-1 ${i === 1 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
                               <div className="ml-2 h-1.5 w-12 bg-slate-700 rounded mb-1.5"></div>
                               <div className="ml-2 h-1 w-20 bg-slate-800 rounded"></div>
                           </div>
                       ))}
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p className="mb-4 text-sm font-medium">IntruderNet Project • Built for Modern Web</p>
          <div className="flex justify-center space-x-6 text-xs opacity-60 font-mono">
             <span>YOLO11</span>
             <span>TFJS</span>
             <span>REACT</span>
             <span>TAILWIND</span>
          </div>
        </div>
      </footer>
    </div>
  );
};