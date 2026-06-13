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

  const handleSaveEntry = async () => {
    if (getWordCount() < 5) return;
    setIsSavingEntry(true);
    setScreenState('reading');
    
    try {
      await DashboardService.saveJournalEntry(entryText);
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
      {screenState !== 'reading' && <DashboardNavbar activeTab="write" />}

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
          <div className="border-t border-[#1E2A2E]/10 bg-white px-6 py-3.5 flex items-center justify-between shrink-0 sticky bottom-0 z-40">
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
    </div>
  );
}
