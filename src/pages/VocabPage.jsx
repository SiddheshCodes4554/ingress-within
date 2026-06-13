import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, BookOpen, Clock, Smile } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

const initialResponses = [
  {
    from: 'Open thread · Week 2 summary · Cycle 1',
    question: 'The word "tired" appeared four times this week — what is it actually about?',
    preview: '"It\'s not physical. It\'s more like I\'m tired of holding the same things in the same position…"',
    full: '"It\'s not physical. It\'s more like I\'m tired of holding the same things in the same position. Like something has been waiting to shift and it hasn\'t yet. The tired is about waiting for something I haven\'t actually decided to do yet."',
    meta: 'Written 24 May · 87 words',
    footer: 'Saved · fed into Cycle 1 Day 28 report'
  },
  {
    from: 'Open thread · Week 2 summary · Cycle 1',
    question: 'You\'ve written about this situation three times — what would have to change for the ending to be different?',
    preview: '"I think what would have to change is me going into it with a different expectation…"',
    full: '"I think what would have to change is me going into it with a different expectation. I keep putting the responsibility for the change on them. But if the ending keeps being the same, maybe that\'s information about me, not about them."',
    meta: 'Written 17 May · 64 words',
    footer: 'Saved · fed into Cycle 1 Day 28 report'
  }
];

export default function VocabPage({ user, profile, onSignOut }) {
  const [vc2Open, setVc2Open] = useState(true);
  const [vc1Open, setVc1Open] = useState(false);
  
  // Track open state for individual responses
  const [expandedResponses, setExpandedResponses] = useState({});

  const toggleResponse = (idx) => {
    setExpandedResponses(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <DashboardNavbar activeTab="home" />

      <main className="max-w-[680px] mx-auto px-6 pt-8">
        <div className="space-y-6">
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={14} /> Back to home
          </button>

          <div>
            <h1 className="font-serif text-[24px] text-primary mb-1">Emotional vocabulary</h1>
            <p className="text-[13px] text-mid">The words you reach for across your entire practice — and what they say about where you actually are.</p>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs">
              <div className="text-[22px] font-bold font-mono">47</div>
              <div className="text-[11.5px] text-[#4A6A64] mt-1">entries tracked</div>
              <div className="text-[10px] text-[#8DBFB4] mt-0.5">across 2 cycles</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs">
              <div className="text-[22px] font-bold font-mono">38</div>
              <div className="text-[11.5px] text-[#4A6A64] mt-1">distinct emotion words</div>
              <div className="text-[10px] text-[#8DBFB4] mt-0.5">all time</div>
            </div>
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 shadow-xs">
              <div className="text-[21px] font-bold text-[#8A3020] font-serif font-normal">"fine"</div>
              <div className="text-[11.5px] text-[#4A6A64] mt-1">most reached-for word</div>
              <div className="text-[10px] text-[#8DBFB4] mt-0.5">18× across both cycles</div>
            </div>
          </div>

          <div className="text-[10.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Overall picture</div>
          
          <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-6 shadow-xs space-y-6">
            <div className="text-[13px] text-[#4A6A64] leading-relaxed border-b border-[#1E2A2E]/5 pb-4">
              Your most-used emotion words across all entries. The gap between what you say and what you might mean is usually where something useful is sitting.
            </div>

            <div className="space-y-3">
              <div className="text-[9.5px] font-bold tracking-wider uppercase text-[#4A6A64]">Most used — all time</div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold w-24 shrink-0">fine</span>
                  <div className="flex-1 h-[6px] bg-primary/5 rounded-full overflow-hidden">
                    <div className="bg-[#E0A898] h-full w-full" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-mid w-10 text-right">18×</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold w-24 shrink-0">tired</span>
                  <div className="flex-1 h-[6px] bg-primary/5 rounded-full overflow-hidden">
                    <div className="bg-[#E0A898]/70 h-full w-[78%]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-mid w-10 text-right">14×</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold w-24 shrink-0">frustrated</span>
                  <div className="flex-1 h-[6px] bg-primary/5 rounded-full overflow-hidden">
                    <div className="bg-[#E0A898]/55 h-full w-[56%]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-mid w-10 text-right">10×</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold w-24 shrink-0">heavy</span>
                  <div className="flex-1 h-[6px] bg-primary/5 rounded-full overflow-hidden">
                    <div className="bg-[#8DBFB4] h-full w-[28%]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-mid w-10 text-right">5×</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[13px] font-semibold w-24 shrink-0">conflicted</span>
                  <div className="flex-1 h-[6px] bg-primary/5 rounded-full overflow-hidden">
                    <div className="bg-[#B8A8D4] h-full w-[22%]" />
                  </div>
                  <span className="text-[11px] font-mono font-bold text-mid w-10 text-right">4×</span>
                </div>
              </div>
            </div>

            {/* Shift Signal */}
            <div className="bg-[#B8A8D4]/5 border border-[#B8A8D4]/20 rounded-xl p-5 space-y-3">
              <div className="text-[9.5px] font-bold tracking-wider uppercase text-[#7A6A9E]">How your vocabulary has shifted</div>
              <div className="space-y-2 text-[12.5px] leading-relaxed">
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#8DBFB4] shrink-0 mt-2" />
                  <span>"Fine" appeared 12× in Cycle 1 and 6× in Cycle 2 — still your most used word, but less so. Something is loosening.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B8A8D4] shrink-0 mt-2" />
                  <span>"Conflicted" and "heavy" are new in Cycle 2 — more specific than the words they replaced.</span>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#E0A898] shrink-0 mt-2" />
                  <span>"Stressed" and "overwhelmed" dropped away in Cycle 2. You started reaching for more precise words.</span>
                </div>
              </div>
            </div>

            {/* Clusters */}
            <div className="space-y-3">
              <div className="text-[9.5px] font-bold tracking-wider uppercase text-[#4A6A64]">Word clusters</div>
              <div className="space-y-3">
                <div className="bg-[#F5F8F8] p-4 rounded-lg space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E0A898]/15 text-[#8a3020] font-semibold border border-[#E0A898]/30">tired</span>
                    <span className="font-semibold font-mono text-[#8a3020]">×14</span>
                    <span className="text-mid">→</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">exhausted</span>
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">depleted</span>
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">drained</span>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#4A6A64] italic leading-relaxed border-l-2 border-[#E0A898] pl-3">
                    Tired is about energy. Exhausted implies recovery needed. Depleted implies something was taken. Worth sitting with which one is actually true.
                  </div>
                </div>

                <div className="bg-[#F5F8F8] p-4 rounded-lg space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E0A898]/15 text-[#8a3020] font-semibold border border-[#E0A898]/30">fine</span>
                    <span className="font-semibold font-mono text-[#8a3020]">×18</span>
                    <span className="text-mid">→</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">managing</span>
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">numb</span>
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">resigned</span>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#4A6A64] italic leading-relaxed border-l-2 border-[#E0A898] pl-3">
                    "Fine" almost always appears when describing yourself — never about situations or other people. That pattern is worth noticing.
                  </div>
                </div>

                <div className="bg-[#F5F8F8] p-4 rounded-lg space-y-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#E0A898]/15 text-[#8a3020] font-semibold border border-[#E0A898]/30">frustrated</span>
                    <span className="font-semibold font-mono text-[#8a3020]">×10</span>
                    <span className="text-mid">→</span>
                    <div className="flex gap-1.5 flex-wrap">
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">resentful</span>
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">bitter</span>
                      <span className="bg-[#1E2A2E]/5 px-2 py-0.5 rounded text-[11px] text-mid border border-[#1E2A2E]/10">blocked</span>
                    </div>
                  </div>
                  <div className="text-[12px] text-[#4A6A64] italic leading-relaxed border-l-2 border-[#E0A898] pl-3">
                    Frustrated implies something can still change. Resentful implies it already has. The distinction matters.
                  </div>
                </div>
              </div>
            </div>

            {/* Unused words */}
            <div className="space-y-2 border-t border-[#1E2A2E]/5 pt-4">
              <div className="text-[9.5px] font-bold tracking-wider uppercase text-[#4A6A64]">Words you've never used</div>
              <div className="flex gap-1.5 flex-wrap">
                {['ashamed','helpless','lonely','proud','relieved','afraid'].map((w, idx) => (
                  <span key={idx} className="bg-[#1E2A2E]/5 px-2.5 py-1 rounded text-xs text-mid border border-[#1E2A2E]/8">
                    {w}
                  </span>
                ))}
              </div>
              <p className="text-[11px] text-[#4A6A64] italic">Not an accusation — just a note. These words sit nearby but haven't surfaced yet.</p>
            </div>
          </div>

          <div className="text-[10.5px] font-bold tracking-widest text-[#8DBFB4] uppercase pt-2">By cycle</div>

          {/* Cycle 2 Accordion */}
          <div className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
            <div 
              onClick={() => setVc2Open(!vc2Open)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/12 text-[#8a3020]">
                  Current
                </span>
                <span className="text-[13.5px] font-bold">Cycle 2</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#8DBFB4]">4 Jun – present · 19 entries</span>
                <ChevronDown size={15} className={`text-mid transition-transform ${vc2Open ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {vc2Open && (
              <div className="border-t border-[#1E2A2E]/5 p-5 bg-[#FAFBFB] space-y-4">
                <div className="text-[10.5px] font-bold tracking-wider text-[#8DBFB4] uppercase">Most used this cycle</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold w-20 shrink-0">fine</span>
                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                      <div className="bg-[#E0A898] h-full w-full" />
                    </div>
                    <span className="text-[11px] font-mono text-mid w-8 text-right">6×</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold w-20 shrink-0">tired</span>
                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                      <div className="bg-[#E0A898]/70 h-full w-[67%]" />
                    </div>
                    <span className="text-[11px] font-mono text-mid w-8 text-right">4×</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold w-20 shrink-0">conflicted</span>
                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                      <div className="bg-[#B8A8D4] h-full w-[50%]" />
                    </div>
                    <span className="text-[11px] font-mono text-mid w-8 text-right">3×</span>
                  </div>
                </div>

                <p className="text-[11.5px] text-mid italic border-l-2 border-[#E0A898] pl-3 py-1">
                  You used "tired" and "heavy" in the same entries three times. They're pointing at different things.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#1E2A2E]/5 pt-4">
                  <div className="space-y-1.5">
                    <div className="text-[9px] tracking-wider uppercase text-[#4A6A64] font-bold">New this cycle</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['conflicted','heavy','invisible'].map(w => (
                        <span key={w} className="px-2 py-0.5 rounded-full bg-[#B8A8D4]/12 text-[#5A4A8A] border border-[#B8A8D4]/25 text-[10.5px] font-medium">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <div className="text-[9px] tracking-wider uppercase text-[#4A6A64] font-bold">Dropped from Cycle 1</div>
                    <div className="flex gap-1.5 flex-wrap">
                      {['stressed','overwhelmed','anxious'].map(w => (
                        <span key={w} className="px-2 py-0.5 rounded-full bg-[#1E2A2E]/5 text-mid/60 line-through text-[10.5px] border border-[#1E2A2E]/10">
                          {w}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cycle 1 Accordion */}
          <div className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
            <div 
              onClick={() => setVc1Open(!vc1Open)}
              className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8DBFB4]/12 text-[#1A5040]">
                  Completed
                </span>
                <span className="text-[13.5px] font-bold">Cycle 1</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-[#8DBFB4]">7 May – 3 Jun · 28 entries</span>
                <ChevronDown size={15} className={`text-mid transition-transform ${vc1Open ? 'rotate-180' : ''}`} />
              </div>
            </div>

            {vc1Open && (
              <div className="border-t border-[#1E2A2E]/5 p-5 bg-[#FAFBFB] space-y-4">
                <div className="text-[10.5px] font-bold tracking-wider text-[#8DBFB4] uppercase">Most used this cycle</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold w-20 shrink-0">fine</span>
                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                      <div className="bg-[#E0A898] h-full w-full" />
                    </div>
                    <span className="text-[11px] font-mono text-mid w-8 text-right">12×</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold w-20 shrink-0">tired</span>
                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                      <div className="bg-[#E0A898]/70 h-full w-[83%]" />
                    </div>
                    <span className="text-[11px] font-mono text-mid w-8 text-right">10×</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[12.5px] font-semibold w-20 shrink-0">stressed</span>
                    <div className="flex-1 h-[5px] bg-[#1E2A2E]/5 rounded-full overflow-hidden">
                      <div className="bg-[#E0A898]/40 h-full w-[50%]" />
                    </div>
                    <span className="text-[11px] font-mono text-mid w-8 text-right">6×</span>
                  </div>
                </div>

                <p className="text-[11.5px] text-mid italic border-l-2 border-[#E0A898] pl-3 py-1">
                  The vocabulary in this cycle leaned heavily on broad, high-level words. Less precise than Cycle 2.
                </p>
              </div>
            )}
          </div>

          {/* Responses */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-[#1E2A2E]/5">
              <div className="text-[10.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">What you wrote when asked directly</div>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-[#1E2A2E]/5 text-mid font-semibold">2 responses</span>
            </div>
            
            <p className="text-[12.5px] text-mid leading-relaxed">
              Your responses to open thread questions — raw emotional writing. They live here because they are purely about feeling, not about what happened. They feed into your Day 28 report.
            </p>

            <div className="space-y-3">
              {initialResponses.map((rep, idx) => {
                const isExpanded = !!expandedResponses[idx];
                return (
                  <div 
                    key={idx}
                    onClick={() => toggleResponse(idx)}
                    className="bg-white border border-[#1E2A2E]/8 rounded-xl overflow-hidden cursor-pointer hover:shadow-xs transition-all"
                  >
                    <div className="p-4 flex items-start gap-3 relative pl-6">
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#B8A8D4]" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold mb-1">{rep.from}</div>
                        <h4 className="font-serif italic text-primary text-[14px] leading-relaxed mb-1 pr-4">"{rep.question}"</h4>
                        {!isExpanded && (
                          <p className="text-mid text-[12.5px] line-clamp-1">{rep.preview}</p>
                        )}
                        <div className="text-[10.5px] text-[#8DBFB4] mt-1 font-light">{rep.meta}</div>
                      </div>
                      <ChevronDown size={15} className={`text-mid shrink-0 mt-0.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>

                    {isExpanded && (
                      <div className="border-t border-[#1E2A2E]/5 px-5 py-4 bg-[#FAFBFB] pl-6 space-y-3">
                        <p className="text-[13.5px] text-primary leading-relaxed font-serif italic">
                          {rep.full}
                        </p>
                        <div className="flex items-center gap-1.5 text-[11px] text-[#4A6A64]">
                          <BookOpen size={13} className="text-[#8DBFB4]" />
                          <span>{rep.footer}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="bg-[#FAFBFB] border border-[#1E2A2E]/5 rounded-xl p-4 flex items-center gap-3">
              <Clock size={16} className="text-[#8DBFB4] shrink-0" />
              <p className="text-xs text-mid leading-relaxed">
                You have <strong>3 open threads</strong> waiting. Responses will appear here once written.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
