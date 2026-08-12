import React from 'react';

export default function ModuleWeekList({ catalog, content, playerState, onSelectWeek, onBackToOverview, onCompleteModule }) {
  const weeks = content?.weeks || [];
  const completedTouches = playerState?.completedTouches || [];
  const totalTouches = weeks.reduce((acc, w) => acc + (w?.touches?.length || 0), 0);
  const totalCompleted = completedTouches.length;
  const isModuleFullyDone = totalCompleted >= totalTouches;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between gap-3 pb-2 border-b border-[#F5EFE3]/15">
        <div>
          <button
            onClick={onBackToOverview}
            className="text-xs text-[#C9C2AE] hover:text-[#F5EFE3] flex items-center gap-1 mb-1"
          >
            ← Module Overview
          </button>
          <h1 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
            {catalog?.name || content?.brief?.moduleName} — Program Roadmap
          </h1>
        </div>
        <div className="text-right">
          <div className="text-xs text-[#C9C2AE]">Progress</div>
          <div className="font-mono text-sm font-semibold text-[#F2C776]">
            {totalCompleted}/{totalTouches} Touches
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-[#1B2340] border border-[#F5EFE3]/10 rounded-xl p-3 flex items-center gap-3">
        <div className="flex-1 bg-[#2A3358] h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-[#E8A33D] h-full transition-all duration-500"
            style={{ width: `${Math.min(100, Math.round((totalCompleted / (totalTouches || 1)) * 100))}%` }}
          />
        </div>
        <span className="text-xs font-mono text-[#F2C776] whitespace-nowrap">
          {Math.round((totalCompleted / (totalTouches || 1)) * 100)}% Complete
        </span>
      </div>

      {/* Weeks Grid / List */}
      <div className="space-y-3">
        {weeks.map((week, idx) => {
          const weekTouches = week.touches || [];
          const weekCompletedCount = weekTouches.filter(t => completedTouches.includes(t.id)).length;
          const isWeekDone = weekCompletedCount === weekTouches.length && weekTouches.length > 0;

          return (
            <div
              key={week.num}
              onClick={() => onSelectWeek(idx)}
              className={`border rounded-2xl p-5 cursor-pointer transition-all flex items-center justify-between gap-4 ${
                isWeekDone
                  ? 'bg-[#2A3358]/80 border-[#7A9471]/50 hover:border-[#7A9471]'
                  : 'bg-[#2A3358] border-[#F5EFE3]/15 hover:border-[#E8A33D]/60 hover:bg-[#3D4770]'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-[#1B2340] border border-[#F5EFE3]/20 flex items-center justify-center font-serif text-lg text-[#F2C776] font-bold flex-shrink-0">
                  {week.num}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-[#F5EFE3]">
                      Week {week.num}: {week.title}
                    </h3>
                    {week.kind === 'integration' && (
                      <span className="text-[10px] uppercase tracking-wider text-[#F2C776] bg-[#E8A33D]/20 border border-[#E8A33D]/40 px-2 py-0.5 rounded-full font-mono">
                        Integration
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[#C9C2AE]">
                    <span>Mechanism: <strong className="text-[#F5EFE3]">{week.mechanism}</strong></span>
                    <span>•</span>
                    <span>{weekTouches.length} Touches</span>
                  </div>
                </div>
              </div>

              {/* Progress pill for week */}
              <div className="text-right flex-shrink-0">
                <span className={`text-xs font-mono px-3 py-1 rounded-full border ${
                  isWeekDone
                    ? 'bg-[#7A9471]/20 border-[#7A9471]/50 text-[#7A9471] font-semibold'
                    : weekCompletedCount > 0
                    ? 'bg-[#E8A33D]/10 border-[#E8A33D]/40 text-[#F2C776]'
                    : 'bg-[#1B2340] border-[#F5EFE3]/15 text-[#C9C2AE]'
                }`}>
                  {weekCompletedCount}/{weekTouches.length} Done
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Module Completion Banner / Button */}
      {isModuleFullyDone && (
        <div className="p-5 bg-gradient-to-r from-[#7A9471]/30 to-[#E8A33D]/30 border border-[#7A9471] rounded-2xl text-center space-y-3">
          <h3 className="font-serif text-xl font-semibold text-[#F5EFE3]">
            All {weeks.length} Weeks Completed!
          </h3>
          <p className="text-xs text-[#C9C2AE] max-w-md mx-auto">
            You've completed all touches across the program. Take the final MHPI assessment to measure your response and view your progress report.
          </p>
          <button
            onClick={onCompleteModule}
            className="py-3 px-6 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-sm transition-all shadow-lg"
          >
            Take End Assessment & View Results
          </button>
        </div>
      )}
    </div>
  );
}
