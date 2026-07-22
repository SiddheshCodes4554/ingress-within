import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ExerciseError({ message, onRetry }) {
  return (
    <div className="max-w-md mx-auto py-16 flex flex-col items-center justify-center text-center space-y-6">
      <div className="w-16 h-16 rounded-full bg-[#fef3c7] flex items-center justify-center text-[#d97706]">
        <AlertCircle size={24} />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl text-primary font-normal">Something went wrong</h3>
        <p className="font-body-md text-primary/60 text-sm leading-relaxed">
          {message || 'We encountered a connection issue while updating your exercise.'}
        </p>
      </div>

      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
        >
          <RefreshCw size={12} />
          <span>Try Again</span>
        </button>
      )}
    </div>
  );
}
