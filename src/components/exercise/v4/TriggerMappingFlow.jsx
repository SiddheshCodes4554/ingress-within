import React, { useState } from 'react';
import TriggerMappingResultView from './TriggerMappingResultView';
import { ArrowLeft, RotateCw } from 'lucide-react';

export default function TriggerMappingFlow({ instance, instanceId, onClose }) {
  const [phase, setPhase] = useState('intro'); // 'intro' | 'entries' | 'synthesis' | 'loading' | 'result'
  const [entryIdx, setEntryIdx] = useState(0);
  const [entryAnswers, setEntryAnswers] = useState({});
  const [synthesisAnswer, setSynthesisAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentAns = entryAnswers[entryIdx] || { q1: '', q2: '', q3: '' };
  const isEntryComplete = (currentAns.q1 || '').trim().length >= 3 && (currentAns.q2 || '').trim().length >= 3 && (currentAns.q3 || '').trim().length >= 3;

  const handleAnswerChange = (field, value) => {
    setEntryAnswers(prev => ({
      ...prev,
      [entryIdx]: {
        ...prev[entryIdx],
        [field]: value
      }
    }));
  };

  const handleNextEntry = () => {
    if (!isEntryComplete) return;
    if (entryIdx < 4) {
      setEntryIdx(prev => prev + 1);
    } else {
      setPhase('synthesis');
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting || synthesisAnswer.trim().length < 3) return;
    setIsSubmitting(true);
    setPhase('loading');

    const formattedAnswers = Array.from({ length: 5 }).map((_, idx) => ({
      entry_index: idx + 1,
      q1: (entryAnswers[idx]?.q1 || '').trim(),
      q2: (entryAnswers[idx]?.q2 || '').trim(),
      q3: (entryAnswers[idx]?.q3 || '').trim()
    }));

    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'trigger_mapping',
          entry_answers: formattedAnswers,
          synthesis_answer: synthesisAnswer.trim()
        })
      });
    } catch (err) {
      console.error('[TriggerMappingFlow] Submission error:', err);
    } finally {
      setIsSubmitting(false);
      setPhase('result');
    }
  };

  if (phase === 'result') {
    return <TriggerMappingResultView instanceId={instance?.id || instanceId} onClose={onClose} />;
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Mapping trigger architecture...
        </p>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[540px] mx-auto w-full pt-8 space-y-6">
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="space-y-3 pt-4">
            <span className="text-xs uppercase tracking-widest text-[#4A6A64] font-semibold">
              Month 3 • Exercise 6B
            </span>
            <h1 className="text-3xl font-serif text-stone-900 tracking-tight">
              Trigger Mapping
            </h1>
            <p className="text-base text-stone-600 leading-relaxed font-light">
              Map the situational architecture of reactive states across 5 high-intensity moments and identify your agency decision points.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-3 text-sm text-stone-600 leading-relaxed">
            <p>
              We'll look at 5 moments from your journal history where emotional intensity was highest. For each moment, you'll answer 3 short questions.
            </p>
            <p className="text-xs text-stone-400">
              Estimated duration: 8–12 minutes
            </p>
          </div>
        </div>

        <div className="max-w-[540px] mx-auto w-full pb-8">
          <button
            onClick={() => setPhase('entries')}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Begin Mapping
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'synthesis') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
        <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6">
          <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
            <span>Synthesis</span>
            <button onClick={onClose} className="hover:text-stone-700">Exit</button>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-serif text-stone-900 leading-snug">
              Looking at these five moments together — is there a pattern in the situations that put you in this state?
            </h2>
            <textarea
              value={synthesisAnswer}
              onChange={(e) => setSynthesisAnswer(e.target.value)}
              placeholder="Reflect on the common thread across these moments..."
              rows={6}
              className="w-full bg-white rounded-2xl p-4 border border-stone-200 text-stone-900 text-base focus:outline-none focus:border-[#4A6A64] resize-none shadow-sm font-sans"
            />
          </div>
        </div>

        <div className="max-w-[620px] mx-auto w-full pb-8">
          <button
            onClick={handleFinalSubmit}
            disabled={synthesisAnswer.trim().length < 3 || isSubmitting}
            className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm ${
              synthesisAnswer.trim().length >= 3 && !isSubmitting
                ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            Complete Trigger Mapping
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col justify-between p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full pt-4 space-y-6">
        <div className="flex items-center justify-between text-xs text-stone-400 font-medium">
          <span>Moment {entryIdx + 1} of 5</span>
          <button onClick={onClose} className="hover:text-stone-700">Exit</button>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#4A6A64]">
              What was actually happening when you wrote this?
            </label>
            <input
              type="text"
              value={currentAns.q1}
              onChange={(e) => handleAnswerChange('q1', e.target.value)}
              placeholder="Describe the situation plainly..."
              className="w-full bg-stone-50 rounded-xl p-3 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-[#4A6A64]"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#4A6A64]">
              What were you most afraid of in that moment?
            </label>
            <input
              type="text"
              value={currentAns.q2}
              onChange={(e) => handleAnswerChange('q2', e.target.value)}
              placeholder="Name the feared outcome..."
              className="w-full bg-stone-50 rounded-xl p-3 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-[#4A6A64]"
            />
          </div>

          <div className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#4A6A64]">
              How did it resolve — or did it?
            </label>
            <input
              type="text"
              value={currentAns.q3}
              onChange={(e) => handleAnswerChange('q3', e.target.value)}
              placeholder="How did the moment conclude..."
              className="w-full bg-stone-50 rounded-xl p-3 border border-stone-200 text-stone-900 text-sm focus:outline-none focus:border-[#4A6A64]"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[620px] mx-auto w-full pb-8">
        <button
          onClick={handleNextEntry}
          disabled={!isEntryComplete}
          className={`w-full py-4 rounded-2xl text-sm font-semibold transition-all cursor-pointer shadow-sm ${
            isEntryComplete
              ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
              : 'bg-stone-200 text-stone-400 cursor-not-allowed'
          }`}
        >
          {entryIdx < 4 ? 'Next Moment' : 'Proceed to Synthesis'}
        </button>
      </div>
    </div>
  );
}
