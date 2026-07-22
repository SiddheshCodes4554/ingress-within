import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const slideVariants = {
  initial: (direction) => ({
    opacity: 0,
    x: direction > 0 ? 16 : -16
  }),
  animate: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] }
  },
  exit: (direction) => ({
    opacity: 0,
    x: direction > 0 ? -16 : 16,
    transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] }
  })
};

export default function ExerciseLayout({ children, stepKey, direction = 1 }) {
  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-premium p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 min-h-[480px] flex flex-col justify-between">
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={stepKey}
          custom={direction}
          variants={slideVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="flex-1 flex flex-col justify-between"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
