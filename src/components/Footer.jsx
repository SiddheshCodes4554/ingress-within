import React from 'react';

export default function Footer({ onOpenPolicy }) {
  const handlePolicyClick = (e, key) => {
    e.preventDefault();
    if (onOpenPolicy) {
      onOpenPolicy(key);
    }
  };

  return (
    <footer className="bg-primary border-t border-white/8 py-[3.5rem] px-[8%] text-left text-mint-grey/50">
      <div className="max-w-[1060px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-12 mb-12">
        {/* Column 1: Brand descriptor */}
        <div className="md:col-span-2 space-y-3">
          <div className="footer-logo-name font-serif text-xl font-normal text-white/60 leading-none">
            ingress <span className="font-semibold">within</span>
          </div>
          <div className="footer-tagline font-sans text-[10px] font-light text-white/35 tracking-[0.1em] uppercase">
            The way within
          </div>
          <p className="footer-desc font-sans text-[13px] font-light text-[#C8DDD9]/55 leading-relaxed max-w-[260px]">
            A space to process what you are carrying — before therapy, during it, after it, or entirely on your own.
          </p>
        </div>

        {/* Column 2: Product */}
        <div className="footer-col flex flex-col gap-3">
          <div className="footer-col-title font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-white/35">
            Product
          </div>
          <ul className="list-none space-y-2.5 p-0">
            <li><a href="#/what-it-is" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">What it is</a></li>
            <li><a href="#/how-it-works" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">How it works</a></li>
            <li><a href="#/pricing" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Pricing</a></li>
            <li><a href="#/auth" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Start writing</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="footer-col flex flex-col gap-3">
          <div className="footer-col-title font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-white/35">
            Company
          </div>
          <ul className="list-none space-y-2.5 p-0">
            <li><a href="#/" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">About</a></li>
            <li><a href="#/" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Blog</a></li>
            <li><a href="#/contact" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Contact us</a></li>
            <li><a href="#/faq" className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">FAQ</a></li>
          </ul>
        </div>

        {/* Column 4: Legal */}
        <div className="footer-col flex flex-col gap-3">
          <div className="footer-col-title font-sans text-[11px] font-semibold tracking-[0.1em] uppercase text-white/35">
            Legal
          </div>
          <ul className="list-none space-y-2.5 p-0">
            <li><a href="#/" onClick={(e) => handlePolicyClick(e, 'privacy')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Privacy policy</a></li>
            <li><a href="#/" onClick={(e) => handlePolicyClick(e, 'terms')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Terms of use</a></li>
            <li><a href="#/" onClick={(e) => handlePolicyClick(e, 'cookies')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Cookie policy</a></li>
            <li><a href="#/" onClick={(e) => handlePolicyClick(e, 'data')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Data &amp; security</a></li>
            <li><a href="#/" onClick={(e) => handlePolicyClick(e, 'refund')} className="font-sans text-[13.5px] font-light text-white/65 hover:text-white transition-colors no-underline">Refund policy</a></li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-[1060px] mx-auto border-t border-white/7 pt-7 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="footer-copy font-sans text-xs font-light text-white/50">
          &copy; 2025 Ingress Within. All rights reserved.
        </div>
        <div className="footer-legal flex gap-6">
          <a href="#/" onClick={(e) => handlePolicyClick(e, 'privacy')} className="font-sans text-xs font-light text-white/50 hover:text-white/75 no-underline transition-colors">Privacy policy</a>
          <a href="#/" onClick={(e) => handlePolicyClick(e, 'terms')} className="font-sans text-xs font-light text-white/50 hover:text-white/75 no-underline transition-colors">Terms</a>
          <a href="#/contact" className="font-sans text-xs font-light text-white/50 hover:text-white/75 no-underline transition-colors">Contact</a>
        </div>
      </div>
    </footer>
  );
}
