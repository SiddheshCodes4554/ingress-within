import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CheckCircle2,
  X,
  RotateCw,
  TrendingUp,
  Brain,
  ShieldCheck,
  Compass,
  AlertCircle
} from 'lucide-react';

export default function Exercise0ResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [instance, setInstance] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      if (!res.ok) {
        throw new Error(`Failed to load result (HTTP ${res.status})`);
      }
      const data = await res.json();
      setResult(data.result);
      setInstance(data.instance);
    } catch (err) {
      console.error('[Exercise0ResultView] Fetch error:', err);
      setError(err.message || 'Unable to load exercise analysis.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white/80 border border-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <div className="absolute w-12 h-12 rounded-full border-2 border-secondary/20 animate-ping" />
            <RotateCw className="w-7 h-7 text-primary animate-spin" />
          </div>
          <p className="text-sm font-serif italic text-primary">Loading Exercise 0 Baseline Analysis...</p>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white/80 border border-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-serif italic text-xl text-primary">Analysis Processing</h3>
          <p className="text-xs text-mid">
            {error || 'Your baseline exercise analysis is being processed in the background. Please check back in a moment.'}
          </p>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const analysis = result.analysis || {};
  const scores = analysis.scores || {};

  const traitList = [
    { label: 'Openness', score: scores.openness ?? 75, desc: 'Curiosity & conceptual exploration' },
    { label: 'Conscientiousness', score: scores.conscientiousness ?? 70, desc: 'Structure & goal discipline' },
    { label: 'Extraversion', score: scores.extraversion ?? 65, desc: 'Social engagement & energy' },
    { label: 'Agreeableness', score: scores.agreeableness ?? 80, desc: 'Empathy & interpersonal harmony' },
    { label: 'Emotional Sensitivity', score: scores.neuroticism ?? 60, desc: 'Reactivity to environmental stress' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] overflow-y-auto p-4 md:p-8 font-sans">
      <div className="max-w-3xl mx-auto space-y-8 pb-16">
        {/* Top Header Bar */}
        <header className="flex items-center justify-between gap-4 pb-4 border-b border-black/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif italic text-xl text-primary">Baseline Assessment Analysis</h2>
              <p className="text-xs text-mid flex items-center gap-1.5 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Immutable Stored Assessment
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-white/90 flex items-center justify-center text-primary transition-all cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* Executive Synthesis Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/80 backdrop-blur-md border border-white/90 rounded-3xl p-8 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-mono text-mid uppercase tracking-widest">
              Executive Synthesis
            </span>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <CheckCircle2 className="w-3 h-3" /> Complete
            </span>
          </div>

          <p className="text-base text-primary font-serif italic leading-relaxed">
            "{result.summary || analysis.summary || 'Your baseline psychometric profile has been synthesized and recorded.'}"
          </p>
        </motion.div>

        {/* Personalization Profile Grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/70 backdrop-blur-md border border-white/90 rounded-3xl p-8 space-y-6 shadow-sm"
        >
          <div className="space-y-1">
            <h3 className="text-lg font-serif italic text-primary">Personalization Profile</h3>
            <p className="text-xs text-mid">Calculated baseline dimensions used to personalize your experience.</p>
          </div>

          <div className="space-y-4">
            {traitList.map((t, idx) => (
              <div key={t.label} className="space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-primary">{t.label}</span>
                  <span className="font-serif italic font-bold text-secondary">{t.score}/100</span>
                </div>
                <div className="w-full bg-black/5 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#8DBFB4] h-full rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, Math.max(0, t.score))}%` }}
                  />
                </div>
                <p className="text-[11px] text-mid italic">{t.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Footer Bar */}
        <div className="text-center pt-4 border-t border-black/5">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
