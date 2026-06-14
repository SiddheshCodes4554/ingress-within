import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2, BookOpen, AlertCircle, Smile } from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';

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
  
  // Autosave status
  const [autosaveStatus, setAutosaveStatus] = useState('Idle'); // 'Idle' | 'Saving' | 'Saved' | 'Error'
  const [lastAutosavedAt, setLastAutosavedAt] = useState('');
  const [showRecoveredMsg, setShowRecoveredMsg] = useState(false);
  
  // UI screens: 'main' | 'reading' | 'reflection'
  const [screenState, setScreenState] = useState('main');

  // Load data on mount
  useEffect(() => {
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
        if (result?.cycleInfo?.hasWrittenToday) {
          setScreenState('locked');
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
  }, []);

  const getWordCount = () => {
    return entryText.trim().split(/\s+/).filter(Boolean).length;
  };

  // Local cache auto-saver (Debounced for quick recovery if tab closed)
  useEffect(() => {
    if (isLoading || screenState !== 'main') return;

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
      await DashboardService.saveJournalEntry(entryText);
      localStorage.removeItem('iw_free_write_draft'); // Clear draft on successful save
      // Simulate reading patterns analytics delay
      setTimeout(() => {
        setScreenState('reflection');
        setIsSavingEntry(false);
      }, 2800);
    } catch (err) {
      console.error('Failed to save entry:', err);
      setScreenState('main');
      setIsSavingEntry(false);
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
              <p className="text-[17px] text-[#1E2A2E] leading-relaxed font-serif">
                {reflections[writeMode]?.obs}
              </p>
              
              <div className="border-l-[2.5px] border-[#E0A898] pl-4 space-y-1.5">
                <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Carry into today's reflection</div>
                <p className="text-[16px] text-[#E0A898] italic font-serif leading-relaxed">
                  "{reflections[writeMode]?.q}"
                </p>
              </div>
            </div>

            <div className="bg-[#F5F8F8] border border-[#1E2A2E]/5 rounded-xl p-5 space-y-2">
              <div className="text-[9px] tracking-wider uppercase text-[#8DBFB4] font-bold">Saved Entry Preview</div>
              <p className="text-[13px] text-[#4A6A64] italic font-serif leading-relaxed">
                "{entryText.length > 220 ? entryText.substring(0, 220) + '…' : entryText}"
              </p>
              <div className="text-[10px] text-mid/60">
                {getWordCount()} words · Cycle {data?.cycleInfo?.cycleNumber} Day {data?.cycleInfo?.currentDay}
              </div>
            </div>

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
    </div>
  );
}
