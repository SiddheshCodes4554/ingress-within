import React, { useState, useEffect, useRef } from 'react';
import { buildSequence, FALLBACK_PERSONALISED } from '../../../lib/exercises/v4/definitions/exercise1Catalog';

export default function Exercise1Flow({ instanceId, onClose, onComplete }) {
  const [loadingState, setLoadingState] = useState('preparing'); // 'preparing' | 'intro' | 'word' | 'loading' | 'reflection'
  const [sequence, setSequence] = useState([]);
  const [wordIndex, setWordIndex] = useState(0);
  const [responses, setResponses] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [charHint, setCharHint] = useState('');
  const [analysisText, setAnalysisText] = useState('');
  const [completedDate, setCompletedDate] = useState('');

  const inputRef = useRef(null);

  useEffect(() => {
    initializeExercise();
  }, [instanceId]);

  useEffect(() => {
    if (loadingState === 'word') {
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      });
    }
  }, [wordIndex, loadingState]);

  const initializeExercise = async () => {
    setLoadingState('preparing');
    try {
      // 1. Resume or prepare sequence via API
      const prepRes = await fetch('/api/exercises/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instance_id: instanceId })
      });

      let instData = null;
      let existingResponses = [];

      if (prepRes.ok) {
        const data = await prepRes.json();
        instData = data.instance;
        existingResponses = data.responses || [];
      } else {
        const startRes = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id: instanceId })
        });
        if (startRes.ok) {
          const startData = await startRes.json();
          instData = startData.instance;
        }
      }

      let seq = instData?.metadata?.word_sequence;
      if (!seq || seq.length === 0) {
        // Trigger Call 1 if sequence doesn't exist
        const call1Res = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ instance_id: instanceId, prepare_call1: true })
        });
        if (call1Res.ok) {
          const call1Data = await call1Res.json();
          seq = call1Data.instance?.metadata?.word_sequence;
        }
      }

      if (!seq || seq.length === 0) {
        seq = buildSequence(FALLBACK_PERSONALISED);
      }

      setSequence(seq);

      // Check completed result first
      if (instData?.status === 'completed') {
        const resultRes = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
        if (resultRes.ok) {
          const resData = await resultRes.json();
          const result = resData.result;
          setAnalysisText(result?.summary || result?.data?.summary || 'Your responses have been recorded. They will feed into your Day 30 report.');
          setCompletedDate(result?.created_at ? new Date(result.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '');
          setLoadingState('reflection');
          return;
        }
      }

      // Check if dropped mid-flow or after Word 12
      if (existingResponses.length === seq.length) {
        // Dropped after Word 12 but before analysis completed
        await finishResponses(existingResponses, seq);
        return;
      }

      // Abandoned mid-exercise → Spec Rule: restart from Word 1
      setResponses([]);
      setWordIndex(0);
      setLoadingState('intro');
    } catch (err) {
      console.error('[Exercise1Flow] Init error:', err);
      setSequence(buildSequence(FALLBACK_PERSONALISED));
      setLoadingState('intro');
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    const rem = 50 - val.length;
    setCharHint(rem <= 15 ? `${rem} characters remaining` : '');
  };

  const handleWordSubmit = () => {
    const val = inputValue.trim();
    if (!val) return;

    const currentItem = sequence[wordIndex];
    const newResponses = [...responses, { position: currentItem.position, word: currentItem.word, response: val }];
    setResponses(newResponses);
    setInputValue('');
    setCharHint('');

    // Autosave response to backend
    fetch('/api/exercises/autosave', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: instanceId,
        question_id: String(currentItem.position),
        prompt: currentItem.word,
        response: val
      })
    }).catch(err => console.warn('[Autosave] error:', err));

    if (wordIndex < sequence.length - 1) {
      setWordIndex(prev => prev + 1);
    } else {
      finishResponses(newResponses, sequence);
    }
  };

  const finishResponses = async (finalResponses, currentSequence) => {
    setLoadingState('loading');

    const formattedResponses = finalResponses.map((r, i) => ({
      position: currentSequence[i]?.position || i + 1,
      word: currentSequence[i]?.word || r.prompt || '',
      response: r.response
    }));

    try {
      // 1. Submit exercise
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: instanceId,
          raw_responses: formattedResponses,
          word_sequence: currentSequence
        })
      });

      // 2. Fetch Call 2 result
      const resultRes = await fetch(`/api/exercises/result?instance_id=${instanceId}`);
      if (resultRes.ok) {
        const resData = await resultRes.json();
        const result = resData.result;
        const cleanSummary = (result?.summary || result?.data?.summary || 'Your responses have been recorded. They will feed into your Day 30 report.')
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/^#+\s*/gm, '')
          .trim();
        setAnalysisText(cleanSummary);
        setCompletedDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      } else {
        setAnalysisText('Your responses have been recorded. They will feed into your Day 30 report.');
        setCompletedDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
      }
    } catch (err) {
      console.warn('[FinishResponses] Call 2 error/timeout:', err);
      setAnalysisText('Your responses have been recorded. They will feed into your Day 30 report.');
      setCompletedDate(new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }));
    } finally {
      setLoadingState('reflection');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleWordSubmit();
    }
  };

  const currentItem = sequence[wordIndex];
  const totalWords = sequence.length;

  return (
    <div className="fixed inset-0 z-50 bg-[#ECEFF0] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-0">

        {/* Logo Header */}
        <div className="flex items-center gap-2 px-7 pt-6 flex-shrink-0">
          <img 
            src="/logo-mark-transparent.png" 
            alt="Ingress Within" 
            className="w-5 h-5 object-contain" 
          />
          <span className="text-[13px] font-semibold tracking-tight font-serif">
            ingress <em className="text-[#8DBFB4] not-italic font-normal">within</em>
          </span>
        </div>

        {/* Preparing Screen */}
        {loadingState === 'preparing' && (
          <div className="flex-1 flex items-center justify-center p-7">
            <div className="font-serif italic text-[16px] text-[#4A6A64] animate-pulse">
              Preparing your exercise…
            </div>
          </div>
        )}

        {/* Intro Screen */}
        {loadingState === 'intro' && (
          <div className="flex-1 flex flex-col justify-between px-7 pt-0 pb-10">
            <div className="flex-1 flex flex-col justify-center py-8">
              <h1 className="font-serif text-[28px] font-normal mb-7 text-[#1E2A2E]">
                Word Association
              </h1>
              <div className="text-[17px] leading-[1.75] text-[#4A6A64]">
                <p>
                  You’ll see one word at a time. Write the first thing that comes to mind — a word or short phrase. There are no right answers. Move quickly.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setResponses([]);
                setWordIndex(0);
                setLoadingState('word');
              }}
              className="w-full py-4 rounded-lg bg-[#1E2A2E] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#1E2A2E]/90 transition-all shadow-sm"
            >
              Begin
            </button>
          </div>
        )}

        {/* 12 Word Screen */}
        {loadingState === 'word' && currentItem && (
          <div className="flex-1 flex flex-col justify-between px-7 pt-0 pb-10">
            {/* Word Header Counter */}
            <div className="flex items-center justify-between pt-5 flex-shrink-0">
              <span className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[#8DBFB4]">
                {wordIndex + 1} / {totalWords}
              </span>
            </div>

            {/* Stimulus Word */}
            <div className="flex-1 flex flex-col items-center justify-center py-6">
              <h2 className="font-serif font-semibold text-[52px] tracking-[-0.01em] text-center leading-[1.1] text-[#1E2A2E] animate-fade-in">
                {currentItem.word}
              </h2>
            </div>

            {/* Input & Submit */}
            <div className="w-full space-y-7">
              <div className="w-full">
                <input
                  ref={inputRef}
                  type="text"
                  maxLength={50}
                  value={inputValue}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your response"
                  autoComplete="off"
                  autoCorrect="off"
                  spellCheck="false"
                  className="w-full py-4 text-[18px] font-serif italic bg-transparent border-b-[1.5px] border-[#1E2A2E]/15 text-[#1E2A2E] outline-none text-center transition-colors duration-200 focus:border-[#1E2A2E] placeholder:text-[#1E2A2E]/30 placeholder:italic"
                />
                {charHint && (
                  <div className="text-[11px] text-[#1E2A2E]/30 text-right mt-1.5 font-sans">
                    {charHint}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={inputValue.trim().length === 0}
                onClick={handleWordSubmit}
                className="w-full py-4 rounded-lg bg-[#1E2A2E] text-white text-[14px] font-semibold cursor-pointer disabled:opacity-35 disabled:cursor-default hover:enabled:bg-[#1E2A2E]/90 transition-all shadow-sm"
              >
                Submit
              </button>
            </div>
          </div>
        )}

        {/* Loading Screen */}
        {loadingState === 'loading' && (
          <div className="flex-1 flex items-center justify-center p-7">
            <div className="font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
              Reading your responses.
            </div>
          </div>
        )}

        {/* Reflection Screen */}
        {loadingState === 'reflection' && (
          <div className="flex-1 flex flex-col justify-between px-7 pt-12 pb-9 animate-fade-in space-y-6">
            <div className="space-y-6">
              <div>
                <div className="text-[10px] font-semibold tracking-[0.12em] uppercase text-[#8DBFB4] mb-1.5">
                  Word Association
                </div>
                {completedDate && (
                  <div className="text-[12px] text-[#4A6A64]">
                    Completed {completedDate}
                  </div>
                )}
              </div>

              <p className="font-serif text-[19px] leading-[1.75] text-[#1E2A2E]">
                {analysisText}
              </p>

              <hr className="w-8 border-t-2 border-[#B8A8D4] my-4" />

              <p className="text-[13px] leading-[1.65] text-[#4A6A64]">
                This feeds into your Day 30 report.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onComplete) onComplete();
                if (onClose) onClose();
              }}
              className="w-full py-4 rounded-lg bg-[#1E2A2E] text-white text-[14px] font-semibold cursor-pointer hover:bg-[#1E2A2E]/90 transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
