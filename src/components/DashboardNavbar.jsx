import React from 'react';
import { User, Home, PenLine, FileText, TrendingUp, Settings, BookOpen, Compass } from 'lucide-react';

export default function DashboardNavbar({ activeTab }) {
  const isMobileNavHidden = typeof window !== 'undefined' && (
    window.location.pathname.startsWith('/session') || 
    window.location.pathname.startsWith('/write')
  );

  const getTabClass = (tab) => {
    const isActive = activeTab === tab;
    return `text-[12px] font-semibold uppercase tracking-wider pb-0.5 border-b-2 transition-all cursor-pointer ${
      isActive 
        ? 'text-primary border-secondary font-semibold' 
        : 'text-mid hover:text-primary border-transparent hover:border-primary/10 font-medium'
    }`;
  };

  const getMobileTabClass = (tab) => {
    const isActive = activeTab === tab;
    return `flex flex-col items-center justify-center flex-1 py-1 text-[9px] font-bold uppercase tracking-widest transition-all cursor-pointer border-none bg-transparent relative ${
      isActive ? 'text-primary font-semibold' : 'text-mid/50 hover:text-primary font-medium'
    }`;
  };

  return (
    <>
      <header className="glass-nav border-b border-[#1E2A2E]/5 px-6 py-4 sticky top-0 z-50 bg-[#ECEFF0]/85 backdrop-blur-md">
        <div className="max-w-[1140px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3 font-semibold text-[15px] cursor-pointer" onClick={() => window.navigateTo('/dashboard')}>
            <div className="w-[22px] h-[22px] rounded-full border border-secondary flex items-center justify-center">
              <div className="w-[6px] h-[6px] rounded-full bg-secondary" />
            </div>
            <span className="tracking-tight">ingress <em className="text-secondary font-serif not-italic">within</em></span>
          </div>
          
          <nav className="hidden md:flex gap-6">
            <button className={getTabClass('home')} onClick={() => window.navigateTo('/dashboard')}>Home</button>
            <button className={getTabClass('write')} onClick={() => window.navigateTo('/write')}>Write</button>
            <button className={getTabClass('interventions')} onClick={() => window.navigateTo('/interventions')}>Interventions</button>
            <button className={getTabClass('reports')} onClick={() => window.navigateTo('/reports')}>Reports</button>
            <button className={getTabClass('patterns')} onClick={() => window.navigateTo('/patterns')}>Patterns</button>
            <button className={getTabClass('knowledge')} onClick={() => window.navigateTo('/knowledge')}>Knowledge</button>
            <button className={getTabClass('settings')} onClick={() => window.navigateTo('/settings')}>Settings</button>
          </nav>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => window.navigateTo('/support')}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                activeTab === 'support' 
                  ? 'bg-[#E0A898] border-[#E0A898] text-[#1E2A2E]' 
                  : 'bg-[#E0A898]/15 border-[#E0A898]/30 text-[#8a3020] hover:bg-[#E0A898]/25'
              }`}
            >
              Find Support
            </button>
            <button 
              onClick={() => window.navigateTo('/settings')}
              className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all cursor-pointer ${
                activeTab === 'settings' 
                  ? 'bg-primary border-primary text-white' 
                  : 'bg-white border-[#1E2A2E]/10 text-mid hover:border-primary/30'
              }`}
              title="Settings"
            >
              <User size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      {!isMobileNavHidden && (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#ECEFF0]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 flex items-center justify-around py-1 shadow-[0_-4px_24px_rgba(30,42,46,0.04)] px-2 pb-safe">
          <button onClick={() => window.navigateTo('/dashboard')} className={getMobileTabClass('home')}>
            <Home size={17} className={activeTab === 'home' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Home</span>
            {activeTab === 'home' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
          <button onClick={() => window.navigateTo('/write')} className={getMobileTabClass('write')}>
            <PenLine size={17} className={activeTab === 'write' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Write</span>
            {activeTab === 'write' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
          <button onClick={() => window.navigateTo('/interventions')} className={getMobileTabClass('interventions')}>
            <Compass size={17} className={activeTab === 'interventions' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Practice</span>
            {activeTab === 'interventions' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
          <button onClick={() => window.navigateTo('/reports')} className={getMobileTabClass('reports')}>
            <FileText size={17} className={activeTab === 'reports' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Reports</span>
            {activeTab === 'reports' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
          <button onClick={() => window.navigateTo('/patterns')} className={getMobileTabClass('patterns')}>
            <TrendingUp size={17} className={activeTab === 'patterns' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Patterns</span>
            {activeTab === 'patterns' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
          <button onClick={() => window.navigateTo('/knowledge')} className={getMobileTabClass('knowledge')}>
            <BookOpen size={17} className={activeTab === 'knowledge' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Knowledge</span>
            {activeTab === 'knowledge' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
          <button onClick={() => window.navigateTo('/settings')} className={getMobileTabClass('settings')}>
            <Settings size={17} className={activeTab === 'settings' ? 'text-secondary mb-0.5' : 'text-mid/50 mb-0.5'} />
            <span>Settings</span>
            {activeTab === 'settings' && <div className="absolute bottom-0 w-1 h-1 rounded-full bg-secondary" />}
          </button>
        </nav>
      )}
    </>
  );
}
