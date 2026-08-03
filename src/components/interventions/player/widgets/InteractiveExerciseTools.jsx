import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Hash, Plus, CheckCircle2, RefreshCw } from 'lucide-react';

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
    timeLabel = `${rangeMinMatch[1]}-${rangeMinMatch[2]}m`;
  } else {
    // Single minute e.g. "5 minutes", "3 mins", "10 min", "2 minutes"
    const singleMinMatch = fullText.match(/(\d+)\s*(minute|min)s?/i);
    if (singleMinMatch) {
      const minNum = parseInt(singleMinMatch[1], 10);
      detectedDuration = minNum * 60;
      timeLabel = `${minNum}m`;
    } else {
      // Second match e.g. "30 seconds", "10 seconds", "5 seconds"
      const secMatch = fullText.match(/(\d+)\s*(second|sec|s\b)s?/i);
      if (secMatch) {
        const secNum = parseInt(secMatch[1], 10);
        detectedDuration = secNum;
        timeLabel = `${secNum}s`;
      }
    }
  }

  // Fallback to estimatedDuration if provided
  if (!detectedDuration && estimatedDuration > 0) {
    detectedDuration = estimatedDuration;
    const mins = Math.round(estimatedDuration / 60);
    timeLabel = mins > 0 ? `${mins}m` : `${estimatedDuration}s`;
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
      setIsTimerRunning(true);
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

  const isCounterFinished = currentCount >= targetCount && targetCount > 0;

  if (!mode) return null;

  return (
    <div className="inline-flex items-center gap-2 select-none animate-fade-in">
      {/* COMPACT TOP TIMER BADGE */}
      {mode === 'timer' && (
        <div className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 shadow-xs transition-all ${
          timeLeft === 0
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : isTimerRunning
            ? 'bg-[#8DBFB4]/10 text-primary border-[#8DBFB4]/40'
            : 'bg-amber-50 text-amber-900 border-amber-300'
        }`}>
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs tracking-tight">
            <Clock size={13} className={isTimerRunning && timeLeft > 0 ? 'text-[#1A5040] animate-pulse' : 'text-primary'} />
            <span>{formatTime(timeLeft)}</span>
          </div>

          <span className="text-[10px] text-mid font-sans border-l border-primary/10 pl-2">
            {timeLeft === 0 ? 'Time Complete ✓' : isTimerRunning ? 'Auto-Running' : 'Paused'}
          </span>

          <div className="flex items-center gap-1 border-l border-primary/10 pl-1.5">
            <button
              type="button"
              onClick={() => setIsTimerRunning(!isTimerRunning)}
              className="p-1 rounded-full hover:bg-primary/10 transition-colors text-primary border-none cursor-pointer"
              title={isTimerRunning ? 'Pause' : 'Play'}
            >
              {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimeLeft(initialSeconds);
                setIsTimerRunning(true);
              }}
              className="p-1 rounded-full hover:bg-primary/10 transition-colors text-mid border-none cursor-pointer"
              title="Reset"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
      )}

      {/* COMPACT TOP COUNTER BADGE */}
      {mode === 'counter' && (
        <div className={`px-3 py-1.5 rounded-full border text-xs font-medium flex items-center gap-2 shadow-xs transition-all ${
          isCounterFinished
            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
            : 'bg-[#8DBFB4]/10 text-primary border-[#8DBFB4]/40'
        }`}>
          <div className="flex items-center gap-1.5 font-mono font-bold text-xs">
            <Hash size={13} className="text-[#1A5040]" />
            <span>{currentCount} / {targetCount}</span>
          </div>

          <button
            type="button"
            onClick={() => setCurrentCount(prev => prev + 1)}
            className="px-2.5 py-0.5 rounded-full bg-primary text-white hover:bg-[#2A3A3E] text-[10px] font-semibold flex items-center gap-0.5 border-none cursor-pointer active:scale-95 transition-all shadow-2xs"
          >
            <Plus size={11} />
            <span>Count</span>
          </button>

          <button
            type="button"
            onClick={() => setCurrentCount(0)}
            className="p-0.5 rounded-full hover:bg-primary/10 text-mid border-none cursor-pointer"
            title="Reset"
          >
            <RefreshCw size={11} />
          </button>
        </div>
      )}
    </div>
  );
}
