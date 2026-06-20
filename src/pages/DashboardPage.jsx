import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  ChevronRight, 
  RotateCw, 
  FileText, 
  Smile, 
  TrendingUp, 
  HeartHandshake, 
  CheckCircle2, 
  Plus, 
  CornerDownRight, 
  Settings, 
  User, 
  ArrowLeft,
  X,
  Lock,
  ArrowRight,
  Sparkles,
  PenLine,
  AlertCircle
} from 'lucide-react';
import { DashboardService } from '../services/dashboardService';
import DashboardNavbar from '../components/DashboardNavbar';

export default function DashboardPage({ user, profile, onSignOut }) {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  // Interactive writing state
  const [isWritingSession, setIsWritingSession] = useState(false);
  const [writingMode, setWritingMode] = useState('fresh'); // 'fresh' | 'continue'
  const [entryText, setEntryText] = useState('');
  const [isSavingEntry, setIsSavingEntry] = useState(false);
  const [entrySavedSuccess, setEntrySavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);
  
  // Interactive thread responding state
  const [activeThread, setActiveThread] = useState(null);
  const [threadResponse, setThreadResponse] = useState('');
  const [isSavingThread, setIsSavingThread] = useState(false);
  const [dailySessionState, setDailySessionState] = useState(null);
  const [threadsList, setThreadsList] = useState([]);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await DashboardService.fetchDashboardData();
      setData(result);
      
      try {
        const sessionData = await DashboardService.fetchActiveSession();
        setDailySessionState(sessionData);
      } catch (sErr) {
        console.warn('Could not fetch active daily session, falling back to none:', sErr);
        setDailySessionState({ exists: false });
      }

      try {
        const threads = await DashboardService.fetchActiveThreads();
        setThreadsList(threads);
      } catch (tErr) {
        console.warn('Could not fetch active threads, falling back to mock:', tErr);
        setThreadsList(result.threads);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);


  // Compute time-of-day greeting
  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good morning';
    if (hours < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const displayName = profile?.full_name || user?.name || 'Arjun';

  const handleStartWriting = (mode) => {
    window.navigateTo(`/write?mode=${mode}`);
  };

  const handleSaveEntry = async () => {
    if (entryText.trim().split(/\s+/).filter(Boolean).length < 5) return;
    setIsSavingEntry(true);
    try {
      await DashboardService.saveJournalEntry(entryText);
      // Reload dashboard data
      const result = await DashboardService.fetchDashboardData();
      setData(result);
      setEntrySavedSuccess(true);
    } catch (err) {
      console.error('Failed to save entry:', err);
      setSaveError(err.message || String(err));
    } finally {
      setIsSavingEntry(false);
    }
  };

  const handleOpenThread = (thread) => {
    setActiveThread(thread);
    setThreadResponse('');
  };

  const handleSaveThreadResponse = async () => {
    if (!threadResponse.trim()) return;
    setIsSavingThread(true);
    try {
      await DashboardService.submitThreadResponse(activeThread.id, threadResponse);
      // Reload dashboard data
      const result = await DashboardService.fetchDashboardData();
      setData(result);
      setActiveThread(null);
    } catch (err) {
      console.error('Failed to save thread response:', err);
    } finally {
      setIsSavingThread(false);
    }
  };

  // Render error screen if load failed
  if (error) {
    return (
      <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
        <DashboardNavbar activeTab="home" />
        <main className="max-w-md mx-auto px-6 pt-20 text-center space-y-6">
          <div className="flex justify-center">
            <svg className="w-12 h-12 text-[#b45309]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="font-serif text-2xl text-primary font-normal">Failed to Load Dashboard</h2>
          <p className="text-mid font-light text-sm leading-relaxed">
            We had trouble loading your entries and threads. Please check your connection and try again.
          </p>
          {error.message && (
            <div className="bg-[#fef3c7] border border-[#f59e0b]/20 text-[#92400e] text-[11px] font-mono p-3 rounded break-all text-left max-w-xs mx-auto">
              {error.message.includes('DATABASE_ERROR') || error.message.includes('PGRST') || error.message.includes('Failed to fetch')
                ? 'We could not establish a connection to the server or database. Please check your network.' 
                : error.message}
            </div>
          )}
          <button 
            onClick={loadData}
            className="px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs inline-flex items-center space-x-2 border-none"
          >
            <RotateCw className="w-3.5 h-3.5" />
            <span>Try Again</span>
          </button>
        </main>
      </div>
    );
  }

  // Render skeleton loader
  if (isLoading || !data) {
    return <DashboardSkeleton />;
  }

  // Active open threads
  const openThreads = threadsList.filter(t => t.status !== 'CLOSED');
  const addressedThreads = threadsList.filter(t => t.status === 'CLOSED');
  
  // Yesterday's entry preview (if exists)
  const yesterdayEntry = data.entries[0]?.text || '';
  const yesterdayPreview = yesterdayEntry.length > 80 ? yesterdayEntry.substring(0, 80) + '...' : yesterdayEntry;

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans relative pb-20">
      {/* Meditative Top Navbar */}
      <DashboardNavbar activeTab="home" />

      {/* Main Page Layout */}
      <main className="max-w-[1140px] mx-auto px-6 pt-6 space-y-6">
        
        {/* Welcome Section */}
        <section className="space-y-0.5">
          <div className="text-[10px] uppercase tracking-widest text-secondary font-semibold">{getGreeting()}</div>
          <h1 className="font-serif text-[26px] text-primary font-normal">Welcome back, {displayName}.</h1>
          <p className="text-xs text-mid">
            Cycle {data.cycleInfo.cycleNumber} · Day {data.cycleInfo.currentDay} of {data.cycleInfo.totalDays} · {data.cycleInfo.hasWrittenToday ? 'You wrote today' : 'Ready for today\'s reflection'}
          </p>
        </section>

        {/* Responsive Desktop 3-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          
          {/* Main Workspace (Left 2 Columns) */}
          <div className="md:col-span-2 space-y-6">
            
            {/* Today's Session Card */}
            <section className="space-y-2.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-secondary">Today's Session</div>
              
              {data.cycleInfo.hasWrittenToday ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#1E2A2E]/10 rounded-xl p-4.5 shadow-sm"
                >
                  {dailySessionState?.exists && dailySessionState?.isCompletedToday ? (
                    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 text-left items-center">
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-[#8DBFB4]/15 flex items-center justify-center text-[#8DBFB4] shrink-0">
                            <CheckCircle2 size={18} />
                          </div>
                          <h3 className="font-serif text-base text-primary">Day {dailySessionState.session.day_number} Complete</h3>
                        </div>
                        <p className="text-[11.5px] text-mid leading-relaxed">
                          Your daily reframing and journal writing are locked. The patterns are integrated.
                        </p>
                        <div className="text-[10px] text-mid/60 italic font-medium">
                          Resets at 12:00 AM (midnight) local time.
                        </div>
                      </div>

                      <div className="space-y-3 bg-secondary/5 rounded-xl p-3.5 border border-secondary/10">
                        <div className="grid grid-cols-2 gap-2 border-b border-[#1E2A2E]/5 pb-2">
                          <div>
                            <div className="text-[8px] uppercase font-bold text-secondary">Stressor Reframed</div>
                            <div className="text-[11px] font-semibold text-primary capitalize mt-0.5">
                              {dailySessionState.exercise?.stressor_type || 'General'}
                            </div>
                          </div>
                          <div>
                            <div className="text-[8px] uppercase font-bold text-secondary">Clarity Score</div>
                            <div className="text-[11px] font-semibold text-primary mt-0.5">
                              {dailySessionState.exercise?.clarity_score || 85}%
                            </div>
                          </div>
                        </div>
                        {dailySessionState.exercise?.reframed_thought && (
                          <div>
                            <div className="text-[8px] uppercase font-bold text-secondary mb-0.5">Reframed Focus</div>
                            <p className="font-serif italic text-[11px] leading-relaxed text-primary/80">
                              "{dailySessionState.exercise.reframed_thought}"
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center space-y-3">
                      <div className="w-10 h-10 rounded-full bg-[#8DBFB4]/15 flex items-center justify-center text-[#8DBFB4]">
                        <CheckCircle2 size={20} />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-serif text-base text-primary">Daily Writing Complete</h3>
                        <p className="text-[11.5px] text-mid max-w-sm leading-relaxed">
                          You have already logged a journal entry today. The guided daily session is locked for today.
                        </p>
                      </div>
                      <div className="text-[10px] text-mid/60 italic font-medium pt-0.5">
                        Resets at 12:00 AM (midnight) local time.
                      </div>
                    </div>
                  )}
                </motion.div>
              ) : dailySessionState?.exists && !dailySessionState?.isCompletedToday && dailySessionState?.session?.status !== 'complete' ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-[#8DBFB4]/35 bg-gradient-to-br from-[#8DBFB4]/3 to-transparent rounded-xl p-4.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_4px_16px_rgba(141,191,180,0.06)]"
                >
                  <div className="space-y-1">
                    <div className="text-[8px] font-bold text-[#8DBFB4] uppercase tracking-widest">SESSION IN PROGRESS</div>
                    <h3 className="font-serif text-base text-primary">Day {dailySessionState.session.day_number} Session</h3>
                    <p className="text-[11px] text-mid leading-relaxed">
                      You left off on the <span className="font-semibold capitalize">"{dailySessionState.session.status}"</span> step.
                    </p>
                  </div>
                  <button
                    onClick={() => window.navigateTo(`/session/${dailySessionState.session.status}`)}
                    className="sm:w-auto px-5 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] text-[11px] font-semibold uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <span>Resume Session</span>
                    <ArrowRight size={12} />
                  </button>
                </motion.div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Premium Start Card */}
                  <div 
                    onClick={() => window.navigateTo('/session/start')}
                    className="bg-primary text-white p-4.5 rounded-xl flex flex-col justify-between h-[130px] cursor-pointer hover:bg-[#2A3A3E] transition-all group shadow-sm border border-primary/5"
                  >
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-accent group-hover:scale-105 transition-transform">
                      <Sparkles size={14} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-bold text-accent uppercase tracking-widest">DAILY SESSION</div>
                      <h3 className="text-[13.5px] font-bold">Begin today's session</h3>
                      <p className="text-[11px] text-on-primary/60 font-light leading-snug">Guided breathing, cognitive reframing, and writing.</p>
                    </div>
                  </div>

                  {/* Secondary Fresh Entry Card */}
                  <div 
                    onClick={() => handleStartWriting('fresh')}
                    className="bg-white border border-[#1E2A2E]/8 p-4.5 rounded-xl flex flex-col justify-between h-[130px] cursor-pointer hover:shadow-md hover:border-[#1E2A2E]/15 transition-all group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-[#1E2A2E]/5 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <PenLine size={13} />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-bold text-secondary uppercase tracking-widest">FREE WRITE</div>
                      <h3 className="text-[13.5px] font-bold text-primary">Write a fresh entry</h3>
                      <p className="text-[11px] text-mid font-light leading-snug">Direct journal entry workspace without prompts.</p>
                    </div>
                  </div>
                </div>
              )}
            </section>

            {/* Active Inquiries (Open Threads) */}
            <section className="space-y-2.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-secondary">Active Inquiries</div>
              
              {openThreads.length > 0 ? (
                <div className={openThreads.length > 1 ? "grid grid-cols-1 sm:grid-cols-2 gap-4" : "space-y-3"}>
                  {openThreads.map((thread) => (
                    <div 
                      key={thread.id} 
                      role="button"
                      tabIndex={0}
                      onClick={() => window.navigateTo('/thread/' + thread.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          window.navigateTo('/thread/' + thread.id);
                        }
                      }}
                      className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all relative overflow-hidden pl-5 group focus:outline-none focus:ring-1 focus:ring-secondary/40"
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" />
                      
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold text-secondary mb-1.5">
                        <span>{thread.origin}</span>
                        <span className="text-mid font-normal font-sans lowercase">
                          {new Date(thread.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      
                      <h3 className="font-serif italic text-[14px] text-primary leading-normal pr-5 mb-2.5">
                        "{thread.question}"
                      </h3>
                      
                      <div className="flex items-center justify-between text-xs">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                          thread.status === 'NEW' ? 'bg-[#b8a8d4]/15 text-[#5A4A8A]' : thread.status === 'RETURNED' ? 'bg-[#e0a898]/12 text-[#8a3020]' : 'bg-secondary/15 text-secondary-dark'
                        }`}>
                          {thread.status}
                        </span>
                        <span className="font-semibold text-[10.5px] text-primary flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                          Write reflection <ChevronRight size={12} />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white/40 border border-dashed border-[#1E2A2E]/10 rounded-xl p-4 flex flex-col items-center justify-center text-center h-[130px]">
                  <div className="w-8 h-8 rounded-full bg-[#1E2A2E]/5 flex items-center justify-center text-[#8DBFB4] mb-1.5">
                    <CheckCircle2 size={15} />
                  </div>
                  <h4 className="text-[12px] font-semibold text-primary">All inquiries integrated</h4>
                  <p className="text-[10.5px] text-mid max-w-[190px] mt-1 leading-normal">
                    New threads surface based on patterns in your daily sessions.
                  </p>
                </div>
              )}
            </section>

            {/* Recent Writings */}
            <section className="space-y-2.5">
              <div className="text-[9px] font-bold uppercase tracking-widest text-secondary">Recent writing</div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {data.entries.slice(0, 3).map((entry) => (
                  <div 
                    key={entry.id}
                    className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4 hover:border-accent/30 transition-all space-y-1.5 group flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold text-secondary">
                        <span>{entry.day} · {entry.date}</span>
                        <span className="text-mid lowercase font-normal">{entry.words} w</span>
                      </div>
                      <p className="text-[12px] text-primary italic leading-relaxed font-serif pr-1 line-clamp-3">
                        "{entry.text}"
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>

          {/* Sidebar (Right 1 Column) */}
          <div className="md:col-span-1 space-y-4">
            
            {/* Sidebar Title */}
            <div className="text-[9px] font-bold uppercase tracking-widest text-secondary pt-0.5">Practice Insights</div>

            {/* Emotional Vocabulary Card */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => window.navigateTo('/vocab')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.navigateTo('/vocab');
                }
              }}
              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all group focus:outline-none focus:ring-1 focus:ring-secondary/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                  <Smile size={13} className="text-[#5A4A8A]" />
                  <span>Emotional Vocabulary</span>
                </div>
                <ChevronRight size={13} className="text-light-mid group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[11.5px] text-mid italic leading-relaxed">
                "Most emotion words this cycle are depletion, not feeling. Tired, drained, exhausted — but not sad, not angry."
              </p>
              <div className="flex gap-1 flex-wrap pt-0.5">
                <span className="text-[9.5px] bg-mint-grey px-1.5 py-0.5 rounded font-medium text-primary">fine ×6</span>
                <span className="text-[9.5px] bg-mint-grey px-1.5 py-0.5 rounded font-medium text-primary">tired ×4</span>
                <span className="text-[9.5px] bg-mint-grey px-1.5 py-0.5 rounded font-medium text-primary">frustrated ×3</span>
              </div>
            </div>

            {/* Active Patterns Card */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => window.navigateTo('/patterns')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.navigateTo('/patterns');
                }
              }}
              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all group focus:outline-none focus:ring-1 focus:ring-secondary/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                  <TrendingUp size={13} className="text-secondary-dark" />
                  <span>Active Patterns</span>
                </div>
                <ChevronRight size={13} className="text-light-mid group-hover:translate-x-0.5 transition-transform" />
              </div>
              <div className="space-y-2 pt-0.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                  <div className="text-[12px] font-medium text-primary truncate">Saying "fine"</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                  <div className="text-[12px] font-medium text-primary truncate">Avoidance</div>
                </div>
              </div>
            </div>

            {/* Reports & Summaries Card */}
            <div 
              role="button"
              tabIndex={0}
              onClick={() => window.navigateTo('/reports')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  window.navigateTo('/reports');
                }
              }}
              className="bg-white border border-[#1E2A2E]/8 rounded-xl p-4.5 cursor-pointer hover:shadow-xs hover:border-[#1E2A2E]/15 transition-all group focus:outline-none focus:ring-1 focus:ring-secondary/40 space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="text-[9px] font-bold uppercase tracking-widest text-secondary flex items-center gap-1.5">
                  <FileText size={13} className="text-[#8DBFB4]" />
                  <span>Reports & Summaries</span>
                </div>
                <ChevronRight size={13} className="text-light-mid group-hover:translate-x-0.5 transition-transform" />
              </div>
              <p className="text-[12.5px] text-primary font-serif italic leading-relaxed">
                "Your Week 2 summary is ready. You have 3 open threads waiting."
              </p>
              <div className="flex items-center justify-between text-[10px] text-mid hover:text-primary transition-colors pt-2 border-t border-[#1E2A2E]/5">
                <div className="flex items-center gap-1.5">
                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#e0a898]/15 text-[#8a3020]">
                    NEW SUMMARY
                  </span>
                  <span className="font-medium">Week 2 summary ready</span>
                </div>
                <ChevronRight size={12} />
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* FULL-SCREEN INTERACTIVE WRITING WORKSPACE */}
      <AnimatePresence>
        {isWritingSession && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-white z-50 overflow-y-auto flex flex-col font-serif"
          >
            {/* Top Workspace Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2A2E]/5 bg-white shrink-0">
              <button 
                onClick={() => {
                  if (entryText.trim() && !entrySavedSuccess) {
                    if (confirm('Discard this entry?')) setIsWritingSession(false);
                  } else {
                    setIsWritingSession(false);
                  }
                }}
                className="flex items-center gap-2 text-xs font-sans font-semibold text-mid hover:text-primary transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} /> Back to dashboard
              </button>
              
              <div className="text-xs font-sans font-semibold uppercase tracking-wider text-secondary">
                {writingMode === 'fresh' ? 'Fresh Entry' : 'Continue Yesterday'}
              </div>

              <div>
                <span className="text-[11px] font-sans text-mid">
                  {entryText.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
            </div>

            {/* Entry Form */}
            <div className="flex-1 max-w-[620px] mx-auto w-full px-6 pt-12 flex flex-col space-y-6">
              
              {/* Context Block for Continue Mode */}
              {writingMode === 'continue' && (
                <div className="bg-mint-grey border border-[#1e2a2e]/5 rounded-xl p-5 space-y-1.5 text-xs font-sans text-mid shrink-0">
                  <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-secondary">
                    <CornerDownRight size={12} /> Yesterday
                  </div>
                  <p className="italic font-serif leading-relaxed">
                    "{yesterdayEntry || 'No yesterday entry available.'}"
                  </p>
                </div>
              )}

              {/* Text Workspace */}
              {entrySavedSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex-1 flex flex-col justify-center items-center text-center space-y-4 font-sans py-12"
                >
                  <div className="w-16 h-16 rounded-full bg-secondary/15 flex items-center justify-center text-secondary-dark mb-2">
                    <CheckCircle2 size={32} />
                  </div>
                  <h2 className="font-serif text-2xl text-primary">Your reflection is saved.</h2>
                  <p className="text-xs text-mid max-w-sm leading-relaxed">
                    Thank you for writing. This entry has been locked and fed into your Cycle {data.cycleInfo.cycleNumber} logs.
                  </p>
                  <button 
                    onClick={() => setIsWritingSession(false)}
                    className="px-6 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer mt-4"
                  >
                    Go to Dashboard
                  </button>
                </motion.div>
              ) : (
                <textarea 
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  placeholder={writingMode === 'fresh' ? 'Whatever is actually there.' : 'Pick up the thread...'}
                  className="flex-1 w-full text-base leading-relaxed bg-transparent border-none outline-none resize-none focus:ring-0 focus:outline-none p-0 text-primary placeholder-[#1E2A2E]/20 font-serif min-h-[300px]"
                  autoFocus
                />
              )}
            </div>

            {/* Bottom Controls Bar */}
            {!entrySavedSuccess && (
              <div className="border-t border-[#1E2A2E]/5 px-6 py-4 bg-white flex items-center justify-between shrink-0">
                <span className="text-[11px] font-sans text-mid">
                  Cycle 2 · Day {data.cycleInfo.currentDay}
                </span>
                
                <button 
                  onClick={handleSaveEntry}
                  disabled={entryText.trim().split(/\s+/).filter(Boolean).length < 5 || isSavingEntry}
                  className="px-6 py-2 bg-primary text-white hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed text-xs font-sans font-semibold uppercase tracking-wider rounded transition-all cursor-pointer"
                >
                  {isSavingEntry ? 'Integrating...' : 'Done'}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL WORKSPACE TO RESPOND TO THREAD */}
      <AnimatePresence>
        {activeThread && (
          <div className="fixed inset-0 bg-[#1E2A2E]/40 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl max-w-[560px] w-full p-6 space-y-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => setActiveThread(null)}
                className="absolute top-4 right-4 text-mid hover:text-primary cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="space-y-4">
                <div>
                  <div className="text-[10px] uppercase font-bold tracking-widest text-secondary mb-1">Open Thread Question</div>
                  <h3 className="font-serif italic text-lg text-primary leading-relaxed">
                    "{activeThread.question}"
                  </h3>
                </div>

                <div className="bg-mint-grey rounded-lg p-4 space-y-1 text-xs text-mid leading-relaxed">
                  <div className="font-bold uppercase tracking-widest text-secondary text-[9px]">Context</div>
                  <p>"{activeThread.context}"</p>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-secondary">Your Reflection</label>
                  <textarea 
                    value={threadResponse}
                    onChange={(e) => setThreadResponse(e.target.value)}
                    placeholder="Write what is actually there — no structure, no editing."
                    className="w-full min-h-[140px] border border-[#1E2A2E]/15 rounded-lg p-3 text-xs leading-relaxed outline-none focus:border-primary font-sans text-primary placeholder-mid/30"
                  />
                  <div className="text-[10px] text-mid italic">
                    Your response feeds directly into your Day 28 report.
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={handleSaveThreadResponse}
                    disabled={!threadResponse.trim() || isSavingThread}
                    className="flex-1 py-2.5 bg-primary text-white hover:bg-[#2A3A3E] disabled:bg-primary/25 disabled:cursor-not-allowed rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {isSavingThread ? 'Saving...' : "That's what's there"}
                  </button>
                  <button 
                    onClick={() => setActiveThread(null)}
                    className="px-4 py-2.5 border border-[#1E2A2E]/15 rounded text-xs font-semibold text-mid hover:bg-mint-grey transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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
                      setIsWritingSession(false);
                      loadData();
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

// Skeleton Loader Component
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans pb-20 animate-pulse">
      {/* Header skeleton */}
      <header className="border-b border-[#1E2A2E]/5 px-6 py-4 sticky top-0 bg-white/70">
        <div className="max-w-[1140px] mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-gray-200" />
            <div className="w-24 h-4 bg-gray-200 rounded" />
          </div>
          <div className="flex gap-4">
            <div className="w-12 h-3 bg-gray-200 rounded hidden md:block" />
            <div className="w-12 h-3 bg-gray-200 rounded hidden md:block" />
            <div className="w-12 h-3 bg-gray-200 rounded hidden md:block" />
          </div>
          <div className="w-8 h-8 rounded-full bg-gray-200" />
        </div>
      </header>

      {/* Content skeleton */}
      <main className="max-w-[1140px] mx-auto px-6 pt-8 space-y-8">
        
        {/* Welcome Section */}
        <div className="space-y-2">
          <div className="w-16 h-3 bg-gray-200 rounded" />
          <div className="w-64 h-7 bg-gray-200 rounded" />
          <div className="w-48 h-3 bg-gray-200 rounded" />
        </div>

        {/* Responsive Grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="md:col-span-2 space-y-8">
            <div className="space-y-2">
              <div className="w-20 h-3 bg-gray-200 rounded" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="h-[150px] bg-gray-200 rounded-xl" />
                <div className="h-[150px] bg-gray-200 rounded-xl" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="w-24 h-3 bg-gray-200 rounded" />
              <div className="h-28 bg-gray-200 rounded-xl" />
            </div>

            <div className="space-y-2">
              <div className="w-24 h-3 bg-gray-200 rounded" />
              <div className="h-24 bg-gray-200 rounded-xl" />
            </div>
          </div>

          {/* Sidebar Column */}
          <div className="md:col-span-1 space-y-8">
            <div className="space-y-2">
              <div className="w-16 h-3 bg-gray-200 rounded" />
              <div className="h-[200px] bg-gray-200 rounded-xl" />
            </div>
            <div className="h-[200px] bg-gray-200 rounded-xl" />
            <div className="h-[140px] bg-gray-200 rounded-xl" />
          </div>
        </div>
      </main>
    </div>
  );
}
