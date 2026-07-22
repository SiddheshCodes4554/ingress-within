import React from 'react';

export default function ExerciseQuestion({ question, value, onChange, disabled }) {
  const { id, type, label, placeholder, options } = question;

  const handleTextChange = (e) => {
    onChange(e.target.value);
  };

  const handleScaleSelect = (val) => {
    onChange(val);
  };

  const handleImageSelect = (imgId) => {
    onChange(imgId);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="font-serif text-xl text-primary font-normal leading-relaxed block">
          {label}
        </label>
      </div>

      {type === 'free_text' && (
        <div className="w-full">
          {question.singleLine ? (
            <input
              disabled={disabled}
              type="text"
              maxLength={50}
              value={value || ''}
              onChange={handleTextChange}
              placeholder={placeholder || 'Type your response'}
              className="w-full py-4 text-center font-serif italic text-lg bg-transparent border-b border-primary/10 focus:border-primary outline-none transition-all placeholder:text-primary/30"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
            />
          ) : (
            <textarea
              disabled={disabled}
              value={value || ''}
              onChange={handleTextChange}
              placeholder={placeholder || 'Type your reflection here...'}
              className="w-full min-h-[160px] p-4 bg-surface-container-low border border-primary/5 hover:border-primary/20 focus:border-secondary focus:bg-white rounded-2xl outline-none font-body-md text-sm text-primary leading-relaxed transition-all placeholder:text-primary/30"
            />
          )}
        </div>
      )}

      {type === 'scale' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 justify-between">
            {Array.from(
              { length: (question.max || 10) - (question.min || 1) + 1 },
              (_, i) => (question.min || 1) + i
            ).map((num) => {
              const isSelected = value === num;
              return (
                <button
                  key={num}
                  type="button"
                  disabled={disabled}
                  onClick={() => handleScaleSelect(num)}
                  className={`w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl text-xs font-semibold uppercase tracking-wider font-label-md transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-primary text-mint-grey shadow-sm scale-105'
                      : 'bg-surface-container-low hover:bg-[#F8FBFA] border border-primary/5 hover:border-secondary text-primary/70'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between items-center text-[10px] uppercase font-semibold text-primary/40 font-label-md tracking-wider px-1">
            <span>Low Intensity</span>
            <span>High Intensity</span>
          </div>
        </div>
      )}

      {type === 'image' && (
        <div className="grid grid-cols-2 gap-4">
          {(options || []).map((opt) => {
            const isSelected = value === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={disabled}
                onClick={() => handleImageSelect(opt.id)}
                className={`p-2 border rounded-2xl bg-surface-container-low overflow-hidden transition-all text-left group cursor-pointer ${
                  isSelected
                    ? 'border-secondary bg-[#F8FBFA] ring-1 ring-secondary'
                    : 'border-primary/5 hover:border-secondary'
                } disabled:opacity-50`}
              >
                <div className="aspect-video w-full bg-primary/5 rounded-xl overflow-hidden mb-2 relative">
                  <img
                    src={opt.image_url || '/assets/inkblot_placeholder.png'}
                    alt={opt.label || 'Visual Inkblot'}
                    className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
                  />
                </div>
                <span className="block font-body-md text-xs font-semibold text-primary/80 px-1">
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
      {type === 'inkblot_step' && (
        <InkblotStepQuestion
          question={question}
          value={value}
          onChange={onChange}
          disabled={disabled}
          allResponses={question.allResponses}
        />
      )}
    </div>
  );
}

function InkblotStepQuestion({ question, value, onChange, disabled, allResponses }) {
  const { cardId, stepNum, imageUrl, questionText, placeholder } = question;
  const [showBreathModal, setShowBreathModal] = React.useState(false);
  const [showNudge, setShowNudge] = React.useState(false);

  const handleTextChange = (e) => {
    onChange(e.target.value);
  };

  const handleBreathClick = () => {
    setShowBreathModal(true);
    setTimeout(() => {
      setShowBreathModal(false);
    }, 3000);
  };

  // Extract prior responses for current card
  const r1 = allResponses ? allResponses[`card_${cardId}_step_1`] : null;
  const r2 = allResponses ? allResponses[`card_${cardId}_step_2`] : null;

  return (
    <div className="space-y-4 max-w-md mx-auto text-left">
      {/* Inkblot Image */}
      <div className="w-full aspect-[4/3] bg-[#e8e8e4] rounded-xl overflow-hidden shadow-xs border border-primary/10 relative">
        <img
          src={imageUrl}
          alt={`Inkblot Image ${cardId}`}
          className="w-full h-full object-cover"
        />
      </div>

      {/* Meta Bar */}
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-accent pt-1">
        <span>Step {stepNum} of 3</span>
        {cardId === 4 && stepNum === 1 && (
          <button
            type="button"
            onClick={handleBreathClick}
            className="normal-case text-xs text-primary/60 hover:text-primary transition-colors bg-none border-none cursor-pointer underline"
          >
            Need a moment?
          </button>
        )}
      </div>

      {/* Breath Modal Overlay */}
      {showBreathModal && (
        <div className="fixed inset-0 bg-[#1E2A2E]/60 z-50 flex items-center justify-center p-6 animate-fade-in backdrop-blur-xs">
          <p className="font-serif italic text-xl text-white text-center">
            Take your time. The image will stay here.
          </p>
        </div>
      )}

      {/* Prior Responses Thread */}
      {stepNum >= 2 && (
        <div className="bg-surface-container-low/60 rounded-lg p-3 space-y-2 border border-primary/5 text-xs">
          {r1 && (
            <div>
              <div className="font-semibold uppercase tracking-wider text-[10px] text-primary/50">
                What you saw
              </div>
              <div className="text-primary/80 font-serif italic">{r1}</div>
            </div>
          )}
          {stepNum === 3 && r2 && (
            <div>
              <div className="font-semibold uppercase tracking-wider text-[10px] text-primary/50">
                Where you looked
              </div>
              <div className="text-primary/80 font-serif italic">{r2}</div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="space-y-2 pt-2">
        {stepNum === 1 && cardId === 1 && (
          <div className="font-serif italic text-lg text-primary">
            Write what you see.
          </div>
        )}
        {stepNum > 1 && (
          <div className="font-sans text-base text-primary leading-relaxed">
            {questionText}
          </div>
        )}

        {stepNum === 1 ? (
          <div className="space-y-2">
            <textarea
              disabled={disabled}
              value={value || ''}
              onChange={handleTextChange}
              placeholder={placeholder || 'Describe what you see.'}
              className="w-full min-h-[90px] py-3 bg-transparent border-b border-primary/20 focus:border-primary outline-none font-serif italic text-base text-primary leading-relaxed resize-none transition-colors placeholder:text-primary/30"
              autoFocus
            />
            {showNudge && (
              <div className="flex items-center gap-2 text-xs text-primary/70 bg-surface-container-low p-2 rounded border border-primary/10">
                <span>Anything else you notice?</span>
                <button
                  type="button"
                  onClick={() => setShowNudge(false)}
                  className="text-accent underline font-semibold cursor-pointer"
                >
                  No, continue
                </button>
              </div>
            )}
          </div>
        ) : (
          <input
            disabled={disabled}
            type="text"
            value={value || ''}
            onChange={handleTextChange}
            placeholder={placeholder}
            className="w-full py-3 bg-transparent border-b border-primary/20 focus:border-primary outline-none font-serif italic text-base text-primary leading-relaxed transition-colors placeholder:text-primary/30"
            autoComplete="off"
            autoFocus
          />
        )}
      </div>
    </div>
  );
}
