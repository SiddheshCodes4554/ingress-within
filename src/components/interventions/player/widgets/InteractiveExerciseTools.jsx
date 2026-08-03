import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Hash, Plus, CheckCircle2, Sparkles, RefreshCw, Zap } from 'lucide-react';

export function detectTimeAndCount(title = '', content = '', items = [], estimatedDuration = 0) {
  const fullText = `${title || ''} ${content || ''} ${Array.isArray(items) ? items.join(' ') : ''}`.toLowerCase();

  let detectedDuration = null;
  let detectedTargetCount = null;
  let timeLabel = '';

  // 1. Minute Range e.g. "3-4 minutes", "5-10 minutes", "2-3 minutes"
  const rangeMinMatch = fullText.match(/(\d+)\s*-\s*(\d+)\s*(minute|min)s?/i);
  if (rangeMinMatch) {
    const minNum = parseInt(rangeMinMatch[1], 10);
    detectedDuration = minNum * 60;
    timeLabel = `${rangeMinMatch[1]}-${rangeMinMatch[2]} minutes`;
  } else {
    // Single minute e.g. "5 minutes", "3 mins", "10 min", "2 minutes"
    const singleMinMatch = fullText.match(/(\d+)\s*(minute|min)s?/i);
    if (singleMinMatch) {
      const minNum = parseInt(singleMinMatch[1], 10);
      detectedDuration = minNum * 60;
      timeLabel = `${minNum} minute${minNum > 1 ? 's' : ''}`;
    } else {
      // Second match e.g. "30 seconds", "10 seconds", "5 seconds"
      const secMatch = fullText.match(/(\d+)\s*(second|sec|s\b)s?/i);
      if (secMatch) {
        const secNum = parseInt(secMatch[1], 10);
        detectedDuration = secNum;
        timeLabel = `${secNum} seconds`;
      }
    }
  }

  // Fallback to estimatedDuration if provided
  if (!detectedDuration && estimatedDuration > 0) {
    detectedDuration = estimatedDuration;
    const mins = Math.round(estimatedDuration / 60);
    timeLabel = mins > 0 ? `${mins} minute${mins > 1 ? 's' : ''}` : `${estimatedDuration} seconds`;
  }

  // 2. Count detection e.g. "count of 8", "repeat 4 times", "5 things", "name 4", "4 rounds"
  const countMatch = fullText.match(/count\s+(?:of\s+)?(\d+)|repeat\s+(?:for\s+)?(\d+)|(\d+)\s*rounds?|(\d+)\s*times|name\s+(\d+)|(\d+)\s*(things|items)/i);
  if (countMatch) {
    const foundNum = countMatch.slice(1).find(val => val !== undefined);
    if (foundNum) {
      detectedTargetCount = parseInt(foundNum, 10);
    }
  }

  return {
    hasTimer: Boolean(detectedDuration && detectedDuration > 0),
    durationSeconds: detectedDuration || 0,
    timeLabel,
    hasCounter: Boolean(detectedTargetCount && detectedTargetCount > 0),
    targetCount: detectedTargetCount || 0
  };
}

export function InteractiveExerciseTools({ title, content, items, estimatedDuration }) {
  const detected = detectTimeAndCount(title, content, items, estimatedDuration);
  
  // Active Mode automatically determined by step need
  const mode = detected.hasTimer ? 'timer' : detected.hasCounter ? 'counter' : null;

  // Timer State (Auto-Starts automatically when step opens)
  const [initialSeconds, setInitialSeconds] = useState(detected.durationSeconds);
  const [timeLeft, setTimeLeft] = useState(detected.durationSeconds);
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Counter State
  const [targetCount, setTargetCount] = useState(detected.targetCount);
  const [currentCount, setCurrentCount] = useState(0);

  // Reset & Auto-Start whenever step title/content changes
  useEffect(() => {
    if (detected.hasTimer) {
      setInitialSeconds(detected.durationSeconds);
      setTimeLeft(detected.durationSeconds);
      setIsTimerRunning(true); // AUTO START COUNTDOWN
    }
    if (detected.hasCounter) {
      setTargetCount(detected.targetCount);
      setCurrentCount(0);
    }
  }, [title, content]);

  // Timer countdown loop
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

  const progressPercent = initialSeconds > 0 ? Math.round(((initialSeconds - timeLeft) / initialSeconds) * 100) : 0;
  const isCounterFinished = currentCount >= targetCount && targetCount > 0;

  // If the step doesn't require a timer or counter, don't render anything
  if (!mode) return null;

  return (
    <div className="my-6 rounded-2xl border border-[#8DBFB4]/30 bg-white p-5 shadow-sm text-left space-y-4 select-none animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-[#1E2A2E]/8 pb-3">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-[#8DBFB4] animate-pulse" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#1A5040]">
            {mode === 'timer' ? `Auto-Started Step Timer (${detected.timeLabel || 'Countdown Active'})` : `Auto-Detected Repetition Counter`}
          </span>
        </div>

        {mode === 'timer' && (
          <span className={`text-[9.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
            timeLeft === 0
              ? 'bg-emerald-100 text-emerald-800'
              : isTimerRunning
              ? 'bg-[#8DBFB4]/20 text-[#1A5040]'
              : 'bg-amber-100 text-amber-900'
          }`}>
            {timeLeft === 0 ? '✓ Complete' : isTimerRunning ? '● Live Countdown' : 'Paused'}
          </span>
        )}
      </div>

      {/* AUTO-STARTED COUNTDOWN TIMER */}
      {mode === 'timer' && (
        <div className="bg-[#8DBFB4]/5 rounded-xl border border-[#8DBFB4]/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {/* Circular Progress Display */}
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
              <Clock size={18} className="absolute text-primary" />
            </div>

            <div>
              <div className="text-3xl font-mono font-bold text-primary tracking-tight">
                {formatTime(timeLeft)}
              </div>
              <div className="text-[11px] text-mid font-medium mt-0.5">
                {timeLeft === 0 ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Time Complete! Excellent focus.
                  </span>
                ) : (
                  <span>Auto-counting down for this exercise step</span>
                )}
              </div>
            </div>
          </div>

          {/* Controls */}
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
              <span>{isTimerRunning ? 'Pause Timer' : 'Resume Timer'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTimeLeft(initialSeconds);
                setIsTimerRunning(true);
              }}
              className="p-2 bg-white text-mid hover:text-primary rounded-xl transition-all cursor-pointer border border-[#1E2A2E]/15"
              title="Reset Countdown"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      )}

      {/* AUTO-DETECTED STEP COUNTER */}
      {mode === 'counter' && (
        <div className="bg-[#8DBFB4]/5 rounded-xl border border-[#8DBFB4]/20 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#8DBFB4]/30 flex items-center justify-center font-mono text-xl font-bold text-primary shadow-xs">
              {currentCount}
            </div>
            <div>
              <div className="text-xs font-semibold text-primary">
                {isCounterFinished ? (
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> Target Reached: {targetCount} of {targetCount}!
                  </span>
                ) : (
                  <span>Count: {currentCount} / {targetCount}</span>
                )}
              </div>
              <div className="text-[11px] text-mid">
                {isCounterFinished ? 'Step completed! You can tap continue.' : 'Tap as you complete each item or repetition in this step.'}
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
              <span>+ Tap Count ({currentCount})</span>
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
      )}
    </div>
  );
}
