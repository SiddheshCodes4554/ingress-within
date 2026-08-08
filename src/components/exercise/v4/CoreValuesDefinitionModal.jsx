import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';

export default function CoreValuesDefinitionModal({ valueItem, onClose }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!valueItem) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-xs">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal / Bottom Sheet */}
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-[480px] bg-[#FAF9F6] rounded-t-3xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-[#1E2A2E]/10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                Value Definition
              </span>
              <h3 className="font-serif text-2xl text-[#1E2A2E] font-normal mt-0.5">
                {valueItem.name}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-mid hover:text-primary rounded-full hover:bg-black/5 transition-colors cursor-pointer"
              aria-label="Close definition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="space-y-4 text-[#1E2A2E]">
            <div>
              <h4 className="text-xs font-semibold text-[#8DBFB4] uppercase tracking-wider mb-1">
                Definition
              </h4>
              <p className="text-sm leading-relaxed text-[#1E2A2E]/90 font-medium">
                {valueItem.definition}
              </p>
            </div>

            <div className="bg-[#ECEFF0] rounded-2xl p-4 border border-[#1E2A2E]/5">
              <h4 className="text-xs font-semibold text-[#4A6A64] uppercase tracking-wider mb-1">
                Behavioral Example
              </h4>
              <p className="text-xs italic text-[#1E2A2E]/80 leading-relaxed">
                "{valueItem.example}"
              </p>
            </div>
          </div>

          {/* Footer Action */}
          <div className="mt-6 pt-4 border-t border-[#1E2A2E]/10">
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <Check className="w-4 h-4" />
              Got it
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
