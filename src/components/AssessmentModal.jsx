import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight } from 'lucide-react';

export const AssessmentModal = React.memo(({
  isOpen,
  cycleInfo,
  onClose,
  answers,
  setAnswers,
  onSave,
  isSubmitting,
  error
}) => {
  if (!isOpen || !cycleInfo) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#1E2A2E]/40 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl max-w-[560px] w-full p-6 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto text-left"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-mid hover:text-primary cursor-pointer border-none bg-transparent"
          >
            <X size={18} />
          </button>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[#5A4A8A] mb-1">Cycle Transition Assessment</div>
              <h2 className="font-serif text-lg text-primary leading-snug">
                Complete Cycle {cycleInfo.cycleNumber} Integration
              </h2>
              <p className="text-xs text-mid leading-relaxed mt-1">
                Take a moment to arrive. These reflective inquiries help synthesize your pattern changes before provisioning your next active cycle container.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                  1. What patterns of cognitive rigidity or avoidance did you notice during this cycle?
                </label>
                <textarea 
                  value={answers.q1}
                  onChange={(e) => setAnswers(prev => ({ ...prev, q1: e.target.value }))}
                  placeholder="Reflect on when you felt stuck, defensive, or depleted..."
                  className="w-full min-h-[90px] border border-[#1E2A2E]/15 rounded-lg p-2.5 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder-mid/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                  2. How has your relationship to your feelings shifted over the past 30 days?
                </label>
                <textarea 
                  value={answers.q2}
                  onChange={(e) => setAnswers(prev => ({ ...prev, q2: e.target.value }))}
                  placeholder="Reflect on emotional intensity, clarity, or emotional vocabulary shifts..."
                  className="w-full min-h-[90px] border border-[#1E2A2E]/15 rounded-lg p-2.5 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder-mid/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-secondary">
                  3. What is the focus or intention you want to carry into your next cycle?
                </label>
                <textarea 
                  value={answers.q3}
                  onChange={(e) => setAnswers(prev => ({ ...prev, q3: e.target.value }))}
                  placeholder="Set your intention for the next 30 days..."
                  className="w-full min-h-[90px] border border-[#1E2A2E]/15 rounded-lg p-2.5 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder-mid/30"
                />
              </div>
              
              {error && (
                <div className="text-[11px] text-[#8a3020] font-medium bg-[#e0a898]/10 border border-[#e0a898]/30 rounded p-2.5">
                  {error}
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2 border-t border-[#1E2A2E]/5">
              <button 
                onClick={onSave}
                disabled={!answers.q1.trim() || !answers.q2.trim() || !answers.q3.trim() || isSubmitting}
                className="flex-1 py-2.5 bg-[#5A4A8A] text-white hover:bg-[#4A3B75] disabled:bg-[#5A4A8A]/25 disabled:cursor-not-allowed rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none"
              >
                {isSubmitting ? 'Integrating learnings...' : 'Settle & Unlock Next Cycle'}
              </button>
              <button 
                onClick={onClose}
                className="px-4 py-2.5 border border-[#1E2A2E]/15 rounded text-xs font-semibold text-mid hover:bg-mint-grey transition-colors cursor-pointer bg-white"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
});

AssessmentModal.displayName = 'AssessmentModal';
