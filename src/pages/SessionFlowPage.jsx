import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  ArrowRight, 
  CheckCircle2, 
  ChevronRight, 
  PenLine, 
  Sparkles, 
  HeartHandshake, 
  Eye, 
  AlertCircle, 
  Sparkle,
  Compass,
  ArrowLeft
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';

const STRESSOR_OPTIONS = [
  { 
    id: 'work', 
    label: 'Work & Deadlines', 
    sampleReactive: "I'm going to fail this project deadline and everyone will think I am completely incompetent.", 
    sampleReframed: "Fact: The timeline is tight. Assumption: I will fail and be judged. Action: I can list remaining tasks, communicate roadblocks to my manager immediately, and focus on the most critical priority.",
    closingQuestion: "What is one task you can deprioritize or hand off tomorrow to create breathing room?"
  },
  { 
    id: 'health', 
    label: 'Health & Burnout', 
    sampleReactive: "I'm exhausted and can't keep up with anything. I'm falling behind and losing my grip.", 
    sampleReframed: "Fact: I am physically exhausted. Assumption: I am falling behind permanently. Action: I need to take a deliberate rest day, reset my expectations, and decline non-essential tasks this week.",
    closingQuestion: "What is one micro-boundary (like a 10-minute screens-off break) you will set for yourself tonight?"
  },
  { 
    id: 'relations', 
    label: 'Relationship Friction', 
    sampleReactive: "They didn't reply to my messages. They must be angry with me and our friendship is falling apart.", 
    sampleReframed: "Fact: They haven't responded to my text yet. Assumption: They are angry and the friendship is ending. Action: I will give them space, avoid making assumptions, and send a friendly check-in tomorrow.",
    closingQuestion: "If you were to communicate your need directly rather than hoping they guess it, what would you say?"
  },
  { 
    id: 'future', 
    label: 'Uncertain Future', 
    sampleReactive: "I don't know where my career is going. Everything feels unstable and I'm going to end up stuck.", 
    sampleReframed: "Fact: Career paths are non-linear and I am currently in a transition. Assumption: I will end up stuck. Action: I will identify three core skills I enjoy using and dedicate one hour a day to researching opportunities in those areas.",
    closingQuestion: "What is one small decision or action you can take in the next 24 hours that is fully within your control?"
  }
];

const EMOTION_MAP = [
  { word: 'overwhelmed', label: 'Stress / Overwhelm', color: 'bg-accent text-primary border-accent/25 shadow-[0_0_12px_rgba(224,168,152,0.25)]', type: 'tense' },
  { word: 'anxious', label: 'Anxiety', color: 'bg-supporting text-primary border-supporting/25 shadow-[0_0_12px_rgba(184,168,212,0.25)]', type: 'tense' },
  { word: 'tension', label: 'Anxiety', color: 'bg-supporting text-primary border-supporting/25 shadow-[0_0_12px_rgba(184,168,212,0.25)]', type: 'tense' },
  { word: 'worry', label: 'Anxiety', color: 'bg-supporting text-primary border-supporting/25 shadow-[0_0_12px_rgba(184,168,212,0.25)]', type: 'tense' },
  { word: 'refocused', label: 'Clarity / Focus', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'walk', label: 'Mindfulness', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'nature', label: 'Mindfulness', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'calm', label: 'Mindfulness', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'better', label: 'Agency / Growth', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'control', label: 'Agency / Growth', color: 'bg-secondary text-primary border-secondary/25 shadow-[0_0_12px_rgba(141,191,180,0.25)]', type: 'growth' },
  { word: 'happy', label: 'Joy', color: 'bg-accent text-primary border-accent/25 shadow-[0_0_12px_rgba(224,168,152,0.25)]', type: 'growth' },
  { word: 'excited', label: 'Joy', color: 'bg-accent text-primary border-accent/25 shadow-[0_0_12px_rgba(224,168,152,0.25)]', type: 'growth' },
  { word: 'tired', label: 'Fatigue', color: 'bg-primary/10 text-primary border-primary/20 shadow-sm', type: 'tense' },
  { word: 'exhausted', label: 'Fatigue', color: 'bg-primary/10 text-primary border-primary/20 shadow-sm', type: 'tense' },
];

const STAGE_ORDER = ['start', 'exercise', 'interpretation', 'write', 'closing', 'complete'];

export default function SessionFlowPage({ user, profile, onSignOut }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentStage, setCurrentStage] = useState('start');
  const [targetStageAfterSustained, setTargetStageAfterSustained] = useState('start');
  const [crisisType, setCrisisType] = useState(null);

  // Dashboard context data (for yesterday's entry and open threads)
  const [dashboardData, setDashboardData] = useState(null);

  // Autosave and Collapsible Panel states
  const [autosaveStatus, setAutosaveStatus] = useState('Idle'); // 'Idle' | 'Saving' | 'Saved' | 'Error'
  const [lastAutosavedAt, setLastAutosavedAt] = useState(null);
  const [showYesterday, setShowYesterday] = useState(false);
  const [showThread, setShowThread] = useState(false);

  // Input states (bound to current step/drafts)
  const [selectedStressor, setSelectedStressor] = useState(null);
  const [reactiveText, setReactiveText] = useState('');
  const [reframedText, setReframedText] = useState('');
  const [journalText, setJournalText] = useState('');
  const [closingResponse, setClosingResponse] = useState('');
  const [clarityScore, setClarityScore] = useState(30);

  // Loading/saving actions
  const [isSaving, setIsSaving] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [transitioning, setTransitioning] = useState(false);

  // Linguistic analysis states
  const [detectedEmotions, setDetectedEmotions] = useState([]);
  const [sentimentStats, setSentimentStats] = useState({ tense: 0, growth: 0, neutral: 100 });

  // Breathing Guide state
  const [breathPhase, setBreathPhase] = useState('Inhale'); // 'Inhale' | 'Hold' | 'Exhale'
  const [breathCount, setBreathCount] = useState(4);

  // DB recap states (loaded if today is already completed)
  const [exerciseRecap, setExerciseRecap] = useState(null);
  const [journalRecap, setJournalRecap] = useState(null);

  // 1. Check path & Load State from Supabase
  const loadSession = async () => {
    setIsLoading(true);
    try {
      const data = await DashboardService.fetchActiveSession();
      
      // Load general dashboard context (for yesterday's entry and open threads)
      try {
        const dData = await DashboardService.fetchDashboardData();
        setDashboardData(dData);
      } catch (dErr) {
        console.warn('Could not load dashboard context:', dErr);
      }
      
      let initialStage = 'start';
      if (data.exists) {
        if (data.isCompletedToday) {
          setSession(data.session);
          setExerciseRecap(data.exercise);
          setJournalRecap(data.journal);
          initialStage = 'complete';
        } else if (data.session && data.session.status !== 'complete') {
          const activeSession = data.session;
          setSession(activeSession);
          initialStage = activeSession.status;
          
          // Load draft values, merging DB session_data and localStorage backup
          let draft = activeSession.session_data || {};
          const localDraftRaw = localStorage.getItem(`iw_session_draft_${activeSession.id}`);
          if (localDraftRaw) {
            try {
              const localDraft = JSON.parse(localDraftRaw);
              draft = { ...draft, ...localDraft };
              console.log('[SessionFlow] Loaded draft merged with localStorage backup.');
            } catch (e) {
              console.error('Failed to parse local draft:', e);
            }
          }

          if (draft.selectedStressor) {
            setSelectedStressor(draft.selectedStressor);
          }
          setReactiveText(draft.reactiveText || '');
          setReframedText(draft.reframedText || '');
          setJournalText(draft.journalText || '');
          setClosingResponse(draft.closingResponse || '');
          setClarityScore(draft.clarityScore || 30);
        }
      }

      setTargetStageAfterSustained(initialStage);

      if (user?.sustained_distress_flag && sessionStorage.getItem('iw_sustained_acknowledged') !== 'true') {
        setCurrentStage('sustained_distress');
      } else {
        setCurrentStage(initialStage);
        if (initialStage === 'complete') {
          if (window.location.pathname !== '/session/complete') {
            window.history.replaceState({}, '', '/session/complete');
          }
        } else if (data.exists) {
          const expectedPath = `/session/${initialStage}`;
          if (window.location.pathname !== expectedPath) {
            window.history.replaceState({}, '', expectedPath);
          }
        } else {
          if (window.location.pathname !== '/session/start') {
            window.history.replaceState({}, '', '/session/start');
          }
        }
      }
    } catch (err) {
      console.error('Failed to load session progress:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSession();

    // Listen to history popstate changes
    const handlePopState = () => {
      const subpath = window.location.pathname.replace('/session/', '');
      if (STAGE_ORDER.includes(subpath)) {
        // Enforce step guard: cannot jump forward past the DB step status
        if (session) {
          const dbIndex = STAGE_ORDER.indexOf(session.status);
          const destIndex = STAGE_ORDER.indexOf(subpath);
          if (destIndex > dbIndex) {
            // Guard: block skip ahead
            window.history.replaceState({}, '', `/session/${session.status}`);
            setCurrentStage(session.status);
          } else {
            setCurrentStage(subpath);
          }
        } else if (subpath !== 'start') {
          window.history.replaceState({}, '', '/session/start');
          setCurrentStage('start');
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [session?.status]);

  // 1.5. Journal 5-Second Autosave and Manual Save Mechanics
  const journalTextRef = useRef(journalText);
  useEffect(() => {
    journalTextRef.current = journalText;
  }, [journalText]);

  useEffect(() => {
    if (currentStage !== 'write' || !session) return;

    let lastSavedText = journalText;

    const interval = setInterval(async () => {
      const textToSave = journalTextRef.current;
      if (textToSave === lastSavedText) return; // Skip if no change

      setAutosaveStatus('Saving');
      try {
        const draft = {
          selectedStressor,
          reactiveText,
          reframedText,
          journalText: textToSave,
          closingResponse,
          clarityScore
        };
        await DashboardService.saveSessionStep('write', draft);
        lastSavedText = textToSave;
        setAutosaveStatus('Saved');
        setLastAutosavedAt(new Date().toLocaleTimeString());
        
        setTimeout(() => {
          setAutosaveStatus(prev => prev === 'Saved' ? 'Idle' : prev);
        }, 3000);
      } catch (err) {
        console.error('Autosave failed:', err);
        setAutosaveStatus('Error');
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [currentStage, session?.id]);

  const handleManualSave = async () => {
    if (!session) return;
    setAutosaveStatus('Saving');
    try {
      const draft = {
        selectedStressor,
        reactiveText,
        reframedText,
        journalText,
        closingResponse,
        clarityScore
      };
      await DashboardService.saveSessionStep('write', draft);
      setAutosaveStatus('Saved');
      setLastAutosavedAt(new Date().toLocaleTimeString());
      setTimeout(() => {
        setAutosaveStatus(prev => prev === 'Saved' ? 'Idle' : prev);
      }, 3000);
    } catch (err) {
      console.error('Manual save failed:', err);
      setAutosaveStatus('Error');
    }
  };

  // 2. Breath Cycle Animation Timer
  useEffect(() => {
    if (currentStage !== 'start') return;
    
    const interval = setInterval(() => {
      setBreathCount((prev) => {
        if (prev <= 1) {
          // Phase Shift
          setBreathPhase((phase) => {
            if (phase === 'Inhale') return 'Hold';
            if (phase === 'Hold') return 'Exhale';
            return 'Inhale';
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentStage, breathPhase]);

  // 3. Live linguistic analysis for Writing step
  useEffect(() => {
    if (currentStage !== 'write') return;

    const found = [];
    let tenseCount = 0;
    let growthCount = 0;

    EMOTION_MAP.forEach((item) => {
      if (journalText.toLowerCase().includes(item.word)) {
        if (!found.some(f => f.label === item.label)) {
          found.push(item);
        }
        if (item.type === 'tense') tenseCount++;
        if (item.type === 'growth') growthCount++;
      }
    });

    setDetectedEmotions(found);

    const total = tenseCount + growthCount;
    if (total > 0) {
      const tensePct = Math.round((tenseCount / total) * 100);
      const growthPct = 100 - tensePct;
      setSentimentStats({ tense: tensePct, growth: growthPct, neutral: 0 });
    } else {
      setSentimentStats({ tense: 0, growth: 0, neutral: 100 });
    }
  }, [journalText, currentStage]);

  // Local cache auto-saver (Debounced for quick recovery if tab closed)
  useEffect(() => {
    if (isLoading || !session) return;

    const saveTimeout = setTimeout(() => {
      const currentDraft = {
        selectedStressor,
        reactiveText,
        reframedText,
        journalText,
        closingResponse,
        clarityScore
      };
      localStorage.setItem(`iw_session_draft_${session.id}`, JSON.stringify(currentDraft));
    }, 500);

    return () => clearTimeout(saveTimeout);
  }, [selectedStressor, reactiveText, reframedText, journalText, closingResponse, clarityScore, session?.id, isLoading]);

  // 4. Action Handlers for Step Transitions
  const handleStartSession = async () => {
    setIsSaving(true);
    try {
      const data = await DashboardService.startSession();
      setSession(data.session);
      
      // Navigate to /session/exercise
      window.history.pushState({}, '', '/session/exercise');
      setCurrentStage('exercise');
    } catch (err) {
      console.error(err);
      alert('Could not start daily session. Please check your connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const saveStepProgress = async (nextStage, draftData) => {
    setIsSaving(true);
    try {
      const data = await DashboardService.saveSessionStep(nextStage, draftData);
      setSession(data.session);
      window.history.pushState({}, '', `/session/${nextStage}`);
      setCurrentStage(nextStage);
    } catch (err) {
      console.error(err);
      alert('Could not save progress. Please check connection.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStressorSelect = (option) => {
    setSelectedStressor(option);
    setReactiveText(option.sampleReactive);
    setClarityScore(30);
  };

  const handleFinishExercise = () => {
    const draft = {
      selectedStressor,
      reactiveText,
      reframedText: selectedStressor.sampleReframed,
      journalText,
      closingResponse,
      clarityScore: 30
    };
    setReframedText(selectedStressor.sampleReframed);
    saveStepProgress('interpretation', draft);
  };

  const handleFinishInterpretation = () => {
    // Animate Index Growth
    setClarityScore(85);
    setTimeout(() => {
      const draft = {
        selectedStressor,
        reactiveText,
        reframedText,
        journalText,
        closingResponse,
        clarityScore: 85
      };
      saveStepProgress('write', draft);
    }, 400);
  };

  const handleFinishJournal = () => {
    // Show Transition Screen
    setTransitioning(true);
    const draft = {
      selectedStressor,
      reactiveText,
      reframedText,
      journalText,
      closingResponse,
      clarityScore
    };
    
    // Save step to database as 'closing'
    DashboardService.saveSessionStep('closing', draft)
      .then((data) => {
        setSession(data.session);
        // Keep screen visible for 2.2 seconds for calming transition
        setTimeout(() => {
          setTransitioning(false);
          window.history.pushState({}, '', '/session/closing');
          setCurrentStage('closing');
        }, 2200);
      })
      .catch((err) => {
        console.error(err);
        setTransitioning(false);
        alert('Could not save progress. Please try again.');
      });
  };

  const handleCompleteSession = async () => {
    setIsSaving(true);
    setCurrentStage('polling_patterns');
    try {
      const payload = {
        exercise: {
          stressor_type: selectedStressor.id,
          reactive_thought: reactiveText,
          reframed_thought: reframedText,
          clarity_score: clarityScore
        },
        journal: {
          content: journalText
        },
        closing_response: closingResponse
      };

      const data = await DashboardService.completeSession(payload);
      setSession(data.session);
      setExerciseRecap(data.exercise);
      setJournalRecap(data.journal);
      
      // Clear local storage cache
      localStorage.removeItem(`iw_session_draft_${session?.id}`);

      // If a journal entry exists, poll its status to check for crisis
      if (data.journal?.id) {
        const startTime = Date.now();
        const pollInterval = setInterval(async () => {
          try {
            const entryStatus = await DashboardService.checkEntryStatus(data.journal.id);
            const elapsed = Date.now() - startTime;
            
            if ((entryStatus.scoring_status === 'scored' && entryStatus.crisis_checked) || elapsed > 12000) {
              clearInterval(pollInterval);
              setIsSaving(false);
              
              if (entryStatus.crisis_flag) {
                setCrisisType(entryStatus.crisis_type);
                setCurrentStage('crisis');
              } else {
                window.history.pushState({}, '', '/session/complete');
                setCurrentStage('complete');
              }
            }
          } catch (pollErr) {
            console.warn('Error polling daily entry status:', pollErr);
            if (Date.now() - startTime > 12000) {
              clearInterval(pollInterval);
              setIsSaving(false);
              window.history.pushState({}, '', '/session/complete');
              setCurrentStage('complete');
            }
          }
        }, 800);
      } else {
        setIsSaving(false);
        window.history.pushState({}, '', '/session/complete');
        setCurrentStage('complete');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to lock session. Please try again.');
      setCurrentStage('closing');
      setIsSaving(false);
    }
  };

  // Helper getters
  const wordCount = journalText.trim().split(/\s+/).filter(Boolean).length;
  const dayNumber = session?.day_number || 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mint-grey flex flex-col justify-center items-center font-sans space-y-4 text-center">
        <div className="relative w-20 h-20 flex items-center justify-center pointer-events-none mb-2">
          <div className="absolute w-16 h-16 rounded-full border border-secondary/20 animate-ping" />
          <div className="absolute w-12 h-12 rounded-full border border-accent/20 animate-pulse" />
          <svg className="w-8 h-8 text-primary animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="2" fill="currentColor"/>
            <path d="M16 10 Q19 13 16 16 Q13 19 16 22" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          </svg>
        </div>
        <p className="text-mid font-serif italic text-sm animate-pulse">Settle in. Let the mind arrive...</p>
      </div>
    );
  }

  // Render Transition Screen
  if (transitioning) {
    return (
      <div className="min-h-screen bg-mint-grey flex flex-col justify-center items-center text-center px-6 font-serif">
        <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
          <div className="absolute w-20 h-20 rounded-full border border-secondary/40 animate-[spin_4s_linear_infinite]" />
          <div className="absolute w-16 h-16 rounded-full border-t border-accent/60 animate-[spin_2s_ease-in-out_infinite]" />
          <Sparkle size={20} className="text-accent animate-pulse" />
        </div>
        <h2 className="text-xl text-primary font-normal mb-2">Integrating entry patterns...</h2>
        <p className="text-xs text-mid max-w-xs leading-relaxed font-sans">
          Your reflection is being mapped. Prepare for a final closing inquiry.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <DashboardNavbar activeTab="dashboard" />

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center py-10 px-6">
        <div className="max-w-[720px] w-full bg-white rounded-premium border border-primary/5 shadow-[0_12px_48px_rgba(30,42,46,0.03)] overflow-hidden min-h-[520px] flex flex-col justify-between p-6 md:p-8">
          
          {/* Header Step Indicator */}
          {currentStage !== 'complete' && (
            <div className="flex justify-between items-center border-b border-primary/5 pb-4 mb-6 select-none">
              <div className="flex items-center gap-2 text-primary">
                <Brain size={16} className="text-accent" />
                <span className="text-[10px] uppercase font-bold tracking-widest font-sans">
                  Day {dayNumber} Session
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {STAGE_ORDER.slice(0, 5).map((stage, idx) => {
                  const activeIdx = STAGE_ORDER.indexOf(currentStage);
                  return (
                    <div 
                      key={stage}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === activeIdx 
                          ? 'w-5 bg-accent' 
                          : idx < activeIdx 
                          ? 'w-2 bg-secondary' 
                          : 'w-2 bg-primary/10'
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* Core Flow Views */}
          <div className="flex-1 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              
              {/* --- VIEW: START --- */}
              {currentStage === 'start' && (
                <motion.div
                  key="start"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center space-y-8 py-4"
                >
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block">DAILY ALIGNMENT</span>
                    <h2 className="font-serif text-3xl text-primary font-normal leading-tight">Before we begin today.</h2>
                    <p className="text-xs text-mid max-w-sm mx-auto leading-relaxed">
                      Find a quiet space, sit comfortably, and synchronize your breathing with the circle below.
                    </p>
                  </div>

                  {/* Breathing Pulse Circle */}
                  <div className="flex justify-center py-4">
                    <div className="relative w-40 h-40 flex items-center justify-center">
                      <motion.div 
                        className="absolute rounded-full bg-secondary/10 border border-secondary/20"
                        animate={{ 
                          scale: breathPhase === 'Inhale' ? 1.5 : breathPhase === 'Hold' ? 1.5 : 0.8,
                          opacity: breathPhase === 'Hold' ? 0.9 : 0.6
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        style={{ width: '90px', height: '90px' }}
                      />
                      <motion.div 
                        className="absolute rounded-full bg-accent/20 border border-accent/30"
                        animate={{ 
                          scale: breathPhase === 'Inhale' ? 1.2 : breathPhase === 'Hold' ? 1.2 : 0.95,
                        }}
                        transition={{ duration: 4, ease: "easeInOut" }}
                        style={{ width: '60px', height: '60px' }}
                      />
                      <div className="z-10 flex flex-col items-center">
                        <span className="text-[11px] uppercase tracking-widest font-bold text-primary font-sans">{breathPhase}</span>
                        <span className="text-2xl font-serif mt-1 font-semibold">{breathCount}</span>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={handleStartSession}
                    disabled={isSaving}
                    className="mx-auto flex items-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-8 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    <span>Begin Session</span>
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              )}

              {/* --- VIEW: EXERCISE --- */}
              {currentStage === 'exercise' && (
                <motion.div
                  key="exercise"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Step 01 — Cognitive Reframing</span>
                    <h3 className="font-serif text-2xl font-normal text-primary">Acknowledge a stress trigger.</h3>
                    <p className="text-xs text-mid max-w-md leading-relaxed">
                      Select the category that matches your core stressor today, then type your unfiltered automatic reaction.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                    {STRESSOR_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => handleStressorSelect(opt)}
                        className={`p-3 text-left border rounded-xl transition-all font-sans cursor-pointer flex flex-col justify-between h-[80px] ${
                          selectedStressor?.id === opt.id 
                            ? 'border-secondary bg-secondary/5 text-primary' 
                            : 'border-primary/5 hover:border-secondary bg-surface-container-low hover:bg-[#F8FBFA]'
                        }`}
                      >
                        <span className="text-xs font-semibold">{opt.label}</span>
                        <ChevronRight size={14} className={`self-end transition-transform ${selectedStressor?.id === opt.id ? 'translate-x-0.5 text-secondary' : 'text-primary/20'}`} />
                      </button>
                    ))}
                  </div>

                  {selectedStressor && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-2.5"
                    >
                      <label className="text-[9px] uppercase font-bold tracking-widest text-secondary">YOUR UNFILTERED REACTION</label>
                      <div className="bg-[#FBFBFB] border border-primary/5 rounded-xl p-4 relative">
                        <textarea
                          value={reactiveText}
                          onChange={(e) => setReactiveText(e.target.value)}
                          placeholder="Type the reactive, all-or-nothing thought exactly as it occurred in your mind..."
                          className="w-full bg-transparent border-0 outline-none resize-none font-serif text-[14px] italic leading-relaxed text-primary focus:ring-0 p-0 h-20"
                        />
                      </div>
                      <span className="text-[10px] text-mid/60 font-sans italic block">
                        Must be at least 15 characters to reframe.
                      </span>
                    </motion.div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/session/start');
                        setCurrentStage('start');
                      }}
                      className="font-semibold text-xs tracking-wider uppercase border border-primary/10 py-3.5 px-6 rounded-xl hover:bg-primary/5 transition-all text-primary/70 cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleFinishExercise}
                      disabled={!selectedStressor || reactiveText.trim().length < 15 || isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <span>Begin Reframing</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- VIEW: INTERPRETATION --- */}
              {currentStage === 'interpretation' && (
                <motion.div
                  key="interpretation"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Step 02 — Objective Reframing</span>
                    <h3 className="font-serif text-2xl font-normal text-primary">Fact vs. Assumption.</h3>
                    <p className="text-xs text-mid leading-relaxed">
                      We rebuild the reaction by stripping out cognitive distortions and defining an actionable step.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="bg-mint-grey border border-primary/5 rounded-xl p-4 space-y-1">
                      <span className="text-[9px] uppercase font-bold tracking-widest text-[#E0A898]">AUTOMATIC REACTION</span>
                      <p className="font-serif text-xs leading-relaxed italic text-primary/75">
                        "{reactiveText}"
                      </p>
                    </div>

                    <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-4.5 space-y-2">
                      <div className="flex items-center gap-1.5 text-secondary font-bold text-[10px] tracking-widest uppercase">
                        <CheckCircle2 size={12} />
                        <span>REFRAMED RESPONSE</span>
                      </div>
                      <p className="font-serif text-[13.5px] leading-relaxed text-primary italic">
                        {reframedText}
                      </p>
                    </div>
                  </div>

                  {/* Clarity Index progress */}
                  <div className="border-t border-primary/5 pt-4">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-secondary mb-1.5">
                      <span>COGNITIVE CLARITY INDEX</span>
                      <span className="text-primary">{clarityScore}% ({clarityScore > 50 ? 'Clear Mind' : 'Cognitive Fog'})</span>
                    </div>
                    <div className="w-full bg-primary/5 h-2 rounded-full overflow-hidden">
                      <motion.div 
                        className={`h-full ${clarityScore > 50 ? 'bg-secondary' : 'bg-accent/60'}`}
                        initial={{ width: '30%' }}
                        animate={{ width: `${clarityScore}%` }}
                        transition={{ duration: 0.6 }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/session/exercise');
                        setCurrentStage('exercise');
                      }}
                      className="font-semibold text-xs tracking-wider uppercase border border-primary/10 py-3.5 px-6 rounded-xl hover:bg-primary/5 transition-all text-primary/70 cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleFinishInterpretation}
                      disabled={isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer"
                    >
                      <span>Carry into Journal</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- VIEW: WRITE --- */}
              {currentStage === 'write' && (
                <motion.div
                  key="write"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary">Step 03 — Free Journal Writing</span>
                    <h3 className="font-serif text-2xl font-normal text-primary">Unburden the thoughts.</h3>
                    <p className="text-xs text-mid leading-relaxed">
                      Write down whatever is resting on your mind. Refer to your prompt and historical contexts below.
                    </p>
                  </div>

                  {/* Context Panel containing Prompt, Yesterday, Open Thread */}
                  <div className="space-y-3 select-none">
                    {/* 1. Today's Reframed Focus (Prompt) */}
                    {reframedText && (
                      <div className="bg-secondary/5 border border-secondary/15 rounded-xl p-4">
                        <div className="flex items-center gap-1.5 text-secondary font-bold text-[9px] tracking-widest uppercase mb-1">
                          <Brain size={12} />
                          <span>Today's Prompt (Reframed Focus)</span>
                        </div>
                        <p className="font-serif italic text-xs leading-relaxed text-primary">
                          "{reframedText}"
                        </p>
                      </div>
                    )}

                    {/* 2. Yesterday's Context */}
                    {dashboardData?.entries?.[0] && (
                      <div className="border border-primary/5 rounded-xl bg-white overflow-hidden transition-all">
                        <button 
                          onClick={() => setShowYesterday(!showYesterday)}
                          type="button"
                          className="w-full flex justify-between items-center p-3 text-left hover:bg-mint-grey/30 cursor-pointer transition-colors"
                        >
                          <span className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                            <PenLine size={12} />
                            Yesterday's Context
                          </span>
                          <span className="text-[10px] text-mid/60 font-sans font-semibold">
                            {showYesterday ? 'Hide Context' : 'Reveal Context'}
                          </span>
                        </button>
                        <AnimatePresence>
                          {showYesterday && (
                            <motion.div 
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              className="border-t border-primary/5 p-4 bg-[#FBFBFB] text-xs font-serif leading-relaxed italic text-mid"
                            >
                              "{dashboardData.entries[0].text}"
                              <div className="text-[9px] uppercase tracking-wider text-mid/45 mt-2 font-sans font-bold">
                                {dashboardData.entries[0].day} · {dashboardData.entries[0].words} words
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}

                    {/* 3. Open Thread Context */}
                    {dashboardData?.threads?.find(t => t.status !== 'addressed') && (() => {
                      const activeT = dashboardData.threads.find(t => t.status !== 'addressed');
                      return (
                        <div className="border border-primary/5 rounded-xl bg-white overflow-hidden transition-all">
                          <button 
                            onClick={() => setShowThread(!showThread)}
                            type="button"
                            className="w-full flex justify-between items-center p-3 text-left hover:bg-mint-grey/30 cursor-pointer transition-colors"
                          >
                            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                              <Compass size={12} />
                              Open Thread Context
                            </span>
                            <span className="text-[10px] text-mid/60 font-sans font-semibold">
                              {showThread ? 'Hide Context' : 'Reveal Context'}
                            </span>
                          </button>
                          <AnimatePresence>
                            {showThread && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                className="border-t border-primary/5 p-4 bg-[#FBFBFB] space-y-2"
                              >
                                <p className="text-xs font-serif leading-relaxed italic text-secondary">
                                  "{activeT.question}"
                                </p>
                                <div className="text-[10.5px] leading-relaxed text-mid bg-white p-2.5 rounded border border-primary/5 font-sans">
                                  <strong>Context:</strong> {activeT.context}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Large Distraction-Free Editor */}
                  <div className="flex-1 flex flex-col min-h-[300px] border border-primary/5 rounded-xl bg-[#FBFBFB] p-5 relative">
                    <textarea
                      value={journalText}
                      onChange={(e) => setJournalText(e.target.value)}
                      placeholder="Start typing today's journal entry. The writing space is distraction-free to encourage natural, unedited reflection..."
                      className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-serif text-[15px] leading-loose text-primary focus:ring-0 p-0 placeholder-primary/25 caret-accent min-h-[220px]"
                      autoFocus
                    />
                    
                    {/* Status & Word Count Footer */}
                    <div className="pt-3.5 border-t border-primary/5 flex justify-between items-center text-[10.5px] text-mid/60 font-sans mt-3 relative">
                      <div className="flex items-center gap-2 font-medium">
                        <span>{wordCount} words</span>
                        <span className="opacity-40">|</span>
                        <span>{journalText.length} characters</span>
                      </div>
                      
                      {/* Autosave Status Indicator */}
                      <div className="absolute right-0 top-[14px] flex items-center gap-1.5 font-sans text-[10px] h-[16px] pointer-events-none select-none">
                        {autosaveStatus === 'Saving' && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                            <span className="text-accent italic font-semibold">Autosaving...</span>
                          </>
                        )}
                        {autosaveStatus === 'Saved' && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                            <span className="text-secondary font-semibold">Saved {lastAutosavedAt ? `at ${lastAutosavedAt}` : ''}</span>
                          </>
                        )}
                        {autosaveStatus === 'Idle' && lastAutosavedAt && (
                          <span className="text-mid/45">Saved at {lastAutosavedAt}</span>
                        )}
                        {autosaveStatus === 'Error' && (
                          <>
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            <span className="text-red-400 font-semibold">Autosave failed</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Controls */}
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/session/interpretation');
                        setCurrentStage('interpretation');
                      }}
                      className="font-semibold text-xs tracking-wider uppercase border border-primary/10 py-3.5 px-6 rounded-xl hover:bg-primary/5 transition-all text-primary/70 cursor-pointer text-center"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleManualSave}
                      disabled={isSaving}
                      className="sm:px-6 py-3.5 border border-[#1E2A2E]/15 rounded-xl text-xs font-semibold text-mid hover:bg-mint-grey transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      Save Draft
                    </button>
                    <button 
                      onClick={handleFinishJournal}
                      disabled={wordCount < 5 || isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-35 disabled:cursor-not-allowed"
                    >
                      <span>Save & Continue</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- VIEW: CLOSING --- */}
              {currentStage === 'closing' && (
                <motion.div
                  key="closing"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="space-y-6"
                >
                  <div className="space-y-1.5 text-center md:text-left">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block">Step 04 — Closing Question</span>
                    <h3 className="font-serif text-2xl font-normal text-primary">Carry this out with you.</h3>
                    <p className="text-xs text-mid max-w-md leading-relaxed">
                      Reflect on today's core reframing and write a brief commitment to support your clarity.
                    </p>
                  </div>

                  <div className="border-l-[2.5px] border-accent pl-4 py-1 space-y-1">
                    <span className="text-[9px] uppercase font-bold tracking-widest text-secondary">TARGETED QUESTION FOR TODAY</span>
                    <p className="font-serif italic text-[16px] text-[#E0A898] leading-relaxed">
                      "{selectedStressor?.closingQuestion || "What is one small decision or action you can control today?"}"
                    </p>
                  </div>

                  <div className="bg-[#FBFBFB] border border-primary/5 rounded-xl p-4">
                    <textarea
                      value={closingResponse}
                      onChange={(e) => setClosingResponse(e.target.value)}
                      placeholder="Write your commitment or reflection here..."
                      className="w-full bg-transparent border-0 outline-none resize-none font-sans text-xs leading-relaxed text-primary focus:ring-0 p-0 h-20 placeholder-primary/25"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button 
                      onClick={() => {
                        window.history.pushState({}, '', '/session/write');
                        setCurrentStage('write');
                      }}
                      className="font-semibold text-xs tracking-wider uppercase border border-primary/10 py-3.5 px-6 rounded-xl hover:bg-primary/5 transition-all text-primary/70 cursor-pointer"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleCompleteSession}
                      disabled={!closingResponse.trim() || isSaving}
                      className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-6 rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-35"
                    >
                      <span>Complete Session</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- VIEW: COMPLETE (Celebration/Recap) --- */}
              {currentStage === 'complete' && (
                <motion.div
                  key="complete"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="text-center space-y-6 py-6"
                >
                  <div className="flex justify-center">
                    <motion.div 
                      initial={{ scale: 0.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 260, 
                        damping: 20,
                        delay: 0.2
                      }}
                      className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary-dark mb-1"
                    >
                      <CheckCircle2 size={36} />
                    </motion.div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block">SESSION SECURED & LOCKED</span>
                    <h2 className="font-serif text-3xl text-primary font-normal">Day {dayNumber} Session Complete.</h2>
                    <p className="text-xs text-mid max-w-sm mx-auto leading-relaxed">
                      Thank you for settling in. Your thoughts have been reframed, analyzed, and filed into your Cycle 2 records.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 max-w-md mx-auto py-3">
                    <div className="bg-mint-grey rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[9px] uppercase font-bold text-secondary">REFRAMED</span>
                      <span className="text-[13px] font-semibold text-primary mt-1 capitalize">
                        {selectedStressor?.id || exerciseRecap?.stressor_type || 'General'}
                      </span>
                    </div>
                    <div className="bg-mint-grey rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[9px] uppercase font-bold text-secondary">JOURNAL</span>
                      <span className="text-[13px] font-semibold text-primary mt-1 font-mono">
                        {wordCount || journalRecap?.word_count || 0} words
                      </span>
                    </div>
                    <div className="bg-mint-grey rounded-xl p-3 flex flex-col justify-center">
                      <span className="text-[9px] uppercase font-bold text-secondary">CLARITY</span>
                      <span className="text-[13px] font-semibold text-primary mt-1">
                        {clarityScore || exerciseRecap?.clarity_score || 85}%
                      </span>
                    </div>
                  </div>

                  <div className="max-w-md mx-auto text-left bg-secondary/5 border border-secondary/15 rounded-xl p-4.5 space-y-2">
                    <span className="text-[9px] uppercase font-bold text-secondary block tracking-wider">YOUR REFRAMED FOCUS</span>
                    <p className="font-serif italic text-xs leading-relaxed text-primary">
                      "{reframedText || exerciseRecap?.reframed_thought}"
                    </p>
                  </div>

                  <button 
                    onClick={() => window.navigateTo('/dashboard')}
                    className="mx-auto flex items-center justify-center gap-1.5 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase py-3.5 px-10 rounded-xl transition-all shadow-sm cursor-pointer mt-4"
                  >
                    <span>Return to Dashboard</span>
                  </button>
                </motion.div>
              )}

              {/* --- VIEW: POLLING PATTERNS (Loading) --- */}
              {currentStage === 'polling_patterns' && (
                <motion.div
                  key="polling"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 space-y-4"
                >
                  <div className="flex gap-1.5 justify-center mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8D4] animate-[pulse_1.4s_ease-in-out_infinite]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8D4] animate-[pulse_1.4s_ease-in-out_infinite_0.2s]" />
                    <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8D4] animate-[pulse_1.4s_ease-in-out_infinite_0.4s]" />
                  </div>
                  <p className="text-sm text-[#8DBFB4] italic font-serif">Reading patterns...</p>
                </motion.div>
              )}

              {/* --- VIEW: CRISIS (Immediate Crisis Support Screen) --- */}
              {currentStage === 'crisis' && (
                <motion.div
                  key="crisis"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto space-y-6 text-left"
                >
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                      <HeartHandshake size={24} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-serif text-2xl text-primary font-normal text-center">Please take a moment</h2>
                    <p className="text-sm text-primary leading-relaxed font-serif text-center">
                      {crisisType === 'Risk_Language'
                        ? "What you wrote suggests you may be thinking about hurting yourself or ending your life. Please don’t go through this alone — reach out to someone who can help."
                        : "We noticed today’s entry carries a lot of weight. Before we continue — you don’t have to hold this alone. If things feel overwhelming right now, please reach out to someone who can help."
                      }
                    </p>
                  </div>

                  <div className="border-t border-b border-[#1E2A2E]/10 py-5 space-y-3">
                    <span className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold block">Confidential Support Resources</span>
                    
                    <div className="grid gap-2.5">
                      <a href="tel:9152987821" className="flex items-center justify-between p-3.5 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left decoration-none">
                        <div>
                          <div className="font-semibold text-xs text-primary">iCall (India)</div>
                          <div className="text-[10px] text-mid">Counselling Helpline · Mon–Sat · 8am–10pm</div>
                        </div>
                        <span className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] uppercase font-bold rounded-full">Call</span>
                      </a>

                      <a href="tel:18602662345" className="flex items-center justify-between p-3.5 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left decoration-none">
                        <div>
                          <div className="font-semibold text-xs text-primary">Vandrevala Foundation</div>
                          <div className="text-[10px] text-mid">Mental health support · 24/7 · Free & Confidential</div>
                        </div>
                        <span className="px-2 py-0.5 bg-[#8DBFB4]/15 text-[#1A5040] text-[9px] uppercase font-bold rounded-full">24 / 7</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => window.navigateTo('/dashboard')}
                      className="w-full py-3 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer border-none"
                    >
                      I am okay to continue
                    </button>
                  </div>
                </motion.div>
              )}

              {/* --- VIEW: SUSTAINED DISTRESS (Sustained Distress Support Screen) --- */}
              {currentStage === 'sustained_distress' && (
                <motion.div
                  key="sustained_distress"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto space-y-6 text-left"
                >
                  <div className="flex justify-center">
                    <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                      <HeartHandshake size={24} />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h2 className="font-serif text-2xl text-primary font-normal text-center">A gentle note</h2>
                    <p className="text-sm text-primary leading-relaxed font-serif text-center">
                      Over the past week your entries have been carrying something heavy. That’s okay — this is what the platform is here for. If it ever feels like too much, there are people who can help beyond what we can offer here.
                    </p>
                  </div>

                  <div className="border-t border-b border-[#1E2A2E]/10 py-5 space-y-3">
                    <span className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold block">Confidential Support Resources</span>
                    
                    <div className="grid gap-2.5">
                      <a href="tel:9152987821" className="flex items-center justify-between p-3.5 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left decoration-none">
                        <div>
                          <div className="font-semibold text-xs text-primary">iCall (India)</div>
                          <div className="text-[10px] text-mid">Counselling Helpline · Mon–Sat · 8am–10pm</div>
                        </div>
                        <span className="px-2 py-0.5 bg-primary/5 text-primary text-[9px] uppercase font-bold rounded-full">Call</span>
                      </a>

                      <a href="tel:18602662345" className="flex items-center justify-between p-3.5 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left decoration-none">
                        <div>
                          <div className="font-semibold text-xs text-primary">Vandrevala Foundation</div>
                          <div className="text-[10px] text-mid">Mental health support · 24/7 · Free & Confidential</div>
                        </div>
                        <span className="px-2 py-0.5 bg-[#8DBFB4]/15 text-[#1A5040] text-[9px] uppercase font-bold rounded-full">24 / 7</span>
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 text-center">
                    <button 
                      onClick={() => {
                        sessionStorage.setItem('iw_sustained_acknowledged', 'true');
                        setCurrentStage(targetStageAfterSustained);
                      }}
                      className="w-full py-3 bg-primary hover:bg-[#2A3A3E] text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer border-none"
                    >
                      I'm okay to continue
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Bottom disclaimer */}
      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 select-none">
        Ingress Within · Secure Client Encryption Active · Cycle 2 · Day {dayNumber} of 28
      </footer>
    </div>
  );
}
