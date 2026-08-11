import React from 'react';

export default function ModuleIntroSequence({ content, step, onNextStep, onPrevStep }) {
  const screens = content?.introScreens || [];
  const currentScreen = screens[step] || screens[0];
  const mechanisms = content?.brief?.mechanisms || [];

  if (!currentScreen) return null;

  return (
    <div className="space-y-6">
      {/* Top Progress Dots */}
      <div className="flex items-center justify-between gap-3 pb-2">
        <button
          onClick={onPrevStep}
          className="text-xs text-[#C9C2AE] hover:text-[#F5EFE3] flex items-center gap-1"
        >
          ← {step === 0 ? 'Back to Overview' : 'Previous'}
        </button>
        <div className="flex gap-1.5 flex-1 max-w-[200px]">
          {screens.map((_, idx) => (
            <span
              key={idx}
              className={`h-1 flex-1 rounded-full transition-all ${
                idx === step ? 'bg-[#E8A33D]' : idx < step ? 'bg-[#C9C2AE]' : 'bg-[#F5EFE3]/20'
              }`}
            />
          ))}
        </div>
        <span className="text-xs font-mono text-[#C9C2AE]">
          {step + 1}/{screens.length}
        </span>
      </div>

      {/* Main Screen Card */}
      <div className="bg-gradient-to-b from-[#2A3358] to-[#3D4770] border border-[#F5EFE3]/15 rounded-2xl p-6 space-y-4 shadow-xl">
        <div className="text-[11.5px] uppercase tracking-widest text-[#F2C776] font-semibold">
          {currentScreen.eyebrow}
        </div>
        <h2 className="font-serif text-2xl font-semibold text-[#F5EFE3]">
          {currentScreen.title}
        </h2>

        {/* Screen Paragraphs */}
        <div className="space-y-3">
          {currentScreen.body.map((p, idx) => (
            <p key={idx} className="text-sm text-[#C9C2AE] leading-relaxed">
              {p}
            </p>
          ))}
        </div>

        {/* Theory Grounding Custom Listing */}
        {currentScreen.theory && (
          <div className="space-y-4 pt-4 border-t border-[#F5EFE3]/15 mt-4">
            <h3 className="font-serif text-lg text-[#F2C776] font-semibold">
              Techniques Grounding by Mechanism
            </h3>
            {mechanisms.map(m => (
              <div key={m.key} className="bg-[#1B2340] border border-[#F5EFE3]/10 rounded-xl p-4 space-y-3">
                <div className="font-semibold text-sm text-[#F5EFE3]">
                  Mechanism {m.key}: {m.name}
                </div>
                <div className="space-y-2">
                  {m.techniques.map(t => (
                    <div key={t.code} className="bg-[#2A3358]/80 rounded-lg p-3 text-xs space-y-1.5 border border-[#F5EFE3]/10">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[#F2C776] font-bold">{t.code}</span>
                        <span className="font-semibold text-[#F5EFE3]">{t.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono ${
                          t.format === 'C' ? 'bg-purple-900/60 text-purple-200 border border-purple-400/40' :
                          t.format === 'B' ? 'bg-amber-900/60 text-amber-200 border border-amber-400/40' :
                          'bg-[#7A9471]/30 text-[#7A9471] border border-[#7A9471]/40'
                        }`}>
                          Format {t.format} {t.format === 'C' ? '(Reference-Only)' : t.format === 'B' ? '(Guided)' : '(Interactive)'}
                        </span>
                      </div>
                      <p className="text-[#C9C2AE]">{t.what}</p>

                      {/* Format C Therapist Note */}
                      {t.format === 'C' && t.professionalNote && (
                        <div className="mt-2 p-2.5 bg-purple-950/60 border border-purple-400/30 rounded text-[11px] text-purple-200 space-y-1">
                          <span className="font-semibold uppercase tracking-wider text-[10px] text-purple-300 block">
                            Therapist & Reference Note:
                          </span>
                          {t.professionalNote}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Consent Checkbox / Info */}
        {currentScreen.consent && (
          <div className="p-3.5 bg-[#1B2340]/80 border border-[#7A9471]/40 rounded-xl text-xs text-[#7A9471] flex items-center gap-2">
            <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Your journal entries are encrypted and accessible only to you and your practitioner.</span>
          </div>
        )}

        {/* Crisis Button */}
        {currentScreen.crisisButton && (
          <div className="pt-2">
            <button
              onClick={() => alert("Crisis Helplines:\nTeleMANAS: 14416 / 1800 891 4416\nKIRAN: 1800-599-0019\nVandrevala Foundation: +91 9999 666 555")}
              className="w-full py-2.5 px-4 bg-red-950/40 border border-red-500/40 hover:bg-red-900/40 text-red-200 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              Emergency Helpline Support Resources (KIRAN / TeleMANAS)
            </button>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {step > 0 && (
          <button
            onClick={onPrevStep}
            className="flex-1 py-3 px-4 bg-transparent border border-[#F5EFE3]/25 hover:bg-[#F5EFE3]/10 text-[#F5EFE3] font-semibold rounded-xl text-sm transition-all"
          >
            Previous
          </button>
        )}
        <button
          onClick={onNextStep}
          className="flex-1 py-3 px-4 bg-[#E8A33D] hover:bg-[#F2C776] text-[#1B2340] font-semibold rounded-xl text-sm transition-all shadow-md"
        >
          {currentScreen.cta || (step === screens.length - 1 ? 'Proceed' : 'Continue')} →
        </button>
      </div>
    </div>
  );
}
