import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  Sparkles, 
  Check, 
  PenTool, 
  Sliders, 
  TrendingUp, 
  BrainCircuit,
  Quote,
  Star,
  Activity,
  Award,
  ChevronRight
} from 'lucide-react';

// Import our custom interactive components
import DaySwitcher from './components/DaySwitcher';
import FaqAccordion from './components/FaqAccordion';

// Import subpages
import PricingPage from './pages/PricingPage';
import FaqPage from './pages/FaqPage';

// Premium Reveal Text component using direct spring fade-in animations
const RevealText = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Scroll-driven Reveal transition component
const ScrollReveal = ({ children, delay = 0, className = "" }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
};


export default function App() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isNavScrolled, setIsNavScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [authTab, setAuthTab] = useState('signin');
  const [currentPage, setCurrentPage] = useState('home'); // 'home', 'pricing', 'faq'
  
  // Parallax positions for Hero Portal Particles
  const heroRef = useRef(null);
  const [heroMousePos, setHeroMousePos] = useState({ x: 0, y: 0 });
  const [activeEngineNode, setActiveEngineNode] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [parserText, setParserText] = useState("I keep having the same argument with my manager and I don't know if it's me or them.");

  // Typewriter for Hero Card
  const [heroPhrase, setHeroPhrase] = useState("");
  const heroPhrases = [
    "I keep having the same argument with my manager and I don't know if it's me or them.",
    "I said yes again when I wanted to say no. I don't know why I keep doing this.",
    "Everything is fine on paper. I just feel like something is quietly off.",
    "I've been calling it tiredness for months now. Maybe it's something else."
  ];

  useEffect(() => {
    let phraseIndex = 0;
    let charIndex = 0;
    let typing = true;
    let interval;

    const type = () => {
      const currentPhrase = heroPhrases[phraseIndex];
      if (typing) {
        if (charIndex < currentPhrase.length) {
          setHeroPhrase(currentPhrase.substring(0, charIndex + 1));
          charIndex++;
        } else {
          typing = false;
          clearInterval(interval);
          setTimeout(() => {
            interval = setInterval(type, 16);
          }, 2800);
        }
      } else {
        if (charIndex > 0) {
          setHeroPhrase(currentPhrase.substring(0, charIndex - 1));
          charIndex--;
        } else {
          typing = true;
          phraseIndex = (phraseIndex + 1) % heroPhrases.length;
          clearInterval(interval);
          setTimeout(() => {
            interval = setInterval(type, 36);
          }, 400);
        }
      }
    };

    interval = setInterval(type, 36);
    return () => clearInterval(interval);
  }, []);

  const analyzeText = (text) => {
    const lower = text.toLowerCase();
    let stressCount = 0;
    let clarityCount = 0;
    let distortions = [];
    
    // Keywords for stress
    if (lower.includes("anxious") || lower.includes("worry") || lower.includes("worried") || lower.includes("stress") || lower.includes("sluggish") || lower.includes("overwhelmed") || lower.includes("tired") || lower.includes("tiredness")) {
      stressCount += 2;
    }
    if (lower.includes("fail") || lower.includes("failure") || lower.includes("mistake") || lower.includes("bad") || lower.includes("argument")) {
      stressCount += 2.5;
    }
    
    // Keywords for clarity/growth
    if (lower.includes("calm") || lower.includes("focus") || lower.includes("clear") || lower.includes("silence") || lower.includes("breaths") || lower.includes("realized") || lower.includes("remind")) {
      clarityCount += 2.5;
    }
    if (lower.includes("decided") || lower.includes("ready") || lower.includes("progress") || lower.includes("constructive")) {
      clarityCount += 1.5;
    }

    // Distortions
    if (lower.includes("entire") || lower.includes("wasted") || lower.includes("complete") || lower.includes("always") || lower.includes("never")) {
      distortions.push("All-or-Nothing Thinking");
    }
    if (lower.includes("fire") || lower.includes("lose my job") || lower.includes("failure") || lower.includes("worst")) {
      distortions.push("Catastrophizing");
    }
    if (lower.includes("angry") || lower.includes("thinks") || lower.includes("judged") || lower.includes("argument")) {
      distortions.push("Mind Reading");
    }

    // Default calculations
    let clarityScore = 70;
    if (text.trim().length > 0) {
      clarityScore = Math.min(100, Math.max(30, Math.round(70 + (clarityCount * 8) - (stressCount * 8))));
    } else {
      clarityScore = 0;
    }

    let primaryEmotion = "Neutral Attention";
    if (clarityCount > stressCount) primaryEmotion = "Active Serenity";
    else if (stressCount > clarityCount) primaryEmotion = "Stress Reactive";

    let coreTheme = "Self Reflection";
    if (lower.includes("work") || lower.includes("meeting") || lower.includes("job") || lower.includes("client") || lower.includes("manager") || lower.includes("argument")) coreTheme = "Workplace Friction";
    else if (lower.includes("morning") || lower.includes("day") || lower.includes("woke")) coreTheme = "Morning Clarity";

    return {
      clarityScore,
      primaryEmotion,
      coreTheme,
      distortions: distortions.length > 0 ? distortions.join(", ") : "None Detected",
      stressLevel: Math.min(100, Math.max(0, Math.round(30 + (stressCount * 15) - (clarityCount * 5)))),
      growthLevel: Math.min(100, Math.max(0, Math.round(40 + (clarityCount * 15) - (stressCount * 5))))
    };
  };

  // Scroll handler for navbar and scroll progress
  useEffect(() => {
    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll > 0) {
        setScrollProgress((window.scrollY / totalScroll) * 100);
      }
      setIsNavScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Mouse move handler for Hero Parallax particles
  const handleHeroMouseMove = (e) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setHeroMousePos({ x, y });
  };

  const handleHeroMouseLeave = () => {
    setHeroMousePos({ x: 0, y: 0 });
  };

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -80;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
    setIsMobileMenuOpen(false);
  };

  // Hash Routing Logic
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash === '#/pricing') {
        setCurrentPage('pricing');
        window.scrollTo(0, 0);
      } else if (hash === '#/faq') {
        setCurrentPage('faq');
        window.scrollTo(0, 0);
      } else {
        setCurrentPage('home');
        // Handle section scroll deep link (e.g. #/auth -> scroll to auth section)
        const anchor = hash.replace(/^#\/?/, '');
        if (anchor && ['what', 'how', 'trust', 'pricing', 'faq', 'auth'].includes(anchor)) {
          setTimeout(() => {
            const el = document.getElementById(anchor);
            if (el) {
              const yOffset = -80;
              const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
              window.scrollTo({ top: y, behavior: 'smooth' });
            }
          }, 150);
        }
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Run initial check on load

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Concentric ring visualizer data
  const ENGINE_NODES = [
    { id: 'syntax', label: 'Syntax Analysis', ring: 'outer', angle: 45, category: 'linguistic', detail: 'Analyzes sentence structure, word frequencies, and punctuation patterns.' },
    { id: 'sentiment', label: 'Sentiment Mapping', ring: 'middle', angle: 160, category: 'linguistic', detail: 'Tracks emotional fluctuations, identifying patterns of anxiety, joy, or focus.' },
    { id: 'cbt', label: 'CBT Distortions', ring: 'inner', angle: 280, category: 'psychometric', detail: 'Flags automatic negative thoughts like black-and-white thinking or catastrophizing.' },
    { id: 'biometrics', label: 'Activity Correlation', ring: 'outer', angle: 220, category: 'psychometric', detail: 'Connects journaling consistency and check-in times to your focus parameters.' }
  ];

  if (currentPage === 'pricing') {
    return <PricingPage />;
  }

  if (currentPage === 'faq') {
    return <FaqPage />;
  }

  return (
    <div className="min-h-screen bg-mint-grey text-primary selection:bg-accent/30 font-body-md">
      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-[3px] bg-primary z-[100] transition-all duration-100 ease-out" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Header Navigation */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 py-4 px-6 md:px-16 flex justify-between items-center ${
        isNavScrolled 
          ? 'bg-surface/90 glass-nav border-b border-primary/5 py-3 shadow-[0_2px_12px_rgba(30,42,46,0.02)]' 
          : 'bg-transparent border-b border-primary/0'
      }`}>
        <div className="flex justify-between items-center w-full max-w-container-max mx-auto">
          <div className="flex items-center gap-12">
            <button 
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="flex items-center transition-opacity hover:opacity-85 focus:outline-none cursor-pointer text-left"
            >
              <div className="flex items-center gap-2">
                <svg className="w-8 h-8 text-primary" viewBox="0 0 32 32" fill="none">
                  <circle cx="16" cy="16" r="2" fill="currentColor"/>
                  <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary"/>
                  <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="0.9" fill="none" opacity="0.65" className="text-secondary"/>
                  <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.35" className="text-secondary"/>
                </svg>
                <div className="flex flex-col">
                  <span className="font-headline-md text-lg font-bold tracking-tight text-primary leading-none">
                    ingress <span className="font-normal text-secondary italic font-headline-md">within</span>
                  </span>
                  <span className="text-[9px] font-label-md tracking-[0.12em] uppercase text-primary/45 mt-0.5 leading-none font-bold">
                    The way within
                  </span>
                </div>
              </div>
            </button>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex gap-8 items-center">
              <button onClick={() => scrollToSection('what')} className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md tracking-wide font-bold cursor-pointer">What it is</button>
              <button onClick={() => scrollToSection('trust')} className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md tracking-wide font-bold cursor-pointer">How it works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md tracking-wide font-bold cursor-pointer">Pricing</button>
            </div>
          </div>

          {/* Desktop CTA */}
          <button 
            onClick={() => scrollToSection('auth')}
            className="hidden lg:block bg-primary text-on-primary px-7 py-3 rounded-full font-label-md text-label-md tracking-wider uppercase text-[11px] hover:bg-primary/95 hover:shadow-lg transition-all duration-300 cursor-pointer font-bold"
          >
            Start writing
          </button>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-primary focus:outline-none flex flex-col gap-1.5 p-1 z-50 cursor-pointer"
          >
            <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
            <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`} />
            <span className={`w-6 h-0.5 bg-primary transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="absolute top-0 left-0 w-full bg-background border-b border-primary/10 p-8 pt-24 flex flex-col gap-6 shadow-xl lg:hidden z-40 text-left"
            >
              <button onClick={() => scrollToSection('what')} className="text-left font-label-md text-sm uppercase tracking-widest font-bold text-primary/70 py-1">What it is</button>
              <button onClick={() => scrollToSection('trust')} className="text-left font-label-md text-sm uppercase tracking-widest font-bold text-primary/70 py-1">How it works</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left font-label-md text-sm uppercase tracking-widest font-bold text-primary/70 py-1">Pricing</button>
              <button 
                onClick={() => scrollToSection('auth')}
                className="w-full bg-primary text-white font-label-md text-xs uppercase tracking-widest font-bold py-4 rounded-xl text-center mt-4 shadow-sm"
              >
                Start writing
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="pt-16">
        {/* HERO SECTION */}
        <section 
          ref={heroRef}
          onMouseMove={handleHeroMouseMove}
          onMouseLeave={handleHeroMouseLeave}
          className="min-h-[95vh] flex items-center px-6 md:px-16 py-20 md:py-28 max-w-container-max mx-auto overflow-hidden" 
          id="hero"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center w-full">
            {/* Left Side Content - Balanced Layout */}
            <div className="lg:col-span-7 space-y-12 max-w-2xl text-center lg:text-left">
              <div className="space-y-6">
                <div className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] flex items-center justify-center lg:justify-start gap-2">
                  <span className="w-7 h-[1px] bg-secondary hidden lg:block" />
                  For urban India
                </div>

                <RevealText>
                  <h1 className="font-display-lg-mobile md:font-display-lg text-[48px] md:text-[68px] text-primary leading-[1.05] tracking-tight">
                    The things you avoid naming<br/>
                    shape you <span className="italic font-normal text-secondary font-headline-lg font-headline-md">anyway.</span>
                  </h1>
                </RevealText>
                
                <RevealText delay={0.2}>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto lg:mx-0">
                    We gave it a framework. You fill it in — one entry at a time. The more clearly you see what you're actually carrying, the more clearly it reflects it back.
                  </p>
                </RevealText>
              </div>
              
              <RevealText delay={0.4}>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                    <button 
                      onClick={() => scrollToSection('auth')}
                      className="bg-primary text-on-primary px-12 py-5 rounded-xl font-label-md text-label-md hover:scale-[1.03] hover:bg-primary/95 active:scale-95 transition-all shadow-xl cursor-pointer font-bold"
                    >
                      Start writing free
                    </button>
                    <button 
                      onClick={() => scrollToSection('what')}
                      className="border border-outline text-primary px-12 py-5 rounded-xl font-label-md text-label-md hover:bg-white hover:scale-[1.03] transition-all cursor-pointer bg-white/50 font-bold"
                    >
                      Read why it exists &rarr;
                    </button>
                  </div>
                  
                  <div className="flex justify-center lg:justify-start gap-x-2 gap-y-2 text-xs font-label-md text-on-surface-variant items-center font-bold">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" className="stroke-on-surface-variant shrink-0"><rect x="1" y="5" width="11" height="8" rx="1.5" strokeWidth="1.2"/><path d="M4 5V3.5a2.5 2.5 0 0 1 5 0V5" strokeWidth="1.2"/></svg>
                    <span>Private by design. Your writing stays yours.</span>
                  </div>
                </div>
              </RevealText>

              {/* Divider */}
              <div className="h-[1px] bg-primary/10 w-full" />

              {/* Mini Features Grid to fill left column space */}
              <RevealText delay={0.5}>
                <div className="grid grid-cols-3 gap-6 pt-2 text-left animate-[fadeIn_1s_ease-out]">
                  <div className="space-y-2">
                    <span className="font-headline-md text-base md:text-lg italic text-secondary block font-bold">01 / Write</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Whatever is actually in your head. Not polished, not structured.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-headline-md text-base md:text-lg italic text-accent block font-bold">02 / Reflect</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      The AI names what you were circling around without quite landing on.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-headline-md text-base md:text-lg italic text-secondary block font-bold">03 / Pattern</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Over cycles, loops, contradictions, and shapes become visible.
                    </p>
                  </div>
                </div>
              </RevealText>
            </div>

            {/* Right Side: Live Interactive Dashboard preview widget */}
            <div className="lg:col-span-5 relative flex justify-center items-center h-[520px] w-full portal-container mt-12 lg:mt-0">
              {/* Concentric Glow Backdrop */}
              <div className="absolute w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[100px] pointer-events-none" />
              <div className="absolute w-[300px] h-[300px] bg-accent/15 rounded-full blur-[80px] pointer-events-none" />

              {/* 3D Parallax Rotation Wrapper */}
              <motion.div 
                style={{ 
                  rotateX: heroMousePos.y * -8, 
                  rotateY: heroMousePos.x * 8,
                  transformStyle: 'preserve-3d',
                  perspective: 1000
                }}
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
                className="relative w-full h-full flex flex-col items-center justify-center gap-5 max-w-[480px] z-10"
              >
                {/* 1. Main Journal reflection sheet */}
                <div 
                  className="w-full bg-[#FDFDFD] border border-primary/5 rounded-premium p-6 shadow-[0_15px_45px_rgba(30,42,46,0.06)] flex flex-col gap-4 text-left"
                  style={{ transform: 'translate3d(0px, 0px, 20px)' }}
                >
                  <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                      <span className="text-[10px] font-label-md text-primary/60 uppercase tracking-widest font-bold">Today &middot; Day 6</span>
                    </div>
                    <span className="text-[9px] font-label-md bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-bold">Linguistic Parser: ON</span>
                  </div>

                  <span className="text-[11px] font-bold text-primary/60 uppercase tracking-wider">What's on your mind right now?</span>

                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 min-h-[100px] relative font-body-md text-sm text-primary/80 italic leading-relaxed">
                    {heroPhrase || <span className="opacity-40">Start typing...</span>}
                    <span className="inline-block w-[2px] h-4 bg-accent animate-[blink_1.1s_infinite] ml-0.5 align-middle" />
                  </div>

                  <button className="w-full bg-accent text-primary border-none rounded-lg py-3 font-label-md text-xs font-bold uppercase tracking-wider cursor-default">
                    Reflect &rarr;
                  </button>

                  <div className="bg-secondary/10 border-l-2 border-secondary rounded-r-lg p-3.5 mt-1">
                    <p className="font-headline-md text-xs md:text-sm text-primary/80 italic leading-relaxed">
                      You've written about this situation three times now. Each time the ending is the same — but you describe yourself differently in each version.
                    </p>
                  </div>
                </div>

                {/* 2. Overlapping Metrics & CBT Reframe card grid */}
                <div 
                  className="grid grid-cols-2 gap-4 w-full"
                  style={{ transform: 'translate3d(0px, 0px, 40px)' }}
                >
                  {/* Metric Panel */}
                  <div className="bg-white border border-primary/5 rounded-premium p-5 shadow-[0_15px_45px_rgba(30,42,46,0.06)] flex flex-col justify-between h-[150px] text-left">
                    <span className="text-[9px] font-label-md text-primary/45 uppercase tracking-widest font-bold block">Emotional Balance</span>
                    
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-label-md font-bold">
                          <span>Reflective Growth</span>
                          <span className="text-secondary">75%</span>
                        </div>
                        <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: '75%' }} />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-label-md font-bold">
                          <span>Stress Reactive</span>
                          <span className="text-accent">25%</span>
                        </div>
                        <div className="h-1.5 w-full bg-primary/5 rounded-full overflow-hidden">
                          <div className="h-full bg-accent rounded-full" style={{ width: '25%' }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CBT Reframe Panel */}
                  <div className="bg-primary text-on-primary rounded-premium p-5 shadow-[0_20px_50px_rgba(30,42,46,0.15)] flex flex-col justify-between h-[150px] border border-primary/10 text-left">
                    <div>
                      <span className="text-[9px] text-accent uppercase tracking-widest font-bold block mb-1">CBT Reframe</span>
                      <h5 className="font-headline-md text-xs font-semibold text-white/95 leading-snug">Fact-Assumption Anchor</h5>
                      <p className="text-[10px] text-white/70 leading-normal font-light mt-1">
                        Stressor successfully linked to actionable next steps.
                      </p>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-white/10 text-[9px] text-white/50 font-bold">
                      <span>Clarity Balance</span>
                      <span className="text-accent">+35% Lift</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            </div>
          </div>
        </section>

        {/* PROBLEM SECTION */}
        <section className="py-24 md:py-36 bg-primary text-on-primary border-t border-white/5 relative overflow-hidden" id="problem">
          {/* Ambient background glows */}
          <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-secondary/10 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-accent/10 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-container-max mx-auto px-6 md:px-16 relative z-10 text-center space-y-16">
            <ScrollReveal className="max-w-3xl mx-auto space-y-6">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">The gap no one is filling</span>
              <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-white leading-tight font-medium font-headline-md">
                Something is off.<br/>
                But you're not broken enough<br/>
                to ask for help.
              </h2>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <p className="font-body-lg text-lg text-white/70 leading-relaxed max-w-xl mx-auto">
                The space between "I should probably think about this" and "I need professional help" is enormous and almost entirely unaddressed.
              </p>
            </ScrollReveal>

            {/* Problem Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <ScrollReveal className="h-full flex" delay={0.1}>
                <div className="bg-white/[0.02] border border-white/10 rounded-premium p-8 text-left space-y-4 hover:border-white/20 hover:bg-white/[0.04] transition-all flex flex-col justify-between w-full">
                  <span className="font-headline-lg text-5xl md:text-6xl text-accent font-light leading-none block font-headline-md">150M+</span>
                  <div>
                    <h4 className="font-body-md text-base font-semibold text-white mb-2 font-bold">Indians living with sub-clinical distress</h4>
                    <p className="text-xs text-white/60 leading-relaxed font-body">
                      Not in crisis. Not broken. Just carrying something that has no good place to go.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.2}>
                <div className="bg-white/[0.02] border border-white/10 rounded-premium p-8 text-left space-y-4 hover:border-white/20 hover:bg-white/[0.04] transition-all flex flex-col justify-between w-full">
                  <span className="font-headline-lg text-5xl md:text-6xl text-accent font-light leading-none block font-headline-md">&lt; 1%</span>
                  <div>
                    <h4 className="font-body-md text-base font-semibold text-white mb-2 font-bold">ever access any form of professional support</h4>
                    <p className="text-xs text-white/60 leading-relaxed font-body">
                      Therapy carries weight in India it doesn't carry elsewhere. Most people are not ready to make that admission.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.3}>
                <div className="bg-white/[0.02] border border-white/10 rounded-premium p-8 text-left space-y-4 hover:border-white/20 hover:bg-white/[0.04] transition-all flex flex-col justify-between w-full">
                  <span className="font-headline-lg text-5xl md:text-6xl text-accent font-light leading-none block font-headline-md">167hrs</span>
                  <div>
                    <h4 className="font-body-md text-base font-semibold text-white mb-2 font-bold font-headline-md">hours a week where most people have no structured space to process what they're carrying</h4>
                    <p className="text-xs text-white/60 leading-relaxed font-body">
                      A weekly session covers 0.6% of your waking life. Whatever you're carrying sits with you the rest of the time with nothing at all.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.4}>
                <div className="bg-white/[0.02] border border-white/10 rounded-premium p-8 text-left space-y-4 hover:border-white/20 hover:bg-white/[0.04] transition-all flex flex-col justify-between w-full">
                  <span className="font-headline-lg text-4xl md:text-5xl text-supporting font-normal leading-none block font-headline-md">No language</span>
                  <div>
                    <h4 className="font-body-md text-base font-semibold text-white mb-2 font-bold">for what sits between fine and help</h4>
                    <p className="text-xs text-white/60 leading-relaxed font-body">
                      Most urban Indians grew up in homes where the interior life was not a legitimate subject. There are no words for what you're carrying.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              {/* Quote Card */}
              <ScrollReveal className="md:col-span-2 w-full text-left" delay={0.5}>
                <div className="border-l-4 border-supporting bg-supporting/5 rounded-r-premium p-6 md:p-8">
                  <p className="font-headline-md text-lg md:text-xl italic leading-relaxed text-white/90 font-medium font-headline-md">
                    "Most people are not broken. They are stuck inside a story they have been telling themselves for long enough that it feels like the truth."
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* WHAT IS IT AND ISN'T SECTION */}
        <section className="py-24 md:py-36 bg-surface-container-low border-b border-primary/5" id="what">
          <div className="max-w-container-max mx-auto px-6 md:px-16 text-center space-y-16">
            <ScrollReveal className="max-w-3xl mx-auto space-y-6">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">What Ingress Within is and isn't</span>
              <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-primary leading-tight font-medium font-headline-md">
                Not a replacement for anything.<br/>
                A space that works alongside everything.
              </h2>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                Four things exist in this space. Three of them leave you where you started.
              </p>
            </ScrollReveal>

            {/* 4-Card Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <ScrollReveal className="h-full flex" delay={0.1}>
                <div className="bg-white border border-primary/5 rounded-premium p-8 text-left space-y-6 hover:shadow-lg transition-all flex flex-col justify-between w-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary/60">
                    <PenTool size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-headline-md text-lg font-bold text-primary">This is not journaling.</h4>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      A blank page with no one listening. You write into a void. The void writes nothing back.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.2}>
                <div className="bg-white border border-primary/5 rounded-premium p-8 text-left space-y-6 hover:shadow-lg transition-all flex flex-col justify-between w-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary/60">
                    <BrainCircuit size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-headline-md text-lg font-bold text-primary">This is not therapy.</h4>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      It works before therapy, during it, after it, or entirely on its own. What it isn't is a substitute — it is a different thing, useful for a different purpose.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.3}>
                <div className="bg-white border border-primary/5 rounded-premium p-8 text-left space-y-6 hover:shadow-lg transition-all flex flex-col justify-between w-full">
                  <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center text-primary/60">
                    <Sliders size={20} />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-headline-md text-lg font-bold text-primary">This is not wellness.</h4>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      Observe your thoughts without giving you anything honest to do with them. Calm is useful. It is not clarity.
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.4}>
                <div className="bg-primary text-on-primary border border-primary rounded-premium p-8 text-left space-y-6 shadow-2xl hover:bg-primary/95 transition-all flex flex-col justify-between w-full">
                  <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-accent">
                    <Sparkles size={20} className="animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-headline-md text-lg font-bold text-white">This is reflection.</h4>
                    <p className="font-body-md text-xs text-white/70 leading-relaxed">
                      We built the framework. You fill it in — one entry at a time. Writing without editing yourself first is what gives it something real to work with.
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* TRUST SECTION */}
        <section className="py-24 md:py-36 bg-white border-b border-primary/5" id="trust">
          <div className="max-w-container-max mx-auto px-6 md:px-16 text-center space-y-16">
            <ScrollReveal className="max-w-3xl mx-auto space-y-6">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">Why trust it</span>
              <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-primary leading-tight font-medium font-headline-md">
                You train it.<br/>
                Not the other way around.
              </h2>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                We built the framework. The AI knows what patterns look like and how to ask about them. But it only knows your patterns because you showed it — one entry at a time. The more you write without editing yourself first, the sharper the picture becomes.
              </p>
            </ScrollReveal>

            {/* 3-Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              <ScrollReveal className="h-full flex" delay={0.1}>
                <div className="bg-surface-container-low border-t-4 border-accent rounded-b-premium p-8 text-left space-y-4 hover:shadow-md transition-all flex flex-col justify-between w-full">
                  <h4 className="font-headline-md text-lg font-bold text-primary leading-snug">
                    It starts knowing nothing about you.
                  </h4>
                  <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                    No assumptions, no defaults, no pre-loaded psychology. It reads what you write. That is all it has to work with.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.2}>
                <div className="bg-surface-container-low border-t-4 border-secondary rounded-b-premium p-8 text-left space-y-4 hover:shadow-md transition-all flex flex-col justify-between w-full">
                  <h4 className="font-headline-md text-lg font-bold text-primary leading-snug">
                    Writing without editing yourself first makes it sharper. Writing your narrative — the polished version — leaves it with less to work with.
                  </h4>
                  <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                    The quality of what you get back is a direct reflection of what you put in. There is no way to cheat this without cheating yourself.
                  </p>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.3}>
                <div className="bg-surface-container-low border-t-4 border-supporting rounded-b-premium p-8 text-left space-y-4 hover:shadow-md transition-all flex flex-col justify-between w-full">
                  <h4 className="font-headline-md text-lg font-bold text-primary leading-snug">
                    You can always see everything it has seen.
                  </h4>
                  <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                    Every pattern it names, every connection it draws — it comes from your own entries. Nothing is inferred from anywhere else. You built what it knows.
                  </p>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* SECTION: HOW IT WORKS (BESPOKE TIMELINE) */}
        <section className="py-section-gap bg-surface-container-low border-b border-primary/5" id="how">
          <ScrollReveal className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop overflow-hidden space-y-12">
            <div className="text-center mb-12 max-w-3xl mx-auto space-y-4">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">The practice</span>
              <RevealText>
                <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-primary leading-tight font-medium font-headline-md">
                  One entry a day.<br/>
                  A thread that builds into a picture.
                </h2>
              </RevealText>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <RevealText delay={0.15}>
                <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">
                  Not a program. Not a checklist. A daily practice that gets less edited the longer you do it. Most people begin seeing real patterns across two cycles.
                </p>
              </RevealText>
            </div>

            {/* Timeline switcher */}
            <DaySwitcher activeIndex={activeDayIndex} setActiveIndex={setActiveDayIndex} />
          </ScrollReveal>
        </section>

        {/* SECTION: WHO IT'S FOR */}
        <section className="py-24 md:py-36 bg-surface-container-low border-b border-primary/5" id="who">
          <div className="max-w-container-max mx-auto px-6 md:px-16 text-center space-y-16">
            <ScrollReveal className="max-w-3xl mx-auto space-y-6">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">Who it's for</span>
              <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-primary leading-tight font-medium font-headline-md">
                Neither of them is in crisis.<br/>
                Neither of them is broken.
              </h2>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto">
                Two kinds of people come to this product. Both grew up in environments where the interior life was not a legitimate subject.
              </p>
            </ScrollReveal>

            {/* Persona Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              <ScrollReveal className="h-full flex" delay={0.1}>
                <div className="bg-white border border-primary/5 rounded-premium overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between w-full text-left">
                  <div className="p-8 space-y-6">
                    <span className="bg-accent/15 text-[#8A4A38] px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block">
                      Self-aware staller
                    </span>
                    <h4 className="font-headline-md text-xl font-bold text-primary leading-snug">
                      Knows something is off.<br/>
                      Has nowhere honest to take it.
                    </h4>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      Self-aware enough to sense the pattern, honest enough to admit something isn't working. Whether they are in therapy or not, journaling feels like shouting into a void. They don't need to be fixed. They need a space that pays attention.
                    </p>
                  </div>
                  <div className="bg-mint-grey/40 border-t border-primary/5 p-6 md:px-8">
                    <p className="font-headline-md text-sm text-primary italic font-medium leading-relaxed">
                      "I know something's wrong. I just don't know what to do with that."
                    </p>
                  </div>
                </div>
              </ScrollReveal>

              <ScrollReveal className="h-full flex" delay={0.2}>
                <div className="bg-white border border-primary/5 rounded-premium overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between w-full text-left">
                  <div className="p-8 space-y-6">
                    <span className="bg-secondary/15 text-[#2A6A60] px-3 py-1.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-block">
                      Quietly accumulating
                    </span>
                    <h4 className="font-headline-md text-xl font-bold text-primary leading-snug">
                      Functional by every measure.<br/>
                      Something is quietly building.
                    </h4>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      Shows up. Manages. By every external measure, fine. But a low hum of dissatisfaction, a recurring situation that never resolves, a feeling they keep calling tiredness because they don't have another word for it.
                    </p>
                  </div>
                  <div className="bg-mint-grey/40 border-t border-primary/5 p-6 md:px-8">
                    <p className="font-headline-md text-sm text-primary italic font-medium leading-relaxed">
                      "I'm fine. I'm just tired. I think."
                    </p>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </section>

        {/* SECTION: OUR APPROACH */}
        <section className="py-24 md:py-36 bg-primary text-on-primary border-t border-white/5 relative overflow-hidden" id="approach">
          {/* Ambient glows */}
          <div className="absolute top-0 right-1/4 w-[300px] h-[300px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-container-max mx-auto px-6 md:px-16 text-center space-y-16 relative z-10">
            <ScrollReveal className="max-w-3xl mx-auto space-y-6">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">Our approach</span>
              <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-white leading-tight font-medium font-headline-md">
                Clarity comes from truth,<br/>
                not comfort.
              </h2>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <p className="font-body-lg text-lg text-white/70 leading-relaxed max-w-xl mx-auto">
                Three things we will never do and why.
              </p>
            </ScrollReveal>

            {/* Approach Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <ScrollReveal className="space-y-4 text-left border-t border-white/10 pt-8 animate-[fadeIn_0.8s_ease-out]" delay={0.1}>
                <h4 className="font-headline-md text-lg font-bold text-white">We don't validate blindly.</h4>
                <p className="font-body-md text-xs text-white/70 leading-relaxed">
                  There is a version of emotional support that agrees with everything and changes nothing. It is comfortable. It is also useless. If you are writing the same entry for the fifth time with different characters, we will name the loop.
                </p>
                <p className="font-headline-md text-xs italic text-[#C8B8E4] font-medium leading-relaxed pt-2">
                  "Not harshly. Not with a diagnosis. Just: this pattern has shown up before."
                </p>
              </ScrollReveal>

              <ScrollReveal className="space-y-4 text-left border-t border-white/10 pt-8 animate-[fadeIn_0.8s_ease-out]" delay={0.2}>
                <h4 className="font-headline-md text-lg font-bold text-white">We don't give solutions.</h4>
                <p className="font-body-md text-xs text-white/70 leading-relaxed">
                  The moment we start telling you what to do, we've removed you from the equation. People don't build self-awareness by following instructions. They build it by sitting with hard questions long enough to find their own answers.
                </p>
                <p className="font-headline-md text-xs italic text-[#C8B8E4] font-medium leading-relaxed pt-2">
                  "Our job is the question, not the answer."
                </p>
              </ScrollReveal>

              <ScrollReveal className="space-y-4 text-left border-t border-white/10 pt-8 animate-[fadeIn_0.8s_ease-out]" delay={0.3}>
                <h4 className="font-headline-md text-lg font-bold text-white">We don't create dependency.</h4>
                <p className="font-body-md text-xs text-white/70 leading-relaxed">
                  This product should make itself progressively less necessary, not more. A person using it for a year should know themselves well enough that they need it less, not feel like they cannot function without checking in.
                </p>
                <p className="font-headline-md text-xs italic text-[#C8B8E4] font-medium leading-relaxed pt-2">
                  "The measure of success is how clearly you see yourself without it."
                </p>
              </ScrollReveal>
            </div>
          </div>
        </section>


        {/* SECTION: EXPERIENCE (MOCK UI BENTO GRID) */}
        <section id="reports" className="py-section-gap px-margin-mobile md:px-margin-desktop bg-surface-container-highest">
          <div className="max-w-container-max mx-auto space-y-16">
            <ScrollReveal className="flex flex-col md:flex-row justify-between items-end gap-6 max-w-2xl">
              <div className="space-y-3">
                <span className="text-[10px] font-label-md text-secondary font-bold uppercase tracking-widest block">FEEDBACK VISUALIZATIONS</span>
                <RevealText>
                  <h2 className="font-headline-lg text-headline-lg text-primary">A Mirror Crafted for You</h2>
                </RevealText>
                <RevealText delay={0.15}>
                  <p className="text-on-surface-variant font-body-lg text-body-lg leading-relaxed">
                    The Ingress Within interface is designed to be invisible, letting your thoughts and patterns take center stage.
                  </p>
                </RevealText>
              </div>
            </ScrollReveal>

            {/* Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
              
              {/* Card 1: Monthly Reflection Synthesis */}
              <ScrollReveal className="md:col-span-8 flex h-full">
                <motion.div 
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white rounded-premium p-8 md:p-10 border border-primary/5 tonal-layer-1 flex flex-col justify-between relative overflow-hidden group cursor-pointer"
                >
                  <div className="flex justify-between items-center mb-8">
                    <h5 className="font-headline-md text-headline-md text-primary">Monthly Reflection Synthesis</h5>
                    <span className="font-label-md text-[10px] text-on-surface-variant uppercase tracking-widest font-bold">Oct 2026 — Dec 2026</span>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Visual Chart Bars */}
                    <div className="h-44 w-full bg-surface-container rounded-xl flex items-end justify-between p-6 gap-3">
                      <motion.div 
                        className="w-full bg-secondary rounded-t-lg"
                        initial={{ height: 0 }}
                        whileInView={{ height: '40%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                      <motion.div 
                        className="w-full bg-primary rounded-t-lg"
                        initial={{ height: 0 }}
                        whileInView={{ height: '70%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
                      />
                      <motion.div 
                        className="w-full bg-secondary rounded-t-lg"
                        initial={{ height: 0 }}
                        whileInView={{ height: '55%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: 'easeOut' }}
                      />
                      <motion.div 
                        className="w-full bg-accent rounded-t-lg"
                        initial={{ height: 0 }}
                        whileInView={{ height: '85%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                      />
                      <motion.div 
                        className="w-full bg-secondary rounded-t-lg"
                        initial={{ height: 0 }}
                        whileInView={{ height: '60%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.4, ease: 'easeOut' }}
                      />
                      <motion.div 
                        className="w-full bg-primary rounded-t-lg"
                        initial={{ height: 0 }}
                        whileInView={{ height: '45%' }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-surface-container rounded-xl border border-primary/5">
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-label-md block mb-1">Core Theme</span>
                        <p className="font-headline-md text-base font-bold text-primary">Creative Autonomy</p>
                      </div>
                      <div className="p-4 bg-surface-container rounded-xl border border-primary/5">
                        <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold font-label-md block mb-1">Primary Emotion</span>
                        <p className="font-headline-md text-base font-bold text-primary">Active Serenity</p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </ScrollReveal>

              {/* Card 2: Journal Entry Preview */}
              <ScrollReveal className="md:col-span-4 flex h-full" delay={0.15}>
                <motion.div 
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-primary text-on-primary rounded-premium p-8 md:p-10 shadow-2xl flex flex-col justify-between min-h-[360px] relative overflow-hidden group cursor-pointer"
                >
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-8 text-secondary">
                    <span className="material-symbols-outlined text-2xl">history_edu</span>
                  </div>
                  <div>
                    <h5 className="font-headline-md mb-4 leading-snug">Journal Entry: 14th Nov</h5>
                    <p className="font-body-md text-white/80 italic font-light leading-relaxed mb-8">
                      "The noise of the city felt different today. Not a distraction, but a texture. I am finding space between my thoughts..."
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      scrollToSection('experience');
                      setActiveDayIndex(1);
                    }}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 transition-all rounded-xl font-label-md tracking-wider uppercase text-[11px] font-semibold cursor-pointer text-center"
                  >
                    Read Analysis
                  </button>
                </motion.div>
              </ScrollReveal>

              {/* Card 3: Consistency Score Circle */}
              <ScrollReveal className="md:col-span-4 flex h-full" delay={0.15}>
                <motion.div 
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white rounded-premium p-8 border border-primary/5 tonal-layer-1 flex flex-col items-center justify-center text-center gap-6 min-h-[300px] cursor-pointer"
                >
                  <div className="w-24 h-24 relative flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#ECEFF0" strokeWidth="6" fill="transparent" />
                      <motion.circle 
                        cx="48" cy="48" r="40" stroke="#8DBFB4" strokeWidth="6" fill="transparent" 
                        strokeDasharray="251.2"
                        initial={{ strokeDashoffset: 251.2 }}
                        whileInView={{ strokeDashoffset: 251.2 - (251.2 * 78) / 100 }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                      />
                    </svg>
                    <span className="absolute font-headline-md text-2xl font-bold text-primary">78%</span>
                  </div>
                  <div>
                    <h5 className="font-headline-md text-primary mb-2 font-label-md">Consistency Score</h5>
                    <p className="font-body-md text-sm text-on-surface-variant">
                      You've reflected 22 days this month. Your awareness is deepening.
                    </p>
                  </div>
                </motion.div>
              </ScrollReveal>

              {/* Card 4: Weekly Summary Card */}
              <ScrollReveal className="md:col-span-8 flex h-full" delay={0.3}>
                <motion.div 
                  whileHover={{ y: -8, scale: 1.01 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full bg-white rounded-premium p-8 border border-primary/5 tonal-layer-1 flex flex-col sm:flex-row items-center gap-8 min-h-[300px] justify-between cursor-pointer"
                >
                  <div 
                    className="w-full sm:w-44 h-44 rounded-2xl flex-shrink-0 bg-cover bg-center shadow-sm border border-primary/5"
                    style={{ 
                      backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBQcdo1bAukmfVHSDACcX3yaKlNFciSVzFQA0Ha8av80Zo7N5GfRnL-TgrffuCKLCCAqCPrVI5cUziEBTp2OpzioHAOVL62mWk2MqsNDRqsbAjC89El_OOG1ke4vvTeQBwFCkjpxOW191i5rnHUbLbH5wA90Z3Ltex4IMkrtPrd9xCFEqQ2IyPGwrcAjyLWCUcxV2HufEXYETWTZtUhDvUEmcAkdWjtYLegbilLENfd1aEVoLN2cqNh6CQHo44JwjwTCkoz3mEGMKI')` 
                    }}
                  />
                  <div className="flex-grow flex-1 space-y-4 text-center sm:text-left">
                    <span className="text-[10px] font-label-md text-primary font-bold uppercase tracking-widest px-3 py-1 bg-accent rounded-full inline-block">UPDATE READY</span>
                    <h5 className="font-headline-md text-xl font-medium text-primary">Weekly Summary Ready</h5>
                    <p className="font-body-md text-xs text-on-surface-variant leading-relaxed">
                      Your emotional landscape shifted toward "Productive Focus" this week. Would you like to explore what routine shifts caused this increase?
                    </p>
                    <button 
                      onClick={() => {
                        scrollToSection('experience');
                        setActiveDayIndex(3);
                      }}
                      className="bg-secondary text-white font-label-md text-xs font-bold tracking-wider uppercase py-3 px-8 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      Review Now
                    </button>
                  </div>
                </motion.div>
              </ScrollReveal>

            </div>
          </div>
        </section>

        {/* SECTION: SYNTHESIS ENGINE (LIVE INTERACTIVE PARSER) */}
        <section className="py-32 px-margin-mobile md:px-margin-desktop relative overflow-hidden engine-dark-bg text-white border-t border-b border-white/5">
          {/* Ambient Glows */}
          <div className="absolute -top-40 -left-40 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[140px] pointer-events-none" />
          <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[140px] pointer-events-none" />
          
          <div className="max-w-container-max mx-auto flex flex-col lg:flex-row gap-20 items-center relative z-10">
            
            {/* Left Column: Live Parser Editor */}
            <ScrollReveal className="flex-1 space-y-8 text-left w-full">
              <div className="space-y-4">
                <span className="text-[10px] font-label-md text-secondary font-bold uppercase tracking-[0.25em] block">SYNTHESIS ENGINE</span>
                <RevealText>
                  <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-5xl text-white leading-tight font-light">
                    Your daily words are the paint.<br/>
                    <span className="italic font-normal text-secondary font-headline-lg">Self-awareness is the portrait.</span>
                  </h2>
                </RevealText>
                <RevealText delay={0.1}>
                  <p className="font-body-lg text-body-lg text-white/70 leading-relaxed max-w-xl">
                    Our semantic analysis engine processes natural thought streams in real-time. Type an entry below to see how Ingress Within maps your cognitive patterns.
                  </p>
                </RevealText>
              </div>

              {/* Live Text Area Card */}
              <div className="bg-white/[0.02] border border-white/10 rounded-premium p-6 md:p-8 space-y-6 shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-xl">
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs font-semibold text-white/60">
                    <span>Simulated Journal Input</span>
                    <span className="text-secondary font-bold tracking-wide flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                      Linguistic Parser: ACTIVE
                    </span>
                  </div>
                  <textarea
                    value={parserText}
                    onChange={(e) => setParserText(e.target.value)}
                    placeholder="Woke up feeling rather sluggish today..."
                    className="w-full min-h-[130px] bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm font-headline-md leading-relaxed text-white placeholder-white/30 focus:outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all resize-none shadow-inner"
                  />
                </div>

                {/* Quick Prompts */}
                <div className="space-y-3">
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-bold block">Quick Prompts</span>
                  <div className="flex flex-wrap gap-2.5">
                    {[
                      { label: "Work Stress", text: "I keep having the same argument with my manager and I don't know if it's me or them." },
                      { label: "Avoidance", text: "I said yes again when I wanted to say no. I don't know why I keep doing this." },
                      { label: "Vague Offness", text: "Everything is fine on paper. I just feel like something is quietly off." },
                      { label: "Fatigue", text: "I've been calling it tiredness for months now. Maybe it's something else." }
                    ].map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => setParserText(p.text)}
                        className="px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border border-white/10 bg-white/5 text-white/70 hover:text-white hover:border-white/30 hover:bg-white/10 cursor-pointer"
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Analysis Indicators */}
                {(() => {
                  const analysis = analyzeText(parserText);
                  return (
                    <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6 text-xs font-semibold">
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-1.5 text-left hover:bg-white/[0.04] transition-all">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Core Theme</span>
                        <p className="font-headline-md text-sm font-bold text-white">{analysis.coreTheme}</p>
                      </div>
                      <div className="p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-1.5 text-left hover:bg-white/[0.04] transition-all">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Primary Emotion</span>
                        <p className="font-headline-md text-sm font-bold text-secondary">{analysis.primaryEmotion}</p>
                      </div>
                      <div className="col-span-2 p-4 bg-white/[0.02] rounded-xl border border-white/5 space-y-1.5 text-left hover:bg-white/[0.04] transition-all">
                        <span className="text-[9px] uppercase tracking-widest text-white/40 font-bold block">Cognitive Distortions Flagged</span>
                        <p className={`font-headline-md text-sm font-bold ${analysis.distortions !== "None Detected" ? 'text-accent' : 'text-white'}`}>{analysis.distortions}</p>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </ScrollReveal>

            {/* Right Column: Concentric Visualizer Panel */}
            {(() => {
              const analysis = analyzeText(parserText);
              
              // Determine active states for individual nodes based on analysis
              const isSyntaxActive = parserText.trim().length > 15;
              const isSentimentActive = analysis.primaryEmotion !== "Neutral Attention" && parserText.trim().length > 0;
              const isCbtActive = analysis.distortions !== "None Detected" && parserText.trim().length > 0;
              const isBiometricsActive = (analysis.coreTheme === "Morning Clarity" || parserText.includes("silence") || parserText.includes("intentions") || parserText.includes("routine")) && parserText.trim().length > 0;
              
              return (
                <ScrollReveal className="flex-1 w-full flex flex-col items-center justify-center relative min-h-[460px] gap-8" delay={0.25}>
                  {/* Digital circular dashboard frame */}
                  <div className="relative w-80 h-80 flex items-center justify-center bg-white/[0.02] rounded-full border border-white/5 shadow-inner">
                    
                    {/* Concentric rotating grids */}
                    <div className="absolute inset-0 border border-dashed border-secondary/15 rounded-full animate-spin-slow" />
                    <div className="absolute top-[8%] left-[8%] right-[8%] bottom-[8%] border border-dashed border-accent/20 rounded-full animate-spin-slow-reverse" />
                    <div className="absolute top-[18%] left-[18%] right-[18%] bottom-[18%] border border-dashed border-white/10 rounded-full animate-spin-slow" />

                    {/* Connecting Constellation Lines */}
                    <svg className="absolute w-80 h-80 pointer-events-none overflow-visible z-10" viewBox="-160 -160 320 320">
                      <defs>
                        <linearGradient id="glow-linguistic" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#8DBFB4" stopOpacity="1" />
                          <stop offset="100%" stopColor="#8DBFB4" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="glow-psychometric" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#E0A898" stopOpacity="1" />
                          <stop offset="100%" stopColor="#E0A898" stopOpacity="0.1" />
                        </linearGradient>
                        <filter id="svgGlow" x="-30%" y="-30%" width="160%" height="160%">
                          <feGaussianBlur stdDeviation="5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      <circle cx="0" cy="0" r="124" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="1" />
                      <circle cx="0" cy="0" r="96" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="1" />
                      <circle cx="0" cy="0" r="64" fill="none" stroke="currentColor" className="text-white/5" strokeWidth="1" />

                      {ENGINE_NODES.map((node) => {
                        const radius = node.ring === 'outer' ? 124 : node.ring === 'middle' ? 96 : 64;
                        const radAngle = (node.angle * Math.PI) / 180;
                        const x = Math.cos(radAngle) * radius;
                        const y = Math.sin(radAngle) * radius;
                        
                        const isNodeActive = activeEngineNode && activeEngineNode.id === node.id;
                        
                        let isHighlighted = isNodeActive;
                        if (node.id === 'syntax') isHighlighted = isHighlighted || isSyntaxActive;
                        if (node.id === 'sentiment') isHighlighted = isHighlighted || isSentimentActive;
                        if (node.id === 'cbt') isHighlighted = isHighlighted || isCbtActive;
                        if (node.id === 'biometrics') isHighlighted = isHighlighted || isBiometricsActive;

                        const lineColor = node.category === 'linguistic' ? 'url(#glow-linguistic)' : 'url(#glow-psychometric)';
                        const laserPulseClass = node.category === 'linguistic' ? 'animate-laser-pulse-linguistic' : 'animate-laser-pulse-psychometric';

                        return (
                          <React.Fragment key={node.id}>
                            {/* Base Connection line (subtle) */}
                            <line
                              x1="0" y1="0"
                              x2={x}
                              y2={y}
                              stroke="currentColor"
                              className={`transition-all duration-500 ${isHighlighted ? 'text-white/20 stroke-[1.5]' : 'text-white/5 stroke-[1]'}`}
                              strokeDasharray="4, 4"
                            />

                            {/* Active connection neon line */}
                            <AnimatePresence>
                              {isHighlighted && (
                                <motion.line
                                  x1="0" y1="0"
                                  x2={x}
                                  y2={y}
                                  stroke={lineColor}
                                  strokeWidth="2.5"
                                  filter="url(#svgGlow)"
                                  initial={{ pathLength: 0 }}
                                  animate={{ pathLength: 1 }}
                                  exit={{ pathLength: 0 }}
                                  transition={{ duration: 0.5, ease: 'easeOut' }}
                                  strokeDasharray="8, 4"
                                  className={laserPulseClass}
                                />
                              )}
                            </AnimatePresence>
                          </React.Fragment>
                        );
                      })}
                    </svg>

                    {/* Central Engine Node showing live score */}
                    <div className="w-20 h-20 bg-[#091519] text-white rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(141,191,180,0.15)] z-20 border border-white/10 flex-col relative">
                      <div className="absolute -inset-2 rounded-full bg-secondary/5 animate-pulse" />
                      <div className="absolute -inset-4 rounded-full bg-secondary/5 animate-ping opacity-30 pointer-events-none" />
                      <div className="absolute -inset-1.5 rounded-full border border-dashed border-secondary/20 animate-[spin_10s_linear_infinite]" />
                      
                      <span className="text-[16px] font-bold text-secondary leading-none">{analysis.clarityScore}%</span>
                      <span className="text-[7px] font-label-md font-bold tracking-widest uppercase mt-1 text-white/50">Clarity</span>
                    </div>

                    {/* Variable Nodes */}
                    {ENGINE_NODES.map((node) => {
                      const radius = node.ring === 'outer' ? 124 : node.ring === 'middle' ? 96 : 64;
                      const radAngle = (node.angle * Math.PI) / 180;
                      const x = Math.cos(radAngle) * radius;
                      const y = Math.sin(radAngle) * radius;
                      
                      const isNodeActive = activeEngineNode && activeEngineNode.id === node.id;
                      
                      let isHighlighted = isNodeActive;
                      if (node.id === 'syntax') isHighlighted = isHighlighted || isSyntaxActive;
                      if (node.id === 'sentiment') isHighlighted = isHighlighted || isSentimentActive;
                      if (node.id === 'cbt') isHighlighted = isHighlighted || isCbtActive;
                      if (node.id === 'biometrics') isHighlighted = isHighlighted || isBiometricsActive;

                      const dotColorClass = node.category === 'linguistic' ? 'bg-secondary' : 'bg-accent';
                      
                      return (
                        <motion.button
                          key={node.id}
                          onMouseEnter={() => setActiveEngineNode(node)}
                          onMouseLeave={() => setActiveEngineNode(null)}
                          className={`absolute px-3 py-2 bg-white/5 backdrop-blur-md rounded-xl shadow-lg border transition-all duration-300 cursor-pointer z-30 flex items-center gap-2 select-none ${
                            isHighlighted 
                              ? node.category === 'linguistic' 
                                ? 'border-secondary scale-110 shadow-[0_0_15px_rgba(141,191,180,0.35)] bg-white/10'
                                : 'border-accent scale-110 shadow-[0_0_15px_rgba(224,168,152,0.35)] bg-white/10'
                              : 'border-white/10 hover:border-white/20 hover:scale-105'
                          }`}
                          style={{
                            transform: `translate(${x}px, ${y}px)`,
                          }}
                        >
                          <span className={`w-2 h-2 rounded-full ${dotColorClass} ${isHighlighted ? 'animate-pulse' : ''}`} />
                          <span className={`text-[9px] font-label-md font-bold uppercase tracking-wider transition-colors duration-300 ${
                            isHighlighted ? 'text-white' : 'text-white/60'
                          }`}>
                            {node.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* Info Panel */}
                  <div className="h-16 w-full text-center max-w-sm px-6 relative z-20">
                    <AnimatePresence mode="wait">
                      {activeEngineNode ? (
                        <motion.div
                          key={activeEngineNode.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -5 }}
                          transition={{ duration: 0.2 }}
                          className="bg-[#0A1214]/85 border border-white/10 backdrop-blur-md rounded-xl p-3.5 shadow-xl text-xs font-body-md leading-relaxed text-white/70"
                        >
                          <span className="font-bold text-white block text-[10px] uppercase tracking-wider mb-0.5">{activeEngineNode.label}</span>
                          {activeEngineNode.detail}
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="default-prompt"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 0.8 }}
                          className="text-xs text-white/40 font-semibold text-center italic"
                        >
                          Hover over any parameters or start typing in the journal input to trigger real-time semantic analysis.
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </ScrollReveal>
              );
            })()}
          </div>
        </section>

        {/* SECTION: PRICING (INVEST IN YOUR AWARENESS) */}
        <section id="pricing" className="py-24 md:py-36 max-w-container-max mx-auto px-6 md:px-16 text-center space-y-16">
          <div className="text-center space-y-4 max-w-3xl mx-auto">
            <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">Simple pricing</span>
            <RevealText>
              <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-primary leading-tight font-medium font-headline-md">
                Start free. Continue only<br/>
                if it's honest enough to.
              </h2>
            </RevealText>
            <div className="w-16 h-[1px] bg-accent mx-auto" />
            <RevealText delay={0.15}>
              <p className="font-body-lg text-lg text-on-surface-variant leading-relaxed">
                We don't ask for commitment before we've earned it. The first seven days are free.
              </p>
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto items-stretch">
            {/* Plan 1: First 7 days */}
            <ScrollReveal className="h-full flex" delay={0.1}>
              <div className="bg-white border border-primary/5 rounded-premium p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all w-full text-left">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.25em] block">First 7 days</span>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="font-headline-lg text-4xl font-bold text-primary font-headline-md">Free</span>
                    </div>
                    <p className="font-body-md text-xs text-primary/50 pt-2 font-bold uppercase tracking-wider">No card required</p>
                  </div>
                  <div className="h-[1px] bg-primary/5" />
                  <ul className="space-y-3 text-xs font-body-md text-on-surface-variant leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Full access, no restrictions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>One entry a day with AI reflection</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Pattern tracking begins</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>If it's not honest enough, stop</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => scrollToSection('auth')}
                  className="w-full bg-white hover:bg-primary hover:text-white border border-primary/15 hover:border-primary hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-8 transition-all shadow-xs cursor-pointer duration-300"
                >
                  Start free &rarr;
                </button>
              </div>
            </ScrollReveal>

            {/* Plan 2: Founding Discount (Featured) */}
            <ScrollReveal className="h-full flex" delay={0.2}>
              <div className="bg-primary text-on-primary border border-primary rounded-premium p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden pricing-glow w-full text-left">
                <div className="absolute top-4 right-4 bg-accent text-primary px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-[0.1em]">
                  Founding 50 only
                </div>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-[0.25em] block">Launch discount</span>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="font-headline-lg text-4xl font-bold font-headline-md text-white">₹799</span>
                      <span className="text-xs opacity-50 font-label-md">/ month</span>
                    </div>
                    <p className="font-body-md text-xs text-white/50 pt-2 font-bold uppercase tracking-wider">for a limited time</p>
                    <p className="text-[11px] text-accent/80 line-through mt-1">Then ₹999 / month, locked for you forever</p>
                  </div>
                  <div className="h-[1px] bg-white/10" />
                  <ul className="space-y-3 text-xs font-body-md opacity-90 leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>One entry a day, every day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Full pattern tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Cycle summary reports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>₹799 locked for you, even if price rises</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => scrollToSection('auth')}
                  className="w-full bg-accent hover:opacity-95 hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-8 transition-all shadow-md cursor-pointer duration-300"
                >
                  Get early access &rarr;
                </button>
              </div>
            </ScrollReveal>

            {/* Plan 3: Standard */}
            <ScrollReveal className="h-full flex" delay={0.3}>
              <div className="bg-white border border-primary/5 rounded-premium p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition-all w-full text-left">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.25em] block">Standard</span>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="font-headline-lg text-4xl font-bold text-primary font-headline-md">₹999</span>
                      <span className="text-xs text-primary/50 font-label-md">/ month</span>
                    </div>
                    <p className="font-body-md text-xs text-primary/50 pt-2 font-bold uppercase tracking-wider">Price may increase as costs grow</p>
                  </div>
                  <div className="h-[1px] bg-primary/5" />
                  <ul className="space-y-3 text-xs font-body-md text-on-surface-variant leading-relaxed">
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>One entry a day, every day</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Full pattern tracking</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Cycle summary reports</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-accent mt-0.5">→</span>
                      <span>Cancel any time</span>
                    </li>
                  </ul>
                </div>
                <button 
                  onClick={() => scrollToSection('auth')}
                  className="w-full bg-white hover:bg-primary hover:text-white border border-primary/15 hover:border-primary hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-8 transition-all shadow-xs cursor-pointer duration-300"
                >
                  Get started &rarr;
                </button>
              </div>
            </ScrollReveal>
          </div>

          <ScrollReveal className="text-center font-body-md text-sm text-primary/50 max-w-xl mx-auto pt-6 leading-relaxed">
            <strong>Add-ons coming soon</strong> &mdash; therapy reports, group reflection sessions, and therapist referrals. Early users get first access.
          </ScrollReveal>

          <ScrollReveal className="text-center pt-8" delay={0.1}>
            <button 
              onClick={() => window.location.hash = '#/pricing'} 
              className="font-label-md text-xs font-bold tracking-wider text-secondary border-b-[1.5px] border-secondary hover:pb-1 hover:text-primary hover:border-primary transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              Compare plans &amp; view founding member details &rarr;
            </button>
          </ScrollReveal>
        </section>

        {/* SECTION: FAQ */}
        <section id="faq" className="py-section-gap px-margin-mobile md:px-margin-desktop bg-white border-t border-b border-primary/5">
          <ScrollReveal className="max-w-3xl mx-auto space-y-12">
            <div className="text-center space-y-3">
              <RevealText>
                <h2 className="font-headline-lg text-headline-lg text-primary">Frequent Enquiries</h2>
              </RevealText>
            </div>
            
            <FaqAccordion />

            <div className="text-center pt-8">
              <span className="font-body-md text-xs text-primary/50 block">Have other questions regarding security or methods?</span>
              <button 
                onClick={() => window.location.hash = '#/faq'}
                className="font-label-md text-xs font-bold tracking-wider text-secondary border-b-[1.5px] border-secondary hover:pb-1 hover:text-primary hover:border-primary transition-all mt-2 cursor-pointer inline-flex items-center gap-1.5"
              >
                View dedicated FAQ page &rarr;
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION: AUTH */}
        <section className="py-24 md:py-36 bg-primary text-on-primary border-t border-white/5 relative overflow-hidden text-center" id="auth">
          {/* Ambient background glows */}
          <div className="absolute top-0 left-1/4 w-[350px] h-[350px] bg-secondary/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />

          <div className="max-w-container-max mx-auto px-6 relative z-10 space-y-12">
            <ScrollReveal className="max-w-3xl mx-auto space-y-4">
              <span className="font-label-md text-xs font-semibold text-secondary uppercase tracking-[0.14em] block">Begin</span>
              <RevealText>
                <h2 className="font-display-lg-mobile md:font-display-lg text-[36px] md:text-[54px] text-white leading-tight font-medium font-headline-md">
                  Start where<br/>
                  clarity begins.
                </h2>
              </RevealText>
              <div className="w-16 h-[1px] bg-accent mx-auto" />
              <RevealText delay={0.15}>
                <p className="font-body-lg text-lg text-white/70 leading-relaxed max-w-xl mx-auto">
                  Seven days free. No card needed. Write without editing yourself — or don't bother.
                </p>
              </RevealText>
            </ScrollReveal>

            {/* Auth Box */}
            <ScrollReveal className="max-w-[400px] mx-auto" delay={0.3}>
              <div className="bg-white/[0.03] border border-white/10 rounded-premium p-8 shadow-2xl backdrop-blur-md text-left space-y-6">
                <div className="flex rounded-lg overflow-hidden border border-white/15">
                  <button 
                    onClick={() => setAuthTab('signin')}
                    className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                      authTab === 'signin' 
                        ? 'bg-accent text-primary font-bold' 
                        : 'bg-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    Sign in
                  </button>
                  <button 
                    onClick={() => setAuthTab('signup')}
                    className={`flex-1 py-3 text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                      authTab === 'signup' 
                        ? 'bg-accent text-primary font-bold' 
                        : 'bg-transparent text-white/70 hover:text-white'
                    }`}
                  >
                    Create account
                  </button>
                </div>

                <div className="space-y-4 pt-2">
                  <AnimatePresence mode="wait">
                    {authTab === 'signup' && (
                      <motion.div
                        key="signup-name"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <input 
                          type="text" 
                          placeholder="Your name" 
                          className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <input 
                    type="email" 
                    placeholder="Email address" 
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                  />
                  <input 
                    type="password" 
                    placeholder="Password" 
                    className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3.5 text-sm text-white placeholder-white/30 outline-none focus:border-secondary focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                  />

                  <button className="w-full bg-accent hover:opacity-95 text-primary py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-md cursor-pointer mt-2">
                    {authTab === 'signin' ? 'Sign in \u2192' : 'Create account \u2192'}
                  </button>
                </div>

                <div className="flex items-center gap-4 text-white/20">
                  <div className="h-[1px] bg-white/10 flex-grow" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">or</span>
                  <div className="h-[1px] bg-white/10 flex-grow" />
                </div>

                <button className="w-full bg-transparent hover:bg-white/5 border border-white/15 hover:border-white/30 text-white py-3.5 rounded-xl text-xs font-bold tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.6 2.42v2h2.6c1.52-1.4 2.38-3.46 2.38-5.88z" fill="#4285F4"/><path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.32H.8v2.06A8 8 0 0 0 8 16z" fill="#34A853"/><path d="M3.48 9.49A4.83 4.83 0 0 1 3.23 8c0-.52.09-1.02.25-1.49V4.45H.8A8 8 0 0 0 0 8c0 1.29.31 2.51.8 3.55l2.68-2.06z" fill="#FBBC05"/><path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A7.97 7.97 0 0 0 8 0 8 8 0 0 0 .8 4.45l2.68 2.06A4.8 4.8 0 0 1 8 3.18z" fill="#EA4335"/></svg>
                  Continue with Google
                </button>

                <p className="text-xs text-white/50 text-center font-medium leading-relaxed font-body">
                  {authTab === 'signin' ? (
                    <>
                      Don't have an account?{' '}
                      <button onClick={() => setAuthTab('signup')} className="text-accent hover:underline font-bold bg-transparent border-none p-0 cursor-pointer">
                        Create one free
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{' '}
                      <button onClick={() => setAuthTab('signin')} className="text-accent hover:underline font-bold bg-transparent border-none p-0 cursor-pointer">
                        Sign in
                      </button>
                    </>
                  )}
                </p>
              </div>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-surface border-t border-outline-variant/35 w-full py-20 px-6 md:px-16">
        <div className="max-w-container-max mx-auto grid grid-cols-1 md:grid-cols-5 gap-8 mb-16 text-left">
          {/* Column 1: Brand details */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center gap-2">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="2" fill="currentColor"/>
                <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary"/>
                <circle cx="16" cy="16" r="10" stroke="currentColor" strokeWidth="0.9" fill="none" opacity="0.65" className="text-secondary"/>
                <circle cx="16" cy="16" r="14" stroke="currentColor" strokeWidth="0.6" fill="none" opacity="0.35" className="text-secondary"/>
              </svg>
              <div className="flex flex-col">
                <span className="font-headline-md text-lg font-bold tracking-tight text-primary leading-none">
                  ingress <span className="font-normal text-secondary italic font-headline-md">within</span>
                </span>
                <span className="text-[9px] font-label-md tracking-[0.12em] uppercase text-primary/45 mt-0.5 leading-none font-bold">
                  The way within
                </span>
              </div>
            </div>
            <p className="text-on-surface-variant font-body-md text-xs leading-relaxed pr-8 italic opacity-85">
              A space to process what you are carrying — before therapy, during it, after it, or entirely on your own.
            </p>
          </div>

          {/* Column 2: Product */}
          <div>
            <h6 className="font-label-md text-[11px] font-bold tracking-[0.2em] text-primary mb-8 uppercase">Product</h6>
            <ul className="space-y-4">
              <li><button onClick={() => scrollToSection('what')} className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold">What it is</button></li>
              <li><button onClick={() => scrollToSection('how')} className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold">How it works</button></li>
              <li><a href="#/pricing" className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold block">Pricing</a></li>
              <li><a href="#/faq" className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold block">FAQ</a></li>
              <li><button onClick={() => scrollToSection('auth')} className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold">Start writing</button></li>
            </ul>
          </div>

          {/* Column 3: Company */}
          <div>
            <h6 className="font-label-md text-[11px] font-bold tracking-[0.2em] text-primary mb-8 uppercase">Company</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold animate-[fadeIn_0.5s_ease]" href="#">About</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Blog</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Contact us</a></li>
            </ul>
          </div>

          {/* Column 4: Legal */}
          <div>
            <h6 className="font-label-md text-[11px] font-bold tracking-[0.2em] text-primary mb-8 uppercase">Legal</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Privacy policy</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Terms of use</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Cookie policy</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Data &amp; security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-container-max mx-auto px-4 pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-label-md">
          <span className="text-on-surface-variant font-medium">© 2025 Ingress Within. All rights reserved.</span>
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Privacy policy</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Terms</a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
