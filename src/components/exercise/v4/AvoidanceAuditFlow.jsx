import React, { useState, useEffect } from 'react';
import { AVOIDANCE_PROMPTS } from '../../../lib/exercises/v4/definitions/avoidanceAuditCatalog';
import AvoidanceAuditResultView from './AvoidanceAuditResultView';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function AvoidanceAuditFlow({ instanceId, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'prompts' | 'loading' | 'result'

  const [promptIdx, setPromptIdx] = useState(0);
  const [completions, setCompletions] = useState({});

  useEffect(() => {
    initializeFlow();
  }, [instanceId]);

  const initializeFlow = async () => {
    setLoading(true);
    try {
      let currentInst = null;
      if (instanceId) {
        const resumeRes = await fetch(`/api/exercises/current?instance_id=${instanceId}`);
        if (resumeRes.ok) {
          const data = await resumeRes.json();
          currentInst = data.instance;
        }
      }

      if (!currentInst) {
        const startRes = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exercise_id: 'avoidance_audit' })
        });
        if (startRes.ok) {
          const data = await startRes.json();
          currentInst = data.instance;
        }
      }

      setInstance(currentInst);
      if (currentInst?.status === 'completed') {
        setPhase('result');
      }
    } catch (err) {
      console.error('[AvoidanceAuditFlow] Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const currentPrompt = AVOIDANCE_PROMPTS[promptIdx] || AVOIDANCE_PROMPTS[0];
  const currentCompletion = completions[currentPrompt.num] || '';
  const isCurrentComplete = currentCompletion.trim().length >= 15;

  const handleNextPrompt = () => {
    if (!isCurrentComplete) return;
    if (promptIdx < AVOIDANCE_PROMPTS.length - 1) {
      setPromptIdx(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setPhase('loading');
    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'avoidance_audit',
          completions
        })
      });
    } catch (err) {
      console.error('[AvoidanceAuditFlow] Submission error:', err);
    } finally {
      setPhase('result');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] flex items-center justify-center font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
        Loading Avoidance Audit...
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <AvoidanceAuditResultView
        instanceId={instance?.id || instanceId}
        onClose={() => {
          if (onComplete) onComplete();
          if (onClose) onClose();
        }}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center font-sans">
        <p className="font-serif italic text-xl md:text-2xl text-[#1E2A2E]">
          Analyzing your responses...
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-6 sm:p-8">
        
        {phase === 'intro' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div className="space-y-6 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                Avoidance Audit
              </span>
              <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal">
                Finish the Sentences
              </h1>
              <p className="text-sm md:text-base text-[#1E2A2E]/80 leading-relaxed">
                Six incomplete sentences. Finish each one with the first thing that comes to mind — not the most acceptable version, the most accurate one.
              </p>

              <div className="bg-white rounded-2xl p-4 border border-line space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">Example</span>
                <p className="text-xs text-primary leading-relaxed italic">
                  "There's something I keep meaning to say to... <span className="text-emerald-800 font-normal">my closest friend, but every time I'm with them I convince myself it can wait.</span>"
                </p>
              </div>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setPhase('prompts')}
                className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer"
              >
                Begin Audit
              </button>
            </div>
          </div>
        )}

        {phase === 'prompts' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div>
              <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                    {currentPrompt.num} of 6
                  </span>
                  <h2 className="font-serif text-xl text-primary font-normal">
                    Complete the sentence
                  </h2>
                </div>
                {promptIdx > 0 && (
                  <button
                    onClick={() => setPromptIdx(prev => prev - 1)}
                    className="text-xs text-[#8DBFB4] hover:text-primary font-medium cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="space-y-4 pt-4 pb-24">
                <p className="font-serif text-lg text-primary leading-relaxed">
                  {currentPrompt.stem}
                </p>
                <textarea
                  rows={4}
                  placeholder="Finish this sentence with your immediate gut reaction..."
                  value={currentCompletion}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCompletions(prev => ({ ...prev, [currentPrompt.num]: val }));
                  }}
                  className="w-full p-4 rounded-2xl border border-line bg-white font-serif italic text-base focus:outline-none focus:border-primary shadow-xs"
                />
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 z-30">
              <div className="max-w-[480px] mx-auto">
                <button
                  disabled={!isCurrentComplete}
                  onClick={handleNextPrompt}
                  className={`w-full py-4 rounded-2xl text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
                    isCurrentComplete
                      ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {promptIdx === AVOIDANCE_PROMPTS.length - 1 ? 'Finish Audit' : 'Next Sentence'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
