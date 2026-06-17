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
  Sparkle
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';

const PRESETS = [
  {
    name: 'Normal Day',
    reflection: 'I realized I was avoiding talking to my boss because I feared conflict.',
    newEntry: 'Today I finally discussed the task distribution with my manager. It went surprisingly well, and we reached a compromise. I feel much lighter now.'
  },
  {
    name: 'Feeling Helpless',
    reflection: '',
    newEntry: 'I don\'t know what to do. I feel like I have no control over my career. My decisions don\'t matter and everyone else determines my success. I am completely stuck and helpless.'
  },
  {
    name: 'Rigid Thinking',
    reflection: '',
    newEntry: 'Everything is absolutely perfect or it is a total disaster. If I make a single mistake at this job, my whole life is a failure and I\'ll never get back on track. People are either with me or against me.'
  },
  {
    name: 'Acute Crisis Intent',
    reflection: '',
    newEntry: 'I can\'t go on like this. I want to end my life tonight, I just want to suicide and escape this pain.'
  },
  {
    name: 'Mixed Signals (Hard Day)',
    reflection: 'I tried to take deep breaths.',
    newEntry: 'I had a terrible argument and felt extremely overwhelmed, like my chest was exploding. But I didn\'t give up and decided to journal it.'
  }
];

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

  const loadPreset = (preset) => {
    setReflectionText(preset.reflection);
    setNewEntryText(preset.newEntry);
    setResults(null);
    setError(null);
    setCurrentEntryId(null);
    setIsPolling(false);
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

          if ((scoringDone && crisisDone && reflectionDone) || attempts >= 20) {
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
                  question: data.reflectionState.question,
                  observation: data.reflectionState.observation,
                  status: data.reflectionState.status
                } : null,
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
            <span className="text-[10px] font-bold uppercase tracking-wider text-secondary/70 block mb-1">Founder Experience Playground</span>
            <h1 className="font-serif text-3xl font-light text-primary flex items-center gap-3">
              <span>Ingress Within AI Scorer</span>
              <span className="px-2 py-0.5 bg-secondary/10 text-secondary text-[9px] uppercase font-bold tracking-wider rounded-md">Founder Review</span>
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
                <option value="groq">Groq Llama 3.3 (Active)</option>
                <option value="claude">Claude 3.5 Sonnet (Mock)</option>
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

        {/* Preset Scenarios */}
        <div className="mb-8 bg-white p-6 rounded-premium border border-primary/5 shadow-sm space-y-4">
          <div className="text-[10px] font-bold uppercase tracking-wider text-secondary flex items-center gap-1.5">
            <Sparkles size={12} className="text-[#8DBFB4]" />
            <span>Select a Preset Scenario to Load</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => loadPreset(preset)}
                className="px-4 py-2 bg-[#F4F6F5] hover:bg-secondary/15 hover:text-secondary-dark rounded-xl text-xs font-semibold transition-all cursor-pointer border border-transparent hover:border-secondary/10"
              >
                {preset.name}
              </button>
            ))}
          </div>
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-mid block">Reflection on Yesterday</label>
                  <textarea
                    value={reflectionText}
                    onChange={(e) => setReflectionText(e.target.value)}
                    placeholder="Describe how yesterday's action went..."
                    className="w-full min-h-[90px] p-4 bg-[#F4F6F5] border border-transparent focus:border-secondary/20 rounded-xl text-xs font-sans leading-relaxed text-primary outline-none resize-none transition-all placeholder-primary/30"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-mid block">Today's Writing</label>
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
                <span>Analyze Entry</span>
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
                  Fill in the input blocks or load a preset, then click Analyze Entry to review the real-time AI results.
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
                    {!results.crisis.crisisFlag && results.reflection && results.reflection.question && (
                      <div className="bg-white rounded-premium border border-primary/5 shadow-sm p-6 space-y-4">
                        <div className="flex items-center gap-2 border-b border-primary/5 pb-3">
                          <MessageSquare size={16} className="text-secondary" />
                          <h2 className="font-serif text-lg font-normal text-primary">AI Reflection Output</h2>
                        </div>
                        <div className="space-y-3">
                          <div className="text-xs text-mid uppercase font-bold tracking-widest text-[9px]">Introspective Reflection Question</div>
                          <blockquote className="border-l-4 border-secondary/20 pl-4 py-1 text-md font-serif italic text-primary leading-relaxed">
                            "{results.reflection.question}"
                          </blockquote>
                          
                          {results.reflection.observation && (
                            <div className="mt-2 text-[10px] text-mid bg-[#F4F6F5] p-3 rounded-lg border border-primary/5">
                              <strong>Theme context:</strong> {results.reflection.observation}
                            </div>
                          )}
                        </div>
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

      </main>
    </div>
  );
}
