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
  
  // Parallax positions for Hero Portal Particles
  const heroRef = useRef(null);
  const [heroMousePos, setHeroMousePos] = useState({ x: 0, y: 0 });
  const [activeEngineNode, setActiveEngineNode] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [parserText, setParserText] = useState("Woke up feeling rather sluggish today, but I sat in silence for 10 minutes and logged my intentions. My mind cleared rapidly and I feel ready to focus on code optimization.");

  const analyzeText = (text) => {
    const lower = text.toLowerCase();
    let stressCount = 0;
    let clarityCount = 0;
    let distortions = [];
    
    // Keywords for stress
    if (lower.includes("anxious") || lower.includes("worry") || lower.includes("worried") || lower.includes("stress") || lower.includes("sluggish") || lower.includes("overwhelmed")) {
      stressCount += 2;
    }
    if (lower.includes("fail") || lower.includes("failure") || lower.includes("mistake") || lower.includes("bad")) {
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
    if (lower.includes("angry") || lower.includes("thinks") || lower.includes("judged")) {
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
    if (lower.includes("work") || lower.includes("meeting") || lower.includes("job") || lower.includes("client")) coreTheme = "Workplace Friction";
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

  // Concentric ring visualizer data
  const ENGINE_NODES = [
    { id: 'syntax', label: 'Syntax Analysis', ring: 'outer', angle: 45, category: 'linguistic', detail: 'Analyzes sentence structure, word frequencies, and punctuation patterns.' },
    { id: 'sentiment', label: 'Sentiment Mapping', ring: 'middle', angle: 160, category: 'linguistic', detail: 'Tracks emotional fluctuations, identifying patterns of anxiety, joy, or focus.' },
    { id: 'cbt', label: 'CBT Distortions', ring: 'inner', angle: 280, category: 'psychometric', detail: 'Flags automatic negative thoughts like black-and-white thinking or catastrophizing.' },
    { id: 'biometrics', label: 'Activity Correlation', ring: 'outer', angle: 220, category: 'psychometric', detail: 'Connects journaling consistency and check-in times to your focus parameters.' }
  ];

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
              className="flex items-center transition-opacity hover:opacity-85 focus:outline-none cursor-pointer"
            >
              <img 
                alt="Ingress Within Logo" 
                className="h-9 w-auto object-contain" 
                src="https://lh3.googleusercontent.com/aida/AP1WRLskWM2xaCsDzsE-u53axLTls4PCEfzg3RysGEkIBFTPwoIFIqQR12qM1blKxnkYtuFIILhbt-1Lf0MpCYvqOGuYTeWRI6BYmLDCYwszmoErUzx-3Eh9tZBMXBpVL7ngbAaHDPIgxDP1lE1X9ba91jgu2XiKANWDr54nW8mq1qgYf8jKc2YNsXpKevKi64ogySNY5uXt9BaofNIlFa-yfj1X8LL2hkRb2k-7_m1iJTwIXcdJ8DnQnrMLMJk"
              />
            </button>
            
            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex gap-8 items-center">
              <button onClick={() => scrollToSection('experience')} className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md tracking-wide font-bold cursor-pointer">30-Day Path</button>
              <button onClick={() => scrollToSection('reports')} className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md tracking-wide font-bold cursor-pointer">Reports</button>
              <button onClick={() => scrollToSection('pricing')} className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md tracking-wide font-bold cursor-pointer">Pricing</button>
            </div>
          </div>

          {/* Desktop CTA */}
          <button 
            onClick={() => scrollToSection('pricing')}
            className="hidden lg:block bg-primary text-on-primary px-7 py-3 rounded-full font-label-md text-label-md tracking-wider uppercase text-[11px] hover:bg-primary/95 hover:shadow-lg transition-all duration-300 cursor-pointer"
          >
            Begin Journey
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
              className="absolute top-0 left-0 w-full bg-background border-b border-primary/10 p-8 pt-24 flex flex-col gap-6 shadow-xl lg:hidden z-40"
            >
              <button onClick={() => scrollToSection('experience')} className="text-left font-label-md text-sm uppercase tracking-widest font-bold text-primary/70 py-1">30-Day Path</button>
              <button onClick={() => scrollToSection('reports')} className="text-left font-label-md text-sm uppercase tracking-widest font-bold text-primary/70 py-1">Reports</button>
              <button onClick={() => scrollToSection('pricing')} className="text-left font-label-md text-sm uppercase tracking-widest font-bold text-primary/70 py-1">Pricing</button>
              <button 
                onClick={() => scrollToSection('pricing')}
                className="w-full bg-primary text-white font-label-md text-xs uppercase tracking-widest font-bold py-4 rounded-xl text-center mt-4 shadow-sm"
              >
                Begin Your First Cycle
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

                <RevealText>
                  <h1 className="font-display-lg-mobile md:font-display-lg text-[48px] md:text-[68px] text-primary leading-[1.05] tracking-tight">
                    Understand Your Mind.<br/>
                    <span className="italic font-normal text-secondary font-headline-lg">Track Your Progress.</span>
                  </h1>
                </RevealText>
                
                <RevealText delay={0.2}>
                  <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-xl mx-auto lg:mx-0">
                    A structured journal for intentional self-discovery. Combine daily reflection with clinical-grade psychometrics to reveal the patterns that define your journey.
                  </p>
                </RevealText>
              </div>
              
              <RevealText delay={0.4}>
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                    <button 
                      onClick={() => scrollToSection('pricing')}
                      className="bg-primary text-on-primary px-12 py-5 rounded-xl font-label-md text-label-md hover:scale-[1.03] hover:bg-primary/95 active:scale-95 transition-all shadow-xl cursor-pointer font-bold"
                    >
                      Start Your Journey
                    </button>
                    <button 
                      onClick={() => scrollToSection('experience')}
                      className="border border-outline text-primary px-12 py-5 rounded-xl font-label-md text-label-md hover:bg-white hover:scale-[1.03] transition-all cursor-pointer bg-white/50 font-bold"
                    >
                      Learn More
                    </button>
                  </div>
                  
                  <div className="flex flex-wrap justify-center lg:justify-start gap-x-6 gap-y-2 text-[10px] font-label-md text-primary/50 uppercase tracking-widest font-semibold">
                    <span className="flex items-center gap-1.5"><Check size={12} className="text-secondary" /> 100% Private & Encrypted</span>
                    <span className="flex items-center gap-1.5"><Check size={12} className="text-secondary" /> CBT-Based Analytics</span>
                    <span className="flex items-center gap-1.5"><Check size={12} className="text-secondary" /> No Card Required</span>
                  </div>
                </div>
              </RevealText>

              {/* Divider */}
              <div className="h-[1px] bg-primary/10 w-full" />

              {/* Mini Features Grid to fill left column space */}
              <RevealText delay={0.5}>
                <div className="grid grid-cols-3 gap-6 pt-2 text-left animate-[fadeIn_1s_ease-out]">
                  <div className="space-y-2">
                    <span className="font-headline-md text-base md:text-lg italic text-secondary block font-bold">01 / Journal</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Capture daily logs with semantic keyword highlights.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-headline-md text-base md:text-lg italic text-accent block font-bold">02 / Exercise</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Complete guided CBT reframing tasks in real-time.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <span className="font-headline-md text-base md:text-lg italic text-secondary block font-bold">03 / Report</span>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Synthesize weekly progress charts automatically.
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
                  className="w-full bg-[#FDFDFD] border border-primary/5 rounded-premium p-6 shadow-[0_15px_45px_rgba(30,42,46,0.06)] flex flex-col gap-4"
                  style={{ transform: 'translate3d(0px, 0px, 20px)' }}
                >
                  <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse" />
                      <span className="text-[10px] font-label-md text-primary/60 uppercase tracking-widest font-bold">Daily reflection pad</span>
                    </div>
                    <span className="text-[9px] font-label-md bg-secondary/15 text-secondary px-2.5 py-0.5 rounded-full font-bold">Linguistic Parser: ON</span>
                  </div>

                  <p className="font-headline-md text-sm md:text-base text-primary leading-relaxed italic pr-2 font-medium">
                    "I felt <span className="bg-accent/25 text-primary px-1.5 py-0.5 rounded-md font-bold shadow-sm inline-block rotate-[-1deg] text-xs font-sans border border-accent/25">overwhelmed</span> by the workload, but I took a walk, reframed the goals, and refocused. I feel much <span className="bg-secondary/25 text-primary px-1.5 py-0.5 rounded-md font-bold shadow-sm inline-block rotate-[1deg] text-xs font-sans border border-secondary/25">clearer</span> now."
                  </p>

                  <div className="flex justify-between items-center text-[10px] font-label-md text-primary/45 pt-3 border-t border-primary/5 font-bold">
                    <span>Linguistic Analysis</span>
                    <span className="text-secondary">Resilience Patterns Detected</span>
                  </div>
                </div>

                {/* 2. Overlapping Metrics & CBT Reframe card grid */}
                <div 
                  className="grid grid-cols-2 gap-4 w-full"
                  style={{ transform: 'translate3d(0px, 0px, 40px)' }}
                >
                  {/* Metric Panel */}
                  <div className="bg-white border border-primary/5 rounded-premium p-5 shadow-[0_15px_45px_rgba(30,42,46,0.06)] flex flex-col justify-between h-[150px]">
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
                  <div className="bg-primary text-on-primary rounded-premium p-5 shadow-[0_20px_50px_rgba(30,42,46,0.15)] flex flex-col justify-between h-[150px] border border-primary/10">
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



        {/* SECTION: HOW IT WORKS (BESPOKE TIMELINE) */}
        <section className="py-section-gap bg-surface-container-low" id="experience">
          <ScrollReveal className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop overflow-hidden space-y-12">
            <div className="text-center mb-12">
              <RevealText>
                <h2 className="font-headline-lg text-headline-lg text-primary">The Arch of Insight</h2>
              </RevealText>
              <RevealText delay={0.15}>
                <p className="text-on-surface-variant font-body-lg text-body-lg">
                  A structured evolution from observation to profound awareness.
                </p>
              </RevealText>
            </div>

            {/* Timeline switcher */}
            <DaySwitcher activeIndex={activeDayIndex} setActiveIndex={setActiveDayIndex} />
          </ScrollReveal>
        </section>



        {/* SECTION: EDITORIAL PHILOSOPHY */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto text-center" id="methodology">
          <ScrollReveal className="max-w-4xl mx-auto space-y-12">
            <span className="font-label-md text-label-md text-secondary tracking-[0.2em] uppercase text-xs font-bold block">The Essence</span>
            <RevealText>
              <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary leading-tight italic">
                "We do not diagnose. We do not label. We help people develop awareness through structured reflection and observation."
              </h2>
            </RevealText>
            <div className="w-24 h-[1px] bg-primary/20 mx-auto"></div>
            <RevealText delay={0.2}>
              <p className="font-body-lg text-body-lg text-on-surface-variant leading-relaxed max-w-2xl mx-auto italic opacity-90">
                Traditional wellness tools often rush to provide answers. We believe the most powerful transformations come from asking better questions. Our methodology is rooted in the belief that structured reflection builds permanent self-observation skills.
              </p>
            </RevealText>
            <button 
              onClick={() => scrollToSection('experience')}
              className="bg-primary text-on-primary px-10 py-4 rounded-xl font-label-md text-label-md hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] cursor-pointer"
            >
              Our Philosophy
            </button>
          </ScrollReveal>
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
                      { label: "Work Stress", text: "I felt extremely anxious during the team alignment meeting today. I worried that my proposal was judged harshly, but after receiving feedback from Sarah, I realized she was just offering constructive input." },
                      { label: "Morning Clarity", text: "Woke up feeling sluggish, but I sat in silence for 10 minutes and logged my intentions. My mind cleared rapidly and I feel ready to focus on code optimization." },
                      { label: "Evening Review", text: "The day ended with a build error, which made me feel like I wasted the whole afternoon. But I remind myself that debugging is progress, and I solved three other issues earlier." }
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
        <section id="pricing" className="py-section-gap px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
          <div className="text-center space-y-3 mb-16">
            <span className="text-[10px] font-label-md text-secondary font-bold uppercase tracking-widest block">TRANSPARENT VALUE</span>
            <RevealText>
              <h2 className="font-headline-lg text-headline-lg text-primary">Invest in Your Awareness</h2>
            </RevealText>
            <RevealText delay={0.15}>
              <p className="font-body-lg text-body-lg text-primary/60 max-w-xl mx-auto leading-relaxed">
                Choose the depth of your journey. cancel or pause at any time.
              </p>
            </RevealText>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Plan 1: Core Journey */}
            <ScrollReveal className="h-full flex" delay={0.1}>
              <motion.div 
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-white rounded-premium p-10 md:p-12 border border-primary/5 flex flex-col justify-between shadow-[0_4px_24px_rgba(30,42,46,0.02)] tonal-layer-1 cursor-pointer w-full"
              >
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-secondary uppercase tracking-[0.25em] block">The Core Journey</span>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="font-headline-lg text-4xl font-bold text-primary">₹499</span>
                      <span className="text-xs text-primary/50 font-label-md">/ month</span>
                    </div>
                    <p className="font-body-md text-xs text-primary/60 leading-relaxed pt-2">
                      Perfect for establishing daily reflection habits and baseline cognitive patterns.
                    </p>
                  </div>

                  <ul className="space-y-4 border-t border-primary/5 pt-6 text-xs font-body-md text-primary/70">
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                      <span>Daily Guided Reflections</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                      <span>Core Psychometric Tests</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-secondary text-[20px]">check_circle</span>
                      <span>Monthly Insight Reports</span>
                    </li>
                  </ul>
                </div>

                <button className="w-full bg-white hover:bg-primary hover:text-white border border-primary/15 hover:border-primary hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-12 transition-all shadow-sm cursor-pointer duration-300">
                  Begin Basic Journey
                </button>
              </motion.div>
            </ScrollReveal>

            {/* Plan 2: Premium Path */}
            <ScrollReveal className="h-full flex" delay={0.25}>
              <motion.div 
                whileHover={{ y: -8, scale: 1.01 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="bg-primary text-on-primary rounded-premium p-10 md:p-12 border border-primary/15 flex flex-col justify-between shadow-2xl relative overflow-hidden group pricing-glow cursor-pointer w-full"
              >
                <div className="absolute top-8 right-8 bg-accent text-primary px-4 py-1.5 rounded-full text-[9px] font-bold uppercase tracking-[0.1em]">
                  POPULAR CHOICE
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-accent uppercase tracking-[0.25em] block">The Premium Path</span>
                    <div className="flex items-baseline gap-1 mt-4">
                      <span className="font-headline-lg text-4xl font-bold">₹799</span>
                      <span className="text-xs opacity-50 font-label-md">/ month</span>
                    </div>
                    <p className="font-body-md text-xs text-white/70 leading-relaxed pt-2">
                      A comprehensive three-month dive into recurring patterns, stress triggers, and core values.
                    </p>
                  </div>

                  <ul className="space-y-4 border-t border-white/10 pt-6 text-xs font-body-md opacity-90">
                    <li className="flex items-center gap-3 text-on-primary-container">
                      <span className="material-symbols-outlined text-accent text-[20px]">star</span>
                      <span>All Core Journey Features</span>
                    </li>
                    <li className="flex items-center gap-3 text-on-primary-container">
                      <span className="material-symbols-outlined text-accent text-[20px]">star</span>
                      <span>Bi-Weekly Deep Dives</span>
                    </li>
                    <li className="flex items-center gap-3 text-on-primary-container">
                      <span className="material-symbols-outlined text-accent text-[20px]">star</span>
                      <span>Personalized AI Narrative Analysis</span>
                    </li>
                    <li className="flex items-center gap-3 text-on-primary-container">
                      <span className="material-symbols-outlined text-accent text-[20px]">star</span>
                      <span>Priority Access to New Research</span>
                    </li>
                  </ul>
                </div>

                <button className="w-full bg-accent hover:opacity-95 hover:scale-[1.02] text-primary font-label-md text-xs font-bold tracking-wider uppercase py-4 rounded-xl mt-12 transition-all shadow-md cursor-pointer duration-300">
                  Start Premium Journey
                </button>
              </motion.div>
            </ScrollReveal>
          </div>
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
              <button className="font-label-md text-xs font-bold tracking-wider text-secondary border-b-[1.5px] border-secondary hover:pb-1 transition-all mt-2 cursor-pointer">
                More Questions?
              </button>
            </div>
          </ScrollReveal>
        </section>

        {/* SECTION: FINAL CTA */}
        <section className="py-section-gap px-margin-mobile md:px-margin-desktop">
          <div className="max-w-container-max mx-auto bg-primary text-on-primary rounded-premium p-16 text-center relative overflow-hidden">
            {/* Ambient Tonal Glows */}
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-accent/15 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-secondary/15 rounded-full blur-[100px] pointer-events-none" />
            
            <ScrollReveal className="max-w-3xl mx-auto space-y-8 relative z-10">
              <RevealText>
                <h2 className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg leading-tight">
                  The most important patterns in your life are often the hardest to see.
                </h2>
              </RevealText>
              <RevealText delay={0.15}>
                <p className="font-body-lg text-body-lg text-white/80 opacity-90 font-light max-w-2xl mx-auto">
                  Begin your journey toward structural awareness today. Join a community of intentional seekers.
                </p>
              </RevealText>
              <RevealText delay={0.3}>
                <div className="pt-8">
                  <button 
                    onClick={() => scrollToSection('pricing')}
                    className="bg-on-primary text-primary px-14 py-5 rounded-full font-label-md text-label-md tracking-widest uppercase font-bold hover:scale-[1.05] transition-all duration-500 shadow-2xl cursor-pointer"
                  >
                    Begin Your Journey
                  </button>
                </div>
              </RevealText>
              <p className="text-[10px] opacity-60 uppercase tracking-[0.3em] font-semibold font-label-md">NO CREDIT CARD REQUIRED FOR 7-DAY TRIAL</p>
            </ScrollReveal>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-surface border-t border-outline-variant/35 w-full py-section-gap">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop grid grid-cols-1 md:grid-cols-4 gap-gutter mb-16">
          <div className="space-y-6">
            <img 
              alt="Ingress Within Logo" 
              className="h-8 w-auto object-contain" 
              src="https://lh3.googleusercontent.com/aida/AP1WRLskWM2xaCsDzsE-u53axLTls4PCEfzg3RysGEkIBFTPwoIFIqQR12qM1blKxnkYtuFIILhbt-1Lf0MpCYvqOGuYTeWRI6BYmLDCYwszmoErUzx-3Eh9tZBMXBpVL7ngbAaHDPIgxDP1lE1X9ba91jgu2XiKANWDr54nW8mq1qgYf8jKc2YNsXpKevKi64ogySNY5uXt9BaofNIlFa-yfj1X8LL2hkRb2k-7_m1iJTwIXcdJ8DnQnrMLMJk"
            />
            <p className="text-on-surface-variant font-body-md text-xs leading-relaxed pr-8 italic opacity-85">
              Modern tools for the ancient practice of self-observation. Crafted with intention in Bengaluru.
            </p>
          </div>
          <div>
            <h6 className="font-label-md text-[11px] font-bold tracking-[0.2em] text-primary mb-8 uppercase">EXPLORE</h6>
            <ul className="space-y-4">
              <li><button onClick={() => scrollToSection('methodology')} className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold">Methodology</button></li>
              <li><button onClick={() => scrollToSection('reports')} className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold">Research Reports</button></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Journaling Tips</a></li>
              <li><button onClick={() => scrollToSection('pricing')} className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm cursor-pointer text-left font-bold font-bold">Pricing Packages</button></li>
            </ul>
          </div>
          <div>
            <h6 className="font-label-md text-[11px] font-bold tracking-[0.2em] text-primary mb-8 uppercase">PLATFORM</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Privacy Policy</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Terms of Service</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Security Specs</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Platform Status</a></li>
            </ul>
          </div>
          <div>
            <h6 className="font-label-md text-[11px] font-bold tracking-[0.2em] text-primary mb-8 uppercase">CONTACT</h6>
            <ul className="space-y-4">
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Help Center</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Press Kit</a></li>
              <li><a className="text-on-surface-variant hover:text-primary transition-colors duration-300 font-label-sm text-label-sm block font-bold" href="#">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <div className="max-w-container-max mx-auto px-margin-desktop pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-label-md">
          <span className="text-on-surface-variant font-medium">© 2026 Ingress Within. All rights reserved.</span>
          <div className="flex gap-6">
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">public</span></a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">mail</span></a>
            <a className="text-on-surface-variant hover:text-primary transition-colors" href="#"><span className="material-symbols-outlined text-[20px]">share</span></a>
          </div>
        </div>
      </footer>
    </div>
  );
}
