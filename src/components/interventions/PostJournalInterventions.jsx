import React, { useState, useEffect, Component } from 'react';
import { Wind, Compass, Activity, ShieldCheck, Heart, Sparkles, ArrowRight, X } from 'lucide-react';

class LocalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.warn('[PostJournalInterventions] Render error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return null;
    }
    return this.props.children;
  }
}

function PostJournalInterventionsInner({ isCrisis = false, onLaunchIntervention }) {
  const [loading, setLoading] = useState(true);
  const [coreDaily, setCoreDaily] = useState([]);
  const [crisisSupport, setCrisisSupport] = useState([]);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in current session
    if (typeof window !== 'undefined') {
      try {
        const dismissed = sessionStorage.getItem('iw_dismissed_post_journal_interventions') === 'true';
        setIsDismissed(dismissed);
      } catch (e) {
        console.warn('SessionStorage access error:', e);
      }
    }

    async function fetchRecommendations() {
      try {
        setLoading(true);
        const res = await fetch(`/api/interventions/recommended?postJournal=true&isCrisis=${isCrisis ? 'true' : 'false'}`);
        if (!res.ok) {
          throw new Error(`HTTP error ${res.status}`);
        }
        const json = await res.json();
        if (json && json.success && json.data) {
          setCoreDaily(Array.isArray(json.data.core_daily) ? json.data.core_daily : []);
          setCrisisSupport(Array.isArray(json.data.crisis_support) ? json.data.crisis_support : []);
        } else {
          throw new Error(json?.error || 'Invalid API response');
        }
      } catch (err) {
        console.warn('Failed to fetch post-journal intervention recommendations, using local defaults:', err);
        // Fallback default cards
        setCoreDaily([
          { id: 'anx_001', title: '4-7-8 Breathing', duration_minutes: 3, description: 'A slow-breathing technique to calm the nervous system when worry feels overwhelming.' },
          { id: 'anx_003', title: '5-4-3-2-1 Grounding', duration_minutes: 5, description: 'Uses the five senses to pull attention out of anxious thoughts and into the present moment.' },
          { id: 'str_002', title: 'Box Breathing', duration_minutes: 4, description: 'A structured breathing pattern used to quickly lower physiological stress.' }
        ]);
        if (isCrisis) {
          setCrisisSupport([
            { id: 'pan_001', title: 'Panic Attack Grounding Script', duration_minutes: 5, description: 'An in-the-moment grounding script to steady your mind and body.' },
            { id: 'slp_002', title: 'Body Scan for Relaxation', duration_minutes: 10, description: 'A guided attention practice to ease physical tension.' }
          ]);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [isCrisis]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('iw_dismissed_post_journal_interventions', 'true');
      } catch (e) {}
    }
  };

  const handleRestore = () => {
    setIsDismissed(false);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem('iw_dismissed_post_journal_interventions');
      } catch (e) {}
    }
  };

  const handleNavigateToInterventions = () => {
    if (typeof window !== 'undefined') {
      if (typeof window.navigateTo === 'function') {
        window.navigateTo('/interventions');
      } else {
        window.location.href = '/interventions';
      }
    }
  };

  if (isDismissed) {
    return (
      <div className="pt-4 pb-2 flex justify-center">
        <button
          onClick={handleRestore}
          className="text-xs text-mid hover:text-primary underline cursor-pointer bg-transparent border-none font-serif italic"
        >
          Show suggested practices
        </button>
      </div>
    );
  }

  const getIconForIntervention = (item, idx) => {
    const type = String(item?.type || '').toLowerCase();
    const title = String(item?.title || '').toLowerCase();

    if (type.includes('breathing') || title.includes('breathing')) return <Wind size={18} className="text-accent" />;
    if (type.includes('grounding') || title.includes('grounding')) return <Compass size={18} className="text-[#5A4A8A]" />;
    if (type.includes('relaxation') || title.includes('body')) return <Activity size={18} className="text-[#1A5040]" />;
    if (isCrisis) return <ShieldCheck size={18} className="text-accent" />;
    return <Sparkles size={18} className="text-secondary" />;
  };

  const safeCoreDaily = Array.isArray(coreDaily) ? coreDaily : [];
  const safeCrisisSupport = Array.isArray(crisisSupport) ? crisisSupport : [];

  return (
    <div className="space-y-8 animate-fade-in pt-4">
      {/* 1. CORE DAILY INTERVENTIONS SECTION */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-[#8DBFB4] font-bold">
              Core Daily Practices
            </div>
            <h3 className="font-serif text-xl text-primary font-medium">
              Take a minute for yourself
            </h3>
            <p className="text-xs text-mid font-serif italic">
              Small practices that may help you reset before moving on.
            </p>
          </div>

          <button
            onClick={handleDismiss}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] text-mid hover:text-primary hover:bg-[#1E2A2E]/5 rounded-lg transition-colors cursor-pointer border border-[#1E2A2E]/10"
            title="Dismiss for this session"
          >
            <X size={12} />
            <span>Dismiss</span>
          </button>
        </div>

        {loading ? (
          <div className="grid sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-mint-grey/50 rounded-2xl animate-pulse border border-[#1E2A2E]/5" />
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-3">
            {safeCoreDaily.map((item, idx) => (
              <div
                key={item?.id || idx}
                className="bg-[#F8FAF9] hover:bg-white border border-[#1E2A2E]/10 hover:border-accent/30 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs hover:shadow-sm group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center shadow-xs border border-[#1E2A2E]/5">
                      {getIconForIntervention(item, idx)}
                    </div>
                    <span className="px-2 py-0.5 bg-[#8DBFB4]/15 text-[#1A5040] text-[10px] font-mono font-semibold rounded-full">
                      {item?.duration_minutes || item?.estimated_duration || 5} min
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-primary group-hover:text-accent transition-colors line-clamp-1">
                    {item?.title || 'Practice'}
                  </h4>

                  <p className="text-[11.5px] text-mid leading-relaxed line-clamp-2 font-serif">
                    {item?.description || ''}
                  </p>
                </div>

                <button
                  onClick={() => onLaunchIntervention && item?.id && onLaunchIntervention(item.id)}
                  className="w-full py-2 bg-primary text-white hover:bg-[#2A3A3E] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center border-none shadow-xs group-hover:shadow-sm"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. CRISIS SUPPORT INTERVENTIONS SECTION (If Crisis == TRUE) */}
      {isCrisis && safeCrisisSupport.length > 0 && (
        <div className="space-y-4 pt-2 border-t border-[#1E2A2E]/10">
          <div className="space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-accent font-bold">
              Targeted Crisis Support
            </div>
            <h3 className="font-serif text-xl text-primary font-medium">
              Extra support for moments like this
            </h3>
            <p className="text-xs text-mid font-serif italic">
              Gentle, evidence-based practices designed to ground and steady your body right now.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            {safeCrisisSupport.map((item, idx) => (
              <div
                key={item?.id || idx}
                className="bg-[#FFF9F8] hover:bg-white border border-accent/20 hover:border-accent/40 rounded-2xl p-4 flex flex-col justify-between space-y-3 transition-all shadow-xs hover:shadow-sm group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-xl bg-accent/15 flex items-center justify-center text-accent">
                      <ShieldCheck size={18} />
                    </div>
                    <span className="px-2 py-0.5 bg-accent/15 text-accent text-[10px] font-mono font-semibold rounded-full">
                      {item?.duration_minutes || item?.estimated_duration || 5} min
                    </span>
                  </div>

                  <h4 className="font-serif text-sm font-semibold text-primary group-hover:text-accent transition-colors line-clamp-1">
                    {item?.title || 'Crisis Practice'}
                  </h4>

                  <p className="text-[11.5px] text-mid leading-relaxed line-clamp-2 font-serif">
                    {item?.description || ''}
                  </p>
                </div>

                <button
                  onClick={() => onLaunchIntervention && item?.id && onLaunchIntervention(item.id)}
                  className="w-full py-2 bg-accent text-white hover:bg-accent/90 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center border-none shadow-xs"
                >
                  Start
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. BROWSE INTERVENTION BANK DIRECT LINK */}
      <div className="pt-2 flex justify-center">
        <button
          onClick={handleNavigateToInterventions}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-accent transition-colors cursor-pointer bg-transparent border-none group"
        >
          <span>Browse the Intervention Bank</span>
          <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>
    </div>
  );
}

export function PostJournalInterventions(props) {
  return (
    <LocalErrorBoundary>
      <PostJournalInterventionsInner {...props} />
    </LocalErrorBoundary>
  );
}
