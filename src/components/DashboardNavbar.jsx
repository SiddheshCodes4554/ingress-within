import React from 'react';
import { User } from 'lucide-react';

export default function DashboardNavbar({ activeTab }) {
  const getTabClass = (tab) => {
    const isActive = activeTab === tab;
    return `text-[12px] font-semibold uppercase tracking-wider pb-0.5 border-b-2 transition-all cursor-pointer ${
      isActive 
        ? 'text-primary border-secondary font-semibold' 
        : 'text-mid hover:text-primary border-transparent hover:border-primary/10 font-medium'
    }`;
  };

  return (
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
          <button className={getTabClass('reports')} onClick={() => window.navigateTo('/reports')}>Reports</button>
          <button className={getTabClass('patterns')} onClick={() => window.navigateTo('/patterns')}>Patterns</button>
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
  );
}
