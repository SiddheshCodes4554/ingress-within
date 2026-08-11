import React, { useState } from 'react';

export default function ModuleWeekView({ content, weekIdx, playerState, onBackToWeekList, onSelectTouch, onOpenMhpiWeekly }) {
  const week = content?.weeks?.[weekIdx];
  const completedTouches = playerState?.completedTouches || [];

  const [showRetrievalReveal, setShowRetrievalReveal] = useState(false);

  if (!week) return null;

  const touches = week.touches || [];
  const weekCompletedCount = touches.filter(t => completedTouches.includes(t.id)).length;
  const isWeekTouchesDone = weekCompletedCount === touches.length && touches.length > 0;
  const isMhpiWeeklyDone = completedTouches.includes(`mhpi_w${week.num}`);

  return (
    <div className="space-y-6">
      {/* Navigation Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#F5EFE3]/15">
        <div>
          <button
            onClick={onBackToWeekList}
            className="text-xs text-[#C9C2AE] hover:text-[#F5EFE3] flex items-center gap-1 mb-1"
          >
            ← Program Roadmap
          </button>
          <h1 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
            Week {week.num}: {week.title}
          </h1>
        </div>
        <span className="text-xs font-mono text-[#F2C776] bg-[#1B2340] border border-[#F5EFE3]/15 px-3 py-1 rounded-full">
          {weekCompletedCount}/{touches.length} Touches
        </span>
      </div>

      {/* Retrieval Check Banner (if present) */}
      {week.retrievalCheck && (
        <div className="bg-[#2A3358] border border-[#F2C776]/30 rounded-2xl p-5 space-y-3">
          <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold flex items-center gap-2">
            <span>🧠</span> Retrieval Check — Review before continuing
          </div>
          <div className="space-y-2 text-xs text-[#F5EFE3]">
            <p>1. {week.retrievalCheck.prompt1}</p>
            <p>2. {week.retrievalCheck.prompt2}</p>
          </div>
          {showRetrievalReveal ? (
            <div className="p-3 bg-[#1B2340] border border-[#7A9471]/40 rounded-xl text-xs text-[#C9C2AE] space-y-1">
              <span className="font-semibold text-[#7A9471] block">Key Takeaway & Recall:</span>
              {week.retrievalCheck.reveal}
            </div>
          ) : (
            <button
              onClick={() => setShowRetrievalReveal(true)}
              className="text-xs text-[#F2C776] hover:underline font-medium"
            >
              Show Model Answer / Recall Key →
            </button>
          )}
        </div>
      )}

      {/* Reference Card Banner (if present - e.g. Format C Two-Chair Dialogue in Week 4) */}
      {week.hasReferenceCard && (
        <div className="bg-purple-950/40 border border-purple-400/30 rounded-2xl p-5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold text-purple-300">A5 (Format C)</span>
            <span className="text-[10px] uppercase font-mono bg-purple-900/80 border border-purple-400/40 text-purple-200 px-2 py-0.5 rounded">
              Reference-Only Card
            </span>
          </div>
          <h3 className="font-serif text-base font-semibold text-[#F5EFE3]">
            The Two-Chair Self-Criticism Dialogue
          </h3>
          <p className="text-xs text-[#C9C2AE] leading-relaxed">
            This technique is explained for reference but not practiced in-app. It works best live with a licensed Emotion-Focused therapist.
          </p>
        </div>
      )}

      {/* Touch List Cards */}
      <div className="space-y-3">
        <h2 className="font-serif text-lg text-[#F2C776] font-semibold">
          Week {week.num} Touches
        </h2>
        {touches.map((touch, idx) => {
          const isDone = completedTouches.includes(touch.id);
          return (
            <div
              key={touch.id}
              onClick={() => onSelectTouch(touch.id)}
              className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                isDone
                  ? 'bg-[#1B2340]/90 border-[#7A9471]/50 hover:border-[#7A9471]'
                  : 'bg-[#2A3358] border-[#F5EFE3]/15 hover:border-[#E8A33D]'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-bold flex-shrink-0 border ${
                  isDone
                    ? 'bg-[#7A9471] border-[#7A9471] text-[#1B2340]'
                    : 'bg-[#1B2340] border-[#F5EFE3]/20 text-[#C9C2AE]'
                }`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div>
                  <h4 className="font-semibold text-sm text-[#F5EFE3]">
                    {touch.title}
                  </h4>
                  <div className="text-xs text-[#C9C2AE]">
                    {touch.role}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {touch.guardrail && (
                  <span className="text-[10px] uppercase font-mono text-amber-300 bg-amber-950/60 border border-amber-500/40 px-2 py-0.5 rounded">
                    Guided [B]
                  </span>
                )}
                <span className="text-xs text-[#E8A33D] hover:underline">
                  {isDone ? 'Review' : 'Start Touch'} →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Weekly MHPI Check-in */}
      <div className="bg-[#2A3358] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-serif text-base font-semibold text-[#F5EFE3]">
              Week {week.num} Check-in (MHPI)
            </h3>
            <p className="text-xs text-[#C9C2AE]">
              3 quick questions to track your week-to-week changes.
            </p>
          </div>
          <button
            onClick={onOpenMhpiWeekly}
            className={`py-2 px-4 rounded-lg text-xs font-semibold transition-all border ${
              isMhpiWeeklyDone
                ? 'bg-[#7A9471]/20 border-[#7A9471] text-[#7A9471]'
                : isWeekTouchesDone
                ? 'bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] border-transparent'
                : 'bg-[#1B2340] border-[#F5EFE3]/20 text-[#C9C2AE]'
            }`}
          >
            {isMhpiWeeklyDone ? '✓ Check-in Saved' : 'Start Check-in'}
          </button>
        </div>
      </div>

      {/* Weekly Summary Card (if present) */}
      {week.summary && (
        <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-2">
          <div className="text-[11.5px] uppercase tracking-widest text-[#7A9471] font-semibold">
            Week {week.num} Summary
          </div>
          <p className="text-xs text-[#C9C2AE] leading-relaxed">
            {week.summary}
          </p>
        </div>
      )}
    </div>
  );
}
