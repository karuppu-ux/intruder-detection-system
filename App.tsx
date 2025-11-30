import React, { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { LandingPage } from './components/LandingPage';
import { ViewState } from './types';

function App() {
  const [view, setView] = useState<ViewState>('landing');

  return (
    <div className="antialiased text-slate-50">
      {view === 'landing' ? (
        <LandingPage onStart={() => setView('dashboard')} />
      ) : (
        <Dashboard />
      )}
    </div>
  );
}

export default App;