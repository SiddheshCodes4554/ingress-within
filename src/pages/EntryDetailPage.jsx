import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  BookOpen, 
  Smile, 
  Activity, 
  Compass, 
  MessageSquare, 
  Sparkles, 
  Calendar, 
  Layers, 
  AlertCircle,
  HelpCircle,
  Clock
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

function EntryDetailSkeleton() {
  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      <DashboardNavbar activeTab="home" />
      <main className="max-w-[1140px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1 flex flex-col animate-pulse">
        <div className="h-4 w-32 bg-primary/10 rounded" />
        
        {/* Header Skeleton */}
        <div className="bg-white rounded-xl border border-primary/5 p-6 shadow-xs space-y-4">
          <div className="flex gap-2">
            <div className="h-5 w-20 bg-primary/10 rounded-full" />
            <div className="h-5 w-20 bg-primary/10 rounded-full" />
          </div>
          <div className="h-8 w-1/3 bg-primary/10 rounded" />
        </div>

        {/* Content Columns Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start flex-1">
          <div className="lg:col-span-7 bg-white rounded-xl border border-primary/5 p-6 min-h-[350px] space-y-6">
            <div className="h-5 w-40 bg-primary/10 rounded border-b border-primary/5 pb-3" />
            <div className="space-y-3">
              <div className="h-4 bg-primary/5 rounded w-full" />
              <div className="h-4 bg-primary/5 rounded w-11/12" />
              <div className="h-4 bg-primary/5 rounded w-4/5" />
            </div>
          </div>
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-xl border border-primary/5 p-6 space-y-4">
              <div className="h-5 w-32 bg-primary/10 rounded border-b border-primary/5 pb-3" />
              <div className="h-20 bg-primary/5 rounded" />
            </div>
            <div className="bg-white rounded-xl border border-primary/5 p-6 space-y-4">
              <div className="h-5 w-48 bg-primary/10 rounded border-b border-primary/5 pb-3" />
              <div className="h-24 bg-primary/5 rounded" />
            </div>
          </div>
        </div>
      </main>
      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}

export default function EntryDetailPage({ entryId, onSignOut }) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEntryDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/entries/${entryId}`);
      if (!res.ok) {
        throw new Error('Failed to retrieve journal entry details.');
      }
      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error?.message || 'Failed to retrieve journal entry details.');
      }
      setData(json);
    } catch (err) {
      console.error('[EntryDetailPage] Fetch Error:', err);
      setError(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (entryId) {
      fetchEntryDetails();
    }
  }, [entryId]);

  if (isLoading) {
    return <EntryDetailSkeleton />;
  }

  if (error || !data || !data.entry) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
        <DashboardNavbar activeTab="home" />
        <main className="max-w-[1140px] w-full mx-auto px-6 pt-20 text-center space-y-6 flex-1">
          <div className="flex justify-center">
            <AlertCircle className="w-12 h-12 text-[#b45309]" />
          </div>
          <h2 className="font-serif text-2xl text-primary font-normal">Failed to Load Entry</h2>
          <p className="text-mid font-light text-sm max-w-sm mx-auto leading-relaxed">
            {error || 'We could not fetch the details for this journal entry.'}
          </p>
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2 border-none"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </button>
        </main>
        <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60">
          Ingress Within
        </footer>
      </div>
    );
  }

  const { entry, reflection, previousEntry, previousReflection } = data;

  const dateStr = new Date(entry.created_at).toLocaleDateString('en-GB', { 
    weekday: 'long',
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });

  const timeStr = new Date(entry.created_at).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate scores for visual display
  const hasScores = entry.day_ei !== null && entry.day_pr !== null && entry.day_sa !== null;
  const scores = [
    { label: 'Emotional Intelligence', value: entry.day_ei, color: 'bg-[#8DBFB4]' },
    { label: 'Personal Resolve', value: entry.day_pr, color: 'bg-[#E0A898]' },
    { label: 'Self Awareness', value: entry.day_sa, color: 'bg-[#B8A8D4]' }
  ];

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between">
      <DashboardNavbar activeTab="home" />

      <main className="max-w-[1140px] w-full mx-auto px-6 pt-6 pb-20 space-y-6 flex-1">
        
        {/* Navigation & Header */}
        <div className="space-y-4">
          <button 
            onClick={() => window.navigateTo('/dashboard')}
            className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-secondary hover:text-primary transition-colors cursor-pointer border-none bg-transparent"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-1">
            <div className="space-y-2">
              <div className="flex gap-2 flex-wrap">
                <span className={`px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-widest ${
                  entry.entry_type === 'guided' || entry.session_id 
                    ? 'bg-[#8DBFB4]/15 text-[#1A5040]' 
                    : 'bg-primary/5 text-primary'
                }`}>
                  {entry.entry_type === 'guided' || entry.session_id ? 'Guided Session' : 'Free Write'}
                </span>
                {entry.cycle_day && (
                  <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary text-[9.5px] font-bold uppercase tracking-widest rounded-full">
                    Day {entry.cycle_day}
                  </span>
                )}
                {entry.crisis_flag && (
                  <span className="px-2.5 py-0.5 bg-accent/15 text-accent text-[9.5px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1">
                    <AlertCircle size={10} />
                    Crisis Suppressed
                  </span>
                )}
              </div>
              <h1 className="font-serif text-[26px] md:text-[32px] text-primary font-normal leading-tight">
                {dateStr}
              </h1>
              <div className="flex items-center gap-4 text-xs text-mid">
                <span className="flex items-center gap-1"><Clock size={13} /> {timeStr}</span>
                <span>·</span>
                <span>{entry.word_count || 0} words</span>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Original Journal Entry & Vocabulary */}
          <div className="lg:col-span-7 space-y-6">
            <div className="bg-white rounded-xl border border-[#1E2A2E]/5 p-6 md:p-8 shadow-[0_8px_32px_rgba(30,42,46,0.02)] space-y-6">
              <div className="border-b border-[#1E2A2E]/5 pb-4 flex items-center justify-between">
                <h2 className="font-serif text-lg text-primary font-normal flex items-center gap-2">
                  <BookOpen size={18} className="text-secondary" />
                  <span>Journal Entry</span>
                </h2>
              </div>
              
              <div className="font-serif text-[15px] leading-relaxed text-primary/95 whitespace-pre-wrap italic pl-4 border-l-2 border-[#8DBFB4]/30 select-text">
                "{entry.content}"
              </div>
            </div>
          </div>

          {/* Right Column: AI Reflection & Continuity */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* AI Reflection Output Card */}
            <div className="bg-white rounded-xl border border-[#1E2A2E]/5 p-6 shadow-[0_8px_32px_rgba(30,42,46,0.02)] space-y-5">
              <div className="border-b border-[#1E2A2E]/5 pb-3 flex items-center justify-between">
                <h3 className="font-serif text-[15px] text-primary font-normal flex items-center gap-2">
                  <Compass size={16} className="text-[#5A4A8A]" />
                  <span>AI Reflection</span>
                </h3>
                
                {reflection && (
                  <div className="flex gap-1.5">
                    {reflection.classification && (
                      <span className="text-[8.5px] bg-[#5A4A8A]/10 text-[#5A4A8A] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                        {reflection.classification}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {reflection ? (
                <div className="space-y-4">
                  {reflection.status === 'failed' || entry.crisis_flag ? (
                    <div className="p-4 bg-accent/5 border border-accent/15 rounded-xl space-y-3">
                      <div className="flex items-start gap-2.5 text-accent">
                        <AlertCircle size={15} className="mt-0.5 shrink-0" />
                        <div className="text-[11.5px] font-medium leading-relaxed">
                          {reflection.reflection_text || 'Reflection suppressed due to crisis protocol.'}
                        </div>
                      </div>
                      <div className="text-[10.5px] text-mid leading-relaxed pl-6">
                        We noticed this entry carries significant distress. We have muted the AI evaluation to hold a safe space. Please take a look at the support resources in the header menu.
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="text-[12.5px] text-primary leading-relaxed whitespace-pre-wrap">
                        {reflection.reflection_text}
                      </p>
                      
                      {reflection.closing_question && (
                        <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/15 space-y-1.5">
                          <div className="text-[8px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                            <HelpCircle size={10} />
                            <span>Inquiry for contemplation</span>
                          </div>
                          <p className="font-serif text-sm italic text-primary/95 leading-relaxed">
                            "{reflection.closing_question}"
                          </p>
                        </div>
                      )}

                      {reflection.reflection_answer && (
                        <div className="p-4 bg-mint-grey/25 rounded-xl border border-[#1E2A2E]/5 space-y-2 text-left relative overflow-hidden pl-5">
                          <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-secondary" />
                          <div className="text-[8px] uppercase font-bold text-secondary tracking-widest flex items-center gap-1.5">
                            <span>Your Response</span>
                            {reflection.answered_at && (
                              <span className="text-[9.5px] text-mid/60 font-normal font-sans lowercase">
                                (on {new Date(reflection.answered_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})
                              </span>
                            )}
                          </div>
                          <p className="font-serif italic text-primary/95 text-[12.5px] leading-relaxed whitespace-pre-wrap">
                            "{reflection.reflection_answer}"
                          </p>
                        </div>
                      )}

                    </>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 space-y-3">
                  <div className="w-8 h-8 rounded-full border border-dashed border-[#1E2A2E]/20 flex items-center justify-center text-light-mid animate-spin mx-auto" style={{ animationDuration: '3s' }}>
                    <Sparkles size={14} />
                  </div>
                  <p className="text-[11.5px] text-mid italic">
                    AI Reflection is currently compiling. Check back shortly.
                  </p>
                </div>
              )}
            </div>

            {/* Reflection Continuity Flow Card */}
            {entry.decrypted_reflection_text && previousReflection && (
              <div className="bg-white rounded-xl border border-[#1E2A2E]/5 p-6 shadow-[0_8px_32px_rgba(30,42,46,0.02)] space-y-5">
                <div className="border-b border-[#1E2A2E]/5 pb-3">
                  <h3 className="font-serif text-[15px] text-primary font-normal flex items-center gap-2">
                    <MessageSquare size={16} className="text-secondary" />
                    <span>Reflection Continuity Flow</span>
                  </h3>
                </div>

                <div className="relative border-l border-[#1E2A2E]/10 pl-5 ml-2 space-y-6">
                  
                  {/* Step 1: Yesterday's Prompt */}
                  <div className="relative space-y-2">
                    {/* Circle Dot Linker */}
                    <div className="absolute -left-[25px] top-1.5 w-[9px] h-[9px] rounded-full border border-secondary bg-white" />
                    
                    <div className="flex items-center gap-1.5 text-[8.5px] uppercase font-bold text-secondary">
                      <span>Yesterday's Contemplation</span>
                      {previousEntry && (
                        <span className="lowercase font-normal text-mid/70">
                          (from {new Date(previousEntry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })})
                        </span>
                      )}
                    </div>
                    
                    {previousReflection.reflection_text && (
                      <p className="text-[11px] text-mid leading-relaxed line-clamp-2 italic pr-2">
                        "{previousReflection.reflection_text.split('\n')[0]}"
                      </p>
                    )}
                    
                    {previousReflection.closing_question && (
                      <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/5 font-serif text-[12px] italic text-primary pr-2 leading-relaxed">
                        "{previousReflection.closing_question}"
                      </div>
                    )}
                  </div>

                  {/* Step 2: Today's Response */}
                  <div className="relative space-y-2">
                    {/* Circle Dot Linker */}
                    <div className="absolute -left-[25px] top-1.5 w-[9px] h-[9px] rounded-full bg-secondary" />
                    
                    <div className="text-[8.5px] uppercase font-bold text-secondary">
                      Your Response Today
                    </div>
                    
                    <p className="text-[12.5px] text-primary leading-relaxed whitespace-pre-wrap font-serif italic pl-3 border-l border-[#8DBFB4]/40 select-text">
                      "{entry.decrypted_reflection_text}"
                    </p>
                  </div>

                </div>
              </div>
            )}

          </div>

        </div>

      </main>

      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 mt-12">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}
