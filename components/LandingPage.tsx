import React from 'react';
import { ChevronRight, Eye, Brain, Shield, ShieldCheck, Lock, Smartphone, FileText, Activity, AlertTriangle, Scan } from 'lucide-react';
import { MOCK_FEATURES } from '../constants';

interface LandingPageProps {
  onStart: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-cyan-500/30">
      {/* Navbar */}
      <nav className="border-b border-slate-800/50 bg-slate-950/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
           <div className="flex items-center space-x-2">
              <ShieldCheck className="w-8 h-8 text-cyan-500" />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">IntruderNet</span>
           </div>
           <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
              <a href="#features" className="hover:text-cyan-400 transition-colors">How It Works</a>
              <a href="#privacy" className="hover:text-cyan-400 transition-colors">Privacy</a>
              <a href="#demo" className="hover:text-cyan-400 transition-colors">Use Cases</a>
           </div>
           <button 
             onClick={onStart}
             className="bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-2 rounded-full font-semibold transition-all shadow-lg shadow-cyan-900/20 hover:shadow-cyan-500/30 transform hover:-translate-y-0.5"
           >
             Launch Dashboard
           </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-cyan-500/10 rounded-full blur-[100px] -z-10"></div>
        <div className="max-w-7xl mx-auto px-6 text-center">
           <div className="inline-flex items-center space-x-2 bg-slate-900/50 border border-slate-800 rounded-full px-4 py-1.5 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-slate-300">Powered by YOLO11 & LSTM</span>
           </div>
           
           <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-8">
             A Security Guard That <br/>
             <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Actually Understands.</span>
           </h1>
           
           <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
             IntruderNet upgrades your security with <span className="text-slate-200 font-semibold">YOLO11 Pose Estimation</span>. It doesn't just see movement; it understands complex actions like crawling vs. walking.
           </p>
           
           <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                onClick={onStart}
                className="w-full sm:w-auto px-8 py-4 bg-white text-slate-950 rounded-lg font-bold text-lg hover:bg-slate-200 transition-colors flex items-center justify-center group"
              >
                Try Live Simulator
                <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              <button className="w-full sm:w-auto px-8 py-4 bg-slate-800 text-white rounded-lg font-bold text-lg hover:bg-slate-700 transition-colors border border-slate-700">
                View Source Code
              </button>
           </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">The Magic Behind The Scenes</h2>
            <p className="text-slate-400">Next-gen AI technology, explained simply.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {MOCK_FEATURES.map((feature, idx) => (
              <div key={idx} className="bg-slate-950 p-8 rounded-2xl border border-slate-800 hover:border-cyan-500/50 transition-colors group">
                <div className="w-14 h-14 bg-slate-900 rounded-xl flex items-center justify-center mb-6 group-hover:bg-cyan-500/10 transition-colors">
                  {feature.icon === 'eye' && <Eye className="w-7 h-7 text-cyan-400" />}
                  {feature.icon === 'brain' && <Brain className="w-7 h-7 text-purple-400" />}
                  {feature.icon === 'shield-alert' && <Shield className="w-7 h-7 text-emerald-400" />}
                </div>
                <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                <h4 className="text-sm font-mono text-cyan-500 mb-4">{feature.subtitle}</h4>
                <p className="text-slate-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Features Preview */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">
           <div>
             <h2 className="text-3xl font-bold mb-6">Cool Features to Show Off</h2>
             <div className="space-y-6">
                <div className="flex items-start space-x-4">
                   <div className="bg-slate-800 p-3 rounded-lg"><Smartphone className="w-6 h-6 text-blue-400"/></div>
                   <div>
                     <h3 className="font-bold text-lg">QR Code Access</h3>
                     <p className="text-slate-400">Scan a code on the screen to instantly view the security feed on your mobile device.</p>
                   </div>
                </div>
                <div className="flex items-start space-x-4">
                   <div className="bg-slate-800 p-3 rounded-lg"><Lock className="w-6 h-6 text-emerald-400"/></div>
                   <div>
                     <h3 className="font-bold text-lg">Privacy First</h3>
                     <p className="text-slate-400">The system only sees "Stick Figures". No faces, no clothes, no personal identity is stored.</p>
                   </div>
                </div>
                <div className="flex items-start space-x-4">
                   <div className="bg-slate-800 p-3 rounded-lg"><FileText className="w-6 h-6 text-amber-400"/></div>
                   <div>
                     <h3 className="font-bold text-lg">Auto-Reports</h3>
                     <p className="text-slate-400">Generates daily PDF summaries of suspicious activities so you don't have to watch 24/7.</p>
                   </div>
                </div>
             </div>
           </div>
           
           {/* Visual Element - Mock Dashboard */}
           <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl transform rotate-2 scale-105 blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
              
              {/* Dashboard Mockup Container */}
              <div className="relative bg-slate-950 border border-slate-700 rounded-xl overflow-hidden shadow-2xl">
                 {/* Mock Header */}
                 <div className="h-10 bg-slate-900 border-b border-slate-800 flex items-center px-4 space-x-2">
                    <div className="flex space-x-1.5">
                       <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-amber-500/50"></div>
                       <div className="w-3 h-3 rounded-full bg-emerald-500/50"></div>
                    </div>
                    <div className="ml-4 h-4 w-32 bg-slate-800 rounded-full"></div>
                 </div>
                 
                 {/* Mock Content */}
                 <div className="flex h-64">
                    {/* Sidebar */}
                    <div className="w-12 border-r border-slate-800 bg-slate-900/50 flex flex-col items-center py-4 space-y-4">
                       <div className="w-6 h-6 bg-slate-800 rounded"></div>
                       <div className="w-6 h-6 bg-slate-800 rounded"></div>
                       <div className="w-6 h-6 bg-cyan-900/50 rounded border border-cyan-500/30"></div>
                    </div>
                    
                    {/* Main Feed */}
                    <div className="flex-1 p-3 bg-slate-950 relative overflow-hidden">
                       <div className="w-full h-full bg-slate-900 rounded-lg border border-slate-800 relative flex items-center justify-center overflow-hidden">
                           {/* Simulated Camera Feed Content */}
                           <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-800">
                              {/* Grid Lines */}
                              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.1 }}></div>
                              
                              {/* Skeleton Mockup */}
                              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-48">
                                  {/* Head */}
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full border-2 border-yellow-400 bg-yellow-400/20"></div>
                                  {/* Body Lines */}
                                  <div className="absolute top-8 left-1/2 -translate-x-1/2 w-0.5 h-16 bg-cyan-400"></div>
                                  {/* Arms */}
                                  <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-0.5 bg-cyan-400"></div>
                                  <div className="absolute top-10 left-4 w-0.5 h-12 bg-cyan-400 origin-top transform rotate-12"></div>
                                  <div className="absolute top-10 right-4 w-0.5 h-12 bg-cyan-400 origin-top transform -rotate-12"></div>
                                  {/* Legs */}
                                  <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-16 h-0.5 bg-cyan-400"></div>
                                  <div className="absolute bottom-24 left-8 w-0.5 h-24 bg-cyan-400 origin-top transform -rotate-12"></div>
                                  <div className="absolute bottom-24 right-8 w-0.5 h-24 bg-cyan-400 origin-top transform rotate-12"></div>
                                  
                                  {/* Bounding Box */}
                                  <div className="absolute -inset-4 border-2 border-red-500/50 rounded-lg"></div>
                                  <div className="absolute -top-8 left-0 bg-red-500 text-white text-[10px] font-bold px-1 rounded">CRAWLING 94%</div>
                              </div>
                           </div>
                       </div>
                    </div>
                    
                    {/* Right Panel */}
                    <div className="w-32 border-l border-slate-800 bg-slate-900/30 p-2 space-y-2">
                       <div className="h-2 w-12 bg-slate-700 rounded mb-3"></div>
                       <div className="h-10 bg-red-500/10 border border-red-500/30 rounded p-1.5">
                          <div className="h-1.5 w-8 bg-red-500/50 rounded mb-1"></div>
                          <div className="h-1 w-16 bg-slate-700 rounded"></div>
                       </div>
                       <div className="h-10 bg-slate-800 rounded p-1.5">
                          <div className="h-1.5 w-8 bg-emerald-500/50 rounded mb-1"></div>
                          <div className="h-1 w-16 bg-slate-700 rounded"></div>
                       </div>
                       <div className="h-10 bg-slate-800 rounded p-1.5">
                          <div className="h-1.5 w-8 bg-emerald-500/50 rounded mb-1"></div>
                          <div className="h-1 w-16 bg-slate-700 rounded"></div>
                       </div>
                    </div>
                 </div>
                 
                 {/* Floating Alert Toast Mockup */}
                 <div className="absolute bottom-4 right-4 bg-slate-800/90 backdrop-blur border border-red-500/30 p-3 rounded-lg shadow-xl flex items-center space-x-3">
                    <div className="p-1.5 bg-red-500/20 rounded-full">
                       <AlertTriangle className="w-4 h-4 text-red-500" />
                    </div>
                    <div>
                       <div className="h-2 w-20 bg-slate-600 rounded mb-1"></div>
                       <div className="h-1.5 w-24 bg-slate-700 rounded"></div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-500">
          <p className="mb-4">IntruderNet Project - Built for Google Colab & Web</p>
          <p className="text-sm">YOLO11 • LSTM • React • Tailwind</p>
        </div>
      </footer>
    </div>
  );
};