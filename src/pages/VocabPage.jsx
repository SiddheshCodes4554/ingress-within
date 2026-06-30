import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronDown, 
  BookOpen, 
  Smile, 
  RotateCw, 
  Compass, 
  Calendar,
  Layers,
  Sparkles,
  FileText,
  Clock
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { DashboardService } from '../services/dashboardService';

function getClusterInsight(name) {
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
  return `This cluster highlights language around "${name}". Notice how these words appear in relation to yourself versus other people.`;
}

function getCycleNote(cycleNumber) {
  if (cycleNumber === 1) {
    return "The vocabulary in this cycle leaned heavily on broad, high-level words. Less precise than subsequent cycles.";
  }
  return "You used \"tired\" and \"heavy\" in the same entries three times. They're pointing at different layers of your state.";
}

export default function VocabPage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [threadResponses, setThreadResponses] = useState([]);
  const [openThreadsCount, setOpenThreadsCount] = useState(0);
  
  // Track accordion open/close state for cycles
  const [openCycles, setOpenCycles] = useState({ 0: true });
  // Track open/close state for thread responses
  const [openResponses, setOpenResponses] = useState({});

  const toggleCycle = (idx) => {
    setOpenCycles(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const toggleResponse = (idx) => {
    setOpenResponses(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  const loadVocabData = async () => {
    try {
      const overview = await DashboardService.fetchVocabOverview();
      setStats(overview);
      
      const byCycle = await DashboardService.fetchVocabByCycle();
      setCycles(byCycle);

      try {
        const trData = await DashboardService.fetchVocabThreadResponses();
        setThreadResponses(trData.responses || []);
        setOpenThreadsCount(trData.openThreadsCount || 0);
      } catch (trErr) {
        console.error('Failed to load thread responses for vocab:', trErr);
      }
    } catch (err) {
      console.error('Failed to load vocab page data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVocabData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#ECEFF0] text-primary font-sans pb-20">
        <DashboardNavbar activeTab="home" />
        <main className="max-w-[620px] mx-auto px-6 pt-32 flex flex-col items-center justify-center gap-4">
          <RotateCw className="text-secondary animate-spin" size={24} />
          <p className="text-xs text-mid">Reading your emotional register...</p>
        </main>
      </div>
    );
  }

  const distinctWordCount = stats?.stats?.distinctWordCount || 0;
  const entriesCount = stats?.stats?.entriesCount || 0;
  const mostUsedWord = stats?.stats?.mostUsedWord || 'none';
  const mostUsedFrequency = stats?.stats?.mostUsedFrequency || 0;
  const clusters = stats?.clusters || [];

  const isAvailable = stats?.isAvailable !== false;

  // Words you've never used logic
  const candidateWords = ['ashamed', 'helpless', 'lonely', 'proud', 'relieved', 'afraid'];
  const usedWordsSet = new Set(
    (stats?.mostUsed || []).map(w => w.normalized_word.toLowerCase())
  );
  const neverUsedWords = candidateWords.filter(w => !usedWordsSet.has(w));

  // Build shift signals dynamically for cycles
  const shiftSignals = [];
  if (cycles.length >= 2) {
    const currentCy = cycles[0];
    const prevCy = cycles[1];

    const currentFineCount = currentCy.most_used.find(w => w.word === 'fine')?.frequency || 0;
    const prevFineCount = prevCy.most_used.find(w => w.word === 'fine')?.frequency || 0;

    if (currentFineCount > 0 || prevFineCount > 0) {
      if (currentFineCount < prevFineCount) {
        shiftSignals.push(`"Fine" appeared ${prevFineCount}× in Cycle ${prevCy.number} and ${currentFineCount}× in Cycle ${currentCy.number} — still your most used word, but less so. Something is loosening.`);
      } else {
        shiftSignals.push(`"Fine" remains consistent: appearing ${prevFineCount}× in Cycle ${prevCy.number} and ${currentFineCount}× in Cycle ${currentCy.number}.`);
      }
    }

    if (currentCy.new_words && currentCy.new_words.length > 0) {
      const displayWords = currentCy.new_words.slice(0, 3).map(w => `"${w}"`).join(' and ');
      shiftSignals.push(`${displayWords} ${currentCy.new_words.length === 1 ? 'is new' : 'are new'} in Cycle ${currentCy.number} — more specific than the words they replaced.`);
    }

    if (currentCy.dropped_words && currentCy.dropped_words.length > 0) {
      const displayWords = currentCy.dropped_words.slice(0, 3).map(w => `"${w}"`).join(' and ');
      shiftSignals.push(`${displayWords} dropped away in Cycle ${currentCy.number}. You started reaching for more precise words.`);
    }
  } else {
    shiftSignals.push('Your vocabulary tracking has started in Cycle 1. Compare shifts once you progress to Cycle 2.');
  }

  return (
    <div className="min-h-screen bg-[#ECEFF0] text-primary font-sans relative pb-24">
      <DashboardNavbar activeTab="home" />

      <main className="max-w-[620px] mx-auto px-6 pt-6">
        <div className="space-y-6">
          {/* Back button */}
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} /> Back to home
          </button>

          <div>
            <h1 className="font-serif text-[22px] text-primary mb-0.5">Emotional vocabulary</h1>
            <p className="text-xs text-[#4A6A64] leading-relaxed">The words you reach for across your entire practice — and what they say about where you actually are.</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(30,42,46,0.01)] text-left">
              <div className="text-[22px] font-bold font-mono text-primary">{entriesCount}</div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">entries tracked</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">across {cycles.length} cycles</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(30,42,46,0.01)] text-left">
              <div className="text-[22px] font-bold font-mono text-primary">{isAvailable ? distinctWordCount : 0}</div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">distinct emotion words</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">all time</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-[0_4px_20px_rgba(30,42,46,0.01)] text-left">
              <div className="text-[22px] font-bold text-[#8A3020] font-mono truncate">
                {isAvailable && mostUsedWord !== 'none' ? `"${mostUsedWord}"` : '—'}
              </div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">most reached-for word</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">
                {isAvailable && mostUsedFrequency > 0 ? `${mostUsedFrequency}× all-time` : '—'}
              </div>
            </div>
          </div>

          {/* OVERALL PICTURE */}
          <div className="space-y-3.5">
            <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">Overall Picture</div>

            {!isAvailable ? (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 text-center space-y-4 shadow-xs relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-[#8DBFB4]" />
                <div className="w-12 h-12 rounded-full bg-accent/5 border border-accent/15 flex items-center justify-center text-accent mx-auto">
                  <Compass size={22} className="animate-pulse" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="font-serif text-[15px] text-primary font-normal">Rolling Analysis Generating</h3>
                  <p className="text-[11.5px] text-[#4A6A64] leading-relaxed max-w-sm mx-auto">
                    Vocabulary analysis updates on a rolling 3-day basis. We require at least 3 days of entries to map your ongoing emotional landscape. Check back shortly.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-[0_4px_24px_rgba(30,42,46,0.01)] space-y-6 text-left">
                <p className="text-[12.5px] text-[#4A6A64] leading-relaxed">
                  Your most-used emotion words across all entries. The gap between what you say and what you might mean is usually where something useful is sitting.
                </p>

                {/* Most Used — All Time */}
                <div className="space-y-3">
                  <div className="text-[10px] tracking-wider uppercase text-[#4A6A64] font-bold">Most used — all time</div>
                  <div className="space-y-2.5">
                    {(stats?.mostUsed || []).slice(0, 5).map((w, wIdx) => {
                      const maxFreq = (stats?.mostUsed?.[0]?.frequency) || 1;
                      const pct = Math.max(15, Math.round((w.frequency / maxFreq) * 100));
                      return (
                        <div key={wIdx} className="flex items-center gap-3">
                          <span className="text-[12.5px] font-semibold w-24 shrink-0 text-left text-primary">{w.word}</span>
                          <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-accent"
                              style={{ width: `${pct}%`, opacity: 1 - (wIdx * 0.12) }} 
                            />
                          </div>
                          <span className="text-[11.5px] font-mono text-mid w-8 text-right">{w.frequency}×</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Shift signals */}
                {shiftSignals.length > 0 && (
                  <div className="bg-[#B8A8D4]/5 border border-[#B8A8D4]/15 rounded-xl p-4.5 space-y-2.5">
                    <div className="text-[9px] font-bold tracking-wider uppercase text-[#7A6A9E]">How your vocabulary has shifted</div>
                    <div className="space-y-2 text-[12px] text-primary/90 leading-relaxed">
                      {shiftSignals.map((sig, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-[#B8A8D4]" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Word Clusters */}
                {clusters.length > 0 && (
                  <div className="space-y-3.5">
                    <div className="text-[10px] tracking-wider uppercase text-[#4A6A64] font-bold">Word clusters</div>
                    <div className="flex flex-col gap-3">
                      {[...clusters]
                        .sort((a, b) => b.frequency - a.frequency)
                        .slice(0, 3)
                        .map((cl, idx) => {
                          const clusterWords = cl.words || [];
                        const usedWordText = cl.cluster_name;
                        return (
                          <div key={cl.id || idx} className="bg-[#F5F8F8] rounded-xl p-3.5 space-y-2 border border-[#1E2A2E]/5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2.5 py-0.5 bg-[#E0A898]/15 text-[#8A3020] border border-[#E0A898]/25 rounded-full text-[11px] font-semibold">
                                {usedWordText}
                              </span>
                              <span className="text-[10.5px] font-bold text-[#8A3020]">×{cl.frequency}</span>
                              <span className="text-[#C8D8D4] text-[11px]">→</span>
                              <div className="flex flex-wrap gap-1.5">
                                {clusterWords.map((w, wIdx) => {
                                  const wordText = typeof w === 'string' ? w : w.word;
                                  return (
                                    <span key={wIdx} className="px-2 py-0.5 rounded-full bg-[#1E2A2E]/5 text-[#4A6A64] text-[10.5px] font-semibold border border-[#1E2A2E]/8">
                                      {wordText}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                            <p className="text-[12px] text-[#4A6A64] leading-relaxed font-serif italic border-l-2 border-[#E0A898] pl-3 py-0.5">
                              "{getClusterInsight(cl.cluster_name)}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Words never used */}
                {neverUsedWords.length > 0 && (
                  <div className="space-y-2.5 pt-1">
                    <div className="text-[10px] tracking-wider uppercase text-[#4A6A64] font-bold">Words you've never used</div>
                    <div className="flex flex-wrap gap-1.5">
                      {neverUsedWords.map((word, wIdx) => (
                        <span key={wIdx} className="px-3 py-0.5 rounded-full bg-[#1E2A2E]/5 text-[#4A6A64] text-[11px] font-medium border border-[#1E2A2E]/8">
                          {word}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-[#4A6A64]/80 italic mt-1">
                      Not an accusation — just a note. These words sit nearby but haven't surfaced yet.
                    </p>
                  </div>
                )}

                {/* Directory link */}
                <div className="flex items-center gap-3 bg-[#FAFBFB] hover:bg-[#F5F8F8] rounded-xl border border-[#1E2A2E]/5 p-4 transition-colors cursor-pointer select-none">
                  <BookOpen size={16} className="text-[#2E7A70] shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-[#2E7A70]">Explore the emotion directory</div>
                    <div className="text-[10px] text-[#4A6A64] mt-0.5">See what each word actually means and how they differ</div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* BY CYCLE */}
          <div className="space-y-3.5 pt-2">
            <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">By cycle</div>
            
            <div className="space-y-3">
              {cycles.map((cy, idx) => {
                const isOpen = !!openCycles[idx];
                const dateStart = new Date(cy.started_at || cy.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                const dateEnd = (cy.ended_at || cy.end_date) 
                  ? new Date(cy.ended_at || cy.end_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                  : 'present';

                return (
                  <div key={cy.id || idx} className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs text-left">
                    <div 
                      onClick={() => toggleCycle(idx)}
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span 
                          className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            cy.is_locked
                              ? 'bg-[#e0a898]/12 text-[#8a3020]' 
                              : 'bg-[#8DBFB4]/12 text-[#1A5040]'
                          }`}
                        >
                          {cy.is_locked ? 'Current' : 'Completed'}
                        </span>
                        <span className="text-[13.5px] font-bold text-primary">Cycle {cy.number}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[11.5px] text-[#8DBFB4] font-medium">
                          {dateStart} – {dateEnd} · {cy.entry_count} entries
                        </span>
                        <ChevronDown size={14} className={`text-mid transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                      </div>
                    </div>

                    {isOpen && (
                      cy.is_locked ? (
                        <div className="border-t border-[#1E2A2E]/5 p-6 bg-[#FAFBFB] space-y-3 text-center">
                          <div className="w-8 h-8 rounded-full bg-accent/5 flex items-center justify-center text-accent mx-auto">
                            <Compass size={14} className="animate-spin" style={{ animationDuration: '4s' }} />
                          </div>
                          <p className="text-[11.5px] text-[#4A6A64] italic max-w-xs mx-auto leading-relaxed">
                            Vocabulary analysis for the active cycle compiles when the cycle completes (Day 30/31).
                          </p>
                        </div>
                      ) : (
                        <div className="border-t border-[#1E2A2E]/5 p-4.5 bg-[#FAFBFB] space-y-4">
                          <div className="text-[9.5px] font-bold tracking-wider text-[#8DBFB4] uppercase">Most used this cycle</div>
                          
                          <div className="space-y-2">
                            {cy.most_used && cy.most_used.length > 0 ? (
                              cy.most_used.map((w, wIdx) => {
                                const cMaxFreq = cy.most_used[0].frequency || 1;
                                const cPct = Math.max(15, Math.round((w.frequency / cMaxFreq) * 100));
                                return (
                                  <div key={wIdx} className="flex items-center gap-3">
                                    <span className="text-[12.5px] font-semibold w-20 shrink-0 text-primary">{w.word}</span>
                                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-[#E0A898]"
                                        style={{ width: `${cPct}%`, opacity: 1 - (wIdx * 0.15) }} 
                                      />
                                    </div>
                                    <span className="text-[11.5px] font-mono text-mid w-8 text-right">{w.frequency}×</span>
                                  </div>
                                );
                              })
                            ) : (
                              <p className="text-[11.5px] text-light-mid">No vocabulary words tracked in this cycle yet.</p>
                            )}
                          </div>

                          <p className="text-[11.5px] text-[#4A6A64] italic border-l-2 border-[#E0A898] pl-2.5 py-0.5">
                            {getCycleNote(cy.number)}
                          </p>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1E2A2E]/5 pt-4">
                            <div className="space-y-1">
                              <div className="text-[9px] tracking-wider uppercase text-[#4A6A64] font-bold">New this cycle</div>
                              <div className="flex gap-1.5 flex-wrap">
                                {cy.new_words && cy.new_words.length > 0 ? (
                                  cy.new_words.map(w => (
                                    <span key={w} className="px-2 py-0.5 rounded bg-[#B8A8D4]/12 text-[#5A4A8A] border border-[#B8A8D4]/25 text-[10px] font-medium">
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
                                    <span key={w} className="px-2 py-0.5 rounded bg-[#1E2A2E]/5 text-[#4A6A64]/60 line-through text-[10px] border border-[#1E2A2E]/10">
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
                      )
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* OPEN THREAD RESPONSES */}
          {threadResponses.length > 0 && (
            <div className="responses-section space-y-3.5 pt-2 text-left">
              <div className="flex items-center justify-between">
                <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">What you wrote when asked directly</div>
                <span className="text-[11px] font-bold text-[#4A6A64] bg-[#FAFBFB] border border-[#1E2A2E]/5 px-2.5 py-0.5 rounded-full">
                  {threadResponses.length} {threadResponses.length === 1 ? 'response' : 'responses'}
                </span>
              </div>
              <p className="text-[12px] text-[#4A6A64] leading-relaxed">
                Your responses to open thread questions — raw emotional writing. They live here because they are purely about feeling, not about what happened. They feed into your Day 28 report.
              </p>

              <div className="space-y-3">
                {threadResponses.map((resp, idx) => {
                  const isRespOpen = !!openResponses[idx];
                  return (
                    <div 
                      key={resp.id || idx} 
                      className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs transition-shadow hover:shadow-sm"
                    >
                      <div 
                        onClick={() => toggleResponse(idx)}
                        className="p-4 flex items-start gap-3.5 cursor-pointer"
                      >
                        <div className="w-[3px] bg-[#B8A8D4] rounded-full self-stretch min-h-[44px] shrink-0" />
                        <div className="flex-1 min-w-0 space-y-0.5">
                          <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                            {resp.from}
                          </div>
                          <div className="text-[13px] text-primary italic font-serif leading-relaxed line-clamp-1">
                            {resp.question}
                          </div>
                          <div className="text-[12px] text-[#4A6A64] truncate">
                            {resp.preview}
                          </div>
                          <div className="text-[10.5px] text-[#8DBFB4] mt-1 font-medium">
                            {resp.meta}
                          </div>
                        </div>
                        <ChevronDown size={15} className={`text-[#C8D8D4] mt-1.5 transition-transform ${isRespOpen ? 'rotate-180' : ''}`} />
                      </div>
                      
                      {isRespOpen && (
                        <div className="border-t border-[#1E2A2E]/5 p-4.5 bg-[#FAFBFB] pl-8 space-y-3">
                          <p className="text-[13px] text-primary leading-relaxed font-serif italic whitespace-pre-wrap">
                            {resp.full}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10.5px] text-[#4A6A64] font-medium">
                            <FileText size={13} className="text-[#8DBFB4]" />
                            <span>{resp.footer}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {openThreadsCount > 0 && (
                <div className="bg-[#FAFBFB] border border-[#1E2A2E]/5 rounded-xl p-3.5 flex items-center gap-3">
                  <Clock className="text-[#8DBFB4] shrink-0" size={15} />
                  <div className="text-[11.5px] text-[#4A6A64] leading-relaxed">
                    You have <strong>{openThreadsCount} open threads</strong> waiting. Responses will appear here once written.
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
