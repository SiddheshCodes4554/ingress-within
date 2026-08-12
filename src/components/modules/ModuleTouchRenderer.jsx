import React, { useState } from 'react';

export default function ModuleTouchRenderer({ content, touchId, playerState, updateState, onBackToWeek }) {
  // Find current touch across all weeks
  let touch = null;
  let technique = null;

  if (content && touchId) {
    for (const week of content.weeks) {
      const found = week.touches.find(t => t.id === touchId);
      if (found) {
        touch = found;
        break;
      }
    }
    // Also search technique if touch is format C or technique ID
    if (content.brief?.mechanisms) {
      for (const m of content.brief.mechanisms) {
        const tFound = m.techniques.find(t => t.code === touchId || t.code === touch?.role?.split(' ')?.[1]);
        if (tFound) technique = tFound;
      }
    }
  }

  // Active step inside touch: 'relate' | 'think' | 'apply' | 'distress_check' | 'reveal' | 'remember'
  const [step, setStep] = useState(playerState?.touchStep || 'relate');

  // Answers state
  const touchAnswers = playerState?.userAnswers?.[touchId] || {};
  const [selectedTapOpt, setSelectedTapOpt] = useState(touchAnswers.selectedTapOpt ?? null);
  const [thinkWhyText, setThinkWhyText] = useState(touchAnswers.thinkWhyText || '');
  const [thinkOpenText, setThinkOpenText] = useState(touchAnswers.thinkOpenText || '');
  const [selectedIntensity, setSelectedIntensity] = useState(touchAnswers.selectedIntensity ?? null);
  const [applyText, setApplyText] = useState(touchAnswers.applyText || '');
  const [distressRating, setDistressRating] = useState(touchAnswers.distressRating ?? null);
  const [rememberText, setRememberText] = useState(touchAnswers.rememberText || '');
  const [escalationWarning, setEscalationWarning] = useState(null);

  React.useEffect(() => {
    setStep('relate');
    const answers = playerState?.userAnswers?.[touchId] || {};
    setSelectedTapOpt(answers.selectedTapOpt ?? null);
    setThinkWhyText(answers.thinkWhyText || '');
    setThinkOpenText(answers.thinkOpenText || '');
    setSelectedIntensity(answers.selectedIntensity ?? null);
    setApplyText(answers.applyText || '');
    setDistressRating(answers.distressRating ?? null);
    setRememberText(answers.rememberText || '');
    setEscalationWarning(null);
  }, [touchId]);

  if (!touch && !technique) {
    return (
      <div className="p-6 text-center">
        <p className="text-sm text-[#C9C2AE]">Touch '{touchId}' not found.</p>
        <button onClick={onBackToWeek} className="mt-4 px-4 py-2 bg-[#E8A33D] text-[#1B2340] font-semibold rounded-lg text-xs">
          Return to Week
        </button>
      </div>
    );
  }

  // Handle Format C (Reference-Only Card)
  // Format C: no Apply, no Reveal, no Remember, no free-text answer, no escalation, no completion tracking.
  if (technique && technique.format === 'C') {
    return (
      <div className="space-y-6">
        <button
          onClick={onBackToWeek}
          className="text-xs text-[#C9C2AE] hover:text-[#F5EFE3] flex items-center gap-1"
        >
          ← Back to Week
        </button>

        <div className="bg-gradient-to-b from-purple-950/80 to-[#2A3358] border border-purple-400/40 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-purple-300">{technique.code}</span>
            <span className="text-[10px] uppercase font-mono bg-purple-900 border border-purple-400/50 text-purple-200 px-2.5 py-0.5 rounded-full">
              Format C — Reference-Only
            </span>
          </div>

          <h2 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
            {technique.name}
          </h2>

          <div className="text-xs text-[#F2C776] font-mono">
            Approach: {technique.approach} • Source: {technique.source}
          </div>

          <div className="space-y-3 pt-2 text-sm text-[#C9C2AE] leading-relaxed">
            <div className="space-y-1">
              <strong className="text-[#F5EFE3] block">What it is:</strong>
              <p>{technique.what}</p>
            </div>
            <div className="space-y-1">
              <strong className="text-[#F5EFE3] block">How it works:</strong>
              <p>{technique.how}</p>
            </div>
            <div className="space-y-1">
              <strong className="text-[#F5EFE3] block">Why it's referenced:</strong>
              <p>{technique.why}</p>
            </div>
          </div>

          {technique.professionalNote && (
            <div className="mt-4 p-4 bg-purple-900/40 border border-purple-400/40 rounded-xl space-y-1.5 text-xs text-purple-200">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-300 block">
                Professional / Therapist Guidance:
              </span>
              <p className="leading-relaxed">{technique.professionalNote}</p>
            </div>
          )}
        </div>

        <button
          onClick={onBackToWeek}
          className="w-full py-3 px-4 bg-[#2A3358] hover:bg-[#3D4770] border border-[#F5EFE3]/20 text-[#F5EFE3] font-semibold rounded-xl text-sm transition-all"
        >
          Close Reference Card
        </button>
      </div>
    );
  }

  // Safety escalation offline scan helper
  const checkTextEscalation = (text) => {
    if (!text) return null;
    const lower = text.toLowerCase();
    const t1 = ["kill myself", "end my life", "suicide", "don't want to live"];
    const t2 = ["worthless", "fundamental failure", "everyone better off without me"];
    for (const w of t1) {
      if (lower.includes(w)) {
        return "Support Notice: Your safety is our highest priority. Please contact KIRAN (1800-599-0019) or TeleMANAS (14416) immediately.";
      }
    }
    for (const w of t2) {
      if (lower.includes(w)) {
        return "Notice: You expressed deep distress. Please remember you can talk to a licensed therapist or loved one.";
      }
    }
    return null;
  };

  const saveTouchProgress = (finalStep, isComplete = false) => {
    const newAnswers = {
      selectedTapOpt,
      thinkWhyText,
      thinkOpenText,
      selectedIntensity,
      applyText,
      distressRating,
      rememberText
    };

    // Scan text for escalation
    const flag = checkTextEscalation(`${thinkWhyText} ${thinkOpenText} ${applyText} ${rememberText}`);
    setEscalationWarning(flag);

    updateState(prev => {
      const updatedTouches = isComplete
        ? Array.from(new Set([...(prev.completedTouches || []), touchId]))
        : prev.completedTouches;

      return {
        ...prev,
        touchStep: finalStep,
        completedTouches: updatedTouches,
        userAnswers: {
          ...prev.userAnswers,
          [touchId]: newAnswers
        }
      };
    });
  };

  const isGuardrailed = touch.guardrail || false;

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#F5EFE3]/15">
        <button
          onClick={onBackToWeek}
          className="text-xs text-[#C9C2AE] hover:text-[#F5EFE3] flex items-center gap-1"
        >
          ← Back to Week
        </button>
        <div className="flex items-center gap-2">
          {isGuardrailed && (
            <span className="text-[10px] uppercase font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
              Guided [B]
            </span>
          )}
          <span className="text-xs font-mono text-[#F2C776]">{touch.role}</span>
        </div>
      </div>

      {/* Safety Escalation Warning Banner */}
      {escalationWarning && (
        <div className="p-4 bg-red-950/80 border border-red-500 rounded-xl text-xs text-red-200 space-y-2">
          <span className="font-semibold text-red-300 block">⚠️ Safety Resource Notification</span>
          <p>{escalationWarning}</p>
        </div>
      )}

      {/* Touch Card Header */}
      <div className="bg-[#2A3358] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-2">
        <h1 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
          {touch.title}
        </h1>
        {touch.delayedRef && touch.delayedPrompt && (
          <div className="p-3 bg-[#1B2340]/80 border border-[#F2C776]/30 rounded-xl text-xs text-[#F2C776] italic">
            <strong>Memory Anchor:</strong> {touch.delayedPrompt}
          </div>
        )}
      </div>

      {/* STEP 1: RELATE BEAT */}
      {step === 'relate' && (
        <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
            Beat 1 · Relate
          </div>
          <div className="space-y-3 text-sm text-[#F5EFE3] leading-relaxed">
            {touch.relate.text.map((p, idx) => (
              <p key={idx} dangerouslySetInnerHTML={{ __html: p }} />
            ))}
          </div>

          <button
            onClick={() => {
              saveTouchProgress('think');
              setStep('think');
            }}
            className="w-full py-3.5 px-4 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-sm transition-all shadow-md mt-4"
          >
            Next: Think Beat →
          </button>
        </div>
      )}

      {/* STEP 2: THINK BEAT */}
      {step === 'think' && (
        <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
            Beat 2 · Think
          </div>
          <p className="text-sm font-medium text-[#F5EFE3] leading-snug">
            {touch.think.prompt}
          </p>

          {/* Mode TAP */}
          {touch.think.mode === 'tap' && touch.think.options && (
            <div className="space-y-3 pt-2">
              {touch.think.options.map((optItem, idx) => {
                const isSelected = selectedTapOpt === idx;
                return (
                  <div key={idx} className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setSelectedTapOpt(idx)}
                      className={`w-full text-left p-4 rounded-xl border text-sm transition-all ${
                        isSelected
                          ? 'bg-[#E8A33D]/15 border-[#E8A33D] text-[#F5EFE3]'
                          : 'bg-[#1B2340]/60 border-[#F5EFE3]/20 text-[#C9C2AE] hover:border-[#F2C776]'
                      }`}
                    >
                      {optItem.label}
                    </button>
                    {isSelected && (
                      <div className="p-3.5 bg-[#7A9471]/15 border border-[#7A9471]/40 rounded-xl text-xs text-[#F5EFE3] leading-relaxed">
                        <span className="font-semibold text-[#7A9471] block mb-1">
                          {optItem.isTarget ? 'Key Insight:' : 'Consideration:'}
                        </span>
                        {optItem.explain}
                      </div>
                    )}
                  </div>
                );
              })}

              {touch.think.whyPrompt && (
                <div className="space-y-2 pt-3">
                  <label className="text-xs font-semibold text-[#F2C776] block">
                    {touch.think.whyPrompt}
                  </label>
                  <textarea
                    value={thinkWhyText}
                    onChange={(e) => setThinkWhyText(e.target.value)}
                    placeholder="Your explanation in a few words..."
                    rows={2}
                    className="w-full bg-[#1B2340] border border-[#F5EFE3]/20 rounded-xl p-3 text-xs text-[#F5EFE3] focus:border-[#E8A33D] focus:outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* Mode OPEN */}
          {touch.think.mode === 'open' && (
            <div className="pt-2">
              <textarea
                value={thinkOpenText}
                onChange={(e) => setThinkOpenText(e.target.value)}
                placeholder={touch.think.placeholder || 'Your answer...'}
                rows={3}
                className="w-full bg-[#1B2340] border border-[#F5EFE3]/20 rounded-xl p-3.5 text-xs text-[#F5EFE3] focus:border-[#E8A33D] focus:outline-none"
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('relate')}
              className="flex-1 py-3 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] font-semibold rounded-xl text-xs"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                saveTouchProgress('apply');
                setStep('apply');
              }}
              disabled={touch.think.mode === 'tap' ? selectedTapOpt === null : !thinkOpenText.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
                (touch.think.mode === 'tap' ? selectedTapOpt !== null : thinkOpenText.trim())
                  ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340]'
                  : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
              }`}
            >
              Next: Apply Beat →
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: APPLY BEAT */}
      {step === 'apply' && (
        <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
            Beat 3 · Apply
          </div>
          <div className="p-4 bg-[#1B2340]/80 border border-[#F5EFE3]/10 rounded-xl text-xs text-[#C9C2AE] leading-relaxed">
            <strong className="text-[#F2C776] block mb-1">Scenario context:</strong>
            {touch.apply.scenario}
          </div>

          {/* Format B Intensity Selector */}
          {touch.apply.intensityPrompt && touch.apply.intensityOptions && (
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-[#F2C776] block">
                {touch.apply.intensityPrompt}
              </label>
              <div className="grid gap-2">
                {touch.apply.intensityOptions.map((optText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedIntensity(idx)}
                    className={`p-3 text-left rounded-xl border text-xs font-medium transition-all ${
                      selectedIntensity === idx
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

          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold text-[#F5EFE3] block">
              {touch.apply.prompt}
            </label>
            <textarea
              value={applyText}
              onChange={(e) => setApplyText(e.target.value)}
              placeholder={touch.apply.placeholder || 'Your answer...'}
              rows={4}
              className="w-full bg-[#1B2340] border border-[#F5EFE3]/20 rounded-xl p-3.5 text-xs text-[#F5EFE3] focus:border-[#E8A33D] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('think')}
              className="flex-1 py-3 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] font-semibold rounded-xl text-xs"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                if (isGuardrailed && touch.distressPrompt) {
                  saveTouchProgress('distress_check');
                  setStep('distress_check');
                } else {
                  saveTouchProgress('reveal');
                  setStep('reveal');
                }
              }}
              disabled={!applyText.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
                applyText.trim()
                  ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340]'
                  : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
              }`}
            >
              {isGuardrailed ? 'Next: Safety Check →' : 'Next: Reveal →'}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3.5: DISTRESS CHECK-IN (Format B Guardrailed) */}
      {step === 'distress_check' && (
        <div className="bg-gradient-to-b from-amber-950/80 to-[#2A3358] border border-amber-500/40 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-amber-300 font-semibold flex items-center gap-2">
            <span>🛡️</span> Format B Guardrail · Safety Check-in
          </div>
          <p className="text-sm font-medium text-[#F5EFE3]">
            {touch.distressPrompt}
          </p>

          <div className="space-y-2 pt-2">
            <label className="text-xs text-[#C9C2AE] block">Rate your distress level (0 = Calm, 10 = Severe Distress):</label>
            <div className="flex gap-1 overflow-x-auto pb-1">
              {Array.from({ length: 11 }, (_, i) => i).map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setDistressRating(val)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold flex items-center justify-center transition-all flex-shrink-0 ${
                    distressRating === val
                      ? 'bg-amber-400 text-amber-950 font-bold scale-105'
                      : 'bg-[#1B2340] border border-[#F5EFE3]/20 text-[#F5EFE3]'
                  }`}
                >
                  {val}
                </button>
              ))}
            </div>
          </div>

          {distressRating !== null && distressRating >= 7 && (
            <div className="p-3.5 bg-red-950/90 border border-red-500 rounded-xl text-xs text-red-200 space-y-1">
              <strong className="block text-red-300">Safety Prompt Triggered</strong>
              <p>You reported elevated distress ({distressRating}/10). If this practice feels too overwhelming right now, take a moment to ground yourself, pause, or reach out to a trusted professional.</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('apply')}
              className="flex-1 py-3 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] font-semibold rounded-xl text-xs"
            >
              ← Back to Apply
            </button>
            <button
              onClick={() => {
                saveTouchProgress('reveal');
                setStep('reveal');
              }}
              disabled={distressRating === null}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all ${
                distressRating !== null
                  ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340]'
                  : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
              }`}
            >
              Continue to Reveal →
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVEAL BEAT */}
      {step === 'reveal' && (
        <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-[#7A9471] font-semibold">
            Beat 4 · Model Reveal
          </div>
          <div className="p-4 bg-[#7A9471]/15 border border-[#7A9471]/40 rounded-xl text-sm text-[#F5EFE3] leading-relaxed">
            <strong className="text-[#7A9471] block mb-1">Model takeaway:</strong>
            {touch.reveal.text}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep(isGuardrailed ? 'distress_check' : 'apply')}
              className="flex-1 py-3 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] font-semibold rounded-xl text-xs"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                saveTouchProgress('remember');
                setStep('remember');
              }}
              className="flex-1 py-3 px-4 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-xs transition-all shadow-md"
            >
              Next: Personal Takeaway →
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: REMEMBER BEAT */}
      {step === 'remember' && (
        <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
            Beat 5 · Remember & Commit
          </div>
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#F5EFE3] block">
              {touch.remember.prompt}
            </label>
            <textarea
              value={rememberText}
              onChange={(e) => setRememberText(e.target.value)}
              placeholder={touch.remember.placeholder || 'Your answer...'}
              rows={3}
              className="w-full bg-[#1B2340] border border-[#F5EFE3]/20 rounded-xl p-3.5 text-xs text-[#F5EFE3] focus:border-[#E8A33D] focus:outline-none"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={() => setStep('reveal')}
              className="flex-1 py-3 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] font-semibold rounded-xl text-xs"
            >
              ← Back
            </button>
            <button
              onClick={() => {
                saveTouchProgress('remember', true); // Mark touch complete!
                onBackToWeek();
              }}
              disabled={!rememberText.trim()}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold text-xs transition-all shadow-md ${
                rememberText.trim()
                  ? 'bg-[#7A9471] hover:bg-[#7A9471]/80 text-[#1B2340] font-bold'
                  : 'bg-[#3D4770] text-[#C9C2AE]/50 cursor-not-allowed'
              }`}
            >
              ✓ Complete Touch
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
