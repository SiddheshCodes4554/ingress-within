import React, { useState } from 'react';

export default function MhpiWeeklyView({ content, weekIdx, playerState, updateState, onComplete }) {
  const week = content?.weeks?.[weekIdx];
  const questions = content?.mhpiConfig?.weeklyQuestions || [];
  const weekKey = `w${week?.num || 1}`;
  const existingAnswers = playerState?.mhpiData?.weekly?.[weekKey] || {};

  const [answers, setAnswers] = useState(existingAnswers);

  if (!week) return null;

  const handleSelect = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const allAnswered = questions.every(q => answers[q.id] !== undefined);

  const handleSubmit = () => {
    if (!allAnswered) return;

    updateState(prev => ({
      ...prev,
      completedTouches: Array.from(new Set([...(prev.completedTouches || []), `mhpi_${weekKey}`])),
      mhpiData: {
        ...prev.mhpiData,
        weekly: {
          ...prev.mhpiData.weekly,
          [weekKey]: answers
        }
      }
    }));

    onComplete();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-[#F5EFE3]/15">
        <button
          onClick={onComplete}
          className="text-xs text-[#C9C2AE] hover:text-[#F5EFE3] flex items-center gap-1 mb-1"
        >
          ← Back to Week {week.num}
        </button>
        <h1 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
          Week {week.num} Check-in
        </h1>
        <p className="text-xs text-[#C9C2AE] mt-1">
          Three quick questions to track your weekly progress.
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-6 shadow-xl">
        {questions.map((q) => {
          const selectedVal = answers[q.id];
          return (
            <div key={q.id} className="space-y-2.5 pb-4 border-b border-[#F5EFE3]/10 last:border-b-0 last:pb-0">
              <p className="text-sm text-[#F5EFE3] font-medium leading-snug">
                {q.prompt}
              </p>

              {/* Rating Scale */}
              <div className="flex gap-1 overflow-x-auto pt-1 pb-1">
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

        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all shadow-md ${
            allAnswered
              ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340]'
              : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
          }`}
        >
          {allAnswered ? 'Save Weekly Check-in' : 'Please Answer All 3 Questions'}
        </button>
      </div>
    </div>
  );
}
