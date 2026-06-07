import React, { useEffect } from 'react';
import { X } from 'lucide-react';

const POLICY_DOCS = {
  privacy: { label: 'Privacy Policy', pdf: 'pdfs/privacy_policy.pdf' },
  terms: { label: 'Terms of Use', pdf: 'pdfs/terms_of_use.pdf' },
  cookies: { label: 'Cookie Policy', pdf: 'pdfs/cookie_policy.pdf' },
  data: { label: 'Data & Security', pdf: 'pdfs/data_security.pdf' },
  refund: { label: 'Refund Policy', pdf: 'pdfs/refund_policy.pdf' }
};

export default function PolicyModal({ isOpen, onClose, activeKey, setActiveKey }) {
  // Listen for Escape key to close the modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center animate-[fadeIn_0.2s_ease-out]">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-[#1E2A2E]/60 backdrop-blur-[4px] cursor-pointer"
      />
      
      {/* Modal Box */}
      <div className="relative z-10 bg-white rounded-premium w-[min(860px,94vw)] h-[min(88vh,840px)] flex flex-col overflow-hidden shadow-[0_24px_80px_rgba(30,42,46,0.3)]">
        {/* Header */}
        <div className="bg-primary px-5 flex items-center justify-between shrink-0 gap-4 overflow-x-auto no-scrollbar">
          {/* Tabs */}
          <div className="flex overflow-x-auto gap-0 flex-1 no-scrollbar">
            {Object.entries(POLICY_DOCS).map(([key, item]) => (
              <button
                key={key}
                onClick={() => setActiveKey(key)}
                className={`font-sans text-[13px] font-normal py-4 px-5 border-b-2 bg-transparent border-none cursor-pointer whitespace-nowrap transition-all duration-200 ${
                  activeKey === key 
                    ? 'color-white border-accent text-white font-medium' 
                    : 'text-[#D8ECEA]/60 border-transparent hover:text-[#D8ECEA]'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={onClose}
            aria-label="Close"
            className="bg-transparent border-none text-[#D8ECEA]/50 text-2xl cursor-pointer p-2 shrink-0 hover:text-white transition-colors leading-none"
          >
            &times;
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden bg-mint-grey">
          <iframe 
            src={POLICY_DOCS[activeKey]?.pdf || ''} 
            title={POLICY_DOCS[activeKey]?.label || 'Policy Document'}
            className="w-full h-full border-none block"
            // Simple fallback if PDF load fails
            onError={(e) => {
              console.log('PDF load fallback');
            }}
          />
        </div>
      </div>
    </div>
  );
}
