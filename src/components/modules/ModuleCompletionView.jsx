import React, { useState } from 'react';

export default function ModuleCompletionView({ content, playerState, updateState, onFinish }) {
  const mhpiConfig = content?.mhpiConfig;
  const baselineQuestions = mhpiConfig?.baselineQuestions || [];
  const extraQuestions = mhpiConfig?.endExtraQuestions || [];
  const endChoice = mhpiConfig?.endChoice;

  const [answers, setAnswers] = useState(playerState?.mhpiData?.end || {});
  const [extraAnswers, setExtraAnswers] = useState({});
  const [choiceVal, setChoiceVal] = useState(playerState?.mhpiData?.nextStep || null);
  const [submitted, setSubmitted] = useState(!!playerState?.mhpiData?.endScore);

  const baselineScore = playerState?.mhpiData?.baselineScore;
  const endScore = playerState?.mhpiData?.endScore;
  const improvementPct = playerState?.mhpiData?.improvementPct;

  const handleSelect = (qId, val) => {
    setAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const handleExtraSelect = (qId, val) => {
    setExtraAnswers(prev => ({ ...prev, [qId]: val }));
  };

  const allCoreAnswered = baselineQuestions.every(q => answers[q.id] !== undefined);
  const allExtraAnswered = extraQuestions.every(q => extraAnswers[q.id] !== undefined);
  const isFormComplete = allCoreAnswered && allExtraAnswered && choiceVal !== null;

  const handleSubmit = () => {
    if (!isFormComplete) return;

    // Severity Formula per MHPI Framework v1: q1 + q2 + q3 + (10 - q4) + (10 - q5)
    const computedEndScore = (answers.q1 || 0) +
                             (answers.q2 || 0) +
                             (answers.q3 || 0) +
                             (10 - (answers.q4 || 0)) +
                             (10 - (answers.q5 || 0));

    let pct = null;
    if (baselineScore) {
      pct = Math.round(((baselineScore - computedEndScore) / baselineScore) * 100);
    }

    updateState(prev => ({
      ...prev,
      mhpiData: {
        ...prev.mhpiData,
        end: answers,
        endScore: computedEndScore,
        improvementPct: pct,
        helpfulness: extraAnswers.e6,
        nextStep: choiceVal
      }
    }));

    setSubmitted(true);
  };

  const getInterpretationLabel = (pct) => {
    if (pct === null || pct === undefined) return 'Not enough data';
    if (pct >= 30) return 'Strong response';
    if (pct >= 15) return 'Moderate response';
    if (pct >= 5) return 'Mild response';
    if (pct >= 0) return 'Minimal response';
    return 'Worsened';
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="pb-2 border-b border-[#F5EFE3]/15">
        <h1 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
          End Assessment & Results
        </h1>
        <p className="text-xs text-[#C9C2AE] mt-1">
          {submitted ? 'Your overall progress readout' : 'Answer the same 5 questions from baseline plus 2 extra questions.'}
        </p>
      </div>

      {!submitted ? (
        <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-6 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
            Baseline Comparison Questions
          </div>

          {baselineQuestions.map((q) => {
            const selectedVal = answers[q.id];
            return (
              <div key={q.id} className="space-y-2.5 pb-4 border-b border-[#F5EFE3]/10">
                <div className="text-[11px] uppercase tracking-widest text-[#C9C2AE] font-semibold">
                  {q.label}
                </div>
                <p className="text-sm text-[#F5EFE3] font-medium leading-snug">
                  {q.prompt}
                </p>
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

          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold pt-2">
            Program Feedback
          </div>

          {extraQuestions.map((q) => {
            const selectedVal = extraAnswers[q.id];
            return (
              <div key={q.id} className="space-y-2.5 pb-4 border-b border-[#F5EFE3]/10">
                <p className="text-sm text-[#F5EFE3] font-medium leading-snug">
                  {q.prompt}
                </p>
                <div className="flex gap-1 overflow-x-auto pt-1 pb-1">
                  {Array.from({ length: q.max - q.min + 1 }, (_, idx) => q.min + idx).map((val) => {
                    const isPicked = selectedVal === val;
                    return (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleExtraSelect(q.id, val)}
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

          {endChoice && (
            <div className="space-y-3 pt-2">
              <p className="text-sm text-[#F5EFE3] font-medium">
                {endChoice.prompt}
              </p>
              <div className="grid gap-2">
                {endChoice.options.map((optText) => (
                  <button
                    key={optText}
                    type="button"
                    onClick={() => setChoiceVal(optText)}
                    className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                      choiceVal === optText
                        ? 'bg-[#E8A33D] text-[#1B2340] font-semibold border-[#E8A33D]'
                        : 'bg-[#1B2340] border-[#F5EFE3]/20 text-[#F5EFE3] hover:border-[#F2C776]'
                    }`}
                  >
                    {optText}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!isFormComplete}
            className={`w-full py-3.5 px-5 rounded-xl font-semibold text-sm transition-all shadow-md ${
              isFormComplete
                ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340]'
                : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
            }`}
          >
            {isFormComplete ? 'See My Results' : 'Please Answer All Questions'}
          </button>
        </div>
      ) : (
        /* Results Card */
        <div className="space-y-6">
          <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-5 shadow-xl text-center">
            <div className="text-[11.5px] uppercase tracking-widest text-[#7A9471] font-semibold">
              Improvement Since You Started
            </div>
            <div className="font-serif text-5xl font-bold text-[#F2C776]">
              {improvementPct !== null ? `${improvementPct}%` : '—'}
            </div>

            {/* Progress bar */}
            <div className="bg-[#1B2340] rounded-full h-3 overflow-hidden max-w-sm mx-auto">
              <div
                className="bg-[#E8A33D] h-full transition-all duration-700"
                style={{ width: `${Math.max(0, Math.min(100, improvementPct || 0))}%` }}
              />
            </div>

            <div className="text-sm font-semibold text-[#F5EFE3]">
              Response Category: <span className="text-[#F2C776]">{getInterpretationLabel(improvementPct)}</span>
            </div>

            {/* Before vs After Scores */}
            <div className="grid grid-cols-2 gap-4 pt-3">
              <div className="bg-[#1B2340] border border-[#F5EFE3]/10 rounded-xl p-4">
                <div className="text-[11px] uppercase text-[#C9C2AE]">Baseline Score</div>
                <div className="font-serif text-2xl font-bold text-[#F5EFE3] mt-1">
                  {baselineScore !== null ? `${baselineScore} / 50` : 'N/A'}
                </div>
              </div>
              <div className="bg-[#1B2340] border border-[#F5EFE3]/10 rounded-xl p-4">
                <div className="text-[11px] uppercase text-[#7A9471]">End Score</div>
                <div className="font-serif text-2xl font-bold text-[#7A9471] mt-1">
                  {endScore !== null ? `${endScore} / 50` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Reinforcement Bank Section */}
          {content?.reinforcementBank && content.reinforcementBank.length > 0 && (
            <div className="bg-[#2A3358] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4">
              <h3 className="font-serif text-lg text-[#F2C776] font-semibold">
                Reinforcement Bank Reflections ({content.reinforcementBank.length})
              </h3>
              <p className="text-xs text-[#C9C2AE]">
                Keep practicing these techniques in your ongoing journal sit-downs.
              </p>
              <div className="grid gap-3">
                {content.reinforcementBank.map((rep, idx) => (
                  <div key={idx} className="bg-[#1B2340] border border-[#F5EFE3]/10 rounded-xl p-4 text-xs space-y-1.5">
                    <div className="flex justify-between text-[#F2C776] font-mono font-bold">
                      <span>{rep.code} — Rep {rep.rep}</span>
                    </div>
                    <p className="text-[#F5EFE3]">{rep.scenario}</p>
                    <div className="text-[#C9C2AE] italic pt-1">
                      Prompt: {rep.prompt}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            onClick={onFinish}
            className="w-full py-3.5 px-5 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-sm transition-all shadow-md"
          >
            Return to Module Overview
          </button>
        </div>
      )}
    </div>
  );
}
