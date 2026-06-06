import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: "How does Ingress Within differ from traditional therapy?",
    answer: "Ingress Within is a tool for self-directed reflection. We focus on developing your personal capacity for observation rather than clinical intervention. It is a companion to, not a replacement for, professional mental healthcare."
  },
  {
    question: "Is my reflection data private?",
    answer: "Your privacy is our architectural foundation. All reflections are encrypted at rest and in transit. We do not sell your personal insights to third parties, ever."
  },
  {
    question: "Can I cancel my journey at any time?",
    answer: "Yes, self-discovery should never feel like a trap. You can pause or cancel your subscription at any time through your account settings."
  },
  {
    question: "What is the daily time commitment?",
    answer: "A standard daily session takes between 10 to 15 minutes. This includes a short journaling prompt and one cognitive exercise. The weekly and monthly patterns are synthesized automatically in the background."
  }
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleItem = (idx) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      {FAQ_ITEMS.map((item, idx) => {
        const isOpen = openIndex === idx;
        
        return (
          <div key={idx} className="tonal-layer-1 bg-white border border-primary/5 rounded-xl overflow-hidden hover:border-primary/20 transition-all duration-300">
            <button
              onClick={() => toggleItem(idx)}
              className="w-full px-8 py-6 flex justify-between items-center text-left focus:outline-none group cursor-pointer"
            >
              <span className="font-headline-md text-base md:text-lg font-semibold text-primary group-hover:text-secondary transition-colors duration-300">
                {item.question}
              </span>
              <div className={`w-8 h-8 rounded-full border border-primary/5 flex items-center justify-center text-accent transition-transform duration-500 ${
                isOpen ? 'rotate-180 bg-accent/10' : 'bg-primary/5 group-hover:bg-primary/10'
              }`}>
                {isOpen ? <Minus size={14} /> : <Plus size={14} />}
              </div>
            </button>
            
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <p className="px-8 pb-6 font-body-md text-sm md:text-base text-on-surface-variant leading-relaxed max-w-2xl">
                    {item.answer}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
