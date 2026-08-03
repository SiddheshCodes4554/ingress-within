import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, ArrowRight, CheckCircle2 } from 'lucide-react';

export function TimerStep({ step, onNext, isSubmitting }) {
  const [totalSeconds, setTotalSeconds] = useState(step.estimated_duration || 180);
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [isRunning, setIsRunning] = useState(true);

  const handleSelectPreset = (mins) => {
    const secs = mins * 60;
    setTotalSeconds(secs);
    setTimeLeft(secs);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalSeconds > 0 ? Math.round(((totalSeconds - timeLeft) / totalSeconds) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto py-8 text-center animate-fade-in flex flex-col items-center">
      <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
        <Clock size={16} />
        <span>Timed Focused Exercise</span>
      </div>

      <h2 className="text-2xl font-serif text-primary mb-3">
        {step.title}
      </h2>
      <p className="text-mid text-sm mb-4 max-w-md">
        {step.content || 'Take a moment to remain in this practice until the timer expires.'}
      </p>

      {/* Quick Timer Presets */}
      <div className="flex items-center gap-2 mb-6">
        <span className="text-xs text-mid font-medium mr-1">Duration:</span>
        {[1, 3, 5, 10].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => handleSelectPreset(m)}
            className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer border ${
              totalSeconds === m * 60
                ? 'bg-primary text-white border-primary shadow-xs'
                : 'bg-white text-primary border-[#1E2A2E]/15 hover:bg-primary/5'
            }`}
          >
            {m} min
          </button>
        ))}
      </div>

      {/* Ring Timer */}
      <div className="my-6 relative w-56 h-56 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            cx="112"
            cy="112"
            r="96"
            stroke="currentColor"
            strokeWidth="10"
            className="text-mint-grey/60"
            fill="transparent"
          />
          <circle
            cx="112"
            cy="112"
            r="96"
            stroke="currentColor"
            strokeWidth="10"
            className="text-accent transition-all duration-1000 ease-linear"
            fill="transparent"
            strokeDasharray={603}
            strokeDashoffset={603 - (603 * progressPercent) / 100}
            strokeLinecap="round"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-4xl font-mono font-bold text-primary tracking-tight">
            {formatTime(timeLeft)}
          </span>
          <span className="text-xs text-supporting mt-1">
            {timeLeft === 0 ? 'Time Complete' : isRunning ? 'Remaining' : 'Paused'}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-4 my-6">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-3.5 bg-mint-grey hover:bg-accent/20 text-primary rounded-full transition-all cursor-pointer border border-accent/20"
          title={isRunning ? 'Pause Timer' : 'Resume Timer'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <button
          onClick={() => {
            setTimeLeft(totalSeconds);
            setIsRunning(false);
          }}
          className="p-3.5 bg-mint-grey hover:bg-accent/20 text-supporting hover:text-primary rounded-full transition-all cursor-pointer border border-accent/20"
          title="Reset Timer"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="w-full flex justify-end pt-4">
        <button
          onClick={onNext}
          disabled={isSubmitting}
          className={`px-6 py-3 font-medium text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
            timeLeft === 0
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          <span>{timeLeft === 0 ? 'Complete Exercise' : 'Continue'}</span>
          {timeLeft === 0 ? <CheckCircle2 size={16} /> : <ArrowRight size={16} />}
        </button>
      </div>
    </div>
  );
}
