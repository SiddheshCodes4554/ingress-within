import React from 'react';
import { Play, Clock, HelpCircle } from 'lucide-react';

export default function ExerciseIntro({ title, description, duration, stepsCount, onStart, isSubmitting }) {
  return (
    <div className="max-w-2xl mx-auto py-8 space-y-8 flex flex-col items-center text-center">
      <div className="space-y-4">
        <h2 className="font-serif text-3xl text-primary font-normal">{title}</h2>
        <p className="font-body-md text-primary/60 text-sm leading-relaxed max-w-lg">
          {description || 'This clinical exercise guides you to explore, reframe, and analyze core cognitive distortions.'}
        </p>
      </div>

      <div className="flex gap-8 border-y border-primary/5 py-4 w-full justify-center max-w-md">
        <div className="flex items-center gap-2 text-primary/60 text-xs font-semibold uppercase tracking-wider font-label-md">
          <Clock size={14} className="text-accent" />
          <span>{duration || 5} Min Duration</span>
        </div>
        <div className="flex items-center gap-2 text-primary/60 text-xs font-semibold uppercase tracking-wider font-label-md">
          <HelpCircle size={14} className="text-accent" />
          <span>{stepsCount || 3} Questions</span>
        </div>
      </div>

      <button
        onClick={onStart}
        disabled={isSubmitting}
        className="flex items-center gap-2 px-8 py-3.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
      >
        <Play size={12} fill="currentColor" />
        <span>Start Exercise</span>
      </button>
    </div>
  );
}
