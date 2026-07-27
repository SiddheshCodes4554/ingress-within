import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Lock,
  Play,
  CheckCircle2,
  Clock,
  RotateCw,
  Layers,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import Exercise0Flow from '../components/exercise/v4/Exercise0Flow';
import Exercise0ResultView from '../components/exercise/v4/Exercise0ResultView';
import Exercise1Flow from '../components/exercise/v4/Exercise1Flow';
import Exercise1ResultView from '../components/exercise/v4/Exercise1ResultView';
import Exercise2Flow from '../components/exercise/v4/Exercise2Flow';
import Exercise2ResultView from '../components/exercise/v4/Exercise2ResultView';

export default function ExercisePage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState([]);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeExerciseInstanceId, setActiveExerciseInstanceId] = useState(null);
  const [activeResultInstanceId, setActiveResultInstanceId] = useState(null);
  const [activeResponses, setActiveResponses] = useState([]);

  useEffect(() => {
    fetchExerciseInstances();
  }, []);

  const fetchExerciseInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exercises');
      if (!res.ok) throw new Error('Failed to fetch exercise instances');
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (err) {
      console.error('[ExercisePage] Fetch error:', err);
      setError(err.message || 'Unable to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleStartExercise = async (exerciseId) => {
    try {
      const res = await fetch('/api/exercises/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exercise_id: exerciseId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || 'Failed to start exercise');

      if (data.instance) {
        setActiveExerciseInstanceId(data.instance.id);
        if (data.responses) setActiveResponses(data.responses);
        await fetchExerciseInstances();
      }
    } catch (err) {
      console.error('[ExercisePage] Start error:', err);
      alert(`Could not start exercise: ${err.message}`);
    }
  };

  const handleResumeExercise = async (instanceId) => {
    try {
      const res = await fetch(`/api/exercises/current?instance_id=${instanceId}`);
      const data = await res.json();
      setActiveExerciseInstanceId(instanceId);
      setActiveResponses(data.responses || []);
    } catch (err) {
      console.error('[ExercisePage] Resume error:', err);
      setActiveExerciseInstanceId(instanceId);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-16">
      <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} />

      {/* Render Active Exercise Flow Modal if Active */}
      {activeExerciseInstanceId && (() => {
        const inst = instances.find(i => i.id === activeExerciseInstanceId);
        const exId = inst?.exercise_id;
        
        if (exId === 'exercise_2' || exId === 'inkblot_projective') {
          return (
            <Exercise2Flow
              instance={inst || { id: activeExerciseInstanceId, exercise_id: 'exercise_2' }}
              initialResponses={activeResponses}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_1') {
          return (
            <Exercise1Flow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }
        return (
          <Exercise0Flow
            instanceId={activeExerciseInstanceId}
            onClose={() => setActiveExerciseInstanceId(null)}
            onComplete={() => {
              setActiveExerciseInstanceId(null);
              fetchExerciseInstances();
            }}
          />
        );
      })()}

      {/* Render Exercise Result View Modal if Active */}
      {activeResultInstanceId && (() => {
        const inst = instances.find(i => i.id === activeResultInstanceId);
        const exId = inst?.exercise_id;

        if (exId === 'exercise_2' || exId === 'inkblot_projective') {
          return (
            <Exercise2ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_1') {
          return (
            <Exercise1ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }
        return (
          <Exercise0ResultView
            instanceId={activeResultInstanceId}
            onClose={() => setActiveResultInstanceId(null)}
          />
        );
      })()}

      <main className="max-w-[1140px] mx-auto px-6 pt-8 space-y-8">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#1E2A2E]/10 pb-6">
          <div>
            <button
              onClick={() => window.navigateTo('/dashboard')}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-mid hover:text-primary transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Dashboard
            </button>
            <h1 className="font-serif text-2xl md:text-3xl text-primary font-normal">
              Exercise Hub
            </h1>
            <p className="text-sm text-mid mt-1">
              Complete baseline assessments and unlock targeted psychological reframing tools.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchExerciseInstances}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-line bg-white hover:bg-[#FAF9F6] transition-colors cursor-pointer"
            >
              <RotateCw className="w-3.5 h-3.5" />
              Refresh Status
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center">
            <RotateCw className="w-6 h-6 animate-spin mx-auto text-primary opacity-60 mb-2" />
            <p className="text-xs text-mid">Loading exercise catalog...</p>
          </div>
        ) : error ? (
          <div className="p-6 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {instances.map((inst) => {
              const isLocked = inst.status === 'locked';
              const isCompleted = inst.status === 'completed';
              const isInProgress = ['started', 'in_progress', 'analysing'].includes(inst.status);

              return (
                <div
                  key={inst.id}
                  className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isInProgress
                      ? 'border-[#8DBFB4] shadow-sm'
                      : isLocked
                      ? 'border-line opacity-60'
                      : 'border-line hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-mid">
                        {inst.exercise_id === 'exercise_0'
                          ? 'Exercise 0'
                          : inst.exercise_id === 'exercise_1'
                          ? 'Exercise 1'
                          : 'Exercise 2'}
                      </span>
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      ) : isInProgress ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#8DBFB4]/20 text-[#4A6A64] text-[11px] font-medium animate-pulse">
                          <Clock className="w-3 h-3" />
                          In Progress
                        </span>
                      ) : isLocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium">
                          <Lock className="w-3 h-3" />
                          Locked
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[11px] font-medium">
                          Available
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif text-lg text-primary mb-2">
                      {inst.exercise_id === 'exercise_0'
                        ? 'Baseline OCEAN Assessment'
                        : inst.exercise_id === 'exercise_1'
                        ? 'Word Association Test'
                        : 'Inkblot Projective Test'}
                    </h3>
                    <p className="text-xs text-mid leading-relaxed mb-6">
                      {inst.exercise_id === 'exercise_0'
                        ? '12-question Big Five personality baseline measuring Neuroticism, Extraversion, Openness, Agreeableness, and Conscientiousness.'
                        : inst.exercise_id === 'exercise_1'
                        ? '12-word speed association revealing implicit emotional registers and suppression dynamics.'
                        : '5-image inkblot projective test measuring primary defense mechanisms and emotional resonance.'}
                    </p>
                  </div>

                  <div>
                    {isCompleted ? (
                      <button
                        onClick={() => setActiveResultInstanceId(inst.id)}
                        className="w-full py-2.5 rounded-xl border border-primary/20 hover:bg-primary/5 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        View Stored Analysis
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleResumeExercise(inst.id)}
                        className="w-full py-2.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        Resume Exercise
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    ) : isLocked ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        Unlocks Day {inst.exercise_id === 'exercise_0' ? 1 : inst.exercise_id === 'exercise_1' ? 9 : 16}
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExercise(inst.exercise_id)}
                        className="w-full py-2.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        Start Exercise
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
