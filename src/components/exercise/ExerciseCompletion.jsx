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
  const [isDelayed, setIsDelayed] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

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

      // If poll attempts exceed 20 (approx 30s), show delayed warning with retry actions
      if (pollAttempts >= 20) {
        if (active) setIsDelayed(true);
      }

      // Check again in 1.5 seconds
      setTimeout(() => {
        if (active && pollAttempts < 40) checkStatus();
      }, 1500);
    };

    checkStatus();

    return () => {
      active = false;
    };
  }, [instanceId, onComplete]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      if (instanceId) {
        await fetch('/api/exercises/admin/action', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'rebuild', instanceId })
        });
      }
    } catch (err) {
      console.error('Retry error:', err);
    }
    setIsRetrying(false);
    setIsDelayed(false);
    onComplete();
  };

  if (isDelayed) {
    return (
      <div className="max-w-md mx-auto py-12 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
        <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent mb-1">
          <RefreshCw size={20} className={isRetrying ? "animate-spin" : ""} />
        </div>
        <div className="space-y-2">
          <h3 className="font-serif text-xl text-primary font-normal">Analysis is taking longer than expected</h3>
          <p className="font-body-md text-primary/60 text-xs leading-relaxed">
            Your answers have been securely recorded. Our AI clinical engine is processing complex pattern mappings.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-xs pt-2">
          <button
            onClick={handleRetry}
            disabled={isRetrying}
            className="w-full px-4 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs disabled:opacity-50"
          >
            {isRetrying ? 'Retrying...' : 'Retry Analysis'}
          </button>
          <button
            onClick={() => onComplete()}
            className="w-full px-4 py-2.5 border border-primary/20 bg-white hover:bg-primary/5 text-primary rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            Refresh
          </button>
        </div>
        <button
          onClick={() => window.navigateTo('/dashboard')}
          className="text-xs text-primary/50 hover:text-primary transition-colors cursor-pointer underline pt-2"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

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
