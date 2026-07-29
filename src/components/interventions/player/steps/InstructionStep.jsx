import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';

export function InstructionStep({ step, onNext, isSubmitting }) {
  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
        <BookOpen size={16} />
        <span>Guided Instruction</span>
      </div>

      <h2 className="text-2xl md:text-3xl font-serif text-primary mb-6 leading-tight">
        {step.title}
      </h2>

      <div className="prose prose-slate max-w-none text-mid text-base leading-relaxed mb-8 space-y-4">
        {step.content.split('\n\n').map((paragraph, idx) => (
          <p key={idx}>{paragraph}</p>
        ))}
      </div>

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
