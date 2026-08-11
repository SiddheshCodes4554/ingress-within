import React from 'react';

export default function ModuleOverview({ catalog, content, playerState, onStartIntro, onResume, onReset }) {
  const name = catalog?.name || content?.brief?.moduleName || 'Psychoeducation Module';
  const price = catalog?.price ? `₹${catalog.price} ${catalog.currency || 'INR'}` : 'Core Program';
  const durationWeeks = catalog?.duration_weeks || content?.weeks?.length || 7;
  const mechanisms = content?.brief?.mechanisms || [];
  const completedCount = playerState?.completedTouches?.length || 0;
  const totalTouches = content?.weeks ? content.weeks.reduce((acc, w) => acc + w.touches.length, 0) : 35;
  const isStarted = completedCount > 0 || playerState?.mhpiData?.baseline !== null;

  return (
    <div className="space-y-6">
      {/* Topbar */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#F5EFE3]/15">
        <div className="flex items-center gap-2.5">
          <div className="w-5 h-6 text-[#E8A33D]">
            <svg viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0C12 0 4 8 4 16C4 20.4 7.6 24 12 24C16.4 24 20 20.4 20 16C20 8 12 0 12 0Z" fill="currentColor" opacity="0.9" />
              <path d="M12 6C12 6 7 12 7 17C7 19.8 9.2 22 12 22C14.8 22 17 19.8 17 17C17 12 12 6 12 6Z" fill="#F2C776" />
            </svg>
          </div>
          <span className="font-serif text-sm tracking-wide text-[#C9C2AE]">
            INGRESS WITHIN <b className="text-[#F5EFE3] font-semibold">MODULES</b>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] uppercase tracking-wider text-[#F2C776] border border-[#E8A33D]/40 px-2.5 py-1 rounded-full bg-[#E8A33D]/10 font-mono">
            {price}
          </span>
          <span className="text-[11px] text-[#7A9471] border border-[#7A9471]/40 px-2.5 py-1 rounded-full bg-[#7A9471]/10 font-mono">
            {durationWeeks} Weeks
          </span>
        </div>
      </div>

      {/* Main Header Card */}
      <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
          PSYCHOEDUCATION MODULE
        </div>
        <h1 className="font-serif text-3xl font-semibold text-[#F5EFE3] leading-tight">
          {name}
        </h1>
        <p className="text-[#C9C2AE] leading-relaxed text-sm">
          {catalog?.description || "A 7-week evidence-based program targeting self-criticism, duty-driven guilt, and self-doubt with structured cognitive, somatic, and behavioural tools."}
        </p>

        {/* Taxonomy Badges */}
        {catalog?.taxonomy_concerns && catalog.taxonomy_concerns.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            <span className="text-xs text-[#C9C2AE] self-center">Taxonomy Concerns:</span>
            {catalog.taxonomy_concerns.map(code => (
              <span key={code} className="text-xs bg-[#1B2340] border border-[#F5EFE3]/20 text-[#F2C776] px-2.5 py-0.5 rounded-full font-mono">
                {code}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mechanisms Card */}
      <div className="bg-[#2A3358] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4">
        <h2 className="font-serif text-xl font-semibold text-[#F5EFE3]">
          Targeted Mechanisms ({mechanisms.length})
        </h2>
        <div className="grid gap-3">
          {mechanisms.map(m => (
            <div key={m.key} className="bg-[#1B2340]/60 border border-[#F5EFE3]/10 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-serif text-base font-semibold text-[#F2C776]">
                  Mechanism {m.key}: {m.name}
                </span>
                <span className="text-xs text-[#C9C2AE] bg-[#3D4770] px-2 py-0.5 rounded font-mono">
                  Need: {m.need}
                </span>
              </div>
              <p className="text-xs text-[#C9C2AE] leading-relaxed">{m.def}</p>
              <div className="text-xs text-[#7A9471] italic pt-1">
                Contrast case: <strong>{m.contrast.who}</strong> — {m.contrast.text}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action CTA */}
      <div className="space-y-3 pt-2">
        {isStarted ? (
          <div className="space-y-3">
            <button
              onClick={onResume}
              className="w-full py-3.5 px-5 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              Resume Module ({completedCount}/{totalTouches} Touches Complete)
            </button>
            <div className="flex gap-3">
              <button
                onClick={onStartIntro}
                className="flex-1 py-2.5 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] text-xs font-semibold rounded-lg transition-all"
              >
                Review Intro Sequence
              </button>
              <button
                onClick={onReset}
                className="py-2.5 px-4 bg-transparent border border-red-400/30 hover:bg-red-400/10 text-red-300 text-xs font-semibold rounded-lg transition-all"
              >
                Reset Progress
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={onStartIntro}
            className="w-full py-4 px-5 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-base transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            Start Module — Step 1: Overview & Intro
          </button>
        )}
      </div>
    </div>
  );
}
