import React, { useState, useEffect } from 'react';
import { ArrowRight, BookOpen, Edit3, CheckCircle2 } from 'lucide-react';

export function InstructionStep({ step, initialValue = '', onSaveAnswer, onNext, isSubmitting }) {
  const hasWriteIn = !!step.optional_question || /\b(write|jot down|list|note|log|identify|name|record|detail|draft|summarize|answer|reflect|describe|state)\b/i.test(step.content || '');
  const qId = step.optional_question?.id || step.step_id || `q_${step.step_number}`;

  const [text, setText] = useState(initialValue);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setText(initialValue);
  }, [initialValue]);

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
          <BookOpen size={16} />
          <span>Guided Instruction</span>
        </div>
        {hasWriteIn && isSaved && (
          <span className="flex items-center gap-1 text-emerald-600 font-medium lowercase">
            <CheckCircle2 size={13} /> Saved
          </span>
        )}
      </div>

      <h2 className="text-2xl md:text-3xl font-serif text-primary mb-6 leading-tight">
        {step.title}
      </h2>

      <div className="prose prose-slate max-w-none text-mid text-base leading-relaxed mb-6 space-y-4">
        {(step.content || '').split('\n\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

      {hasWriteIn && (
        <div className="mb-8 relative">
          <div className="flex items-center gap-1.5 text-xs text-supporting font-semibold uppercase tracking-wider mb-2">
            <Edit3 size={14} className="text-accent" />
            <span>Write your response</span>
          </div>
          <textarea
            rows={4}
            value={text}
            onChange={handleChange}
            onBlur={handleBlur}
            placeholder="Write here — it's saved automatically."
            className="w-full p-4 rounded-xl border border-accent/30 bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-y shadow-inner"
          />
          <div className="flex justify-between items-center text-xs text-supporting mt-1.5 px-1">
            <span>Saved privately in your session log.</span>
            <span>{text.length} characters</span>
          </div>
        </div>
      )}

      {step.optional_media && step.optional_media.url && (
        <div className="mb-8 rounded-2xl overflow-hidden border border-accent/20 bg-mint-grey/50 p-2">
          <img
            src={step.optional_media.url}
            alt={step.optional_media.caption || step.title}
            className="w-full h-auto max-h-72 object-cover rounded-xl"
            loading="lazy"
          />
          {step.optional_media.caption && (
            <p className="text-xs text-supporting italic text-center mt-2 pb-1">
              {step.optional_media.caption}
            </p>
          )}
        </div>
      )}

      <div className="pt-4 flex justify-end">
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
