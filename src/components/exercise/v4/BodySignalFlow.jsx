import React, { useState, useEffect } from 'react';
import { BODY_SYSTEMS, POSITIVE_SIGNALS } from '../../../lib/exercises/v4/definitions/bodySignalCatalog';
import BodySignalResultView from './BodySignalResultView';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function BodySignalFlow({ instanceId, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'select' | 'loading' | 'result'

  // System signal selections: { sleep: { signal: '...' }, appetite: { ... }, ... }
  const [systemSelections, setSystemSelections] = useState({});

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
          body: JSON.stringify({ exercise_id: 'body_signal_inventory' })
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
      console.error('[BodySignalFlow] Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSignal = (sysKey, signal) => {
    setSystemSelections(prev => ({
      ...prev,
      [sysKey]: { signal }
    }));
  };

  const allSystemsSelected = BODY_SYSTEMS.every(sys => systemSelections[sys.key]?.signal);

  const handleSubmit = async () => {
    if (!allSystemsSelected) return;
    setPhase('loading');

    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'body_signal_inventory',
          system_signals: systemSelections
        })
      });
    } catch (err) {
      console.error('[BodySignalFlow] Submission error:', err);
    } finally {
      setPhase('result');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] flex items-center justify-center font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
        Loading Body Signal Inventory...
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <BodySignalResultView
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
          Mapping body signals...
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
                Body Signal Inventory
              </span>
              <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal">
                Somatic Inventory
              </h1>
              <p className="text-sm md:text-base text-[#1E2A2E]/80 leading-relaxed">
                Your body notices changes long before your mind puts words to them. Select the signal that best describes what you have physically experienced across 6 body systems.
              </p>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setPhase('select')}
                className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer"
              >
                Begin Inventory
              </button>
            </div>
          </div>
        )}

        {phase === 'select' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div>
              <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                    6 Systems
                  </span>
                  <h2 className="font-serif text-xl text-primary font-normal">
                    Select 1 signal per system
                  </h2>
                </div>
                {onClose && (
                  <button onClick={onClose} className="p-1.5 text-mid hover:text-primary rounded-full hover:bg-black/5">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="space-y-6 pb-24">
                {BODY_SYSTEMS.map(sys => {
                  const currentSel = systemSelections[sys.key]?.signal;
                  return (
                    <div key={sys.key} className="space-y-2 bg-white rounded-2xl p-4 border border-line">
                      <h3 className="font-serif text-base text-primary font-semibold border-b border-line/60 pb-2">
                        {sys.label}
                      </h3>
                      <div className="space-y-1.5 pt-1">
                        {sys.signals.map(sig => {
                          const isSelected = currentSel === sig;
                          return (
                            <button
                              key={sig}
                              onClick={() => handleSelectSignal(sys.key, sig)}
                              className={`w-full text-left p-3 rounded-xl border text-xs transition-colors cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? 'bg-[#1E2A2E] border-[#1E2A2E] text-white font-medium'
                                  : 'bg-[#FAF9F6] border-line/60 text-primary hover:border-primary/40'
                              }`}
                            >
                              <span>{sig}</span>
                              {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 z-30">
              <div className="max-w-[480px] mx-auto">
                <button
                  disabled={!allSystemsSelected}
                  onClick={handleSubmit}
                  className={`w-full py-4 rounded-2xl text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
                    allSystemsSelected
                      ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  Submit Inventory
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
