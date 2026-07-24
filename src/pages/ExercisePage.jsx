import React, { useEffect, useState, useRef } from 'react';
import { QueryClient, QueryClientProvider, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useExerciseStore } from '../hooks/useExerciseStore';
import DashboardNavbar from '../components/DashboardNavbar';
import ExerciseHeader from '../components/exercise/ExerciseHeader';
import ExerciseProgress from '../components/exercise/ExerciseProgress';
import ExerciseIntro from '../components/exercise/ExerciseIntro';
import ExerciseQuestion from '../components/exercise/ExerciseQuestion';
import ExerciseNavigation from '../components/exercise/ExerciseNavigation';
import ExerciseCompletion from '../components/exercise/ExerciseCompletion';
import ExerciseAnalysis from '../components/exercise/ExerciseAnalysis';
import ExerciseLocked from '../components/exercise/ExerciseLocked';
import ExerciseError from '../components/exercise/ExerciseError';
import ExerciseLoading from '../components/exercise/ExerciseLoading';
import ExerciseLayout from '../components/exercise/ExerciseLayout';
import { QuestionsCatalog } from '../lib/exercises/questionsCatalog';

import { Sparkles, Clock, CheckCircle, Lock, ArrowRight, FileText, ChevronRight } from 'lucide-react';

const queryClient = new QueryClient({
  defaultQueries: {
    retry: 1,
    refetchOnWindowFocus: false
  }
});

export const dynamic = 'force-dynamic';

function ExerciseContent({ user, profile, onSignOut }) {
  const queryClient = useQueryClient();
  const [exerciseIdFromUrl, setExerciseIdFromUrl] = useState('');

  useEffect(() => {
    const handlePath = () => {
      if (typeof window !== 'undefined') {
        const pathParts = window.location.pathname.split('/');
        const isExerciseRoute = pathParts[1] === 'exercise' || pathParts[1] === 'exercises' || pathParts[1] === 'assessment';
        const idFromPath = isExerciseRoute && pathParts[2] ? pathParts[2].replace(/\/$/, '') : '';
        setExerciseIdFromUrl(idFromPath);
      }
    };
    handlePath();
    window.addEventListener('popstate', handlePath);
    return () => window.removeEventListener('popstate', handlePath);
  }, []);

  const {
    currentInstance,
    currentStepIndex,
    responses,
    init,
    setStepIndex,
    setResponse,
    setAutosaveStatus,
    clearStore,
    stimulusList
  } = useExerciseStore();

  const [direction, setDirection] = useState(1);
  const debounceTimers = useRef({});

  // 1. Query current active exercise
  const { data: currentRes, isLoading: currentLoading, error: currentErr } = useQuery({
    queryKey: ['currentExercise'],
    queryFn: () => fetch('/api/exercises/current').then(r => r.json())
  });

  // 2. Query exercise status mapping
  const { data: statusRes, isLoading: statusLoading } = useQuery({
    queryKey: ['exerciseStatus'],
    queryFn: () => fetch('/api/exercises/status').then(r => r.json())
  });

  // 3. Query exercise history
  const { data: historyRes, isLoading: historyLoading } = useQuery({
    queryKey: ['exerciseHistory'],
    queryFn: () => fetch('/api/exercises/history').then(r => r.json())
  });

  const activeInstance = currentRes?.exercise;

  const matchedStatus = statusRes?.statuses?.find(s => s.definition.id === exerciseIdFromUrl);
  const targetInstance = matchedStatus?.instance || (activeInstance?.exercise_id === exerciseIdFromUrl ? activeInstance : null);

  // 3. Mutation to Start Exercise
  const startMutation = useMutation({
    mutationFn: (payload) => {
      const bodyPayload = typeof payload === 'object' ? payload : { instanceId: payload, exerciseId: exerciseIdFromUrl };
      return fetch('/api/exercises/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      }).then(r => r.json());
    },
    onSuccess: (data) => {
      if (data.success) {
        queryClient.invalidateQueries({ queryKey: ['currentExercise'] });
        queryClient.invalidateQueries({ queryKey: ['exerciseStatus'] });
        setStepIndex(1);
      }
    }
  });

  // 4. Mutation to Submit Exercise
  const submitMutation = useMutation({
    mutationFn: (payload) => {
      const bodyPayload = typeof payload === 'object' ? payload : { instanceId: payload, exerciseId: exerciseIdFromUrl };
      return fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      }).then(r => r.json());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentExercise'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseStatus'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseHistory'] });
      queryClient.invalidateQueries({ queryKey: ['exerciseResult'] });
      setStepIndex(0); // Reset step index so finished analysis screen renders cleanly
    }
  });

  // 5. Query for completed AI Analysis Results
  const { data: resultRes, isLoading: resultLoading } = useQuery({
    queryKey: ['exerciseResult', targetInstance?.id || exerciseIdFromUrl],
    queryFn: () => fetch(`/api/exercises/result/${targetInstance?.id || exerciseIdFromUrl}`).then(r => r.json()),
    enabled: !!(exerciseIdFromUrl && (matchedStatus?.status === 'finished' || targetInstance?.status === 'finished'))
  });

  // Initialize Zustand store on load/resume
  useEffect(() => {
    const resumeSession = async () => {
      if (exerciseIdFromUrl) {
        try {
          const res = await fetch('/api/exercises/resume', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              instanceId: targetInstance?.id,
              exerciseId: exerciseIdFromUrl
            })
          });
          if (res.ok) {
            const data = await res.json();
            const formatted = {};
            (data.responses || []).forEach(r => {
              formatted[r.question_id] = r.response;
            });
            const savedStep = data.screenState?.currentStepIndex || 1;
            init(data.instance || targetInstance, formatted, savedStep, data.stimulusList);
            return;
          }
        } catch (err) {
          console.error('[ExercisePage] Failed to resume draft answers:', err);
        }
        if (targetInstance) {
          init(targetInstance, {}, 0);
        }
      }
    };

    if (exerciseIdFromUrl) {
      resumeSession();
    }

    return () => {
      clearStore();
    };
  }, [exerciseIdFromUrl, targetInstance?.id, init, clearStore]);

  if (currentLoading || statusLoading || (activeInstance?.status === 'finished' && resultLoading)) {
    return (
      <div className="min-h-screen bg-mint-grey flex flex-col font-sans">
        <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} activeLink="exercises" />
        <div className="flex-1 flex items-center justify-center p-6">
          <ExerciseLoading />
        </div>
      </div>
    );
  }

  if (currentErr) {
    return (
      <div className="min-h-screen bg-mint-grey flex flex-col font-sans">
        <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} activeLink="exercises" />
        <div className="flex-1 flex items-center justify-center p-6">
          <ExerciseError message="Failed to load cycle exercises." />
        </div>
      </div>
    );
  }

  // If URL has no specific exercise ID (e.g. /exercise or /assessment), show Exercises Overview Hub
  if (!exerciseIdFromUrl) {
    return (
      <ExercisesHub
        user={user}
        profile={profile}
        onSignOut={onSignOut}
        statuses={statusRes?.statuses}
        history={historyRes?.history}
        isLoading={statusLoading || historyLoading}
      />
    );
  }

  // Check locks
  if (!matchedStatus || matchedStatus.status === 'locked') {
    const rules = matchedStatus?.definition?.unlock_rules || {};
    return (
      <div className="min-h-screen bg-mint-grey flex flex-col font-sans">
        <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} activeLink="exercises" />
        <div className="flex-1 flex items-center justify-center p-6">
          <ExerciseLocked
            strategy={rules.strategy}
            day={rules.day}
            currentDay={statusRes?.current_day || 1}
            onClose={() => window.navigateTo('/dashboard')}
          />
        </div>
      </div>
    );
  }

  const def = matchedStatus.definition;
  const instance = matchedStatus.instance;
  const questions = exerciseIdFromUrl === 'exercise_1'
    ? (stimulusList || ['Trust', 'Control', 'Boundary', 'Anger', 'Fear', 'Peace', 'Clarity', 'Attachment', 'Validation', 'Truth']).map((word, idx) => ({
        id: `q_${idx + 1}`,
        type: 'free_text',
        label: word,
        placeholder: 'Type the first thing that comes to mind',
        singleLine: true
      }))
    : exerciseIdFromUrl === 'exercise_2'
    ? Array.from({ length: 15 }, (_, idx) => {
        const cardIndex = Math.floor(idx / 3);
        const stepNum = (idx % 3) + 1;
        const cardId = cardIndex + 1;
        const images = stimulusList || ['/assets/blot_1.png', '/assets/blot_2.png', '/assets/blot_3.png', '/assets/blot_4.png', '/assets/blot_5.png'];
        const imageUrl = images[cardIndex];
        const stepQuestions = [
          'Write what you see.',
          'Which part of the image stood out most?',
          'What feeling, if any, did this bring up?'
        ];
        const placeholders = [
          'Describe what you see.',
          'The part that caught your eye first.',
          'A feeling, or nothing at all.'
        ];
        return {
          id: `card_${cardId}_step_${stepNum}`,
          type: 'inkblot_step',
          cardId,
          stepNum,
          cardIndex,
          imageUrl,
          label: `Image ${cardId} of 5 · Step ${stepNum} of 3`,
          questionText: stepQuestions[stepNum - 1],
          placeholder: placeholders[stepNum - 1],
          allResponses: responses
        };
      })
    : QuestionsCatalog.getQuestions(exerciseIdFromUrl);

  // Autosave responses with debounce
  const handleAnswerChange = (questionId, value) => {
    // 1. Update Zustand store immediately for snappy UI
    setResponse(questionId, value);
    setAutosaveStatus('saving');

    // 2. Clear previous debounce timer
    if (debounceTimers.current[questionId]) {
      clearTimeout(debounceTimers.current[questionId]);
    }

    // 3. Debounce save progress to server
    debounceTimers.current[questionId] = setTimeout(async () => {
      try {
        const res = await fetch('/api/exercises/save-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instanceId: instance?.id,
            exerciseId: exerciseIdFromUrl,
            questionId,
            stepId: `step_${currentStepIndex}`,
            response: value
          })
        });

        if (res.ok) {
          setAutosaveStatus('saved');
        } else {
          setAutosaveStatus('error');
        }
      } catch (err) {
        setAutosaveStatus('error');
      }
    }, 1000);
  };

  // Saves current screen index to __screen_state
  const saveScreenIndex = async (newIndex) => {
    try {
      await fetch('/api/exercises/save-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instanceId: instance?.id,
          exerciseId: exerciseIdFromUrl,
          questionId: '__screen_state',
          stepId: '__screen_state',
          response: { currentStepIndex: newIndex }
        })
      });
    } catch (e) {
      console.warn('Failed to save screen state index:', e.message);
    }
  };

  const handleNextStep = async () => {
    if (currentStepIndex === questions.length) {
      // Final Submit
      submitMutation.mutate({ instanceId: instance?.id, exerciseId: exerciseIdFromUrl });
    } else {
      setDirection(1);
      const nextIdx = currentStepIndex + 1;
      setStepIndex(nextIdx);
      await saveScreenIndex(nextIdx);
    }
  };

  const handleBackStep = async () => {
    if (currentStepIndex > 0) {
      setDirection(-1);
      const prevIdx = currentStepIndex - 1;
      setStepIndex(prevIdx);
      await saveScreenIndex(prevIdx);
    }
  };

  const handleStart = () => {
    startMutation.mutate({ instanceId: instance?.id, exerciseId: exerciseIdFromUrl });
  };

  const renderActiveScreen = () => {
    const currentStatus = matchedStatus?.status || targetInstance?.status || instance?.status;

    // Finished/Analysis mode
    if (currentStatus === 'finished' || instance?.status === 'finished' || targetInstance?.status === 'finished' || resultRes?.result) {
      return (
        <ExerciseAnalysis
          exerciseId={exerciseIdFromUrl}
          result={resultRes?.result}
          onClose={() => window.navigateTo('/exercise')}
        />
      );
    }

    // Polling mode during AI evaluation
    if (currentStatus === 'completed' || currentStatus === 'queued' || currentStatus === 'analysing') {
      return (
        <ExerciseCompletion
          instanceId={targetInstance?.id || instance?.id}
          onComplete={() => {
            setStepIndex(0);
            queryClient.invalidateQueries({ queryKey: ['currentExercise'] });
            queryClient.invalidateQueries({ queryKey: ['exerciseStatus'] });
            queryClient.invalidateQueries({ queryKey: ['exerciseHistory'] });
            queryClient.invalidateQueries({ queryKey: ['exerciseResult'] });
          }}
        />
      );
    }

    // Intro Screen
    if (currentStepIndex === 0) {
      return (
        <ExerciseIntro
          title={def.title}
          description={def.description}
          duration={def.estimated_duration}
          stepsCount={questions.length}
          onStart={handleStart}
          isSubmitting={startMutation.isPending}
        />
      );
    }

    // Question steps
    const currentQuestion = questions[currentStepIndex - 1];
    if (currentQuestion && currentQuestion.type === 'inkblot_step') {
      currentQuestion.allResponses = responses;
    }
    const currentValue = responses[currentQuestion?.id];
    const canProceed = currentValue !== undefined && currentValue !== '';

    return (
      <div className="space-y-6">
        <ExerciseProgress current={currentStepIndex} total={questions.length} />
        <ExerciseQuestion
          question={currentQuestion}
          value={currentValue}
          onChange={(val) => handleAnswerChange(currentQuestion.id, val)}
          disabled={submitMutation.isPending}
        />
        <ExerciseNavigation
          onBack={handleBackStep}
          onNext={handleNextStep}
          isFirst={currentStepIndex === 1}
          isLast={currentStepIndex === questions.length}
          canProceed={canProceed}
          isSubmitting={submitMutation.isPending}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-mint-grey flex flex-col font-sans">
      <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} activeLink="exercises" />
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        {instance?.status === 'finished' || instance?.status === 'completed' || instance?.status === 'queued' || instance?.status === 'analysing' || currentStepIndex > questions.length ? (
          <div className="w-full bg-white rounded-premium p-6 md:p-8 shadow-[0_12px_48px_rgba(30,42,46,0.04)] border border-primary/5 min-h-[480px]">
            {renderActiveScreen()}
          </div>
        ) : (
          <ExerciseLayout stepKey={currentStepIndex} direction={direction}>
            <div>
              <ExerciseHeader title={def.title} onClose={() => window.navigateTo('/exercise')} />
              <div className="py-2">
                {renderActiveScreen()}
              </div>
            </div>
          </ExerciseLayout>
        )}
      </div>
    </div>
  );
}

export default function ExercisePage(props) {
  return (
    <QueryClientProvider client={queryClient}>
      <ExerciseContent {...props} />
    </QueryClientProvider>
  );
}

const EXERCISE_META = {
  exercise_0: {
    title: 'Exercise 0 — OCEAN Baseline Personality Assessment',
    description: 'Establishes your baseline Big Five personality profile across 16 reflective psychometric dimensions.',
    duration: '10 mins',
    tag: 'Baseline Personality'
  },
  exercise_1: {
    title: 'Exercise 1 — Word Association Assessment',
    description: 'Measures emotional language defaults and spontaneous subconscious theme associations.',
    duration: '5 mins',
    tag: 'Linguistic Default'
  },
  exercise_2: {
    title: 'Exercise 2 — Inkblot Projective Assessment',
    description: 'Procedural projective assessment exploring symbolic interpretations and perceptual pattern defaults.',
    duration: '8 mins',
    tag: 'Projective Pattern'
  }
};

function ExercisesHub({ user, profile, onSignOut, statuses, history, isLoading }) {
  const [filter, setFilter] = useState('all');
  const [selectedCycleId, setSelectedCycleId] = useState('all');
  const [activeAnalysisResult, setActiveAnalysisResult] = useState(null);

  // Fetch cycles for cycle-wise filtering
  const { data: cyclesRes } = useQuery({
    queryKey: ['userCyclesList'],
    queryFn: async () => {
      const res = await fetch('/api/cycles');
      if (!res.ok) return { cycles: [] };
      return res.json();
    }
  });

  const cycles = cyclesRes?.cycles || [];

  // Filter lists by status and selected cycle
  const filterByCycle = (itemCycleId) => {
    if (selectedCycleId === 'all') return true;
    return itemCycleId === selectedCycleId;
  };

  const pendingList = (statuses || []).filter(
    s => s.instance && ['started', 'draft', 'queued', 'analysing'].includes(s.instance.status) && filterByCycle(s.instance.cycle_id)
  );

  const availableList = (statuses || []).filter(
    s => (s.status === 'available' || (s.instance && s.instance.status === 'available')) && filterByCycle(s.instance?.cycle_id)
  );

  const completedList = (history || [])
    .filter(h => filterByCycle(h.cycle_id))
    .map(h => ({
      id: h.id,
      exercise_id: h.exercise_id,
      title: EXERCISE_META[h.exercise_id]?.title || h.definition?.title || h.exercise_id,
      completed_at: h.completion_time || h.updated_at,
      instance: h,
      results: h.results?.[0] || null
    }));

  const lockedList = (statuses || []).filter(
    s => s.status === 'locked' && !s.instance
  );

  return (
    <div className="min-h-screen bg-mint-grey flex flex-col font-sans">
      <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} activeLink="exercises" />
      
      <main className="flex-1 max-w-[1000px] w-full mx-auto px-4 md:px-6 py-8 space-y-8 text-left">
        {/* Modal for Viewing Past Completed Exercise AI Analysis */}
        {activeAnalysisResult && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-premium p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
              <button
                onClick={() => setActiveAnalysisResult(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-primary/5 text-primary/40 hover:text-primary transition-all cursor-pointer"
              >
                <X size={20} />
              </button>
              <ExerciseAnalysis
                exerciseId={activeAnalysisResult.exerciseId}
                result={activeAnalysisResult.result}
                onClose={() => setActiveAnalysisResult(null)}
              />
            </div>
          </div>
        )}

        {/* Header & Cycle Filter Controls */}
        <div className="space-y-4 border-b border-[#1E2A2E]/10 pb-6">
          <div className="flex items-center gap-2 font-label-md text-xs font-semibold uppercase tracking-wider text-accent">
            <Sparkles size={14} />
            <span>Assessments & Projective Framework</span>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl md:text-3xl font-normal text-primary">
                Cycle Assessments & Exercises
              </h1>
              <p className="text-sm text-primary/70 max-w-2xl leading-relaxed mt-1">
                Reflective exercises designed to map your baseline personality, emotional language, and projective patterns across your cycle.
              </p>
            </div>

            {/* Cycle Selector Dropdown/Tabs */}
            {cycles.length > 0 && (
              <div className="flex items-center gap-2 bg-white/80 border border-primary/10 rounded-xl p-1.5 self-start md:self-auto shadow-xs">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-primary/50 px-2">Cycle:</span>
                <select
                  value={selectedCycleId}
                  onChange={(e) => setSelectedCycleId(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-primary focus:outline-none cursor-pointer pr-2"
                >
                  <option value="all">All Cycles</option>
                  {cycles.map((c, idx) => (
                    <option key={c.id} value={c.id}>
                      Cycle {cycles.length - idx} {c.status === 'ACTIVE' ? '(Current Active)' : '(Completed)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-2 pt-2">
            {[
              { id: 'all', label: 'All Assessments' },
              { id: 'pending', label: `Pending / Incomplete (${pendingList.length})` },
              { id: 'available', label: `Available (${availableList.length})` },
              { id: 'completed', label: `Completed (${completedList.length})` },
              { id: 'locked', label: `Locked (${lockedList.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all cursor-pointer border ${
                  filter === tab.id
                    ? 'bg-primary text-mint-grey border-primary shadow-xs'
                    : 'bg-white/60 text-primary/70 border-primary/10 hover:bg-white hover:border-primary/20'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="py-12 flex justify-center">
            <ExerciseLoading />
          </div>
        ) : (
          <div className="space-y-8">
            {/* 1. Pending / Incomplete Section */}
            {(filter === 'all' || filter === 'pending') && pendingList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#b45309]">
                  <Clock size={14} />
                  <span>Pending & In-Progress ({pendingList.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pendingList.map(item => {
                    const meta = EXERCISE_META[item.definition.id] || {};
                    return (
                      <div
                        key={item.definition.id}
                        className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-4 text-left shadow-xs transition-all hover:border-amber-500/40"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-900">
                              {item.instance.status === 'started' ? 'In Progress' : item.instance.status}
                            </span>
                            <h3 className="font-serif text-lg text-primary font-semibold">
                              {meta.title || item.definition.title || item.definition.id}
                            </h3>
                          </div>
                          <span className="text-xs text-primary/50 font-mono">
                            {meta.duration || (item.definition.estimated_duration ? `${item.definition.estimated_duration} mins` : '')}
                          </span>
                        </div>

                        <p className="text-xs text-primary/70 leading-relaxed">
                          {meta.description || item.definition.description || 'Resume your saved progress anytime from where you left off.'}
                        </p>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[11px] text-amber-900/80 font-medium">
                            Draft saved · Ready to resume
                          </span>
                          <button
                            onClick={() => window.navigateTo(`/exercise/${item.definition.id}`)}
                            className="py-2 px-4 rounded-xl bg-primary text-mint-grey font-sans text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 hover:bg-[#2A3A3E] transition-all cursor-pointer shadow-xs"
                          >
                            <span>Resume</span>
                            <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Available Section */}
            {(filter === 'all' || filter === 'available') && availableList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#1A5040]">
                  <Sparkles size={14} />
                  <span>Available Assessments ({availableList.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {availableList.map(item => {
                    const meta = EXERCISE_META[item.definition.id] || {};
                    return (
                      <div
                        key={item.definition.id}
                        className="p-5 rounded-2xl bg-white border border-[#1E2A2E]/10 space-y-4 text-left shadow-xs hover:border-secondary transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-[#8DBFB4]/20 text-[#1A5040]">
                              Available
                            </span>
                            <h3 className="font-serif text-lg text-primary font-semibold">
                              {meta.title || item.definition.title || item.definition.id}
                            </h3>
                          </div>
                          <span className="text-xs text-primary/50 font-mono">
                            {meta.duration || (item.definition.estimated_duration ? `${item.definition.estimated_duration} mins` : '')}
                          </span>
                        </div>

                        <p className="text-xs text-primary/70 leading-relaxed">
                          {meta.description || item.definition.description || 'Unlocked and available for your current cycle.'}
                        </p>

                        <button
                          onClick={() => window.navigateTo(`/exercise/${item.definition.id}`)}
                          className="w-full py-2.5 px-4 rounded-xl bg-primary text-mint-grey font-sans text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-[#2A3A3E] transition-all cursor-pointer shadow-xs"
                        >
                          <span>Begin Assessment</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 3. Completed Section with AI Results Inspection */}
            {(filter === 'all' || filter === 'completed') && completedList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary/60">
                  <CheckCircle size={14} className="text-[#8DBFB4]" />
                  <span>Completed Assessments ({completedList.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {completedList.map(item => {
                    const resData = item.results;
                    return (
                      <div
                        key={item.id}
                        className="p-5 rounded-2xl bg-surface-container-low/60 border border-primary/10 space-y-4 text-left shadow-xs hover:border-primary/20 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary/80">
                              Completed
                            </span>
                            <h3 className="font-serif text-lg text-primary font-semibold">
                              {item.title}
                            </h3>
                          </div>
                          <span className="text-[10px] text-primary/50 font-mono bg-white px-2 py-1 rounded border border-primary/5">
                            {item.completed_at ? new Date(item.completed_at).toLocaleDateString('en-GB') : ''}
                          </span>
                        </div>

                        {resData?.summary && (
                          <p className="text-xs text-primary/80 leading-relaxed bg-white/70 p-3 rounded-xl border border-primary/5 italic">
                            "{resData.summary}"
                          </p>
                        )}

                        <button
                          onClick={() => {
                            if (resData) {
                              setActiveAnalysisResult({ result: resData, exerciseId: item.exercise_id });
                            } else {
                              window.navigateTo(`/exercise/${item.exercise_id}`);
                            }
                          }}
                          className="w-full py-2.5 px-4 rounded-xl border border-primary/20 bg-white text-primary font-sans text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 hover:bg-primary hover:text-mint-grey transition-all cursor-pointer shadow-xs"
                        >
                          <span>View Full AI Analysis & Results</span>
                          <ArrowRight size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 4. Locked Section */}
            {(filter === 'all' || filter === 'locked') && lockedList.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary/40">
                  <Lock size={14} />
                  <span>Locked Assessments ({lockedList.length})</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lockedList.map(item => {
                    const meta = EXERCISE_META[item.definition.id] || {};
                    const unlockDay = item.unlock_day || item.definition.unlock_rules?.day || 1;
                    return (
                      <div
                        key={item.definition.id}
                        className="p-5 rounded-2xl bg-primary/5 border border-primary/5 space-y-3 text-left opacity-75"
                      >
                        <div className="flex justify-between items-start">
                          <h3 className="font-serif text-base text-primary/70 font-semibold">
                            {meta.title || item.definition.title || item.definition.id}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-primary/10 text-primary/60">
                            Unlocks Day {unlockDay}
                          </span>
                        </div>
                        <p className="text-xs text-primary/50 leading-relaxed">
                          {meta.description || 'Reflective assessment unlocked automatically at cycle milestones.'}
                        </p>
                        <div className="text-[10px] font-semibold text-[#5A4A8A] uppercase tracking-wider">
                          Available on Cycle Day {unlockDay}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
