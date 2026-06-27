import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  Save, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Sparkle,
  Lock,
  Archive,
  Eye,
  Loader
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';

export default function ThreadsPage({ user, profile, onSignOut }) {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Card editor & draft states
  const [draftTexts, setDraftTexts] = useState({});
  const [saveStatus, setSaveStatus] = useState({}); // { [threadId]: 'idle' | 'saving' | 'saved' | 'error' }
  const [submitStatus, setSubmitStatus] = useState({}); // { [threadId]: 'idle' | 'submitting' | 'submitted' | 'error' }

  // Collapse/Expand & Detail view states for Answered/Archived threads
  const [expandedCards, setExpandedCards] = useState({}); // { [threadId]: boolean }
  const [cardLoading, setCardLoading] = useState({}); // { [threadId]: boolean }
  const [cardDetails, setCardDetails] = useState({}); // { [threadId]: threadDetailData }

  // Filter state
  const [filter, setFilter] = useState('all'); // 'all' | 'open' | 'answered'

  const loadThreads = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await DashboardService.fetchActiveThreads();
      setThreads(data);
      
      // Initialize draft texts
      const initialDrafts = {};
      data.forEach(t => {
        if (t.status === 'Open') {
          initialDrafts[t.id] = t.draft_response || '';
        }
      });
      setDraftTexts(prev => ({ ...initialDrafts, ...prev }));
    } catch (err) {
      console.error('Failed to load threads:', err);
      setError('Could not retrieve reflection threads. Please try again.');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, []);

  const handleTextChange = (threadId, val) => {
    setDraftTexts(prev => ({ ...prev, [threadId]: val }));
    // Reset save status when user types
    if (saveStatus[threadId] === 'saved') {
      setSaveStatus(prev => ({ ...prev, [threadId]: 'idle' }));
    }
  };

  const handleSaveDraft = async (threadId) => {
    const text = draftTexts[threadId] || '';
    setSaveStatus(prev => ({ ...prev, [threadId]: 'saving' }));
    try {
      await DashboardService.saveThreadDraft(threadId, text);
      setSaveStatus(prev => ({ ...prev, [threadId]: 'saved' }));
      setTimeout(() => {
        setSaveStatus(prev => ({ ...prev, [threadId]: 'idle' }));
      }, 3000);
    } catch (err) {
      console.error('Failed to save draft:', err);
      setSaveStatus(prev => ({ ...prev, [threadId]: 'error' }));
    }
  };

  const handleSubmitResponse = async (threadId) => {
    const text = draftTexts[threadId] || '';
    if (!text.trim()) return;

    setSubmitStatus(prev => ({ ...prev, [threadId]: 'submitting' }));
    try {
      await DashboardService.submitThreadResponse(threadId, text);
      setSubmitStatus(prev => ({ ...prev, [threadId]: 'submitted' }));
      
      // Reload threads list to sync status to 'Answered'
      await loadThreads(true);

      // Force expansion of the card to show history now that it is answered
      setExpandedCards(prev => ({ ...prev, [threadId]: true }));
      
      // Fetch details on-demand for this newly answered card
      setCardLoading(prev => ({ ...prev, [threadId]: true }));
      const detail = await DashboardService.fetchThreadDetails(threadId);
      setCardDetails(prev => ({ ...prev, [threadId]: detail }));
      setCardLoading(prev => ({ ...prev, [threadId]: false }));

      setTimeout(() => {
        setSubmitStatus(prev => ({ ...prev, [threadId]: 'idle' }));
      }, 3000);
    } catch (err) {
      console.error('Failed to submit response:', err);
      setSubmitStatus(prev => ({ ...prev, [threadId]: 'error' }));
    }
  };

  const handleExpandCard = async (threadId) => {
    if (expandedCards[threadId]) {
      setExpandedCards(prev => ({ ...prev, [threadId]: false }));
      return;
    }

    setExpandedCards(prev => ({ ...prev, [threadId]: true }));

    // If detail not loaded, fetch it
    if (!cardDetails[threadId]) {
      setCardLoading(prev => ({ ...prev, [threadId]: true }));
      try {
        const detail = await DashboardService.fetchThreadDetails(threadId);
        setCardDetails(prev => ({ ...prev, [threadId]: detail }));
      } catch (err) {
        console.error(`Failed to fetch details for thread ${threadId}:`, err);
      } finally {
        setCardLoading(prev => ({ ...prev, [threadId]: false }));
      }
    }
  };

  const getWordCount = (text) => {
    return (text || '').trim().split(/\s+/).filter(Boolean).length;
  };

  const filteredThreads = threads.filter(t => {
    if (filter === 'open') return t.status === 'Open';
    if (filter === 'answered') return t.status === 'Answered' || t.status === 'Archived';
    return true;
  });

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      {/* Navigation Navbar */}
      <DashboardNavbar activeTab="dashboard" />

      {/* Main Container */}
      <main className="max-w-[1040px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1 flex flex-col">
        
        {/* Back navigation link */}
        <button 
          onClick={() => window.navigateTo('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-mid hover:text-primary transition-colors cursor-pointer w-fit border-none bg-transparent"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>

        {/* Page Header */}
        <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 select-none">
          <div className="space-y-1">
            <h1 className="text-2xl md:text-3xl font-serif text-primary font-normal">Reflection Threads</h1>
            <p className="text-xs text-mid leading-relaxed">
              Unanswered closing questions from your active self-reflections. Answer in any order.
            </p>
          </div>

          {/* Filtering Control Tabs */}
          <div className="flex bg-[#F1F3F3] p-1 rounded-xl border border-primary/5 w-fit">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'all' 
                  ? 'bg-white text-primary shadow-xs' 
                  : 'text-mid/70 hover:text-primary'
              }`}
            >
              All ({threads.length})
            </button>
            <button
              onClick={() => setFilter('open')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'open' 
                  ? 'bg-white text-primary shadow-xs' 
                  : 'text-mid/70 hover:text-primary'
              }`}
            >
              Open ({threads.filter(t => t.status === 'Open').length})
            </button>
            <button
              onClick={() => setFilter('answered')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                filter === 'answered' 
                  ? 'bg-white text-primary shadow-xs' 
                  : 'text-mid/70 hover:text-primary'
              }`}
            >
              Completed ({threads.filter(t => t.status !== 'Open').length})
            </button>
          </div>
        </section>

        {/* Content Area */}
        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center py-20 space-y-4">
            <Loader className="w-8 h-8 text-secondary animate-spin" />
            <p className="text-xs font-serif italic text-mid/60">Retrieving threads...</p>
          </div>
        ) : error ? (
          <div className="bg-white rounded-premium border border-primary/5 p-8 text-center space-y-4">
            <p className="text-sm text-red-500 font-medium">{error}</p>
            <button 
              onClick={() => loadThreads()} 
              className="px-4 py-2 bg-primary text-white text-xs uppercase tracking-wider rounded-lg font-semibold cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="bg-white rounded-premium border border-primary/5 p-12 text-center space-y-3 select-none">
            <MessageSquare size={36} className="mx-auto text-primary/15" />
            <h3 className="font-serif text-lg font-normal">No threads found</h3>
            <p className="text-xs text-mid/70 max-w-sm mx-auto">
              {filter === 'open' 
                ? "You've answered all reflection threads! Write a new journal entry to generate more."
                : filter === 'answered'
                ? "You haven't completed any reflection threads yet."
                : "No reflection threads exist yet. Write your daily journal entry first."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredThreads.map(thread => {
              const isOpen = thread.status === 'Open';
              const textVal = draftTexts[thread.id] || '';
              const saveState = saveStatus[thread.id] || 'idle';
              const submitState = submitStatus[thread.id] || 'idle';
              const isExpanded = !!expandedCards[thread.id];
              const isDetailLoading = !!cardLoading[thread.id];
              const detail = cardDetails[thread.id];

              return (
                <div 
                  key={thread.id} 
                  className={`bg-white rounded-premium border transition-all ${
                    isOpen 
                      ? 'border-[#1E2A2E]/10 shadow-[0_8px_32px_rgba(30,42,46,0.02)]' 
                      : 'border-primary/5 shadow-xs hover:border-[#1E2A2E]/10'
                  }`}
                >
                  {/* Card Header */}
                  <div className="p-5 md:p-6 border-b border-primary/5 flex flex-wrap items-center justify-between gap-4 select-none">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-wider bg-mint-grey border border-primary/5 px-2.5 py-0.5 rounded-full text-secondary">
                        Cycle {thread.cycle_number}
                      </span>
                      <span className="text-[9px] font-semibold text-mid/60">
                        Created {new Date(thread.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
                        isOpen 
                          ? 'bg-[#e0a898]/12 text-[#8a3020]' 
                          : thread.status === 'Archived'
                          ? 'bg-[#1E2A2E]/10 text-mid'
                          : 'bg-[#8DBFB4]/12 text-secondary-dark'
                      }`}>
                        {thread.status}
                      </span>

                      {!isOpen && (
                        <button
                          onClick={() => handleExpandCard(thread.id)}
                          className="p-1 rounded hover:bg-mint-grey transition-colors text-mid hover:text-primary cursor-pointer border-none bg-transparent"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 md:p-6 space-y-5">
                    {/* Reflection Observation Text */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-mid/60 select-none">
                        <Sparkle size={11} className="text-[#8DBFB4]" />
                        <span>AI Reflection Context</span>
                      </div>
                      <p className="text-[13.5px] font-serif leading-relaxed text-primary/80 italic">
                        "{thread.reflection_text || 'Reflection generated for daily entry.'}"
                      </p>
                    </div>

                    {/* Closing Question Prompt */}
                    <div className="space-y-2 border-l-2 border-[#E0A898] pl-4 py-1">
                      <div className="text-[9.5px] font-bold uppercase tracking-wider text-mid/60 select-none">
                        Closing Question
                      </div>
                      <h3 className="font-serif text-base md:text-lg text-primary font-semibold leading-relaxed">
                        {thread.closing_question}
                      </h3>
                    </div>

                    {/* Dynamic Section: Editor for Open, History for Answered/Archived */}
                    {isOpen ? (
                      <div className="space-y-4 pt-3 border-t border-primary/5">
                        <div className="flex items-center gap-1.5 text-[9.5px] font-bold uppercase tracking-wider text-mid/60 select-none">
                          <MessageSquare size={11} className="text-[#E0A898]" />
                          <span>Your Response</span>
                        </div>

                        <div className="bg-[#FBFBFB] border border-primary/5 rounded-xl p-4 flex flex-col justify-between min-h-[160px]">
                          <textarea
                            value={textVal}
                            onChange={(e) => handleTextChange(thread.id, e.target.value)}
                            placeholder="Record what is actually there. Try to avoid formatting or censoring your reflection..."
                            className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-serif text-[13.5px] leading-relaxed text-primary focus:ring-0 p-0 placeholder-primary/25 min-h-[100px] caret-accent"
                          />
                          <div className="pt-2 border-t border-primary/5 text-right text-[9px] font-semibold text-mid/40 font-sans">
                            {getWordCount(textVal)} words
                          </div>
                        </div>

                        {/* Editor Controls */}
                        <div className="flex items-center justify-between gap-4 select-none pt-1">
                          <div className="text-[10px] font-semibold">
                            <AnimatePresence>
                              {saveState === 'saving' && <span className="text-mid/60">Saving draft...</span>}
                              {saveState === 'saved' && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-secondary flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Draft saved locally
                                </motion.span>
                              )}
                              {submitState === 'submitting' && <span className="text-secondary font-semibold animate-pulse">Submitting reflection...</span>}
                              {submitState === 'submitted' && (
                                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-secondary font-semibold flex items-center gap-1">
                                  <CheckCircle2 size={12} /> Response Submitted
                                </motion.span>
                              )}
                              {saveState === 'error' && <span className="text-red-500">Failed to save draft.</span>}
                              {submitState === 'error' && <span className="text-red-500">Failed to submit response.</span>}
                            </AnimatePresence>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleSaveDraft(thread.id)}
                              disabled={saveState === 'saving' || submitState === 'submitting'}
                              className="px-4 py-2 border border-primary/10 hover:border-primary/20 text-primary font-semibold text-xs tracking-wider uppercase rounded-xl transition-all cursor-pointer flex items-center gap-1.5 bg-transparent"
                            >
                              <Save size={12} />
                              <span>Save Draft</span>
                            </button>

                            <button
                              onClick={() => handleSubmitResponse(thread.id)}
                              disabled={!textVal.trim() || submitState === 'submitting'}
                              className="px-5 py-2.5 bg-primary hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
                            >
                              <span>Submit Response</span>
                              <Send size={11} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Collapsed/Expandable Details */
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                            className="overflow-hidden pt-4 border-t border-primary/5 space-y-4"
                          >
                            {isDetailLoading ? (
                              <div className="flex items-center gap-2 py-4 justify-center">
                                <Loader size={14} className="animate-spin text-secondary" />
                                <span className="text-xs font-serif italic text-mid/60">Fetching history...</span>
                              </div>
                            ) : detail ? (
                              <div className="space-y-5">
                                {/* Chronological Flow: Original Entry */}
                                {detail.thread.original_entry && (
                                  <div className="space-y-1.5 bg-mint-grey/20 p-4 rounded-xl border border-primary/5">
                                    <div className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider text-mid/55 select-none">
                                      <BookOpen size={11} />
                                      <span>Original Journal Entry (Day {detail.thread.original_entry.cycle_day})</span>
                                    </div>
                                    <p className="text-[13px] font-serif leading-relaxed text-primary/75">
                                      {detail.thread.original_entry.content}
                                    </p>
                                  </div>
                                )}

                                {/* Chronological Flow: Responses History */}
                                <div className="space-y-3">
                                  <div className="flex items-center gap-1 text-[9.5px] font-bold uppercase tracking-wider text-mid/55 select-none">
                                    <Clock size={11} />
                                    <span>Response History</span>
                                  </div>

                                  {detail.responses && detail.responses.length > 0 ? (
                                    <div className="space-y-3.5 pl-3 border-l border-primary/10 py-1">
                                      {detail.responses.map((resp, idx) => (
                                        <div key={resp.id} className="relative space-y-1">
                                          <div className="absolute -left-[16.5px] top-1.5 w-2 h-2 rounded-full border border-white bg-[#8DBFB4] shadow-xs" />
                                          <div className="text-[9px] text-mid/60 font-semibold">
                                            Answered {new Date(resp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {new Date(resp.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                            {resp.used_for_scoring && (
                                              <span className="ml-2 text-[8px] font-bold uppercase tracking-wider text-secondary bg-[#8DBFB4]/12 px-1.5 py-0.5 rounded">
                                                Active for scoring
                                              </span>
                                            )}
                                          </div>
                                          <p className="text-[13.5px] font-serif leading-relaxed italic text-primary">
                                            "{resp.response_text}"
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <p className="text-xs font-serif italic text-mid/60 pl-3">
                                      No response records found in history.
                                    </p>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-red-500 py-2">Could not load details.</p>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 select-none">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}
