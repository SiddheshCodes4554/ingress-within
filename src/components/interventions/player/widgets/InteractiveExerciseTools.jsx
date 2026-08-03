import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Hash, Plus, CheckCircle2, Sparkles, RefreshCw } from 'lucide-react';

export function detectTimeAndCount(title = '', content = '', items = [], estimatedDuration = 0) {
  const fullText = `${title || ''} ${content || ''} ${Array.isArray(items) ? items.join(' ') : ''}`.toLowerCase();

  // 1. Detect duration in seconds
  let detectedDuration = null;
  
  // Range match e.g. "5-10 minutes", "3-4 minutes", "2-3 minutes"
  const rangeMinMatch = fullText.match(/(\d+)\s*-\s*(\d+)\s*(minute|min)s?/i);
  if (rangeMinMatch) {
    detectedDuration = parseInt(rangeMinMatch[1], 10) * 60;
  } else {
    // Single min match e.g. "5 minutes", "3 mins", "10 min"
    const singleMinMatch = fullText.match(/(\d+)\s*(minute|min)s?/i);
    if (singleMinMatch) {
      detectedDuration = parseInt(singleMinMatch[1], 10) * 60;
    } else {
      // Sec match e.g. "30 seconds", "10 sec"
      const secMatch = fullText.match(/(\d+)\s*(second|sec)s?/i);
      if (secMatch) {
        detectedDuration = parseInt(secMatch[1], 10);
      }
    }
  }

  if (!detectedDuration && estimatedDuration > 0) {
    detectedDuration = estimatedDuration;
  }

  // 2. Detect target count
  let detectedTargetCount = null;
  const countMatch = fullText.match(/count\s+(?:of\s+)?(\d+)|repeat\s+(?:for\s+)?(\d+)|(\d+)\s*rounds?|(\d+)\s*times|name\s+(\d+)|(\d+)\s*things/i);
  if (countMatch) {
    const foundNum = countMatch.slice(1).find(val => val !== undefined);
    if (foundNum) {
      detectedTargetCount = parseInt(foundNum, 10);
    }
  }

  return {
    hasTimer: Boolean(detectedDuration && detectedDuration > 0),
    durationSeconds: detectedDuration || 180,
    hasCounter: Boolean(detectedTargetCount && detectedTargetCount > 0),
    targetCount: detectedTargetCount || 5
  };
}

export function InteractiveExerciseTools({ title, content, items, estimatedDuration, forceShow = false }) {
  const detected = detectTimeAndCount(title, content, items, estimatedDuration);
  
  const [activeMode, setActiveMode] = useState(() => {
    if (detected.hasTimer) return 'timer';
    if (detected.hasCounter) return 'counter';
    return forceShow ? 'timer' : null;
  });

  // Timer State
  const [initialSeconds, setInitialSeconds] = useState(detected.durationSeconds);
  const [timeLeft, setTimeLeft] = useState(detected.durationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Counter State
  const [targetCount, setTargetCount] = useState(detected.targetCount);
  const [currentCount, setCurrentCount] = useState(0);

  // Update if detected parameters change
  useEffect(() => {
    if (detected.hasTimer) {
      setInitialSeconds(detected.durationSeconds);
      setTimeLeft(detected.durationSeconds);
    }
    if (detected.hasCounter) {
      setTargetCount(detected.targetCount);
    }
  }, [title, content]);

  // Timer interval effect
  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectPreset = (mins) => {
    const secs = mins * 60;
    setInitialSeconds(secs);
    setTimeLeft(secs);
    setIsTimerRunning(false);
  };

  const progressPercent = initialSeconds > 0 ? Math.round(((initialSeconds - timeLeft) / initialSeconds) * 100) : 0;

  const isCounterFinished = currentCount >= targetCount && targetCount > 0;

  return (
    <div className="my-6 rounded-2xl border border-[#1E2A2E]/10 bg-white p-5 shadow-xs text-left space-y-4 select-none">
      {/* Header Bar & Mode Selector */}
      <div className="flex items-center justify-between border-b border-[#1E2A2E]/8 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#8DBFB4]" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
            Exercise Assistant & Countdown Tools
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveMode(activeMode === 'timer' ? null : 'timer')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
              activeMode === 'timer'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white text-primary border-[#1E2A2E]/15 hover:bg-primary/5'
            }`}
          >
            <Clock size={12} />
            <span>Timer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode(activeMode === 'counter' ? null : 'counter')}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
              activeMode === 'counter'
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white text-primary border-[#1E2A2E]/15 hover:bg-primary/5'
            }`}
          >
            <Hash size={12} />
            <span>Counter</span>
          </button>
        </div>
      </div>

      {/* TIMER MODE */}
      {activeMode === 'timer' && (
        <div className="space-y-4 pt-1 animate-fade-in">
          {/* Quick Presets */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mid">
              Countdown Timer
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 5, 10].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => handleSelectPreset(m)}
                  className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                    initialSeconds === m * 60
                      ? 'bg-[#8DBFB4]/20 border-[#8DBFB4] text-[#1A5040]'
                      : 'bg-mint-grey/50 border-[#1E2A2E]/10 text-mid hover:text-primary'
                  }`}
                >
                  {m}m
                </button>
              ))}
            </div>
          </div>

          {/* Timer Display Card */}
          <div className="bg-mint-grey/30 rounded-xl border border-[#1E2A2E]/8 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Radial or ring preview */}
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="26" stroke="currentColor" strokeWidth="4" className="text-black/5" fill="transparent" />
                  <circle
                    cx="32"
                    cy="32"
                    r="26"
                    stroke="currentColor"
                    strokeWidth="4"
                    className="text-[#8DBFB4] transition-all duration-1000 ease-linear"
                    fill="transparent"
                    strokeDasharray={163}
                    strokeDashoffset={163 - (163 * progressPercent) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                <Clock size={16} className="absolute text-primary" />
              </div>

              <div>
                <div className="text-2xl font-mono font-bold text-primary tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <div className="text-[11px] text-mid font-medium mt-0.5">
                  {timeLeft === 0 ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={12} /> Time Complete!
                    </span>
                  ) : isTimerRunning ? (
                    <span className="text-[#1A5040] animate-pulse">Running...</span>
                  ) : (
                    'Timer Paused'
                  )}
                </div>
              </div>
            </div>

            {/* Timer Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  isTimerRunning
                    ? 'bg-amber-500/10 text-amber-900 border-amber-500/30 hover:bg-amber-500/20'
                    : 'bg-primary text-white border-primary hover:bg-[#2A3A3E] shadow-xs'
                }`}
              >
                {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                <span>{isTimerRunning ? 'Pause' : 'Start Countdown'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTimeLeft(initialSeconds);
                  setIsTimerRunning(false);
                }}
                className="p-2 bg-white text-mid hover:text-primary rounded-xl transition-all cursor-pointer border border-[#1E2A2E]/15"
                title="Reset Timer"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COUNTER MODE */}
      {activeMode === 'counter' && (
        <div className="space-y-4 pt-1 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-mid">
              Step & Repetition Counter
            </span>
            <div className="flex items-center gap-1.5 text-xs text-mid">
              <span>Target:</span>
              {[3, 4, 5, 8, 10].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setTargetCount(num);
                    setCurrentCount(0);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer border ${
                    targetCount === num
                      ? 'bg-[#8DBFB4]/20 border-[#8DBFB4] text-[#1A5040]'
                      : 'bg-mint-grey/50 border-[#1E2A2E]/10 text-mid hover:text-primary'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-mint-grey/30 rounded-xl border border-[#1E2A2E]/8 p-4 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-[#1E2A2E]/10 flex items-center justify-center font-mono text-xl font-bold text-primary shadow-xs">
                {currentCount}
              </div>
              <div>
                <div className="text-xs font-semibold text-primary">
                  {isCounterFinished ? (
                    <span className="text-emerald-600 font-bold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Completed {targetCount} of {targetCount}!
                    </span>
                  ) : (
                    <span>Count: {currentCount} / {targetCount}</span>
                  )}
                </div>
                <div className="text-[11px] text-mid">
                  {isCounterFinished ? 'Great job completing this step!' : 'Tap the count button as you complete each repetition.'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentCount(prev => prev + 1)}
                className="px-5 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95"
              >
                <Plus size={15} />
                <span>+ Tap to Count ({currentCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentCount(0)}
                className="p-2 bg-white text-mid hover:text-primary rounded-xl transition-all cursor-pointer border border-[#1E2A2E]/15"
                title="Reset Counter"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
