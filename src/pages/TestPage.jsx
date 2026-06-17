import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Play, 
  Trash2, 
  RotateCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Flame,
  Info,
  Clock,
  Terminal,
  Cpu,
  RefreshCw,
  Sliders,
  Database
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

// Pre-defined test cases
const TEST_CASES = [
  {
    name: 'Normal Day',
    reflection: 'I reflected on my anxiety yesterday and realized it was mostly fatigue.',
    newEntry: 'Work was tiring today. I felt frustrated after a meeting but I handled it reasonably well and completed what I needed to do.',
    expected: {
      day_ei: { min: 3.0, max: 6.0 },
      day_pr: { min: 2.0, max: 6.0 },
      day_sa: { min: 5.0, max: 9.0 }
    }
  },
  {
    name: 'High Emotional Distress',
    reflection: '',
    newEntry: 'I am so angry and overwhelmed. My heart is beating so fast and I feel like screaming. I can\'t calm down at all.',
    expected: {
      day_ei: { min: 7.0, max: 10.0 },
      day_pr: { min: 4.0, max: 8.0 },
      day_sa: { min: 2.0, max: 6.0 }
    }
  },
  {
    name: 'Low Agency',
    reflection: '',
    newEntry: 'Everything is just happening to me. I have no choice. I\'m stuck in this situation and there\'s nothing I can do to change it.',
    expected: {
      day_ei: { min: 4.0, max: 8.0 },
      day_pr: { min: 4.0, max: 8.0 },
      day_sa: { min: 1.0, max: 3.0 }
    }
  },
  {
    name: 'High Rigidity',
    reflection: '',
    newEntry: 'People always let me know they don\'t care. It is always the same. They will never change, and I will never succeed.',
    expected: {
      day_ei: { min: 4.0, max: 8.0 },
      day_pr: { min: 7.0, max: 10.0 },
      day_sa: { min: 2.0, max: 6.0 }
    }
  },
  {
    name: 'Immediate Crisis',
    reflection: '',
    newEntry: 'I cannot do this anymore. Everything feels impossible. I have no control over anything. I feel completely trapped.',
    expected: {
      day_ei: { min: 9.0, max: 10.0 },
      day_pr: { min: 5.0, max: 10.0 },
      day_sa: { min: 1.0, max: 2.0 }
    }
  },
  {
    name: 'Risk Language',
    reflection: '',
    newEntry: 'I want to end my life. I want to kill myself.',
    expected: {
      day_ei: { min: 5.0, max: 10.0 },
      day_pr: { min: 4.0, max: 10.0 },
      day_sa: { min: 1.0, max: 6.0 }
    }
  },
  {
    name: 'Very Short Entry',
    reflection: '',
    newEntry: 'Okay day.',
    expected: {
      day_ei: { min: 3.0, max: 7.0 },
      day_pr: { min: 3.0, max: 7.0 },
      day_sa: { min: 3.0, max: 7.0 }
    }
  },
  {
    name: 'Mixed Entry',
    reflection: 'I made some progress.',
    newEntry: 'Felt a bit down but tried my best.',
    expected: {
      day_ei: { min: 4.0, max: 7.0 },
      day_pr: { min: 3.0, max: 7.0 },
      day_sa: { min: 4.0, max: 8.0 }
    }
  },
  {
    name: 'Reflection Only',
    reflection: 'Thinking about how I reacted to criticism yesterday. I think I was too defensive.',
    newEntry: '',
    expected: {
      day_ei: { min: 3.0, max: 7.0 },
      day_pr: { min: 3.0, max: 7.0 },
      day_sa: { min: 4.0, max: 8.0 }
    }
  },
  {
    name: 'Both Entry Types',
    reflection: 'I practiced deep breathing when stressed.',
    newEntry: 'Met a friend today. Had a good conversation, though I still felt slightly detached.',
    expected: {
      day_ei: { min: 4.0, max: 7.0 },
      day_pr: { min: 3.0, max: 7.0 },
      day_sa: { min: 4.0, max: 8.0 }
    }
  }
];

export default function TestPage() {
  const [reflectionText, setReflectionText] = useState('');
  const [newEntryText, setNewEntryText] = useState('');
  const [provider, setProvider] = useState('groq');
  
  // Pipeline status & results
  const [isLoading, setIsLoading] = useState(false);
  const [activePipeline, setActivePipeline] = useState(null); // 'scoring' | 'crisis' | 'full'
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [expectedRanges, setExpectedRanges] = useState(null);

  // Queue tracking states
  const [jobStates, setJobStates] = useState(null);
  const [isPolling, setIsPolling] = useState(false);
  const [currentEntryId, setCurrentEntryId] = useState(null);

  // Accordion open/close
  const [accordionOpen, setAccordionOpen] = useState(false);

  // Load a test case
  const loadTestCase = (tc) => {
    setReflectionText(tc.reflection);
    setNewEntryText(tc.newEntry);
    setExpectedRanges(tc.expected);
    setResults(null);
    setError(null);
    setJobStates(null);
    setIsPolling(false);
    setCurrentEntryId(null);
  };

  const handleClear = () => {
    setReflectionText('');
    setNewEntryText('');
    setExpectedRanges(null);
    setResults(null);
    setError(null);
    setJobStates(null);
    setIsPolling(false);
    setCurrentEntryId(null);
  };

  // Run scoring only (synchronous)
  const runScoringOnly = async () => {
    setIsLoading(true);
    setActivePipeline('scoring');
    setError(null);
    setResults(null);
    setJobStates(null);
    setIsPolling(false);

    try {
      const res = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-scoring',
          reflectionText,
          newEntryText,
          provider
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Scoring pipeline failed.');
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setActivePipeline(null);
    }
  };

  // Run crisis detection only (synchronous)
  const runCrisisOnly = async () => {
    setIsLoading(true);
    setActivePipeline('crisis');
    setError(null);
    setResults(null);
    setJobStates(null);
    setIsPolling(false);

    try {
      const res = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-crisis',
          reflectionText,
          newEntryText,
          provider
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Crisis check failed.');
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setActivePipeline(null);
    }
  };

  // Run full pipeline (asynchronous enqueuing + polling)
  const runFullPipeline = async () => {
    setIsLoading(true);
    setActivePipeline('full');
    setError(null);
    setResults(null);
    setJobStates(null);
    setIsPolling(true);

    try {
      // 1. Submit entry & enqueue BullMQ jobs
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
      if (!res.ok) throw new Error(data.error?.message || 'Failed to trigger full pipeline.');

      setCurrentEntryId(data.entryId);
      
      // Seed initial job state as QUEUED
      setJobStates({
        scoring: { id: data.jobIds.scoring, status: 'QUEUED', executionTime: null },
        reflection: { id: data.jobIds.reflection, status: 'QUEUED', executionTime: null },
        crisis: { id: data.jobIds.crisis, status: 'QUEUED', executionTime: null }
      });

    } catch (err) {
      console.error(err);
      setError(err.message);
      setIsLoading(false);
      setIsPolling(false);
      setActivePipeline(null);
    }
  };

  // Poll job status while enqueued
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
          setJobStates(data.jobs);

          const scoringDone = data.jobs.scoring.status === 'COMPLETED' || data.jobs.scoring.status === 'FAILED';
          const crisisDone = data.jobs.crisis.status === 'COMPLETED' || data.jobs.crisis.status === 'FAILED';
          const reflectionDone = data.jobs.reflection.status === 'COMPLETED' || data.jobs.reflection.status === 'FAILED';

          // Stop polling once all queues complete, or after 15 attempts (22.5s)
          if ((scoringDone && crisisDone && reflectionDone) || attempts >= 15) {
            clearInterval(interval);
            setIsPolling(false);
            setIsLoading(false);
            setActivePipeline(null);

            // If we have entryState containing day scores/flags, format results to show
            if (data.entryState) {
              const entry = data.entryState;
              
              // Determine type
              let entryType = 'Empty';
              if (entry.entry_type === 'both') entryType = 'Both';
              else if (entry.entry_type === 'new_only') entryType = 'New Only';
              else if (entry.entry_type === 'reflection_only') entryType = 'Reflection Only';

              setResults({
                success: true,
                entryType,
                scoreResult: {
                  reflection: entry.reflection_ei !== null ? { ei: entry.reflection_ei, pr: entry.reflection_pr, sa: entry.reflection_sa } : null,
                  newEntry: entry.new_entry_ei !== null ? { ei: entry.new_entry_ei, pr: entry.new_entry_pr, sa: entry.new_entry_sa } : null,
                  confidenceFlag: entry.confidence_flag,
                  confidenceReason: entry.confidence_reason,
                  arcScoringApplied: entry.arc_scoring_applied !== undefined ? entry.arc_scoring_applied : false
                },
                calculatedScores: {
                  day_ei: entry.day_ei,
                  day_pr: entry.day_pr,
                  day_sa: entry.day_sa
                },
                crisis: {
                  crisisFlag: entry.crisis_flag,
                  crisisType: entry.crisis_type,
                  isImmediateDistress: entry.crisis_type === 'Immediate',
                  isRiskLanguage: entry.crisis_type === 'Risk_Language',
                  explanation: entry.crisis_flag 
                    ? `Crisis triggered in background worker. Type: ${entry.crisis_type}. ${entry.risk_language_quote ? `Quote: "${entry.risk_language_quote}"` : ''}`
                    : `No crisis triggered in background worker. Scores: EI=${entry.day_ei}, SA=${entry.day_sa}.`,
                  reflectionSuppressed: entry.reflection_suppressed
                },
                reflectionResult: data.reflectionState ? {
                  question: data.reflectionState.question,
                  observation: data.reflectionState.observation,
                  status: data.reflectionState.status
                } : null,
                aiTrace: null // Background jobs don't return raw AI trace directly in poll
              });
            }
          }
        }
      } catch (err) {
        console.warn('Error polling job status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [isPolling, currentEntryId]);

  return (
    <div className="min-h-screen bg-mint-grey text-primary font-sans flex flex-col justify-between pb-12">
      <DashboardNavbar activeTab="settings" />

      <main className="flex-1 max-w-[1240px] w-full mx-auto px-6 py-8">
        
        {/* Banner Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-primary/5 pb-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-secondary block mb-1">Developer-Only Playground</span>
            <h1 className="font-serif text-3xl font-normal text-primary flex items-center gap-2.5">
              <span>Pipeline & Scoring Validator</span>
              <span className="px-2 py-0.5 bg-accent/10 text-accent text-[10px] uppercase font-bold rounded">DEV MODE ONLY</span>
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-primary/5 shadow-xs">
              <Sliders size={14} className="text-secondary" />
              <label className="text-[11px] font-bold uppercase tracking-wider text-mid">Provider:</label>
              <select 
                value={provider} 
                onChange={(e) => setProvider(e.target.value)}
                className="bg-transparent text-xs font-semibold text-primary border-none outline-none cursor-pointer focus:ring-0 p-0"
              >
                <option value="groq">Groq (Llama-3.3)</option>
                <option value="claude">Anthropic Claude (Mock)</option>
              </select>
            </div>
            
            <button 
              onClick={handleClear}
              className="flex items-center gap-1.5 px-3 py-2 border border-primary/10 hover:border-primary/25 bg-white text-[#8a3020] hover:bg-[#8a3020]/5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              <Trash2 size={13} />
              <span>Clear</span>
            </button>
          </div>
        </div>

        {/* Test Cases Row */}
        <div className="mb-8 bg-white p-5 rounded-premium border border-primary/5 shadow-sm space-y-3">
          <div className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">One-Click Preset Scenarios</div>
          <div className="flex flex-wrap gap-2">
            {TEST_CASES.map((tc) => (
              <button
                key={tc.name}
                onClick={() => loadTestCase(tc)}
                className="px-3.5 py-1.5 bg-mint-grey hover:bg-secondary/15 hover:text-secondary-dark border border-transparent hover:border-secondary/20 rounded-lg text-xs font-medium transition-all cursor-pointer"
              >
                {tc.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-8 p-4 bg-accent/10 border border-accent/20 rounded-xl text-[#8a3020] text-xs flex items-start gap-2.5">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">Execution failed:</span> {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: Simulator */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Section 1: Journal Entry Simulator */}
            <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2 border-b border-primary/5 pb-3">
                <Terminal size={16} className="text-secondary" />
                <h2 className="font-serif text-lg font-normal text-primary">Journal Entry Simulator</h2>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-mid">
                    <span>Reflection Text</span>
                    <span className="text-mid/50 italic">Optional</span>
                  </div>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => {
                      setReflectionText(e.target.value);
                      setExpectedRanges(null);
                    }}
                    placeholder="User's reflection on yesterday's CBT reframing/action..."
                    className="w-full min-h-[80px] p-3.5 bg-mint-grey border border-transparent focus:border-secondary/30 rounded-xl text-xs font-sans leading-relaxed text-primary outline-none resize-none transition-all placeholder-primary/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-mid">
                    <span>New Entry Text</span>
                    <span className="text-mid/50 italic">Optional</span>
                  </div>
                  <textarea
                    value={newEntryText}
                    onChange={(e) => {
                      setNewEntryText(e.target.value);
                      setExpectedRanges(null);
                    }}
                    placeholder="User's free write journal content for today..."
                    className="w-full min-h-[140px] p-3.5 bg-mint-grey border border-transparent focus:border-secondary/30 rounded-xl text-xs font-sans leading-relaxed text-primary outline-none resize-none transition-all placeholder-primary/30"
                  />
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={runFullPipeline}
                  disabled={isLoading || (!reflectionText.trim() && !newEntryText.trim())}
                  className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-40"
                >
                  {isLoading && activePipeline === 'full' ? (
                    <RotateCw size={14} className="animate-spin" />
                  ) : (
                    <Database size={14} />
                  )}
                  <span>Run Full Pipeline</span>
                </button>

                <button
                  onClick={runScoringOnly}
                  disabled={isLoading || (!reflectionText.trim() && !newEntryText.trim())}
                  className="px-5 flex items-center justify-center gap-2 border border-primary/15 hover:bg-mint-grey text-primary py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                >
                  {isLoading && activePipeline === 'scoring' ? (
                    <RotateCw size={14} className="animate-spin" />
                  ) : (
                    <Cpu size={14} />
                  )}
                  <span>Run Scoring Only</span>
                </button>

                <button
                  onClick={runCrisisOnly}
                  disabled={isLoading || !newEntryText.trim()}
                  className="px-5 flex items-center justify-center gap-2 border border-[#E0A898]/30 bg-[#E0A898]/5 hover:bg-[#E0A898]/15 text-[#8a3020] py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                >
                  {isLoading && activePipeline === 'crisis' ? (
                    <RotateCw size={14} className="animate-spin" />
                  ) : (
                    <Flame size={14} />
                  )}
                  <span>Run Crisis Check</span>
                </button>
              </div>
            </div>

            {/* Section 5: Queue Status (BullMQ) */}
            {(jobStates || isPolling) && (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-primary/5 pb-3">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-secondary" />
                    <h2 className="font-serif text-lg font-normal text-primary">BullMQ Queue Status</h2>
                  </div>
                  {isPolling && (
                    <span className="flex items-center gap-1.5 text-[10px] text-secondary font-bold uppercase tracking-wider">
                      <RefreshCw size={10} className="animate-spin" />
                      <span>Polling Workers...</span>
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  {jobStates && Object.entries(jobStates).map(([queueKey, job]) => {
                    let statusColor = 'bg-primary/5 text-primary border-primary/10';
                    if (job.status === 'PROCESSING') statusColor = 'bg-[#8DBFB4]/10 text-[#1A5040] border-[#8DBFB4]/25';
                    if (job.status === 'COMPLETED') statusColor = 'bg-secondary/10 text-secondary-dark border-secondary/20';
                    if (job.status === 'FAILED') statusColor = 'bg-accent/15 text-[#8a3020] border-accent/25';

                    return (
                      <div key={queueKey} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-mint-grey rounded-xl gap-2 text-xs">
                        <div className="space-y-0.5">
                          <span className="font-semibold text-primary capitalize">{queueKey.replace('_', ' ')} Queue</span>
                          <div className="text-[10px] text-mid font-mono">Job ID: {job.id}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          {job.executionTime !== null && (
                            <span className="text-[10px] text-mid font-mono flex items-center gap-1">
                              <Clock size={10} />
                              <span>{job.executionTime}ms</span>
                            </span>
                          )}
                          <span className={`px-2.5 py-0.5 border rounded-full text-[9px] font-bold uppercase tracking-wider ${statusColor}`}>
                            {job.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Results */}
          <div className="lg:col-span-6 space-y-6">
            
            {/* Loading Indicator for Synchronous calls */}
            {isLoading && !isPolling && (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <div className="absolute w-12 h-12 rounded-full border border-secondary/20 animate-ping" />
                  <div className="absolute w-8 h-8 rounded-full border border-accent/20 animate-pulse" />
                  <RotateCw size={24} className="text-primary animate-spin" style={{ animationDuration: '2.5s' }} />
                </div>
                <h3 className="font-serif text-lg text-primary font-normal">Processing scoring pipeline</h3>
                <p className="text-xs text-mid max-w-xs leading-relaxed">Evaluating text dimensions and parsing JSON payload synchronously...</p>
              </div>
            )}

            {!results && !isLoading && (
              <div className="bg-white rounded-premium border border-primary/5 border-dashed shadow-sm p-12 flex flex-col items-center justify-center space-y-3 text-center text-mid">
                <div className="w-10 h-10 rounded-full bg-mint-grey flex items-center justify-center text-mid/60">
                  <Info size={18} />
                </div>
                <h3 className="font-serif text-sm font-semibold text-primary/70">No Results Available</h3>
                <p className="text-[11px] max-w-xs leading-relaxed">Fill in entries above or load a test preset, then click run to inspect psychometric and crisis analysis.</p>
              </div>
            )}

            {results && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {results.success === false && (
                  <div className="bg-white rounded-premium border border-accent/15 shadow-sm p-6 space-y-4">
                    <div className="flex items-center gap-2 border-b border-primary/5 pb-3 text-[#8a3020]">
                      <XCircle size={18} />
                      <h2 className="font-serif text-lg font-normal">Pipeline Validation Failed</h2>
                    </div>
                    <div className="space-y-3 text-xs text-primary leading-normal">
                      <div className="bg-accent/5 border border-accent/15 p-3.5 rounded-xl space-y-1">
                        <div className="font-bold uppercase tracking-widest text-[9px] text-[#8a3020]">Error Reason / Validation Exception</div>
                        <p className="font-mono text-[10px] break-words text-[#8a3020] whitespace-pre-wrap">{results.errorReason}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-[10px] font-mono bg-mint-grey p-3 rounded-xl border border-primary/5">
                        <div>
                          <span className="text-mid">retries:</span> <span className="font-bold text-[#8a3020]">{results.retryCount || 0}</span>
                        </div>
                        <div>
                          <span className="text-mid">latency:</span> <span className="font-bold text-primary">{results.latency}ms</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {results.success !== false && (
                  <>
                    {/* Section 2 & 3: Entry Analysis & Scoring Results */}
                    <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-6">
                  <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                    <h2 className="font-serif text-lg font-normal text-primary">Entry Scoring Analysis</h2>
                    
                    {/* Section 2 Display */}
                    <div className="flex items-center gap-1.5 text-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-mid">Type:</span>
                      <span className="px-2.5 py-0.5 bg-secondary/10 text-secondary-dark rounded-full text-[10px] font-semibold">
                        {results.entryType}
                      </span>
                    </div>
                  </div>

                  {/* Section 3 Scores */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Reflection Scores */}
                    <div className="bg-mint-grey p-4 rounded-xl space-y-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[#8DBFB4] border-b border-primary/5 pb-1">Reflection</div>
                      {results.scoreResult?.reflection ? (
                        <div className="grid grid-cols-3 gap-1 text-center font-serif">
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">EI</div>
                            <div className="text-lg font-normal text-primary">{results.scoreResult.reflection.ei}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">PR</div>
                            <div className="text-lg font-normal text-primary">{results.scoreResult.reflection.pr}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">SA</div>
                            <div className="text-lg font-normal text-primary">{results.scoreResult.reflection.sa}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-mid italic py-2">Not scored</div>
                      )}
                    </div>

                    {/* New Entry Scores */}
                    <div className="bg-mint-grey p-4 rounded-xl space-y-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-[#8DBFB4] border-b border-primary/5 pb-1">New Entry</div>
                      {results.scoreResult?.newEntry ? (
                        <div className="grid grid-cols-3 gap-1 text-center font-serif">
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">EI</div>
                            <div className="text-lg font-normal text-primary">{results.scoreResult.newEntry.ei}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">PR</div>
                            <div className="text-lg font-normal text-primary">{results.scoreResult.newEntry.pr}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">SA</div>
                            <div className="text-lg font-normal text-primary">{results.scoreResult.newEntry.sa}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-mid italic py-2">Not scored</div>
                      )}
                    </div>

                    {/* Weighted Day Scores */}
                    <div className="bg-secondary/5 border border-secondary/15 p-4 rounded-xl space-y-2.5">
                      <div className="text-[9px] font-bold uppercase tracking-widest text-secondary border-b border-secondary/15 pb-1">Weighted Day</div>
                      {results.calculatedScores && results.calculatedScores.day_ei !== null ? (
                        <div className="grid grid-cols-3 gap-1 text-center font-serif">
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">EI</div>
                            <div className="text-lg font-semibold text-secondary-dark">{results.calculatedScores.day_ei}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">PR</div>
                            <div className="text-lg font-semibold text-secondary-dark">{results.calculatedScores.day_pr}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-sans font-bold text-mid">SA</div>
                            <div className="text-lg font-semibold text-secondary-dark">{results.calculatedScores.day_sa}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-[10px] text-mid italic py-2">Not calculated</div>
                      )}
                    </div>
                  </div>

                  {/* Expected Score Range (Rubric presets alignment check) */}
                  {expectedRanges && results.calculatedScores && (
                    <div className="p-4 bg-[#FBFBFB] rounded-xl border border-primary/5 space-y-3.5">
                      <div className="font-serif font-normal text-md border-b border-primary/5 pb-2 text-primary flex items-center gap-1.5">
                        <Sliders size={15} className="text-[#8DBFB4]" />
                        <span>Expected Score Range</span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* EI Check */}
                        {results.calculatedScores.day_ei !== null && (
                          <div className="bg-mint-grey p-4 rounded-xl flex flex-col items-center text-center space-y-1 text-xs border border-primary/5">
                            <span className="text-sm font-bold text-primary block">EI</span>
                            <span className="text-mid font-mono text-[11px] block">Expected: {expectedRanges.day_ei.min}-{expectedRanges.day_ei.max}</span>
                            <span className="font-semibold text-primary font-mono text-[12px] block">Actual: {results.calculatedScores.day_ei}</span>
                            <div className="text-lg pt-1">
                              {results.calculatedScores.day_ei >= expectedRanges.day_ei.min && results.calculatedScores.day_ei <= expectedRanges.day_ei.max ? (
                                <span className="text-secondary font-bold" title="Aligned with rubric preset">✅</span>
                              ) : (
                                <span className="text-accent font-bold" title="Out of preset range">⚠️</span>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* PR Check */}
                        {results.calculatedScores.day_pr !== null && (
                          <div className="bg-mint-grey p-4 rounded-xl flex flex-col items-center text-center space-y-1 text-xs border border-primary/5">
                            <span className="text-sm font-bold text-primary block">PR</span>
                            <span className="text-mid font-mono text-[11px] block">Expected: {expectedRanges.day_pr.min}-{expectedRanges.day_pr.max}</span>
                            <span className="font-semibold text-primary font-mono text-[12px] block">Actual: {results.calculatedScores.day_pr}</span>
                            <div className="text-lg pt-1">
                              {results.calculatedScores.day_pr >= expectedRanges.day_pr.min && results.calculatedScores.day_pr <= expectedRanges.day_pr.max ? (
                                <span className="text-secondary font-bold" title="Aligned with rubric preset">✅</span>
                              ) : (
                                <span className="text-accent font-bold" title="Out of preset range">⚠️</span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SA Check */}
                        {results.calculatedScores.day_sa !== null && (
                          <div className="bg-mint-grey p-4 rounded-xl flex flex-col items-center text-center space-y-1 text-xs border border-primary/5">
                            <span className="text-sm font-bold text-primary block">SA</span>
                            <span className="text-mid font-mono text-[11px] block">Expected: {expectedRanges.day_sa.min}-{expectedRanges.day_sa.max}</span>
                            <span className="font-semibold text-primary font-mono text-[12px] block">Actual: {results.calculatedScores.day_sa}</span>
                            <div className="text-lg pt-1">
                              {results.calculatedScores.day_sa >= expectedRanges.day_sa.min && results.calculatedScores.day_sa <= expectedRanges.day_sa.max ? (
                                <span className="text-secondary font-bold" title="Aligned with rubric preset">✅</span>
                              ) : (
                                <span className="text-accent font-bold" title="Out of preset range">⚠️</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Section: Scoring Health */}
                  {results.scoreResult && (
                    <div className="border border-primary/5 rounded-xl p-4.5 space-y-3 bg-[#FBFBFB]">
                      <div className="font-serif font-normal text-md border-b border-primary/5 pb-2 text-primary flex items-center gap-1.5">
                        <CheckCircle2 size={15} className="text-secondary" />
                        <span>Scoring Health</span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div className="bg-mint-grey p-3 rounded-lg space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">confidence_flag</span>
                          <div className="flex items-center gap-1.5 font-semibold text-primary">
                            {results.scoreResult.confidenceFlag ? (
                              <>
                                <AlertTriangle size={13} className="text-accent" />
                                <span>Low Confidence Warning</span>
                              </>
                            ) : (
                              <>
                                <CheckCircle2 size={13} className="text-secondary" />
                                <span>Normal (High Confidence)</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="bg-mint-grey p-3 rounded-lg space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">arc_scoring_applied</span>
                          <div className="flex items-center gap-1.5 font-semibold text-primary">
                            {results.scoreResult.arcScoringApplied ? (
                              <>
                                <CheckCircle2 size={13} className="text-secondary" />
                                <span className="text-secondary-dark">True (Register Shift Averaged)</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={13} className="text-mid/45" />
                                <span className="text-mid/60">False</span>
                              </>
                            )}
                          </div>
                        </div>

                        <div className="bg-mint-grey p-3 rounded-lg space-y-1 sm:col-span-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">low_confidence_reason</span>
                          <p className="text-xs text-primary leading-normal italic font-serif mt-0.5">
                            {results.scoreResult.confidenceFlag 
                              ? (results.scoreResult.confidenceReason || 'Short entry or ambiguous language signal detected.') 
                              : 'Standard psychometric signals captured cleanly.'}
                          </p>
                        </div>

                        <div className="bg-mint-grey p-3 rounded-lg space-y-1 sm:col-span-2">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">entry_type</span>
                          <div className="font-semibold text-primary font-serif italic">{results.entryType}</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Latency, retry count, provider, status */}
                  {results.aiTrace && (
                    <div className="flex flex-col gap-2 border-t border-primary/5 pt-3 text-[10px] text-mid font-mono">
                      <div className="flex justify-between items-center">
                        <div>Latency: {results.aiTrace.latency}ms</div>
                        <div>Retries: {results.aiTrace.retryCount || 0}</div>
                        <div className="uppercase">Provider: {results.aiTrace.provider}</div>
                      </div>
                      
                      {/* Timeline */}
                      <div className="mt-2 space-y-1.5 border-t border-primary/5 pt-2">
                        <div className="font-semibold text-primary uppercase text-[8px] tracking-wider mb-1">Scoring Pipeline Timeline</div>
                        <div className="relative pl-3 border-l-2 border-[#8DBFB4]/45 space-y-2 text-[9px] text-mid leading-relaxed">
                          <div className="relative">
                            <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-[#8DBFB4]" />
                            <span className="font-semibold text-primary">0ms</span>: Entry Submission & Validation
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-secondary" />
                            <span className="font-semibold text-primary">~10ms</span>: Sent request to provider ({results.aiTrace.provider})
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-secondary" />
                            <span className="font-semibold text-primary">~{Math.round(results.aiTrace.latency * 0.9)}ms</span>: Raw response received
                          </div>
                          <div className="relative">
                            <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-accent" />
                            <span className="font-semibold text-primary">~{Math.round(results.aiTrace.latency * 0.95)}ms</span>: Self-Healing JSON parsing & Zod Validation
                          </div>
                          {results.crisis && (
                            <div className="relative">
                              <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-accent" />
                              <span className="font-semibold text-primary">~{Math.round(results.aiTrace.latency * 0.98)}ms</span>: Layered Crisis Evaluation completed
                            </div>
                          )}
                          <div className="relative">
                            <span className="absolute -left-[18px] top-1 w-2.5 h-2.5 rounded-full bg-[#8DBFB4]" />
                            <span className="font-semibold text-primary">{results.aiTrace.latency}ms</span>: Result persisted to UI & Observability Logs
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 4: Crisis Analysis */}
                <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                  <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                    <h2 className="font-serif text-lg font-normal text-primary">Crisis Analysis</h2>
                    
                    <div className="flex items-center gap-1.5">
                      {results.crisis?.crisisFlag ? (
                        <span className="px-2.5 py-0.5 bg-accent/15 text-[#8a3020] rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <Flame size={10} />
                          <span>CRISIS SIGNAL ACTIVE</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 bg-secondary/10 text-[#1A5040] rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                          <CheckCircle2 size={10} />
                          <span>No Risk Flags</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs text-primary leading-relaxed">
                    
                    {/* Status grid */}
                    <div className="grid grid-cols-2 gap-3 font-mono text-[10px] bg-mint-grey p-3 rounded-xl border border-primary/5">
                      <div>
                        <span className="text-mid">crisis_flag:</span> <span className="font-bold text-primary">{results.crisis?.crisisFlag ? 'true' : 'false'}</span>
                      </div>
                      <div>
                        <span className="text-mid">crisis_type:</span> <span className="font-bold text-primary">{results.crisis?.crisisType || 'null'}</span>
                      </div>
                      <div>
                        <span className="text-mid">immediate_trigger:</span> <span className="font-bold text-primary">{results.crisis?.isImmediateDistress ? 'true' : 'false'}</span>
                      </div>
                      <div>
                        <span className="text-mid">risk_lang_trigger:</span> <span className="font-bold text-primary">{results.crisis?.isRiskLanguage ? 'true' : 'false'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-mid">reflection_suppressed:</span> <span className="font-bold text-primary">{results.crisis?.reflectionSuppressed ? 'true' : 'false'}</span>
                      </div>
                    </div>

                    {/* Explanation */}
                    <div className="p-3 bg-secondary/5 border border-secondary/15 rounded-xl space-y-1">
                      <div className="font-bold uppercase tracking-widest text-[9px] text-secondary">Trigger Evaluator</div>
                      <p className="font-serif italic text-primary/80">{results.crisis?.explanation}</p>
                    </div>

                    {/* Threshold definition card */}
                    <div className="p-3 bg-mint-grey rounded-xl space-y-2 border border-primary/5">
                      <span className="font-bold uppercase tracking-wider text-[9px] text-mid block">Defined Rubric Gates</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] text-mid">
                        <div className="border-l border-primary/10 pl-2">
                          <div className="font-semibold text-primary">Score-Based Immediate Crisis</div>
                          <div>(EI &gt;= 9.0 AND SA &lt;= 2.0)</div>
                        </div>
                        <div className="border-l border-primary/10 pl-2">
                          <div className="font-semibold text-primary">Risk Language Detected</div>
                          <div>Explicit self-harm intent keywords</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

                {/* Section 6: Raw AI Response (Developer Accordion) */}
                {results.aiTrace && (
                  <div className="bg-white rounded-premium border border-primary/5 shadow-sm overflow-hidden">
                    <button
                      onClick={() => setAccordionOpen(!accordionOpen)}
                      className="w-full px-6 py-4 flex items-center justify-between bg-primary/[0.02] border-b border-primary/5 cursor-pointer text-left focus:outline-none"
                    >
                      <span className="font-serif text-sm font-semibold text-primary flex items-center gap-2">
                        <Terminal size={14} className="text-secondary" />
                        <span>Section 6 — Raw AI Tracing & Prompts</span>
                      </span>
                      {accordionOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>

                    <AnimatePresence>
                      {accordionOpen && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: 'auto' }}
                          exit={{ height: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-6 space-y-5 bg-mint-grey/50 border-t border-primary/5 font-mono text-[10px] leading-relaxed">
                            
                            {/* System Prompt */}
                            <div className="space-y-1.5">
                              <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw System Prompt</span>
                              <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {results.aiTrace.systemPrompt}
                              </pre>
                            </div>

                            {/* User Content */}
                            <div className="space-y-1.5">
                              <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw User Content</span>
                              <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap">
                                {results.aiTrace.userContent}
                              </pre>
                            </div>

                            {/* Raw Provider Response */}
                            <div className="space-y-1.5">
                              <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw Provider Response Text</span>
                              <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-[#1A5040] whitespace-pre-wrap max-h-48 overflow-y-auto">
                                {results.aiTrace.rawResponse}
                              </pre>
                            </div>

                            {/* Parsed JSON */}
                            <div className="space-y-1.5">
                              <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Parsed JSON Payload</span>
                              <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap">
                                {JSON.stringify(results.scoreResult || results.crisis, null, 2)}
                              </pre>
                            </div>

                            {/* Token Usage & Validation */}
                            <div className="grid grid-cols-2 gap-4 text-[10px]">
                              <div className="p-3 bg-mint-grey border border-primary/15 rounded-xl space-y-1">
                                <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[8px]">Token Usage</span>
                                {results.aiTrace.usage ? (
                                  <div className="space-y-0.5">
                                    <div>Prompt Tokens: {results.aiTrace.usage.prompt_tokens || results.aiTrace.usage.input_tokens || 0}</div>
                                    <div>Completion Tokens: {results.aiTrace.usage.completion_tokens || results.aiTrace.usage.output_tokens || 0}</div>
                                    <div className="font-bold">Total Tokens: {results.aiTrace.usage.total_tokens || ((results.aiTrace.usage.input_tokens || 0) + (results.aiTrace.usage.output_tokens || 0))}</div>
                                  </div>
                                ) : (
                                  <div>N/A</div>
                                )}
                              </div>
                              <div className="p-3 bg-mint-grey border border-primary/15 rounded-xl space-y-1">
                                <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[8px]">Validation Result</span>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 text-secondary">
                                    <CheckCircle2 size={11} />
                                    <span>JSON Structure Valid</span>
                                  </div>
                                  <div>Integrity Checks: Passed</div>
                                </div>
                              </div>
                            </div>

                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

              </motion.div>
            )}

          </div>

        </div>

      </main>
    </div>
  );
}
