import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

const MESSAGES = [
  'Tracing cognitive patterns...',
  'Evaluating emotional reactivity...',
  'Reframing underlying distortions...',
  'Assembling your clinical snapshot...',
  'Connecting insights with cycle history...'
];

export default function ExerciseCompletion({ instanceId, onComplete }) {
  const [messageIndex, setMessageIndex] = useState(0);

  // Rotating loading messages
  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Poll status endpoint
  useEffect(() => {
    let active = true;
    let pollAttempts = 0;

    const checkStatus = async () => {
      pollAttempts++;
      try {
        const res = await fetch('/api/exercises/status');
        if (res.ok) {
          const data = await res.json();
          const target = (data.statuses || []).find(s => (instanceId && s.instance?.id === instanceId) || (s.instance && ['finished', 'failed'].includes(s.instance.status)));
          if (target) {
            if (target.status === 'finished' || target.instance?.status === 'finished') {
              if (active) onComplete();
              return;
            }
            if (target.status === 'failed' || target.instance?.status === 'failed') {
              console.warn('[ExerciseCompletion] Analysis status marked failed, unblocking user...');
              if (active) onComplete();
              return;
            }
          }
        }
      } catch (err) {
        console.error('Polling check failed:', err);
      }

      // Safety timeout after 15 seconds (10 poll attempts) to avoid permanent spinner
      if (pollAttempts >= 10) {
        console.warn('[ExerciseCompletion] Reached polling timeout limit, forcing query refresh...');
        if (active) onComplete();
        return;
      }

      // Check again in 1.5 seconds
      setTimeout(() => {
        if (active) checkStatus();
      }, 1500);
    };

    checkStatus();

    return () => {
      active = false;
    };
  }, [instanceId, onComplete]);

  return (
    <div className="max-w-md mx-auto py-16 flex flex-col items-center justify-center text-center space-y-6">
      <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-2">
        <div className="absolute w-16 h-16 rounded-full border border-secondary/20 animate-ping" />
        <div className="absolute w-12 h-12 rounded-full border border-accent/20 animate-pulse" />
        <RefreshCw size={24} className="text-primary animate-spin" style={{ animationDuration: '3s' }} />
      </div>

      <div className="space-y-2">
        <h3 className="font-serif text-2xl text-primary font-normal">Analyzing your responses</h3>
        <p className="font-body-md text-primary/60 text-sm h-6 transition-all duration-500 font-medium">
          {MESSAGES[messageIndex]}
        </p>
      </div>

      <p className="text-xs text-primary/40 max-w-xs leading-relaxed">
        Our clinical intelligence engine is processing your answers to map underlying beliefs. This typically takes a few seconds.
      </p>
    </div>
  );
}
