import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, ArrowRight, Wind } from 'lucide-react';

export function BreathingStep({ step, onNext, isSubmitting }) {
  const [isRunning, setIsRunning] = useState(true);
  const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Hold
  const [secondsInPhase, setSecondsInPhase] = useState(4);
  const [completedRounds, setCompletedRounds] = useState(0);

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsInPhase((prev) => {
        if (prev > 1) return prev - 1;

        // Transition to next phase
        setPhase((currentPhase) => {
          if (currentPhase === 'Inhale') return 'Hold (In)';
          if (currentPhase === 'Hold (In)') return 'Exhale';
          if (currentPhase === 'Exhale') {
            setCompletedRounds((r) => r + 1);
            return 'Hold (Out)';
          }
          return 'Inhale';
        });

        return 4; // 4 second box breathing phases
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  // Breathing circle scale class based on phase
  const getCircleScaleClass = () => {
    if (phase === 'Inhale') return 'scale-125 duration-4000 ease-in-out';
    if (phase === 'Hold (In)') return 'scale-125 duration-1000';
    if (phase === 'Exhale') return 'scale-90 duration-4000 ease-in-out';
    return 'scale-90 duration-1000';
  };

  return (
    <div className="max-w-xl mx-auto py-8 text-center animate-fade-in flex flex-col items-center">
      <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-2">
        <Wind size={16} />
        <span>Paced Breathing Practice</span>
      </div>

      <h2 className="text-2xl font-serif text-primary mb-2">
        {step.title}
      </h2>
      <p className="text-supporting text-xs mb-8 max-w-md">
        {step.content || 'Follow the expanding and contracting rhythm. Inhale deeply, hold gently, exhale slowly.'}
      </p>

      {/* Animated Breathing Circle Container */}
      <div className="my-8 relative flex items-center justify-center w-64 h-64">
        {/* Outer Glow Ring */}
        <div
          className={`absolute inset-0 rounded-full bg-accent/15 transition-transform ${getCircleScaleClass()}`}
        />
        {/* Inner Circle */}
        <div
          className={`w-48 h-48 rounded-full bg-primary text-white flex flex-col items-center justify-center shadow-xl transition-transform ${getCircleScaleClass()}`}
        >
          <span className="text-2xl font-serif font-light capitalize tracking-wide">
            {phase}
          </span>
          <span className="text-3xl font-mono font-bold text-accent mt-1">
            {secondsInPhase}s
          </span>
        </div>
      </div>

      {/* Breathing Controls */}
      <div className="flex items-center gap-4 my-6">
        <button
          onClick={() => setIsRunning(!isRunning)}
          className="p-3.5 bg-mint-grey hover:bg-accent/20 text-primary rounded-full transition-all cursor-pointer border border-accent/20"
          title={isRunning ? 'Pause Breathing' : 'Resume Breathing'}
        >
          {isRunning ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <button
          onClick={() => {
            setPhase('Inhale');
            setSecondsInPhase(4);
            setCompletedRounds(0);
          }}
          className="p-3.5 bg-mint-grey hover:bg-accent/20 text-supporting hover:text-primary rounded-full transition-all cursor-pointer border border-accent/20"
          title="Reset Exercise"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      <div className="text-xs text-supporting font-medium mb-8">
        Completed Rounds: <span className="text-primary font-bold">{completedRounds}</span>
      </div>

      <div className="w-full flex justify-end">
        <button
          onClick={onNext}
          disabled={isSubmitting}
          className="px-6 py-3 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
