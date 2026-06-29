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
  Bookmark
} from 'lucide-react';
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

  // Track accordion open/close state for cycles
  const [openCycles, setOpenCycles] = useState({ 0: true });

  const toggleCycle = (idx) => {
    setOpenCycles(prev => ({
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

  const distinctWordCount = stats?.stats?.distinctWordCount || 0;
  const entriesCount = stats?.stats?.entriesCount || 0;
  const mostUsedWord = stats?.stats?.mostUsedWord || 'none';
  const mostUsedFrequency = stats?.stats?.mostUsedFrequency || 0;
  const activeCycleWords = stats?.currentCycleWords || [];
  const concepts = stats?.concepts || [];
  const emerging = stats?.emerging || [];
  const clusters = stats?.clusters || [];
  const personalThemes = stats?.personalThemes || [];
  const currentCycleThemes = stats?.currentCycleThemes || [];

  const isEmpty = distinctWordCount === 0;

  // Build shift signals dynamically for Section 3
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

  // Construct Vocabulary Timeline (Section 6)
  const timelineWords = stats?.mostUsed
    ? [...stats.mostUsed]
        .filter(w => w.first_seen)
        .map(w => ({
          word: w.normalized_word,
          firstSeen: new Date(w.first_seen),
          frequency: w.frequency
        }))
        .sort((a, b) => b.firstSeen.getTime() - a.firstSeen.getTime()) // Newest first
    : [];

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <DashboardNavbar activeTab="home" />

      <main className="max-w-[680px] mx-auto px-6 pt-6">
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
            <p className="text-xs text-mid">The words you reach for across your entire practice — and what they say about where you actually are.</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs">
              <div className="text-[20px] font-bold font-mono">{entriesCount}</div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">entries tracked</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">across {cycles.length} cycles</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs">
              <div className="text-[20px] font-bold font-mono">{distinctWordCount}</div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">distinct emotion words</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">all time</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs">
              <div className="text-[19px] font-bold text-[#8A3020] font-serif font-normal truncate">
                "{mostUsedWord !== 'none' ? mostUsedWord : '—'}"
              </div>
              <div className="text-[11px] text-[#4A6A64] mt-0.5">most reached-for word</div>
              <div className="text-[9.5px] text-[#8DBFB4] mt-0.5">
                {mostUsedFrequency > 0 ? `${mostUsedFrequency}× across cycles` : '—'}
              </div>
            </div>
          </div>

          {isEmpty ? (
            // Graceful Empty State
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-8 text-center space-y-4 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-secondary/15 flex items-center justify-center text-secondary mx-auto">
                <Smile size={24} />
              </div>
              <div className="space-y-1">
                <h3 className="font-serif text-lg text-primary font-normal">Your register is quiet</h3>
                <p className="text-xs text-mid leading-relaxed max-w-sm mx-auto">
                  Your emotional vocabulary is building as you write. Once you submit your first journal entry, this engine will extract literal words, map emotional concepts, and track patterns over time.
                </p>
              </div>
              <button 
                onClick={() => window.navigateTo('/write')}
                className="px-4 py-2 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none"
              >
                Write your first entry
              </button>
            </div>
          ) : (
            // Full Content Sections
            <div className="space-y-8">
              
              {/* PERSONAL VOCABULARY LANDSCAPE */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">Personal Vocabulary Landscape</div>
                <p className="text-[12.5px] text-[#4A6A64] leading-relaxed">
                  Every person's emotional register is unique. Instead of classifying your logs into generic boxes, Ingress Within discovers recurring thematic clusters directly from your writing.
                </p>

                <div className="space-y-4">
                  {clusters.length > 0 ? (
                    clusters.map((cl, idx) => {
                      const trendColor = cl.growth_trend?.includes('+') 
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : cl.growth_trend === 'emerging'
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200';
                      
                      const dateStart = cl.first_appearance ? new Date(cl.first_appearance).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'n/a';
                      const dateEnd = cl.last_appearance ? new Date(cl.last_appearance).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : 'n/a';

                      return (
                        <div key={cl.id || idx} className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs space-y-4 transition-all hover:shadow-sm">
                          {/* Header / Title */}
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <h3 className="text-[15px] font-bold text-primary">{cl.cluster_name}</h3>
                              <p className="text-[12px] text-mid/90 leading-relaxed">{cl.description}</p>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${trendColor} shrink-0`}>
                              {cl.growth_trend || 'stable'}
                            </span>
                          </div>

                          {/* Living Pattern Metrics */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAFBFB] p-3 rounded-lg border border-[#1E2A2E]/5 text-[11px]">
                            <div className="space-y-0.5">
                              <span className="text-mid/50 uppercase text-[9px] font-bold tracking-wider">Volume</span>
                              <div className="font-semibold text-primary">{cl.frequency || 0} occurrences</div>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-mid/50 uppercase text-[9px] font-bold tracking-wider">Confidence</span>
                              <div className="font-semibold text-[#5A4A8A]">{Math.round((cl.confidence || 0.85) * 100)}% reliability</div>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-mid/50 uppercase text-[9px] font-bold tracking-wider">Span</span>
                              <div className="font-semibold text-primary">{dateStart} – {dateEnd}</div>
                            </div>
                            <div className="space-y-0.5">
                              <span className="text-mid/50 uppercase text-[9px] font-bold tracking-wider">Strength</span>
                              <div className="font-semibold text-[#8a3020]">Active pattern</div>
                            </div>
                          </div>

                          {/* Supporting Words / expressions */}
                          <div className="space-y-1.5">
                            <div className="text-[9px] font-bold uppercase tracking-wider text-mid/50">Supporting Expressions</div>
                            <div className="flex flex-wrap gap-2">
                              {cl.words && cl.words.map((w, wIdx) => {
                                const wordText = typeof w === 'string' ? w : w.word;
                                const wordFreq = typeof w === 'string' ? '' : ` ×${w.frequency}`;
                                const meaning = typeof w === 'string' ? '' : w.semantic_meaning;
                                return (
                                  <div key={wIdx} className="group relative px-2.5 py-1 bg-mint-grey border border-primary/10 rounded-lg text-xs font-semibold text-primary cursor-help">
                                    <span>{wordText}</span>
                                    {wordFreq && <span className="font-mono text-[9.5px] text-mid ml-1.5 font-bold">{wordFreq}</span>}
                                    {meaning && (
                                      <div className="absolute z-10 hidden group-hover:block bg-[#1E2A2E] text-white text-[10px] p-2.5 rounded-lg -top-14 left-0 w-56 shadow-lg font-normal leading-normal border border-white/10">
                                        {meaning}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Related Entries Collapsible */}
                          {cl.related_entries && cl.related_entries.length > 0 && (
                            <details className="mt-3 border-t border-[#1E2A2E]/5 pt-2.5 text-[11px] text-mid">
                              <summary className="cursor-pointer hover:text-primary transition-colors font-bold text-[9.5px] uppercase tracking-widest select-none outline-none">
                                Trace Evidence ({cl.related_entries.length} logs)
                              </summary>
                              <div className="mt-2 space-y-2 max-h-36 overflow-y-auto pr-1">
                                {cl.related_entries.map((e, eIdx) => (
                                  <div key={eIdx} className="bg-[#FAFBFB] p-2.5 rounded-lg border border-[#1E2A2E]/5 space-y-1">
                                    <div className="font-mono text-[9px] text-mid/50">
                                      {new Date(e.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    <div className="italic font-serif leading-relaxed text-primary/80">"{e.snippet}"</div>
                                  </div>
                                ))}
                              </div>
                            </details>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs text-center py-8">
                      <p className="text-[12.5px] text-light-mid italic">No living vocabulary patterns discovered yet. Keep logging to let Ingress Within map your register.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* UNCLUSTERED EXPRESSIONS */}
              {(() => {
                const clusteredWordSet = new Set(clusters.flatMap(c => (c.words || []).map((w) => typeof w === 'string' ? w : w.normalized_word)));
                const unclusteredWords = activeCycleWords.filter(w => !clusteredWordSet.has(w.normalized_word));
                if (unclusteredWords.length === 0) return null;
                return (
                  <div className="space-y-3">
                    <div className="text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">Isolated Expressions</div>
                    <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs space-y-3">
                      <p className="text-[11.5px] text-mid/80 leading-relaxed">
                        These are isolated expressions that carry emotional or psychological weight in your entries but haven't formed a recurring pattern cluster yet.
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {unclusteredWords.map((w, idx) => (
                          <div key={idx} className="group relative px-2.5 py-1 bg-mint-grey/50 border border-primary/5 rounded-lg text-xs font-semibold text-primary cursor-help">
                            <span>{w.word}</span>
                            <span className="font-mono text-[9.5px] text-mid ml-1.5 font-bold">×{w.frequency}</span>
                            {w.semantic_meaning && (
                              <div className="absolute z-10 hidden group-hover:block bg-[#1E2A2E] text-white text-[10px] p-2.5 rounded-lg -top-14 left-0 w-56 shadow-lg font-normal leading-normal border border-white/10">
                                {w.semantic_meaning}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* EMERGING VOCABULARY */}
              <div className="space-y-3">
                <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Emerging Vocabulary</div>
                <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs space-y-3.5">
                  <p className="text-[12px] text-mid leading-relaxed">
                    Words appearing in the current cycle that were not seen in older cycles, indicating a shifting vocabulary pattern.
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {emerging.length > 0 ? (
                      emerging.map((w, idx) => (
                        <span key={idx} className="px-3 py-1 bg-[#E0A898]/12 text-[#8a3020] border border-[#E0A898]/25 rounded-full text-xs font-semibold">
                          {w}
                        </span>
                      ))
                    ) : (
                      <p className="text-[12px] text-light-mid italic">No new emerging vocabulary words detected yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 6: Vocabulary Timeline */}
              <div className="space-y-3">
                <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Section 6: Vocabulary Timeline</div>
                <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs space-y-4">
                  <p className="text-[12px] text-mid leading-relaxed">
                    Chronological view of when important words first appeared in your logs and how often they recur.
                  </p>
                  
                  <div className="relative border-l border-[#1E2A2E]/10 pl-5 ml-2 space-y-4">
                    {timelineWords.length > 0 ? (
                      timelineWords.map((item, idx) => {
                        const formattedDate = item.firstSeen.toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        });
                        return (
                          <div key={idx} className="relative">
                            {/* Dot on timeline */}
                            <div className="absolute -left-[24.5px] top-1.5 w-2 h-2 rounded-full bg-secondary border border-white" />
                            <div className="space-y-0.5">
                              <span className="text-[10px] text-mid/50 font-mono uppercase block">{formattedDate}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[13px] font-semibold text-primary">{item.word}</span>
                                <span className="text-[10.5px] px-1.5 py-0.1 bg-[#1E2A2E]/5 border border-[#1E2A2E]/10 rounded text-mid/70 font-mono">{item.frequency}× all-time</span>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <p className="text-[12px] text-light-mid italic pl-2">Timeline is empty.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* SECTION 3: Cycle Comparison */}
              <div className="space-y-3">
                <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Section 3: Cycle Comparison</div>
                <div className="space-y-3">
                  
                  {/* How your vocabulary shifted card */}
                  <div className="bg-[#B8A8D4]/5 border border-[#B8A8D4]/20 rounded-xl p-5 space-y-2.5 shadow-xs">
                    <div className="text-[9px] font-bold tracking-wider uppercase text-[#7A6A9E]">How your vocabulary has shifted</div>
                    <div className="space-y-1.5 text-[12.5px] leading-relaxed">
                      {shiftSignals.map((sig, idx) => (
                        <div key={idx} className="flex items-start gap-2.5">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0 mt-1.5 bg-[#B8A8D4]" />
                          <span>{sig}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Cycles list */}
                  {cycles.map((cy, idx) => {
                    const isOpen = !!openCycles[idx];
                    const dateStart = new Date(cy.start_date || cy.started_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                    const dateEnd = (cy.end_date || cy.ended_at) 
                      ? new Date(cy.end_date || cy.ended_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                      : 'present';

                    return (
                      <div key={cy.id || idx} className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
                        <div 
                          onClick={() => toggleCycle(idx)}
                          className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <span 
                              className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                cy.status === 'ACTIVE' || cy.status === 'active' 
                                  ? 'bg-[#e0a898]/12 text-[#8a3020]' 
                                  : 'bg-[#8DBFB4]/12 text-[#1A5040]'
                              }`}
                            >
                              {cy.status === 'ACTIVE' || cy.status === 'active' ? 'Current' : 'Completed'}
                            </span>
                            <span className="text-[13.5px] font-bold">Cycle {cy.cycle_number || cy.number}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[11.5px] text-[#8DBFB4] font-medium">
                              {dateStart} – {dateEnd} · {cy.entry_count} entries
                            </span>
                            <ChevronDown size={14} className={`text-mid transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </div>
                        </div>

                        {isOpen && (
                          <div className="border-t border-[#1E2A2E]/5 p-4.5 bg-[#FAFBFB] space-y-4">
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
                                          className="h-full bg-[#E0A898]"
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1E2A2E]/5 pt-4">
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
                  })}
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
