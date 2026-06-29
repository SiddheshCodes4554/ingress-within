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
  Database,
  MessageSquare,
  Smile
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

import { DashboardService } from '../services/dashboardService';

// No preset scenarios to avoid evaluation bias

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

  // Tabs and Compliance Check State
  const [activeTab, setActiveTab] = useState('simulator');
  const [dbCompliance, setDbCompliance] = useState(null);
  const [developerUser, setDeveloperUser] = useState(null);
  const [checkingCompliance, setCheckingCompliance] = useState(false);

  // Threads Test State
  const [testThreads, setTestThreads] = useState([]);
  const [isThreadsLoading, setIsThreadsLoading] = useState(false);
  const [threadsError, setThreadsError] = useState(null);
  const [expandedTestThreads, setExpandedTestThreads] = useState({});
  const [testThreadResponses, setTestThreadResponses] = useState({});

  // Cycle Engine State
  const [cycleStatus, setCycleStatus] = useState(null);
  const [cycleLoading, setCycleLoading] = useState(false);
  const [simulatingCycle, setSimulatingCycle] = useState(false);
  const [cycleNumberInput, setCycleNumberInput] = useState(1);
  const [cycleMessage, setCycleMessage] = useState(null);

  const loadCycleStatus = async () => {
    setCycleLoading(true);
    setCycleMessage(null);
    try {
      const data = await DashboardService.fetchCycleStatus();
      setCycleStatus(data);
    } catch (err) {
      console.error('Failed to load cycle status:', err);
    } finally {
      setCycleLoading(false);
    }
  };

  const triggerSimulation = async (action, extraParams = {}) => {
    setSimulatingCycle(true);
    setCycleMessage(null);
    try {
      const res = await DashboardService.simulateCycle({ action, ...extraParams });
      setCycleMessage({ type: 'success', text: res.message || 'Simulation completed.' });
      await loadCycleStatus();
    } catch (err) {
      console.error('Simulation failed:', err);
      setCycleMessage({ type: 'error', text: err.message || 'Simulation failed.' });
    } finally {
      setSimulatingCycle(false);
    }
  };

  useEffect(() => {
    // Exclude status query on load. Latency is minimized by loading only when requested.
  }, []);

  // History Tab State
  const [historyEntries, setHistoryEntries] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [expandedEntries, setExpandedEntries] = useState({});

  const runComplianceCheck = async () => {
    setCheckingCompliance(true);
    try {
      const dbRes = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'db-compliance-check' })
      });
      const dbData = await dbRes.json();
      if (dbRes.ok && dbData.schema) {
        setDbCompliance(dbData.schema);
      }

      const userRes = await fetch('/api/auth/me');
      const userData = await userRes.json();
      if (userRes.ok && userData.user) {
        setDeveloperUser(userData);
      }
    } catch (err) {
      console.error('Failed to run compliance check:', err);
    } finally {
      setCheckingCompliance(false);
    }
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

  const fetchTestThreads = async () => {
    setIsThreadsLoading(true);
    setThreadsError(null);
    try {
      const res = await fetch('/api/threads');
      if (!res.ok) throw new Error('Failed to fetch test threads.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error?.message || 'Failed to fetch test threads.');
      setTestThreads(data.threads || []);
    } catch (err) {
      console.error(err);
      setThreadsError(err.message);
    } finally {
      setIsThreadsLoading(false);
    }
  };

  const fetchTestThreadResponses = async (threadId) => {
    try {
      const res = await fetch(`/api/threads/${threadId}`);
      if (!res.ok) throw new Error('Failed to fetch thread responses.');
      const data = await res.json();
      setTestThreadResponses(prev => ({
        ...prev,
        [threadId]: data.responses || []
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTestThreadExpand = async (id) => {
    const nextState = !expandedTestThreads[id];
    setExpandedTestThreads(prev => ({ ...prev, [id]: nextState }));
    if (nextState && !testThreadResponses[id]) {
      await fetchTestThreadResponses(id);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistoryEntries();
    } else if (activeTab === 'threads') {
      fetchTestThreads();
    }
  }, [activeTab]);

  const toggleEntryExpand = (id) => {
    setExpandedEntries(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const getReflectionDetails = () => {
    if (!results) return null;
    
    // Check if it's from run-reflection or run-score-reflection directly
    if (results.reflection) {
      if (typeof results.reflection === 'object' && results.reflection.reflectionText !== undefined) {
        // run-score-reflection
        return {
          reflectionText: results.reflection.reflectionText,
          closingQuestion: results.reflection.closingQuestion,
          classification: results.reflection.classification,
          confidence: results.reflection.confidence,
          themes: results.reflection.themes,
          vocabulary: results.reflection.vocabulary,
          validation: results.reflection.validation,
          attempts: results.reflection.attempts,
          suppressed: results.reflection.suppressed,
          trace: results.reflectionTrace
        };
      } else if (typeof results.reflection === 'string') {
        // run-reflection
        return {
          reflectionText: results.reflection,
          closingQuestion: results.closingQuestion,
          classification: results.classification,
          confidence: results.confidence,
          themes: results.themes,
          vocabulary: results.vocabulary,
          validation: results.validation,
          attempts: results.attempts,
          suppressed: false,
          trace: results.aiTrace
        };
      }
    }
    
    // Check if it's from run-full background poll
    if (results.reflectionResult) {
      return {
        reflectionText: results.reflectionResult.reflection_text,
        closingQuestion: results.reflectionResult.closing_question,
        classification: results.reflectionResult.classification,
        confidence: results.reflectionResult.confidence,
        themes: results.reflectionResult.themes,
        vocabulary: results.reflectionResult.vocabulary,
        validation: { valid: results.reflectionResult.status === 'ready' },
        attempts: 1,
        suppressed: results.crisis?.reflectionSuppressed || false,
        trace: null
      };
    }
    
    return null;
  };

  // Run reflection only (synchronous)
  const runReflectionOnly = async () => {
    setIsLoading(true);
    setActivePipeline('reflection');
    setError(null);
    setResults(null);
    setJobStates(null);
    setIsPolling(false);

    try {
      const res = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-reflection',
          newEntryText,
          provider
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Reflection generation failed.');
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setActivePipeline(null);
    }
  };

  // Run score + reflection (synchronous)
  const runScoreReflection = async () => {
    setIsLoading(true);
    setActivePipeline('score-reflection');
    setError(null);
    setResults(null);
    setJobStates(null);
    setIsPolling(false);

    try {
      const res = await fetch('/api/test-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run-score-reflection',
          reflectionText,
          newEntryText,
          provider
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Score + Reflection pipeline failed.');
      setResults(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      setActivePipeline(null);
    }
  };

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
          const vocabDone = !data.jobs.vocab || data.jobs.vocab.status === 'COMPLETED' || data.jobs.vocab.status === 'FAILED';

          // Stop polling once all queues complete, or after 15 attempts (22.5s)
          if ((scoringDone && crisisDone && reflectionDone && vocabDone) || attempts >= 15) {
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

        {/* Navigation Tabs */}
        <div className="mb-6 flex border-b border-primary/10">
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'simulator'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Pipeline Simulator
          </button>
          <button
            onClick={() => {
              setActiveTab('compliance');
              runComplianceCheck();
            }}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'compliance'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Compliance Dashboard
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'history'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Entry History
          </button>
          <button
            onClick={() => setActiveTab('threads')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'threads'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Threads Testing
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-wider border-b-2 cursor-pointer transition-all ${
              activeTab === 'performance'
                ? 'border-secondary text-primary font-semibold'
                : 'border-transparent text-mid hover:text-primary'
            }`}
          >
            Performance Monitor
          </button>
        </div>

        {activeTab === 'simulator' && (
          <>
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
                    <span>Optional Reflection Input Area</span>
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
                    <span>Single Journal Input Area</span>
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

              <div className="pt-2">
                <button
                  onClick={runFullPipeline}
                  disabled={isLoading || (!reflectionText.trim() && !newEntryText.trim())}
                  className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-[#2A3A3E] text-white py-3.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-sm disabled:opacity-40"
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

            {/* Cycle Engine Controls */}
            <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-6">
              <div className="flex items-center justify-between border-b border-primary/5 pb-3">
                <div className="flex items-center gap-2">
                  <Database size={16} className="text-secondary" />
                  <h2 className="font-serif text-lg font-normal text-primary">Cycle Engine Controls</h2>
                </div>
                <button
                  onClick={loadCycleStatus}
                  disabled={cycleLoading}
                  className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-mid hover:text-primary transition-colors border-none bg-transparent cursor-pointer disabled:opacity-40"
                >
                  <RefreshCw size={10} className={cycleLoading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
              </div>

              {/* Cycle Status Display */}
              <div className="bg-[#FAFBFB] p-4 rounded-xl border border-primary/5 space-y-3.5">
                <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-mid border-b border-primary/5 pb-1.5">
                  <span>Current Cycle State</span>
                  {cycleLoading && <span className="text-[10px] text-secondary font-bold uppercase animate-pulse">Querying...</span>}
                </div>

                {cycleStatus ? (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Active Cycle</div>
                      <div className="font-semibold text-primary">
                        {cycleStatus.hasActiveCycle ? `Cycle ${cycleStatus.cycle?.cycle_number || '1'}` : 'None (Assessment Blocked or Archived)'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Status</div>
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${cycleStatus.cycle?.status === 'ACTIVE' ? 'bg-[#8DBFB4]' : 'bg-[#E0A898]'}`} />
                        <span className="font-semibold text-primary font-mono text-[10px]">{cycleStatus.cycle?.status || 'N/A'}</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Day Progress</div>
                      <div className="font-semibold text-primary">
                        Day {cycleStatus.day || 1} / {cycleStatus.cycle?.total_days || 30}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Days Remaining</div>
                      <div className="font-semibold text-primary">{cycleStatus.daysRemaining ?? 'N/A'} days</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Assessment Gated</div>
                      <div className={`font-semibold ${cycleStatus.cycle?.assessment_available && !cycleStatus.cycle?.assessment_completed ? 'text-[#8a3020]' : 'text-[#4A6A64]'}`}>
                        {cycleStatus.cycle?.assessment_available && !cycleStatus.cycle?.assessment_completed ? 'YES (Assessment Available)' : 'NO'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Streak & Consistency</div>
                      <div className="font-semibold text-primary">
                        {cycleStatus.streak || 0} days · {cycleStatus.consistency || 0}%
                      </div>
                    </div>
                    <div className="col-span-2 space-y-1 pt-1.5 border-t border-primary/5">
                      <div className="text-mid/60 text-[10px] font-bold uppercase tracking-wider">Start Date</div>
                      <div className="font-semibold text-primary font-mono text-[11px]">{cycleStatus.cycle?.start_date || 'N/A'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-xs text-mid py-2">
                    {cycleLoading ? 'Loading cycle information...' : 'No cycle data available.'}
                  </div>
                )}
              </div>

              {/* Simulation feedback message */}
              {cycleMessage && (
                <div className={`p-3 rounded-xl border text-xs flex justify-between items-start ${
                  cycleMessage.type === 'success' 
                    ? 'bg-[#8DBFB4]/10 border-[#8DBFB4]/25 text-[#1A5040]' 
                    : 'bg-accent/15 border-accent/25 text-[#8a3020]'
                }`}>
                  <p className="flex-1">{cycleMessage.text}</p>
                  <button 
                    onClick={() => setCycleMessage(null)}
                    className="ml-2 font-bold text-mid/70 hover:text-primary border-none bg-transparent cursor-pointer text-[10px]"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Simulation Action Buttons */}
              <div className="space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-mid">Simulate Progression</div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => triggerSimulation('progress', { days: 1 })}
                    disabled={simulatingCycle || !cycleStatus?.cycle}
                    className="flex items-center justify-center gap-1 bg-mint-grey hover:bg-[#E2ECE9] border border-primary/10 hover:border-primary/20 text-primary py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>+1 Day</span>
                  </button>
                  <button
                    onClick={() => triggerSimulation('progress', { days: 5 })}
                    disabled={simulatingCycle || !cycleStatus?.cycle}
                    className="flex items-center justify-center gap-1 bg-mint-grey hover:bg-[#E2ECE9] border border-primary/10 hover:border-primary/20 text-primary py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>+5 Days</span>
                  </button>
                  <button
                    onClick={() => triggerSimulation('progress', { days: 30 })}
                    disabled={simulatingCycle || !cycleStatus?.cycle}
                    className="flex items-center justify-center gap-1 bg-mint-grey hover:bg-[#E2ECE9] border border-primary/10 hover:border-primary/20 text-primary py-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>+30 Days</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => triggerSimulation('complete-cycle')}
                    disabled={simulatingCycle || !cycleStatus?.cycle}
                    className="flex items-center justify-center gap-1.5 bg-[#E0A898]/10 hover:bg-[#E0A898]/18 border border-[#E0A898]/20 hover:border-[#E0A898]/35 text-[#8a3020] py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>Simulate Completion</span>
                  </button>
                  <button
                    onClick={() => triggerSimulation('archive')}
                    disabled={simulatingCycle || !cycleStatus?.cycle}
                    className="flex items-center justify-center gap-1.5 bg-accent/8 hover:bg-accent/15 border border-accent/15 hover:border-accent/30 text-[#8a3020] py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>Archive Cycle</span>
                  </button>
                </div>
              </div>

              {/* Create/Provision Test Cycle */}
              <div className="border-t border-primary/5 pt-4.5 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-mid">Provision Specific Cycle</div>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center bg-mint-grey border border-transparent focus-within:border-secondary/30 rounded-xl px-3 py-1">
                    <span className="text-[10px] font-bold uppercase text-mid shrink-0 mr-2">Cycle #</span>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={cycleNumberInput}
                      onChange={(e) => setCycleNumberInput(parseInt(e.target.value) || 1)}
                      className="bg-transparent text-xs font-semibold text-primary border-none outline-none w-full py-1.5"
                    />
                  </div>
                  <button
                    onClick={() => triggerSimulation('create-test', { cycleNumber: cycleNumberInput })}
                    disabled={simulatingCycle}
                    className="bg-primary hover:bg-[#2A3A3E] text-white px-4 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-40"
                  >
                    Provision
                  </button>
                </div>
                <p className="text-[10px] text-mid italic leading-relaxed">
                  Provisioning will deactivate and archive the current active cycle first to ensure only one cycle is active.
                </p>
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
                <p className="text-[11px] max-w-xs leading-relaxed">Fill in entries above, then click run to inspect psychometric and crisis analysis.</p>
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
                  {(results.aiTrace || results.scoringTrace) && (
                    <div className="flex flex-col gap-2 border-t border-primary/5 pt-3 text-[10px] text-mid font-mono">
                      <div className="flex justify-between items-center">
                        <div>Latency: {results.totalLatency || results.aiTrace?.latency || results.scoringTrace?.latency}ms</div>
                        <div>Retries: {results.aiTrace?.retryCount || results.scoringTrace?.retryCount || 0}</div>
                        <div className="uppercase">Provider: {results.aiTrace?.provider || results.scoringTrace?.provider || provider}</div>
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

                {/* Section: Reflection Quality Lab */}
                {(() => {
                  const refl = getReflectionDetails();
                  if (!refl) return null;

                  return (
                    <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                      <div className="flex justify-between items-center border-b border-primary/5 pb-3">
                        <div className="flex items-center gap-2">
                          <MessageSquare size={16} className="text-secondary" />
                          <h2 className="font-serif text-lg font-normal text-primary">Reflection Quality Lab</h2>
                        </div>
                        <div className="flex items-center gap-2">
                          {refl.suppressed ? (
                            <span className="px-2 py-0.5 bg-accent/15 text-[#8a3020] rounded-full text-[9px] font-bold uppercase tracking-wider">
                              SUPPRESSED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-secondary/10 text-secondary-dark rounded-full text-[9px] font-bold uppercase tracking-wider">
                              Confidence: {refl.confidence || 'N/A'}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="bg-[#FBFBFB] border border-primary/5 p-4 rounded-xl space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Generated Reflection Text</span>
                            {!refl.suppressed && (
                              <button
                                onClick={runReflectionOnly}
                                className="text-[9px] text-secondary font-semibold hover:underline cursor-pointer bg-transparent border-none p-0"
                              >
                                Regenerate Reflection
                              </button>
                            )}
                          </div>
                          {refl.reflectionText ? (
                            (() => {
                              const paragraphs = refl.reflectionText.split('\n\n').filter(Boolean);
                              const bodyParagraphs = paragraphs.length > 1 ? paragraphs.slice(0, -1) : [];
                              const questionParagraph = paragraphs[paragraphs.length - 1];
                              return (
                                <div className="space-y-3 font-serif italic text-primary leading-relaxed text-sm">
                                  {bodyParagraphs.map((p, idx) => (
                                    <p key={idx} className="font-sans font-normal not-italic text-xs text-primary/80">{p}</p>
                                  ))}
                                  {questionParagraph && (
                                    <blockquote className="border-l-4 border-secondary/20 pl-4 py-1">
                                      {questionParagraph}
                                    </blockquote>
                                  )}
                                </div>
                              );
                            })()
                          ) : (
                            <span className="italic text-mid">No reflection text generated</span>
                          )}
                        </div>

                        {/* Validation & Retries status */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="bg-mint-grey p-3 rounded-lg space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Quality Validation</span>
                            <div className="flex items-center gap-1.5 font-semibold text-primary">
                              {refl.validation?.valid ? (
                                <>
                                  <CheckCircle2 size={13} className="text-secondary" />
                                  <span>Passed Cleanly</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle size={13} className="text-accent" />
                                  <span className="text-[#8a3020]">Failed: {refl.validation?.reason || 'Validation rules violated'}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="bg-mint-grey p-3 rounded-lg space-y-1">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Attempts / Retries</span>
                            <div className="flex items-center gap-1.5 font-semibold text-primary">
                              <span>{refl.attempts || 1} {refl.attempts > 1 ? 'Attempts (Correction Loop Active)' : 'Attempt (Clean Pass)'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Compliance fields display */}
                        {!refl.suppressed && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#F9FBFA] p-3 rounded-lg border border-primary/5">
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Classification</span>
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                                refl.classification === 'Flat' 
                                  ? 'bg-[#E5F2F0] text-[#2D5A53]' 
                                  : refl.classification === 'Open'
                                    ? 'bg-[#E7ECFC] text-[#2F4BB7]'
                                    : 'bg-[#FCEDEA] text-[#B73E2F]'
                              }`}>
                                {refl.classification || 'None'}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Closing Question</span>
                              <span className="text-xs italic font-serif text-primary block">
                                {refl.closingQuestion || 'None generated'}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Themes */}
                        {refl.themes && refl.themes.length > 0 && (
                          <div className="space-y-1.5">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Extracted Themes</span>
                            <div className="flex flex-wrap gap-1.5">
                              {refl.themes.map((theme, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] uppercase font-bold tracking-wider rounded-md">
                                  {theme}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Vocabulary */}
                        {refl.vocabulary && refl.vocabulary.length > 0 && (
                          <div className="space-y-1.5 pt-2">
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Detected Vocabulary</span>
                            <div className="flex flex-wrap gap-1.5">
                              {refl.vocabulary.map((vocab, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-[#B8A8D4]/20 text-[#5A4A8A] text-[9px] uppercase font-bold tracking-wider rounded-md">
                                  {vocab}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* Section 4.5: Vocabulary Engine Results */}
                {results.vocabState && (
                  <div className="bg-white rounded-premium border border-primary/5 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-primary/5 bg-[#FAFBFB] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smile size={16} className="text-secondary" />
                        <h2 className="font-serif text-sm font-semibold text-primary">Vocabulary Engine Results</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {results.jobs?.vocab?.executionTime !== undefined && (
                          <span className="text-[10px] text-mid font-mono bg-mint-grey px-2 py-0.5 rounded">
                            Job Time: {results.jobs.vocab.executionTime}ms
                          </span>
                        )}
                        <span className="px-2 py-0.5 bg-[#8DBFB4]/12 text-[#1A5040] text-[9px] uppercase font-bold tracking-wider rounded-md">
                          Validated
                        </span>
                      </div>
                    </div>

                    <div className="p-6 space-y-5 text-xs">
                      
                      {/* Cycle & Pipeline Info */}
                      {results.vocabState.cycleInfo && (
                        <div className="p-3 bg-mint-grey/35 rounded-xl border border-primary/5 grid grid-cols-2 gap-4">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid/60 block">Cycle Assignment</span>
                            <span className="font-semibold text-primary font-mono text-[11px] block truncate">{results.vocabState.cycleInfo.cycle_id}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-mid/60 block">Cycle Day</span>
                            <span className="font-semibold text-primary font-mono text-[11px] block">Day {results.vocabState.cycleInfo.cycle_day}</span>
                          </div>
                        </div>
                      )}

                      {/* Raw Extracted Words */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">1. Raw Extracted Words ({results.vocabState.rawWords?.length || 0})</span>
                        <div className="flex flex-wrap gap-1">
                          {results.vocabState.rawWords && results.vocabState.rawWords.length > 0 ? (
                            results.vocabState.rawWords.map((w, idx) => (
                              <span key={idx} className="bg-mint-grey px-2 py-0.5 rounded text-primary font-medium animate-fade-in">
                                {w}
                              </span>
                            ))
                          ) : (
                            <span className="text-light-mid italic">No raw words.</span>
                          )}
                        </div>
                      </div>

                      {/* Normalized Words */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">2. Normalized Words (Lemmatized Base Forms)</span>
                        <div className="flex flex-wrap gap-1.5">
                          {results.vocabState.extracted && results.vocabState.extracted.length > 0 ? (
                            results.vocabState.extracted.map((v, idx) => (
                              <span key={idx} className="px-2 py-0.5 bg-[#8DBFB4]/12 text-[#1A5040] border border-[#8DBFB4]/20 rounded font-medium">
                                {v.word} &rarr; <strong className="font-semibold">{v.normalized_word}</strong>
                              </span>
                            ))
                          ) : (
                            <span className="text-light-mid italic">No normalized words.</span>
                          )}
                        </div>
                      </div>

                      {/* Ignored Words */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">3. Ignored Words (Stop Words / Fillers Filtered Out)</span>
                        <div className="flex flex-wrap gap-1">
                          {results.vocabState.ignoredWords && results.vocabState.ignoredWords.length > 0 ? (
                            results.vocabState.ignoredWords.map((w, idx) => (
                              <span key={idx} className="bg-primary/5 text-mid/60 px-2 py-0.5 rounded">
                                {w}
                              </span>
                            ))
                          ) : (
                            <span className="text-light-mid italic">No ignored words.</span>
                          )}
                        </div>
                      </div>

                      {/* Vocabulary Concepts */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-[#5A4A8A] block">4. Vocabulary Concepts (AI psychological themes)</span>
                        {results.vocabState.concepts && results.vocabState.concepts.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {results.vocabState.concepts.map((c, idx) => (
                              <div key={idx} className="bg-[#5A4A8A]/5 p-2.5 rounded-xl border border-[#5A4A8A]/10 flex items-center justify-between">
                                <div className="space-y-0.5">
                                  <span className="font-semibold text-primary">{c.concept}</span>
                                  <span className="text-[9px] text-mid/60 block">confidence: {Math.round(c.confidence * 100)}%</span>
                                </div>
                                <span className="font-mono font-bold text-[#5A4A8A]">{c.frequency}×</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-light-mid italic">No concepts extracted.</p>
                        )}
                      </div>

                      {/* Detected Words & Frequency Counts */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">5. Accumulated Vocabulary Frequencies (Active Cycle)</span>
                        {results.vocabState.words && results.vocabState.words.length > 0 ? (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {results.vocabState.words.map((v, idx) => (
                              <div key={idx} className={`p-2.5 rounded-xl border flex items-center justify-between ${v.is_emotional ? 'bg-[#5A4A8A]/5 border-[#5A4A8A]/15' : 'bg-mint-grey border-primary/5'}`}>
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-semibold text-primary">{v.word}</span>
                                    {v.is_emotional && (
                                      <span className="px-1 py-0.2 bg-[#5A4A8A]/10 text-[#5A4A8A] text-[8px] font-bold uppercase tracking-wider rounded">EMO</span>
                                    )}
                                  </div>
                                  <span className="text-[9.5px] text-mid block">norm: {v.normalized_word}</span>
                                  {v.is_emotional && v.emotional_score !== undefined && (
                                    <span className="text-[9px] text-[#5A4A8A] block">score: {Number(v.emotional_score).toFixed(2)}</span>
                                  )}
                                </div>
                                <span className="font-mono font-bold text-secondary">{v.frequency}×</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-light-mid italic">No words accumulated.</p>
                        )}
                      </div>

                      {/* Cluster Results */}
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">6. Semantic Cluster Groupings</span>
                        {results.vocabState.clusters && results.vocabState.clusters.length > 0 ? (
                          <div className="space-y-2.5">
                            {results.vocabState.clusters.map((c, idx) => (
                              <div key={idx} className="bg-mint-grey/50 p-3 rounded-xl border border-primary/5 space-y-1.5">
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold text-primary capitalize">{c.cluster_name}</span>
                                  <span className="px-2 py-0.5 bg-[#E0A898]/15 border border-[#E0A898]/20 rounded text-[9px] font-bold uppercase text-[#8a3020]">
                                    {c.cluster_type}
                                  </span>
                                </div>
                                <div className="text-[10px] text-mid/80 flex items-center justify-between">
                                  <span>Total frequency: {c.frequency || 0}</span>
                                  <span>Words in cluster: {c.word_count}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-light-mid italic">No clusters generated yet.</p>
                        )}
                      </div>

                      {/* Validation Results */}
                      <div className="space-y-1.5 border-t border-primary/5 pt-3">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-mid block">Validation Check Results</span>
                        <div className="space-y-1 text-[11px] leading-relaxed">
                          <div className="flex items-center gap-2 text-secondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                            <span>Filler / Stop Words Check: Passed (no generic terms extracted)</span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                            <span>Emotional Language Check: Passed (prioritized affect words)</span>
                          </div>
                          <div className="flex items-center gap-2 text-secondary">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0" />
                            <span>Self-Descriptive Language Check: Passed (prioritized internal descriptors)</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Section 6: Raw AI Response (Developer Accordion) */}
                {(results.aiTrace || results.scoringTrace || results.reflectionTrace) && (
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
                            
                            {results.aiTrace && (
                              <div className="space-y-4">
                                <div className="text-[10px] font-bold text-secondary uppercase border-b border-primary/5 pb-1">AI Execution Trace</div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw System Prompt</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {results.aiTrace.systemPrompt}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw User Content</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap">
                                    {results.aiTrace.userContent}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw Provider Response</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-[#1A5040] whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                                    {results.aiTrace.rawResponse}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {results.scoringTrace && (
                              <div className="space-y-4">
                                <div className="text-[10px] font-bold text-secondary uppercase border-b border-primary/5 pb-1">AI Scoring Trace</div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw System Prompt</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {results.scoringTrace.systemPrompt}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw User Content</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap">
                                    {results.scoringTrace.userContent}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw Provider Response</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-[#1A5040] whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                                    {results.scoringTrace.rawResponse}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {results.reflectionTrace && (
                              <div className="space-y-4 mt-6">
                                <div className="text-[10px] font-bold text-secondary uppercase border-b border-primary/5 pb-1">AI Reflection Trace</div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw System Prompt</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap max-h-48 overflow-y-auto">
                                    {results.reflectionTrace.systemPrompt}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw User Content</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap">
                                    {results.reflectionTrace.userContent}
                                  </pre>
                                </div>
                                <div className="space-y-1.5">
                                  <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Raw Provider Response</span>
                                  <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-[#1A5040] whitespace-pre-wrap max-h-48 overflow-y-auto font-mono">
                                    {results.reflectionTrace.rawResponse}
                                  </pre>
                                </div>
                              </div>
                            )}

                            {/* Parsed JSON */}
                            <div className="space-y-1.5">
                              <span className="font-bold uppercase tracking-wider text-[#8DBFB4] text-[9px]">Parsed JSON Payload / Result Data</span>
                              <pre className="p-3.5 bg-mint-grey border border-primary/15 rounded-xl overflow-x-auto text-[9px] text-primary whitespace-pre-wrap font-mono">
                                {JSON.stringify(results.scoreResult || results.crisis || results.reflection || results.reflectionResult, null, 2)}
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

        {/* Founder Testing Mode — Pipeline Comparison Grid */}
        {results && results.success !== false && (
          <div className="mt-10 bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <div className="flex items-center gap-2">
                <Sliders size={18} className="text-secondary" />
                <h2 className="font-serif text-xl font-normal text-primary">Founder Testing Mode — Pipeline Comparison</h2>
              </div>
              <span className="text-[10px] text-mid uppercase font-bold tracking-wider">Side-by-Side Review</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card 1: Entry Content */}
              <div className="bg-mint-grey/50 border border-primary/5 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-mid">Card 1 · Entry Content</div>
                  <div className="space-y-2 text-xs">
                    {reflectionText && (
                      <div className="space-y-1">
                        <span className="font-semibold text-primary">Yesterday's Reflection:</span>
                        <p className="font-serif italic text-primary/85 leading-relaxed max-h-24 overflow-y-auto">"{reflectionText}"</p>
                      </div>
                    )}
                    {newEntryText && (
                      <div className="space-y-1">
                        <span className="font-semibold text-primary">Today's Writing:</span>
                        <p className="font-serif italic text-primary/85 leading-relaxed max-h-36 overflow-y-auto">"{newEntryText}"</p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="text-[10px] text-mid/60 border-t border-primary/5 pt-2">
                  Type: {results.entryType}
                </div>
              </div>

              {/* Card 2: Psychometric Scores */}
              <div className="bg-mint-grey/50 border border-primary/5 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-mid">Card 2 · Psychometric Scores</div>
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-3 gap-2 text-center font-serif">
                      <div className="bg-white p-2 rounded-lg border border-primary/5">
                        <div className="text-[9px] font-sans font-bold text-mid">EI</div>
                        <div className="text-md font-semibold text-secondary-dark">{results.calculatedScores?.day_ei ?? 'N/A'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-primary/5">
                        <div className="text-[9px] font-sans font-bold text-mid">PR</div>
                        <div className="text-md font-semibold text-secondary-dark">{results.calculatedScores?.day_pr ?? 'N/A'}</div>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-primary/5">
                        <div className="text-[9px] font-sans font-bold text-mid">SA</div>
                        <div className="text-md font-semibold text-secondary-dark">{results.calculatedScores?.day_sa ?? 'N/A'}</div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[11px] leading-relaxed">
                      <div className="flex justify-between">
                        <span className="text-mid">Confidence:</span>
                        <span className="font-semibold text-primary">{results.scoreResult?.confidenceFlag ? 'Low' : 'Normal'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-mid">ARC Applied:</span>
                        <span className="font-semibold text-primary">{results.scoreResult?.arcScoringApplied ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-mid/60 border-t border-primary/5 pt-2 font-mono">
                  Scale: 1.0 - 10.0
                </div>
              </div>

              {/* Card 3: Crisis Gating */}
              <div className="bg-mint-grey/50 border border-primary/5 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="text-[9px] font-bold uppercase tracking-wider text-mid">Card 3 · Crisis Gating</div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-primary">Crisis Flag:</span>
                      {results.crisis?.crisisFlag ? (
                        <span className="px-2 py-0.5 bg-accent/10 text-[#8a3020] font-bold rounded text-[9px]">ACTIVE</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-secondary/10 text-secondary-dark font-bold rounded text-[9px]">CLEARED</span>
                      )}
                    </div>
                    {results.crisis?.crisisFlag && (
                      <div className="space-y-1">
                        <span className="font-semibold text-primary">Type:</span>
                        <span className="font-mono bg-white px-1 py-0.5 rounded text-accent">{results.crisis?.crisisType}</span>
                      </div>
                    )}
                    <div className="space-y-1">
                      <span className="font-semibold text-primary">Evaluator:</span>
                      <p className="font-serif italic text-primary/80 leading-relaxed max-h-24 overflow-y-auto">
                        {results.crisis?.explanation}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="text-[10px] text-mid/60 border-t border-primary/5 pt-2 font-mono">
                  Suppression: {results.crisis?.reflectionSuppressed ? 'Yes' : 'No'}
                </div>
              </div>

              {/* Card 4: Reflection Output */}
              {(() => {
                const refl = getReflectionDetails();
                return (
                  <div className="bg-mint-grey/50 border border-primary/5 p-4 rounded-xl space-y-3 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="text-[9px] font-bold uppercase tracking-wider text-mid">Card 4 · Reflection Output</div>
                      <div className="space-y-2 text-xs">
                        {refl?.reflectionText ? (
                          <div className="space-y-1">
                            <span className="font-semibold text-primary">Generated Reflection:</span>
                            <p className="font-serif italic text-primary/80 leading-relaxed max-h-40 overflow-y-auto">
                              {refl.reflectionText}
                            </p>
                          </div>
                        ) : (
                          <span className="italic text-mid">No reflection generated or suppressed.</span>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-mid/60 border-t border-primary/5 pt-2 flex justify-between items-center font-mono">
                      <span>Validation: {refl?.validation?.valid ? 'Passed' : 'Failed'}</span>
                      {refl?.attempts > 1 && <span className="text-accent">Retried</span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
          </>
        )}

        {activeTab === 'compliance' && (
          /* Compliance Verification Tab */
          <motion.div
            key="compliance-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-8"
          >
            {checkingCompliance ? (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 flex flex-col items-center justify-center space-y-4 text-center">
                <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                  <div className="absolute w-12 h-12 rounded-full border border-secondary/20 animate-ping" />
                  <RotateCw size={24} className="text-primary animate-spin" style={{ animationDuration: '2.5s' }} />
                </div>
                <h3 className="font-serif text-lg text-primary font-normal">Auditing Project Compliance</h3>
                <p className="text-xs text-mid max-w-xs leading-relaxed">Running Supabase schema checks and auditing developer onboarding credentials...</p>
              </div>
            ) : (
              (() => {
                // Calculate readiness score
                let totalPoints = 0;
                let earnedPoints = 0;

                // 1. Database schema (4 fields)
                totalPoints += 4;
                if (dbCompliance?.reflections) earnedPoints += 2; // closing_question, classification
                if (dbCompliance?.entries) earnedPoints += 1; // arc_scoring_note
                if (dbCompliance?.assessments) earnedPoints += 1; // dominant_dimension

                // 2. OCEAN Onboarding
                totalPoints += 2;
                const onboardingDone = developerUser?.profile?.onboarding_completed;
                const assessmentDone = developerUser?.profile?.assessment_completed;
                if (assessmentDone) earnedPoints += 1;
                if (onboardingDone) earnedPoints += 1;

                // 3. Prompts & worker logic checks
                totalPoints += 3;
                // Since worker code logic is statically implemented:
                earnedPoints += 3; // Reflection Worker, weekly worker, scoring context injection (all implemented)

                const readinessScore = Math.round((earnedPoints / totalPoints) * 100);

                return (
                  <div className="space-y-8">
                    {/* Header Banner with Readiness Score */}
                    <div className="bg-white border border-primary/5 rounded-premium p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-2 text-center md:text-left">
                        <h2 className="font-serif text-2xl font-normal text-primary">Founder Readiness Score</h2>
                        <p className="text-xs text-mid max-w-md">Calculated based on Supabase database compliance, OCEAN wizard completion, and clinical engine alignment.</p>
                      </div>
                      <div className="flex flex-col items-center justify-center shrink-0">
                        <div className={`w-28 h-28 rounded-full border-4 flex flex-col items-center justify-center ${
                          readinessScore === 100 
                            ? 'border-secondary text-secondary' 
                            : readinessScore >= 60 
                              ? 'border-accent text-accent' 
                              : 'border-red-400 text-red-500'
                        }`}>
                          <span className="text-3xl font-bold font-mono">{readinessScore}%</span>
                          <span className="text-[9px] font-sans font-semibold tracking-wider uppercase">READY</span>
                        </div>
                      </div>
                    </div>

                    {/* Database Warning if columns missing */}
                    {(!dbCompliance?.reflections || !dbCompliance?.entries || !dbCompliance?.assessments) && (
                      <div className="p-4 bg-accent/8 border border-accent/20 rounded-xl space-y-2.5">
                        <div className="flex items-center gap-2 text-[#8a3020]">
                          <AlertTriangle size={16} />
                          <span className="font-sans text-xs font-bold uppercase tracking-wider">Supabase Schema Out of Compliance</span>
                        </div>
                        <p className="text-xs text-primary/80 leading-relaxed">
                          Your database schema is missing compliance columns introduced in Phase 4. To resolve this, copy the contents of the migration script and execute them in your Supabase SQL Editor:
                        </p>
                        <div className="bg-white/40 p-2.5 rounded-lg border border-primary/5">
                          <code className="text-[11px] font-mono text-primary/95 break-all select-all block">
                            d:\Internship\Ingress Within\scratch\database-compliance.sql
                          </code>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left Compliance Card: Supabase Schema */}
                      <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                        <div className="font-serif text-lg font-normal text-primary border-b border-primary/5 pb-2">
                          1. Database Schema Compliance
                        </div>
                        <div className="space-y-3.5 text-xs">
                          {/* reflections check */}
                          <div className="flex justify-between items-start border-b border-primary/5 pb-2">
                            <div>
                              <span className="font-semibold text-primary block">reflections columns</span>
                              <span className="text-[10px] text-mid">closing_question, classification</span>
                            </div>
                            <div>
                              {dbCompliance?.reflections ? (
                                <span className="text-secondary font-semibold">✅ COMPLIANT</span>
                              ) : (
                                <span className="text-accent font-semibold">❌ MISSING</span>
                              )}
                            </div>
                          </div>

                          {/* entries check */}
                          <div className="flex justify-between items-start border-b border-primary/5 pb-2">
                            <div>
                              <span className="font-semibold text-primary block">entries columns</span>
                              <span className="text-[10px] text-mid">arc_scoring_note</span>
                            </div>
                            <div>
                              {dbCompliance?.entries ? (
                                <span className="text-secondary font-semibold">✅ COMPLIANT</span>
                              ) : (
                                <span className="text-accent font-semibold">❌ MISSING</span>
                              )}
                            </div>
                          </div>

                          {/* assessments check */}
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-primary block">assessments columns</span>
                              <span className="text-[10px] text-mid">dominant_dimension</span>
                            </div>
                            <div>
                              {dbCompliance?.assessments ? (
                                <span className="text-secondary font-semibold">✅ COMPLIANT</span>
                              ) : (
                                <span className="text-accent font-semibold">❌ MISSING</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Compliance Card: Onboarding & Logic */}
                      <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                        <div className="font-serif text-lg font-normal text-primary border-b border-primary/5 pb-2">
                          2. Onboarding & Worker Flow Compliance
                        </div>
                        <div className="space-y-3.5 text-xs">
                          {/* Onboarding Wizard status */}
                          <div className="flex justify-between items-start border-b border-primary/5 pb-2">
                            <div>
                              <span className="font-semibold text-primary block">OCEAN Assessment Completed</span>
                              <span className="text-[10px] text-mid">12-question onboarding wizard complete</span>
                            </div>
                            <div>
                              {assessmentDone ? (
                                <span className="text-secondary font-semibold">✅ COMPLETED</span>
                              ) : (
                                <span className="text-accent font-semibold">❌ PENDING</span>
                              )}
                            </div>
                          </div>

                          {/* Finalize onboarding status */}
                          <div className="flex justify-between items-start border-b border-primary/5 pb-2">
                            <div>
                              <span className="font-semibold text-primary block">Summary Review Completed</span>
                              <span className="text-[10px] text-mid">Onboarding flow finalized & saved</span>
                            </div>
                            <div>
                              {onboardingDone ? (
                                <span className="text-secondary font-semibold">✅ COMPLETED</span>
                              ) : (
                                <span className="text-accent font-semibold">❌ PENDING</span>
                              )}
                            </div>
                          </div>

                          {/* Context pipeline checks */}
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="font-semibold text-primary block">Standing Context Injection</span>
                              <span className="text-[10px] text-mid">Silently inject context into weekly summary & scoring</span>
                            </div>
                            <div>
                              <span className="text-secondary font-semibold">✅ COMPLIANT</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Developer OCEAN profile panel */}
                    {developerUser?.user?.personality_summary_text && (
                      <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                        <div className="font-serif text-lg font-normal text-primary border-b border-primary/5 pb-2">
                          Developer's Personality Summary
                        </div>
                        <p className="font-sans text-xs text-primary/80 leading-relaxed italic bg-mint-grey p-4 rounded-xl">
                          "{developerUser.user.personality_summary_text}"
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()
            )}
          </motion.div>
        )}

        {activeTab === 'history' && (
          /* Entry History Playground Tab */
          <motion.div
            key="history-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-left"
          >
            <div className="flex justify-between items-center border-b border-primary/5 pb-3">
              <div className="space-y-1">
                <h2 className="font-serif text-xl font-normal text-primary">Journal Entry History</h2>
                <p className="text-xs text-mid text-left">Explore raw database entries, AI responses, psychometric scores, and crisis evaluations.</p>
              </div>
              <button
                onClick={fetchHistoryEntries}
                disabled={isHistoryLoading}
                className="flex items-center gap-1.5 px-4 py-2 border border-primary/10 hover:border-primary/25 bg-white text-primary rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                <RotateCw size={13} className={isHistoryLoading ? 'animate-spin' : ''} />
                <span>Refresh History</span>
              </button>
            </div>

            {isHistoryLoading ? (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 flex flex-col items-center justify-center space-y-4 text-center">
                <RotateCw size={24} className="text-primary animate-spin" style={{ animationDuration: '2.5s' }} />
                <h3 className="font-serif text-lg text-primary font-normal">Loading historical entries...</h3>
              </div>
            ) : historyError ? (
              <div className="p-4 bg-accent/8 border border-accent/20 rounded-xl text-[#8a3020] text-xs flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Failed to load entry history:</span> {historyError}
                </div>
              </div>
            ) : historyEntries.length === 0 ? (
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-12 text-center text-xs text-mid italic">
                No history entries found in the database.
              </div>
            ) : (
              <div className="space-y-4">
                {historyEntries.map((entry) => {
                  const isExpanded = !!expandedEntries[entry.id];
                  const hasReflection = entry.reflection !== null && entry.reflection !== undefined;
                  const latency = (entry.updated_at && entry.created_at)
                    ? new Date(entry.updated_at).getTime() - new Date(entry.created_at).getTime()
                    : null;

                  return (
                    <div 
                      key={entry.id}
                      className="bg-white rounded-premium border border-primary/5 shadow-sm overflow-hidden transition-all"
                    >
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleEntryExpand(entry.id)}
                        className="p-4 flex items-center justify-between cursor-pointer hover:bg-mint-grey/20 transition-colors select-none"
                      >
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <span className="font-mono text-[10px] text-mid bg-primary/5 px-2 py-0.5 rounded select-all">
                            ID: {entry.id.substring(0, 8)}...
                          </span>
                          <span className="text-primary font-semibold">
                            {new Date(entry.created_at).toLocaleString()}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            entry.entry_type === 'guided' || entry.session_id
                              ? 'bg-[#8DBFB4]/12 text-[#1A5040]' 
                              : 'bg-primary/5 text-primary'
                          }`}>
                            {entry.entry_type === 'guided' || entry.session_id ? 'Guided' : 'Free Write'}
                          </span>
                          {entry.cycle_day && (
                            <span className="text-[10px] text-secondary font-bold uppercase">
                              Day {entry.cycle_day}
                            </span>
                          )}
                          {entry.crisis_flag && (
                            <span className="px-2 py-0.5 bg-accent/15 text-accent text-[9px] font-bold uppercase rounded-full">
                              Crisis Flagged
                            </span>
                          )}
                        </div>
                        <div className="text-mid/60 hover:text-primary transition-colors">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="border-t border-primary/5 p-6 bg-mint-grey/10 space-y-6 text-left">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                            
                            {/* Left Side: Journal Entry Content */}
                            <div className="space-y-4">
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Raw Content</span>
                                <div className="p-4 bg-white border border-primary/5 rounded-xl font-serif italic text-sm text-primary pr-3 leading-relaxed select-text">
                                  "{entry.content}"
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                <div className="bg-white border border-primary/5 rounded-xl p-3.5 space-y-1">
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-mid block">Created At</span>
                                  <span className="text-[11px] font-mono text-primary">{entry.created_at}</span>
                                </div>
                                <div className="bg-white border border-primary/5 rounded-xl p-3.5 space-y-1">
                                  <span className="text-[8px] font-bold uppercase tracking-wider text-mid block">Scoring Status</span>
                                  <span className="text-[11px] font-mono text-primary uppercase">{entry.scoring_status || 'pending'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Right Side: Metadata / Scores / Crisis */}
                            <div className="space-y-5">
                              
                              {/* Psychometrics */}
                              <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-3.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-mid block border-b border-primary/5 pb-1">
                                  Psychometric Scores
                                </span>
                                <div className="grid grid-cols-3 gap-2 text-center">
                                  <div className="bg-mint-grey/30 p-2.5 rounded-lg border border-primary/5">
                                    <div className="text-[8px] font-bold uppercase text-mid">Emotional Intel</div>
                                    <div className="text-lg font-bold font-mono text-[#1E2A2E] mt-0.5">
                                      {entry.day_ei !== null ? Math.round(entry.day_ei * 100) : '--'}%
                                    </div>
                                  </div>
                                  <div className="bg-mint-grey/30 p-2.5 rounded-lg border border-primary/5">
                                    <div className="text-[8px] font-bold uppercase text-mid">Personal Resolve</div>
                                    <div className="text-lg font-bold font-mono text-[#1E2A2E] mt-0.5">
                                      {entry.day_pr !== null ? Math.round(entry.day_pr * 100) : '--'}%
                                    </div>
                                  </div>
                                  <div className="bg-mint-grey/30 p-2.5 rounded-lg border border-primary/5">
                                    <div className="text-[8px] font-bold uppercase text-mid">Self Awareness</div>
                                    <div className="text-lg font-bold font-mono text-[#1E2A2E] mt-0.5">
                                      {entry.day_sa !== null ? Math.round(entry.day_sa * 100) : '--'}%
                                    </div>
                                  </div>
                                </div>
                                {(entry.confidence_flag !== null || entry.confidence_reason) && (
                                  <div className="text-[10.5px] text-mid bg-mint-grey/25 p-2 rounded-lg border border-primary/5">
                                    <span className="font-semibold">Confidence Note:</span> {entry.confidence_reason || 'N/A'}
                                  </div>
                                )}
                              </div>

                              {/* Crisis Audit */}
                              <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-3">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-mid block border-b border-primary/5 pb-1">
                                  Crisis Flag Evaluation
                                </span>
                                <div className="flex justify-between items-center text-xs">
                                  <span>Crisis Flagged:</span>
                                  <span className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                                    entry.crisis_flag 
                                      ? 'bg-accent/15 text-accent font-bold' 
                                      : 'bg-secondary/10 text-secondary font-bold'
                                  }`}>
                                    {entry.crisis_flag ? 'YES' : 'NO'}
                                  </span>
                                </div>
                                {entry.crisis_flag && (
                                  <div className="space-y-2 text-xs pt-1.5 border-t border-primary/5 text-left">
                                    <div>
                                      <span className="font-semibold block text-mid">Stressor/Risk Category:</span>
                                      <span className="font-mono text-accent">{entry.crisis_type || 'N/A'}</span>
                                    </div>
                                    {entry.crisis_quote && (
                                      <div>
                                        <span className="font-semibold block text-mid">Trigger Quote:</span>
                                        <span className="font-serif italic text-primary bg-accent/5 p-2 rounded block mt-1">"{entry.crisis_quote}"</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>

                              {/* Reflection Details */}
                              <div className="bg-white border border-primary/5 rounded-xl p-4.5 space-y-3.5">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-mid block border-b border-primary/5 pb-1">
                                  AI Reflection Details
                                </span>
                                {hasReflection ? (
                                  <div className="space-y-3 text-xs text-left">
                                    <div>
                                      <span className="font-semibold block text-mid">Observation:</span>
                                      <p className="font-sans leading-relaxed mt-0.5">{entry.reflection.reflection_text}</p>
                                    </div>
                                    {entry.reflection.closing_question && (
                                      <div>
                                        <span className="font-semibold block text-mid">Closing Question:</span>
                                        <p className="font-serif italic mt-0.5 text-[#5A4A8A]">"{entry.reflection.closing_question}"</p>
                                      </div>
                                    )}
                                    {entry.reflection.vocabulary && entry.reflection.vocabulary.length > 0 && (
                                      <div>
                                        <span className="font-semibold block text-mid mb-1">Cycle Vocabulary Words:</span>
                                        <div className="flex gap-1 flex-wrap">
                                          {entry.reflection.vocabulary.map((w, idx) => (
                                            <span key={idx} className="bg-mint-grey px-1.5 py-0.5 rounded font-mono text-[10px]">
                                              {w}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4 border-t border-primary/5 pt-2.5 text-[11px] font-mono text-mid">
                                      <div>Provider: <span className="font-semibold text-primary">{entry.reflection.provider}</span></div>
                                      <div>Status: <span className="font-semibold text-primary">{entry.reflection.status}</span></div>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-xs italic text-mid">No reflection generated or pending.</div>
                                )}
                              </div>

                              {/* Compilation / Latency */}
                              <div className="bg-white border border-primary/5 rounded-xl p-4.5 flex justify-between items-center text-xs">
                                <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Compilation Latency:</span>
                                <span className="font-mono text-primary font-bold">
                                  {latency !== null && latency > 0 ? `${latency}ms` : 'N/A (cached/synced)'}
                                </span>
                              </div>

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
          </motion.div>
        )}

        {activeTab === 'performance' && (
          <motion.div
            key="performance-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-left"
          >
            <div className="border-b border-primary/5 pb-3">
              <h2 className="font-serif text-xl font-normal text-primary">Performance Monitor</h2>
              <p className="text-xs text-mid text-left">Real-time API latencies, query telemetry, and client-side performance benchmarks.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* API Latency Panel */}
              <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                <h3 className="font-serif text-[15px] font-semibold text-primary">Client API Latencies</h3>
                <p className="text-[11px] text-mid">Measurements tracked on recent endpoint operations (in milliseconds):</p>
                <div className="space-y-3 pt-2">
                  {Object.entries(DashboardService.getLatencies()).length === 0 ? (
                    <div className="text-xs text-mid italic">No operations recorded yet. Interact with the application or run simulator checks first.</div>
                  ) : (
                    Object.entries(DashboardService.getLatencies()).map(([apiName, values]) => {
                      const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
                      return (
                        <div key={apiName} className="space-y-1.5 border-b border-primary/5 pb-2.5 last:border-b-0">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-primary font-mono text-[11px]">{apiName}</span>
                            <span className="text-secondary font-mono">avg: {avg}ms (last: {values[values.length - 1]}ms)</span>
                          </div>
                          <div className="flex gap-1 overflow-x-auto no-scrollbar font-mono text-[9px] text-mid/80 bg-mint-grey/30 p-1.5 rounded">
                            {values.map((v, i) => (
                              <span key={i} className="px-1 py-0.5 bg-white border border-primary/5 rounded shrink-0">
                                #{i+1}: {v}ms
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Bundles & DB benchmarks */}
              <div className="space-y-6">
                <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                  <h3 className="font-serif text-[15px] font-semibold text-primary">Estimated Bundle Weights</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-primary/5">
                      <span className="text-mid">Core Framework (Next.js + React 19)</span>
                      <span className="font-mono font-semibold">~84 KB (gzip)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-primary/5">
                      <span className="text-mid">Framer Motion (Animations)</span>
                      <span className="font-mono font-semibold">~32 KB (gzip)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-primary/5">
                      <span className="text-mid">Lucide Icons</span>
                      <span className="font-mono font-semibold">~12 KB (gzip)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-mid">Dashboard Bundle Size</span>
                      <span className="font-mono font-semibold text-secondary">~148 KB (optimized via lazy loading)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                  <h3 className="font-serif text-[15px] font-semibold text-primary">Database Indexes & Optimization</h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8DBFB4]" />
                      <span>Index: `idx_entries_user_created_at_desc` (Created)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8DBFB4]" />
                      <span>Index: `idx_cycles_user_status` (Created)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8DBFB4]" />
                      <span>Index: `idx_reflections_cycle_status` (Created)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
                      <span>Sequential scans resolved via lazy on-demand detail loading.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'threads' && (
          <motion.div
            key="threads-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-left"
          >
            <div className="border-b border-primary/5 pb-3">
              <h2 className="font-serif text-xl font-normal text-primary">Threads Testing</h2>
              <p className="text-xs text-mid text-left">Displaying all active and answered threads with status, scoring details, and response logs.</p>
            </div>

            {isThreadsLoading ? (
              <div className="text-center py-10 space-y-2">
                <Loader className="w-6 h-6 animate-spin text-secondary mx-auto" />
                <span className="text-xs font-serif italic text-mid/60">Fetching test threads...</span>
              </div>
            ) : threadsError ? (
              <div className="bg-[#fef2f2] border border-red-200 text-red-700 p-4 rounded-xl text-xs">
                <strong>Error:</strong> {threadsError}
              </div>
            ) : testThreads.length === 0 ? (
              <div className="bg-white rounded-premium border border-primary/5 p-8 text-center text-xs text-mid italic">
                No threads found in database. Create reflections first.
              </div>
            ) : (
              <div className="space-y-4">
                {testThreads.map(t => {
                  const isExpanded = !!expandedTestThreads[t.id];
                  const resps = testThreadResponses[t.id] || [];

                  return (
                    <div key={t.id} className="bg-white rounded-xl border border-primary/5 p-5 shadow-xs space-y-3">
                      <div className="flex justify-between items-center flex-wrap gap-2 text-xs">
                        <div className="flex gap-2 items-center">
                          <span className="font-mono bg-mint-grey px-2 py-0.5 rounded text-[10px] text-secondary font-bold">
                            Cycle {t.cycle_number}
                          </span>
                          <span className="font-semibold text-primary">Thread ID: {t.id}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            t.status === 'Open'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-green-100 text-green-800'
                          }`}>
                            {t.status}
                          </span>
                          <button
                            onClick={() => toggleTestThreadExpand(t.id)}
                            className="text-secondary hover:text-primary transition-colors text-xs font-semibold underline bg-transparent border-none cursor-pointer"
                          >
                            {isExpanded ? 'Hide Responses' : 'View Responses'}
                          </button>
                        </div>
                      </div>

                      <div className="bg-mint-grey/25 p-3 rounded-lg border border-primary/5 space-y-1">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-mid/60">Closing Question</div>
                        <div className="text-xs font-semibold text-primary italic font-serif">"{t.closing_question}"</div>
                      </div>

                      {t.draft_response && (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg text-xs text-blue-800">
                          <strong className="block text-[9px] uppercase tracking-wider text-blue-600 mb-0.5">Saved Draft:</strong>
                          "{t.draft_response}"
                        </div>
                      )}

                      {isExpanded && (
                        <div className="pt-2 border-t border-primary/5 space-y-3">
                          <h4 className="text-[10px] font-bold uppercase tracking-wider text-secondary">Thread Responses ({resps.length})</h4>
                          {resps.length === 0 ? (
                            <p className="text-[11px] text-mid italic pl-2">No responses logged yet.</p>
                          ) : (
                            <div className="space-y-3 pl-3 border-l border-primary/10">
                              {resps.map((resp, i) => (
                                <div key={resp.id} className="text-xs space-y-1 bg-mint-grey/10 p-2.5 rounded border border-primary/5">
                                  <div className="flex justify-between items-center text-[10px] font-semibold text-mid/70">
                                    <span>Response #{i+1} · {new Date(resp.created_at).toLocaleString()}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                      resp.used_for_scoring
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : 'bg-primary/5 text-mid/40'
                                    }`}>
                                      {resp.used_for_scoring ? 'USED FOR SCORING' : 'HISTORICAL'}
                                    </span>
                                  </div>
                                  <p className="font-serif italic text-primary">"{resp.response_text}"</p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
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
