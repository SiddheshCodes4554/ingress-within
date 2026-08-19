import React, { useState, useEffect } from 'react';
import { RotateCw, AlertCircle, X } from 'lucide-react';
import { EXERCISE_3_QUESTIONS } from './Exercise3Flow';

export default function Exercise3ResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [instanceId]);

  const fetchResult = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      if (!res.ok) throw new Error('Failed to fetch Exercise 3 result');
      const data = await res.json();
      setResultData(data.result);
    } catch (err) {
      console.error('[Exercise3ResultView] Fetch error:', err);
      setError(err.message || 'Unable to load exercise analysis');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center">
        <RotateCw className="w-6 h-6 animate-spin mx-auto text-[#8DBFB4] mb-3" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Loading your stored analysis...
        </p>
      </div>
    );
  }

  if (error || !resultData) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-xs w-full space-y-4 bg-white p-6 rounded-2xl shadow-sm border border-line">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-xs text-[#4A6A64]">{error || 'Result record not found.'}</p>
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 rounded-lg bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  const analysis = resultData.analysis || resultData.raw_json || {};
  const summary = resultData.summary || analysis.ai_analysis_text || 'Your responses have been recorded and saved into your Day 30 report.';
  const gapScore = typeof analysis.gap_score === 'number' ? analysis.gap_score : null;
  const gapSeverity = analysis.gap_severity || (gapScore === null ? null : gapScore <= 1 ? 'low' : gapScore <= 3 ? 'moderate' : 'significant');
  const rawResponses = analysis.raw_responses || resultData.responses || resultData.raw_responses || [];

  const completedAtFormatted = resultData.generated_at || resultData.created_at
    ? new Date(resultData.generated_at || resultData.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Recently';

  // Clean prose text from markdown or json tags
  const cleanSummary = summary
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/^#+\s*/gm, '')
    .replace(/```[\s\S]*?```/gm, '')
    .replace(/\{[\s\S]*$/m, '')
    .trim();

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] overflow-y-auto font-sans">
      <div className="max-w-[480px] w-full mx-auto min-h-screen flex flex-col px-6 py-6 justify-between">
        {/* Top Bar Logo & Close */}
        <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            <img 
              src="/logo-mark-transparent.png" 
              alt="Ingress Within" 
              className="w-5 h-5 object-contain" 
            />
            <span className="font-serif font-semibold text-xs text-[#1E2A2E]">
              ingress <em className="text-[#8DBFB4] not-italic">within</em>
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-black/5 text-[#4A6A64] hover:text-[#1E2A2E] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Reflection Analysis Content */}
        <div className="flex-1 flex flex-col pt-6 pb-6 space-y-6">
          <div className="space-y-3">
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#8DBFB4]">
              Self-Perception Check
            </div>

            <div className="text-xs text-[#4A6A64]">
              Completed {completedAtFormatted}
            </div>

            {/* Executive Synthesis Prose */}
            <div className="font-serif text-[19px] leading-[1.8] text-[#1E2A2E] pt-2">
              {cleanSummary}
            </div>

            {/* Gap Score Pills */}
            {gapScore !== null && (
              <div className="flex gap-2 flex-wrap pt-3">
                <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                  gapSeverity === 'low'
                    ? 'text-[#4a7a5a] border-[#4a7a5a] bg-[#4a7a5a]/10'
                    : gapSeverity === 'moderate'
                    ? 'text-[#7a6a30] border-[#7a6a30] bg-[#7a6a30]/10'
                    : 'text-[#7a3030] border-[#7a3030] bg-[#7a3030]/10'
                }`}>
                  Gap score: {gapScore}/5
                </div>
                {gapSeverity && (
                  <div className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                    gapSeverity === 'low'
                      ? 'text-[#4a7a5a] border-[#4a7a5a] bg-[#4a7a5a]/10'
                      : gapSeverity === 'moderate'
                      ? 'text-[#7a6a30] border-[#7a6a30] bg-[#7a6a30]/10'
                      : 'text-[#7a3030] border-[#7a3030] bg-[#7a3030]/10'
                  }`}>
                    {gapSeverity.charAt(0).toUpperCase() + gapSeverity.slice(1)} divergence
                  </div>
                )}
              </div>
            )}

            {/* Accent Rule */}
            <hr className="w-8 border-t-2 border-[#B8A8D4] my-5" />

            {/* Feeds Note */}
            <div className="text-xs text-[#4A6A64] leading-relaxed">
              This is the primary input to your Day 30 report.
            </div>

            {/* Section Label */}
            <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#4A6A64]/55 pt-3">
              Here's what you wrote.
            </div>
          </div>

          {/* 5 Saved Question Responses */}
          <div className="space-y-6 pt-2">
            {EXERCISE_3_QUESTIONS.map((q) => {
              const found = rawResponses.find(r =>
                r.question_id === `question_${q.id}` ||
                r.question_id === `q${q.id}` ||
                r.question === String(q.id) ||
                String(r.question_id || '').endsWith(String(q.id)) ||
                Number(r.step || r.current_step || r.position) === q.id
              );
              const userResponse = found?.response || '—';

              return (
                <div key={q.id} className="space-y-1.5 border-b border-[#1E2A2E]/5 pb-5 last:border-b-0">
                  <div className="text-[11px] font-semibold text-[#4A6A64]/60 tracking-[0.02em]">
                    Q{q.id}: {q.short}
                  </div>
                  <div className="text-sm text-[#4A6A64] leading-relaxed font-serif italic">
                    "{userResponse}"
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Done Button */}
        <div className="pt-4 pb-8 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 rounded-lg bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
