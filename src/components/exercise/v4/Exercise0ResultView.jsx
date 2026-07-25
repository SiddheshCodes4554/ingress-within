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
              <h2 className="font-serif italic text-xl text-primary">Exercise 0: Baseline Analysis</h2>
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

        {/* Executive Summary Card */}
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
            "{result.summary || analysis.summary}"
          </p>

          {analysis.cognitive_style && (
            <div className="pt-3 border-t border-black/5 text-xs text-mid flex items-center gap-2">
              <span className="font-semibold text-primary">Cognitive Style:</span>
              <span className="bg-primary/5 px-3 py-1 rounded-lg font-medium text-primary">
                {analysis.cognitive_style}
              </span>
            </div>
          )}
        </motion.div>

        {/* Baseline Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'Emotional Resilience', score: analysis.emotional_resilience_score || result.score || 80, icon: Compass, color: 'text-emerald-700 bg-emerald-500/10' },
            { label: 'Pattern Awareness', score: analysis.pattern_awareness_score || 75, icon: TrendingUp, color: 'text-amber-700 bg-amber-500/10' },
            { label: 'Values Alignment', score: analysis.values_alignment_score || 85, icon: Sparkles, color: 'text-secondary bg-secondary/10' }
          ].map((metric, idx) => (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white/70 backdrop-blur-md border border-white/90 rounded-2xl p-5 space-y-3 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <metric.icon className="w-5 h-5 text-secondary" />
                <span className={`text-lg font-serif italic font-bold px-2.5 py-0.5 rounded-xl ${metric.color}`}>
                  {metric.score}/100
                </span>
              </div>
              <p className="text-xs font-semibold text-primary">{metric.label}</p>
              <div className="w-full bg-black/5 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-500"
                  style={{ width: `${metric.score}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Key Insights Card */}
        {analysis.key_insights && analysis.key_insights.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-md border border-white/90 rounded-3xl p-8 space-y-4 shadow-sm"
          >
            <h3 className="text-lg font-serif italic text-primary">Key Baseline Insights</h3>
            <div className="space-y-3">
              {analysis.key_insights.map((insight, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-primary/90 leading-relaxed bg-white/50 p-3.5 rounded-xl border border-white/80">
                  <span className="w-5 h-5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Actionable Guidance */}
        {analysis.recommendations && analysis.recommendations.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/70 backdrop-blur-md border border-white/90 rounded-3xl p-8 space-y-4 shadow-sm"
          >
            <h3 className="text-lg font-serif italic text-primary">Recommendations for Your Journey</h3>
            <div className="space-y-3">
              {analysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-primary/90 leading-relaxed bg-secondary/5 p-3.5 rounded-xl border border-secondary/10">
                  <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Footer Bar */}
        <div className="text-center pt-4 border-t border-black/5">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
          >
            Return to Exercise Hub
          </button>
        </div>
      </div>
    </div>
  );
}
