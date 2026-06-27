import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Trash2, 
  RotateCw, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldAlert, 
  Clock, 
  Brain, 
  MessageSquare,
  Sparkles,
  Sliders,
  Sparkle,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ArrowDown,
  Loader
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

// No preset scenarios to avoid evaluation bias

export default function FounderTestPage() {
  const [reflectionText, setReflectionText] = useState('');
  const [newEntryText, setNewEntryText] = useState('');
  const [provider, setProvider] = useState('groq');
  
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);

  // Poll state
  const [isPolling, setIsPolling] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);

  // Historical Review Tab States
  const [activeTab, setActiveTab] = useState('analyzer');
  const [historyEntries, setHistoryEntries] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState({});
  const [expandedCycles, setExpandedCycles] = useState({});

  // Reflection Threads Tab States
  const [testThreads, setTestThreads] = useState([]);
  const [isThreadsLoading, setIsThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);
  const [testThreadResponses, setTestThreadResponses] = useState({});

  const toggleCycleExpand = (cycleNum) => {
    setExpandedCycles(prev => ({
      ...prev,
      [cycleNum]: !prev[cycleNum]
    }));
  };

  const fetchHistoryEntries = async () => {
    setIsHistoryLoading(true);
    setHistoryError(null);
    try {
      const res = await fetch('/api/entries');
      if (!res.ok) throw new Error('Failed to retrieve history entries.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to retrieve history entries.');
      setHistoryEntries(data.entries || []);
    } catch (err) {
      console.error(err);
      setHistoryError(err.message);
    } finally {
      setIsHistoryLoading(false);
    }
  };

  const fetchTestThreadsAndResponses = async () => {
    setIsThreadsLoading(true);
    setThreadsError(null);
    try {
      const res = await fetch('/api/threads');
      if (!res.ok) throw new Error('Failed to fetch threads.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch threads.');
      
      const loadedThreads = data.threads || [];
      setTestThreads(loadedThreads);

      // Load responses for all threads concurrently
      const responsesMap = {};
      await Promise.all(loadedThreads.map(async (t) => {
        try {
          const detailRes = await fetch(`/api/threads/${t.id}`);
          if (detailRes.ok) {
            const detailData = await detailRes.json();
            responsesMap[t.id] = detailData.responses || [];
          }
        } catch (err) {
          console.error(err);
        }
      }));
      setTestThreadResponses(responsesMap);
    } catch (err) {
      console.error(err);
      setThreadsError(err.message);
    } finally {
      setIsThreadsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryEntries();
    } else if (activeTab === 'threads') {
      fetchTestThreadsAndResponses();
    }
  }, [activeTab]);

  const toggleEntryExpand = (id) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleClear = () => {
    setReflectionText('');
    setNewEntryText('');
    setResults(null);
    setError(null);
    setCurrentEntryId(null);
    setIsPolling(false);
  };

  const runAnalysis = async () => {
    if (!reflectionText.trim() && !newEntryText.trim()) return;

    setIsLoading(true);
    setError(null);
    setResults(null);
    setIsPolling(true);

    try {
      const res = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-full',
          reflectionText,
          newEntryText,
          provider
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to trigger pipeline.');

      setCurrentEntryId(data.entryId);
    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
      setIsPolling(false);
    }
  };

  useEffect(() => {
    if (!isPolling || !currentEntryId) return;

    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/test-pipeline', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'job-status',
            entryId: currentEntryId
          })
        });
        const data = await res.json();

        if (res.ok && data.jobs) {
          const scoringDone = data.jobs.scoring.status === 'COMPLETED' || data.jobs.scoring.status === 'FAILED';
          const crisisDone = data.jobs.crisis.status === 'COMPLETED' || data.jobs.crisis.status === 'FAILED';
          const reflectionDone = data.jobs.reflection.status === 'COMPLETED' || data.jobs.reflection.status === 'FAILED';
          const vocabDone = !data.jobs.vocab || data.jobs.vocab.status === 'COMPLETED' || data.jobs.vocab.status === 'FAILED';

          if ((scoringDone && crisisDone && reflectionDone && vocabDone) || attempts >= 20) {
            clearInterval(interval);
            setIsPolling(false);
            setIsLoading(false);

            if (data.entryState) {
              const entry = data.entryState;
              let entryType = 'Empty';
              if (entry.entry_type === 'both') entryType = 'Both';
              else if (entry.entry_type === 'new_only') entryType = 'New Only';
              else if (entry.entry_type === 'reflection_only') entryType = 'Reflection Only';

              setResults({
                success: entry.scoring_status !== 'failed',
                entryType,
                errorReason: entry.scoring_status === 'failed' ? entry.confidence_reason : null,
                scores: {
                  day_ei: entry.day_ei,
                  day_pr: entry.day_pr,
                  day_sa: entry.day_sa,
                  reflection: entry.reflection_ei !== null ? { ei: entry.reflection_ei, pr: entry.reflection_pr, sa: entry.reflection_sa } : null,
                  newEntry: entry.new_entry_ei !== null ? { ei: entry.new_entry_ei, pr: entry.new_entry_pr, sa: entry.new_entry_sa } : null
                },
                crisis: {
                  crisisFlag: entry.crisis_flag,
                  crisisType: entry.crisis_type,
                  explanation: entry.crisis_flag 
                    ? `Crisis triggered. Category: ${entry.crisis_type}. ${entry.risk_language_quote ? `Quote: "${entry.risk_language_quote}"` : ''}`
                    : `Evaluated safe. No crisis patterns identified.`,
                  reflectionSuppressed: entry.reflection_suppressed
                },
                reflection: data.reflectionState ? {
                  reflection_text: data.reflectionState.reflection_text,
                  provider: data.reflectionState.provider,
                  confidence: data.reflectionState.confidence,
                  themes: data.reflectionState.themes,
                  vocabulary: data.reflectionState.vocabulary,
                  status: data.reflectionState.status,
                  closing_question: data.reflectionState.closing_question,
                  classification: data.reflectionState.classification
                } : null,
                vocabState: data.vocabState || null,
                latency: data.jobs.scoring.executionTime ? data.jobs.scoring.executionTime + (data.jobs.reflection.executionTime || 0) : 1200
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error polling status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isPolling, currentEntryId]);

  return (
    <div className="min-h-screen bg-[#F4F6F5] text-[#1E2E2A] font-sans flex flex-col justify-between">
      <DashboardNavbar activeTab="settings" />

      <main className="flex-1 max-w-[1200px] w-full mx-auto px-6 py-10">
        
        {/* Header Section */}
        <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-primary/5 pb-8">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary/70 block mb-1">Ingress Within</span>
            <h1 className="font-serif text-3xl font-light text-primary flex items-center gap-3">
              <span>Journal Entry Analysis</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 bg-white px-4 py-2.5 rounded-xl border border-primary/5 shadow-xs">
              <Sliders size={14} className="text-secondary" />
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                className="bg-transparent text-xs font-semibold text-primary border-none outline-none cursor-pointer focus:ring-0 p-0"
              >
                <option value="groq">Groq (Llama 3.3)</option>
                <option value="claude">Claude (Sonnet 3.5)</option>
              </select>
            </div>
            
            <button 
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2.5 border border-primary/10 hover:border-primary/20 bg-white text-[#8a3020] hover:bg-[#8a3020]/5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-primary/10">
          <button
            onClick={() => setActiveTab('analyzer')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'analyzer'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Entry Analyzer
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Historical Review
          </button>
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'threads'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Reflection Threads
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl text-[#8a3020] text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">System Error:</span> {error}
            </div>
          </div>
        )}

        {activeTab === 'analyzer' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Input Simulator */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-primary/5 pb-3">
                <Brain size={16} className="text-secondary" />
                <h2 className="font-serif text-lg font-normal text-primary">Journal Input</h2>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-mid block">Optional Reflection Input Area</label>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Describe how yesterday's action went..."
                    className="w-full min-h-[90px] p-4 bg-[#F4F6F5] border border-transparent focus:border-secondary/20 rounded-xl text-xs font-sans leading-relaxed text-primary outline-none resize-none transition-all placeholder-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-mid block">Single Journal Input Area</label>
                  <textarea
                    value={newEntryText}
                    onChange={(e) => setNewEntryText(e.target.value)}
                    placeholder="What's on your mind today?"
                    className="w-full min-h-[160px] p-4 bg-[#F4F6F5] border border-transparent focus:border-secondary/20 rounded-xl text-xs font-sans leading-relaxed text-primary outline-none resize-none transition-all placeholder-primary/30"
                  />
                </div>
              </div>

              <button
                onClick={runAnalysis}
                disabled={isLoading || (!reflectionText.trim() && !newEntryText.trim())}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white py-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-40"
              >
                {isLoading ? (
                  <RotateCw size={14} className="animate-spin" />
                ) : (
                  <Play size={14} fill="currentColor" />
                )}
                <span>Run Analysis</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-6 space-y-6">
            
            {isLoading && (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 flex flex-col items-center justify-center space-y-4 text-center min-h-[400px]">
                <div className="relative w-16 h-16 flex items-center justify-center mb-3">
                  <div className="absolute w-12 h-12 rounded-full border border-secondary/20 animate-ping" />
                  <RotateCw size={24} className="text-primary animate-spin" style={{ animationDuration: '2.5s' }} />
                </div>
                <h3 className="font-serif text-lg text-primary font-normal">Analyzing your writing</h3>
                <p className="text-xs text-mid max-w-xs leading-relaxed">
                  Executing scoring rubrics and scanning crisis safety layers...
                </p>
              </div>
            )}

            {!results && !isLoading && (
              <div className="bg-white rounded-premium border border-primary/5 border-dashed shadow-sm p-12 flex flex-col items-center justify-center space-y-3 text-center text-mid min-h-[400px]">
                <div className="w-10 h-10 rounded-full bg-[#F4F6F5] flex items-center justify-center text-mid/60 mb-2">
                  <Sparkle size={18} />
                </div>
                <h3 className="font-serif text-sm font-semibold text-primary/70">Awaiting Journal Entry</h3>
                <p className="text-[11px] max-w-xs leading-relaxed">
                  Fill in the input blocks, then click Run Analysis to review the real-time AI results.
                </p>
              </div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                
                {/* 1. Failed Pipeline */}
                {results.success === false && (
                  <div className="bg-white rounded-premium border border-accent/15 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-primary/5 pb-3 text-[#8a3020]">
                      <AlertTriangle size={18} />
                      <h2 className="font-serif text-lg font-normal">Pipeline Check Failed</h2>
                    </div>
                    <p className="text-xs text-mid leading-relaxed">
                      The AI provider was unable to generate compliant scores.
                    </p>
                    <div className="bg-accent/5 border border-accent/15 p-4 rounded-xl">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-[#8a3020] mb-1">Reason</div>
                      <p className="font-serif italic text-xs text-[#8a3020]">{results.errorReason || 'Response structure error'}</p>
                    </div>
                  </div>
                )}

                {/* 2. Success Output */}
                {results.success !== false && (
                  <>
                    {/* Scores Card */}
                    <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-6">
                      <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                        <h2 className="font-serif text-lg font-normal text-primary">Psychometric Scores</h2>
                        <span className="px-2.5 py-0.5 bg-[#F4F6F5] border border-primary/5 rounded-md text-[9px] font-bold uppercase tracking-wider text-mid">
                          Scale 1.0 - 10.0
                        </span>
                      </div>

                      <div className="space-y-5">
                        {/* EI bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-primary">Emotional Intensity (EI)</span>
                            <span className="text-secondary font-mono">{results.scores.day_ei || 'N/A'}</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#F4F6F5] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#8DBFB4]/50 to-[#8DBFB4]" 
                              style={{ width: `${(results.scores.day_ei || 1) * 10}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-mid/70 block">
                            Measures the magnitude of emotions present (independent of positive/negative valence).
                          </span>
                        </div>

                        {/* PR bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-primary">Cognitive Rigidity (PR)</span>
                            <span className="text-secondary font-mono">{results.scores.day_pr || 'N/A'}</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#F4F6F5] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#E0A898]/50 to-[#E0A898]" 
                              style={{ width: `${(results.scores.day_pr || 1) * 10}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-mid/70 block">
                            Indicates cognitive flexibility. High scores denote black-and-white, always/never patterns.
                          </span>
                        </div>

                        {/* SA bar */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-primary">Self-Agency (SA)</span>
                            <span className="text-secondary font-mono">{results.scores.day_sa || 'N/A'}</span>
                          </div>
                          <div className="h-2.5 w-full bg-[#F4F6F5] rounded-full overflow-hidden">
                            <div 
                              className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r from-[#B8A8D4]/50 to-[#B8A8D4]" 
                              style={{ width: `${(results.scores.day_sa || 1) * 10}%` }}
                            />
                          </div>
                          <span className="text-[9px] text-mid/70 block">
                            Measures self-authorship. High scores mean taking active choices and self-ownership.
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Crisis Protocol Card */}
                    <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                        <h2 className="font-serif text-lg font-normal text-primary">Crisis Assessment</h2>
                        {results.crisis.crisisFlag ? (
                          <span className="px-2.5 py-0.5 bg-accent/15 text-[#8a3020] rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-accent/10">
                            <ShieldAlert size={11} />
                            <span>CRISIS ACTIVE</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 bg-secondary/10 text-[#1A5040] rounded-full text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-secondary/10">
                            <CheckCircle2 size={11} />
                            <span>CLEARED</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-primary leading-relaxed bg-[#F4F6F5]/60 p-3.5 rounded-xl border border-primary/5 font-serif italic">
                        {results.crisis.explanation}
                      </p>
                      {results.crisis.crisisFlag && (
                        <div className="p-3 bg-accent/5 rounded-xl text-[10px] text-[#8a3020] border border-accent/10">
                          <strong>Crisis suppression:</strong> Introspective questions have been suppressed. The user is redirected to helpline resources.
                        </div>
                      )}
                    </div>

                    {/* Reflection Card (if not suppressed) */}
                    {!results.crisis.crisisFlag && results.reflection && results.reflection.reflection_text && (
                      <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                        <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                          <div className="flex items-center gap-2">
                            <MessageSquare size={16} className="text-secondary" />
                            <h2 className="font-serif text-lg font-normal text-primary">AI Reflection Output</h2>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 bg-[#F4F6F5] border border-primary/5 rounded-md text-[9px] font-bold uppercase tracking-wider text-mid">
                              Confidence: {results.reflection.confidence || 'N/A'}
                            </span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {(() => {
                            const paragraphs = (results.reflection.reflection_text || '').split('\n\n').filter(Boolean);
                            const bodyParagraphs = paragraphs.length > 1 ? paragraphs.slice(0, -1) : paragraphs;
                            const footerParagraph = paragraphs.length > 1 ? paragraphs[paragraphs.length - 1] : null;

                            return (
                              <div className="space-y-3">
                                {bodyParagraphs.map((para, idx) => (
                                  <p key={idx} className="text-xs text-primary leading-relaxed font-sans">
                                    {para}
                                  </p>
                                ))}
                                {footerParagraph && (
                                  <p className="text-xs text-primary/70 font-semibold leading-relaxed font-sans border-t border-primary/5 pt-2.5">
                                    {footerParagraph}
                                  </p>
                                )}
                              </div>
                            );
                          })()}

                          {/* Classification & Closing Question */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F4F6F5] p-3.5 rounded-xl border border-primary/5">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Classification</span>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                results.reflection.classification === 'Flat' 
                                  ? 'bg-[#E5F2F0] text-[#2D5A53]' 
                                  : results.reflection.classification === 'Open'
                                    ? 'bg-[#E7ECFC] text-[#2F4BB7]'
                                    : 'bg-[#FCEDEA] text-[#B73E2F]'
                              }`}>
                                {results.reflection.classification || 'N/A'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Closing Question</span>
                              <span className="text-xs italic font-serif text-primary block">
                                {results.reflection.closing_question ? `"${results.reflection.closing_question}"` : 'N/A'}
                              </span>
                            </div>
                          </div>

                          {results.reflection.themes && results.reflection.themes.length > 0 && (
                            <div className="pt-2 flex flex-wrap gap-1.5">
                              {results.reflection.themes.map((theme, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] uppercase font-bold tracking-wider rounded-md">
                                  {theme}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Detected Vocabulary Card */}
                    {!results.crisis.crisisFlag && results.reflection && (results.vocabState || (results.reflection.vocabulary && results.reflection.vocabulary.length > 0)) && (
                      <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-5">
                        <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                          <div className="flex items-center gap-2">
                            <BookOpen size={16} className="text-secondary" />
                            <h2 className="font-serif text-lg font-normal text-primary">Detected Vocabulary</h2>
                          </div>
                        </div>

                        {/* Words and Frequencies */}
                        <div className="space-y-2.5">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Extracted Vocabulary & Frequencies</span>
                          {results.vocabState && results.vocabState.words && results.vocabState.words.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {results.vocabState.words.map((v, idx) => (
                                <span 
                                  key={idx} 
                                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#B8A8D4]/10 text-[#5A4A8A] border border-[#B8A8D4]/20 text-[10px] uppercase font-bold tracking-wider rounded-full hover:bg-[#B8A8D4]/15 transition-all"
                                >
                                  <span>{v.word}</span>
                                  <span className="h-4 w-4 inline-flex items-center justify-center rounded-full bg-[#5A4A8A]/10 text-[#5A4A8A] text-[8px] font-mono">
                                    {v.frequency}
                                  </span>
                                </span>
                              ))}
                            </div>
                          ) : results.reflection.vocabulary && results.reflection.vocabulary.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {results.reflection.vocabulary.map((vocab, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-[#B8A8D4]/20 text-[#5A4A8A] text-[9px] uppercase font-bold tracking-wider rounded-md">
                                  {vocab}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[11px] text-mid italic">No vocabulary words identified in this entry.</p>
                          )}
                        </div>

                        {/* Clusters */}
                        {results.vocabState && results.vocabState.clusters && results.vocabState.clusters.length > 0 && (
                          <div className="space-y-3 pt-2.5 border-t border-primary/5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Thematic Vocabulary Clusters</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {results.vocabState.clusters.map((c, idx) => (
                                <div 
                                  key={idx} 
                                  className="p-3 bg-[#F4F6F5]/50 border border-primary/5 rounded-xl flex items-center justify-between hover:bg-[#F4F6F5] transition-all"
                                >
                                  <div className="space-y-0.5">
                                    <span className="text-xs font-semibold text-primary capitalize">{c.cluster_name}</span>
                                    <span className="text-[8px] text-mid uppercase tracking-wide block">{c.cluster_type} cluster</span>
                                  </div>
                                  <span className="px-2 py-0.5 bg-[#8DBFB4]/12 text-[#1A5040] border border-[#8DBFB4]/10 text-[9px] font-bold tracking-wide rounded-md">
                                    {c.word_count} {c.word_count === 1 ? 'word' : 'words'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Latency footer card */}
                    <div className="bg-white rounded-premium border border-primary/5 shadow-sm px-6 py-4 flex justify-between items-center text-[10px] text-mid font-mono">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-secondary" />
                        <span>Latency: {results.latency}ms</span>
                      </div>
                      <div className="uppercase">Provider: {provider}</div>
                    </div>
                  </>
                )}

              </motion.div>
            )}

          </div>

        </div>
        )}

        {activeTab === 'history' && (
          /* Historical Review Tab - Product Oriented ONLY */
          <motion.div
            key="founder-history-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-left"
          >
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-normal text-primary">Historical Entries Review</h2>
                <p className="text-xs text-mid text-left">Browse journal entries, psychometric progress, crisis checks, and AI reframing output.</p>
              </div>
              <button
                onClick={fetchHistoryEntries}
                disabled={isHistoryLoading}
                className="flex items-center gap-1.5 px-4 py-2.5 border border-primary/10 hover:border-primary/20 bg-white text-primary rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw size={13} className={isHistoryLoading ? 'animate-spin' : ''} />
                <span>Refresh List</span>
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 flex flex-col items-center justify-center space-y-4 text-center">
                <RotateCw size={24} className="text-primary animate-spin" style={{ animationDuration: '2.5s' }} />
                <h3 className="font-serif text-lg text-primary font-normal">Loading entries...</h3>
              </div>
            ) : historyError ? (
              <div className="p-4 bg-accent/8 border border-accent/20 rounded-xl text-[#8a3020] text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Error loading history:</span> {historyError}
                </div>
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 text-center text-xs text-mid italic">
                No entries available.
              </div>
            ) : (
              <div className="space-y-6">
                {(() => {
                  const grouped = {};
                  historyEntries.forEach(entry => {
                    const cycleNum = entry.cycle_number || 1;
                    if (!grouped[cycleNum]) {
                      grouped[cycleNum] = [];
                    }
                    grouped[cycleNum].push(entry);
                  });

                  // Sort cycles descending
                  const cycleNums = Object.keys(grouped).map(Number).sort((a, b) => b - a);

                  return cycleNums.map((cycleNum) => {
                    const cycleEntries = grouped[cycleNum];
                    const isCycleExpanded = expandedCycles[cycleNum] !== false; // Default expanded

                    return (
                      <div key={cycleNum} className="space-y-3">
                        {/* Cycle Accordion Header */}
                        <div 
                          onClick={() => toggleCycleExpand(cycleNum)}
                          className="bg-white border border-primary/5 rounded-xl p-4 flex items-center justify-between cursor-pointer hover:bg-mint-grey/25 transition-colors select-none shadow-sm"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#8DBFB4]" />
                            <h3 className="font-serif text-base font-semibold text-primary mb-0">Cycle {cycleNum}</h3>
                            <span className="text-[10px] text-mid font-mono bg-primary/5 px-2 py-0.5 rounded-full ml-2">
                              {cycleEntries.length} {cycleEntries.length === 1 ? 'entry' : 'entries'}
                            </span>
                          </div>
                          <div className="text-mid/60 hover:text-primary transition-colors flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider">
                            <span>{isCycleExpanded ? 'Collapse' : 'Expand'}</span>
                            {isCycleExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </div>
                        </div>

                        {/* Cycle Entries List */}
                        {isCycleExpanded && (
                          <div className="space-y-4 pl-4 border-l border-primary/10">
                            {cycleEntries.map((entry) => {
                              const isExpanded = !!expandedEntries[entry.id];
                              const hasReflection = entry.reflection !== null && entry.reflection !== undefined;

                              return (
                                <div 
                                  key={entry.id}
                                  className="bg-white rounded-premium border border-primary/5 shadow-sm overflow-hidden transition-all text-left"
                                >
                                  {/* Accordion Header */}
                                  <div 
                                    onClick={() => toggleEntryExpand(entry.id)}
                                    className="p-4 flex items-center justify-between cursor-pointer hover:bg-mint-grey/25 transition-colors select-none"
                                  >
                                    <div className="flex flex-wrap items-center gap-3 text-xs">
                                      <span className="text-primary font-semibold">
                                        {new Date(entry.created_at).toLocaleDateString('en-GB', { 
                                          day: 'numeric', 
                                          month: 'long', 
                                          year: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                        })}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                        entry.entry_type === 'guided' || entry.session_id
                                          ? 'bg-[#8DBFB4]/12 text-[#1A5040]' 
                                          : 'bg-primary/5 text-primary'
                                      }`}>
                                        {entry.entry_type === 'guided' || entry.session_id ? 'Guided Session' : 'Free Write'}
                                      </span>
                                      {entry.cycle_day && (
                                        <span className="text-[10px] text-secondary font-bold uppercase">
                                          Day {entry.cycle_day}
                                        </span>
                                      )}
                                      {entry.crisis_flag && (
                                        <span className="px-2 py-0.5 bg-accent/15 text-accent text-[9px] font-bold uppercase rounded-full">
                                          Crisis Suppressed
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-mid/60 hover:text-primary transition-colors">
                                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </div>
                                  </div>

                                  {/* Accordion Content */}
                                  {isExpanded && (
                                    <div className="border-t border-primary/5 p-6 bg-[#F4F6F5]/45 space-y-6">
                                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                                        
                                        {/* Left Side: Journal Entry Content */}
                                        <div className="lg:col-span-6 space-y-4">
                                          <div className="space-y-1.5">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Original Journal Entry</span>
                                            <div className="p-4.5 bg-white border border-primary/5 rounded-xl font-serif italic text-sm text-primary pr-3 leading-relaxed select-text">
                                              "{entry.content}"
                                            </div>
                                          </div>
                                        </div>

                                        {/* Right Side: Product Metadata */}
                                        <div className="lg:col-span-6 space-y-5">
                                          
                                          {/* Psychometrics */}
                                          <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-3.5 shadow-xs">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block border-b border-primary/5 pb-1">
                                              Psychometric Scores
                                            </span>
                                            
                                            {entry.day_ei !== null && entry.day_pr !== null && entry.day_sa !== null ? (
                                              <div className="space-y-3 text-xs">
                                                <div className="space-y-1">
                                                  <div className="flex justify-between font-semibold">
                                                    <span>Emotional Intensity (EI)</span>
                                                    <span className="text-secondary font-mono">{entry.day_ei}</span>
                                                  </div>
                                                  <div className="h-2 w-full bg-[#F4F6F5] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#8DBFB4] rounded-full" style={{ width: `${entry.day_ei * 10}%` }} />
                                                  </div>
                                                </div>
                                                <div className="space-y-1">
                                                  <div className="flex justify-between font-semibold">
                                                    <span>Cognitive Rigidity (PR)</span>
                                                    <span className="text-secondary font-mono">{entry.day_pr}</span>
                                                  </div>
                                                  <div className="h-2 w-full bg-[#F4F6F5] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#E0A898] rounded-full" style={{ width: `${entry.day_pr * 10}%` }} />
                                                  </div>
                                                </div>
                                                <div className="space-y-1">
                                                  <div className="flex justify-between font-semibold">
                                                    <span>Self-Agency (SA)</span>
                                                    <span className="text-secondary font-mono">{entry.day_sa}</span>
                                                  </div>
                                                  <div className="h-2 w-full bg-[#F4F6F5] rounded-full overflow-hidden">
                                                    <div className="h-full bg-[#B8A8D4] rounded-full" style={{ width: `${entry.day_sa * 10}%` }} />
                                                  </div>
                                                </div>
                                              </div>
                                            ) : (
                                              <div className="text-xs italic text-mid">No scores generated for this entry.</div>
                                            )}
                                          </div>

                                          {/* Crisis Protocol Evaluation */}
                                          <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-2.5 shadow-xs">
                                            <div className="flex justify-between items-center border-b border-primary/5 pb-1.5">
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Crisis Assessment</span>
                                              <span className={`font-semibold px-2 py-0.5 rounded text-[9px] ${
                                                entry.crisis_flag 
                                                  ? 'bg-accent/15 text-accent font-bold' 
                                                  : 'bg-secondary/10 text-[#1A5040] font-bold'
                                              }`}>
                                                {entry.crisis_flag ? 'FLAGGED' : 'CLEARED'}
                                              </span>
                                            </div>
                                            <p className="text-xs text-primary/80 font-serif leading-relaxed italic">
                                              {entry.crisis_flag 
                                                ? `Distressed safety quote triggered: "${entry.risk_language_quote || 'distress patterns identified'}"`
                                                : 'Evaluated safe. No crisis safety patterns identified.'}
                                            </p>
                                          </div>

                                          {/* Reflection Output */}
                                          <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-3.5 shadow-xs">
                                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block border-b border-primary/5 pb-1">
                                              AI Reflection & closing question
                                            </span>
                                            {hasReflection ? (
                                              <div className="space-y-3 text-xs">
                                                {entry.reflection.status === 'failed' || entry.crisis_flag ? (
                                                  <div className="p-3 bg-accent/5 rounded-lg border border-accent/10 text-[11px] text-accent font-medium">
                                                    Introspective question suppressed due to crisis protocol safety parameters.
                                                  </div>
                                                ) : (
                                                  <>
                                                    <p className="font-sans leading-relaxed text-primary/90">{entry.reflection.reflection_text}</p>
                                                    {entry.reflection.closing_question && (
                                                      <div className="p-3.5 bg-secondary/5 border border-secondary/10 rounded-xl space-y-1">
                                                        <span className="text-[8px] font-bold uppercase text-secondary tracking-widest block">Closing Contemplation</span>
                                                        <p className="font-serif italic text-primary/95 text-xs pr-1">"{entry.reflection.closing_question}"</p>
                                                      </div>
                                                    )}
                                                  </>
                                                )}
                                              </div>
                                            ) : (
                                              <div className="text-xs italic text-mid">Reflection pending compilation.</div>
                                            )}
                                          </div>

                                          {/* Vocabulary */}
                                          {hasReflection && entry.reflection.vocabulary && entry.reflection.vocabulary.length > 0 && (
                                            <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-2.5 shadow-xs">
                                              <span className="text-[9px] font-bold uppercase tracking-wider text-mid block border-b border-primary/5 pb-1">
                                                Emotional Vocabulary
                                              </span>
                                              <div className="flex gap-1.5 flex-wrap">
                                                {entry.reflection.vocabulary.map((w, idx) => (
                                                  <span key={idx} className="bg-mint-grey/70 text-primary px-2.5 py-1 rounded text-[10px] uppercase font-bold tracking-wider">
                                                    {w}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                          )}

                                        </div>

                                      </div>

                                      {/* Chronological reflection timeline */}
                                      <div className="border-t border-primary/5 pt-6 space-y-3.5">
                                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Evaluation Timeline</span>
                                        <div className="bg-white border border-primary/5 rounded-xl p-5 space-y-4 shadow-xs relative overflow-hidden">
                                          <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-secondary" />
                                          
                                          <div className="flex flex-col md:flex-row items-stretch gap-4 text-xs font-sans">
                                            
                                            {/* 1. Journal Entry */}
                                            <div className="flex-1 bg-mint-grey/25 rounded-lg p-3.5 space-y-1 border border-primary/5 relative">
                                              <div className="text-[9px] uppercase font-bold text-secondary">1. Journal Entry</div>
                                              <p className="font-serif italic text-primary/90 leading-relaxed text-[12.5px]">
                                                "{entry.content.length > 200 ? entry.content.substring(0, 200) + '...' : entry.content}"
                                              </p>
                                              <div className="text-[9.5px] text-mid/60 mt-1">Word count: {entry.word_count}</div>
                                            </div>
                                            
                                            {/* Connection Arrow */}
                                            <div className="flex items-center justify-center text-secondary/40 shrink-0">
                                              <svg className="w-5 h-5 rotate-90 md:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                              </svg>
                                            </div>

                                            {/* 2. Reflection Question */}
                                            <div className="flex-1 bg-mint-grey/25 rounded-lg p-3.5 space-y-1 border border-primary/5 relative">
                                              <div className="text-[9px] uppercase font-bold text-secondary">2. Reflection Question</div>
                                              {hasReflection && entry.reflection.closing_question ? (
                                                <>
                                                  <p className="font-serif italic text-[#5A4A8A] leading-relaxed text-[12.5px]">
                                                    "{entry.reflection.closing_question}"
                                                  </p>
                                                  {entry.reflection.classification && (
                                                    <span className="inline-block bg-[#5A4A8A]/10 text-[#5A4A8A] font-bold text-[8px] px-1.5 py-0.5 rounded mt-1 uppercase">
                                                      {entry.reflection.classification}
                                                    </span>
                                                  )}
                                                </>
                                              ) : (
                                                <p className="italic text-mid/60">No reflection question generated.</p>
                                              )}
                                            </div>

                                            {/* Connection Arrow */}
                                            <div className="flex items-center justify-center text-secondary/40 shrink-0">
                                              <svg className="w-5 h-5 rotate-90 md:rotate-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                              </svg>
                                            </div>

                                            {/* 3. User Reflection Answer */}
                                            <div className="flex-1 bg-mint-grey/25 rounded-lg p-3.5 space-y-1 border border-primary/5 relative">
                                              <div className="text-[9px] uppercase font-bold text-secondary">3. User Reflection Answer</div>
                                              {hasReflection && entry.reflection.reflection_answer ? (
                                                <>
                                                  <p className="font-serif italic text-[#8a3020] leading-relaxed text-[12.5px]">
                                                    "{entry.reflection.reflection_answer}"
                                                  </p>
                                                  {entry.reflection.answered_at && (
                                                    <div className="text-[9.5px] text-mid/60 mt-1 font-mono">
                                                      Answered: {new Date(entry.reflection.answered_at).toLocaleString()}
                                                    </div>
                                                  )}
                                                </>
                                              ) : (
                                                <div className="space-y-1">
                                                  <p className="italic text-mid/60">Unanswered</p>
                                                  <span className="inline-block bg-accent/10 text-accent font-bold text-[8px] px-1.5 py-0.5 rounded uppercase">
                                                    Pending Response
                                                  </span>
                                                </div>
                                              )}
                                            </div>

                                          </div>
                                        </div>
                                      </div>

                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'threads' && (
          <motion.div
            key="founder-threads-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 text-left"
          >
            <div className="border-b border-primary/5 pb-3">
              <h2 className="font-serif text-xl font-normal text-primary">Reflection Threads</h2>
              <p className="text-xs text-mid text-left">Chronological history of self-reflection questions, user answers, and scoring eligibility status.</p>
            </div>

            {isThreadsLoading ? (
              <div className="flex justify-center items-center py-12 gap-2 text-mid">
                <Loader className="w-5 h-5 animate-spin text-secondary" />
                <span className="text-xs font-serif italic">Loading threads...</span>
              </div>
            ) : threadsError ? (
              <div className="bg-accent/10 border border-accent/20 text-[#8a3020] p-4 rounded-xl text-xs">
                {threadsError}
              </div>
            ) : testThreads.length === 0 ? (
              <div className="bg-white rounded-premium border border-primary/5 p-8 text-center text-xs text-mid italic">
                No reflection threads recorded. Write a journal entry to start.
              </div>
            ) : (
              <div className="space-y-8 max-w-[640px] mx-auto pt-4">
                {testThreads.map(t => {
                  const resps = testThreadResponses[t.id] || [];

                  return (
                    <div key={t.id} className="relative bg-white rounded-premium border border-primary/5 p-6 shadow-xs space-y-5">
                      {/* Reflection */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid/60 font-sans">Reflection Observation</span>
                        <div className="text-xs font-serif leading-relaxed text-primary italic bg-mint-grey/25 p-3 rounded-lg border border-primary/5">
                          "{t.reflection_text || 'Self-reflection observation context.'}"
                        </div>
                      </div>

                      <div className="flex justify-center select-none text-mid/20">
                        <ArrowDown size={14} />
                      </div>

                      {/* Question */}
                      <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid/60 font-sans">Closing Question</span>
                        <h3 className="font-serif text-sm font-semibold text-primary pl-1">
                          {t.closing_question}
                        </h3>
                      </div>

                      <div className="flex justify-center select-none text-mid/20">
                        <ArrowDown size={14} />
                      </div>

                      {/* Thread Response */}
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid/60 font-sans">User Responses</span>
                        {resps.length === 0 ? (
                          <div className="text-xs font-serif italic text-mid/50 pl-1">Unanswered</div>
                        ) : (
                          <div className="space-y-3 pl-3 border-l border-primary/10">
                            {resps.map((resp) => (
                              <div key={resp.id} className="space-y-1">
                                <div className="text-[9px] text-mid/50 font-semibold font-sans">
                                  Logged {new Date(resp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} at {new Date(resp.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                <p className="text-xs font-serif italic text-primary font-semibold">
                                  "{resp.response_text}"
                                </p>
                                
                                {/* Used In Today's Scoring */}
                                <div className="pt-1 select-none">
                                  {resp.used_for_scoring ? (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-secondary bg-[#8DBFB4]/12 px-2 py-0.5 rounded font-sans">
                                      <CheckCircle2 size={9} /> Used In Today's Scoring
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[8px] font-bold uppercase tracking-wider text-mid/40 bg-primary/5 px-2 py-0.5 rounded font-sans">
                                      Historical Response
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-center select-none text-mid/20">
                        <ArrowDown size={14} />
                      </div>

                      {/* Thread Status */}
                      <div className="flex justify-between items-center pt-2 border-t border-primary/5 text-xs select-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid/60 font-sans">Thread Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider font-sans ${
                            t.status === 'Open'
                              ? 'bg-[#e0a898]/12 text-[#8a3020]'
                              : 'bg-[#8DBFB4]/12 text-secondary-dark'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                        <span className="text-[9px] text-mid/50 font-sans font-semibold">
                          Cycle {t.cycle_number}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

      </main>
    </div>
  );
}
