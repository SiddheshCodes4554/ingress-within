import React, { useState } from 'react';

export default function MhpiBaselineModal({ content, playerState, updateState, onComplete }) {
  const questions = content?.mhpiConfig?.baselineQuestions || [];
  const [answers, setAnswers] = useState(playerState?.mhpiData?.baseline || {});

  const handleSelect = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const handleSubmit = () => {
    if (!allAnswered) return;

    // Severity Formula per MHPI Framework v1: q1 + q2 + q3 + (10 - q4) + (10 - q5)
    const score = (answers.q1 || 0) +
                  (answers.q2 || 0) +
                  (answers.q3 || 0) +
                  (10 - (answers.q4 || 0)) +
                  (10 - (answers.q5 || 0));

    updateState(prev => ({
      ...prev,
      mhpiData: {
        ...prev.mhpiData,
        baseline: answers,
        baselineScore: score
      }
    }));

    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-[#F5EFE3]/15">
        <h1 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
          Before you begin
        </h1>
        <p className="text-xs text-[#C9C2AE] mt-1 leading-relaxed">
          Five quick questions, answered honestly — this is just for you (and your practitioner if connected) to track progress.
        </p>
      </div>

      {/* Questions Form Card */}
      <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-6 shadow-xl">
        {questions.map((q) => {
          const selectedVal = answers[q.id];
          return (
            <div key={q.id} className="space-y-2.5 pb-4 border-b border-[#F5EFE3]/10 last:border-b-0 last:pb-0">
              <div className="text-[11px] uppercase tracking-widest text-[#F2C776] font-semibold">
                {q.label}
              </div>
              <p className="text-sm text-[#F5EFE3] font-medium leading-snug">
                {q.prompt}
              </p>

              {/* 0-10 Rating Scale */}
              <div className="flex gap-1 overflow-x-auto pt-1 pb-1 scrollbar-none">
                {Array.from({ length: q.max - q.min + 1 }, (_, idx) => q.min + idx).map((val) => {
                  const isPicked = selectedVal === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handleSelect(q.id, val)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all flex-shrink-0 ${
                        isPicked
                          ? 'bg-[#E8A33D] text-[#1B2340] font-bold shadow-md scale-105'
                          : 'bg-[#1B2340]/60 border border-[#F5EFE3]/20 text-[#F5EFE3] hover:border-[#E8A33D]'
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[11px] text-[#C9C2AE] px-0.5">
                <span>{q.minLabel}</span>
                <span>{q.maxLabel}</span>
              </div>
            </div>
          );
        })}

        {/* Submit Button */}
        <div className="pt-2">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered}
            className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              allAnswered
                ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340]'
                : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
            }`}
          >
            {allAnswered ? 'Submit Baseline & Start Program' : 'Please Answer All 5 Questions'}
          </button>
        </div>
      </div>
    </div>
  );
}
