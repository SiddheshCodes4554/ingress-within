import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activePath, setActivePath] = useState(window.location.pathname || '/');

  useEffect(() => {
    const handleLocation = () => {
      setActivePath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handleLocation);
    return () => window.removeEventListener('popstate', handleLocation);
  }, []);

  const handleStartWriting = (e) => {
    e.preventDefault();
    if (window.navigateTo) {
      window.navigateTo('/auth');
    } else {
      window.location.pathname = '/auth';
    }
    setMobileMenuOpen(false);
  };

  const getLinkClass = (path) => {
    const isActive = activePath === path;
    return `font-sans text-[13.5px] border-b-2 pb-[4px] transition-all no-underline ${isActive
      ? 'text-primary font-medium border-accent'
      : 'text-mid font-normal border-transparent hover:text-primary hover:border-primary/10'
      }`;
  };

  const getMobileLinkClass = (path) => {
    const isActive = activePath === path;
    return `font-sans text-sm transition-all py-2 border-b border-primary/5 no-underline ${isActive ? 'text-primary font-medium pl-2 border-l-2 border-accent' : 'text-mid font-normal hover:text-primary'
      }`;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-[100] px-[5%] h-[68px] flex items-center justify-between bg-mint-grey/95 backdrop-blur-[12px] border-b border-primary/8 transition-all duration-300">

      {/* Logo block */}
      <div className="logo flex flex-col gap-[1px]">
        <div className="logo-mark flex items-center gap-[10px]">
          <svg className="logo-icon w-8 h-8" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="2" fill="#1E2A2E" />
            <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="#1E2A2E" strokeWidth="1.2" fill="none" />
            <circle cx="16" cy="16" r="6" stroke="#2E7A70" strokeWidth="1.2" fill="none" />
            <circle cx="16" cy="16" r="10" stroke="#2E7A70" strokeWidth="0.9" fill="none" opacity="0.65" />
            <circle cx="16" cy="16" r="14" stroke="#2E7A70" strokeWidth="0.6" fill="none" opacity="0.35" />
          </svg>
          <a href="/" className="no-underline">
            <span className="logo-name font-serif text-xl font-normal text-primary tracking-[0.01em]">
              ingress <span className="font-semibold">within</span>
            </span>
          </a>
        </div>
        <span className="logo-tagline font-sans text-[10px] font-light text-mid tracking-[0.12em] uppercase pl-[42px] leading-none">
          The way within
        </span>
      </div>

      {/* Nav Links */}
      <ul className="nav-links hidden md:flex items-center gap-6 list-none">
        <li><a href="/" className={getLinkClass('/')}>Home</a></li>
        <li><a href="/what-it-is" className={getLinkClass('/what-it-is')}>What it is</a></li>
        <li><a href="/how-it-works" className={getLinkClass('/how-it-works')}>How it works</a></li>
        {/* <li><a href="/about" className={getLinkClass('/about')}>About</a></li> */}
        <li><a href="/pricing" className={getLinkClass('/pricing')}>Pricing</a></li>
        <li><a href="/ai-data" className={getLinkClass('/ai-data')}>AI &amp; Data</a></li>
        {/* <li><a href="/contact" className={getLinkClass('/contact')}>Contact</a></li> */}
        <li>
          <a
            href="/auth"
            onClick={handleStartWriting}
            className="nav-cta bg-primary text-mint-grey hover:bg-[#2A3A3E] hover:translate-y-[-1px] px-[22px] py-[9px] rounded font-medium tracking-[0.03em] transition-all no-underline"
          >
            Start writing
          </a>
        </li>
      </ul>

      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        className="md:hidden text-primary p-1 bg-transparent border-none cursor-pointer focus:outline-none"
      >
        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu dropdown overlay */}
      {mobileMenuOpen && (
        <div className="absolute top-[68px] left-0 right-0 bg-mint-grey border-b border-primary/8 shadow-md flex flex-col p-6 gap-4 md:hidden animate-[fadeIn_0.2s_ease-out]">
          <a href="/" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/')}>Home</a>
          <a href="/what-it-is" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/what-it-is')}>What it is</a>
          <a href="/how-it-works" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/how-it-works')}>How it works</a>
          <a href="/about" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/about')}>About</a>
          <a href="/pricing" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/pricing')}>Pricing</a>
          <a href="/ai-data" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/ai-data')}>AI &amp; Data</a>
          <a href="/contact" onClick={() => setMobileMenuOpen(false)} className={getMobileLinkClass('/contact')}>Contact</a>
          <a
            href="/auth"
            onClick={handleStartWriting}
            className="bg-primary text-mint-grey py-3 rounded text-center font-medium tracking-wide mt-2"
          >
            Start writing
          </a>
        </div>
      )}
    </nav>
  );
}
