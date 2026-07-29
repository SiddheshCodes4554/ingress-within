import React from 'react';
import { CheckCircle, Clock, Calendar, ArrowLeft } from 'lucide-react';

export function CompletionStep({ intervention, session, progress, onReturnToDashboard }) {
  const formattedDuration = session?.elapsed_seconds
    ? `${Math.ceil(session.elapsed_seconds / 60)} minutes`
    : `${intervention?.estimated_duration || 5} minutes`;

  const completedTime = session?.completed_at
    ? new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="max-w-xl mx-auto py-12 px-4 text-center animate-fade-in flex flex-col items-center">
      {/* Success Badge */}
      <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-6 shadow-inner animate-bounce-short">
        <CheckCircle size={44} strokeWidth={2} />
      </div>

      <h1 className="text-3xl md:text-4xl font-serif text-primary mb-3 leading-tight">
        You've completed today's intervention.
      </h1>

      <p className="text-mid text-sm mb-8 max-w-md">
        Great work taking time for your well-being. Your practice session has been recorded.
      </p>

      {/* Summary Card */}
      <div className="w-full bg-white rounded-2xl border border-accent/20 p-6 mb-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between py-2 border-b border-accent/10">
          <span className="text-xs text-supporting uppercase tracking-wider font-semibold">Intervention</span>
          <span className="text-sm font-serif font-medium text-primary">{intervention?.title}</span>
        </div>

        <div className="flex items-center justify-between py-2 border-b border-accent/10">
          <div className="flex items-center gap-1.5 text-xs text-supporting">
            <Clock size={15} className="text-accent" />
            <span>Practice Duration</span>
          </div>
          <span className="text-sm font-mono font-semibold text-primary">{formattedDuration}</span>
        </div>

        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-1.5 text-xs text-supporting">
            <Calendar size={15} className="text-accent" />
            <span>Completed At</span>
          </div>
          <span className="text-sm font-mono text-primary">{completedTime}</span>
        </div>
      </div>

      {/* Primary Action Button */}
      <button
        onClick={onReturnToDashboard}
        className="w-full max-w-md py-3.5 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md hover:shadow-lg"
      >
        <ArrowLeft size={16} />
        <span>Return to Dashboard</span>
      </button>
    </div>
  );
}
