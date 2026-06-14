import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MessageSquare, 
  Send, 
  History, 
  Compass, 
  CheckCircle2, 
  Sparkle
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';

function ThreadDetailSkeleton() {
  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      <DashboardNavbar activeTab="dashboard" />
      <main className="max-w-[1040px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1 flex flex-col animate-pulse">
        {/* Back Link Skeleton */}
        <div className="h-4 w-32 bg-primary/10 rounded" />
        
        {/* Thread Header Skeleton */}
        <div className="bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.03)] space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-primary/10 rounded-full" />
            <div className="h-5 w-16 bg-primary/10 rounded-full" />
          </div>
          <div className="h-8 w-3/4 bg-primary/10 rounded" />
        </div>

        {/* Columns Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
          {/* History Skeleton */}
          <div className="md:col-span-7 bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.03)] min-h-[350px] space-y-6">
            <div className="h-5 w-32 bg-primary/10 rounded border-b border-primary/5 pb-3" />
            <div className="space-y-4">
              <div className="h-16 bg-primary/5 rounded" />
              <div className="h-16 bg-primary/5 rounded" />
            </div>
          </div>
          {/* Editor Skeleton */}
          <div className="md:col-span-5 bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.03)] space-y-4">
            <div className="h-5 w-32 bg-primary/10 rounded border-b border-primary/5 pb-3" />
            <div className="h-44 bg-primary/5 rounded" />
            <div className="h-10 w-24 bg-primary/10 rounded ml-auto" />
          </div>
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
      setResponses((prev) => [...prev, addedResponse]);
      setNewResponse('');
      setSubmitSuccess(true);
      
      // Reload thread state (since status might shift from NEW to ACTIVE)
      const data = await DashboardService.fetchThreadDetails(threadId);
      setThread(data.thread);
      
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
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline cursor-pointer"
          >
            <ArrowLeft size={14} /> Back to dashboard
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
      <main className="max-w-[1040px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1 flex flex-col">
        
        {/* Back Link */}
        <button 
          onClick={() => window.navigateTo('/dashboard')}
          className="flex items-center gap-1.5 text-xs font-semibold text-mid hover:text-primary transition-colors cursor-pointer w-fit border-none bg-transparent"
        >
          <ArrowLeft size={14} /> Back to dashboard
        </button>

        {/* Thread Header details */}
        <section className="bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.03)] space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#8DBFB4] bg-[#8DBFB4]/10 px-2.5 py-0.5 rounded-full">
              {thread.origin}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${
              thread.status === 'NEW' 
                ? 'bg-[#b8a8d4]/15 text-[#5A4A8A]' 
                : thread.status === 'RETURNED'
                ? 'bg-[#e0a898]/12 text-[#8a3020]'
                : 'bg-secondary/15 text-secondary-dark'
            }`}>
              {thread.status}
            </span>
          </div>

          <h1 className="font-serif text-2xl md:text-3xl text-primary font-normal leading-relaxed italic">
            "{thread.question}"
          </h1>
        </section>

        {/* Dynamic Split Column (Responses vs Editor) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start flex-1">
          
          {/* Timeline of previous responses (Left 7 cols) */}
          <section className="md:col-span-7 bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.03)] min-h-[350px] flex flex-col justify-between">
            <div className="space-y-6">
              <div className="flex items-center gap-2 border-b border-primary/5 pb-3">
                <History size={15} className="text-secondary" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">Reflection History</h2>
              </div>

              {responses.length === 0 ? (
                <div className="text-center py-12 space-y-2 select-none">
                  <MessageSquare size={32} className="mx-auto text-primary/10" />
                  <p className="text-xs font-serif italic text-mid/60">No reflection entries logged for this thread yet.</p>
                </div>
              ) : (
                <div className="relative pl-6 border-l border-[#1E2A2E]/10 space-y-6 py-2">
                  {responses.map((r, idx) => (
                    <div key={r.id} className="relative space-y-1">
                      {/* Timeline node dot */}
                      <div className="absolute -left-[29.5px] top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white bg-[#8DBFB4] shadow-sm" />
                      
                      <div className="text-[10px] text-mid/60 font-medium font-sans">
                        {new Date(r.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} at {new Date(r.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      
                      <p className="text-[13.5px] font-serif leading-relaxed italic text-primary">
                        "{r.response}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* New reflection response editor (Right 5 cols) */}
          <section className="md:col-span-5 bg-white rounded-premium border border-primary/5 p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.03)] space-y-4">
            <div className="flex items-center gap-2 border-b border-primary/5 pb-3 select-none">
              <Compass size={15} className="text-accent" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-secondary">New Reflection</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="bg-[#FBFBFB] border border-primary/5 rounded-xl p-4.5 min-h-[180px] flex flex-col justify-between">
                <textarea
                  value={newResponse}
                  onChange={(e) => setNewResponse(e.target.value)}
                  placeholder="Record what is actually there. Try to avoid formatting or censoring your reflection..."
                  className="w-full flex-1 bg-transparent border-0 outline-none resize-none font-serif text-[13.5px] leading-relaxed text-primary focus:ring-0 p-0 placeholder-primary/25 min-h-[120px] caret-accent"
                  autoFocus
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
                        initial={{ opacity: 0, scale: 0.7, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.7 }}
                        transition={{ type: "spring", stiffness: 300, damping: 15 }}
                        className="flex items-center gap-1.5 text-secondary"
                      >
                        <CheckCircle2 size={13} />
                        <span className="font-semibold text-[10.5px]">Reflection Logged</span>
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
                    <span>Saving...</span>
                  ) : (
                    <>
                      <span>Submit</span>
                      <Send size={12} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </section>

        </div>

      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 select-none">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}
