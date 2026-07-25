import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  RotateCw,
  Sparkles,
  X,
  AlertCircle,
  Save
} from 'lucide-react';
import { EXERCISE_0_QUESTIONS } from '../../../lib/exercises/v4/definitions/exercise0Catalog';

export default function Exercise0Flow({ instanceId, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [savingQuestionId, setSavingQuestionId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const textDebounceTimer = useRef(null);

  useEffect(() => {
    initializeFlow();
  }, [instanceId]);

  const initializeFlow = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Call Resume API to fetch current instance state & saved responses
      const resumeRes = await fetch('/api/exercises/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId })
      });

      let currentInst = null;
      let existingResponses = [];

      if (resumeRes.ok) {
        const resumeData = await resumeRes.json();
        currentInst = resumeData.instance;
        existingResponses = resumeData.responses || [];
      } else {
        // If not in started/in_progress yet, start it
        const startRes = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id: instanceId })
        });
        if (!startRes.ok) {
          const errData = await startRes.json().catch(() => ({}));
          throw new Error(errData.error?.message || 'Failed to initialize exercise.');
        }
        const startData = await startRes.json();
        currentInst = startData.instance;
      }

      setInstance(currentInst);

      // Restore saved answers into state
      const restoredAnswers = {};
      existingResponses.forEach(r => {
        restoredAnswers[r.question_id] = r.response;
      });
      setAnswers(restoredAnswers);

      // Position user at first unanswered step
      const firstUnanswered = EXERCISE_0_QUESTIONS.findIndex(q => restoredAnswers[q.id] === undefined || restoredAnswers[q.id] === null || restoredAnswers[q.id] === '');
      if (firstUnanswered >= 0) {
        setCurrentStep(firstUnanswered);
      } else {
        setCurrentStep(EXERCISE_0_QUESTIONS.length - 1);
      }
    } catch (err) {
      console.error('[Exercise0Flow] Init error:', err);
      setError(err.message || 'Unable to load exercise.');
    } finally {
      setLoading(false);
    }
  };

  const handleAutosave = async (questionId, value) => {
    setSavingQuestionId(questionId);
    try {
      const res = await fetch('/api/exercises/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instanceId,
          question_id: questionId,
          response: value
        })
      });
      if (!res.ok) {
        console.warn(`[Autosave] Save failed for ${questionId}`);
      } else {
        const data = await res.json();
        if (data.instance) setInstance(data.instance);
      }
    } catch (err) {
      console.error('[Autosave] Error:', err);
    } finally {
      setSavingQuestionId(null);
    }
  };

  const handleAnswerChange = (questionId, value, isText = false) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));

    if (isText) {
      if (textDebounceTimer.current) clearTimeout(textDebounceTimer.current);
      textDebounceTimer.current = setTimeout(() => {
        handleAutosave(questionId, value);
      }, 600);
    } else {
      handleAutosave(questionId, value);
    }
  };

  const isCurrentStepValid = () => {
    const currentQ = EXERCISE_0_QUESTIONS[currentStep];
    if (!currentQ) return false;
    const val = answers[currentQ.id];
    if (val === undefined || val === null) return false;
    if (typeof val === 'string' && val.trim() === '') return false;
    return true;
  };

  const handleNextStep = () => {
    if (!isCurrentStepValid()) return;
    if (currentStep < EXERCISE_0_QUESTIONS.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isCurrentStepValid()) return;
    setSubmitting(true);
    setError(null);
    try {
      // 1. Trigger final autosave for current step to guarantee persistence
      const currentQ = EXERCISE_0_QUESTIONS[currentStep];
      await handleAutosave(currentQ.id, answers[currentQ.id]);

      // 2. Submit exercise instance
      const res = await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error?.message || 'Failed to submit exercise.');
      }

      if (onComplete) onComplete();
    } catch (err) {
      console.error('[Exercise0Flow] Submit error:', err);
      setError(err.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
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
          <p className="text-sm font-serif italic text-primary">Preparing Exercise 0 Baseline...</p>
        </div>
      </div>
    );
  }

  if (error && !instance) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0]/90 backdrop-blur-md flex items-center justify-center p-6">
        <div className="bg-white/80 border border-white rounded-3xl p-8 max-w-md w-full text-center space-y-4 shadow-xl">
          <AlertCircle className="w-10 h-10 text-amber-600 mx-auto" />
          <h3 className="font-serif italic text-xl text-primary">Exercise Error</h3>
          <p className="text-xs text-mid">{error}</p>
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

  const currentQ = EXERCISE_0_QUESTIONS[currentStep];
  const progressPercent = Math.round(((currentStep + 1) / EXERCISE_0_QUESTIONS.length) * 100);

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] overflow-y-auto flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Bar */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between gap-4 pb-4 border-b border-black/5">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-white/70 hover:bg-white border border-white/90 flex items-center justify-center text-primary transition-all cursor-pointer shadow-sm"
          >
            <X className="w-4 h-4" />
          </button>
          <div>
            <h2 className="font-serif italic text-lg text-primary">Exercise 0: Cognitive &amp; Emotional Baseline</h2>
            <p className="text-[11px] text-mid">Step {currentStep + 1} of {EXERCISE_0_QUESTIONS.length}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {savingQuestionId && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <Save className="w-3.5 h-3.5 animate-pulse" />
              Saving...
            </span>
          )}
          <div className="w-28 bg-black/5 rounded-full h-2 overflow-hidden border border-black/5">
            <div
              className="bg-secondary h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      {/* Main Question Card */}
      <main className="max-w-2xl mx-auto w-full my-auto py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQ.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="bg-white/70 backdrop-blur-md border border-white/90 rounded-3xl p-8 md:p-10 space-y-8 shadow-sm"
          >
            <div className="space-y-2">
              <span className="text-[11px] font-mono text-mid uppercase tracking-widest">
                Question {currentStep + 1}
              </span>
              <h3 className="text-xl md:text-2xl font-serif italic text-primary leading-tight">
                {currentQ.title}
              </h3>
              {currentQ.subtitle && (
                <p className="text-xs text-mid leading-relaxed">{currentQ.subtitle}</p>
              )}
            </div>

            {/* Question Input Renderer */}
            <div className="space-y-4">
              {currentQ.type === 'scale' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(val => {
                      const isSelected = answers[currentQ.id] === val;
                      return (
                        <button
                          key={val}
                          onClick={() => handleAnswerChange(currentQ.id, val)}
                          className={`py-4 rounded-2xl text-lg font-serif italic font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? 'bg-primary text-white border-primary shadow-md scale-105'
                              : 'bg-white/80 text-primary border-white hover:bg-white hover:border-secondary/40'
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-mid font-medium px-1">
                    <span>{currentQ.minLabel}</span>
                    <span>{currentQ.maxLabel}</span>
                  </div>
                </div>
              )}

              {currentQ.type === 'choice' && currentQ.options && (
                <div className="space-y-3">
                  {currentQ.options.map(opt => {
                    const isSelected = answers[currentQ.id] === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => handleAnswerChange(currentQ.id, opt.value)}
                        className={`w-full p-4 rounded-2xl text-left text-sm transition-all cursor-pointer flex items-center justify-between border ${
                          isSelected
                            ? 'bg-primary/5 border-secondary text-primary font-medium shadow-sm'
                            : 'bg-white/80 text-primary/80 border-white hover:bg-white hover:border-secondary/30'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          isSelected ? 'border-secondary bg-secondary text-white' : 'border-black/20'
                        }`}>
                          {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'text' && (
                <textarea
                  value={answers[currentQ.id] || ''}
                  onChange={(e) => handleAnswerChange(currentQ.id, e.target.value, true)}
                  placeholder="Type your reflection here..."
                  rows={5}
                  className="w-full p-4 rounded-2xl bg-white/90 border border-white text-sm text-primary placeholder-mid/40 focus:outline-none focus:ring-2 focus:ring-secondary/50 transition-all resize-none"
                />
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <p className="text-xs text-amber-700 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20 text-center mt-4">
            {error}
          </p>
        )}
      </main>

      {/* Bottom Navigation */}
      <footer className="max-w-3xl mx-auto w-full flex items-center justify-between gap-4 pt-4 border-t border-black/5">
        <button
          onClick={handlePrevStep}
          disabled={currentStep === 0 || submitting}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            currentStep === 0 || submitting
              ? 'opacity-30 cursor-not-allowed text-mid'
              : 'bg-white/70 hover:bg-white border border-white/90 text-primary shadow-sm'
          }`}
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Previous
        </button>

        {currentStep < EXERCISE_0_QUESTIONS.length - 1 ? (
          <button
            onClick={handleNextStep}
            disabled={!isCurrentStepValid() || submitting}
            className={`inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              !isCurrentStepValid() || submitting
                ? 'opacity-40 cursor-not-allowed bg-black/10 text-mid'
                : 'bg-primary text-white hover:bg-primary/90 shadow-sm'
            }`}
          >
            Next <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!isCurrentStepValid() || submitting}
            className={`inline-flex items-center gap-2 px-7 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              !isCurrentStepValid() || submitting
                ? 'opacity-40 cursor-not-allowed bg-black/10 text-mid'
                : 'bg-secondary text-white hover:bg-secondary/90 shadow-md'
            }`}
          >
            {submitting ? (
              <>
                <RotateCw className="w-4 h-4 animate-spin" /> Submitting...
              </>
            ) : (
              <>
                Complete Exercise <CheckCircle2 className="w-4 h-4" />
              </>
            )}
          </button>
        )}
      </footer>
    </div>
  );
}
