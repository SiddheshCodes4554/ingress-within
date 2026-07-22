import React from 'react';
import { X, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useExerciseStore } from '../../hooks/useExerciseStore';

export default function ExerciseHeader({ title, onClose }) {
  const { autosaveStatus } = useExerciseStore();

  const getAutosaveBadge = () => {
    switch (autosaveStatus) {
      case 'saving':
        return (
          <div className="flex items-center gap-1.5 text-xs text-primary/40">
            <RefreshCw size={12} className="animate-spin" />
            <span>Saving draft...</span>
          </div>
        );
      case 'saved':
        return (
          <div className="flex items-center gap-1.5 text-xs text-[#059669]">
            <CheckCircle size={12} />
            <span>Saved</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 text-xs text-[#d97706]">
            <AlertTriangle size={12} />
            <span>Save error</span>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <header className="w-full flex items-center justify-between border-b border-primary/5 pb-4 mb-6">
      <div className="flex items-center gap-3">
        <h1 className="font-serif text-lg text-primary font-normal">{title}</h1>
        {getAutosaveBadge()}
      </div>
      <button
        onClick={onClose}
        className="p-1.5 hover:bg-primary/5 rounded-full text-primary/40 hover:text-primary transition-all cursor-pointer"
        aria-label="Exit Exercise"
      >
        <X size={18} />
      </button>
    </header>
  );
}
