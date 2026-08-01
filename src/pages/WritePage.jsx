import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, BookOpen, AlertCircle, Smile, HeartHandshake, X, HelpCircle } from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';
import { PostJournalInterventions } from '../components/interventions/PostJournalInterventions';
import { InterventionPlayer } from '../components/interventions/player/InterventionPlayer';

const reflections = {
  fresh: {
    obs: "You circled the same situation twice — once describing what happened, once describing how it ended. But the middle part, what it felt like while it was happening, didn't make it onto the page.",
    q: "What were you feeling in the moment — before you decided how to handle it?"
  },
  continue: {
    obs: "Yesterday you wrote that the conversation keeps ending the same way. Today you went deeper — you started describing what you do before it ends. That's a different kind of looking.",
    q: "What changed between when you wrote yesterday and when you came back today?"
  },
  question: {
    obs: "You described absorbing things as the safer option — less friction, less fallout. But you also wrote that it leaves you feeling invisible. Those two things can't both be true in the long run.",
    q: "Not what they did — what did you do with what you were feeling while it was happening?"
  }
};

const placeholders = {
  fresh: 'Whatever is actually there.',
  continue: 'Pick up wherever feels honest.',
  question: 'Whatever comes first. The unedited version.'
};

export default function WritePage({ user, profile, onSignOut }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Workspace modes
  const [writeMode, setWriteMode] = useState('fresh');
  const [entryText, setEntryText] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [crisisType, setCrisisType] = useState(null);
  const [generatedReflection, setGeneratedReflection] = useState(null);
  const [saveError, setSaveError] = useState(null);
  
  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState('Idle'); // 'Idle' | 'Saving' | 'Saved' | 'Error'
  const [lastAutosavedAt, setLastAutosavedAt] = useState('');
  const [showRecoveredMsg, setShowRecoveredMsg] = useState(false);
  
  // UI screens: 'main' | 'reading' | 'reflection' | 'crisis' | 'sustained_distress'
  const [screenState, setScreenState] = useState('main');

  // Reflection response states
  const [reflectionToAnswer, setReflectionToAnswer] = useState(null);
  const [reflectionAnswer, setReflectionAnswer] = useState('');
  const [isSavingReflection, setIsSavingReflection] = useState(false);
  const [reflectionAutosaveStatus, setReflectionAutosaveStatus] = useState('Idle');
  const [lastReflectionAutosavedAt, setLastReflectionAutosavedAt] = useState('');
  const [reflectionSaveError, setReflectionSaveError] = useState(null);
  const [crisisReflectionAnswer, setCrisisReflectionAnswer] = useState('');
  const [playerInterventionId, setPlayerInterventionId] = useState(null);

  const handleFinishCrisisFlow = async () => {
    if (crisisReflectionAnswer.trim() && (generatedReflection?.id || reflectionToAnswer?.id)) {
      const reflId = generatedReflection?.id || reflectionToAnswer?.id;
      try {
        await fetch('/api/reflections/answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reflection_id: reflId,
            response_text: crisisReflectionAnswer.trim(),
          }),
        }).catch(() => {
          fetch('/api/vocab/thread-responses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              thread_id: generatedReflection?.thread_id || reflId,
              response_text: crisisReflectionAnswer.trim(),
            }),
          }).catch(() => {});
        });
      } catch (err) {
        console.error('Error submitting crisis reflection response:', err);
      }
    }
    window.navigateTo('/dashboard');
  };

  // Load data on mount
  useEffect(() => {
    // Check sustained distress flag at session open
    if (user?.sustained_distress_flag && sessionStorage.getItem('iw_sustained_acknowledged') !== 'true') {
      setScreenState('sustained_distress');
    }

    // Read mode from query params
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mode = params.get('mode');
      if (mode && ['fresh', 'continue', 'question'].includes(mode)) {
        setWriteMode(mode);
      }
    }

    async function loadData() {
      try {
        const result = await DashboardService.fetchDashboardData();
        setData(result);
        
        // Check for unanswered reflection on the most recent entry
        if (result && result.entries && result.entries.length > 0) {
          const latestEntry = result.entries[0];
          const reflection = latestEntry.reflection;
          
          if (reflection && reflection.status === 'ready' && reflection.closing_question) {
            setReflectionToAnswer(reflection);
            setReflectionAnswer(reflection.reflection_answer || '');
          } else {
            setReflectionToAnswer(null);
          }
        }

        if (result?.cycleInfo?.hasWrittenToday) {
          // Only lock if we are not currently displaying a distress screen
          if (!user?.sustained_distress_flag || sessionStorage.getItem('iw_sustained_acknowledged') === 'true') {
            setScreenState('locked');
          }
        } else {
          // Check for draft recovery if allowed to write today
          const savedDraft = localStorage.getItem('iw_free_write_draft');
          if (savedDraft) {
            try {
              const parsed = JSON.parse(savedDraft);
              if (parsed && parsed.text && parsed.text.trim()) {
                setEntryText(parsed.text);
                if (parsed.mode) {
                  setWriteMode(parsed.mode);
                }
                setShowRecoveredMsg(true);
                setTimeout(() => setShowRecoveredMsg(false), 5000);
              }
            } catch (pErr) {
              console.warn('Could not parse saved draft:', pErr);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleSaveReflection = async () => {
    if (!reflectionAnswer.trim() || !reflectionToAnswer) return;
    setIsSavingReflection(true);
    setReflectionSaveError(null);
    try {
      await DashboardService.submitReflectionAnswer(reflectionToAnswer.id, reflectionAnswer, 'completed');
      setReflectionToAnswer(null);
      setReflectionAnswer('');
      const result = await DashboardService.fetchDashboardData();
      setData(result);
    } catch (err) {
      console.error('Failed to save reflection response:', err);
      setReflectionSaveError(err.message || String(err));
    } finally {
      setIsSavingReflection(false);
    }
  };

  // Autosave reflection answer draft
  useEffect(() => {
    if (!reflectionToAnswer || isLoading || isSavingReflection) return;
    
    const currentStoredValue = reflectionToAnswer.reflection_answer || '';
    if (reflectionAnswer === currentStoredValue) {
      return;
    }

    setReflectionAutosaveStatus('Saving');
    const saveTimeout = setTimeout(async () => {
      try {
        await DashboardService.submitReflectionAnswer(reflectionToAnswer.id, reflectionAnswer, 'ready');
        setReflectionAutosaveStatus('Saved');
        setLastReflectionAutosavedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setReflectionToAnswer(prev => prev ? { ...prev, reflection_answer: reflectionAnswer } : null);
      } catch (err) {
        console.error('Failed to autosave reflection draft:', err);
        setReflectionAutosaveStatus('Error');
      }
    }, 1500);

    return () => clearTimeout(saveTimeout);
  }, [reflectionAnswer, reflectionToAnswer, isLoading, isSavingReflection]);

  // Reset reflection autosave status to Idle after 3s
  useEffect(() => {
    if (reflectionAutosaveStatus === 'Saved') {
      const resetTimeout = setTimeout(() => {
        setReflectionAutosaveStatus('Idle');
      }, 3000);
      return () => clearTimeout(resetTimeout);
    }
  }, [reflectionAutosaveStatus]);

  const getWordCount = () => {
    return entryText.trim().split(/\s+/).filter(Boolean).length;
  };

  // Local cache auto-saver (Debounced for quick recovery if tab closed)
  useEffect(() => {
    if (isLoading || (screenState !== 'main' && screenState !== 'sustained_distress')) return;

    if (!entryText.trim()) {
      localStorage.removeItem('iw_free_write_draft');
      setAutosaveStatus('Idle');
      return;
    }

    setAutosaveStatus('Saving');
    const saveTimeout = setTimeout(() => {
      try {
        const draft = {
          text: entryText,
          mode: writeMode,
          updatedAt: new Date().toISOString()
        };
        localStorage.setItem('iw_free_write_draft', JSON.stringify(draft));
        setAutosaveStatus('Saved');
        setLastAutosavedAt(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch (err) {
        console.error('Draft autosave failed:', err);
        setAutosaveStatus('Error');
      }
    }, 1500); // 1.5 second debounce

    return () => clearTimeout(saveTimeout);
  }, [entryText, writeMode, isLoading, screenState]);

  // Reset "Saved" message status to "Idle" after 3s
  useEffect(() => {
    if (autosaveStatus === 'Saved') {
      const resetTimeout = setTimeout(() => {
        setAutosaveStatus('Idle');
      }, 3000);
      return () => clearTimeout(resetTimeout);
    }
  }, [autosaveStatus]);

  const handleSaveEntry = async () => {
    if (getWordCount() < 5) return;
    setIsSavingEntry(true);
    setScreenState('reading');
    
    try {
      const entryObj = await DashboardService.saveJournalEntry(entryText);
      localStorage.removeItem('iw_free_write_draft'); // Clear draft on successful save
      
      // If reflection or crisis is returned synchronously, transition instantly!
      if (entryObj.crisis_flag || entryObj.reflection) {
        setIsSavingEntry(false);
        if (entryObj.reflection) {
          setGeneratedReflection(entryObj.reflection);
        }
        if (entryObj.crisis_flag) {
          setCrisisType(entryObj.crisis_type);
          setScreenState('crisis');
        } else {
          setScreenState('reflection');
        }
        return;
      }

      const startTime = Date.now();
      const pollInterval = setInterval(async () => {
        try {
          const entryStatus = await DashboardService.checkEntryStatus(entryObj.id);
          const elapsed = Date.now() - startTime;
          
          const reflectionReady = entryStatus.reflection && (entryStatus.reflection.status === 'ready' || entryStatus.reflection.status === 'failed');
          const isCrisis = entryStatus.crisis_flag === true;
          
          if (isCrisis || reflectionReady || elapsed > 15000) {
            clearInterval(pollInterval);
            setIsSavingEntry(false);
            
            if (entryStatus.reflection) {
              setGeneratedReflection(entryStatus.reflection);
            }

            if (isCrisis) {
              setCrisisType(entryStatus.crisis_type);
              setScreenState('crisis');
            } else {
              setScreenState('reflection');
            }
          }
        } catch (pollErr) {
          console.warn('Error polling entry status:', pollErr);
          // Standard fallback
          if (Date.now() - startTime > 15000) {
            clearInterval(pollInterval);
            setIsSavingEntry(false);
            setScreenState('reflection');
          }
        }
      }, 4000);

    } catch (err) {
      console.error('Failed to save entry:', err);
      setScreenState('main');
      setIsSavingEntry(false);
      setSaveError(err.message || String(err));
    }
  };

  const handleDiscardEntry = () => {
    if (entryText.trim() && confirm('Discard this entry?')) {
      setEntryText('');
      localStorage.removeItem('iw_free_write_draft'); // Clear draft on discard
    }
  };

  const getFormattedDate = () => {
    const today = new Date();
    const cycleDay = data?.cycleInfo?.currentDay || 20;
    const dateString = today.toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }).toUpperCase();
    return `DAY ${cycleDay} · ${dateString}`;
  };

  // Yesterday's entry details
  const yesterdayEntryText = data?.entries?.[0]?.text || '';
  const yesterdayWordCount = data?.entries?.[0]?.words || 0;
  const yesterdayDate = data?.entries?.[0]?.date || '24 Jun';

  // Active open thread question
  const openThreadQuestion = data?.threads?.find(t => t.status !== 'addressed')?.question 
    || 'What would it look like to actually say the thing instead of absorbing it?';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-mint-grey flex items-center justify-center">
        <p className="text-mid italic text-sm animate-pulse">Preparing workspace...</p>
      </div>
    );
  }

  if (playerInterventionId) {
    return (
      <InterventionPlayer
        interventionId={playerInterventionId}
        onBack={() => setPlayerInterventionId(null)}
        onComplete={() => {
          setPlayerInterventionId(null);
          window.navigateTo('/dashboard');
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-primary font-sans relative flex flex-col">
      {screenState !== 'reading' && screenState !== 'locked' && <DashboardNavbar activeTab="write" />}

      {screenState === 'main' && (
        <>
          {/* Sub Navbar Mode Selector */}
          <div className="bg-[#F5F8F8] border-b border-[#1E2A2E]/10 py-2.5 px-6 flex items-center gap-2 text-xs shrink-0 select-none">
            <span className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold mr-2">Mode:</span>
            <button 
              onClick={() => setWriteMode('fresh')}
              className={`px-3.5 py-1 rounded-full border text-[11.5px] font-medium transition-all cursor-pointer ${
                writeMode === 'fresh' 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-transparent text-mid border-[#1E2A2E]/15 hover:text-primary'
              }`}
            >
              Fresh entry
            </button>
            <button 
              onClick={() => setWriteMode('continue')}
              className={`px-3.5 py-1 rounded-full border text-[11.5px] font-medium transition-all cursor-pointer ${
                writeMode === 'continue' 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-transparent text-mid border-[#1E2A2E]/15 hover:text-primary'
              }`}
            >
              Continue yesterday
            </button>
            <button 
              onClick={() => setWriteMode('question')}
              className={`px-3.5 py-1 rounded-full border text-[11.5px] font-medium transition-all cursor-pointer ${
                writeMode === 'question' 
                  ? 'bg-primary text-white border-primary' 
                  : 'bg-transparent text-mid border-[#1E2A2E]/15 hover:text-primary'
              }`}
            >
              Open question
            </button>
          </div>

          {/* Writing Area */}
          <div className="flex-1 max-w-[620px] mx-auto w-full px-6 pt-8 flex flex-col space-y-6">
            <AnimatePresence>
              {showRecoveredMsg && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-[#8DBFB4]/10 border border-[#8DBFB4]/20 text-primary px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 select-none overflow-hidden"
                >
                  <CheckCircle2 size={14} className="text-secondary shrink-0 animate-pulse" />
                  <span>Your last draft has been automatically restored.</span>
                </motion.div>
              )}
            </AnimatePresence>

            {reflectionToAnswer && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white border border-[#E0A898]/40 rounded-xl p-5 shadow-sm space-y-4 relative overflow-hidden text-left"
              >
                <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[#E0A898]" />
                
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#E0A898]">Continue Your Reflection</span>
                  <div className="flex items-center gap-1.5 text-[10px] text-mid">
                    <span>From {new Date(data?.entries?.[0]?.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>

                <p className="font-serif italic text-[14.5px] leading-relaxed text-primary">
                  "{reflectionToAnswer.closing_question}"
                </p>

                <div className="space-y-2">
                  <textarea
                    value={reflectionAnswer}
                    onChange={(e) => setReflectionAnswer(e.target.value)}
                    placeholder="Reflect on this question before you write a new entry..."
                    className="w-full min-h-[110px] border border-[#1E2A2E]/10 rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder-mid/30 bg-mint-grey/5 resize-y"
                  />
                  
                  {reflectionSaveError && (
                    <p className="text-[11px] text-[#8a3020] font-medium">{reflectionSaveError}</p>
                  )}

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-1.5 font-sans text-[10px] h-[16px] text-mid/70 select-none">
                      {reflectionAutosaveStatus === 'Saving' && (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                          <span className="italic">Autosaving...</span>
                        </>
                      )}
                      {reflectionAutosaveStatus === 'Saved' && (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-secondary" />
                          <span>Saved draft {lastReflectionAutosavedAt ? `at ${lastReflectionAutosavedAt}` : ''}</span>
                        </>
                      )}
                      {reflectionAutosaveStatus === 'Error' && (
                        <>
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          <span className="text-red-400">Autosave failed</span>
                        </>
                      )}
                    </div>

                    <button
                      onClick={handleSaveReflection}
                      disabled={!reflectionAnswer.trim() || isSavingReflection}
                      className="px-4 py-1.5 bg-primary text-white hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed text-[11px] font-semibold uppercase tracking-wider rounded transition-all cursor-pointer border-none"
                    >
                      {isSavingReflection ? 'Saving...' : 'Save Reflection'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-semibold">
              {getFormattedDate()}
            </div>

            {/* Context Blocks based on Mode */}
            {writeMode === 'continue' && (
              <div className="mb-4 pb-4 border-b border-[#1E2A2E]/5 space-y-1">
                <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Yesterday</div>
                <p className="text-[13.5px] text-[#1E2A2E]/40 italic font-serif leading-relaxed">
                  "{yesterdayEntryText || 'No entry logged yesterday.'}"
                </p>
                <div className="text-[10px] text-[#C0D4CE] mt-0.5 font-light">
                  {yesterdayWordCount} words · {yesterdayDate}
                </div>
              </div>
            )}

            {writeMode === 'question' && (
              <div className="mb-4 pb-4 border-b border-[#1E2A2E]/5 space-y-1">
                <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Still open</div>
                <p className="text-[13.5px] text-[#4A6A64] italic font-serif leading-relaxed">
                  "{openThreadQuestion}"
                </p>
              </div>
            )}

            {/* Textarea Workspace */}
            <textarea 
              value={entryText}
              onChange={(e) => setEntryText(e.target.value)}
              placeholder={placeholders[writeMode]}
              className="flex-1 w-full text-[17px] leading-loose bg-transparent border-none outline-none resize-none focus:ring-0 focus:outline-none p-0 text-primary placeholder-[#1E2A2E]/25 font-serif min-h-[350px] caret-[#E0A898]"
              autoFocus
            />
          </div>

          {/* Bottom Toolbar */}
          <div className="border-t border-[#1E2A2E]/10 bg-white px-6 py-3.5 flex items-center justify-between shrink-0 sticky bottom-0 z-40 relative">
            <div className="flex items-center gap-5">
              <span className="text-[12px] text-[#8DBFB4]">
                Cycle {data?.cycleInfo?.cycleNumber || 2} · Day {data?.cycleInfo?.currentDay || 20}
              </span>
              <button 
                onClick={handleDiscardEntry}
                disabled={!entryText.trim()}
                className="text-[12.5px] text-mid hover:text-primary transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 border-none bg-transparent"
              >
                Discard
              </button>
            </div>

            {/* Absolute center container for autosave status */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1.5 font-sans text-[10.5px] h-[16px] pointer-events-none select-none">
              <AnimatePresence mode="wait">
                {autosaveStatus === 'Saving' && (
                  <motion.div 
                    key="saving"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                    <span className="text-accent italic font-semibold">Autosaving...</span>
                  </motion.div>
                )}
                {autosaveStatus === 'Saved' && (
                  <motion.div 
                    key="saved"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
                    <span className="text-secondary font-semibold">Saved {lastAutosavedAt ? `at ${lastAutosavedAt}` : ''}</span>
                  </motion.div>
                )}
                {autosaveStatus === 'Error' && (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    className="flex items-center gap-1.5"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                    <span className="text-red-400 font-semibold">Autosave failed</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-[11.5px] text-mid/60 font-mono">
                {getWordCount()} words
              </span>
              <button 
                onClick={handleSaveEntry}
                disabled={getWordCount() < 5 || isSavingEntry}
                className="px-6 py-2 bg-primary text-white hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed text-xs font-semibold uppercase tracking-wider rounded transition-all cursor-pointer border-none"
              >
                Done
              </button>
            </div>
          </div>
        </>
      )}

      {/* Reading patterns state */}
      {screenState === 'reading' && (
        <div className="flex-1 bg-white flex flex-col justify-center items-center gap-4 animate-fade-in">
          <div className="flex gap-1.5 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8D4] animate-[pulse_1.4s_ease-in-out_infinite]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8D4] animate-[pulse_1.4s_ease-in-out_infinite_0.2s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#C8D8D4] animate-[pulse_1.4s_ease-in-out_infinite_0.4s]" />
          </div>
          <p className="text-[13px] text-[#8DBFB4] italic font-serif">Reading patterns...</p>
        </div>
      )}

      {/* Reflection feedback screen */}
      {screenState === 'reflection' && (
        <div className="flex-1 bg-white overflow-y-auto page-fade-enter-active">
          <div className="max-w-[580px] mx-auto px-6 py-12 flex flex-col space-y-7">
            <div className="text-[11px] tracking-wider uppercase text-[#8DBFB4] font-semibold">
              {getFormattedDate()}
            </div>
            
            <div className="space-y-4">
              {(() => {
                const reflObj = Array.isArray(generatedReflection) ? generatedReflection[0] : generatedReflection;
                const reflText = typeof reflObj?.reflection_text === 'string' && reflObj.reflection_text.trim().length > 0 && !reflObj.reflection_text.includes('Processing') ? reflObj.reflection_text : null;
                const text = reflText || (reflections[writeMode] ? (reflections[writeMode].obs + "\n\n" + reflections[writeMode].q) : "You described your situation with attention and care today.\n\nWhat is feeling the most steady for you right now?");
                if (!text || typeof text !== 'string') return null;

                const paragraphs = text.split('\n\n').filter(Boolean);
                if (paragraphs.length === 0) return null;
                
                // If there is only one paragraph, treat it as the question block
                const bodyParagraphs = paragraphs.length > 1 ? paragraphs.slice(0, -1) : [];
                const questionParagraph = paragraphs[paragraphs.length - 1];

                return (
                  <>
                    {bodyParagraphs.map((para, idx) => (
                      <p key={idx} className="text-[17px] text-[#1E2A2E] leading-relaxed font-serif">
                        {para}
                      </p>
                    ))}
                    
                    {questionParagraph && (
                      <div className="border-l-[2.5px] border-[#E0A898] pl-4 space-y-1.5 mt-6">
                        <div className="text-[9px] tracking-wider uppercase text-[#E0A898] font-bold">Carry into today's reflection</div>
                        <p className="text-[16px] text-[#E0A898] italic font-serif leading-relaxed">
                          {typeof questionParagraph === 'string' && (questionParagraph.startsWith('"') || questionParagraph.startsWith('“')) ? questionParagraph : `"${questionParagraph}"`}
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {generatedReflection?.closing_question && (
              <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/15 space-y-1.5 text-left">
                <div className="text-[8px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                  <HelpCircle size={10} />
                  <span>Inquiry for contemplation</span>
                </div>
                <p className="font-serif text-sm italic text-primary/95 leading-relaxed">
                  "{generatedReflection.closing_question}"
                </p>
              </div>
            )}

            <div className="bg-[#F5F8F8] border border-[#1E2A2E]/5 rounded-xl p-5 space-y-2">
              <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Saved Entry Preview</div>
              <p className="text-[13px] text-[#4A6A64] italic font-serif leading-relaxed">
                "{entryText.length > 220 ? entryText.substring(0, 220) + '…' : entryText}"
              </p>
              <div className="text-[10px] text-mid/60">
                {getWordCount()} words · Cycle {data?.cycleInfo?.cycleNumber} Day {data?.cycleInfo?.currentDay}
              </div>
            </div>

            {/* Core Daily Interventions Section */}
            <PostJournalInterventions
              isCrisis={false}
              onLaunchIntervention={(id) => setPlayerInterventionId(id)}
            />

            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-[#1E2A2E]/5">
              <button 
                onClick={() => window.navigateTo('/dashboard')}
                className="flex-1 py-3 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center border-none"
              >
                Back to Dashboard
              </button>
              <button 
                onClick={() => window.navigateTo('/vocab')}
                className="px-6 py-3 border border-[#1E2A2E]/15 rounded text-xs font-semibold text-mid hover:bg-[#F5F8F8] transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Smile size={14} className="text-secondary" />
                Explore Emotional Vocabulary
              </button>
            </div>
            
            <div className="flex items-center gap-2 text-[12px] text-[#4A6A64] pt-2">
              <AlertCircle size={14} className="text-[#8DBFB4]" />
              <span>Saved · feeds directly into your Day 28 report.</span>
            </div>
          </div>
        </div>
      )}

      {screenState === 'locked' && (
        <div className="flex-1 bg-white flex flex-col justify-center items-center text-center p-6 space-y-6 animate-fade-in">
          <div className="w-16 h-16 rounded-full bg-[#8DBFB4]/15 flex items-center justify-center text-[#8DBFB4]">
            <CheckCircle2 size={32} />
          </div>
          <div className="space-y-2 max-w-md">
            <h2 className="font-serif text-2xl text-primary">Daily Writing Complete</h2>
            <p className="text-sm text-mid leading-relaxed">
              You have already written today. To maintain a slow, intentional pace, the writing workspace is limited to one entry per day.
            </p>
          </div>
          <div className="text-xs text-mid/60 italic">
            Your daily writing limit has been reached. Resets at 12:00 AM (midnight) local time.
          </div>
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="px-6 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none"
          >
            Go to Dashboard
          </button>
        </div>
      )}

      {/* Immediate Crisis Screen */}
      {screenState === 'crisis' && (
        <div className="flex-1 bg-white overflow-y-auto page-fade-enter-active">
          <div className="max-w-[580px] mx-auto px-6 py-12 flex flex-col space-y-8">
            {/* 1. High-Priority Crisis Support Section */}
            <div className="space-y-6">
              <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
                <HeartHandshake size={24} />
              </div>

              <div className="space-y-4">
                <h2 className="font-serif text-2xl text-primary font-normal">Please take a moment</h2>
                <p className="text-[16px] text-primary leading-relaxed font-serif">
                  {crisisType === 'Risk_Language'
                    ? "What you wrote suggests you may be thinking about hurting yourself or ending your life. Please don’t go through this alone — reach out to someone who can help."
                    : "We noticed today’s entry carries a lot of weight. Before we continue — you don’t have to hold this alone. If things feel overwhelming right now, please reach out to someone who can help."
                  }
                </p>
              </div>

              <div className="border-t border-b border-[#1E2A2E]/10 py-6 space-y-4">
                <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Confidential Support Resources</div>
                
                <div className="grid gap-3">
                  <a href="tel:9152987821" className="flex items-center justify-between p-4 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left">
                    <div>
                      <div className="font-semibold text-xs text-primary">iCall (India)</div>
                      <div className="text-[11px] text-mid">Psychological counselling helpline · Mon–Sat · 8am–10pm</div>
                    </div>
                    <span className="px-2.5 py-1 bg-primary/5 text-primary text-[10px] uppercase font-bold rounded-full">Call</span>
                  </a>

                  <a href="tel:18602662345" className="flex items-center justify-between p-4 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left">
                    <div>
                      <div className="font-semibold text-xs text-primary">Vandrevala Foundation</div>
                      <div className="text-[11px] text-mid">Mental health support · 24/7 · Free & Confidential</div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#8DBFB4]/15 text-[#1A5040] text-[10px] uppercase font-bold rounded-full">24 / 7</span>
                  </a>

                  <a href="https://wa.me/919152987821" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left">
                    <div>
                      <div className="font-semibold text-xs text-primary">iCall — WhatsApp Text Line</div>
                      <div className="text-[11px] text-mid">Text support if calling feels like too much</div>
                    </div>
                    <span className="px-2.5 py-1 bg-[#B8A8D4]/15 text-[#5A4A8A] text-[10px] uppercase font-bold rounded-full">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* 2. Visual Divider */}
            <div className="relative flex items-center justify-center my-2">
              <div className="w-full border-t border-[#1E2A2E]/15" />
              <span className="absolute bg-white px-3 text-[11px] font-serif italic text-mid/80">
                Whenever you're ready...
              </span>
            </div>

            {/* 3. Reflection Section (Reflection Card) */}
            {(generatedReflection || reflectionToAnswer) && (
              <div className="bg-[#F8FAF9] border border-[#1E2A2E]/10 rounded-2xl p-6 space-y-6 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="text-[10px] tracking-wider uppercase text-[#8DBFB4] font-bold flex items-center gap-1.5">
                    <Sparkles size={12} />
                    <span>Journal Reflection</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-mid font-mono">{getFormattedDate()}</span>
                </div>

                <div className="space-y-3">
                  {((generatedReflection?.reflection_text || reflectionToAnswer?.reflection_text) || '').split('\n\n').map((para, idx) => (
                    <p key={idx} className="text-[15px] text-[#1E2A2E] leading-relaxed font-serif">
                      {para}
                    </p>
                  ))}
                </div>

                {(generatedReflection?.closing_question || reflectionToAnswer?.closing_question) && (
                  <div className="border-l-[2.5px] border-[#E0A898] pl-4 py-1 space-y-1 bg-white/80 rounded-r-xl p-3">
                    <div className="text-[9px] tracking-wider uppercase text-[#E0A898] font-bold">Inquiry for contemplation</div>
                    <p className="text-[15px] text-[#E0A898] italic font-serif leading-relaxed">
                      "{generatedReflection?.closing_question || reflectionToAnswer?.closing_question}"
                    </p>
                  </div>
                )}

                {/* Optional Thread Response Input */}
                <div className="space-y-2 pt-2 border-t border-[#1E2A2E]/10">
                  <label className="text-xs font-semibold text-primary block">
                    Your thoughts / response (optional):
                  </label>
                  <textarea
                    rows={3}
                    value={crisisReflectionAnswer}
                    onChange={(e) => setCrisisReflectionAnswer(e.target.value)}
                    placeholder="Write any thoughts when you feel ready..."
                    className="w-full p-3.5 rounded-xl border border-accent/30 bg-white text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 transition-all resize-y shadow-inner"
                  />
                </div>
              </div>
            )}

            {/* 4. Core Daily & Crisis-Specific Interventions */}
            <PostJournalInterventions
              isCrisis={true}
              onLaunchIntervention={(id) => setPlayerInterventionId(id)}
            />

            {/* 5. Action Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button 
                onClick={handleFinishCrisisFlow}
                className="w-full py-3.5 bg-primary text-white hover:bg-[#2A3A3E] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center border-none shadow-sm hover:shadow-md"
              >
                {crisisReflectionAnswer.trim() ? 'Submit & Finish' : 'I am okay to continue'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sustained Distress Screen */}
      {screenState === 'sustained_distress' && (
        <div className="flex-1 bg-white overflow-y-auto page-fade-enter-active">
          <div className="max-w-[580px] mx-auto px-6 py-12 flex flex-col space-y-8">
            <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent">
              <HeartHandshake size={24} />
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-2xl text-primary font-normal">A gentle note</h2>
              <p className="text-[16px] text-primary leading-relaxed font-serif">
                Over the past week your entries have been carrying something heavy. That’s okay — this is what the platform is here for. If it ever feels like too much, there are people who can help beyond what we can offer here.
              </p>
            </div>

            <div className="border-t border-b border-[#1E2A2E]/10 py-6 space-y-4">
              <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Confidential Support Resources</div>
              
              <div className="grid gap-3">
                <a href="tel:9152987821" className="flex items-center justify-between p-4 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left">
                  <div>
                    <div className="font-semibold text-xs text-primary">iCall (India)</div>
                    <div className="text-[11px] text-mid">Psychological counselling helpline · Mon–Sat · 8am–10pm</div>
                  </div>
                  <span className="px-2.5 py-1 bg-primary/5 text-primary text-[10px] uppercase font-bold rounded-full">Call</span>
                </a>

                <a href="tel:18602662345" className="flex items-center justify-between p-4 bg-mint-grey rounded-xl border border-transparent hover:border-[#8DBFB4]/25 transition-all text-left">
                  <div>
                    <div className="font-semibold text-xs text-primary">Vandrevala Foundation</div>
                    <div className="text-[11px] text-mid">Mental health support · 24/7 · Free & Confidential</div>
                  </div>
                  <span className="px-2.5 py-1 bg-[#8DBFB4]/15 text-[#1A5040] text-[10px] uppercase font-bold rounded-full">24 / 7</span>
                </a>
              </div>
            </div>

            <div className="pt-2">
              <button 
                onClick={() => {
                  sessionStorage.setItem('iw_sustained_acknowledged', 'true');
                  setScreenState('main');
                }}
                className="w-full py-3.5 bg-primary text-white hover:bg-[#2A3A3E] rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer text-center border-none"
              >
                I'm okay to continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Error Warning Popup Modal */}
      <AnimatePresence>
        {saveError && (
          <div className="fixed inset-0 bg-[#1E2A2E]/40 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-[420px] w-full p-6 space-y-4 relative overflow-hidden shadow-lg border border-[#1E2A2E]/5"
            >
              <button 
                onClick={() => setSaveError(null)}
                className="absolute top-4 right-4 text-mid hover:text-primary cursor-pointer border-none bg-transparent"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 text-red-500">
                <AlertCircle size={24} className="shrink-0" />
                <h3 className="font-serif text-lg text-primary font-normal">
                  {saveError.includes('limit') || saveError.includes('already completed') ? 'Daily Limit Reached' : 'Unable to Save'}
                </h3>
              </div>

              <p className="text-xs text-mid leading-relaxed font-sans">
                {saveError}
              </p>

              <div className="pt-2">
                <button 
                  onClick={() => {
                    setSaveError(null);
                    if (saveError.includes('limit') || saveError.includes('already completed')) {
                      setScreenState('locked');
                    }
                  }}
                  className="w-full py-2.5 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  Acknowledge
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
