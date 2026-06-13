import React, { useState } from 'react';
import { ChevronDown, ArrowLeft, Download, Lock, FileText, BarChart2, Award } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

const summaryData = {
  c2w2: {
    cycle: 'Cycle 2 · Week 2',
    title: 'Managing, not resolving',
    meta: '21 Jun 2026 · 7 entries',
    body: 'Conflict came up four times this week — the situation changed each time but the feeling didn\'t. You described your own response as "handling it" in each entry. But the entries suggest something quieter — suppression rather than composure.',
    why: 'When the same response pattern shows up across four different situations in one week, it\'s usually a default. Defaults aren\'t character flaws — they\'re adaptations. Seeing the default is the first step toward having a choice about it.',
    emos: [
      { w: 'tired', c: '×4', r: ['exhausted', 'depleted'] },
      { w: 'frustrated', c: '×3', r: ['resentful', 'bitter'] },
      { w: 'fine', c: '×6', r: ['managing', 'numb', 'resigned'] }
    ],
    q: 'What would it look like to actually say the thing instead of absorbing it?'
  },
  c2w1: {
    cycle: 'Cycle 2 · Week 1',
    title: 'A new thread starts to surface',
    meta: '10 Jun 2026 · 7 entries',
    body: 'First week of the new cycle. The writing came easier — shorter entries but less guarded. A thread around how you respond to disagreement started to appear.',
    why: 'Something new is emerging. The avoidance pattern from Cycle 1 is still present but the writing has a different quality — more direct, less managed.',
    emos: [
      { w: 'conflicted', c: '×3', r: ['torn', 'uncertain'] },
      { w: 'tired', c: '×2', r: ['drained', 'heavy'] },
      { w: 'fine', c: '×2', r: ['managing', 'resigned'] }
    ],
    q: 'Is avoiding the argument the same as keeping the peace?'
  },
  c1w3: {
    cycle: 'Cycle 1 · Week 3',
    title: 'The writing shifted',
    meta: '27 May 2026 · 7 entries',
    body: 'By week three the entries got shorter but less guarded. You started naming the avoidance directly rather than describing the situations around it.',
    why: 'The writing in Week 3 started describing a person navigating situations rather than situations happening to a person. That\'s a different kind of seeing.',
    emos: [
      { w: 'tired', c: '×3', r: ['depleted', 'drained'] },
      { w: 'fine', c: '×4', r: ['managing', 'numb'] },
      { w: 'frustrated', c: '×2', r: ['resentful', 'blocked'] }
    ],
    q: 'When did saying "fine" become easier than saying what\'s actually there?'
  },
  c1w2: {
    cycle: 'Cycle 1 · Week 2',
    title: '"Fine" appeared eight times',
    meta: '20 May 2026 · 7 entries',
    body: 'The word "fine" appeared eight times this week — always about yourself, never about situations or other people. Three entries described the same situation with different people but arrived at the same ending.',
    why: 'When the same situation keeps recurring with different characters, the common element is usually the person writing about it.',
    emos: [
      { w: 'fine', c: '×8', r: ['managing', 'numb', 'resigned'] },
      { w: 'tired', c: '×4', r: ['exhausted', 'depleted'] },
      { w: 'frustrated', c: '×3', r: ['resentful', 'bitter'] }
    ],
    q: 'You\'ve written about this ending three times. What would have to change for it to be different?'
  },
  c1w1: {
    cycle: 'Cycle 1 · Week 1',
    title: 'First week — careful writing',
    meta: '13 May 2026 · 6 entries',
    body: 'The writing was careful in the first three days — well-constructed, reasonable versions of events. By Day 4 something shifted and the entries got more honest.',
    why: 'The first three days of any cycle tend to be the most managed. The fact that something shifted by Day 4 means the honest version was always there — it just needed a few days to arrive.',
    emos: [
      { w: 'stressed', c: '×3', r: ['overwhelmed', 'pressured'] },
      { w: 'fine', c: '×3', r: ['managing', 'okay'] },
      { w: 'tired', c: '×2', r: ['exhausted', 'depleted'] }
    ],
    q: 'What were you not writing about in the first three days?'
  }
};

const dimensions = [
  { label: 'Emotional intensity', fill: '72%', val: 'High', desc: 'The weight came through — even when the writing was careful.', color: 'bg-[#E0A898]' },
  { label: 'Pattern rigidity', fill: '80%', val: 'Strong', desc: 'Consistent across contexts, people, and situations.', color: 'bg-[#E0A898]' },
  { label: 'Self-agency', fill: '32%', val: 'Low', desc: 'Most situations described as things happening rather than things you navigated.', color: 'bg-[#B8A8D4]' },
  { label: 'Distress trajectory', fill: '55%', val: 'Flat', desc: 'Neither escalating nor resolving — stable but unaddressed.', color: 'bg-[#8DBFB4]/70' }
];

export default function ReportsPage({ user, profile, onSignOut }) {
  const [viewState, setViewState] = useState('list'); // 'list' | 'summary' | 'report'
  const [selectedSummaryId, setSelectedSummaryId] = useState(null);
  
  // Accordions states
  const [c2Open, setC2Open] = useState(true);
  const [c1Open, setC1Open] = useState(false);

  const handleOpenSummary = (id) => {
    setSelectedSummaryId(id);
    setViewState('summary');
  };

  const downloadPdf = () => {
    alert('PDF download started. The generated report file is being compiled for offline storage.');
  };

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      <DashboardNavbar activeTab="reports" />

      <main className="max-w-[680px] mx-auto px-6 pt-8">
        {viewState === 'list' && (
          <div className="space-y-6">
            <button 
              onClick={() => window.navigateTo('/dashboard')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to dashboard
            </button>

            <div>
              <h1 className="font-serif text-[24px] text-primary mb-1">Reports</h1>
              <p className="text-[13px] text-mid">Your reports and summaries — organised by cycle.</p>
            </div>

            <div className="flex gap-3 text-[12.5px] text-[#4A6A64] pb-2 border-b border-[#1E2A2E]/5">
              <span><strong className="text-primary">2</strong> cycles</span>
              <span>·</span>
              <span><strong className="text-primary">1</strong> Day 28 report</span>
              <span>·</span>
              <span><strong className="text-primary">5</strong> weekly summaries</span>
            </div>

            {/* Cycle 2 Accordion */}
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
              <div 
                onClick={() => setC2Open(!c2Open)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                    Current
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold">Cycle 2</div>
                    <div className="text-[11px] text-[#8DBFB4] mt-0.5">4 Jun – 1 Jul 2026</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8DBFB4] hidden sm:inline">2 summaries · report locked</span>
                  <ChevronDown size={16} className={`text-mid transition-transform ${c2Open ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {c2Open && (
                <div className="border-t border-[#1E2A2E]/5 bg-[#FAFBFB] divide-y divide-[#1E2A2E]/5">
                  <div className="px-4 py-2 bg-[#F5F8F8] text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                    Day 28 report
                  </div>
                  <div className="p-4 flex items-center justify-between bg-white text-mid">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-lg bg-mint-grey flex items-center justify-center text-[#8DBFB4]">
                        <Lock size={14} />
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary">Day 28 report</div>
                        <div className="text-[11px] text-[#4A6A64]">Generates 1 Jul 2026</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-1 bg-mint-grey rounded overflow-hidden">
                        <div className="bg-accent h-full w-[71%]" />
                      </div>
                      <span className="text-[10px] font-mono text-[#8DBFB4]">8 days left</span>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-[#F5F8F8] text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                    Weekly summaries
                  </div>
                  <div 
                    onClick={() => handleOpenSummary('c2w2')}
                    className="p-4 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                        New
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Week 2 summary</div>
                        <div className="text-[11px] text-[#4A6A64]">21 Jun 2026</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); downloadPdf(); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                        <Download size={15} />
                      </button>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Read <ArrowLeft size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleOpenSummary('c2w1')}
                    className="p-4 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8DBFB4]/12 text-[#1A5040]">
                        Week 1
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Week 1 summary</div>
                        <div className="text-[11px] text-[#4A6A64]">10 Jun 2026</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); downloadPdf(); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                        <Download size={15} />
                      </button>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Read <ArrowLeft size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cycle 1 Accordion */}
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl overflow-hidden shadow-xs">
              <div 
                onClick={() => setC1Open(!c1Open)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-[#F5F8F8] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#8DBFB4]/12 text-[#1A5040]">
                    Completed
                  </span>
                  <div>
                    <div className="text-[14px] font-semibold">Cycle 1</div>
                    <div className="text-[11px] text-[#8DBFB4] mt-0.5">7 May – 3 Jun 2026</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-[#8DBFB4] hidden sm:inline">1 report · 3 summaries</span>
                  <ChevronDown size={16} className={`text-mid transition-transform ${c1Open ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {c1Open && (
                <div className="border-t border-[#1E2A2E]/5 bg-[#FAFBFB] divide-y divide-[#1E2A2E]/5">
                  <div className="px-4 py-2 bg-[#F5F8F8] text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                    Day 28 report
                  </div>
                  <div 
                    onClick={() => setViewState('report')}
                    className="p-4 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-[#e0a898]/15 text-[#8a3020]">
                        New
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Day 28 report</div>
                        <div className="text-[11px] text-[#4A6A64]">Generated 3 Jun 2026 · 28 entries</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); downloadPdf(); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                        <Download size={15} />
                      </button>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Read <ArrowLeft size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>

                  <div className="px-4 py-2 bg-[#F5F8F8] text-[10px] font-bold tracking-widest text-[#8DBFB4] uppercase">
                    Weekly summaries
                  </div>
                  <div 
                    onClick={() => handleOpenSummary('c1w3')}
                    className="p-4 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-primary">
                        Week 3
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Week 3 summary</div>
                        <div className="text-[11px] text-[#4A6A64]">27 May 2026</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); downloadPdf(); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                        <Download size={15} />
                      </button>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Read <ArrowLeft size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleOpenSummary('c1w2')}
                    className="p-4 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-primary">
                        Week 2
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Week 2 summary</div>
                        <div className="text-[11px] text-[#4A6A64]">20 May 2026</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); downloadPdf(); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                        <Download size={15} />
                      </button>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Read <ArrowLeft size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>

                  <div 
                    onClick={() => handleOpenSummary('c1w1')}
                    className="p-4 flex items-center justify-between hover:bg-[#F5F8F8]/60 cursor-pointer bg-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-mint-grey text-primary">
                        Week 1
                      </span>
                      <div>
                        <div className="text-[13px] font-semibold text-primary group-hover:text-secondary-dark transition-colors">Week 1 summary</div>
                        <div className="text-[11px] text-[#4A6A64]">13 May 2026</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); downloadPdf(); }} className="text-[#8DBFB4] hover:text-primary transition-colors border-none bg-transparent">
                        <Download size={15} />
                      </button>
                      <span className="text-xs font-semibold text-primary flex items-center gap-0.5">
                        Read <ArrowLeft size={11} className="rotate-180" />
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Weekly Summary Detail Screen */}
        {viewState === 'summary' && selectedSummaryId && (
          <div className="space-y-6 max-w-[620px] mx-auto page-fade-enter-active">
            <button 
              onClick={() => setViewState('list')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to reports
            </button>

            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-5 flex flex-col justify-between shadow-xs">
              <div className="space-y-2">
                <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                  {summaryData[selectedSummaryId].cycle}
                </div>
                <h2 className="font-serif text-[20px] text-primary">{summaryData[selectedSummaryId].title}</h2>
                <p className="text-[12px] text-mid">{summaryData[selectedSummaryId].meta}</p>
              </div>
              <button 
                onClick={downloadPdf}
                className="mt-4 px-4 py-2 border border-[#1E2A2E]/12 rounded text-xs font-semibold hover:bg-mint-grey transition-all w-fit cursor-pointer flex items-center gap-1.5"
              >
                <Download size={14} /> Save PDF
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">What we saw</div>
              <p className="text-[14px] text-primary leading-relaxed font-serif bg-white border border-[#1E2A2E]/5 p-5 rounded-xl">
                {summaryData[selectedSummaryId].body}
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">Why this matters</div>
              <p className="text-[14px] text-primary leading-relaxed font-serif bg-white border border-[#1E2A2E]/5 p-5 rounded-xl">
                {summaryData[selectedSummaryId].why}
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">Emotion language this week</div>
              <div className="bg-white border border-[#1E2A2E]/5 p-5 rounded-xl space-y-3">
                {summaryData[selectedSummaryId].emos.map((e, index) => (
                  <div key={index} className="flex items-center justify-between pb-3 border-b border-[#1E2A2E]/5 last:border-b-0 last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e0a898]/12 text-[#8a3020] border border-[#e0a898]/20">
                        {e.w}
                      </span>
                      <span className="text-[11px] font-mono text-mid">{e.c}</span>
                    </div>
                    <div className="flex gap-1.5 items-center">
                      <span className="text-xs text-[#8DBFB4]">→</span>
                      <div className="flex gap-1.5 flex-wrap">
                        {e.r.map((r, rIdx) => (
                          <span key={rIdx} className="text-[11px] bg-mint-grey px-2 py-0.5 rounded text-mid">
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#FAF4F2] border border-[#e0a898]/25 rounded-xl p-5 space-y-2">
              <div className="text-[10px] tracking-wider uppercase text-[#E0A898] font-bold">Carry into next week</div>
              <p className="text-[16.5px] text-[#B87060] italic font-serif leading-relaxed">
                "{summaryData[selectedSummaryId].q}"
              </p>
            </div>
          </div>
        )}

        {/* Day 28 Report Reading View */}
        {viewState === 'report' && (
          <div className="space-y-6 max-w-[620px] mx-auto page-fade-enter-active">
            <button 
              onClick={() => setViewState('list')}
              className="flex items-center gap-2 text-xs font-semibold text-[#4A6A64] hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
            >
              <ArrowLeft size={14} /> Back to reports
            </button>

            <div className="bg-[#1E2A2E] border-none text-white rounded-xl p-6 flex flex-col justify-between shadow-md">
              <div className="space-y-2">
                <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">
                  Cycle 1 · Day 28 report · Generated 3 Jun 2026
                </div>
                <h2 className="font-serif text-[21px] text-white leading-snug">28 days of honest writing — here is what it showed.</h2>
                <p className="text-[12px] text-[#5A8A84]">28 entries · 1 exercise · 3 weekly summaries</p>
              </div>
              <button 
                onClick={downloadPdf}
                className="mt-4 px-4 py-2 border border-white/15 rounded text-xs font-semibold bg-white/8 hover:bg-white/15 transition-all text-white w-fit cursor-pointer flex items-center gap-1.5"
              >
                <Download size={14} /> Save PDF
              </button>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">What this cycle showed</div>
              <p className="text-[15.5px] text-[#1E2A2E] leading-loose font-serif bg-white border border-[#1E2A2E]/5 p-6 rounded-xl">
                You came into this cycle carrying something you had been describing as tiredness. By the end of it, the picture was more specific — it wasn't energy that was depleted, it was the ongoing effort of managing situations without naming them. The avoidance wasn't laziness. It was a well-worn adaptation that had outlasted its usefulness. The moment that mattered most came on Day 27, when you stopped describing the situation and started describing yourself in it.
              </p>
            </div>

            <div className="space-y-4">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">Patterns this cycle</div>
              <div className="bg-white border border-[#1E2A2E]/5 rounded-xl divide-y divide-[#1E2A2E]/5 p-5 space-y-4">
                <div className="space-y-1.5 pb-4 last:pb-0 first:pt-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent" />
                    <span className="text-[14px] font-semibold text-primary">Avoidance</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#e0a898]/12 text-[#8a3020] border border-[#e0a898]/20">
                      Strong · present throughout
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#4A6A64] pl-4 leading-relaxed">
                    Dominant pattern. Showed up in workplace situations, family interactions, recurring conversations — naming outcomes but not what you did while they were happening.
                  </p>
                </div>

                <div className="space-y-1.5 pt-4 pb-4 last:pb-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#B8A8D4]" />
                    <span className="text-[14px] font-semibold text-primary">Self-agency</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#B8A8D4]/15 text-[#5A4A8A] border border-[#B8A8D4]/20">
                      Low · starting to shift
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#4A6A64] pl-4 leading-relaxed">
                    Most situations described as things happening to you. By Day 25 this started to change — three entries in the final week described your own response as something you could have done differently.
                  </p>
                </div>

                <div className="space-y-1.5 pt-4 last:pb-0 last:border-b-0">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#8DBFB4]" />
                    <span className="text-[14px] font-semibold text-primary">Emotional range</span>
                    <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-[#8DBFB4]/12 text-[#1A5040] border border-[#8DBFB4]/20">
                      Narrow
                    </span>
                  </div>
                  <p className="text-[12.5px] text-[#4A6A64] pl-4 leading-relaxed">
                    28 entries and the vocabulary stayed in a narrow band. Notably absent: anything in the anger family, anything in the grief family.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">How this cycle scored</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dimensions.map((d, index) => (
                  <div key={index} className="bg-white border border-[#1E2A2E]/8 p-5 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="text-[9px] tracking-wider uppercase text-[#4A6A64] font-bold">{d.label}</div>
                      <div className="w-full h-1 bg-mint-grey rounded overflow-hidden">
                        <div className={`h-full ${d.color}`} style={{ width: d.fill }} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[15px] font-bold text-primary font-mono">{d.val}</div>
                      <div className="text-[11.5px] text-[#4A6A64] leading-relaxed">{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">Emotional vocabulary this cycle</div>
              <div className="bg-white border border-[#1E2A2E]/5 rounded-xl p-5 space-y-3">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-primary font-medium">
                    <span>fine</span>
                    <span className="font-mono">12×</span>
                  </div>
                  <div className="w-full h-1 bg-mint-grey rounded overflow-hidden">
                    <div className="bg-accent h-full w-full" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-primary font-medium">
                    <span>tired</span>
                    <span className="font-mono">10×</span>
                  </div>
                  <div className="w-full h-1 bg-mint-grey rounded overflow-hidden">
                    <div className="bg-accent/70 h-full w-[83%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-primary font-medium">
                    <span>frustrated</span>
                    <span className="font-mono">8×</span>
                  </div>
                  <div className="w-full h-1 bg-mint-grey rounded overflow-hidden">
                    <div className="bg-accent/55 h-full w-[67%]" />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs text-primary font-medium">
                    <span>stressed</span>
                    <span className="font-mono">6×</span>
                  </div>
                  <div className="w-full h-1 bg-mint-grey rounded overflow-hidden">
                    <div className="bg-accent/40 h-full w-[50%]" />
                  </div>
                </div>

                <div className="bg-[#B8A8D4]/5 border-l-[2.5px] border-[#B8A8D4] p-4 text-[13px] text-[#1E2A2E] italic font-serif leading-relaxed mt-4 rounded-r-lg">
                  The absence of words in the anger family across 28 entries is notable. Not because the anger isn't there — the entries suggest it is — but because you don't appear to have language for it yet.
                </div>
              </div>
            </div>

            <div className="bg-primary text-[#E0EEEC] rounded-xl p-6 space-y-4">
              <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold">Carry into Cycle 2</div>
              <p className="text-[13.5px] leading-relaxed">
                The avoidance pattern is visible to you now — that's the most important thing this cycle produced. Visibility is the first condition for change. What Cycle 2 is for is not fixing it but understanding what it's protecting.
              </p>
              <div className="border-l-[2.5px] border-[#E0A898]/40 pl-4 space-y-1">
                <p className="text-[15px] text-[#E0A898] italic font-serif leading-relaxed">
                  "What would it cost you to stop managing and start naming?"
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
