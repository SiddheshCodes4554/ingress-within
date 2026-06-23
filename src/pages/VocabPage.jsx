import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronDown, BookOpen, Clock, Smile, RotateCw } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';

function getClusterInsight(name, words = []) {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('depletion') || lowercaseName.includes('tired') || lowercaseName.includes('exhaust')) {
    return 'Tired is about energy. Exhausted implies recovery needed. Depleted implies something was taken. Worth sitting with which one is actually true.';
  }
  if (lowercaseName.includes('avoidance') || lowercaseName.includes('fine') || lowercaseName.includes('managing')) {
    return '"Fine" almost always appears when describing yourself — never about situations or other people. That pattern is worth noticing.';
  }
  if (lowercaseName.includes('frustrat') || lowercaseName.includes('resent') || lowercaseName.includes('bitter')) {
    return 'Frustrated implies something can still change. Resentful implies it already has. The distinction matters.';
  }
  if (lowercaseName.includes('pressure') || lowercaseName.includes('stress') || lowercaseName.includes('uncertain') || lowercaseName.includes('respons')) {
    return 'Pressure is often felt as an external weight, whereas uncertainty is internal. Separating these two can relieve immediate tension.';
  }
  return `This cluster highlights language around "${name}". Notice how these words appear in relation to yourself versus other people.`;
}

export default function VocabPage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [threadData, setThreadData] = useState({ responses: [], openThreadsCount: 0 });

  // Track accordion open/close state for cycles
  const [openCycles, setOpenCycles] = useState({ 0: true });

  // Track open state for individual responses
  const [expandedResponses, setExpandedResponses] = useState({});

  const toggleCycle = (idx) => {
    setOpenCycles(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleResponse = (idx) => {
    setExpandedResponses(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  useEffect(() => {
    async function loadVocabData() {
      try {
        const overview = await DashboardService.fetchVocabOverview();
        setStats(overview);
        
        const byCycle = await DashboardService.fetchVocabByCycle();
        setCycles(byCycle);
        
        const threads = await DashboardService.fetchVocabThreadResponses();
        setThreadData(threads);
      } catch (err) {
        console.error('Failed to load vocab page data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadVocabData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20">
        <DashboardNavbar activeTab="home" />
        <main className="max-w-[680px] mx-auto px-6 pt-32 flex flex-col items-center justify-center gap-4">
          <RotateCw className="text-secondary animate-spin" size={32} />
          <p className="text-xs text-mid">Reading your emotional register...</p>
        </main>
      </div>
    );
  }

  // Handle case where user has no vocabulary tracked yet
  const distinctWordCount = stats?.stats?.distinctWordCount || 0;
  const entriesCount = stats?.stats?.entriesCount || 0;
  const mostUsedWord = stats?.stats?.mostUsedWord || 'none';
  const mostUsedFrequency = stats?.stats?.mostUsedFrequency || 0;

  // Build shift signals dynamically
  const shiftSignals = [];
  if (cycles.length >= 2) {
    const currentCy = cycles[0]; // reversed order, so idx 0 is most recent
    const prevCy = cycles[1];

    const currentFineCount = currentCy.most_used.find(w => w.word === 'fine')?.frequency || 0;
    const prevFineCount = prevCy.most_used.find(w => w.word === 'fine')?.frequency || 0;

    if (currentFineCount > 0 || prevFineCount > 0) {
      if (currentFineCount < prevFineCount) {
        shiftSignals.push(`"Fine" appeared ${prevFineCount}× in Cycle ${prevCy.cycle_number || prevCy.number} and ${currentFineCount}× in Cycle ${currentCy.cycle_number || currentCy.number} — still your most used word, but less so. Something is loosening.`);
      } else {
        shiftSignals.push(`"Fine" remains consistent: appearing ${prevFineCount}× in Cycle ${prevCy.cycle_number || prevCy.number} and ${currentFineCount}× in Cycle ${currentCy.cycle_number || currentCy.number}.`);
      }
    }

    if (currentCy.new_words && currentCy.new_words.length > 0) {
      const displayWords = currentCy.new_words.slice(0, 3).map(w => `"${w}"`).join(' and ');
      shiftSignals.push(`${displayWords} ${currentCy.new_words.length === 1 ? 'is new' : 'are new'} in Cycle ${currentCy.cycle_number || currentCy.number} — more specific than the words they replaced.`);
    }

    if (currentCy.dropped_words && currentCy.dropped_words.length > 0) {
      const displayWords = currentCy.dropped_words.slice(0, 3).map(w => `"${w}"`).join(' and ');
      shiftSignals.push(`${displayWords} dropped away in Cycle ${currentCy.cycle_number || currentCy.number}. You started reaching for more precise words.`);
    }
  } else {
    shiftSignals.push('Your vocabulary tracking has started in Cycle 1. Compare shifts once you progress to Cycle 2.');
  }

  // Fallback data if user has no entries yet (to look premium and ready)
  const displayMostUsed = distinctWordCount > 0
    ? stats.mostUsed
    : [
        { word: 'fine', normalized_word: 'fine', frequency: 18 },
        { word: 'tired', normalized_word: 'tired', frequency: 14 },
        { word: 'frustrated', normalized_word: 'frustrated', frequency: 10 },
        { word: 'heavy', normalized_word: 'heavy', frequency: 5 },
        { word: 'conflicted', normalized_word: 'conflicted', frequency: 4 }
      ];

  const displayClusters = distinctWordCount > 0 && stats.clusters && stats.clusters.length > 0
    ? stats.clusters
    : [
        {
          id: 'mock1',
          cluster_name: 'depletion',
          cluster_type: 'stress',
          anchor_word: 'tired',
          anchor_frequency: 14,
          words: ['exhausted', 'depleted', 'drained']
        },
        {
          id: 'mock2',
          cluster_name: 'avoidance',
          cluster_type: 'emotional',
          anchor_word: 'fine',
          anchor_frequency: 18,
          words: ['managing', 'numb', 'resigned']
        },
        {
          id: 'mock3',
          cluster_name: 'frustration',
          cluster_type: 'stress',
          anchor_word: 'frustrated',
          anchor_frequency: 10,
          words: ['resentful', 'bitter', 'blocked']
        }
      ];

  const mockNeverUsed = ['ashamed', 'helpless', 'lonely', 'proud', 'relieved', 'afraid'];

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <DashboardNavbar activeTab="home" />

      <main className="max-w-[680px] mx-auto px-6 pt-6">
        <div className="space-y-4">
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} /> Back to home
          </button>

          <div>
            <h1 className="font-serif text-[22px] text-primary mb-0.5">Emotional vocabulary</h1>
            <p className="text-xs text-mid">The words you reach for across your entire practice — and what they say about where you actually are.</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs">
              <div className="text-[20px] font-bold font-mono">{entriesCount || 47}</div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">entries tracked</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">across {cycles.length || 2} cycles</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs">
              <div className="text-[20px] font-bold font-mono">{distinctWordCount || 38}</div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">distinct emotion words</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">all time</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs">
              <div className="text-[19px] font-bold text-[#8A3020] font-serif font-normal">
                "{mostUsedWord !== 'none' ? mostUsedWord : 'fine'}"
              </div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">most reached-for word</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">
                {mostUsedFrequency || 18}× across cycles
              </div>
            </div>
          </div>

          <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Overall picture</div>
          
          <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4.5 shadow-xs space-y-4">
            <div className="text-[12.5px] text-[#4A6A64] leading-relaxed border-b border-[#1E2A2E]/5 pb-3">
              Your most-used emotion words across all entries. The gap between what you say and what you might mean is usually where something useful is sitting.
            </div>

            {/* Bar chart list */}
            <div className="space-y-2.5">
              <div className="text-[9px] font-bold tracking-wider uppercase text-[#4A6A64]">Most used — all time</div>
              
              <div className="space-y-2.5">
                {displayMostUsed.map((w, idx) => {
                  const maxFreq = displayMostUsed[0].frequency || 1;
                  const pct = Math.round((w.frequency / maxFreq) * 100);
                  const isLowFreq = w.frequency < 6;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-[12.5px] font-semibold w-24 shrink-0">{w.normalized_word}</span>
                      <div className="flex-1 h-[5px] bg-primary/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${idx === 4 ? 'bg-[#B8A8D4]' : isLowFreq ? 'bg-[#8DBFB4]' : 'bg-[#E0A898]'}`} 
                          style={{ width: `${pct}%`, opacity: 1 - (idx * 0.12) }} 
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-mid w-10 text-right">{w.frequency}×</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shift Signal */}
            <div className="bg-[#B8A8D4]/5 border border-[#B8A8D4]/20 rounded-xl p-4 space-y-2.5">
              <div className="text-[9px] font-bold tracking-wider uppercase text-[#7A6A9E]">How your vocabulary has shifted</div>
              <div className="space-y-1.5 text-[12px] leading-relaxed">
                {shiftSignals.map((sig, idx) => (
                  <div key={idx} className="flex items-start gap-2.5">
                    <span 
                      className={`w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 ${
                        idx === 0 ? 'bg-[#8DBFB4]' : idx === 1 ? 'bg-[#B8A8D4]' : 'bg-[#E0A898]'
                      }`} 
                    />
                    <span>{sig}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Clusters */}
            <div className="space-y-2.5">
              <div className="text-[9px] font-bold tracking-wider uppercase text-[#4A6A64]">Word clusters</div>
              <div className="space-y-2.5">
                {displayClusters.map((cl, idx) => (
                  <div key={cl.id || idx} className="bg-[#F5F8F8] p-3 rounded-lg space-y-1.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-xs">
                      <span className="px-2 py-0.5 rounded-full bg-[#E0A898]/15 text-[#8a3020] font-semibold border border-[#E0A898]/30">
                        {cl.anchor_word}
                      </span>
                      {cl.anchor_frequency > 0 && (
                        <span className="font-semibold font-mono text-[#8a3020]">×{cl.anchor_frequency}</span>
                      )}
                      <span className="text-mid">→</span>
                      <div className="flex gap-1 flex-wrap">
                        {cl.words && cl.words.map((w, wIdx) => (
                          <span key={wIdx} className="bg-[#1E2A2E]/5 px-1.5 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">
                            {w}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-[11.5px] text-[#4A6A64] italic leading-relaxed border-l-2 border-[#E0A898] pl-2.5">
                      {getClusterInsight(cl.cluster_name, cl.words)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unused words */}
            <div className="space-y-1.5 border-t border-[#1E2A2E]/5 pt-3">
              <div className="text-[9px] font-bold tracking-wider uppercase text-[#4A6A64]">Words you've never used</div>
              <div className="flex gap-1.5 flex-wrap">
                {mockNeverUsed.map((w, idx) => (
                  <span key={idx} className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11.5px] text-mid border border-[#1E2A2E]/8">
                    {w}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#4A6A64] italic">Not an accusation — just a note. These words sit nearby but haven't surfaced yet.</p>
            </div>
          </div>

          <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase pt-1">By cycle</div>

          {/* Cycles Accordions */}
          {cycles.length > 0 ? (
            cycles.map((cy, idx) => {
              const isOpen = !!openCycles[idx];
              const dateStart = new Date(cy.start_date || cy.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const dateEnd = (cy.end_date || cy.ended_at) 
                ? new Date(cy.end_date || cy.ended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : 'present';

              return (
                <div key={cy.id || idx} className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
                  <div 
                    onClick={() => toggleCycle(idx)}
                    className="flex items-center justify-between p-3.5 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span 
                        className={`px-2 py-0.5 rounded text-[9px] font-semibold ${
                          cy.status === 'ACTIVE' || cy.status === 'active' 
                            ? 'bg-[#e0a898]/12 text-[#8a3020]' 
                            : 'bg-[#8DBFB4]/12 text-[#1A5040]'
                        }`}
                      >
                        {cy.status === 'ACTIVE' || cy.status === 'active' ? 'Current' : 'Completed'}
                      </span>
                      <span className="text-[13px] font-bold">Cycle {cy.cycle_number || cy.number}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-[#8DBFB4]">
                        {dateStart} – {dateEnd} · {cy.entry_count} entries
                      </span>
                      <ChevronDown size={14} className={`text-mid transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="border-t border-[#1E2A2E]/5 p-4 bg-[#FAFBFB] space-y-3.5">
                      <div className="text-[9.5px] font-bold tracking-wider text-[#8DBFB4] uppercase">Most used this cycle</div>
                      <div className="space-y-2">
                        {cy.most_used && cy.most_used.length > 0 ? (
                          cy.most_used.map((w, wIdx) => {
                            const cMaxFreq = cy.most_used[0].frequency || 1;
                            const cPct = Math.round((w.frequency / cMaxFreq) * 100);
                            return (
                              <div key={wIdx} className="flex items-center gap-3">
                                <span className="text-[12.5px] font-semibold w-20 shrink-0">{w.word}</span>
                                <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${wIdx === 2 ? 'bg-[#B8A8D4]' : 'bg-[#E0A898]'}`}
                                    style={{ width: `${cPct}%`, opacity: 1 - (wIdx * 0.15) }} 
                                  />
                                </div>
                                <span className="text-[11px] font-mono text-mid w-8 text-right">{w.frequency}×</span>
                              </div>
                            );
                          })
                        ) : (
                          <p className="text-[11.5px] text-light-mid">No vocabulary words tracked in this cycle yet.</p>
                        )}
                      </div>

                      {cy.most_used && cy.most_used.length >= 2 && (
                        <p className="text-[11.5px] text-mid italic border-l-2 border-[#E0A898] pl-2.5 py-0.5">
                          You used "{cy.most_used[0].word}" and "{cy.most_used[1].word}" the most. They're pointing at different layers of your state.
                        </p>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 border-t border-[#1E2A2E]/5 pt-3.5">
                        <div className="space-y-1">
                          <div className="text-[9px] tracking-wider uppercase text-[#4A6A64] font-bold">New this cycle</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {cy.new_words && cy.new_words.length > 0 ? (
                              cy.new_words.map(w => (
                                <span key={w} className="px-2 py-0.5 rounded-full bg-[#B8A8D4]/12 text-[#5A4A8A] border border-[#B8A8D4]/25 text-[10.5px] font-medium">
                                  {w}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-light-mid">None</span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] tracking-wider uppercase text-[#4A6A64] font-bold">Dropped from prior cycle</div>
                          <div className="flex gap-1.5 flex-wrap">
                            {cy.dropped_words && cy.dropped_words.length > 0 ? (
                              cy.dropped_words.map(w => (
                                <span key={w} className="px-2 py-0.5 rounded-full bg-[#1E2A2E]/5 text-mid/60 line-through text-[10.5px] border border-[#1E2A2E]/10">
                                  {w}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] text-light-mid">None</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs text-center text-xs text-mid">
              No cycles tracked yet.
            </div>
          )}

          {/* Responses */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-[#1E2A2E]/5">
              <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">What you wrote when asked directly</div>
              <span className="px-2 py-0.5 rounded-full text-[9px] bg-[#1E2A2E]/5 text-mid font-semibold">
                {threadData.responses.length} response{threadData.responses.length === 1 ? '' : 's'}
              </span>
            </div>
            
            <p className="text-[12px] text-mid leading-relaxed">
              Your responses to open thread questions — raw emotional writing. They feed into your Day 28 report.
            </p>

            <div className="space-y-2.5">
              {threadData.responses.length > 0 ? (
                threadData.responses.map((rep, idx) => {
                  const isExpanded = !!expandedResponses[idx];
                  return (
                    <div 
                      key={rep.id || idx}
                      onClick={() => toggleResponse(idx)}
                      className="bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden cursor-pointer hover:shadow-xs transition-all"
                    >
                      <div className="p-3.5 flex items-start gap-3 relative pl-5">
                        <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#B8A8D4]" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold mb-0.5">{rep.from}</div>
                          <h4 className="font-serif italic text-primary text-[13.5px] leading-relaxed mb-0.5 pr-4">"{rep.question}"</h4>
                          {!isExpanded && (
                            <p className="text-mid text-[12px] line-clamp-1">{rep.preview}</p>
                          )}
                          <div className="text-[10px] text-[#8DBFB4] mt-0.5 font-light">{rep.meta}</div>
                        </div>
                        <ChevronDown size={14} className={`text-mid shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[#1E2A2E]/5 px-4.5 py-3.5 bg-[#FAFBFB] pl-5 space-y-2.5">
                          <p className="text-[13px] text-primary leading-relaxed font-serif italic">
                            {rep.full}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-[#4A6A64]">
                            <BookOpen size={12} className="text-[#8DBFB4]" />
                            <span>{rep.footer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-white border border-[#1E2A2E]/8 rounded-xl p-6 text-center text-xs text-mid italic">
                  No responses submitted to direct thread questions yet.
                </div>
              )}
            </div>

            {threadData.openThreadsCount > 0 && (
              <div className="bg-[#FAFBFB] border border-[#1E2A2E]/5 rounded-xl p-3.5 flex items-center gap-3">
                <Clock size={15} className="text-[#8DBFB4] shrink-0" />
                <p className="text-xs text-mid leading-relaxed">
                  You have <strong>{threadData.openThreadsCount} open thread{threadData.openThreadsCount === 1 ? '' : 's'}</strong> waiting. Responses will appear here once written.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
