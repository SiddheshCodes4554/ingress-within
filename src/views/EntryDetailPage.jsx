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
  Clock,
  HeartHandshake,
  CheckCircle2
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import { PostJournalInterventions } from '../components/interventions/PostJournalInterventions';
import { InterventionPlayer } from '../components/interventions/player/InterventionPlayer';

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
  const [playerInterventionId, setPlayerInterventionId] = useState(null);
  const [reflectionAnswerText, setReflectionAnswerText] = useState('');
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [answerError, setAnswerError] = useState(null);
  const [isEditingAnswer, setIsEditingAnswer] = useState(false);

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
      if (json.reflection?.reflection_answer) {
        setReflectionAnswerText(json.reflection.reflection_answer);
      } else if (json.entry?.decrypted_reflection_text) {
        setReflectionAnswerText(json.entry.decrypted_reflection_text);
      }
    } catch (err) {
      console.error('[EntryDetailPage] Fetch Error:', err);
      setError(err.message || 'An unexpected network error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveReflectionAnswer = async () => {
    const reflectionId = data?.reflection?.id;
    if (!reflectionAnswerText.trim() || !reflectionId) return;
    setIsSubmittingAnswer(true);
    setAnswerError(null);
    try {
      const res = await fetch('/api/reflections/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reflectionId,
          answer: reflectionAnswerText.trim(),
          status: 'completed'
        })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error?.message || 'Failed to save reflection response.');
      }
      setData(prev => ({
        ...prev,
        reflection: {
          ...prev.reflection,
          reflection_answer: reflectionAnswerText.trim(),
          status: 'completed',
          answered_at: new Date().toISOString()
        }
      }));
      setIsEditingAnswer(false);
    } catch (err) {
      console.error('[EntryDetailPage] Failed to submit reflection answer:', err);
      setAnswerError(err.message || 'Failed to save reflection answer.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  useEffect(() => {
    if (entryId) {
      fetchEntryDetails();
    }
  }, [entryId]);

  if (playerInterventionId) {
    return (
      <InterventionPlayer
        interventionId={playerInterventionId}
        onBack={() => setPlayerInterventionId(null)}
        onComplete={() => {
          setPlayerInterventionId(null);
          if (typeof window !== 'undefined') {
            if (typeof window.navigateTo === 'function') window.navigateTo('/dashboard');
            else window.location.href = '/dashboard';
          }
        }}
      />
    );
  }

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
                    <HeartHandshake size={10} />
                    Crisis Support Active
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

        {/* Two Column Layout: Journal Entry vs AI Reflection & Crisis Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Original Journal Entry */}
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

          {/* Right Column: AI Reflection & Crisis Support Banner */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Compact Crisis Support Banner if Crisis Flagged */}
            {entry.crisis_flag && (
              <div className="bg-white rounded-xl border border-accent/20 p-5 shadow-xs space-y-4">
                <div className="flex items-start gap-2.5 text-accent font-semibold">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <div>
                    <div className="text-xs">Confidential Support Services</div>
                    <p className="text-[11px] text-mid font-normal leading-relaxed mt-0.5">
                      This entry was flagged for emotional support. Confidential resources are available 24/7.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  <a 
                    href="tel:9152987821" 
                    className="flex flex-col items-center justify-center p-2.5 bg-accent/5 hover:bg-accent/15 border border-accent/20 rounded-xl transition-all text-center group"
                  >
                    <div className="font-semibold text-[11px] text-primary group-hover:text-accent">iCall</div>
                    <span className="text-[9px] uppercase font-bold text-accent mt-1">Call</span>
                  </a>

                  <a 
                    href="tel:18602662345" 
                    className="flex flex-col items-center justify-center p-2.5 bg-[#8DBFB4]/10 hover:bg-[#8DBFB4]/20 border border-[#8DBFB4]/25 rounded-xl transition-all text-center group"
                  >
                    <div className="font-semibold text-[11px] text-primary group-hover:text-[#1A5040]">Vandrevala</div>
                    <span className="text-[9px] uppercase font-bold text-[#1A5040] mt-1">24/7</span>
                  </a>

                  <a 
                    href="https://wa.me/919152987821" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex flex-col items-center justify-center p-2.5 bg-[#B8A8D4]/10 hover:bg-[#B8A8D4]/20 border border-[#B8A8D4]/25 rounded-xl transition-all text-center group"
                  >
                    <div className="font-semibold text-[11px] text-primary group-hover:text-[#5A4A8A]">WhatsApp</div>
                    <span className="text-[9px] uppercase font-bold text-[#5A4A8A] mt-1">Text</span>
                  </a>
                </div>
              </div>
            )}

            {/* AI Reflection Card */}
            <div className="bg-white rounded-xl border border-[#1E2A2E]/5 p-6 shadow-[0_8px_32px_rgba(30,42,46,0.02)] space-y-5">
              <div className="border-b border-[#1E2A2E]/5 pb-3 flex items-center justify-between">
                <h3 className="font-serif text-[15px] text-primary font-normal flex items-center gap-2">
                  <Compass size={16} className="text-[#5A4A8A]" />
                  <span>AI Reflection</span>
                </h3>
                
                {reflection?.classification && (
                  <span className="text-[8.5px] bg-[#5A4A8A]/10 text-[#5A4A8A] font-bold uppercase tracking-widest px-2 py-0.5 rounded">
                    {reflection.classification}
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <p className="text-[13px] text-primary leading-relaxed whitespace-pre-wrap font-serif">
                  {reflection?.reflection_text && !reflection.reflection_text.includes('Processing')
                    ? reflection.reflection_text
                    : "You described your situation with attention and care today. We are holding a quiet, grounding space for your thoughts."
                  }
                </p>
                
                {/* Reflection Question */}
                <div className="p-4 bg-secondary/5 rounded-xl border border-secondary/15 space-y-2 mt-3 text-left">
                  <div className="text-[8.5px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                    <HelpCircle size={11} />
                    <span>Reflection Question for Contemplation</span>
                  </div>
                  <p className="font-serif text-sm italic text-primary/95 leading-relaxed">
                    "{reflection?.closing_question || "What is feeling the most steady or grounding for you right now?"}"
                  </p>
                </div>

                {/* Reflection Answer Section */}
                {(() => {
                  const existingAnswer = reflection?.reflection_answer || entry?.decrypted_reflection_text;
                  const isAnswered = Boolean(existingAnswer && existingAnswer.trim() && !isEditingAnswer);

                  if (isAnswered) {
                    return (
                      <div className="p-4 bg-[#8DBFB4]/10 rounded-xl border border-[#8DBFB4]/25 space-y-2 mt-3 text-left">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-[#1A5040] flex items-center gap-1">
                            <CheckCircle2 size={12} className="text-[#8DBFB4]" />
                            <span>Your Answer</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setReflectionAnswerText(existingAnswer);
                              setIsEditingAnswer(true);
                            }}
                            className="text-[9.5px] font-semibold text-[#1A5040] hover:underline cursor-pointer border-none bg-transparent"
                          >
                            Edit Answer
                          </button>
                        </div>
                        <p className="font-serif text-[13.5px] italic text-primary leading-relaxed pl-2.5 border-l-2 border-[#8DBFB4]/50">
                          "{existingAnswer}"
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="p-4 bg-white rounded-xl border border-[#1E2A2E]/10 space-y-3 mt-3 text-left">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1">
                        <Sparkles size={11} />
                        <span>Answer Reflection Question</span>
                      </div>
                      {answerError && (
                        <div className="text-[11px] text-accent font-semibold">{answerError}</div>
                      )}
                      <textarea
                        value={reflectionAnswerText}
                        onChange={(e) => setReflectionAnswerText(e.target.value)}
                        placeholder="Write your response to this reflection question..."
                        className="w-full min-h-[90px] border border-[#1E2A2E]/10 rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder:text-mid/40 placeholder:font-serif italic resize-y"
                      />
                      <div className="flex items-center justify-end gap-2">
                        {isEditingAnswer && (
                          <button
                            type="button"
                            onClick={() => setIsEditingAnswer(false)}
                            className="px-3 py-1.5 rounded text-[11px] font-semibold text-mid hover:text-primary bg-transparent border-none cursor-pointer"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveReflectionAnswer}
                          disabled={isSubmittingAnswer || !reflectionAnswerText.trim()}
                          className={`px-4 py-1.5 rounded text-[11px] font-semibold uppercase tracking-wider transition-all border-none ${
                            isSubmittingAnswer || !reflectionAnswerText.trim()
                              ? 'bg-primary/20 text-white cursor-not-allowed'
                              : 'bg-primary text-white hover:bg-[#2A3A3E] cursor-pointer shadow-xs'
                          }`}
                        >
                          {isSubmittingAnswer ? 'Saving...' : 'Submit Answer'}
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
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

        {/* Full-Width Bottom Section: Daily Practices & Crisis Recommendations */}
        <div className="pt-8 border-t border-[#1E2A2E]/10">
          <PostJournalInterventions
            isCrisis={Boolean(entry.crisis_flag)}
            onLaunchIntervention={(id) => setPlayerInterventionId(id)}
          />
        </div>
      </main>

      <footer className="py-6 border-t border-primary/5 bg-white text-center text-[10px] text-mid/60 mt-12">
        Ingress Within · Secure Encryption Active
      </footer>
    </div>
  );
}
