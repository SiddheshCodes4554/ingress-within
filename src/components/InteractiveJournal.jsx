import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Sparkles, CheckCircle, Brain } from 'lucide-react';

const EMOTION_MAP = [
  { word: 'overwhelmed', label: 'Stress / Overwhelm', color: 'bg-accent text-primary border-accent/25 shadow-[0_0_12px_rgba(224,168,152,0.25)]', type: 'tense' },
  { word: 'anxious', label: 'Anxiety', color: 'bg-supporting text-primary border-supporting/25 shadow-[0_0_12px_rgba(184,168,212,0.25)]', type: 'tense' },
  { word: 'tension', label: 'Anxiety', color: 'bg-supporting text-primary border-supporting/25 shadow-[0_0_12px_rgba(184,168,212,0.25)]', type: 'tense' },
  { word: 'worry', label: 'Anxiety', color: 'bg-supporting text-primary border-supporting/25 shadow-[0_0_12px_rgba(184,168,212,0.25)]', type: 'tense' },
  { word: 'refocused', label: 'Clarity / Focus', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'walk', label: 'Mindfulness', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'nature', label: 'Mindfulness', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'calm', label: 'Mindfulness', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'better', label: 'Agency / Growth', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'control', label: 'Agency / Growth', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'happy', label: 'Joy', color: 'bg-accent text-primary border-accent/25 shadow-[0_0_12px_rgba(224,168,152,0.25)]', type: 'growth' },
  { word: 'excited', label: 'Joy', color: 'bg-accent text-primary border-accent/25 shadow-[0_0_12px_rgba(224,168,152,0.25)]', type: 'growth' },
  { word: 'tired', label: 'Fatigue', color: 'bg-primary/10 text-primary border-primary/20 shadow-sm', type: 'tense' },
  { word: 'exhausted', label: 'Fatigue', color: 'bg-primary/10 text-primary border-primary/20 shadow-sm', type: 'tense' },
];

const SAMPLE_TEXT = "I felt completely overwhelmed by the team meeting today. There was so much anxious tension in the room about the budget, and I found myself shutting down. But later, I took a 10-minute walk, refocused my energy, and wrote a clear summary email to align everyone. It felt much better to take control of what I could.";

export default function InteractiveJournal() {
  const [text, setText] = useState('');
  const [detectedEmotions, setDetectedEmotions] = useState([]);
  const [stats, setStats] = useState({ tense: 0, growth: 0, neutral: 100 });
  const [isAutoTyping, setIsAutoTyping] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const found = [];
    let tenseCount = 0;
    let growthCount = 0;

    EMOTION_MAP.forEach((item) => {
      if (text.toLowerCase().includes(item.word)) {
        if (!found.some(f => f.label === item.label)) {
          found.push(item);
        }
        if (item.type === 'tense') tenseCount++;
        if (item.type === 'growth') growthCount++;
      }
    });

    setDetectedEmotions(found);

    const total = tenseCount + growthCount;
    if (total > 0) {
      const tensePct = Math.round((tenseCount / total) * 100);
      const growthPct = 100 - tensePct;
      setStats({ tense: tensePct, growth: growthPct, neutral: 0 });
    } else {
      setStats({ tense: 0, growth: 0, neutral: 100 });
    }
  }, [text]);

  const handleAutoType = () => {
    if (isAutoTyping) return;
    setIsAutoTyping(true);
    setIsSaved(false);
    setText('');
    let index = 0;
    
    const interval = setInterval(() => {
      setText((prev) => prev + SAMPLE_TEXT[index]);
      index++;
      if (index >= SAMPLE_TEXT.length) {
        clearInterval(interval);
        setIsAutoTyping(false);
      }
    }, 15);
  };

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="w-full bg-white rounded-premium overflow-hidden shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
      {/* Writing Pad Area */}
      <div className="md:col-span-7 p-6 md:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-primary/5 bg-[#FBFBFB]">
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-primary">
              <PenLine size={16} className="text-secondary" />
              <span className="font-label-md text-label-md uppercase tracking-wider font-semibold">Writing Space</span>
            </div>
            <button 
              onClick={handleAutoType}
              disabled={isAutoTyping}
              className="flex items-center gap-1.5 text-xs text-secondary hover:text-primary transition-colors font-label-md font-bold disabled:opacity-50 cursor-pointer"
            >
              <Sparkles size={14} className={isAutoTyping ? "animate-spin" : ""} />
              {isAutoTyping ? "Writing..." : "Simulate Writing"}
            </button>
          </div>
          
          <div className="relative">
            <textarea
              className="w-full min-h-[260px] bg-transparent text-primary placeholder-primary/40 border-0 outline-none resize-none font-body-md text-body-md leading-relaxed focus:ring-0 p-0"
              placeholder="Start typing your daily log here, or click 'Simulate Writing' above to see the live linguistic analysis..."
              value={text}
              onChange={(e) => {
                if (!isAutoTyping) setText(e.target.value);
              }}
              disabled={isAutoTyping}
            />
          </div>
        </div>

        <div className="pt-6 border-t border-primary/5 flex items-center justify-between">
          <span className="text-xs text-primary/45 font-label-sm">{text.length} characters</span>
          <button
            onClick={handleSave}
            disabled={!text || isAutoTyping || isSaved}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white font-label-md text-xs tracking-wider uppercase font-semibold py-3.5 px-6 rounded-xl transition-all shadow-sm disabled:opacity-30 disabled:hover:bg-primary cursor-pointer"
          >
            {isSaved ? (
              <>
                <CheckCircle size={14} className="text-secondary animate-bounce" />
                <span>Entry Logged</span>
              </>
            ) : (
              <span>Save Entry</span>
            )}
          </button>
        </div>
      </div>

      {/* Analysis Output Area */}
      <div className="md:col-span-5 p-6 md:p-8 flex flex-col justify-between bg-white">
        <div className="space-y-6">
          <div className="flex items-center gap-2 text-primary">
            <Brain size={16} className="text-accent" />
            <span className="font-label-md text-label-md uppercase tracking-wider font-semibold">Linguistic Analysis</span>
          </div>

          {/* Dynamic Sentiment Meter */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-label-md text-primary font-bold">
              <span>Sentiment Balance</span>
              <span>{stats.neutral === 100 ? "Neutral Baseline" : `${stats.growth}% Growth / ${stats.tense}% Stress`}</span>
            </div>
            <div className="h-2.5 w-full bg-primary/5 rounded-full overflow-hidden flex">
              {stats.neutral === 100 ? (
                <div className="h-full w-full bg-primary/20 transition-all duration-500" />
              ) : (
                <>
                  <motion.div 
                    className="h-full bg-secondary" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.growth}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                  <motion.div 
                    className="h-full bg-accent" 
                    initial={{ width: 0 }}
                    animate={{ width: `${stats.tense}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </>
              )}
            </div>
            <div className="flex justify-between text-[10px] font-label-sm text-primary/45 uppercase tracking-widest pt-1 font-bold">
              <span>Reflective / Agentic</span>
              <span>Tense / Reactive</span>
            </div>
          </div>

          {/* Detected Keywords */}
          <div className="space-y-3">
            <span className="text-xs font-label-md text-primary/70 block font-semibold">Extracted Keywords</span>
            <div className="min-h-[120px] border border-dashed border-primary/10 rounded-xl p-3 flex flex-wrap gap-2 items-start justify-start">
              <AnimatePresence>
                {detectedEmotions.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.5 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-body-md text-primary/40 italic p-1"
                  >
                    No patterns identified yet. Keep writing...
                  </motion.div>
                ) : (
                  detectedEmotions.map((item) => (
                    <motion.div
                      key={item.word}
                      initial={{ opacity: 0, scale: 0.85, y: 5 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: -5 }}
                      transition={{ duration: 0.25 }}
                      className={`text-xs px-2.5 py-1.5 rounded-full font-label-md border flex items-center gap-1.5 ${item.color}`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/45" />
                      <span className="font-bold italic font-display-lg-mobile">"{item.word}"</span>
                      <span className="text-[10px] opacity-60 font-sans tracking-wide">({item.label})</span>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Insight Prompt */}
        <div className="pt-6 border-t border-primary/5">
          <div className="bg-mint-grey rounded-2xl p-4 border border-primary/5">
            <h4 className="text-xs font-label-md font-bold text-primary mb-1 flex items-center gap-1">
              <Sparkles size={12} className="text-accent" />
              Dynamic Wellness Insight
            </h4>
            <p className="text-xs font-body-md text-primary/75 leading-relaxed">
              {stats.tense > 40 
                ? "Your entry shows high stress indicators. Writing reframing exercises after this entry correlates with a 30% increase in emotional recovery scores."
                : stats.growth > 40
                ? "Excellent shift in narrative perspective. You have successfully reframed a challenging situation, demonstrating high resilience."
                : "Type in the writing pad to begin. The engine will automatically parse emotional load, lexical structure, and resilience patterns."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
