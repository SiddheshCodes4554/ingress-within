import React, { useState, useEffect, useRef } from 'react';
import { EXERCISE_0_QUESTIONS, calculateOceanScores } from '../../../lib/exercises/v4/definitions/exercise0Catalog';

export default function Exercise0Flow({ instanceId, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [cursor, setCursor] = useState(0);
  const [answers, setAnswers] = useState({});
  const [selectedVal, setSelectedVal] = useState(null);
  const [viewState, setViewState] = useState('question'); // 'question' | 'loading' | 'summary'
  const [summaryText, setSummaryText] = useState('');
  const [startedAt, setStartedAt] = useState(null);

  const autoAdvanceTimer = useRef(null);

  useEffect(() => {
    initializeFlow();
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, [instanceId]);

  const initializeFlow = async () => {
    setLoading(true);
    try {
      // 1. Resume active exercise instance & existing responses
      const resumeRes = await fetch('/api/exercises/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId })
      });

      let currentInst = null;
      let existingResponses = [];

      if (resumeRes.ok) {
        const resumeData = await resumeRes.json();
        currentInst = resumeData.instance;
        existingResponses = resumeData.responses || [];
      } else {
        const startRes = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id: instanceId })
        });
        if (startRes.ok) {
          const startData = await startRes.json();
          currentInst = startData.instance;
        }
      }

      setInstance(currentInst);

      // Restore saved answers
      const restored = {};
      existingResponses.forEach(r => {
        restored[r.question_id] = Number(r.response);
      });
      setAnswers(restored);

      // Resume from first unanswered question
      const firstUnansweredIdx = EXERCISE_0_QUESTIONS.findIndex(q => restored[q.id] === undefined || restored[q.id] === null);
      if (firstUnansweredIdx >= 0) {
        setCursor(firstUnansweredIdx);
      } else if (existingResponses.length === EXERCISE_0_QUESTIONS.length) {
        setCursor(EXERCISE_0_QUESTIONS.length - 1);
      }
    } catch (err) {
      console.error('[Exercise0Flow] Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePickAnswer = (val) => {
    // 15-minute inactivity check
    const now = Date.now();
    if (startedAt && now - startedAt > 15 * 60 * 1000) {
      setAnswers({});
      setCursor(0);
      setSelectedVal(null);
      setStartedAt(now);
      return;
    }
    if (!startedAt) setStartedAt(now);

    const currentQ = EXERCISE_0_QUESTIONS[cursor];
    setSelectedVal(val);

    const newAnswers = { ...answers, [currentQ.id]: val };
    setAnswers(newAnswers);

    // Autosave response to backend
    fetch('/api/exercises/autosave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: instanceId,
        question_id: currentQ.id,
        response: val
      })
    }).catch(err => console.warn('[Autosave] error:', err));

    // Wait 400ms then auto-advance
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    autoAdvanceTimer.current = setTimeout(() => {
      setSelectedVal(null);
      if (cursor < EXERCISE_0_QUESTIONS.length - 1) {
        setCursor(prev => prev + 1);
      } else {
        finishAssessment(newAnswers);
      }
    }, 400);
  };

  const finishAssessment = async (finalAnswers) => {
    setViewState('loading');

    const oceanScores = calculateOceanScores(finalAnswers);

    try {
      // 1. Submit final instance payload
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instanceId,
          personality_profile_json: finalAnswers,
          ocean_scores: oceanScores
        })
      });

      // 2. Fetch AI summary with 8s timeout
      const resultPromise = fetch(`/api/exercises/result?instance_id=${instanceId}`)
        .then(res => res.json())
        .then(data => data.result?.summary || data.result?.data?.summary || '');

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 8000)
      );

      const aiText = await Promise.race([resultPromise, timeoutPromise]);

      if (aiText && aiText.trim()) {
        setSummaryText(aiText.trim());
        setViewState('summary');
      } else {
        // Skip summary and route directly to Day 1 Journal
        handleCompleteAndRoute();
      }
    } catch (err) {
      console.warn('[FinishAssessment] Timeout or error, skipping summary screen:', err);
      handleCompleteAndRoute();
    }
  };

  const handleCompleteAndRoute = () => {
    if (onComplete) onComplete();
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/onboarding')) {
      window.navigateTo('/write');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] flex items-center justify-center font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
        One moment.
      </div>
    );
  }

  const q = EXERCISE_0_QUESTIONS[cursor];
  const progressPct = Math.round(((cursor + 1) / EXERCISE_0_QUESTIONS.length) * 100);
  const currentAnswer = answers[q?.id];

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-0">
        
        {/* Header Logo */}
        <div className="flex items-center gap-2 px-7 pt-6">
          <div className="w-[18px] h-[18px] rounded-full border-[1.5px] border-[#8DBFB4] flex items-center justify-center">
            <div className="w-[5px] h-[5px] rounded-full bg-[#8DBFB4]" />
          </div>
          <span className="text-[13px] font-semibold tracking-tight">
            ingress <em className="text-[#8DBFB4] not-italic font-normal">within</em>
          </span>
        </div>

        {/* View State Router */}
        {viewState === 'question' && q && (
          <div className="flex-1 flex flex-col justify-between px-7 pt-4 pb-9">
            {/* Progress Section */}
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8DBFB4]">
                {cursor + 1} of {EXERCISE_0_QUESTIONS.length}
              </div>
              <div className="h-[2px] bg-[#1E2A2E]/10 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1E2A2E] rounded-full transition-all duration-350 ease-out"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            {/* Question Text */}
            <div className="flex-1 flex items-center justify-center py-7">
              <h2 className="font-serif italic text-[22px] leading-[1.55] text-center max-w-[360px] text-[#1E2A2E]">
                "{q.text}"
              </h2>
            </div>

            {/* 5-Point Horizontal Scale */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-2.5">
                {[1, 2, 3, 4, 5].map(val => {
                  const isSelected = selectedVal === val || currentAnswer === val;
                  return (
                    <button
                      key={val}
                      type="button"
                      onClick={() => handlePickAnswer(val)}
                      className={`flex-1 aspect-square rounded-full border-[1.5px] transition-all duration-200 cursor-pointer ${
                        isSelected
                          ? 'bg-[#1E2A2E] border-[#1E2A2E] scale-105 shadow-sm'
                          : 'bg-white border-[#1E2A2E]/15 hover:border-[#8DBFB4]'
                      }`}
                    />
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#4A6A64]">
                <span>Not like me at all</span>
                <span>Very much like me</span>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {viewState === 'loading' && (
          <div className="flex-1 flex items-center justify-center p-7">
            <p className="font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
              One moment.
            </p>
          </div>
        )}

        {/* Founder Summary Screen */}
        {viewState === 'summary' && (
          <div className="flex-1 flex flex-col justify-between px-7 pt-12 pb-9 animate-fade-in space-y-8">
            <div className="space-y-6">
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#8DBFB4]">
                Here's what we noticed
              </div>

              <p className="font-serif text-[20px] leading-[1.7] text-[#1E2A2E]">
                {summaryText}
              </p>

              <hr className="w-8 border-t-2 border-[#B8A8D4] my-4" />

              <p className="text-[13px] leading-[1.65] text-[#4A6A64]">
                This shapes how we respond to you. You won't see it again — but it's working in the background.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCompleteAndRoute}
              className="w-full py-4 rounded-lg bg-[#1E2A2E] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#1E2A2E]/90 transition-all shadow-sm"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
