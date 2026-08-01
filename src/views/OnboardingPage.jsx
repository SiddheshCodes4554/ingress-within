import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Check, Sparkles, AlertCircle, Bell, HelpCircle } from 'lucide-react';

const quotes = [
  "Settle in. Let the mind arrive at the page.",
  "A journal is a mirror that learns your reflections.",
  "Start where you are. The words will follow.",
  "Each reflection is a step towards understanding."
];

const oceanQuestions = [
  { id: 1, text: "When something in my life isn't working, I'm usually open to looking at my own role in it." },
  { id: 2, text: "I find it easier to sit with uncertainty than to force a quick answer." },
  { id: 3, text: "I tend to follow through on things I set for myself even when motivation drops." },
  { id: 4, text: "When things feel out of control externally, I usually try to control what I can internally." },
  { id: 5, text: "When I'm stressed, being around people usually helps me feel better." },
  { id: 6, text: "I process things better by talking them through than sitting with them alone." },
  { id: 7, text: "I find it hard to express frustration or disagreement directly to someone I care about." },
  { id: 8, text: "I often say I'm fine when I'm not because I don't want to make it a thing." },
  { id: 9, text: "I tend to take on other people's emotions as if they were my own." },
  { id: 10, text: "Small things can throw off my whole day if they hit at the wrong time." },
  { id: 11, text: "I often replay conversations or situations in my head long after they've happened." },
  { id: 12, text: "When I'm anxious I find it hard to identify exactly what I'm anxious about." }
];

export default function OnboardingPage({ initialStep = 'loading', onComplete }) {
  const [step, setStep] = useState(initialStep); // 'loading', 'consent', 'profile', 'welcome', 'assessment', 'success'
  const [loadingError, setLoadingError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  // OCEAN Wizard State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentAnswers, setAssessmentAnswers] = useState({});
  const [assessmentSubStep, setAssessmentSubStep] = useState('questions'); // 'questions' | 'summary'
  const [personalitySummaryText, setPersonalitySummaryText] = useState('');

  // Quote rotation on Left panel
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(quoteTimer);
  }, []);

  // 1. Consent State
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeAiNotice, setAgreeAiNotice] = useState(false);
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [showFullPrivacy, setShowFullPrivacy] = useState(false);

  // 2. Profile State
  const [fullName, setFullName] = useState('');
  const [preferredName, setPreferredName] = useState('');

  // 3. Welcome / Orientation Slide State
  const [activeSlide, setActiveSlide] = useState(0);
  const welcomeSlides = [
    {
      title: "Daily Reflection",
      subtitle: "Write about your day.",
      description: "Establish a quiet space to review your thoughts, release tension, and capture the subtle details of your experience."
    },
    {
      title: "Guided Exercises",
      subtitle: "Explore structured activities.",
      description: "Engage with CBT reframing, emotional tracking, and linguistic shifts designed to bring cognitive clarity."
    },
    {
      title: "Personal Reports",
      subtitle: "See patterns over time.",
      description: "Receive monthly emotional wellness indexes and stress trigger diagnostics to trace your personal growth."
    }
  ];

  const fetchStatus = async () => {
    setLoadingError(null);
    setStep('loading');
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        if (data.profile) {
          const p = data.profile;
          if (!p.consent_completed) setStep('consent');
          else if (!p.profile_completed) setStep('profile');
          else if (!p.orientation_completed) setStep('welcome');
          else if (!p.assessment_completed) {
            setStep('assessment');
            setAssessmentSubStep('questions');
          } else if (!p.onboarding_completed) {
            setStep('assessment');
            setAssessmentSubStep('summary');
            if (data.user && data.user.personality_summary_text) {
              setPersonalitySummaryText(data.user.personality_summary_text);
            }
          } else {
            if (onComplete) onComplete();
            else {
              window.navigateTo('/dashboard');
            }
          }
        } else {
          setLoadingError(new Error('Profile details missing.'));
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        setLoadingError(new Error(errData.error?.message || `API error (${res.status})`));
      }
    } catch (err) {
      console.error('Failed to resolve onboarding state:', err);
      setLoadingError(err);
    }
  };

  // Helper to fetch current onboarding state from backend
  useEffect(() => {
    fetchStatus();
  }, []);

  const navigateToStep = (newStep) => {
    setStep(newStep);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const shakeVariants = {
    shake: {
      x: [0, -6, 6, -6, 6, -3, 3, 0],
      transition: { duration: 0.35, ease: "easeInOut" }
    },
    idle: { x: 0 }
  };

  // Submit Step 1: Consent
  const handleConsentSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!agreeTerms || !agreePrivacy || !agreeAiNotice) return;

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/onboarding/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          terms_version: 'v1.0.0',
          privacy_version: 'v1.0.0'
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to submit consent.');
      }

      navigateToStep('profile');
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Step 2: Profile
  const handleProfileSubmit = async (e) => {
    if (e) e.preventDefault();
    if (fullName.trim().length < 2) {
      setErrorMsg('What should we call you? Please enter a name (at least 2 letters).');
      setShake(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/onboarding/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName,
          preferred_name: preferredName
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update profile.');
      }

      navigateToStep('welcome');
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Step 3: Welcome Carousel Complete
  const handleWelcomeComplete = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/onboarding/welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to update progress.');
      }

      navigateToStep('assessment');
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Step 4: OCEAN Assessment Methods
  const handleRatingSelect = (rating) => {
    setAssessmentAnswers(prev => ({
      ...prev,
      [`q${oceanQuestions[currentQuestionIndex].id}`]: rating
    }));
  };

  const handleNextQuestion = async () => {
    if (currentQuestionIndex < oceanQuestions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setIsSubmitting(true);
      setErrorMsg('');
      try {
        const res = await fetch('/api/onboarding/assessment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: assessmentAnswers })
        });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.error?.message || 'Failed to complete assessment.');
        }

        setPersonalitySummaryText(data.personality_summary_text);
        setAssessmentSubStep('summary');
      } catch (err) {
        setErrorMsg(err.message);
        setShake(true);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleFinalizeOnboarding = async () => {
    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/onboarding/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ finalize: true })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error?.message || 'Failed to finalize onboarding.');
      }

      navigateToStep('success');
    } catch (err) {
      setErrorMsg(err.message);
      setShake(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-primary font-sans">
      
      {/* LEFT COLUMN: BRAND VISUALS */}
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-primary p-12 overflow-hidden border-r border-white/5">
        
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Quiet brand layout header */}
        <div className="self-start flex items-center gap-1.5 z-10 pointer-events-none">
          <svg className="w-8 h-8 text-white" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="2" fill="currentColor"/>
            <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
            <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary"/>
          </svg>
          <span className="font-serif text-white text-[15px] tracking-[0.06em]">ingress within</span>
        </div>

        {/* Dynamic Breathing Portal Motif */}
        <div className="relative w-80 h-80 flex items-center justify-center shrink-0 my-8">
          {/* Logo Mark in Center */}
          <div className="absolute z-20 flex flex-col items-center justify-center pointer-events-none">
            <svg className="w-14 h-14 text-white" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="2" fill="currentColor"/>
              <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary"/>
            </svg>
            <span className="font-serif text-white text-sm font-normal tracking-[0.08em] mt-2 leading-none">
              onboarding
            </span>
          </div>

          {/* Breathing Circle Ring 1 (Teal) */}
          <motion.div 
            animate={{ scale: [1, 1.08, 1], opacity: [0.35, 0.45, 0.35] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-44 h-44 rounded-full border border-secondary/20"
          />

          {/* Breathing Circle Ring 2 (Sage) */}
          <motion.div 
            animate={{ scale: [1, 1.14, 1], opacity: [0.22, 0.35, 0.22] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute w-60 h-60 rounded-full border border-[#8DBFB4]/15"
          />

          {/* Breathing Circle Ring 3 (Accent) */}
          <motion.div 
            animate={{ scale: [1, 1.20, 1], opacity: [0.12, 0.25, 0.12] }}
            transition={{ duration: 11, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            className="absolute w-72 h-72 rounded-full border border-[#E0A898]/10"
          />
        </div>

        {/* Rotating reflection text in left corner */}
        <div className="max-w-[320px] text-left min-h-[70px] z-10">
          <AnimatePresence mode="wait">
            <motion.p 
              key={activeQuoteIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 0.65, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="font-serif text-[17px] italic text-[#D8ECEA] leading-relaxed"
            >
              "{quotes[activeQuoteIndex]}"
            </motion.p>
          </AnimatePresence>
        </div>

      </div>

      {/* RIGHT COLUMN: ONBOARDING FORMS */}
      <div className="relative flex flex-col justify-between items-center py-12 px-6 md:px-12 bg-mint-grey min-h-screen">
        
        {/* Top Header bar with Logo mark for Mobile view */}
        <div className="w-full flex justify-between items-center max-w-[480px] z-10">
          <span className="font-sans text-[11px] font-medium tracking-[0.14em] uppercase text-secondary-dark">
            {step === 'loading' ? 'Checking status...' : `Step ${step === 'consent' ? '1 of 5' : step === 'profile' ? '2 of 5' : step === 'welcome' ? '3 of 5' : step === 'assessment' ? '4 of 5' : '5 of 5'}`}
          </span>
          <div className="flex items-center gap-1.5 lg:hidden">
            <svg className="w-6 h-6 text-primary" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="2" fill="currentColor"/>
              <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              <circle cx="16" cy="16" r="6" stroke="currentColor" strokeWidth="1.2" fill="none" className="text-secondary"/>
            </svg>
            <span className="font-serif text-sm font-bold text-primary">ingress</span>
          </div>
        </div>

        {/* Central Auth Area wrapper */}
        <div className="w-full max-w-[480px] flex-grow flex flex-col justify-center z-10 py-8">
          
          <AnimatePresence mode="wait">

            {/* STEP 0: INITIAL LOADING / ERROR FLOW */}
            {step === 'loading' && (
              <motion.div
                key="loading-view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-center py-12"
              >
                {loadingError ? (
                  <div className="space-y-6">
                    <div className="relative w-20 h-20 mx-auto flex items-center justify-center pointer-events-none mb-2">
                      <svg className="w-12 h-12 text-[#b45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                      </svg>
                    </div>
                    <h2 className="font-serif text-2xl text-primary font-normal">Connection Error</h2>
                    <p className="text-mid font-light text-sm leading-relaxed max-w-xs mx-auto">
                      We couldn't connect to retrieve your onboarding status. Please check your network and try again.
                    </p>
                    {loadingError.message && (
                      <div className="bg-[#fef3c7] border border-[#f59e0b]/20 text-[#92400e] text-[11px] font-mono p-3 rounded max-w-xs mx-auto break-all text-left">
                        {loadingError.message}
                      </div>
                    )}
                    <button 
                      onClick={fetchStatus}
                      className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2 border-none"
                    >
                      <span>Retry</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-4">
                      <div className="absolute w-16 h-16 rounded-full border border-secondary/20 animate-ping" />
                      <div className="absolute w-12 h-12 rounded-full border border-accent/20 animate-pulse" />
                      <svg className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 32 32" fill="none">
                        <circle cx="16" cy="16" r="2" fill="currentColor"/>
                        <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                      </svg>
                    </div>
                    <p className="text-mid font-serif italic text-sm animate-pulse">Initializing your onboarding...</p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* STEP 1: CONSENT FLOW */}
            {step === 'consent' && (
              <motion.div
                key="consent-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="space-y-8"
              >
                <div className="space-y-2 text-center">
                  <h1 className="font-serif text-[32px] font-normal text-primary tracking-wide">
                    Consent & Guidelines
                  </h1>
                  <p className="font-sans text-sm font-light text-mid">
                    Please take a moment to review and accept our guidelines.
                  </p>
                </div>

                <form onSubmit={handleConsentSubmit} className="space-y-6">
                  <motion.div
                    variants={shakeVariants}
                    animate={shake ? "shake" : "idle"}
                    onAnimationComplete={() => setShake(false)}
                    className="space-y-6"
                  >
                    {/* Summaries Panel */}
                    <div className="bg-white border border-primary/5 rounded-lg p-5 space-y-5 shadow-xs max-h-[300px] overflow-y-auto">
                      
                      {/* Terms Summary */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">1. Terms of Service</h4>
                          <button 
                            type="button" 
                            onClick={() => setShowFullTerms(true)}
                            className="text-[11px] text-secondary-dark hover:underline bg-transparent border-none p-0 cursor-pointer"
                          >
                            Read Full Doc
                          </button>
                        </div>
                        <p className="font-sans text-[13px] font-light text-mid leading-relaxed">
                          By using Ingress Within, you agree to engage in standard reflection practices. You own your data and entries, and remain responsible for maintaining the privacy of your account credentials.
                        </p>
                      </div>

                      <hr className="border-t border-primary/5 my-3" />

                      {/* Privacy Summary */}
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">2. Privacy Policy</h4>
                          <button 
                            type="button" 
                            onClick={() => setShowFullPrivacy(true)}
                            className="text-[11px] text-secondary-dark hover:underline bg-transparent border-none p-0 cursor-pointer"
                          >
                            Read Full Doc
                          </button>
                        </div>
                        <p className="font-sans text-[13px] font-light text-mid leading-relaxed">
                          Your daily journal entries are encrypted in transit and at rest. We do not sell your personal or writing data. Information is parsed strictly to generate your emotional patterns and index charts.
                        </p>
                      </div>

                      <hr className="border-t border-primary/5 my-3" />

                      {/* AI Transparency */}
                      <div className="space-y-1">
                        <h4 className="font-sans text-xs font-semibold uppercase tracking-wider text-primary">3. AI Transparency Notice</h4>
                        <p className="font-sans text-[13px] font-light text-mid leading-relaxed">
                          Ingress Within utilizes natural language processing models to extract sentiment trends and indices. These insights represent algorithmic analysis to assist self-reflection. **They are not medical, diagnostic, or clinical psychological advice.**
                        </p>
                      </div>

                    </div>

                    {/* Checkboxes */}
                    <div className="space-y-4 pt-2">
                      
                      {/* Terms */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                          <input 
                            type="checkbox"
                            checked={agreeTerms}
                            onChange={(e) => setAgreeTerms(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${agreeTerms ? 'bg-primary border-primary' : 'bg-white border-primary/20 group-hover:border-primary/45'}`}>
                            {agreeTerms && <Check size={13} className="text-white" />}
                          </div>
                        </div>
                        <span className="font-sans text-[13.5px] font-light text-mid select-none leading-snug">
                          I agree to the Terms of Service.
                        </span>
                      </label>

                      {/* Privacy */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                          <input 
                            type="checkbox"
                            checked={agreePrivacy}
                            onChange={(e) => setAgreePrivacy(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${agreePrivacy ? 'bg-primary border-primary' : 'bg-white border-primary/20 group-hover:border-primary/45'}`}>
                            {agreePrivacy && <Check size={13} className="text-white" />}
                          </div>
                        </div>
                        <span className="font-sans text-[13.5px] font-light text-mid select-none leading-snug">
                          I agree to the Privacy Policy.
                        </span>
                      </label>

                      {/* AI Notice */}
                      <label className="flex items-start gap-3 cursor-pointer group">
                        <div className="relative flex items-center justify-center shrink-0 mt-0.5">
                          <input 
                            type="checkbox"
                            checked={agreeAiNotice}
                            onChange={(e) => setAgreeAiNotice(e.target.checked)}
                            className="sr-only"
                          />
                          <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center ${agreeAiNotice ? 'bg-primary border-primary' : 'bg-white border-primary/20 group-hover:border-primary/45'}`}>
                            {agreeAiNotice && <Check size={13} className="text-white" />}
                          </div>
                        </div>
                        <span className="font-sans text-[13.5px] font-light text-mid select-none leading-snug">
                          I understand that AI insights are for reflection and are **not** medical or psychological advice.
                        </span>
                      </label>

                    </div>

                    {errorMsg && (
                      <p className="font-sans text-[13px] text-[#b37361] leading-relaxed text-center">
                        {errorMsg}
                      </p>
                    )}

                    {/* Continue Button */}
                    <button 
                      type="submit"
                      disabled={isSubmitting || !agreeTerms || !agreePrivacy || !agreeAiNotice}
                      className="w-full bg-primary hover:bg-[#2A3A3E] text-mint-grey py-3.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      {isSubmitting ? "Submitting..." : "Accept & Continue"}
                    </button>

                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* STEP 2: PROFILE SETUP */}
            {step === 'profile' && (
              <motion.div
                key="profile-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="space-y-10"
              >
                <div className="space-y-2 text-center">
                  <h1 className="font-serif text-[32px] font-normal text-primary tracking-wide">
                    What should we call you?
                  </h1>
                  <p className="font-sans text-sm font-light text-mid">
                    Please introduce yourself to initialize your private journaling workspace.
                  </p>
                </div>

                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <motion.div
                    variants={shakeVariants}
                    animate={shake ? "shake" : "idle"}
                    onAnimationComplete={() => setShake(false)}
                    className="space-y-6"
                  >
                    {/* Inputs */}
                    <div className="space-y-5">
                      {/* Full Name */}
                      <div className="space-y-2">
                        <label className="font-sans text-xs font-semibold uppercase tracking-wider text-primary/80 pl-1">Full Name</label>
                        <input 
                          type="text"
                          required
                          value={fullName}
                          onChange={(e) => { setFullName(e.target.value); setErrorMsg(''); }}
                          placeholder="Your full name"
                          disabled={isSubmitting}
                          className="w-full bg-white border border-primary/10 rounded-md px-4 py-3.5 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 outline-none font-sans text-[15px] text-primary placeholder-primary/25 transition-all shadow-xs disabled:opacity-50"
                        />
                      </div>

                      {/* Preferred Name (Optional) */}
                      <div className="space-y-2">
                        <label className="font-sans text-xs font-semibold uppercase tracking-wider text-primary/80 pl-1">Preferred Name <span className="text-mid/60 font-light lowercase italic">(Optional)</span></label>
                        <input 
                          type="text"
                          value={preferredName}
                          onChange={(e) => setPreferredName(e.target.value)}
                          placeholder="What should we call you in greetings?"
                          disabled={isSubmitting}
                          className="w-full bg-white border border-primary/10 rounded-md px-4 py-3.5 focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 outline-none font-sans text-[15px] text-primary placeholder-primary/25 transition-all shadow-xs disabled:opacity-50"
                        />
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="font-sans text-[13px] text-[#b37361] leading-relaxed pl-1">
                        {errorMsg}
                      </p>
                    )}

                    {/* Continue Button */}
                    <button 
                      type="submit"
                      disabled={isSubmitting || fullName.trim().length < 2}
                      className="w-full bg-primary hover:bg-[#2A3A3E] text-mint-grey py-3.5 rounded-md font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-xs"
                    >
                      {isSubmitting ? "Saving..." : "Continue"}
                    </button>

                  </motion.div>
                </form>
              </motion.div>
            )}

            {/* STEP 3: WELCOME / ORIENTATION */}
            {step === 'welcome' && (
              <motion.div
                key="welcome-view"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.4 }}
                className="space-y-8 text-center"
              >
                {/* Active Slide Visual Layout */}
                <div className="relative w-full aspect-video max-w-[400px] mx-auto bg-white rounded-lg border border-primary/5 shadow-xs flex items-center justify-center p-6 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-tr from-secondary/5 via-transparent to-accent/5 opacity-60" />
                  
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeSlide}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="relative z-10 flex flex-col items-center justify-center space-y-4"
                    >
                      {activeSlide === 0 ? (
                        <div className="w-16 h-16 rounded-full bg-secondary/12 flex items-center justify-center text-secondary">
                          <Check size={28} />
                        </div>
                      ) : activeSlide === 1 ? (
                        <div className="w-16 h-16 rounded-full bg-accent/12 flex items-center justify-center text-accent">
                          <Sparkles size={28} />
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <ShieldCheck size={28} />
                        </div>
                      )}

                      <div className="space-y-1">
                        <span className="font-sans text-[11px] font-semibold tracking-[0.15em] uppercase text-secondary-dark">
                          {welcomeSlides[activeSlide].title}
                        </span>
                        <h3 className="font-serif text-[20px] font-normal text-primary">
                          {welcomeSlides[activeSlide].subtitle}
                        </h3>
                      </div>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Text Content */}
                <div className="min-h-[100px] space-y-2 max-w-[380px] mx-auto">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeSlide}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 0.8, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.3 }}
                      className="font-sans text-[14.5px] font-light text-mid leading-relaxed"
                    >
                      {welcomeSlides[activeSlide].description}
                    </motion.p>
                  </AnimatePresence>
                </div>

                {/* Pagination Indicators & Controls */}
                <div className="space-y-8">
                  {/* Indicators */}
                  <div className="flex justify-center gap-2">
                    {welcomeSlides.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveSlide(idx)}
                        className={`w-2.5 h-2.5 rounded-full transition-all border-none p-0 cursor-pointer ${idx === activeSlide ? 'bg-primary scale-110' : 'bg-primary/20 hover:bg-primary/45'}`}
                      />
                    ))}
                  </div>

                  {/* Navigation Buttons */}
                  <div className="flex justify-between items-center max-w-[320px] mx-auto pt-2">
                    <button
                      type="button"
                      disabled={activeSlide === 0 || isSubmitting}
                      onClick={() => setActiveSlide((prev) => prev - 1)}
                      className="flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider text-primary/45 hover:text-primary/80 transition-colors bg-transparent border-none p-0 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    {activeSlide < 2 ? (
                      <button
                        type="button"
                        onClick={() => setActiveSlide((prev) => prev + 1)}
                        className="flex items-center gap-1 font-sans text-xs font-semibold uppercase tracking-wider text-secondary-dark hover:text-primary transition-colors bg-transparent border-none p-0 cursor-pointer"
                      >
                        Next <ArrowRight size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={handleWelcomeComplete}
                        className="flex items-center gap-2 bg-primary hover:bg-[#2A3A3E] text-mint-grey px-6 py-2.5 rounded font-sans text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs disabled:opacity-50"
                      >
                        {isSubmitting ? "Processing..." : "Begin Assessment"} <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                </div>

              </motion.div>
            )}

            {/* STEP 4: OCEAN ASSESSMENT */}
            {step === 'assessment' && (
              <div className="w-full">
                {assessmentSubStep === 'questions' ? (
                  <motion.div
                    key="assessment-questions"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-8"
                  >
                    {/* Back button */}
                    <div className="min-h-[20px] flex items-center">
                      {currentQuestionIndex > 0 && (
                        <button
                          onClick={handlePrevQuestion}
                          className="flex items-center gap-1.5 text-mid hover:text-primary transition-colors text-[11px] font-sans font-semibold uppercase tracking-wider bg-transparent border-none cursor-pointer"
                        >
                          <ArrowLeft size={12} /> Back
                        </button>
                      )}
                    </div>

                    <div className="space-y-4 text-center">
                      <span className="font-sans text-[11px] font-semibold tracking-[0.15em] uppercase text-accent">
                        Question {currentQuestionIndex + 1} of 12
                      </span>
                      <h1 className="font-serif text-[24px] md:text-[28px] leading-snug font-normal text-primary px-2">
                        {oceanQuestions[currentQuestionIndex].text}
                      </h1>
                    </div>

                    {/* 1-5 circular scale buttons */}
                    <div className="flex flex-col items-center gap-6 max-w-[400px] mx-auto py-4">
                      <div className="flex items-center justify-between w-full px-2">
                        {[1, 2, 3, 4, 5].map((rating) => {
                          const isSelected = assessmentAnswers[`q${oceanQuestions[currentQuestionIndex].id}`] === rating;
                          return (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => handleRatingSelect(rating)}
                              className={`w-12 h-12 rounded-full flex items-center justify-center font-sans text-sm font-semibold transition-all duration-200 border cursor-pointer ${
                                isSelected
                                  ? 'bg-primary text-white border-primary shadow-md scale-105'
                                  : 'bg-white text-primary border-primary/10 hover:border-primary/30 hover:bg-mint-grey'
                              }`}
                            >
                              {rating}
                            </button>
                          );
                        })}
                      </div>

                      {/* Rating labels */}
                      <div className="flex justify-between w-full text-[10px] md:text-[11px] font-sans font-light text-mid uppercase tracking-wider px-2">
                        <span>Not like me at all</span>
                        <span>Very much like me</span>
                      </div>
                    </div>

                    {errorMsg && (
                      <p className="font-sans text-[13px] text-[#b37361] text-center leading-relaxed">
                        {errorMsg}
                      </p>
                    )}

                    {/* Next Button */}
                    <div className="pt-2 text-center">
                      <button 
                        onClick={handleNextQuestion}
                        disabled={isSubmitting || assessmentAnswers[`q${oceanQuestions[currentQuestionIndex].id}`] === undefined}
                        className="w-full max-w-[360px] mx-auto py-3.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSubmitting ? "Submitting..." : currentQuestionIndex === oceanQuestions.length - 1 ? "Finish Assessment" : "Next Question"}
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="assessment-summary"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6 text-left max-w-[480px] mx-auto"
                  >
                    <div className="space-y-1">
                      <span className="font-sans text-[11px] font-semibold tracking-[0.12em] uppercase text-accent">
                        Here's what we noticed.
                      </span>
                    </div>

                    {/* Generous whitespace above and below */}
                    <div className="py-6 my-2">
                      <p className="font-sans text-base md:text-lg font-light text-primary leading-relaxed">
                        {personalitySummaryText}
                      </p>
                    </div>

                    {/* Muted divider */}
                    <hr className="border-0 border-t border-primary/10 w-full" />

                    {/* Transition note */}
                    <div className="py-2">
                      <p className="font-sans text-xs font-light text-mid leading-relaxed">
                        This shapes how we respond to you. You won't see it again — but it's working in the background.
                      </p>
                    </div>

                    {errorMsg && (
                      <p className="font-sans text-[13px] text-[#b37361] text-center leading-relaxed">
                        {errorMsg}
                      </p>
                    )}

                    {/* Continue Button */}
                    <div className="pt-4">
                      <button 
                        onClick={handleFinalizeOnboarding}
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {isSubmitting ? "Saving..." : "Continue"}
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            )}

            {/* STEP 5: SUCCESS SCREEN */}
            {step === 'success' && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="space-y-8 text-center"
              >
                {/* Celebratory Check Mark Visual with breathing background rings */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-secondary/12 border border-secondary/30" />
                  <div className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-xs border border-primary/5" />
                  <ShieldCheck size={40} className="text-secondary relative z-10" />
                </div>

                {/* Success Copy */}
                <div className="space-y-3">
                  <h1 className="font-serif text-[32px] md:text-[36px] leading-tight font-normal text-primary">
                    You're Ready To Begin
                  </h1>
                  <p className="font-sans text-sm font-light text-mid leading-relaxed max-w-[320px] mx-auto">
                    Your first reflection cycle is waiting. Take a moment to settle in.
                  </p>
                </div>

                {/* Continue CTA */}
                <button 
                  onClick={() => {
                    if (onComplete) onComplete();
                    else if (window.navigateTo) {
                      window.navigateTo('/dashboard');
                    } else {
                      window.location.pathname = '/dashboard';
                    }
                  }}
                  className="w-full py-4 bg-primary hover:bg-[#2A3A3E] text-mint-grey border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-xs"
                >
                  Continue to dashboard &rarr;
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* Empty bottom area for large whitespace spacing */}
        <div className="h-6" />

      </div>

      {/* FULL TERMS MODAL */}
      {showFullTerms && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-primary/45 backdrop-blur-[6px] p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-mint-grey rounded-lg border border-primary/10 max-w-[600px] w-full max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-primary/5 bg-white flex justify-between items-center">
              <h3 className="font-serif text-lg font-normal text-primary">Terms of Service</h3>
              <button onClick={() => setShowFullTerms(false)} className="text-mid hover:text-primary font-sans text-xs font-semibold bg-transparent border-none cursor-pointer">Close</button>
            </div>
            <div className="p-6 overflow-y-auto font-sans text-[14px] font-light text-mid leading-relaxed space-y-4">
              <p>Welcome to Ingress Within. These Terms of Service govern your use of our application, website, and services.</p>
              <h4 className="font-semibold text-primary">1. Acceptable Use</h4>
              <p>You agree to use Ingress Within solely for personal, non-commercial journaling and self-reflection exercises. You must not attempt to compromise the security, reverse-engineer, or disrupt the operation of our service.</p>
              <h4 className="font-semibold text-primary">2. Intellectual Property</h4>
              <p>You retain full ownership, copyrights, and intellectual property rights to all journal entries, reflections, and texts you write. Ingress Within owns all software code, layout designs, and diagnostic indexes generated by our systems.</p>
              <h4 className="font-semibold text-primary">3. Disclaimer of Liability</h4>
              <p>Ingress Within is a tool for self-reflection. We do not guarantee specific psychological outcomes. AI analysis represents linguistic patterns and should never replace clinical counseling, therapy, or emergency services.</p>
            </div>
          </div>
        </div>
      )}

      {/* FULL PRIVACY MODAL */}
      {showFullPrivacy && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-primary/45 backdrop-blur-[6px] p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-mint-grey rounded-lg border border-primary/10 max-w-[600px] w-full max-h-[80vh] flex flex-col overflow-hidden shadow-xl">
            <div className="px-6 py-4 border-b border-primary/5 bg-white flex justify-between items-center">
              <h3 className="font-serif text-lg font-normal text-primary">Privacy Policy</h3>
              <button onClick={() => setShowFullPrivacy(false)} className="text-mid hover:text-primary font-sans text-xs font-semibold bg-transparent border-none cursor-pointer">Close</button>
            </div>
            <div className="p-6 overflow-y-auto font-sans text-[14px] font-light text-mid leading-relaxed space-y-4">
              <p>At Ingress Within, we treat your privacy with absolute confidentiality. Here is how your data is handled:</p>
              <h4 className="font-semibold text-primary">1. Information Encryption</h4>
              <p>All journal entries are cryptographically encrypted in transit using SSL/TLS and stored using AES-256 database-level encryption at rest in our secure data centers.</p>
              <h4 className="font-semibold text-primary">2. Data Processing</h4>
              <p>Linguistic indices are processed in memory to produce weekly and monthly trends. We do not sell your journal entries, and we restrict administrative access to database servers entirely.</p>
              <h4 className="font-semibold text-primary">3. Third-party Gateways</h4>
              <p>We share phone numbers with transactional gateways (Vonage/Fast2SMS) solely to dispatch authentication OTPs. No journaling data is ever shared with these external gateways.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
