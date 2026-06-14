import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ChevronDown, Link2, Info, Activity } from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

const patternList = [
  {
    id: 'fine',
    name: 'Saying "fine"',
    badge: 'Present',
    badgeClass: 'bg-[#e0a898]/12 text-[#8a3020] border border-[#e0a898]/20',
    body: 'Has appeared in every cycle. Used about yourself — never about situations or other people. Went quiet in Cycles 6–7, then came back. The system has been watching this for 12 cycles.',
    meta: 'First appeared Cycle 1 · Day 2 · 74 appearances total',
    timeline: ['strong','strong','strong','shifting','shifting','quiet','quiet','returned','strong','strong','shifting','strong'],
    firstAppeared: 'C1',
    totalCount: '74× total'
  },
  {
    id: 'perfectionism',
    name: 'Perfectionism as deflection',
    badge: 'New · C11',
    badgeClass: 'bg-[#B8A8D4]/15 text-[#5A4A8A] border border-[#B8A8D4]/20',
    body: 'Surfaced in Cycle 11. High standards applied to others appear to deflect from unmet expectations of yourself. Only two cycles of data.',
    meta: 'First appeared Cycle 11 · Day 6 · 8 appearances so far',
    timeline: ['absent','absent','absent','absent','absent','absent','absent','absent','absent','absent','newdot','newdot'],
    firstAppeared: 'C11',
    totalCount: '8× so far'
  },
  {
    id: 'avoidance',
    name: 'Avoidance',
    badge: 'Shifting',
    badgeClass: 'bg-[#8DBFB4]/12 text-[#1A5040] border border-[#8DBFB4]/20',
    body: 'Dominant for the first four cycles. Has been shifting since Cycle 5 — not linearly, but the overall direction is clear. Still present but different in character.',
    meta: 'First appeared Cycle 1 · Day 1 · 89 appearances total',
    timeline: ['strong','strong','strong','strong','shifting','shifting','shifting','shifting','quiet','quiet','shifting','shifting'],
    firstAppeared: 'C1',
    totalCount: '89× total'
  },
  {
    id: 'conflict',
    name: 'Conflict aversion',
    badge: 'Shifting',
    badgeClass: 'bg-[#8DBFB4]/12 text-[#1A5040] border border-[#8DBFB4]/20',
    body: 'Appeared in Cycle 2 and was strong through Cycle 8. You\'ve been writing about disagreements more directly since Cycle 9. Four cycles of consistent change.',
    meta: 'First appeared Cycle 2 · Day 3 · 61 appearances total',
    timeline: ['absent','newdot','strong','strong','strong','strong','strong','strong','shifting','shifting','shifting','shifting'],
    firstAppeared: 'C2',
    totalCount: '61× total'
  },
  {
    id: 'overthinking',
    name: 'Calling it "overthinking"',
    badge: 'Gone quiet',
    badgeClass: 'bg-primary/5 text-mid border border-primary/10',
    body: 'Active in Cycles 1–4 as a catch-all for difficult feelings. Went quiet as your vocabulary became more specific. Hasn\'t appeared in Cycles 8–12.',
    meta: 'Last appeared Cycle 7 · not surfacing since Cycle 8',
    timeline: ['strong','strong','strong','shifting','quiet','quiet','quiet','absent','absent','absent','absent','absent'],
    firstAppeared: 'Last appeared C7',
    totalCount: 'Not surfacing since C8'
  },
  {
    id: 'selfagency',
    name: 'Low self-agency',
    badge: 'Gone quiet',
    badgeClass: 'bg-primary/5 text-mid border border-primary/10',
    body: 'Dominant in the first three cycles — situations described as things happening to you. Shifted through Cycles 4–7. Not showing up recently — though it returned briefly in Cycle 10.',
    meta: 'First appeared Cycle 1 · returned briefly Cycle 10 · 44 appearances total',
    timeline: ['strong','strong','strong','shifting','shifting','shifting','quiet','absent','absent','returned','quiet','absent'],
    firstAppeared: 'C1',
    totalCount: 'Returned C10 · 44× total'
  }
];

const dotDefs = {
  fine: ['strong','strong','strong','shifting','shifting','quiet','quiet','returned','strong','strong','shifting','strong'],
  perfectionism: ['absent','absent','absent','absent','absent','absent','absent','absent','absent','absent','newdot','newdot'],
  avoidance: ['strong','strong','strong','strong','shifting','shifting','shifting','shifting','quiet','quiet','shifting','shifting'],
  conflict: ['absent','newdot','strong','strong','strong','strong','strong','strong','shifting','shifting','shifting','shifting'],
  overthinking: ['strong','strong','strong','shifting','quiet','quiet','quiet','absent','absent','absent','absent','absent'],
  selfagency: ['strong','strong','strong','shifting','shifting','shifting','quiet','absent','absent','returned','quiet','absent']
};

const patternDetails = {
  fine: {
    orientation: 'Saying "fine" has been in your writing since the beginning. It went quiet once — Cycles 6 and 7 — and then came back. The fact that it returns suggests it\'s doing something useful. The question isn\'t how to stop saying it — it\'s what it\'s covering.',
    connected: true,
    connectedBody: 'This pattern and Avoidance appear together in many of the same entries. Both seem to function as ways of managing what\'s actually there. They may be two names for the same thing.',
    connectedLinks: [{ label: 'Avoidance', id: 'avoidance' }],
    cycleData: {
      12: {
        obs: '"Fine" has appeared 6 times already this cycle.',
        entries: [
          { t: '"I said I was fine. I\'m not sure that was true."', m: 'C12 · Day 4' },
          { t: '"Fine is the word I reach for when I don\'t want to examine something."', m: 'C12 · Day 11' }
        ]
      },
      11: {
        obs: 'Appeared less — 4 times. More self-aware use.',
        entries: [{ t: '"Fine again. I keep saying it without checking if it\'s actually true."', m: 'C11 · Day 9' }]
      },
      10: { obs: 'Continued strong.', entries: [{ t: '"I said I was fine. I don\'t know if that was true."', m: 'C10 · Day 13' }] },
      9: {
        obs: 'High frequency again — 11 times. Coincided with a difficult period.',
        entries: [{ t: '"Fine. Fine. Fine. I\'m not fine."', m: 'C9 · Day 19' }]
      },
      8: {
        obs: 'Came back after two cycles of low frequency. The return was gradual.',
        entries: [{ t: '"Back to fine. I thought I\'d moved past this."', m: 'C8 · Day 14' }]
      },
      7: { obs: 'Still quiet. One appearance, self-consciously noted.', entries: [{ t: '"Fine. There it is again. I\'m watching myself say it now."', m: 'C7 · Day 20' }] },
      6: {
        obs: 'Almost absent — appeared only twice. More specific language used instead.',
        entries: [{ t: '"I almost said fine. I stopped and tried to find the actual word."', m: 'C6 · Day 8' }]
      },
      5: {
        obs: 'Continued shifting. Appeared 6 times — the lowest yet.',
        entries: [{ t: '"Fine appeared again. I\'m noticing I use it to close conversations."', m: 'C5 · Day 9' }]
      },
      4: {
        obs: 'Starting to appear less frequently — from 12 times in C1 to around 8.',
        entries: [{ t: '"I almost said fine and then stopped. What\'s actually true?"', m: 'C4 · Day 14' }]
      },
      3: {
        obs: 'Continued strong. The word was appearing in almost every entry.',
        entries: [{ t: '"Fine is such a lazy word. I use it when I don\'t want to explain."', m: 'C3 · Day 7' }]
      },
      2: {
        obs: 'Still high frequency. The pattern was consistent — fine appeared in 6 of the 7 weeks.',
        entries: [{ t: '"I said I was fine and ended the conversation. It wasn\'t true."', m: 'C2 · Day 11' }]
      },
      1: {
        obs: '"Fine" appeared 12 times in the first cycle. Always about yourself, never about anyone else.',
        entries: [
          { t: '"I\'m fine. I keep saying it. I don\'t think I mean it."', m: 'C1 · Day 8' },
          { t: '"Fine has become my default. I say it before I even check if it\'s true."', m: 'C1 · Day 19' }
        ]
      }
    }
  },
  perfectionism: {
    orientation: 'This pattern is new — two cycles of data isn\'t enough for the system to say much with confidence. What it has noticed is that the entries where this appears tend to follow entries about your own work or performance.',
    connected: false,
    cycleData: {
      12: { obs: 'Present again — 4 appearances so far.', entries: [{ t: '"I noticed I was judging their work more harshly than I\'d judge my own."', m: 'C12 · Day 8' }] },
      11: {
        obs: 'First flagged in Cycle 11.',
        entries: [
          { t: '"I keep expecting more from other people than I expect from myself. Or maybe I gave up on myself first."', m: 'C11 · Day 6' },
          { t: '"I think I judge their work so I don\'t have to look at mine."', m: 'C11 · Day 19' }
        ]
      },
      10: { obs: 'Not present.', entries: [] },
      9: { obs: 'Not present.', entries: [] },
      8: { obs: 'Not present.', entries: [] },
      7: { obs: 'Not present.', entries: [] },
      6: { obs: 'Not present.', entries: [] },
      5: { obs: 'Not present.', entries: [] },
      4: { obs: 'Not present.', entries: [] },
      3: { obs: 'Not present.', entries: [] },
      2: { obs: 'Not present.', entries: [] },
      1: { obs: 'Not present.', entries: [] }
    }
  },
  avoidance: {
    orientation: 'Avoidance has been shifting for eight cycles. That\'s not a straight line — it went quiet in Cycles 9 and 10, came back slightly in 11 and 12. But the overall picture is genuinely different from what it was at the start.',
    connected: true,
    connectedBody: 'Avoidance and Conflict Aversion appear to be related — both involve managing what\'s happening rather than meeting it directly. They may be two expressions of the same root thing.',
    connectedLinks: [{ label: 'Conflict aversion', id: 'conflict' }, { label: 'Saying "fine"', id: 'fine' }],
    cycleData: {
      12: { obs: 'Present but at lower intensity than early cycles.', entries: [{ t: '"I noticed I was avoiding the question. That\'s different from just avoiding it."', m: 'C12 · Day 7' }] },
      11: { obs: 'Returned slightly.', entries: [{ t: '"Avoiding again. I noticed it faster this time."', m: 'C11 · Day 6' }] },
      10: { obs: 'Still quiet.', entries: [{ t: '"I didn\'t avoid it this time. That\'s worth noting."', m: 'C10 · Day 8' }] },
      9: { obs: 'The quietest this pattern has been.', entries: [{ t: '"I said the actual thing today. Not the managed version."', m: 'C9 · Day 21' }] },
      8: {
        obs: 'Four entries this cycle described avoidance directly rather than enacting it.',
        entries: [{ t: '"I almost changed the subject again. I didn\'t this time."', m: 'C8 · Day 17' }]
      },
      7: { obs: 'Still shifting.', entries: [{ t: '"I\'m still avoiding things. But I\'m writing about it differently now."', m: 'C7 · Day 11' }] },
      6: { obs: 'Continued shifting.', entries: [{ t: '"I felt the urge to redirect the conversation. I stayed in it instead."', m: 'C6 · Day 15' }] },
      5: {
        obs: 'The shift started here. You began naming what you were doing while doing it.',
        entries: [{ t: '"I\'m avoiding this conversation and I know it. Writing that down feels important."', m: 'C5 · Day 11' }]
      },
      4: { obs: 'Strong but starting to show cracks — two entries described what you did during a situation.', entries: [{ t: '"I noticed I was avoiding it. That\'s new."', m: 'C4 · Day 22' }] },
      3: { obs: 'Still dominant.', entries: [{ t: '"It resolved itself. That\'s what I keep saying. Did it though?"', m: 'C3 · Day 16' }] },
      2: { obs: 'Continued strong. Managing situations rather than naming them.', entries: [{ t: '"I handled it. I don\'t want to think about it anymore."', m: 'C2 · Day 9' }] },
      1: {
        obs: 'Present from Day 1 and dominant throughout. You named outcomes of situations but not what you did while they were happening.',
        entries: [{ t: '"I didn\'t say anything. It felt easier. The moment passed."', m: 'C1 · Day 3' }]
      }
    }
  },
  conflict: {
    orientation: 'Conflict aversion has been shifting for four cycles now. That\'s consistent enough that the system considers it a real change, not a pause. What\'s different isn\'t that conflict appears less — it\'s how you write about it when it does.',
    connected: true,
    connectedBody: 'Conflict Aversion and Avoidance share a lot of common entries. Both are about not meeting something directly. They may be two expressions of the same underlying pattern.',
    connectedLinks: [{ label: 'Avoidance', id: 'avoidance' }],
    cycleData: {
      12: { obs: 'Still shifting.', entries: [{ t: '"I felt the conversation getting difficult and stayed in it."', m: 'C12 · Day 6' }] },
      11: { obs: 'Still shifting.', entries: [{ t: '"Conflict came up again. I wrote about what I was feeling during it, not after."', m: 'C11 · Day 8' }] },
      10: { obs: 'Continued shifting.', entries: [{ t: '"I said what I actually thought."', m: 'C10 · Day 11' }] },
      9: { obs: 'The shift started here.', entries: [{ t: '"I said the actual thing today. It went better than I expected."', m: 'C9 · Day 14' }] },
      8: {
        obs: 'Still strong — but by Week 3, three entries described what you said during a disagreement.',
        entries: [{ t: '"I stayed in the conversation this time."', m: 'C8 · Day 21' }]
      },
      7: { obs: 'Strong throughout.', entries: [{ t: '"It got handled. I don\'t need to write more about it."', m: 'C7 · Day 14' }] },
      6: { obs: 'Still strong.', entries: [{ t: '"I kept the peace. I\'m not sure that\'s the same as resolving it."', m: 'C6 · Day 7' }] },
      5: { obs: 'Strong but small signs of more direct engagement.', entries: [{ t: '"I almost avoided it again. I\'m noticing the moment now."', m: 'C5 · Day 13' }] },
      4: { obs: 'Continued strong.', entries: [{ t: '"I said what I thought they wanted to hear."', m: 'C4 · Day 19' }] },
      3: { obs: 'Strong — present in most entries that touched on disagreement.', entries: [{ t: '"I redirected the conversation before it got difficult."', m: 'C3 · Day 8' }] },
      2: { obs: 'Appeared for the first time.', entries: [{ t: '"The conversation went fine. I handled it. I don\'t want to think about it anymore."', m: 'C2 · Day 11' }] },
      1: { obs: 'Not present in Cycle 1.', entries: [] }
    }
  },
  overthinking: {
    orientation: '"Overthinking" hasn\'t appeared in five cycles. That\'s the longest it\'s been quiet. The system doesn\'t know whether the pattern is gone or something has temporarily taken its place.',
    connected: false,
    cycleData: {
      12: { obs: 'Not present in this cycle so far.', entries: [] },
      11: { obs: 'Not present.', entries: [] },
      10: { obs: 'Not present.', entries: [] },
      9: { obs: 'Not present.', entries: [] },
      8: { obs: 'Not present.', entries: [] },
      7: { obs: 'Appeared once — self-consciously.', entries: [{ t: '"I was about to write \'I\'m overthinking this\'. I stopped."', m: 'C7 · Day 12' }] },
      6: {
        obs: 'Appeared twice, both times with self-awareness.',
        entries: [{ t: '"I\'m calling it overthinking again. What\'s actually underneath it?"', m: 'C6 · Day 11' }]
      },
      5: { obs: 'Appeared only 3 times.', entries: [{ t: '"Is this overthinking or is this just thinking?"', m: 'C5 · Day 18' }] },
      4: { obs: 'Starting to fade — appeared 5 times.', entries: [{ t: '"I said overthinking but I think what I mean is that I\'m afraid."', m: 'C4 · Day 16' }] },
      3: { obs: 'Still active — appeared 8 times.', entries: [{ t: '"There I go overthinking again."', m: 'C3 · Day 12' }] },
      2: { obs: 'Still high frequency.', entries: [{ t: '"I\'m overthinking this. It\'s not a big deal."', m: 'C2 · Day 7' }] },
      1: {
        obs: '"Overthinking" appeared 11 times — always as an explanation for why something felt hard.',
        entries: [{ t: '"I\'m probably just overthinking it. I do that."', m: 'C1 · Day 4' }]
      }
    }
  },
  selfagency: {
    orientation: 'Low self-agency has been quiet for most of the last five cycles. The brief return in Cycle 10 was real but short-lived. The system considers the overall direction a genuine shift, while acknowledging that patterns like this can return.',
    connected: false,
    cycleData: {
      12: { obs: 'Not present in this cycle so far.', entries: [] },
      11: { obs: 'Appeared once, briefly.', entries: [{ t: '"I don\'t have much control over this. Actually — do I?"', m: 'C11 · Day 14' }] },
      10: { obs: 'Reappeared during a difficult period. Faded again by Week 3.', entries: [{ t: '"Things keep happening. I don\'t feel like I have much say in any of it."', m: 'C10 · Day 9' }] },
      9: { obs: 'Not present.', entries: [] },
      8: { obs: 'Not present.', entries: [] },
      7: { obs: 'Quiet but still present occasionally.', entries: [{ t: '"I had a choice there. I\'m starting to see that."', m: 'C7 · Day 8' }] },
      6: {
        obs: '"I decided" and "I chose" appeared for the first time in multiple entries.',
        entries: [{ t: '"I made a choice today instead of letting it happen."', m: 'C6 · Day 22' }]
      },
      5: { obs: 'Continued shifting.', entries: [{ t: '"I made a decision. That\'s different from it just happening."', m: 'C5 · Day 11' }] },
      4: { obs: 'Starting to shift. A few entries described your own response as something you could have done differently.', entries: [{ t: '"I could have said something. I chose not to."', m: 'C4 · Day 18' }] },
      3: { obs: 'Still strong.', entries: [{ t: '"It\'s just how things are."', m: 'C3 · Day 14' }] },
      2: { obs: 'Continued strong. Things just happened that way.', entries: [{ t: '"Things just happened that way."', m: 'C2 · Day 9' }] },
      1: {
        obs: 'The dominant framing of Cycle 1. Situations were described as things happening to you.',
        entries: [{ t: '"I don\'t know why this keeps happening to me."', m: 'C1 · Day 6' }]
      }
    }
  }
};

const dotLabels = {
  strong: 'bg-[#E0A898]',
  shifting: 'bg-[#8DBFB4]',
  quiet: 'bg-primary/20 border border-primary/20',
  absent: 'bg-primary/5 border border-dashed border-primary/20',
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

export default function PatternsPage({ user, profile, onSignOut }) {
  const [viewState, setViewState] = useState('list'); // 'list' | 'detail'
  const [activePatternId, setActivePatternId] = useState(null);
  
  // Track expandable cycle detail cards
  const [expandedCycles, setExpandedCycles] = useState({});
  const cycleCardRefs = useRef([]);

  const handleOpenPattern = (id) => {
    setActivePatternId(id);
    setViewState('detail');
    // Open the current cycle (Cycle 12, index 0 in descending order)
    setExpandedCycles({ 0: true });
  };

  const toggleCycleCard = (index) => {
    setExpandedCycles(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const jumpToCycleCard = (cycleIndex) => {
    // Open the target cycle card
    setExpandedCycles(prev => ({
      ...prev,
      [cycleIndex]: true
    }));
    
    // Smooth scroll down to card
    setTimeout(() => {
      const element = document.getElementById(`cycle-card-${cycleIndex}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

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
              <h1 className="font-serif text-[22px] text-primary mb-0.5">Patterns</h1>
              <p className="text-xs text-mid">Recurring themes the system has identified across your writing. Not diagnoses — observations about what keeps showing up.</p>
            </div>

            <div className="text-[12px] italic text-[#8DBFB4] pb-0.5">
              Patterns surface, shift, and go quiet based on what your entries show. The system doesn't declare anything finished.
            </div>

            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-2.5">
              <p className="text-[12.5px] text-primary leading-relaxed">
                You have 6 patterns identified across 12 cycles. 2 are still present, 2 are shifting, and 2 have gone quiet. Having more patterns isn't worse — it means the writing has been honest enough to surface them.
              </p>
              <div className="flex gap-4 flex-wrap text-xs text-[#4A6A64]">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#E0A898]" /> 2 present
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2 h-2 rounded-full bg-[#8DBFB4]" /> 2 shifting
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded bg-primary/20 border border-primary/30" /> 2 gone quiet
                </span>
              </div>
            </div>

            {/* Pattern Lists */}
            <div className="space-y-3.5">
              <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase">Present this cycle</div>
              {patternList.filter(p => p.badge.includes('Present') || p.badge.includes('New')).map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleOpenPattern(p.id)}
                  className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" />
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="text-[14px] font-bold text-primary group-hover:text-[#E0A898] transition-colors">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${p.badgeClass}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">{p.body}</p>
                  
                  {/* Across 12 cycles timeline preview */}
                  <div className="space-y-1 mb-2.5">
                    <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across 12 cycles</div>
                    <div className="flex gap-2">
                      {p.timeline.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${dotLabels[s]}`} />
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
              ))}

              <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase pt-1">Shifting</div>
              {patternList.filter(p => p.badge === 'Shifting').map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleOpenPattern(p.id)}
                  className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary" />
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="text-[14px] font-bold text-primary group-hover:text-[#2E7A70] transition-colors">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${p.badgeClass}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">{p.body}</p>
                  
                  {/* Timeline preview */}
                  <div className="space-y-1 mb-2.5">
                    <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across 12 cycles</div>
                    <div className="flex gap-2">
                      {p.timeline.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${dotLabels[s]}`} />
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
              ))}

              <div className="text-[9.5px] font-bold tracking-widest text-[#8DBFB4] uppercase pt-1">Gone quiet</div>
              {patternList.filter(p => p.badge === 'Gone quiet').map(p => (
                <div 
                  key={p.id}
                  onClick={() => handleOpenPattern(p.id)}
                  className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group opacity-85"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary/20" />
                  <div className="flex justify-between items-center mb-1.5">
                    <h3 className="text-[14px] font-bold text-primary group-hover:text-primary transition-colors">{p.name}</h3>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${p.badgeClass}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[12px] text-[#4A6A64] leading-relaxed mb-3">{p.body}</p>
                  
                  {/* Timeline preview */}
                  <div className="space-y-1 mb-2.5">
                    <div className="text-[8.5px] tracking-wider uppercase text-[#8DBFB4] font-bold">Across 12 cycles</div>
                    <div className="flex gap-2">
                      {p.timeline.map((s, idx) => (
                        <div key={idx} className="flex flex-col items-center">
                          <div className={`w-3 h-3 rounded-full ${dotLabels[s]}`} />
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
              ))}
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

            {/* Pattern Card Header */}
            <div className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4 shadow-xs space-y-2.5">
              <div className="flex justify-between items-start">
                <h2 className="font-serif text-lg text-primary">{patternList.find(p => p.id === activePatternId).name}</h2>
                <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${patternList.find(p => p.id === activePatternId).badgeClass}`}>
                  {patternList.find(p => p.id === activePatternId).badge}
                </span>
              </div>
              <p className="text-[12.5px] text-mid leading-relaxed">
                {patternList.find(p => p.id === activePatternId).body}
              </p>
              <div className="text-[10.5px] text-[#8DBFB4] border-t border-[#1E2A2E]/5 pt-2.5 font-medium">
                {patternList.find(p => p.id === activePatternId).meta}
              </div>
            </div>

            {/* Orientation */}
            <div className="bg-white border border-[#1E2A2E]/5 p-4 rounded-xl border-l-[2.5px] border-l-[#E0A898] space-y-1 font-serif text-[14px] text-[#1E2A2E] italic leading-relaxed">
              {patternDetails[activePatternId].orientation}
            </div>

            {/* Connection panel */}
            {patternDetails[activePatternId].connected && (
              <div className="bg-white border border-[#B8A8D4]/25 rounded-xl p-4 flex gap-2.5 shadow-xs">
                <div className="w-7 h-7 rounded-lg bg-[#B8A8D4]/10 text-[#5A4A8A] flex items-center justify-center shrink-0 mt-0.5">
                  <Link2 size={14} />
                </div>
                <div className="space-y-1.5">
                  <div className="text-[9px] tracking-wider uppercase text-[#7A6A9E] font-bold">May be connected</div>
                  <p className="text-[12px] text-primary leading-relaxed">
                    {patternDetails[activePatternId].connectedBody}
                  </p>
                  <div className="flex gap-2 flex-wrap pt-0.5">
                    {patternDetails[activePatternId].connectedLinks.map(link => (
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
                  {dotDefs[activePatternId].map((s, idx) => {
                    const cycleNumber = idx + 1;
                    const isCardEmpty = patternDetails[activePatternId].cycleData[cycleNumber]?.entries.length === 0 &&
                      patternDetails[activePatternId].cycleData[cycleNumber]?.obs.includes('Not present');
                    return (
                      <div 
                        key={idx} 
                        onClick={() => !isCardEmpty && jumpToCycleCard(12 - cycleNumber)}
                        className={`flex flex-col items-center w-[48px] relative ${isCardEmpty ? 'opacity-35 cursor-not-allowed' : 'cursor-pointer group'}`}
                      >
                        {/* Horizontal connecting line */}
                        {idx < 11 && (
                          <div className="absolute top-[11px] left-[24px] right-[-24px] h-[2px] bg-[#1E2A2E]/5 z-0" />
                        )}
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center z-10 transition-transform ${dotLabels[s]} ${!isCardEmpty ? 'group-hover:scale-115' : ''}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
                        </div>
                        <span className="text-[9px] font-bold text-primary mt-1">C{cycleNumber}</span>
                        <span className="text-[7.5px] uppercase font-mono text-mid/60 mt-0.5 leading-none">
                          {s === 'newdot' ? 'New' : s === 'strong' ? 'Strong' : s === 'shifting' ? 'Shifting' : s === 'returned' ? 'Ret' : s === 'quiet' ? 'Quiet' : '—'}
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
                Cycle by cycle — all 12
              </div>
              <div className="space-y-2.5">
                {Object.keys(patternDetails[activePatternId].cycleData)
                  .map(Number)
                  .sort((a, b) => b - a)
                  .map((cycleNum, idx) => {
                    const cd = patternDetails[activePatternId].cycleData[cycleNum];
                    const isAbsent = cd.obs.includes('Not present');
                    const isCur = cycleNum === 12;
                    const timelineStatus = dotDefs[activePatternId][cycleNum - 1];
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
                            <span className={`px-2 py-0.5 rounded text-[9px] font-semibold uppercase ${dotLabels[timelineStatus]}`}>
                              {timelineStatus === 'newdot' ? 'New' : timelineStatus === 'strong' ? 'Strong' : timelineStatus === 'shifting' ? 'Shifting' : timelineStatus === 'returned' ? 'Returned' : timelineStatus === 'quiet' ? 'Quiet' : 'Not present'}
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
                            
                            {cd.entries.length > 0 && (
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
          </div>
        )}
      </main>
    </div>
  );
}
