import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  History, 
  Compass, 
  CheckCircle2, 
  Sparkle,
  BookOpen,
  ArrowDown,
  Clock,
  Loader
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';

function ThreadDetailSkeleton() {
  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      <DashboardNavbar activeTab="dashboard" />
      <main className="max-w-[800px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1 flex flex-col animate-pulse">
        <div className="h-4 w-32 bg-primary/10 rounded" />
        <div className="bg-white rounded-premium border border-primary/5 p-6 space-y-4">
          <div className="h-4 w-24 bg-primary/10 rounded" />
          <div className="h-16 bg-primary/5 rounded" />
        </div>
        <div className="bg-white rounded-premium border border-primary/5 p-6 space-y-4">
          <div className="h-4 w-24 bg-primary/10 rounded" />
          <div className="h-16 bg-primary/5 rounded" />
        </div>
      </main>
      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}

export default function ThreadDetailPage({ threadId, onSignOut }) {
  const [thread, setThread] = useState(null);
  const [responses, setResponses] = useState([]);
  const [newResponse, setNewResponse] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const loadThreadDetails = async () => {
    try {
      const data = await DashboardService.fetchThreadDetails(threadId);
      setThread(data.thread);
      setResponses(data.responses);
    } catch (err) {
      console.error('Failed to load thread details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (threadId) {
      loadThreadDetails();
    }
  }, [threadId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newResponse.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const addedResponse = await DashboardService.submitThreadResponse(threadId, newResponse);
      setNewResponse('');
      setSubmitSuccess(true);
      
      // Reload thread state & responses
      await loadThreadDetails();
      
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save reflection response:', err);
      alert('Could not save your reflection. Please check connection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWordCount = () => {
    return newResponse.trim().split(/\s+/).filter(Boolean).length;
  };

  if (isLoading) {
    return <ThreadDetailSkeleton />;
  }

  if (!thread) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
        <DashboardNavbar activeTab="dashboard" />
        <main className="flex-1 flex flex-col justify-center items-center gap-4 py-10">
          <h2 className="font-serif text-xl">Reflection thread not found.</h2>
          <button 
            onClick={() => window.navigateTo('/threads')}
            className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to threads
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      {/* Top Navbar */}
      <DashboardNavbar activeTab="dashboard" />

      {/* Main Container */}
      <main className="max-w-[720px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1 flex flex-col">
        
        {/* Back Link */}
        <button 
          onClick={() => window.navigateTo('/threads')}
          className="flex items-center gap-1.5 text-xs font-semibold text-mid hover:text-primary transition-colors cursor-pointer w-fit border-none bg-transparent"
        >
          <ArrowLeft size={14} /> Back to threads
        </button>

        {/* Chronological Flow Layout */}
        <div className="space-y-6">
          
          {/* STEP 1: Original Journal Entry */}
          {thread.original_entry ? (
            <motion.section 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-premium border border-primary/5 p-6 shadow-xs relative"
            >
              <div className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-wider text-mid/60 select-none mb-3">
                <BookOpen size={13} className="text-[#8DBFB4]" />
                <span>Original Journal Entry (Day {thread.original_entry.cycle_day} · Cycle {thread.cycle_number})</span>
              </div>
              <p className="text-[14px] font-serif leading-relaxed text-primary/80">
                {thread.original_entry.content}
              </p>
              <div className="text-[9px] text-mid/50 mt-3 font-medium">
                Written on {new Date(thread.original_entry.written_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>
            </motion.section>
          ) : (
            <div className="text-center text-xs text-mid/50 py-2">Original entry context unavailable.</div>
          )}

          <div className="flex justify-center select-none text-mid/30">
            <ArrowDown size={18} />
          </div>

          {/* STEP 2: Reflection Generated */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-premium border border-primary/5 p-6 shadow-xs"
          >
            <div className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-wider text-mid/60 select-none mb-3">
              <Sparkle size={13} className="text-secondary" />
              <span>AI Reflection</span>
            </div>
            <p className="text-[14px] font-serif leading-relaxed text-primary italic">
              "{thread.reflection_text}"
            </p>
          </motion.section>

          <div className="flex justify-center select-none text-mid/30">
            <ArrowDown size={18} />
          </div>

          {/* STEP 3: Closing Question */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-premium border border-primary/5 p-6 shadow-[0_12px_36px_rgba(30,42,46,0.03)]"
          >
            <div className="flex items-center gap-2 text-[9.5px] font-bold uppercase tracking-wider text-mid/60 select-none mb-3">
              <Compass size={13} className="text-[#E0A898]" />
              <span>Closing Question Generated</span>
            </div>
            <h2 className="font-serif text-lg md:text-xl text-primary font-semibold leading-relaxed">
              {thread.closing_question}
            </h2>
          </motion.section>

          <div className="flex justify-center select-none text-mid/30">
            <ArrowDown size={18} />
          </div>

          {/* STEP 4: User Response Stack */}
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-premium border border-primary/5 p-6 shadow-xs space-y-6"
          >
            <div className="flex items-center gap-2 border-b border-primary/5 pb-3">
              <History size={14} className="text-secondary" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">Response History</h2>
            </div>

            {responses.length === 0 ? (
              <div className="text-center py-6 select-none">
                <MessageSquare size={24} className="mx-auto text-primary/10 mb-2" />
                <p className="text-xs font-serif italic text-mid/60">No reflection responses logged yet.</p>
              </div>
            ) : (
              <div className="relative pl-6 border-l border-[#1E2A2E]/10 space-y-6 py-2">
                {responses.map((r, idx) => (
                  <div key={r.id} className="relative space-y-1">
                    <div className="absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#8DBFB4] shadow-sm" />
                    <div className="text-[10px] text-mid/60 font-semibold font-sans">
                      {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      {r.used_for_scoring && (
                        <span className="ml-2 text-[8px] font-bold uppercase tracking-wider text-secondary bg-[#8DBFB4]/12 px-1.5 py-0.5 rounded">
                          Used in scoring
                        </span>
                      )}
                    </div>
                    <p className="text-[13.5px] font-serif leading-relaxed italic text-primary">
                      "{r.response_text}"
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Input area if thread is Open */}
            {thread.status === 'Open' ? (
              <form onSubmit={handleSubmit} className="space-y-4 pt-4 border-t border-primary/5">
                <div className="bg-[#FBFBFB] border border-primary/5 rounded-xl p-4 min-h-[140px] flex flex-col justify-between">
                  <textarea
                    value={newResponse}
                    onChange={(e) => setNewResponse(e.target.value)}
                    placeholder="Type your response to the closing question..."
                    className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-serif text-[13.5px] leading-relaxed text-primary focus:ring-0 p-0 placeholder-primary/25 min-h-[90px] caret-accent"
                  />
                  <div className="pt-2 border-t border-primary/5 text-right text-[9.5px] font-medium text-mid/50 font-sans">
                    {getWordCount()} words
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 select-none">
                  <div className="flex items-center gap-1.5 text-[10px] text-mid/55">
                    <AnimatePresence>
                      {submitSuccess && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.7 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center gap-1 text-secondary"
                        >
                          <CheckCircle2 size={13} />
                          <span className="font-semibold text-[10px]">Response Logged</span>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <button
                    type="submit"
                    disabled={!newResponse.trim() || isSubmitting}
                    className="px-5 py-2.5 bg-primary hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed text-white font-semibold text-xs tracking-wider uppercase rounded-xl transition-all shadow-sm cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <span>Submitting...</span>
                    ) : (
                      <>
                        <span>Submit Response</span>
                        <Send size={12} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            ) : (
              <div className="bg-mint-grey/25 border border-primary/5 p-4 rounded-xl text-center select-none text-xs text-mid/60 font-serif italic">
                This thread has been completed and is read-only.
              </div>
            )}
          </motion.section>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 select-none">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}
