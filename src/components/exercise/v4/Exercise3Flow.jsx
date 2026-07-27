import React, { useState, useEffect, useRef } from 'react';

export const EXERCISE_3_QUESTIONS = [
  {
    id: 1,
    text: "In the last three weeks, when something felt hard, what did you do first — reach out, withdraw, distract yourself, or something else?",
    short: "When something felt hard..."
  },
  {
    id: 2,
    text: "Think about a conflict or tension you had recently. How did you handle it — and how do you feel about how you handled it?",
    short: "A conflict or tension..."
  },
  {
    id: 3,
    text: "What is something you keep meaning to do or say that you haven't yet?",
    short: "Something you keep meaning to..."
  },
  {
    id: 4,
    text: "In the last three weeks, whose needs did you prioritise more — yours or someone else's?",
    short: "Whose needs you prioritised..."
  },
  {
    id: 5,
    text: "What's one thing about yourself you'd change if you could, and what's stopping you?",
    short: "One thing you'd change..."
  }
];

const MIN_CHARS = 20;
const SOFT_CAP_WARN = 1500;
const HARD_CAP = 2000;

export default function Exercise3Flow({ instance, initialResponses = [], onClose, onComplete }) {
  const [currentQ, setCurrentQ] = useState(0); // 0 = intro, 1 to 5 = questions, 6 = loading
  const [answers, setAnswers] = useState({}); // { 1: 'text', 2: 'text', ... }
  const [inputValue, setInputValue] = useState('');
  const [isFading, setIsFading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef(null);

  // Restore initial responses on mount
  useEffect(() => {
    if (initialResponses && initialResponses.length > 0) {
      const restored = {};
      initialResponses.forEach(r => {
        const qId = r.question_id || r.step_id || '';
        const parts = qId.split('_'); // question_1 or q1
        const num = parts[1] ? parseInt(parts[1], 10) : parseInt(qId.replace(/\D/g, ''), 10) || 1;
        if (r.response && r.response.trim()) {
          restored[num] = r.response;
        }
      });
      setAnswers(restored);

      // Resume at first unanswered question
      const answeredCount = Object.keys(restored).length;
      if (answeredCount >= 5) {
        setCurrentQ(6); // complete / loading
      } else if (instance?.current_step) {
        setCurrentQ(Math.max(1, Math.min(5, instance.current_step)));
      } else if (answeredCount > 0) {
        setCurrentQ(Math.min(5, answeredCount + 1));
      }
    }
  }, [initialResponses, instance]);

  // Focus textarea & bind input value on question step change
  useEffect(() => {
    if (currentQ >= 1 && currentQ <= 5) {
      const q = EXERCISE_3_QUESTIONS[currentQ - 1];
      const existing = answers[q.id] || '';
      setInputValue(existing);

      const timer = setTimeout(() => {
        if (textareaRef.current) textareaRef.current.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [currentQ]);

  const saveResponseToBackend = async (val, qId) => {
    if (!instance?.id) return;
    setIsSaving(true);
    try {
      await fetch('/api/exercises/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instance.id,
          question_id: `question_${qId}`,
          prompt: EXERCISE_3_QUESTIONS[qId - 1].short,
          response: val,
          current_step: qId
        })
      });
    } catch (err) {
      console.error('[Exercise3Flow] Autosave failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = () => {
    const val = inputValue.trim();
    if (val.length < MIN_CHARS) return;

    const newAnswers = { ...answers, [currentQ]: val };
    setAnswers(newAnswers);
    saveResponseToBackend(val, currentQ);

    setIsFading(true);
    setTimeout(() => {
      setIsFading(false);
      if (currentQ < 5) {
        setCurrentQ(currentQ + 1);
      } else {
        setCurrentQ(6); // Loading screen
        finishExercise(newAnswers);
      }
    }, 150);
  };

  const finishExercise = async (finalAnswers) => {
    try {
      const formattedResponses = EXERCISE_3_QUESTIONS.map(q => ({
        question_id: `question_${q.id}`,
        prompt: q.short,
        response: finalAnswers[q.id] || ''
      }));

      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instance.id,
          responses: formattedResponses
        })
      });
    } catch (err) {
      console.error('[Exercise3Flow] Submission error:', err);
    } finally {
      if (onComplete) onComplete();
    }
  };

  // Header Logo Component
  const Logo = () => (
    <div className="flex items-center gap-2 px-6 pt-5 flex-shrink-0">
      <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#8DBFB4] flex items-center justify-center flex-shrink-0">
        <div className="w-[5px] h-[5px] rounded-full bg-[#8DBFB4]" />
      </div>
      <span className="font-sans font-semibold text-xs text-[#1E2A2E]">
        ingress <em className="text-[#8DBFB4] not-italic">within</em>
      </span>
      {isSaving && <span className="ml-auto text-[10px] text-[#8DBFB4] animate-pulse">Saving...</span>}
    </div>
  );

  // ── 1. INTRO SCREEN ──────────────────────────────────────────────────────
  if (currentQ === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col justify-between font-sans overflow-y-auto">
        <div className="max-w-[480px] w-full mx-auto min-h-screen flex flex-col justify-between">
          <div>
            <Logo />
            <div className="px-6 pt-10 pb-6">
              <h1 className="font-serif text-2xl sm:text-3xl text-[#1E2A2E] mb-6 font-normal leading-snug">
                A Few Questions
              </h1>
              <p className="text-base leading-[1.85] text-[#4A6A64]">
                Five questions about the last three weeks. Write what's actually true — not what sounds right. Each question gets its own screen. Your previous answers won't be visible while you write.
              </p>
            </div>
          </div>

          <div className="px-6 pb-9 flex-shrink-0">
            <button
              type="button"
              onClick={() => setCurrentQ(1)}
              className="w-full py-3.5 rounded-lg bg-[#1E2A2E] text-white text-sm font-semibold hover:bg-[#1E2A2E]/90 transition-all cursor-pointer shadow-sm"
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── 2. LOADING SCREEN ───────────────────────────────────────────────────
  if (currentQ === 6) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-[480px] w-full mx-auto flex flex-col items-center justify-center min-h-screen">
          <Logo />
          <div className="flex-1 flex flex-col items-center justify-center">
            <h2 className="font-serif italic text-lg sm:text-xl text-[#4A6A64] animate-pulse mb-2">
              Reading what you wrote.
            </h2>
          </div>
        </div>
      </div>
    );
  }

  // ── 3. QUESTION SCREEN (1 to 5) ──────────────────────────────────────────
  const q = EXERCISE_3_QUESTIONS[currentQ - 1];
  const pct = Math.round(((currentQ - 1) / 5) * 100);
  const trimmedLen = inputValue.trim().length;
  const rawLen = inputValue.length;

  let hintText = '';
  if (trimmedLen > 0 && trimmedLen < MIN_CHARS) {
    hintText = 'Take a little more time with this one.';
  }

  let charCountText = '';
  if (rawLen > SOFT_CAP_WARN) {
    charCountText = `${HARD_CAP - rawLen} characters remaining`;
  }
  if (rawLen >= HARD_CAP) {
    charCountText = "That's enough for this question.";
  }

  const isSubmitDisabled = trimmedLen < MIN_CHARS;

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] flex flex-col justify-between font-sans overflow-y-auto">
      <div className="max-w-[480px] w-full mx-auto min-h-screen flex flex-col justify-between">
        <div>
          <Logo />

          {/* Question Screen Content Container */}
          <div className={`px-6 pt-4 flex-1 flex flex-col transition-opacity duration-150 ease-out ${isFading ? 'opacity-0' : 'opacity-100'}`}>
            {/* Progress */}
            <div className="pt-2 flex-shrink-0">
              <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8DBFB4] mb-2">
                Question {currentQ} of 5
              </div>
              <div className="h-0.5 bg-[#1E2A2E]/11 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E2A2E] transition-all duration-300 ease-out rounded-full"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Question Text & Input Area */}
            <div className="py-7 flex-1 flex flex-col justify-center">
              <h2 className="text-xl leading-relaxed text-[#1E2A2E] font-normal mb-7">
                {q.text}
              </h2>

              <textarea
                ref={textareaRef}
                value={inputValue}
                rows={4}
                autoCorrect="off"
                spellCheck="true"
                onChange={(e) => {
                  let val = e.target.value;
                  if (val.length > HARD_CAP) {
                    val = val.substring(0, HARD_CAP);
                  }
                  setInputValue(val);
                }}
                className="w-full py-3 bg-transparent border-b-1.5 border-[#1E2A2E]/15 focus:border-[#1E2A2E] outline-none font-serif italic text-base text-[#1E2A2E] placeholder-[#1E2A2E]/30 resize-none transition-colors leading-relaxed"
              />

              {/* Hint & Character Count */}
              <div className="min-h-[18px] text-xs text-[#E0A898] mt-2 leading-snug">
                {hintText}
              </div>
              <div className="min-h-[16px] text-[11px] text-[#4A6A64]/45 mt-1.5 text-right">
                {charCountText}
              </div>
            </div>
          </div>
        </div>

        {/* Submit Wrap */}
        <div className="px-6 pb-8 flex-shrink-0">
          <button
            type="button"
            disabled={isSubmitDisabled}
            onClick={handleNext}
            className="w-full py-3.5 rounded-lg bg-[#1E2A2E] text-white text-sm font-semibold disabled:opacity-32 disabled:cursor-default hover:bg-[#1E2A2E]/90 transition-opacity cursor-pointer shadow-sm"
          >
            {currentQ === 5 ? 'Done' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
