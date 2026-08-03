import React, { useState } from 'react';
import { CheckSquare, Check, ArrowRight } from 'lucide-react';
import { InteractiveExerciseTools } from '../widgets/InteractiveExerciseTools';

export function ChecklistStep({ step, onNext, isSubmitting }) {
  const items = Array.isArray(step.items)
    ? step.items
    : step.content.split('\n').filter((line) => line.trim().length > 0);

  const [checkedState, setCheckedState] = useState(new Array(items.length).fill(false));

  const toggleCheck = (idx) => {
    const updated = [...checkedState];
    updated[idx] = !updated[idx];
    setCheckedState(updated);
  };

  const completedCount = checkedState.filter(Boolean).length;
  const isAllChecked = items.length > 0 && completedCount === items.length;

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-4">
        <div className="flex items-center gap-2 text-accent">
          <CheckSquare size={16} />
          <span>Interactive Checklist</span>
        </div>
        <span className="text-supporting font-medium">
          {completedCount} of {items.length} completed
        </span>
      </div>

      <h2 className="text-2xl font-serif text-primary mb-3 leading-tight">
        {step.title}
      </h2>

      <p className="text-mid text-sm mb-6">
        Check off items as you complete them:
      </p>

      {/* Interactive Timer & Counter Tools */}
      <InteractiveExerciseTools
        title={step.title}
        content={step.content}
        items={items}
        estimatedDuration={step.estimated_duration}
      />

      <div className="space-y-3 mb-8">
        {items.map((item, idx) => {
          const isChecked = checkedState[idx];
          const cleanText = item.replace(/^[-*•\d.]+\s*/, '');

          return (
            <div
              key={idx}
              onClick={() => toggleCheck(idx)}
              className={`p-4 rounded-xl border transition-all flex items-start gap-3 cursor-pointer select-none ${
                isChecked
                  ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 shadow-sm'
                  : 'bg-white border-accent/20 hover:border-accent/40 text-primary'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all mt-0.5 ${
                  isChecked ? 'bg-emerald-600 text-white' : 'border border-accent/40 bg-mint-grey/50'
                }`}
              >
                {isChecked && <Check size={14} strokeWidth={3} />}
              </div>
              <span className={`text-sm leading-relaxed ${isChecked ? 'line-through opacity-80' : ''}`}>
                {cleanText}
              </span>
            </div>
          );
        })}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNext}
          disabled={isSubmitting}
          className={`px-6 py-3 font-medium text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm ${
            isAllChecked
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
              : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          <span>{isAllChecked ? 'Checklist Complete' : 'Continue'}</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
