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
  ArrowRight,
  Eye,
  FileCheck
} from 'lucide-react';
import DashboardNavbar from '../components/DashboardNavbar';
import Exercise0Flow from '../components/exercise/v4/Exercise0Flow';
import Exercise0ResultView from '../components/exercise/v4/Exercise0ResultView';
import Exercise1Flow from '../components/exercise/v4/Exercise1Flow';
import Exercise1ResultView from '../components/exercise/v4/Exercise1ResultView';
import Exercise2Flow from '../components/exercise/v4/Exercise2Flow';
import Exercise2ResultView from '../components/exercise/v4/Exercise2ResultView';
import Exercise3Flow from '../components/exercise/v4/Exercise3Flow';
import Exercise3ResultView from '../components/exercise/v4/Exercise3ResultView';
import CoreValuesFlow from '../components/exercise/v4/CoreValuesFlow';
import CoreValuesResultView from '../components/exercise/v4/CoreValuesResultView';
import RelationshipMapFlow from '../components/exercise/v4/RelationshipMapFlow';
import RelationshipMapResultView from '../components/exercise/v4/RelationshipMapResultView';
import BodySignalFlow from '../components/exercise/v4/BodySignalFlow';
import BodySignalResultView from '../components/exercise/v4/BodySignalResultView';
import AvoidanceAuditFlow from '../components/exercise/v4/AvoidanceAuditFlow';
import AvoidanceAuditResultView from '../components/exercise/v4/AvoidanceAuditResultView';

// Founder-approved exercise definitions & titles
const EXERCISE_METADATA = {
  exercise_0: {
    title: 'Baseline Assessment',
    category: 'Baseline',
    description: '12-question initial assessment used to personalize your experience.',
    unlockDay: 1,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 12`
  },
  ocean: {
    title: 'Baseline Assessment',
    category: 'Baseline',
    description: '12-question initial assessment used to personalize your experience.',
    unlockDay: 1,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 12`
  },
  exercise_1: {
    title: 'Word Association Test',
    category: 'Implicit',
    description: '12-word speed association revealing implicit emotional registers and suppression dynamics.',
    unlockDay: 9,
    getProgress: (inst) => `Word ${inst.current_step || 1} of 12`
  },
  word_association: {
    title: 'Word Association Test',
    category: 'Implicit',
    description: '12-word speed association revealing implicit emotional registers and suppression dynamics.',
    unlockDay: 9,
    getProgress: (inst) => `Word ${inst.current_step || 1} of 12`
  },
  exercise_2: {
    title: 'Inkblot Projective Test',
    category: 'Projective',
    description: '5-image inkblot projective test measuring primary defense mechanisms and emotional resonance.',
    unlockDay: 16,
    getProgress: (inst) => `Image ${inst.current_image || 1} of 5 · Step ${inst.current_step || 1} of 3`
  },
  inkblot_projective: {
    title: 'Inkblot Projective Test',
    category: 'Projective',
    description: '5-image inkblot projective test measuring primary defense mechanisms and emotional resonance.',
    unlockDay: 16,
    getProgress: (inst) => `Image ${inst.current_image || 1} of 5 · Step ${inst.current_step || 1} of 3`
  },
  exercise_3: {
    title: 'Self Perception Test',
    category: 'Identity',
    description: 'Structured self-perception mapping measuring self-ideal congruence and identity alignment.',
    unlockDay: 23,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 5`
  },
  self_perception: {
    title: 'Self Perception Test',
    category: 'Identity',
    description: 'Structured self-perception mapping measuring self-ideal congruence and identity alignment.',
    unlockDay: 23,
    getProgress: (inst) => `Question ${inst.current_step || 1} of 5`
  },
  core_values_card_sort: {
    title: 'Core Values Card Sort',
    category: 'Values',
    description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
    unlockDay: 35,
    getProgress: () => `In Progress`
  },
  core_values: {
    title: 'Core Values Card Sort',
    category: 'Values',
    description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
    unlockDay: 35,
    getProgress: () => `In Progress`
  },
  exercise_4: {
    title: 'Core Values Card Sort',
    category: 'Values',
    description: '5–7 minute forced-choice values exercise mapping your primary behavioral principles.',
    unlockDay: 35,
    getProgress: () => `In Progress`
  },
  relationship_map: {
    title: 'Relationship Map',
    category: 'Relationships',
    description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
    unlockDay: 42,
    getProgress: () => `In Progress`
  },
  exercise_5: {
    title: 'Relationship Map',
    category: 'Relationships',
    description: 'Map the people taking up mental space, energy dynamics, and communication patterns.',
    unlockDay: 42,
    getProgress: () => `In Progress`
  },
  body_signal_inventory: {
    title: 'Body Signal Inventory',
    category: 'Somatic',
    description: 'Structured somatic inventory mapping physical signals across 6 body systems.',
    unlockDay: 49,
    getProgress: () => `In Progress`
  },
  exercise_6: {
    title: 'Body Signal Inventory',
    category: 'Somatic',
    description: 'Structured somatic inventory mapping physical signals across 6 body systems.',
    unlockDay: 49,
    getProgress: () => `In Progress`
  },
  avoidance_audit: {
    title: 'Avoidance Audit',
    category: 'Cognitive',
    description: 'Six incomplete sentence stems exposing subtle avoidance behaviors, procrastination, and hidden fears.',
    unlockDay: 91,
    getProgress: () => `In Progress`
  },
  exercise_7: {
    title: 'Avoidance Audit',
    category: 'Cognitive',
    description: 'Six incomplete sentence stems exposing subtle avoidance behaviors, procrastination, and hidden fears.',
    unlockDay: 91,
    getProgress: () => `In Progress`
  }
};

export default function ExercisePage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState([]);
  const [error, setError] = useState(null);
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

  // Dynamic lifecycle-driven dashboard summary counts
  const availableCount = instances.filter(i => i.status === 'available').length;
  const inProgressCount = instances.filter(i => ['started', 'in_progress', 'analysing'].includes(i.status)).length;
  const completedCount = instances.filter(i => i.status === 'completed').length;
  const lockedCount = instances.filter(i => i.status === 'locked').length;

  return (
    <div className="min-h-screen bg-[#FAF9F6] font-sans pb-16">
      <DashboardNavbar user={user} profile={profile} onSignOut={onSignOut} />

      {/* Render Active Exercise Flow Modal if Active */}
      {activeExerciseInstanceId && (() => {
        const inst = instances.find(i => i.id === activeExerciseInstanceId);
        if (!inst) return null;

        const exId = inst.exercise_id;
        
        if (exId === 'relationship_map' || exId === 'exercise_5') {
          return (
            <RelationshipMapFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'body_signal_inventory' || exId === 'exercise_6') {
          return (
            <BodySignalFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'avoidance_audit' || exId === 'exercise_7') {
          return (
            <AvoidanceAuditFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'core_values_card_sort' || exId === 'core_values' || exId === 'exercise_4') {
          return (
            <CoreValuesFlow
              instanceId={activeExerciseInstanceId}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_3' || exId === 'self_perception') {
          return (
            <Exercise3Flow
              instance={inst}
              initialResponses={activeResponses}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_2' || exId === 'inkblot_projective') {
          return (
            <Exercise2Flow
              instance={inst}
              initialResponses={activeResponses}
              onClose={() => setActiveExerciseInstanceId(null)}
              onComplete={() => {
                setActiveExerciseInstanceId(null);
                fetchExerciseInstances();
              }}
            />
          );
        }

        if (exId === 'exercise_1' || exId === 'word_association') {
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

        if (exId === 'exercise_0' || exId === 'ocean') {
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
        }

        return null;
      })()}

      {/* Render Exercise Result View Modal if Active */}
      {activeResultInstanceId && (() => {
        const inst = instances.find(i => i.id === activeResultInstanceId);
        if (!inst) return null;

        const exId = inst.exercise_id;

        if (exId === 'relationship_map' || exId === 'exercise_5') {
          return (
            <RelationshipMapResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'body_signal_inventory' || exId === 'exercise_6') {
          return (
            <BodySignalResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'avoidance_audit' || exId === 'exercise_7') {
          return (
            <AvoidanceAuditResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'core_values_card_sort' || exId === 'core_values' || exId === 'exercise_4') {
          return (
            <CoreValuesResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_3' || exId === 'self_perception') {
          return (
            <Exercise3ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_2' || exId === 'inkblot_projective') {
          return (
            <Exercise2ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_1' || exId === 'word_association') {
          return (
            <Exercise1ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        if (exId === 'exercise_0' || exId === 'ocean') {
          return (
            <Exercise0ResultView
              instanceId={activeResultInstanceId}
              onClose={() => setActiveResultInstanceId(null)}
            />
          );
        }

        return null;
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

        {/* Dashboard Lifecycle Summary Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl p-4 border border-[#1E2A2E]/5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Pending</span>
            <div className="font-serif text-xl text-primary font-normal">{inProgressCount}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#1E2A2E]/5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Available</span>
            <div className="font-serif text-xl text-blue-700 font-normal">{availableCount}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#1E2A2E]/5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Completed</span>
            <div className="font-serif text-xl text-emerald-700 font-normal">{completedCount}</div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-[#1E2A2E]/5 shadow-xs space-y-1">
            <span className="text-[9px] font-bold uppercase tracking-wider text-mid">Locked</span>
            <div className="font-serif text-xl text-slate-500 font-normal">{lockedCount}</div>
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
              const meta = EXERCISE_METADATA[inst.exercise_id] || {
                title: 'Psychological Exercise',
                category: 'Assessment',
                description: 'Structured psychological reframing exercise.',
                unlockDay: 1,
                getProgress: () => `In Progress`
              };

              const isLocked = inst.status === 'locked';
              const isCompleted = inst.status === 'completed';
              const isAnalysing = inst.status === 'analysing';
              const isInProgress = ['started', 'in_progress'].includes(inst.status);
              const isAvailable = inst.status === 'available';

              return (
                <div
                  key={inst.id}
                  className={`bg-white rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                    isCompleted
                      ? 'border-emerald-200 bg-emerald-50/20'
                      : isInProgress || isAnalysing
                      ? 'border-[#8DBFB4] shadow-sm'
                      : isLocked
                      ? 'border-line opacity-60'
                      : 'border-line hover:border-primary/30 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8DBFB4]">
                        {meta.category}
                      </span>
                      
                      {/* Status Badge Driven strictly by Lifecycle */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-medium">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      ) : isAnalysing ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 text-[11px] font-medium animate-pulse">
                          <Clock className="w-3 h-3" />
                          Analysing
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

                    {/* Founder Display Title */}
                    <h3 className="font-serif text-lg text-primary mb-2">
                      {meta.title}
                    </h3>

                    {/* Founder Description */}
                    <p className="text-xs text-mid leading-relaxed mb-4">
                      {meta.description}
                    </p>

                    {/* Stored Progress Indicator */}
                    {(isInProgress || isAnalysing) && (
                      <div className="text-[11px] font-medium text-[#4A6A64] mb-6 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-[#8DBFB4]" />
                        <span>{meta.getProgress(inst)}</span>
                      </div>
                    )}
                  </div>

                  {/* Lifecycle-driven CTAs */}
                  <div className="pt-4">
                    {isCompleted ? (
                      <button
                        onClick={() => setActiveResultInstanceId(inst.id)}
                        className="w-full py-2.5 rounded-xl border border-primary/20 hover:bg-primary/5 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        View Results
                      </button>
                    ) : isAnalysing ? (
                      <button
                        onClick={() => handleResumeExercise(inst.id)}
                        className="w-full py-2.5 rounded-xl bg-purple-900 text-white text-xs font-semibold hover:bg-purple-800 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View Status
                      </button>
                    ) : isInProgress ? (
                      <button
                        onClick={() => handleResumeExercise(inst.id)}
                        className="w-full py-2.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Continue Exercise
                      </button>
                    ) : isLocked ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        Locked (Unlocks Day {meta.unlockDay})
                      </button>
                    ) : (
                      <button
                        onClick={() => handleStartExercise(inst.exercise_id)}
                        className="w-full py-2.5 rounded-xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        Begin Exercise
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
