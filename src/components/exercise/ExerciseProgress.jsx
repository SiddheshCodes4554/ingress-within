import React from 'react';
import { motion } from 'framer-motion';

export default function ExerciseProgress({ current, total }) {
  const percentage = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <div className="w-full space-y-2 mb-8">
      <div className="flex justify-between items-center text-xs text-primary/50 font-label-md uppercase tracking-wider font-semibold">
        <span>Step {current} of {total}</span>
        <span>{Math.round(percentage)}% Complete</span>
      </div>
      <div className="h-1 bg-primary/5 rounded-full overflow-hidden w-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="h-full bg-accent rounded-full"
        />
      </div>
    </div>
  );
}
