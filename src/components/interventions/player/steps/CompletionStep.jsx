import React from 'react';
import { CheckCircle, Clock, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';

export function CompletionStep({ intervention, session, progress, onReturnToDashboard }) {
  const targetDuration = intervention?.estimated_duration || intervention?.duration_minutes || intervention?.duration || 5;
  const formattedDuration = session?.elapsed_seconds && session.elapsed_seconds > 0
    ? `${Math.ceil(session.elapsed_seconds / 60)} min (target: ${targetDuration} min)`
    : `${targetDuration} minutes`;

  const completedTime = session?.completed_at
    ? new Date(session.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleExploreMore = () => {
    if (typeof window !== 'undefined') {
      window.navigateTo('/interventions');
    }
  };

  return (
    <div className="max-w-xl mx-auto py-10 px-4 text-center animate-fade-in flex flex-col items-center">
      {/* Success Badge */}
      <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-5 shadow-inner">
        <CheckCircle size={38} strokeWidth={2} />
      </div>

      <h1 className="text-2xl md:text-3xl font-serif font-medium text-primary mb-2 leading-tight">
        Nice job taking a moment for yourself.
      </h1>

      <p className="text-mid text-sm mb-6 font-serif italic max-w-md">
        Small moments like these can make a difference over time.
      </p>

      {/* Summary Card */}
      <div className="w-full bg-white rounded-2xl border border-accent/20 p-5 mb-6 shadow-xs space-y-3.5 text-left">
        <div className="flex items-center justify-between py-1.5 border-b border-accent/10">
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-emerald-500" />
            <span className="text-xs text-supporting uppercase tracking-wider font-semibold">Status</span>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full">
            Intervention completed
          </span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-accent/10">
          <span className="text-xs text-supporting uppercase tracking-wider font-semibold">Intervention</span>
          <span className="text-sm font-serif font-medium text-primary">{intervention?.title}</span>
        </div>

        <div className="flex items-center justify-between py-1.5 border-b border-accent/10">
          <div className="flex items-center gap-1.5 text-xs text-supporting">
            <Clock size={15} className="text-accent" />
            <span>Practice Duration</span>
          </div>
          <span className="text-sm font-mono font-semibold text-primary">{formattedDuration}</span>
        </div>

        <div className="flex items-center justify-between py-1.5">
          <div className="flex items-center gap-1.5 text-xs text-supporting">
            <Calendar size={15} className="text-accent" />
            <span>Completed At</span>
          </div>
          <span className="text-sm font-mono text-primary">{completedTime}</span>
        </div>
      </div>

      {/* What You Wrote (Private Stored Notes) */}
      {session?.responses && session.responses.length > 0 && (
        <div className="w-full bg-white rounded-2xl border border-accent/20 p-5 mb-6 shadow-xs text-left space-y-3">
          <div className="text-xs text-supporting uppercase tracking-wider font-semibold border-b border-accent/10 pb-2">
            What You Wrote
          </div>
          {session.responses.map((resp, idx) => {
            let label = resp.question_prompt || resp.prompt || '';
            const rawId = resp.question_id || label;
            if (!label || label.startsWith('q_') || label.startsWith('Q_') || label.startsWith('step_')) {
              if (intervention?.steps) {
                const match = rawId.match(/step[_\s]*(\d+)/i);
                if (match && match[1]) {
                  const stepIdx = parseInt(match[1], 10) - 1;
                  const stepObj = intervention.steps[stepIdx];
                  if (typeof stepObj === 'string') label = stepObj;
                  else if (stepObj?.content || stepObj?.instruction) label = stepObj.content || stepObj.instruction;
                }
              }
            }
            if (!label || label.startsWith('q_') || label.startsWith('Q_')) {
              label = `Note ${idx + 1}`;
            }

            return (
              <div key={idx} className="bg-mint-grey/50 rounded-xl p-3 border border-accent/10 text-xs space-y-1">
                <span className="text-[10px] font-semibold text-accent uppercase tracking-wider block">
                  {label}
                </span>
                <p className="font-serif italic text-primary text-sm whitespace-pre-wrap">
                  "{resp.answer || resp.response}"
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Action Buttons */}
      <div className="w-full max-w-md flex flex-col sm:flex-row gap-3">
        <button
          onClick={onReturnToDashboard || (() => typeof window !== 'undefined' && window.navigateTo('/dashboard'))}
          className="flex-1 py-3 bg-primary text-white font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-[#2A3A3E] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm hover:shadow-md border-none"
        >
          <ArrowLeft size={15} />
          <span>Return to Dashboard</span>
        </button>

        <button
          onClick={handleExploreMore}
          className="flex-1 py-3 bg-white text-primary border border-[#1E2A2E]/15 hover:border-accent font-semibold text-xs uppercase tracking-wider rounded-xl hover:bg-mint-grey/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Explore More Interventions</span>
          <ArrowRight size={15} className="text-accent" />
        </button>
      </div>
    </div>
  );
}
