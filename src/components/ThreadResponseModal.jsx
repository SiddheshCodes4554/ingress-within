import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const ThreadResponseModal = React.memo(({
  isOpen,
  activeThread,
  onClose,
  threadResponse,
  setThreadResponse,
  onSave,
  isSaving
}) => {
  if (!isOpen || !activeThread) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-[#1E2A2E]/40 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl max-w-[560px] w-full p-6 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
        >
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-mid hover:text-primary cursor-pointer border-none bg-transparent"
          >
            <X size={18} />
          </button>

          <div className="space-y-4">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-secondary mb-1">Open Thread Question</div>
              <h3 className="font-serif italic text-lg text-primary leading-relaxed">
                "{activeThread.question}"
              </h3>
            </div>

            <div className="bg-mint-grey rounded-lg p-4 space-y-1 text-xs text-mid leading-relaxed text-left">
              <div className="font-bold uppercase tracking-widest text-secondary text-[9px]">Context</div>
              <p>"{activeThread.context}"</p>
            </div>

            <div className="space-y-2 text-left">
              <label className="text-[11px] font-bold uppercase tracking-widest text-secondary">Your Reflection</label>
              <textarea 
                value={threadResponse}
                onChange={(e) => setThreadResponse(e.target.value)}
                placeholder="Write what is actually there — no structure, no editing."
                className="w-full min-h-[140px] border border-[#1E2A2E]/15 rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder-mid/30"
              />
              <div className="text-[10px] text-mid italic">
                Your response feeds directly into your Day 28 report.
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                onClick={onSave}
                disabled={!threadResponse.trim() || isSaving}
                className="flex-1 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none"
              >
                {isSaving ? 'Saving...' : "That's what's there"}
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

ThreadResponseModal.displayName = 'ThreadResponseModal';
