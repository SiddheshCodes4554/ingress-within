import React, { useState, useEffect } from 'react';
import { RotateCw, ArrowLeft } from 'lucide-react';

export default function TriggerMappingResultView({ instanceId, onClose }) {
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchResult(false);
  }, [instanceId]);

  const fetchResult = async (retry = false) => {
    try {
      const res = await fetch(`/api/exercises/result?instance_id=${instanceId}${retry ? '&retry=true' : ''}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to fetch result');
      setResult(data.result);

      const analysis = data.result?.analysis || data.result?.data || {};
      if (!retry && (!analysis.reflection_text || data.result?.summary?.includes('recorded below'))) {
        fetchResult(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <RotateCw className="w-6 h-6 animate-spin text-[#4A6A64] mb-3 opacity-70" />
        <p className="font-serif italic text-base text-[#4A6A64]">
          Processing your Trigger Mapping...
        </p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col items-center justify-center p-6 text-center font-sans">
        <div className="max-w-[420px] bg-white rounded-3xl p-8 border border-stone-200 shadow-sm space-y-4">
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

  const analysis = result.analysis || result.data || {};
  const entryAnswers = analysis.entry_answers || [];
  const synthesisAnswer = analysis.synthesis_answer || '';
  const decisionPoints = analysis.decision_points || [];

  const reflectionText =
    analysis.reflection_text ||
    (result.summary && !result.summary.includes('recorded below') ? result.summary : null) ||
    'Your responses have been recorded below.';

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] flex flex-col p-6 md:p-12 font-sans overflow-y-auto">
      <div className="max-w-[620px] mx-auto w-full space-y-8 pb-12">
        <div className="flex items-center justify-between pt-4">
          <button
            onClick={onClose}
            className="p-2 text-stone-400 hover:text-stone-700 transition-colors rounded-full hover:bg-stone-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <span className="text-xs text-stone-400 font-medium">Completed</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-serif text-stone-900 tracking-tight">Trigger Mapping</h1>
          <p className="text-xs text-stone-400 uppercase tracking-widest font-semibold">Situational Architecture & Decision Points</p>
        </div>

        {/* AI Reflection Card */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200 shadow-sm space-y-4">
          <span className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider">Analysis</span>
          <p className="text-stone-800 font-serif text-lg leading-relaxed">
            {reflectionText}
          </p>

          {analysis.trigger_architecture && (
            <div className="pt-3 border-t border-stone-100 space-y-1">
              <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Trigger Architecture</span>
              <p className="text-sm text-stone-700 leading-relaxed font-sans">
                {analysis.trigger_architecture}
              </p>
            </div>
          )}
        </div>

        {/* Synthesis Section */}
        {synthesisAnswer && (
          <div className="bg-white rounded-2xl p-6 border border-stone-200 shadow-sm space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#4A6A64]">Synthesis Pattern</span>
            <p className="text-sm text-stone-800 font-serif italic">
              "{synthesisAnswer}"
            </p>
          </div>
        )}

        {/* Moments Recap */}
        <div className="space-y-4 pt-4 border-t border-stone-200">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-stone-400">Mapped Moments & Decision Points</h2>
          <div className="space-y-4">
            {entryAnswers.map((ans, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-stone-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between text-xs text-[#4A6A64] font-semibold">
                  <span>Moment {idx + 1}</span>
                  {decisionPoints[idx] && <span className="text-stone-500 font-normal">Agency Decision Point</span>}
                </div>
                <div className="space-y-2 text-sm text-stone-800">
                  <p><strong className="font-medium text-stone-500">Happening:</strong> {ans.q1}</p>
                  <p><strong className="font-medium text-stone-500">Feared outcome:</strong> {ans.q2}</p>
                  <p><strong className="font-medium text-stone-500">Resolution:</strong> {ans.q3}</p>
                </div>
                {decisionPoints[idx] && (
                  <div className="pt-2 border-t border-stone-100 text-xs text-[#4A6A64] italic">
                    💡 Decision point: {decisionPoints[idx]}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Closing Lines & Support Line */}
        <div className="pt-6 text-center space-y-2 border-t border-stone-200">
          <p className="text-xs text-stone-400 italic">You don’t need to do anything with this right now.</p>
          <p className="text-xs text-stone-400 italic">This is where things stand today. It can look different next time.</p>
          <p className="text-xs text-stone-500 pt-3 max-w-[460px] mx-auto leading-relaxed">
            If anything here brought something difficult up, support is available — you don’t have to sit with it alone.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
}
