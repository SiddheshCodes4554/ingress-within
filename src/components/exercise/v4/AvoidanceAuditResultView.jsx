import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { AVOIDANCE_PROMPTS } from '../../../lib/exercises/v4/definitions/avoidanceAuditCatalog';

export default function AvoidanceAuditResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to load avoidance audit result.');
      
      setResult(data.result);
      if (data.instance?.completed_at || data.result?.created_at) {
        setCompletedAt(data.instance?.completed_at || data.result?.created_at);
      }
    } catch (err) {
      console.error('[AvoidanceAuditResultView] Error loading result:', err);
      setError(err.message || 'Unable to display results.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Loading avoidance audit reflection...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-[420px] bg-white rounded-3xl p-8 border border-line shadow-sm space-y-4">
          <p className="text-sm text-red-600 font-medium">{error || 'Result unavailable.'}</p>
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 cursor-pointer"
          >
            Return to Exercise Hub
          </button>
        </div>
      </div>
    );
  }

  const completions = result.data?.completions || {};
  const reflectionText = result.summary || result.data?.reflection_text || 'Your avoidance audit responses have been recorded below.';

  const formattedDate = completedAt
    ? new Date(completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-6 sm:p-8">
        
        <div>
          <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-8">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl text-primary font-normal">
                Avoidance Audit
              </h1>
              <p className="text-xs text-mid mt-1 font-mono">
                Completed {formattedDate}
              </p>
            </div>
            <button onClick={onClose} className="p-2 text-mid hover:text-primary rounded-full hover:bg-black/5">
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>

          <div className="my-6">
            <p className="font-serif text-lg md:text-xl text-[#1E2A2E] leading-relaxed font-normal">
              {reflectionText}
            </p>
          </div>

          <hr className="border-t border-[#1E2A2E]/10 my-8" />

          <div className="space-y-4">
            <h2 className="font-serif text-xs font-bold uppercase tracking-wider text-mid">
              Sentence Completions
            </h2>

            <div className="space-y-4">
              {AVOIDANCE_PROMPTS.map(p => {
                const answer = completions[p.num];
                if (!answer) return null;
                return (
                  <div key={p.num} className="p-4 bg-white rounded-2xl border border-line space-y-1">
                    <p className="text-xs text-mid">{p.stem}</p>
                    <p className="font-serif italic text-sm text-primary">{answer}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="pt-8 mt-6">
          <button
            onClick={onClose}
            className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
