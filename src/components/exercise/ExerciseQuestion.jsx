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
    </div>
  );
}
