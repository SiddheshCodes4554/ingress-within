import React from 'react';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

export default function ExerciseNavigation({ onBack, onNext, isFirst, isLast, canProceed, isSubmitting }) {
  return (
    <div className="w-full flex items-center justify-between border-t border-primary/5 pt-6 mt-8">
      {/* Back button */}
      {!isFirst ? (
        <button
          onClick={onBack}
          disabled={isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 border border-primary/10 hover:border-primary/30 text-primary/70 rounded text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer disabled:opacity-50"
        >
          <ArrowLeft size={14} />
          <span>Back</span>
        </button>
      ) : (
        <div />
      )}

      {/* Next / Submit button */}
      <button
        onClick={onNext}
        disabled={!canProceed || isSubmitting}
        className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs uppercase tracking-wider font-semibold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
      >
        {isLast ? (
          <>
            <span>Submit</span>
            <Check size={14} />
          </>
        ) : (
          <>
            <span>Next</span>
            <ArrowRight size={14} />
          </>
        )}
      </button>
    </div>
  );
}
