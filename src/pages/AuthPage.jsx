import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Smartphone, Eye, EyeOff } from 'lucide-react';

const quotes = [
  "The things you avoid naming shape you anyway.",
  "What you keep circling becomes visible over time.",
  "Write the version before you made it make sense.",
  "A single entry is a moment. A thread is a picture."
];

export default function AuthPage() {
  // Navigation states: 'login', 'signup', 'otp', 'forgot', 'success'
  const [view, setView] = useState('signup');
  const [loginTab, setLoginTab] = useState('otp'); // 'otp' or 'email'
  
  // Form values
  const [mobileNumber, setMobileNumber] = useState('');
  const [signupData, setSignupData] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loginEmailData, setLoginEmailData] = useState({ email: '', password: '', rememberMe: false });
  const [forgotEmail, setForgotEmail] = useState('');
  
  // OTP states
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [otpTimer, setOtpTimer] = useState(59);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const [sentToNumber, setSentToNumber] = useState('');
  
  // UI helpers
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  const otpInputsRef = useRef([]);

  // Quotes rotation on Left panel
  useEffect(() => {
    const quoteTimer = setInterval(() => {
      setActiveQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 6000);
    return () => clearInterval(quoteTimer);
  }, []);

  // OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (view === 'otp' && otpTimer > 0) {
      timer = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0) {
      setCanResendOtp(true);
    }
    return () => clearInterval(timer);
  }, [view, otpTimer]);

  // Read URL parameters on load to decide view
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('login')) {
      setView('login');
    } else if (path.includes('signup')) {
      setView('signup');
    }
  }, []);

  // Switch View Helper
  const navigateToView = (newView) => {
    setView(newView);
    setErrorMsg('');
    setSuccessMsg('');
  };

  const getCopyrightYear = () => {
    return new Date().getFullYear();
  };

  // Form handlers
  const handleSendOtp = (e, phoneNum) => {
    e.preventDefault();
    if (!phoneNum || phoneNum.length < 10) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }
    setSentToNumber(phoneNum);
    setOtpTimer(59);
    setCanResendOtp(false);
    setOtpDigits(['', '', '', '', '', '']);
    navigateToView('otp');
    
    // Focus first digit box after render
    setTimeout(() => {
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    }, 200);
  };

  const handleResendOtp = () => {
    if (!canResendOtp) return;
    setOtpTimer(59);
    setCanResendOtp(false);
    setOtpDigits(['', '', '', '', '', '']);
    setSuccessMsg('OTP code resent successfully.');
    setTimeout(() => {
      if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
    }, 100);
  };

  const handleOtpVerify = (e) => {
    e.preventDefault();
    const fullOtp = otpDigits.join('');
    if (fullOtp.length < 6) {
      setErrorMsg('Please enter the full 6-digit OTP code.');
      return;
    }
    // Simulate OTP verification
    navigateToView('success');
  };

  const handleOtpChange = (index, value) => {
    // Only accept numeric inputs
    if (value && !/^\d+$/.test(value)) return;

    const newDigits = [...otpDigits];
    // Take the last character typed
    newDigits[index] = value.substring(value.length - 1);
    setOtpDigits(newDigits);
    setErrorMsg('');

    // Auto-advance focus
    if (value && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      // Shifting focus back on Backspace
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handleEmailSignup = (e) => {
    e.preventDefault();
    if (!signupData.name || !signupData.email || !signupData.password) {
      setErrorMsg('Please fill in all fields.');
      return;
    }
    if (signupData.password !== signupData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }
    if (signupData.password.length < 8) {
      setErrorMsg('Password should be at least 8 characters long.');
      return;
    }
    // Simulate Signup
    navigateToView('success');
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (!loginEmailData.email || !loginEmailData.password) {
      setErrorMsg('Please enter your email and password.');
      return;
    }
    // Simulate Login
    navigateToView('success');
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setErrorMsg('Please enter your email address.');
      return;
    }
    setSuccessMsg('Reset password link sent! Check your inbox.');
    setForgotEmail('');
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white text-primary font-sans">
      
      {/* LEFT COLUMN: BRAND VISUALS (Slow motion, concentric circles, orbit, reflection quotes) */}
      <div className="relative hidden lg:flex flex-col items-center justify-between bg-primary p-12 overflow-hidden border-r border-white/5">
        
        {/* Decorative background glows */}
        <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-secondary/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Back Link to Landing Page */}
        <a 
          href="#/" 
          className="self-start flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-[#D8ECEA]/65 hover:text-white transition-colors no-underline z-10"
        >
          <ArrowLeft size={14} /> Back to Ingress
        </a>

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
              ingress <span>within</span>
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

          {/* Orbital Particles (Floating dots representing thoughts) */}
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Thought Dot 1 */}
            <div className="absolute top-[20px] left-[150px] w-2 h-2 rounded-full bg-accent opacity-60" />
            {/* Thought Dot 2 */}
            <div className="absolute bottom-[40px] right-[100px] w-1.5 h-1.5 rounded-full bg-secondary opacity-50" />
            {/* Thought Dot 3 */}
            <div className="absolute top-[220px] left-[20px] w-1.5 h-1.5 rounded-full bg-supporting opacity-55" />
          </motion.div>

          <motion.div 
            animate={{ rotate: -360 }}
            transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 pointer-events-none"
          >
            {/* Thought Dot 4 */}
            <div className="absolute top-[100px] right-[40px] w-2 h-2 rounded-full bg-secondary opacity-40" />
            {/* Thought Dot 5 */}
            <div className="absolute bottom-[100px] left-[50px] w-1.5 h-1.5 rounded-full bg-accent opacity-50" />
          </motion.div>
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

      {/* RIGHT COLUMN: AUTHENTICATION FORMS */}
      <div className="relative flex flex-col justify-between items-center py-8 px-6 md:px-12 bg-mint-grey min-h-screen">
        
        {/* Top Header bar with Logo mark for Mobile view */}
        <div className="w-full flex justify-end items-center max-w-[420px] z-10">
          {/* Logo mark visible only on mobile */}
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
        <div className="w-full max-w-[420px] flex-1 flex flex-col justify-center py-12 z-10">
          
          <AnimatePresence mode="wait">
            
            {/* VIEW 1: SIGN UP */}
            {view === 'signup' && (
              <motion.div
                key="signup-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] md:text-[38px] leading-tight font-normal text-primary">
                    Begin Your Reflection Journey
                  </h1>
                  <p className="font-sans text-sm font-light text-mid leading-relaxed pr-6">
                    Create your account and start understanding yourself better.
                  </p>
                </div>

                {errorMsg && (
                  <div className="text-accent text-xs font-sans bg-accent/5 border border-accent/15 rounded p-3">
                    {errorMsg}
                  </div>
                )}

                {/* Form fields */}
                <div className="space-y-6">
                  
                  {/* OPTION 1: Primary Mobile signup */}
                  <form onSubmit={(e) => handleSendOtp(e, mobileNumber)} className="space-y-3">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="phone-signup">
                        Continue with Mobile Number
                      </label>
                      <div className="flex gap-2.5">
                        <div className="relative flex-1">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm text-primary/40">+91</span>
                          <input 
                            type="tel"
                            id="phone-signup"
                            value={mobileNumber}
                            onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10)); setErrorMsg(''); }}
                            placeholder="98765 43210"
                            className="w-full bg-primary/4 border border-primary/10 rounded-md pl-12 pr-4 py-3 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                          />
                        </div>
                        <button 
                          type="submit"
                          className="bg-primary hover:bg-[#2A3A3E] text-mint-grey px-6 py-3 rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                        >
                          Send OTP
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Google options divider */}
                  <div className="flex items-center gap-4 text-primary/15">
                    <div className="h-[1px] bg-primary/10 flex-grow" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/30">or</span>
                    <div className="h-[1px] bg-primary/10 flex-grow" />
                  </div>

                  {/* Option 2: Google continuation */}
                  <button className="w-full bg-white border border-primary/10 rounded-md py-3 font-sans text-xs font-bold tracking-wider uppercase text-primary hover:bg-primary/4 hover:border-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                      <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.6 2.42v2h2.6c1.52-1.4 2.38-3.46 2.38-5.88z" fill="#4285F4" />
                      <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.32H.8v2.06A8 8 0 0 0 8 16z" fill="#34A853" />
                      <path d="M3.48 9.49A4.83 4.83 0 0 1 3.23 8c0-.52.09-1.02.25-1.49V4.45H.8A8 8 0 0 0 0 8c0 1.29.31 2.51.8 3.55l2.68-2.06z" fill="#FBBC05" />
                      <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A7.97 7.97 0 0 0 8 0 8 8 0 0 0 .8 4.45l2.68 2.06A4.8 4.8 0 0 1 8 3.18z" fill="#EA4335" />
                    </svg>
                    Continue with Google
                  </button>

                  <div className="flex items-center gap-4 text-primary/15">
                    <div className="h-[1px] bg-primary/10 flex-grow" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary/30">or Sign up with Email</span>
                    <div className="h-[1px] bg-primary/10 flex-grow" />
                  </div>

                  {/* Option 3: Email Signup */}
                  <form onSubmit={handleEmailSignup} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="name">
                        Full Name
                      </label>
                      <input 
                        type="text" 
                        id="name"
                        value={signupData.name}
                        onChange={(e) => { setSignupData({ ...signupData, name: e.target.value }); setErrorMsg(''); }}
                        placeholder="Your name" 
                        className="w-full bg-primary/4 border border-primary/10 rounded-md px-4 py-3 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="email">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        id="email"
                        value={signupData.email}
                        onChange={(e) => { setSignupData({ ...signupData, email: e.target.value }); setErrorMsg(''); }}
                        placeholder="you@domain.com" 
                        className="w-full bg-primary/4 border border-primary/10 rounded-md px-4 py-3 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="password">
                          Password
                        </label>
                        <input 
                          type="password" 
                          id="password"
                          value={signupData.password}
                          onChange={(e) => { setSignupData({ ...signupData, password: e.target.value }); setErrorMsg(''); }}
                          placeholder="Min 8 chars" 
                          className="w-full bg-primary/4 border border-primary/10 rounded-md px-4 py-3 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="confirmPassword">
                          Confirm Password
                        </label>
                        <input 
                          type="password" 
                          id="confirmPassword"
                          value={signupData.confirmPassword}
                          onChange={(e) => { setSignupData({ ...signupData, confirmPassword: e.target.value }); setErrorMsg(''); }}
                          placeholder="Repeat password" 
                          className="w-full bg-primary/4 border border-primary/10 rounded-md px-4 py-3 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-accent hover:bg-[#D49888] text-primary border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 shadow-xs"
                    >
                      Create Account
                    </button>
                  </form>

                </div>

                {/* Footer toggle */}
                <div className="text-center pt-2 font-sans text-xs text-mid">
                  Already have an account?{' '}
                  <button 
                    onClick={() => navigateToView('login')}
                    className="text-accent bg-transparent border-none p-0 cursor-pointer font-bold hover:underline"
                  >
                    Sign In
                  </button>
                </div>

              </motion.div>
            )}

            {/* VIEW 2: LOGIN */}
            {view === 'login' && (
              <motion.div
                key="login-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] md:text-[38px] leading-tight font-normal text-primary">
                    Welcome Back
                  </h1>
                  <p className="font-sans text-sm font-light text-mid leading-relaxed">
                    Continue where you left off.
                  </p>
                </div>

                {errorMsg && (
                  <div className="text-accent text-xs font-sans bg-accent/5 border border-accent/15 rounded p-3">
                    {errorMsg}
                  </div>
                )}

                {/* Tab Switcher */}
                <div className="flex border border-primary/10 rounded-md overflow-hidden bg-primary/4">
                  <button
                    onClick={() => { setLoginTab('otp'); setErrorMsg(''); }}
                    className={`flex-1 py-2.5 font-sans text-xs font-bold uppercase tracking-wider cursor-pointer border-none transition-all ${
                      loginTab === 'otp'
                        ? 'bg-accent text-primary'
                        : 'bg-transparent text-primary/60 hover:text-primary'
                    }`}
                  >
                    Mobile OTP
                  </button>
                  <button
                    onClick={() => { setLoginTab('email'); setErrorMsg(''); }}
                    className={`flex-1 py-2.5 font-sans text-xs font-bold uppercase tracking-wider cursor-pointer border-none transition-all ${
                      loginTab === 'email'
                        ? 'bg-accent text-primary'
                        : 'bg-transparent text-primary/60 hover:text-primary'
                    }`}
                  >
                    Email Password
                  </button>
                </div>

                {/* TAB 1: Mobile OTP Form */}
                {loginTab === 'otp' && (
                  <form onSubmit={(e) => handleSendOtp(e, mobileNumber)} className="space-y-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="phone-login">
                        Mobile Number
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm text-primary/40">+91</span>
                        <input 
                          type="tel"
                          id="phone-login"
                          value={mobileNumber}
                          onChange={(e) => { setMobileNumber(e.target.value.replace(/\D/g, '').substring(0, 10)); setErrorMsg(''); }}
                          placeholder="98765 43210"
                          className="w-full bg-primary/4 border border-primary/10 rounded-md pl-12 pr-4 py-3.5 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                        />
                      </div>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-accent hover:bg-[#D49888] text-primary border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 shadow-xs"
                    >
                      Send OTP
                    </button>
                  </form>
                )}

                {/* TAB 2: Email Password Form */}
                {loginTab === 'email' && (
                  <form onSubmit={handleEmailLogin} className="space-y-4">
                    <div className="flex flex-col gap-1">
                      <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="login-email">
                        Email Address
                      </label>
                      <input 
                        type="email" 
                        id="login-email"
                        value={loginEmailData.email}
                        onChange={(e) => { setLoginEmailData({ ...loginEmailData, email: e.target.value }); setErrorMsg(''); }}
                        placeholder="you@domain.com" 
                        className="w-full bg-primary/4 border border-primary/10 rounded-md px-4 py-3.5 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="login-password">
                          Password
                        </label>
                        <button 
                          type="button"
                          onClick={() => navigateToView('forgot')}
                          className="font-sans text-[11px] font-medium text-accent hover:underline bg-transparent border-none p-0 cursor-pointer"
                        >
                          Forgot Password?
                        </button>
                      </div>
                      <div className="relative">
                        <input 
                          type={showPassword ? "text" : "password"} 
                          id="login-password"
                          value={loginEmailData.password}
                          onChange={(e) => { setLoginEmailData({ ...loginEmailData, password: e.target.value }); setErrorMsg(''); }}
                          placeholder="Your password" 
                          className="w-full bg-primary/4 border border-primary/10 rounded-md pl-4 pr-10 py-3.5 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-primary/40 hover:text-primary bg-transparent border-none p-0 cursor-pointer"
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 py-1">
                      <input 
                        type="checkbox" 
                        id="rememberMe"
                        checked={loginEmailData.rememberMe}
                        onChange={(e) => setLoginEmailData({ ...loginEmailData, rememberMe: e.target.checked })}
                        className="rounded border-primary/20 text-accent focus:ring-accent w-4 h-4 bg-primary/4 cursor-pointer" 
                      />
                      <label htmlFor="rememberMe" className="font-sans text-xs text-mid font-light cursor-pointer select-none">
                        Remember me for 30 days
                      </label>
                    </div>

                    <button 
                      type="submit"
                      className="w-full py-3.5 bg-accent hover:bg-[#D49888] text-primary border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 shadow-xs"
                    >
                      Sign In
                    </button>
                  </form>
                )}

                {/* Google options divider */}
                <div className="flex items-center gap-4 text-primary/15">
                  <div className="h-[1px] bg-primary/10 flex-grow" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-primary/30">or</span>
                  <div className="h-[1px] bg-primary/10 flex-grow" />
                </div>

                {/* Google Button */}
                <button className="w-full bg-white border border-primary/10 rounded-md py-3 font-sans text-xs font-bold tracking-wider uppercase text-primary hover:bg-primary/4 hover:border-primary/20 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs">
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                    <path d="M15.68 8.18c0-.57-.05-1.11-.14-1.64H8v3.1h4.3a3.67 3.67 0 0 1-1.6 2.42v2h2.6c1.52-1.4 2.38-3.46 2.38-5.88z" fill="#4285F4" />
                    <path d="M8 16c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-2.7.75 4.8 4.8 0 0 1-4.52-3.32H.8v2.06A8 8 0 0 0 8 16z" fill="#34A853" />
                    <path d="M3.48 9.49A4.83 4.83 0 0 1 3.23 8c0-.52.09-1.02.25-1.49V4.45H.8A8 8 0 0 0 0 8c0 1.29.31 2.51.8 3.55l2.68-2.06z" fill="#FBBC05" />
                    <path d="M8 3.18c1.22 0 2.3.42 3.16 1.24l2.37-2.37A7.97 7.97 0 0 0 8 0 8 8 0 0 0 .8 4.45l2.68 2.06A4.8 4.8 0 0 1 8 3.18z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {/* Footer Toggle */}
                <div className="text-center pt-2 font-sans text-xs text-mid">
                  Don't have an account?{' '}
                  <button 
                    onClick={() => navigateToView('signup')}
                    className="text-accent bg-transparent border-none p-0 cursor-pointer font-bold hover:underline"
                  >
                    Create Account
                  </button>
                </div>

              </motion.div>
            )}

            {/* VIEW 3: OTP VERIFICATION */}
            {view === 'otp' && (
              <motion.div
                key="otp-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] md:text-[38px] leading-tight font-normal text-primary">
                    Verify Your Number
                  </h1>
                  <p className="font-sans text-sm font-light text-mid leading-relaxed">
                    Enter the 6-digit code sent to <span className="font-semibold text-primary">+91 {sentToNumber}</span>.
                  </p>
                </div>

                {errorMsg && (
                  <div className="text-accent text-xs font-sans bg-accent/5 border border-accent/15 rounded p-3">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-secondary text-xs font-sans bg-secondary/5 border border-secondary/15 rounded p-3">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleOtpVerify} className="space-y-6">
                  
                  {/* Visual OTP Input digits row */}
                  <div className="flex justify-between gap-2 md:gap-3">
                    {otpDigits.map((digit, idx) => (
                      <input 
                        key={idx}
                        ref={(el) => (otpInputsRef.current[idx] = el)}
                        type="text"
                        maxLength={2} // allow typing over to trigger change
                        value={digit}
                        onChange={(e) => handleOtpChange(idx, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                        placeholder="–"
                        className="w-12 h-14 bg-primary/4 border border-primary/10 rounded-lg text-center font-sans text-xl font-medium text-primary placeholder-primary/20 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                      />
                    ))}
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-accent hover:bg-[#D49888] text-primary border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
                  >
                    Verify OTP
                  </button>
                </form>

                {/* Resend actions block */}
                <div className="flex flex-col items-center gap-2 font-sans text-xs">
                  {canResendOtp ? (
                    <button 
                      onClick={handleResendOtp}
                      className="text-accent font-bold hover:underline bg-transparent border-none p-0 cursor-pointer"
                    >
                      Resend Code
                    </button>
                  ) : (
                    <span className="text-mid font-light">
                      Resend code in <strong className="text-primary font-medium">{otpTimer}s</strong>
                    </span>
                  )}
                </div>

              </motion.div>
            )}

            {/* VIEW 4: FORGOT PASSWORD */}
            {view === 'forgot' && (
              <motion.div
                key="forgot-view"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8"
              >
                {/* Header */}
                <div className="space-y-2">
                  <h1 className="font-serif text-[32px] md:text-[38px] leading-tight font-normal text-primary">
                    Reset Password
                  </h1>
                  <p className="font-sans text-sm font-light text-mid leading-relaxed">
                    Enter your email and we'll send reset instructions.
                  </p>
                </div>

                {errorMsg && (
                  <div className="text-accent text-xs font-sans bg-accent/5 border border-accent/15 rounded p-3">
                    {errorMsg}
                  </div>
                )}
                {successMsg && (
                  <div className="text-secondary text-xs font-sans bg-secondary/5 border border-secondary/15 rounded p-3">
                    {successMsg}
                  </div>
                )}

                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <label className="font-sans text-[10px] font-bold tracking-[0.08em] uppercase text-primary/60" htmlFor="forgot-email">
                      Email Address
                    </label>
                    <input 
                      type="email" 
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => { setForgotEmail(e.target.value); setErrorMsg(''); setSuccessMsg(''); }}
                      placeholder="you@domain.com" 
                      className="w-full bg-primary/4 border border-primary/10 rounded-md px-4 py-3.5 font-sans text-sm text-primary placeholder-primary/25 outline-none focus:border-secondary/50 focus:ring-1 focus:ring-secondary/20 transition-all shadow-inner"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full py-3.5 bg-accent hover:bg-[#D49888] text-primary border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer mt-2 shadow-xs"
                  >
                    Send Reset Link
                  </button>
                </form>

                {/* Footer Toggle */}
                <div className="text-center pt-2 font-sans text-xs text-mid">
                  Remember your password?{' '}
                  <button 
                    onClick={() => navigateToView('login')}
                    className="text-accent bg-transparent border-none p-0 cursor-pointer font-bold hover:underline"
                  >
                    Back to Login
                  </button>
                </div>

              </motion.div>
            )}

            {/* VIEW 5: ACCOUNT CREATED SUCCESS */}
            {view === 'success' && (
              <motion.div
                key="success-view"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-8 text-center"
              >
                {/* Celebratory Check Mark Visual with breathing background rings */}
                <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.6 }}
                    className="absolute inset-0 rounded-full bg-secondary/12 border border-secondary/30"
                  />
                  <motion.div 
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.6 }}
                    className="absolute w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md border border-primary/5"
                  />
                  <motion.div
                    initial={{ scale: 0.4, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                  >
                    <ShieldCheck size={40} className="text-secondary relative z-10" />
                  </motion.div>
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
                    if (window.navigateTo) {
                      window.navigateTo('/');
                    } else {
                      window.location.pathname = '/';
                    }
                  }}
                  className="w-full py-4 bg-primary hover:bg-[#2A3A3E] hover:translate-y-[-2px] text-mint-grey border-none rounded-md font-sans text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-md"
                >
                  Continue to dashboard &rarr;
                </button>

              </motion.div>
            )}

          </AnimatePresence>

        </div>

        {/* Bottom footer note */}
        <div className="w-full max-w-[420px] flex items-center justify-center gap-6 font-sans text-[11px] text-primary/45 border-t border-primary/5 pt-6 z-10">
          <span>&copy; {getCopyrightYear()} Ingress Within</span>
          <span>&middot;</span>
          <a href="#/" className="hover:text-primary transition-colors no-underline">Privacy Policy</a>
          <span>&middot;</span>
          <a href="#/" className="hover:text-primary transition-colors no-underline">Terms of Use</a>
        </div>

      </div>

    </div>
  );
}
