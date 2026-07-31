import React, { useState, useEffect } from 'react';
import { Edit3, CheckCircle2, ArrowRight } from 'lucide-react';

export function TextStep({ step, initialValue = '', onSaveAnswer, onNext, isSubmitting }) {
  const [text, setText] = useState(initialValue);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

  const qId = step.optional_question?.id || step.step_id || `q_${step.step_number}`;

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    setIsSaved(false);
    if (onSaveAnswer && qId) {
      onSaveAnswer(qId, val);
      setIsSaved(true);
    }
  };

  const handleBlur = () => {
    if (onSaveAnswer && qId) {
      onSaveAnswer(qId, text);
      setIsSaved(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider mb-4">
        <div className="flex items-center gap-2 text-accent">
          <Edit3 size={16} />
          <span>Written Practice</span>
        </div>
        {isSaved && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium lowercase">
            <CheckCircle2 size={13} /> Autosaved
          </span>
        )}
      </div>

      <h2 className="text-2xl font-serif text-primary mb-3 leading-tight">
        {step.title}
      </h2>

      <p className="text-mid text-sm mb-6 leading-relaxed">
        {step.content || step.optional_question?.prompt}
      </p>

      <div className="mb-6 relative">
        <textarea
          rows={6}
          value={text}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Write your response here..."
          className="w-full p-4 rounded-xl border border-accent/30 bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-y shadow-inner"
        />
        <div className="flex justify-between items-center text-xs text-supporting mt-2 px-1">
          <span>Your response is saved privately on your device.</span>
          <span>{text.length} characters</span>
        </div>
      </div>

      <div className="pt-2 flex justify-end">
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
