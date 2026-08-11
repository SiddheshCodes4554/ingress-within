import React, { useState, useEffect } from 'react';
import { ModuleCatalogService } from '../lib/modules/moduleCatalogService';
import { ModuleContentService } from '../lib/modules/moduleContentService';
import ModulePlayerPage from './ModulePlayerPage';

export default function PsychoeducationLabPage() {
  const [authorized, setAuthorized] = useState(true);
  const [selectedUser, setSelectedUser] = useState('test_user_01');
  const [catalogItems, setCatalogItems] = useState([]);
  const [taxonomyConcerns, setTaxonomyConcerns] = useState([]);

  // Pattern Simulator State
  const [pattern1, setPattern1] = useState({ taxonomyId: 'M1-C01', title: 'Self-Worth Deficit', description: 'Low self-worth & harsh self-talk', score: 85, rank: 1 });
  const [pattern2, setPattern2] = useState({ taxonomyId: 'M1-C02', title: 'Self-Criticism', description: 'Harsh internal critic', score: 78, rank: 2 });
  const [pattern3, setPattern3] = useState({ taxonomyId: 'M2-C02', title: 'Task Avoidance', description: 'Procrastination under friction', score: 65, rank: 3 });

  // Recommendation & Pipeline State
  const [recResult, setRecResult] = useState(null);
  const [pipelineData, setPipelineData] = useState(null);
  const [loadingRec, setLoadingRec] = useState(false);

  // Active Module Player Test State
  const [activeTestModule, setActiveTestModule] = useState(null);
  const [testPlayerOpen, setTestPlayerOpen] = useState(false);

  // Health Checks & End-to-End Test Results
  const [healthResults, setHealthResults] = useState(null);
  const [e2eReport, setE2eReport] = useState(null);
  const [secReport, setSecReport] = useState(null);
  const [recHistory, setRecHistory] = useState([]);
  const [testLogMessage, setTestLogMessage] = useState('');

  // Load catalog items dynamically on mount
  useEffect(() => {
    const items = ModuleCatalogService.getAllCatalogItems();
    setCatalogItems(items);

    const concerns = [];
    items.forEach(item => {
      item.taxonomy_concerns.forEach(c => {
        concerns.push({
          code: c,
          name: `${c} — ${item.name}`,
          moduleId: item.id
        });
      });
    });
    setTaxonomyConcerns(concerns);
  }, []);

  // Preset Handlers
  const applyPreset = (presetName) => {
    setRecResult(null);
    setPipelineData(null);

    if (presetName === 'self-worth') {
      setPattern1({ taxonomyId: 'M1-C01', title: 'Self-Worth Deficit', description: 'Low self-worth', score: 90, rank: 1 });
      setPattern2({ taxonomyId: 'M1-C02', title: 'Self-Criticism', description: 'Harsh internal critic', score: 82, rank: 2 });
      setPattern3({ taxonomyId: 'M1-C03', title: 'Social Comparison', description: 'Approval seeking', score: 75, rank: 3 });
    } else if (presetName === 'perfectionism') {
      setPattern1({ taxonomyId: 'M2-C01', title: 'Perfectionist Stance', description: 'Rigid high standards', score: 92, rank: 1 });
      setPattern2({ taxonomyId: 'M2-C02', title: 'Procrastination', description: 'Task avoidance', score: 85, rank: 2 });
      setPattern3({ taxonomyId: 'M1-C03', title: 'Social Comparison', description: 'Approval seeking', score: 60, rank: 3 });
    } else if (presetName === 'anxiety') {
      setPattern1({ taxonomyId: 'M3-C01', title: 'Chronic Worry', description: 'Persistent overthinking', score: 94, rank: 1 });
      setPattern2({ taxonomyId: 'M3-C02', title: 'Generalised Anxiety', description: 'What-if spiraling', score: 88, rank: 2 });
      setPattern3({ taxonomyId: 'M3-C04', title: 'Intrusive Thoughts', description: 'Checking urges', score: 70, rank: 3 });
    } else if (presetName === 'mixed') {
      setPattern1({ taxonomyId: 'M1-C01', title: 'Self-Worth Deficit', description: 'Low self-worth', score: 90, rank: 1 });
      setPattern2({ taxonomyId: 'M2-C01', title: 'Perfectionism', description: 'Rigid standards', score: 85, rank: 2 });
      setPattern3({ taxonomyId: 'M3-C01', title: 'Chronic Worry', description: 'Overthinking', score: 80, rank: 3 });
    } else if (presetName === 'no-match') {
      setPattern1({ taxonomyId: 'UNMAPPED_XYZ_01', title: 'Unmapped Pattern', description: 'No taxonomy match', score: 40, rank: 1 });
      setPattern2({ taxonomyId: 'UNMAPPED_XYZ_02', title: 'Unmapped Pattern', description: 'No taxonomy match', score: 30, rank: 2 });
      setPattern3({ taxonomyId: 'UNMAPPED_XYZ_03', title: 'Unmapped Pattern', description: 'No taxonomy match', score: 20, rank: 3 });
    } else if (presetName === 'crisis') {
      setPattern1({ taxonomyId: 'CRISIS_01', title: 'Severe Crisis Signal', description: 'Suicidal ideation trigger', score: 99, rank: 1, isCrisis: true });
      setPattern2({ taxonomyId: 'M1-C01', title: 'Self-Worth Deficit', description: 'Low self-worth', score: 85, rank: 2 });
      setPattern3({ taxonomyId: 'M2-C01', title: 'Perfectionism', description: 'Rigid standards', score: 70, rank: 3 });
    }
  };

  // Run Recommendation Test
  const handleRunRecommendation = async () => {
    setLoadingRec(true);
    setTestLogMessage('');
    try {
      const topPatterns = [
        { ...pattern1, rank: 1 },
        { ...pattern2, rank: 2 },
        { ...pattern3, rank: 3 }
      ];

      const res = await fetch('/api/admin/psychoeducation-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run_recommendation',
          testUserId: selectedUser,
          testCycleId: `cycle_dev_lab_${Date.now()}`,
          topPatterns
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setRecResult(data.response);
        setPipelineData(data.pipeline);
        setRecHistory(prev => [{
          timestamp: new Date().toLocaleTimeString(),
          top3: topPatterns.map(p => p.taxonomyId).join(', '),
          selectedModule: data.response?.recommendation?.module?.id || 'NONE',
          status: data.response?.status
        }, ...prev]);
      } else {
        setTestLogMessage(`Error running recommendation: ${data?.error?.message || 'Server error'}`);
      }
    } catch (err) {
      setTestLogMessage(`Exception running recommendation: ${err.message}`);
    } finally {
      setLoadingRec(false);
    }
  };

  // Run Health Check
  const handleRunHealthCheck = async () => {
    setTestLogMessage('Running module health check...');
    try {
      const res = await fetch('/api/admin/psychoeducation-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'health_check' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setHealthResults(data.modulesHealth);
        setTestLogMessage('Module health check completed.');
      } else {
        setTestLogMessage(`Health check failed: ${data?.error?.message}`);
      }
    } catch (err) {
      setTestLogMessage(`Health check exception: ${err.message}`);
    }
  };

  // Run End-to-End Test
  const handleRunE2eTest = async () => {
    setTestLogMessage('Running full end-to-end integration pass...');
    try {
      const res = await fetch('/api/admin/psychoeducation-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'end_to_end_test' })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setE2eReport(data);
        setTestLogMessage(`E2E Test Pass Completed: ${data.overallStatus}`);
      } else {
        setTestLogMessage(`E2E test failed: ${data?.error?.message}`);
      }
    } catch (err) {
      setTestLogMessage(`E2E test exception: ${err.message}`);
    }
  };

  // Test Control Actions (Reset, Touch Complete, Purchase Simulation)
  const handleTestControl = async (subAction, extra = {}) => {
    const moduleId = activeTestModule || 'M1';
    setTestLogMessage(`Executing test control: ${subAction}...`);
    try {
      const res = await fetch('/api/admin/psychoeducation-lab', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_control',
          subAction,
          userId: selectedUser,
          moduleId,
          ...extra
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestLogMessage(data.message);
      } else {
        setTestLogMessage(`Control action failed: ${data?.error?.message}`);
      }
    } catch (err) {
      setTestLogMessage(`Control action exception: ${err.message}`);
    }
  };

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#111625] text-stone-100 flex items-center justify-center p-6">
        <div className="max-w-md bg-[#1B2340] border border-red-500/30 p-8 rounded-2xl text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 bg-red-500/20 text-red-400 rounded-full flex items-center justify-center mx-auto text-xl font-bold">
            403
          </div>
          <h1 className="font-serif text-2xl font-semibold text-red-200">Forbidden — Developer Lab Protected</h1>
          <p className="text-xs text-stone-400 leading-relaxed">
            This internal QA tool is restricted to authorized developers and administrators only.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#111625] text-stone-100 font-sans p-6 space-y-8">
      {/* Top Banner Header */}
      <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] uppercase font-mono font-bold tracking-widest px-2.5 py-0.5 rounded-full animate-pulse">
              DEVELOPMENT / TEST MODE ONLY
            </span>
            <span className="text-xs text-stone-400 font-mono">INTERNAL QA TOOL</span>
          </div>
          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#F5EFE3]">
            Psychoeducation Developer Lab
          </h1>
          <p className="text-xs text-[#C9C2AE] max-w-2xl">
            Internal QA environment for testing recommendation pipeline, module access, progress persistence, MHPI assessments, and touch completion in isolation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleRunHealthCheck}
            className="px-4 py-2 bg-[#2A3358] hover:bg-[#3D4770] text-[#F2C776] border border-[#F5EFE3]/20 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer"
          >
            Run Health Check
          </button>
          <button
            onClick={handleRunE2eTest}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-stone-950 rounded-xl text-xs font-semibold font-mono transition-all cursor-pointer shadow-lg"
          >
            Run Full E2E Pass
          </button>
        </div>
      </div>

      {testLogMessage && (
        <div className="bg-[#1B2340] border border-amber-500/30 text-amber-200 text-xs font-mono p-3.5 rounded-xl flex items-center justify-between">
          <span>LOG: {testLogMessage}</span>
          <button onClick={() => setTestLogMessage('')} className="text-stone-400 hover:text-white cursor-pointer">✕</button>
        </div>
      )}

      {/* Main Grid: Left Config Panel, Right Pipeline & Player */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column (Config & Presets) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Section 1: Test User */}
          <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-3">
            <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider">
              Section 1 — Test User Context
            </h2>
            <div className="space-y-2">
              <label className="text-xs text-stone-400">Select Test User:</label>
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="w-full bg-[#111625] border border-[#F5EFE3]/20 rounded-xl p-2.5 text-xs text-stone-200 font-mono focus:outline-none focus:border-amber-500"
              >
                <option value="test_user_01">Authorized Test User 01 (test_user_01)</option>
                <option value="test_user_02">Authorized Test User 02 (test_user_02)</option>
                <option value="dev_admin_001">Current Dev Admin (dev_admin_001)</option>
              </select>
            </div>
          </div>

          {/* Section 3: Quick Test Presets */}
          <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-3">
            <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider">
              Section 3 — Quick Test Presets (10 Cases)
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button onClick={() => applyPreset('self-worth')} className="p-2.5 bg-[#2A3358] hover:bg-[#3D4770] text-[#F5EFE3] rounded-lg text-left font-mono border border-[#F5EFE3]/10">
                1. Self-Worth (M1)
              </button>
              <button onClick={() => applyPreset('perfectionism')} className="p-2.5 bg-[#2A3358] hover:bg-[#3D4770] text-[#F5EFE3] rounded-lg text-left font-mono border border-[#F5EFE3]/10">
                2. Perfectionism (M2)
              </button>
              <button onClick={() => applyPreset('anxiety')} className="p-2.5 bg-[#2A3358] hover:bg-[#3D4770] text-[#F5EFE3] rounded-lg text-left font-mono border border-[#F5EFE3]/10">
                3. Anxiety (M3)
              </button>
              <button onClick={() => applyPreset('mixed')} className="p-2.5 bg-[#2A3358] hover:bg-[#3D4770] text-[#F5EFE3] rounded-lg text-left font-mono border border-[#F5EFE3]/10">
                4. Mixed (M1+M2+M3)
              </button>
              <button onClick={() => applyPreset('no-match')} className="p-2.5 bg-[#2A3358] hover:bg-[#3D4770] text-[#F5EFE3] rounded-lg text-left font-mono border border-[#F5EFE3]/10">
                6. No Match
              </button>
              <button onClick={() => applyPreset('crisis')} className="p-2.5 bg-red-950/60 hover:bg-red-900/60 text-red-200 rounded-lg text-left font-mono border border-red-500/30">
                7. Crisis Signal
              </button>
            </div>
          </div>

          {/* Section 2: Pattern Simulator */}
          <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider">
              Section 2 — Simulated Monthly Top 3 Patterns
            </h2>

            {/* Pattern 1 */}
            <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-amber-400 font-semibold">
                <span>Rank 1 (Top Pattern)</span>
                <span>Score: {pattern1.score}</span>
              </div>
              <select
                value={pattern1.taxonomyId}
                onChange={(e) => setPattern1({ ...pattern1, taxonomyId: e.target.value })}
                className="w-full bg-[#1B2340] text-xs p-2 rounded border border-[#F5EFE3]/15 font-mono text-stone-200"
              >
                {taxonomyConcerns.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
                <option value="UNMAPPED_XYZ_01">UNMAPPED_XYZ_01 — Unmapped Concern</option>
              </select>
            </div>

            {/* Pattern 2 */}
            <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-amber-400 font-semibold">
                <span>Rank 2</span>
                <span>Score: {pattern2.score}</span>
              </div>
              <select
                value={pattern2.taxonomyId}
                onChange={(e) => setPattern2({ ...pattern2, taxonomyId: e.target.value })}
                className="w-full bg-[#1B2340] text-xs p-2 rounded border border-[#F5EFE3]/15 font-mono text-stone-200"
              >
                {taxonomyConcerns.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
                <option value="UNMAPPED_XYZ_02">UNMAPPED_XYZ_02 — Unmapped Concern</option>
              </select>
            </div>

            {/* Pattern 3 */}
            <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10 space-y-2">
              <div className="flex justify-between items-center text-xs font-mono text-amber-400 font-semibold">
                <span>Rank 3</span>
                <span>Score: {pattern3.score}</span>
              </div>
              <select
                value={pattern3.taxonomyId}
                onChange={(e) => setPattern3({ ...pattern3, taxonomyId: e.target.value })}
                className="w-full bg-[#1B2340] text-xs p-2 rounded border border-[#F5EFE3]/15 font-mono text-stone-200"
              >
                {taxonomyConcerns.map(c => (
                  <option key={c.code} value={c.code}>{c.name}</option>
                ))}
                <option value="UNMAPPED_XYZ_03">UNMAPPED_XYZ_03 — Unmapped Concern</option>
              </select>
            </div>

            {/* Run Recommendation Button */}
            <button
              onClick={handleRunRecommendation}
              disabled={loadingRec}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-xl text-xs font-mono tracking-wider uppercase transition-all shadow-lg cursor-pointer disabled:opacity-50"
            >
              {loadingRec ? 'Running Recommendation Engine...' : 'Run Recommendation Test'}
            </button>
          </div>

          {/* Section 13: Test Data Controls */}
          <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-3">
            <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider">
              Section 13 — Test Data Controls (Test Mode Only)
            </h2>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono">
              <button onClick={() => handleTestControl('reset_progress')} className="p-2 bg-red-950/60 hover:bg-red-900/60 text-red-200 border border-red-500/30 rounded-lg">
                Reset Test Progress
              </button>
              <button onClick={() => handleTestControl('simulate_purchase')} className="p-2 bg-[#2A3358] hover:bg-[#3D4770] text-emerald-300 border border-emerald-500/30 rounded-lg">
                Simulate Purchase
              </button>
              <button onClick={() => handleTestControl('complete_touch', { touchId: 'w1t1' })} className="p-2 bg-[#2A3358] hover:bg-[#3D4770] text-amber-300 border border-amber-500/30 rounded-lg">
                Complete Touch W1T1
              </button>
              <button onClick={() => handleTestControl('complete_module')} className="p-2 bg-[#2A3358] hover:bg-[#3D4770] text-[#F2C776] border border-[#F5EFE3]/20 rounded-lg">
                Complete Module
              </button>
            </div>
          </div>
        </div>

        {/* Right Column (Pipeline, Diagnostics & Player Launcher) */}
        <div className="lg:col-span-7 space-y-6">

          {/* Section 5: Pipeline Visualization */}
          {pipelineData && (
            <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-4 shadow-xl">
              <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider flex items-center justify-between">
                <span>Section 5 — Pipeline Visualization</span>
                <span className="text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  {pipelineData.status}
                </span>
              </h2>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10">
                  <div className="text-stone-400 text-[10px] uppercase">Simulated</div>
                  <div className="text-amber-400 font-bold text-base mt-1">{pipelineData.simulatedPatternsCount}</div>
                </div>
                <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10">
                  <div className="text-stone-400 text-[10px] uppercase">Safety</div>
                  <div className={`font-bold text-base mt-1 ${pipelineData.safetyPassed ? 'text-emerald-400' : 'text-red-400'}`}>
                    {pipelineData.safetyPassed ? 'PASS' : 'CRISIS'}
                  </div>
                </div>
                <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10">
                  <div className="text-stone-400 text-[10px] uppercase">Eligible</div>
                  <div className="text-[#F2C776] font-bold text-base mt-1">
                    {pipelineData.eligibleModules.filter(m => m.eligible).length}
                  </div>
                </div>
                <div className="p-3 bg-[#111625] rounded-xl border border-[#F5EFE3]/10">
                  <div className="text-stone-400 text-[10px] uppercase">Selected</div>
                  <div className="text-emerald-400 font-bold text-base mt-1">
                    {pipelineData.selectedModule?.id || 'NONE'}
                  </div>
                </div>
              </div>

              {/* Section 8: Selected Module Card */}
              {pipelineData.selectedModule && (
                <div className="bg-[#2A3358] border border-amber-500/40 rounded-xl p-4 space-y-2">
                  <div className="text-[10px] uppercase tracking-wider text-amber-300 font-mono">
                    RECOMMENDED MODULE SELECTED
                  </div>
                  <div className="flex justify-between items-center">
                    <h3 className="font-serif text-lg font-semibold text-[#F5EFE3]">
                      {pipelineData.selectedModule.name} ({pipelineData.selectedModule.id})
                    </h3>
                    <span className="text-xs font-mono text-emerald-300">
                      ₹{pipelineData.selectedModule.price} INR
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-stone-300 pt-1">
                    <button
                      onClick={() => {
                        setActiveTestModule(pipelineData.selectedModule.id);
                        setTestPlayerOpen(true);
                      }}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold rounded-lg text-xs font-mono cursor-pointer"
                    >
                      Open Recommended Module in Test Mode ➔
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 9 & 22: Module Test Launcher & All Modules Matrix */}
          <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-4">
            <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider flex items-center justify-between">
              <span>Section 9 & 22 — Active Module Catalog Matrix</span>
              <span className="text-xs font-mono text-stone-400">{catalogItems.length} Modules Active</span>
            </h2>

            <div className="grid gap-3">
              {catalogItems.map(mod => (
                <div key={mod.id} className="bg-[#111625] border border-[#F5EFE3]/10 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-amber-400 font-bold">{mod.id}</span>
                      <span className="font-serif text-base text-[#F5EFE3] font-semibold">{mod.name}</span>
                      <span className="text-[10px] font-mono bg-[#2A3358] text-stone-300 px-2 py-0.5 rounded">
                        {mod.duration_weeks} Weeks
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 line-clamp-1">{mod.description}</p>
                  </div>

                  <button
                    onClick={() => {
                      setActiveTestModule(mod.id);
                      setTestPlayerOpen(true);
                    }}
                    className="px-3.5 py-2 bg-[#2A3358] hover:bg-[#3D4770] text-[#F2C776] border border-[#F5EFE3]/20 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer shrink-0"
                  >
                    Launch in Test Mode
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Health Check Audit Results Table */}
          {healthResults && (
            <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-4">
              <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider">
                Section 10 & 11 — Module Health & Content Integrity Check
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono border-collapse">
                  <thead>
                    <tr className="border-b border-[#F5EFE3]/15 text-stone-400">
                      <th className="py-2 px-3">Module</th>
                      <th className="py-2 px-3">Catalog</th>
                      <th className="py-2 px-3">Content</th>
                      <th className="py-2 px-3">Weeks</th>
                      <th className="py-2 px-3">Touches</th>
                      <th className="py-2 px-3">MHPI</th>
                      <th className="py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F5EFE3]/10 text-stone-200">
                    {healthResults.map(h => (
                      <tr key={h.moduleId}>
                        <td className="py-2.5 px-3 font-bold text-amber-300">{h.moduleId}</td>
                        <td className="py-2.5 px-3">{h.checks.catalogExists ? '✓' : '✗'}</td>
                        <td className="py-2.5 px-3">{h.checks.contentExists ? '✓' : '✗'}</td>
                        <td className="py-2.5 px-3">{h.checks.weeksExist ? '✓' : '✗'}</td>
                        <td className="py-2.5 px-3">{h.totalTouches}</td>
                        <td className="py-2.5 px-3">{h.checks.mhpiConfigExists ? '✓' : '✗'}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded ${h.status === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                            {h.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Section 20 & 21: Full End-to-End Report */}
          {e2eReport && (
            <div className="bg-[#1B2340] border border-[#F5EFE3]/15 rounded-2xl p-5 space-y-4">
              <h2 className="font-serif text-sm font-semibold text-[#F2C776] uppercase tracking-wider flex items-center justify-between">
                <span>Section 20 & 21 — Full End-to-End Integration Report</span>
                <span className={`px-2.5 py-0.5 rounded font-mono text-xs font-bold ${e2eReport.overallStatus === 'PASS' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>
                  OVERALL: {e2eReport.overallStatus}
                </span>
              </h2>
              <div className="grid gap-2 text-xs font-mono">
                {e2eReport.stages.map((s, idx) => (
                  <div key={idx} className="p-2.5 bg-[#111625] rounded-lg flex items-center justify-between border border-[#F5EFE3]/10">
                    <span>{s.stage}</span>
                    <span className={s.status === 'PASS' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                      {s.status} ({s.details})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Embedded Real Module Player Modal (Test Mode) */}
      {testPlayerOpen && activeTestModule && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1B2340] border border-amber-500/40 w-full max-w-4xl rounded-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#F5EFE3]/15">
              <div className="flex items-center gap-3">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-mono px-2 py-0.5 rounded">
                  TEST MODE PLAYER
                </span>
                <h2 className="font-serif text-lg text-[#F5EFE3] font-semibold">
                  Testing Module: {activeTestModule}
                </h2>
              </div>
              <button
                onClick={() => setTestPlayerOpen(false)}
                className="px-3 py-1 bg-[#2A3358] text-stone-300 hover:text-white rounded-lg text-xs font-mono cursor-pointer"
              >
                Close Player ✕
              </button>
            </div>

            <ModulePlayerPage
              moduleId={activeTestModule}
              testMode={true}
              onClose={() => setTestPlayerOpen(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
