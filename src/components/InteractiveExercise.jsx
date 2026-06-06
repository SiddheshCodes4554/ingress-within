import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ArrowRight, CheckCircle2, ChevronRight, RefreshCw } from 'lucide-react';

const STRESSOR_OPTIONS = [
  { id: 'work', label: 'Work & Deadlines', sampleReactive: "I'm going to fail this project deadline and everyone will think I am completely incompetent.", sampleReframed: "Fact: The timeline is tight. Assumption: I will fail and be judged. Action: I can list remaining tasks, communicate roadblocks to my manager immediately, and focus on the most critical priority." },
  { id: 'health', label: 'Health & Burnout', sampleReactive: "I'm exhausted and can't keep up with anything. I'm falling behind and losing my grip.", sampleReframed: "Fact: I am physically exhausted. Assumption: I am falling behind permanently. Action: I need to take a deliberate rest day, reset my expectations, and decline non-essential tasks this week." },
  { id: 'relations', label: 'Relationship Friction', sampleReactive: "They didn't reply to my messages. They must be angry with me and our friendship is falling apart.", sampleReframed: "Fact: They haven't responded to my text yet. Assumption: They are angry and the friendship is ending. Action: I will give them space, avoid making assumptions, and send a friendly check-in tomorrow." },
  { id: 'future', label: 'Uncertain Future', sampleReactive: "I don't know where my career is going. Everything feels unstable and I'm going to end up stuck.", sampleReframed: "Fact: Career paths are non-linear and I am currently in a transition. Assumption: I will end up stuck. Action: I will identify three core skills I enjoy using and dedicate one hour a day to researching opportunities in those areas." }
];

export default function InteractiveExercise() {
  const [step, setStep] = useState(1);
  const [selectedStressor, setSelectedStressor] = useState(null);
  const [reactiveText, setReactiveText] = useState('');
  const [reframedText, setReframedText] = useState('');
  const [clarityScore, setClarityScore] = useState(25);

  const handleSelectStressor = (option) => {
    setSelectedStressor(option);
    setReactiveText(option.sampleReactive);
    setStep(2);
    setClarityScore(30);
  };

  const handleNextToReframe = () => {
    setReframedText(selectedStressor.sampleReframed);
    setStep(3);
    setTimeout(() => {
      setClarityScore(85);
    }, 150);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedStressor(null);
    setReactiveText('');
    setReframedText('');
    setClarityScore(25);
  };

  return (
    <div className="w-full bg-white rounded-premium p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 min-h-[500px] flex flex-col justify-between">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-primary/5 pb-4 mb-6">
        <div className="flex items-center gap-2 text-primary">
          <Brain size={16} className="text-accent" />
          <span className="font-label-md text-label-md uppercase font-semibold">Cognitive Reframing Demo</span>
        </div>
        <div className="flex items-center gap-1">
          {[1, 2, 3].map((s) => (
            <div 
              key={s} 
              className={`h-1.5 rounded-full transition-all duration-300 ${
                s === step ? 'w-4 bg-accent' : s < step ? 'w-2 bg-secondary' : 'w-2 bg-primary/10'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center md:text-left">
                <h3 className="font-display-lg-mobile text-headline-lg font-medium text-primary">Acknowledge a stress trigger.</h3>
                <p className="font-body-md text-primary/60 text-sm">Select a scenario that feels closest to your stressors today to begin the reframing process:</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {STRESSOR_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleSelectStressor(option)}
                    className="p-4 text-left border border-primary/5 hover:border-secondary rounded-2xl bg-surface-container-low hover:bg-[#F8FBFA] transition-all group flex justify-between items-center cursor-pointer"
                  >
                    <span className="font-body-md text-sm font-semibold text-primary">{option.label}</span>
                    <ChevronRight size={16} className="text-primary/30 group-hover:text-secondary group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-label-md text-secondary font-bold uppercase tracking-widest">Step 02 — Observe Initial Reaction</span>
                <h3 className="font-display-lg-mobile text-headline-lg font-medium text-primary">Your unfiltered response.</h3>
                <p className="font-body-md text-primary/60 text-sm">When stress hits, our brain automatically creates highly reactive, all-or-nothing thoughts:</p>
              </div>

              <div className="bg-mint-grey border border-primary/5 rounded-2xl p-5 relative overflow-hidden">
                <span className="font-label-sm text-[10px] text-secondary font-semibold block mb-2">AUTOMATIC COGNITIVE DISTORTION</span>
                <textarea
                  className="w-full bg-transparent border-0 outline-none resize-none font-body-md text-base italic leading-relaxed text-primary focus:ring-0 p-0 h-20"
                  value={reactiveText}
                  onChange={(e) => setReactiveText(e.target.value)}
                />
              </div>

              <div className="flex gap-4 pt-2">
                <button 
                  onClick={handleReset}
                  className="font-label-md text-xs tracking-wider uppercase font-semibold border border-primary/10 py-3.5 px-6 rounded-xl hover:bg-primary/5 transition-all text-primary/70 cursor-pointer"
                >
                  Back
                </button>
                <button 
                  onClick={handleNextToReframe}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-on-primary font-label-md text-xs tracking-wider uppercase font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <span>Begin Reframing</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <span className="text-[10px] font-label-md text-secondary font-bold uppercase tracking-widest">Step 03 — Objective Reframing</span>
                <h3 className="font-display-lg-mobile text-headline-lg font-medium text-primary">Separating fact from assumptions.</h3>
                <p className="font-body-md text-primary/60 text-sm">We rebuild the thought using three anchors: Facts, Assumptions, and actionable next steps.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                <div className="bg-secondary/5 border border-secondary/15 rounded-2xl p-4">
                  <div className="flex items-center gap-1.5 text-secondary font-semibold font-label-md text-xs tracking-wide uppercase mb-1">
                    <CheckCircle2 size={12} />
                    <span>REFRAMED RESPONSE</span>
                  </div>
                  <p className="font-body-md text-sm text-primary leading-relaxed italic">
                    {reframedText}
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-between items-stretch sm:items-center">
                <button 
                  onClick={handleReset}
                  className="font-label-md text-xs tracking-wider uppercase font-semibold border border-primary/10 py-3.5 px-6 rounded-xl hover:bg-primary/5 transition-all text-primary/70 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw size={12} />
                  <span>Try Another</span>
                </button>
                <button 
                  onClick={handleReset}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-accent hover:bg-accent/95 text-primary font-label-md text-xs tracking-wider uppercase font-bold py-3.5 px-8 rounded-xl transition-all shadow-sm cursor-pointer"
                >
                  <span>Unlock Guided Exercises</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Metrics */}
      <div className="border-t border-primary/5 pt-6 mt-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-label-sm text-primary/55 uppercase tracking-widest block font-bold">COGNITIVE CLARITY INDEX</span>
            <div className="flex items-baseline gap-1 mt-1">
              <motion.span 
                className="font-display text-2xl font-bold text-primary"
                animate={{ color: clarityScore > 50 ? '#36675e' : '#091519' }}
              >
                {clarityScore}%
              </motion.span>
              <span className="text-xs text-primary/45 font-label-sm">{clarityScore > 50 ? "Clear Mind" : "Cognitive Fog"}</span>
            </div>
          </div>
          <div className="w-1/2 bg-primary/5 h-2 rounded-full overflow-hidden">
            <motion.div 
              className={`h-full ${clarityScore > 50 ? 'bg-secondary' : 'bg-accent/60'}`}
              initial={{ width: '25%' }}
              animate={{ width: `${clarityScore}%` }}
              transition={{ type: 'spring', stiffness: 50 }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
