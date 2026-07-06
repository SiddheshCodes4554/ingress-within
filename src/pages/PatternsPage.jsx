import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Link2, Info, Activity } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';

const dotLabels = {
  strong: 'bg-[#E0A898]',
  shifting: 'bg-[#8DBFB4]',
  quiet: 'bg-primary/20 border border-primary/20',
  absent: 'bg-primary/5 border border-dashed border-primary/20',
  new: 'bg-[#B8A8D4]',
  newdot: 'bg-[#B8A8D4]',
  returned: 'bg-[#E0A898]/60 border border-[#E0A898]/40'
};

const legendItems = [
  { label: 'Strong', color: 'bg-[#E0A898]' },
  { label: 'Shifting', color: 'bg-[#8DBFB4]' },
  { label: 'Quiet', color: 'bg-primary/20 border border-primary/20' },
  { label: 'Not present', color: 'bg-primary/5 border border-dashed border-primary/20' },
  { label: 'New', color: 'bg-[#B8A8D4]' },
  { label: 'Returned', color: 'bg-[#E0A898]/60' }
];

const getStatusBadge = (status) => {
  switch (status) {
    case 'present':
      return { text: 'Present', className: 'bg-[#e0a898]/12 text-[#8a3020] border border-[#e0a898]/20' };
    case 'new':
      return { text: 'New', className: 'bg-[#B8A8D4]/15 text-[#5A4A8A] border border-[#B8A8D4]/20' };
    case 'shifting':
      return { text: 'Shifting', className: 'bg-[#8DBFB4]/12 text-[#1A5040] border border-[#8DBFB4]/20' };
    case 'quiet':
      return { text: 'Gone quiet', className: 'bg-primary/5 text-mid border border-primary/10' };
    case 'returned':
      return { text: 'Returned', className: 'bg-[#e0a898]/30 text-[#8a3020] border border-[#e0a898]/40' };
    default:
      return { text: 'Present', className: 'bg-[#e0a898]/12 text-[#8a3020] border border-[#e0a898]/20' };
  }
};

export default function PatternsPage({ user, profile, onSignOut }) {
  const [viewState, setViewState] = useState('list'); // 'list' | 'detail'
  const [overview, setOverview] = useState(null);
  const [activePatternDetail, setActivePatternDetail] = useState(null);
  const [activePatternId, setActivePatternId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [expandedCycles, setExpandedCycles] = useState({});
  const [isBackfilling, setIsBackfilling] = useState(false);

  useEffect(() => {
    async function loadPatterns() {
      try {
        const data = await DashboardService.fetchPatternOverview();
        setOverview(data);
      } catch (err) {
        console.error('[PatternsPage] Error fetching patterns overview:', err);
      } finally {
        setLoading(false);
      }
    }
    loadPatterns();
  }, []);

  const handleBackfill = async () => {
    setIsBackfilling(true);
    try {
      const response = await fetch('/api/patterns/backfill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      if (response.ok) {
        const data = await DashboardService.fetchPatternOverview();
        setOverview(data);
      } else {
        const err = await response.json();
        alert(err.error?.message || 'Failed to backfill patterns.');
      }
    } catch (err) {
      console.error('[PatternsPage] Error backfilling patterns:', err);
      alert('An unexpected error occurred during backfill.');
    } finally {
      setIsBackfilling(false);
    }
  };

  const handleOpenPattern = async (id) => {
    setActivePatternId(id);
    setViewState('detail');
    setDetailLoading(true);
    try {
      const detail = await DashboardService.fetchPatternDetail(id);
      setActivePatternDetail(detail);
      // Open the current cycle (first card in list) by default
      setExpandedCycles({ 0: true });
    } catch (err) {
      console.error('[PatternsPage] Error fetching pattern details:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleCycleCard = (index) => {
    setExpandedCycles(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const jumpToCycleCard = (cycleNumber) => {
    if (!activePatternDetail) return;
    const cycleIdx = activePatternDetail.timeline.length - cycleNumber;
    
    // Open target cycle card
    setExpandedCycles(prev => ({
      ...prev,
      [cycleIdx]: true
    }));
    
    // Smooth scroll down to card
    setTimeout(() => {
      const element = document.getElementById(`cycle-card-${cycleIdx}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20">
        <DashboardNavbar activeTab="patterns" />
        <main className="max-w-[680px] mx-auto px-6 pt-6 space-y-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 w-32 bg-[#1E2A2E]/10 rounded" />
            <div className="h-8 w-48 bg-[#1E2A2E]/10 rounded" />
            <div className="h-4 w-80 bg-[#1E2A2E]/10 rounded" />
            <div className="h-20 bg-[#1E2A2E]/5 rounded-xl" />
            <div className="space-y-3 pt-4">
              <div className="h-32 bg-[#1E2A2E]/5 rounded-xl" />
              <div className="h-32 bg-[#1E2A2E]/5 rounded-xl" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  const hasPatterns = overview?.isAvailable && overview?.patterns && overview.patterns.length > 0;

  if (!hasPatterns) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20">
        <DashboardNavbar activeTab="patterns" />
        <main className="max-w-[680px] mx-auto px-6 pt-6 space-y-4">
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} /> Back to dashboard
          </button>
          <div>
            <h1 className="font-serif text-[22px] text-primary mb-0.5 font-normal">Patterns</h1>
            <p className="text-xs text-mid">Recurring themes the system has identified across your writing. Not diagnoses — observations about what keeps showing up.</p>
          </div>
          
          {isBackfilling ? (
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-[#8DBFB4] animate-spin">
                <Activity size={24} />
              </div>
              <h3 className="text-sm font-bold text-primary">Analyzing Writing History...</h3>
              <p className="text-xs text-[#4A6A64] max-w-[320px] mx-auto leading-relaxed">
                Scanning historical journal entries, reflections, and weekly summaries. This takes about 30 seconds to run deep pattern synthesis.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center mx-auto text-[#8DBFB4]">
                <Activity size={24} />
              </div>
              <h3 className="text-sm font-bold text-primary">No patterns established yet</h3>
              <p className="text-xs text-[#4A6A64] max-w-[360px] mx-auto leading-relaxed">
                The Pattern Engine observes how your writing evolves across cycles. You can analyze your existing writing history now, or let it catch up dynamically as you complete cycles.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button 
                  onClick={handleBackfill}
                  className="px-4 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/95 transition-all cursor-pointer border-none"
                >
                  Analyze Writing History
                </button>
                <button 
                  onClick={() => window.navigateTo('/dashboard')}
                  className="px-4 py-2 rounded-lg bg-primary/5 text-primary border border-primary/10 text-xs font-semibold hover:bg-primary/10 transition-all cursor-pointer"
                >
                  Start writing
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Group patterns for display
  const presentPatterns = overview.patterns.filter(p => p.status === 'present' || p.status === 'new' || p.status === 'returned');
  const shiftingPatterns = overview.patterns.filter(p => p.status === 'shifting');
  const quietPatterns = overview.patterns.filter(p => p.status === 'quiet');

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <DashboardNavbar activeTab="patterns" />

      <main className="max-w-[680px] mx-auto px-6 pt-6">
        {viewState === 'list' && (
          <div className="space-y-4">
            <button 
              onClick={() => window.navigateTo('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>

            <div>
              <h1 className="font-serif text-[22px] text-primary mb-0.5 font-normal">Patterns</h1>
              <p className="text-xs text-mid">Recurring themes the system has identified across your writing. Not diagnoses — observations about what keeps showing up.</p>
            </div>

            <div className="text-[12px] italic text-[#8DBFB4] pb-0.5">
              Patterns surface, shift, and go quiet based on what your entries show. The system doesn't declare anything finished.
            </div>

            {/* Summary strip */}
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-2.5">
              <p className="text-[12.5px] text-primary leading-relaxed">
                {overview.summary.sentence}
              </p>
              <div className="flex gap-4 flex-wrap text-xs text-[#4A6A64]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#E0A898]" /> {overview.summary.present + overview.summary.new + overview.summary.returned} present
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#8DBFB4]" /> {overview.summary.shifting} shifting
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/30" /> {overview.summary.quiet} gone quiet
                </span>
              </div>
            </div>

            {/* Pattern Lists */}
            <div className="space-y-3.5">
              {presentPatterns.length > 0 && (
                <>
                  <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Present this cycle</div>
                  {presentPatterns.map(p => {
                    const badge = getStatusBadge(p.status);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#E0A898]" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary group-hover:text-[#E0A898] transition-colors">{p.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">{p.body}</p>
                        
                        {/* Timeline preview */}
                        <div className="space-y-1 mb-2.5">
                          <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across {p.timeline.length} cycles</div>
                          <div className="flex gap-2 flex-wrap">
                            {p.timeline.map((s, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {shiftingPatterns.length > 0 && (
                <>
                  <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase pt-1">Shifting</div>
                  {shiftingPatterns.map(p => {
                    const badge = getStatusBadge(p.status);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#8DBFB4]" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary group-hover:text-[#2E7A70] transition-colors">{p.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">{p.body}</p>
                        
                        {/* Timeline preview */}
                        <div className="space-y-1 mb-2.5">
                          <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across {p.timeline.length} cycles</div>
                          <div className="flex gap-2 flex-wrap">
                            {p.timeline.map((s, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}

              {quietPatterns.length > 0 && (
                <>
                  <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase pt-1">Gone quiet</div>
                  {quietPatterns.map(p => {
                    const badge = getStatusBadge(p.status);
                    return (
                      <div 
                        key={p.id}
                        onClick={() => handleOpenPattern(p.id)}
                        className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group opacity-85"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#1E2A2E]/15" />
                        <div className="flex justify-between items-center mb-1.5">
                          <h3 className="text-[14px] font-bold text-primary group-hover:text-primary transition-colors">{p.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">{p.body}</p>
                        
                        {/* Timeline preview */}
                        <div className="space-y-1 mb-2.5">
                          <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across {p.timeline.length} cycles</div>
                          <div className="flex gap-2 flex-wrap">
                            {p.timeline.map((s, idx) => (
                              <div key={idx} className="flex flex-col items-center">
                                <div className={`w-3 h-3 rounded-full ${dotLabels[s] || dotLabels.absent}`} />
                                <span className="text-[8px] font-mono text-mid/60 mt-0.5">{idx + 1}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-[10.5px] text-mid border-t border-[#1E2A2E]/5 pt-2.5 mt-2.5">
                          <span>{p.meta}</span>
                          <span className="font-semibold text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            See history <ArrowLeft size={11} className="rotate-180" />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        )}

        {/* Pattern Detail Screen */}
        {viewState === 'detail' && activePatternId && (
          <div className="space-y-4 max-w-[620px] mx-auto page-fade-enter-active">
            <button 
              onClick={() => setViewState('list')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to patterns
            </button>

            {detailLoading || !activePatternDetail ? (
              <div className="animate-pulse space-y-4">
                <div className="h-24 bg-white border border-[#1E2A2E]/10 rounded-xl" />
                <div className="h-16 bg-white border border-[#1E2A2E]/10 rounded-xl" />
                <div className="h-32 bg-white border border-[#1E2A2E]/10 rounded-xl" />
              </div>
            ) : (
              <>
                {/* Pattern Card Header */}
                <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-2.5">
                  <div className="flex justify-between items-start">
                    <h2 className="font-serif text-lg text-primary">{activePatternDetail.name}</h2>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${activePatternDetail.badgeClass}`}>
                      {getStatusBadge(activePatternDetail.status).text}
                    </span>
                  </div>
                  <p className="text-[12.5px] text-mid leading-relaxed">
                    {activePatternDetail.body}
                  </p>
                  <div className="text-[10.5px] text-[#8DBFB4] border-t border-[#1E2A2E]/5 pt-2.5 font-medium">
                    {activePatternDetail.meta}
                  </div>
                </div>

                {/* Orientation */}
                {activePatternDetail.orientation && (
                  <div className="bg-white border border-[#1E2A2E]/5 p-4 rounded-xl border-l-[2.5px] border-l-[#E0A898] space-y-1 font-serif text-[14px] text-[#1E2A2E] italic leading-relaxed">
                    {activePatternDetail.orientation}
                  </div>
                )}

                {/* Connection panel */}
                {activePatternDetail.connected && (
                  <div className="bg-white border border-[#B8A8D4]/25 rounded-xl p-4 flex gap-2.5 shadow-xs">
                    <div className="w-7 h-7 rounded-lg bg-[#B8A8D4]/10 text-[#5A4A8A] flex items-center justify-center shrink-0 mt-0.5">
                      <Link2 size={14} />
                    </div>
                    <div className="space-y-1.5 flex-1">
                      <div className="text-[9px] tracking-wider uppercase text-[#7A6A9E] font-bold">May be connected</div>
                      <p className="text-[12px] text-primary leading-relaxed">
                        {activePatternDetail.connectedBody}
                      </p>
                      <div className="flex gap-2 flex-wrap pt-0.5">
                        {activePatternDetail.connectedLinks.map(link => (
                          <button 
                            key={link.id}
                            onClick={() => handleOpenPattern(link.id)}
                            className="px-2.5 py-0.5 rounded-full bg-[#B8A8D4]/10 text-[#5A4A8A] border border-[#B8A8D4]/20 text-[10.5px] font-semibold hover:bg-[#B8A8D4]/20 transition-all cursor-pointer"
                          >
                            {link.label} →
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Interactive timeline dots */}
                <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-3">
                  <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                    How it has moved — tap a cycle to jump to it
                  </div>
                  <div className="overflow-x-auto pb-1.5 no-scrollbar">
                    <div className="flex min-w-max">
                      {activePatternDetail.timeline.map((item, idx) => {
                        const isCardEmpty = activePatternDetail.cycleData[item.n]?.entries.length === 0 &&
                          activePatternDetail.cycleData[item.n]?.obs.includes('Not present');
                        return (
                          <div 
                            key={idx} 
                            onClick={() => !isCardEmpty && jumpToCycleCard(item.n)}
                            className={`flex flex-col items-center w-[48px] relative ${isCardEmpty ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer group'}`}
                          >
                            {/* Horizontal connecting line */}
                            {idx < activePatternDetail.timeline.length - 1 && (
                              <div className="absolute top-[11px] left-[24px] right-[-24px] h-[2px] bg-[#1E2A2E]/5 z-0" />
                            )}
                            <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 transition-transform ${dotLabels[item.s] || dotLabels.absent} ${!isCardEmpty ? 'group-hover:scale-115' : ''}`}>
                              <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            </div>
                            <span className="text-[9px] font-bold text-primary mt-1">C{item.n}</span>
                            <span className="text-[7.5px] uppercase font-mono text-mid/60 mt-0.5 leading-none">
                              {item.l}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Legend */}
                  <div className="flex flex-wrap gap-x-3.5 gap-y-1.5 text-[9px] text-[#4A6A64] border-t border-[#1E2A2E]/5 pt-2.5">
                    {legendItems.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Cycle details list */}
                <div className="space-y-3">
                  <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                    Cycle by cycle — all {activePatternDetail.timeline.length}
                  </div>
                  <div className="space-y-2.5">
                    {Object.keys(activePatternDetail.cycleData)
                      .map(Number)
                      .sort((a, b) => b - a)
                      .map((cycleNum, idx) => {
                        const cd = activePatternDetail.cycleData[cycleNum];
                        const isAbsent = cd.obs.includes('Not present');
                        const isCur = cycleNum === activePatternDetail.timeline.length;
                        const timelineItem = activePatternDetail.timeline.find(t => t.n === cycleNum);
                        const timelineStatus = timelineItem ? timelineItem.s : 'absent';
                        const timelineLabel = timelineItem ? timelineItem.l : 'Not present';
                        const isExpanded = !!expandedCycles[idx];

                        return (
                          <div 
                            key={idx}
                            id={`cycle-card-${idx}`}
                            className={`bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden transition-all shadow-xs ${isAbsent ? 'opacity-55' : ''}`}
                          >
                            <div 
                              onClick={() => !isAbsent && toggleCycleCard(idx)}
                              className={`flex items-center justify-between p-3.5 transition-colors ${isAbsent ? 'cursor-default' : 'cursor-pointer hover:bg-[#F5F8F8]'}`}
                            >
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${isCur ? 'bg-[#e0a898]/12 text-[#8a3020]' : 'bg-mint-grey text-primary'}`}>
                                  {isCur ? 'Current' : 'Done'}
                                </span>
                                <span className="text-[13px] font-bold text-primary">Cycle {cycleNum}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${dotLabels[timelineStatus] || dotLabels.absent}`}>
                                  {timelineLabel}
                                </span>
                                {!isAbsent && (
                                  <ChevronDown size={14} className={`text-mid transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                )}
                              </div>
                            </div>

                            {isExpanded && !isAbsent && (
                              <div className="border-t border-[#1E2A2E]/5 p-4 bg-[#FAFBFB] space-y-3">
                                <div className="text-[12.5px] text-mid leading-relaxed italic">
                                  "{cd.obs}"
                                </div>
                                
                                {cd.entries && cd.entries.length > 0 && (
                                  <div className="space-y-2.5 border-t border-[#1E2A2E]/5 pt-3">
                                    <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">From the entries</div>
                                    {cd.entries.map((ent, entIdx) => (
                                      <div key={entIdx} className="bg-white border border-[#1E2A2E]/5 p-3.5 rounded-lg space-y-1">
                                        <p className="text-[12.5px] text-[#1E2A2E] italic leading-relaxed font-serif">
                                          {ent.t}
                                        </p>
                                        <div className="text-[10px] text-[#C0D4CE]">{ent.m}</div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}

                            {isAbsent && (
                              <div className="border-t border-[#1E2A2E]/5 px-4 py-2.5 bg-[#FAFBFB] text-xs text-[#8DBFB4] italic">
                                {cd.obs}
                              </div>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
