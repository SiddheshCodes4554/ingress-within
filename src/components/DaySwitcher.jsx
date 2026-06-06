import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, PenTool, Heart, LineChart, Sparkles } from 'lucide-react';

import InteractiveJournal from './InteractiveJournal';
import InteractiveExercise from './InteractiveExercise';
import InteractiveReport from './InteractiveReport';

const MILESTONES = [
  {
    day: 1,
    title: "Baseline Assessment",
    sub: "Day 01 — Baseline evaluation",
    desc: "A scientific inquiry into your current focus levels, routine habits, and stress factors. We map your cognitive baselines before you begin daily journaling.",
    icon: ClipboardList,
    color: 'bg-accent text-primary',
    progress: 10
  },
  {
    day: 5,
    title: "Daily Journaling",
    sub: "Day 05 — Active observation",
    desc: "Establish a daily reflection rhythm in a clean, clutter-free environment. Learn to capture raw thought streams as they occur without judgment.",
    icon: PenTool,
    color: 'bg-secondary text-primary',
    progress: 35
  },
  {
    day: 10,
    title: "Cognitive Exercises",
    sub: "Day 10 — Narrative reframing",
    desc: "Complete guided cognitive tasks once every 72 hours. Break down automatic negative assumptions and rebuild them using objective, fact-based perspectives.",
    icon: Heart,
    color: 'bg-supporting text-primary',
    progress: 60
  },
  {
    day: 15,
    title: "Weekly Reports",
    sub: "Day 15 — Synthesizing themes",
    desc: "Access your initial weekly reports. Discover recurring emotional triggers, weekly consistency ratings, and specific focus correlation stats.",
    icon: LineChart,
    color: 'bg-secondary text-primary',
    progress: 80
  },
  {
    day: 30,
    title: "Deep Insights",
    sub: "Day 30 — Complete growth blueprint",
    desc: "The final monthly synthesis. An in-depth report detailing your progress, value alignment, behavioral triggers, and a download-ready PDF progress report.",
    icon: Sparkles,
    color: 'bg-primary text-white',
    progress: 100
  }
];

export default function DaySwitcher({ activeIndex: propActiveIndex, setActiveIndex: propSetActiveIndex }) {
  const [localActiveIndex, setLocalActiveIndex] = useState(0);
  const activeIndex = propActiveIndex !== undefined ? propActiveIndex : localActiveIndex;
  const setActiveIndex = propSetActiveIndex !== undefined ? propSetActiveIndex : setLocalActiveIndex;
  const activeMilestone = MILESTONES[activeIndex];
  const IconComponent = activeMilestone.icon;

  // Day 1 (Baseline Assessment) States
  const [baselineFocus, setBaselineFocus] = useState(70);
  const [baselineSleep, setBaselineSleep] = useState(60);
  const [baselineStress, setBaselineStress] = useState(50);

  // Day 5 (Daily Journaling) States
  const journalPrompts = [
    "Today, my main goal is to remain calm and focused during the deployment review.",
    "Woke up feeling tense. I am taking 5 deep breaths to reset my attention before reading emails."
  ];
  const [journalText, setJournalText] = useState("");
  const [typingIndex, setTypingIndex] = useState(0);

  useEffect(() => {
    if (activeIndex === 1) { // Day 5
      setJournalText("");
      const targetText = journalPrompts[typingIndex % journalPrompts.length];
      let current = "";
      let i = 0;
      const interval = setInterval(() => {
        if (i < targetText.length) {
          current += targetText[i];
          setJournalText(current);
          i++;
        } else {
          clearInterval(interval);
          const timeout = setTimeout(() => {
            setTypingIndex(prev => prev + 1);
          }, 3000);
          return () => clearTimeout(timeout);
        }
      }, 35);
      return () => clearInterval(interval);
    }
  }, [activeIndex, typingIndex]);

  // Day 10 (Cognitive Exercises) States
  const [isCbtReframed, setIsCbtReframed] = useState(false);

  // Day 15 (Weekly Reports) States
  const [hoveredReportDay, setHoveredReportDay] = useState(null);

  // Day 30 (Deep Insights) States
  const [downloadClicked, setDownloadClicked] = useState(false);

  return (
    <div className="w-full">
      {/* Consolidated Sandbox Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Column: Vertical Stepper Timeline (lg:col-span-5) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-sm space-y-8 min-h-[500px]">
          <div className="space-y-6 text-left">
            <div>
              <span className="text-[10px] font-bold text-secondary uppercase tracking-[0.15em] block mb-1">Methodology Path</span>
              <h3 className="font-headline-md text-2xl font-bold text-primary">The Arch of Insight</h3>
              <p className="text-xs text-primary/60 leading-relaxed mt-1.5 font-body">
                Explore the guided 30-day reflection path. Click any milestone to test drive the corresponding feature.
              </p>
            </div>

            {/* Stepper Trail */}
            <div className="space-y-1 relative">
              {MILESTONES.map((m, idx) => {
                const IsActive = idx === activeIndex;
                const IsCompleted = idx < activeIndex;
                const MIcon = m.icon;
                
                return (
                  <div 
                    key={m.day} 
                    onClick={() => setActiveIndex(idx)}
                    className="flex gap-4 cursor-pointer group text-left relative"
                  >
                    {/* Connecting vertical line */}
                    {idx < MILESTONES.length - 1 && (
                      <div className="absolute left-6 top-12 bottom-0 w-[1.5px] bg-primary/5 z-0">
                        <motion.div 
                          className="w-full bg-secondary"
                          initial={{ height: 0 }}
                          animate={{ height: IsActive || IsCompleted ? '100%' : '0%' }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    )}

                    {/* Circle Indicator */}
                    <div 
                      className={`w-12 h-12 rounded-full flex items-center justify-center border transition-all duration-300 z-10 shrink-0 ${
                        IsActive 
                          ? 'bg-primary text-white border-primary scale-110 shadow-md ring-4 ring-primary/5' 
                          : IsCompleted
                          ? 'bg-secondary/20 text-primary border-secondary'
                          : 'bg-white text-primary/30 border-primary/10 group-hover:border-primary/30'
                      }`}
                    >
                      <MIcon size={16} />
                    </div>

                    {/* Text block */}
                    <div className="space-y-1 pb-4 flex-grow pt-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-sans font-bold uppercase tracking-wider ${
                          IsActive ? 'text-secondary font-bold' : 'text-primary/40'
                        }`}>
                          {idx === 0 ? "Start" : idx === MILESTONES.length - 1 ? "Insights" : `Day ${String(m.day).padStart(2, '0')}`}
                        </span>
                        {IsActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                        )}
                      </div>
                      <h4 className={`text-xs font-bold transition-colors font-body ${
                        IsActive ? 'text-primary font-headline-md font-semibold text-sm' : 'text-primary/60 group-hover:text-primary'
                      }`}>
                        {m.title}
                      </h4>
                      
                      {/* Expanded description inside step */}
                      {IsActive && (
                        <p className="text-[11px] text-primary/60 leading-relaxed pt-1.5 select-text font-body">
                          {m.desc}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Stepper Bottom Navigation */}
          <div className="flex gap-2.5 pt-4 border-t border-primary/5">
            <button
              onClick={() => setActiveIndex((prev) => (prev === 0 ? MILESTONES.length - 1 : prev - 1))}
              className="flex-1 font-label text-xs tracking-wider uppercase font-bold border border-primary/10 hover:border-primary py-3 px-4 rounded-xl transition-all text-primary/70 cursor-pointer"
            >
              Previous
            </button>
            <button
              onClick={() => setActiveIndex((prev) => (prev + 1) % MILESTONES.length)}
              className="flex-1 font-label text-xs tracking-wider uppercase font-bold bg-primary hover:bg-primary/95 text-white py-3 px-4 rounded-xl transition-all cursor-pointer"
            >
              {activeIndex === MILESTONES.length - 1 ? "Reset Journey" : "Next Day"}
            </button>
          </div>
        </div>

        {/* Right Column: Active Interactive Component (lg:col-span-7) */}
        <div className="lg:col-span-7 min-h-[500px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.3 }}
              className="w-full h-full flex flex-col"
            >
              {activeIndex === 0 && (
                <div className="w-full bg-white rounded-premium p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 min-h-[500px] flex flex-col justify-between text-left relative overflow-hidden font-body">
                  <div className="flex justify-between items-center border-b border-primary/5 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <ClipboardList size={16} className="text-accent" />
                      <span className="font-label-md text-label-md uppercase font-semibold">1. Baseline Assessment</span>
                    </div>
                    <span className="text-[10px] font-bold text-accent bg-accent/10 px-2.5 py-0.5 rounded-full">
                      Day 01
                    </span>
                  </div>

                  <div className="flex flex-col md:flex-row items-center gap-6 flex-grow my-auto">
                    {/* Radar Polygon Visual */}
                    <div className="relative w-32 h-32 flex justify-center items-center shrink-0 mx-auto md:mx-0">
                      <svg className="w-32 h-32 overflow-visible" viewBox="-50 -50 100 100">
                        <polygon points="0,-40 35,20 -35,20" fill="none" stroke="#EAEAEA" strokeWidth="1" />
                        <polygon points="0,-20 17.5,10 -17.5,10" fill="none" stroke="#EAEAEA" strokeWidth="1" />
                        {(() => {
                          const sleepFactor = baselineSleep / 100;
                          const focusFactor = baselineFocus / 100;
                          const calmFactor = (100 - baselineStress) / 100;
                          const p1 = `0,${-40 * sleepFactor}`;
                          const p2 = `${35 * focusFactor},${20 * focusFactor}`;
                          const p3 = `${-35 * calmFactor},${20 * calmFactor}`;
                          return (
                            <polygon 
                              points={`${p1} ${p2} ${p3}`} 
                              fill="rgba(224, 168, 152, 0.45)" 
                              stroke="var(--color-accent)" 
                              strokeWidth="1.5" 
                              className="transition-all duration-300"
                            />
                          );
                        })()}
                      </svg>
                      <span className="absolute top-0 text-[8px] font-bold text-primary/50">Sleep</span>
                      <span className="absolute bottom-0 right-2 text-[8px] font-bold text-primary/50">Focus</span>
                      <span className="absolute bottom-0 left-2 text-[8px] font-bold text-primary/50">Calmness</span>
                    </div>

                    {/* Drag Sliders */}
                    <div className="flex-grow flex flex-col gap-3 w-full text-left">
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Focus Index</span>
                          <span className="text-secondary">{baselineFocus}%</span>
                        </div>
                        <input type="range" min="30" max="100" value={baselineFocus} onChange={(e) => setBaselineFocus(Number(e.target.value))} className="w-full h-1 bg-primary/5 accent-secondary rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Sleep Quality</span>
                          <span className="text-secondary">{baselineSleep}%</span>
                        </div>
                        <input type="range" min="30" max="100" value={baselineSleep} onChange={(e) => setBaselineSleep(Number(e.target.value))} className="w-full h-1 bg-primary/5 accent-secondary rounded-lg appearance-none cursor-pointer" />
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-xs font-bold">
                          <span>Stress Sensitivity</span>
                          <span className="text-accent">{baselineStress}%</span>
                        </div>
                        <input type="range" min="30" max="100" value={baselineStress} onChange={(e) => setBaselineStress(Number(e.target.value))} className="w-full h-1 bg-primary/5 accent-accent rounded-lg appearance-none cursor-pointer" />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-primary/5 pt-4 text-xs text-primary/45 font-semibold font-label">
                    Set your initial metrics to build your cognitive profile. Click "Next Day" on the left stepper to continue.
                  </div>
                </div>
              )}

              {activeIndex === 1 && <InteractiveJournal />}
              {activeIndex === 2 && <InteractiveExercise />}
              {activeIndex === 3 && <InteractiveReport />}

              {activeIndex === 4 && (
                <div className="w-full bg-white rounded-premium p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 min-h-[500px] flex flex-col justify-between text-left relative overflow-hidden font-body">
                  <div className="flex justify-between items-center border-b border-primary/5 pb-4">
                    <div className="flex items-center gap-2 text-primary">
                      <Sparkles size={16} className="text-secondary" />
                      <span className="font-label-md text-label-md uppercase font-semibold">5. Deep Insights Cycle Blueprint</span>
                    </div>
                    <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full">
                      Day 30
                    </span>
                  </div>

                  <div className="flex-grow flex flex-col justify-center gap-5 my-auto max-w-md mx-auto w-full">
                    <div className="border-2 border-primary/5 p-5 rounded-2xl relative bg-mint-grey/15">
                      <div className="absolute right-4 top-4 w-12 h-12 rounded-full border-4 border-secondary/20 flex items-center justify-center text-secondary font-bold text-[9px] rotate-[15deg] font-label">
                        SEAL
                      </div>
                      
                      <div className="flex justify-between items-center pb-2 border-b border-primary/5 mb-3">
                        <span className="text-[8px] font-bold text-primary/35 uppercase tracking-widest font-label">INGRESS WITHIN BluePRINT</span>
                        <span className="text-[8px] font-bold text-accent font-label">DAY 30 SUMMARY</span>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-primary/60 font-semibold">Resilience Level</span>
                          <span className="text-secondary font-bold">EXCELLENT (92%)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-primary/60 font-semibold">Cognitive Flexibility</span>
                          <span className="text-secondary font-bold">HIGH (88%)</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-primary/60 font-semibold">Reframing Ratio</span>
                          <span className="text-secondary font-bold">1:4.5 Stressors</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDownloadClicked(true);
                      setTimeout(() => setDownloadClicked(false), 2000);
                    }}
                    className={`w-full py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-xs cursor-pointer text-center ${
                      downloadClicked 
                        ? 'bg-secondary text-primary border border-transparent' 
                        : 'bg-primary text-white hover:bg-primary/95 border border-transparent'
                    }`}
                  >
                    {downloadClicked ? 'BluePRINT PDF COMPILED ✓' : 'DOWNLOAD GROWTH BluePRINT (PDF)'}
                  </button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
