import React from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ExerciseLocked({ strategy, day, currentDay, onClose }) {
  const getLockReason = () => {
    if (strategy === 'day_milestone' && day) {
      const remaining = day - currentDay;
      return `This exercise will unlock on Day ${day} of your cycle. You are currently on Day ${currentDay} (${remaining} days remaining).`;
    }
    return 'This exercise is currently locked. Complete previous assessments or wait for the cycle trigger to unlock.';
  };

  return (
    <div className="max-w-md mx-auto py-16 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/40">
        <Lock size={24} />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl text-primary font-normal">Exercise Locked</h3>
        <p className="font-body-md text-primary/60 text-sm leading-relaxed">
          {getLockReason()}
        </p>
      </div>

      <button
        onClick={onClose}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
      >
        <ArrowLeft size={14} />
        <span>Back to Dashboard</span>
      </button>
    </div>
  );
}
