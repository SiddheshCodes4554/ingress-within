import React, { useState } from 'react';
import { Image as ImageIcon, Video, Music, ArrowRight, Loader2 } from 'lucide-react';

export function MediaStep({ step, onNext, isSubmitting }) {
  const media = step.optional_media || { type: 'image', url: '', caption: '' };
  const [isLoading, setIsLoading] = useState(true);

  const getMediaIcon = () => {
    if (media.type === 'video') return <Video size={16} />;
    if (media.type === 'audio') return <Music size={16} />;
    return <ImageIcon size={16} />;
  };

  return (
    <div className="max-w-2xl mx-auto py-6 animate-fade-in">
      <div className="flex items-center gap-2 text-accent text-xs font-semibold uppercase tracking-wider mb-4">
        {getMediaIcon()}
        <span>Guided Media Practice</span>
      </div>

      <h2 className="text-2xl font-serif text-primary mb-3">
        {step.title}
      </h2>

      {step.content && (
        <p className="text-mid text-sm mb-6 leading-relaxed">
          {step.content}
        </p>
      )}

      {/* Media Content Container */}
      <div className="mb-8 rounded-2xl overflow-hidden border border-accent/20 bg-mint-grey/40 relative">
        {isLoading && (
          <div className="h-64 flex items-center justify-center text-supporting">
            <Loader2 size={24} className="animate-spin text-accent" />
          </div>
        )}

        {media.type === 'image' && media.url && (
          <img
            src={media.url}
            alt={media.caption || step.title}
            onLoad={() => setIsLoading(false)}
            onError={() => setIsLoading(false)}
            className={`w-full h-auto max-h-96 object-contain rounded-xl transition-opacity duration-300 ${
              isLoading ? 'opacity-0 absolute inset-0' : 'opacity-100'
            }`}
          />
        )}

        {media.type === 'video' && media.url && (
          <video
            controls
            onLoadedData={() => setIsLoading(false)}
            className="w-full max-h-96 rounded-xl"
            poster={step.cover_image || undefined}
          >
            <source src={media.url} />
            Your browser does not support HTML5 video.
          </video>
        )}

        {media.type === 'audio' && media.url && (
          <div className="p-8 flex flex-col items-center justify-center">
            <audio
              controls
              onCanPlay={() => setIsLoading(false)}
              className="w-full max-w-md"
            >
              <source src={media.url} />
              Your browser does not support HTML5 audio.
            </audio>
          </div>
        )}

        {media.caption && (
          <div className="p-3 bg-mint-grey/80 border-t border-accent/10 text-xs text-supporting text-center font-sans italic">
            {media.caption}
          </div>
        )}
      </div>

      <div className="pt-2 flex justify-end">
        <button
          onClick={onNext}
          disabled={isSubmitting}
          className="px-6 py-3 bg-primary text-white font-medium text-sm rounded-xl hover:bg-primary/90 transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow-md"
        >
          <span>Continue</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
