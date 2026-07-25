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

export default function ExercisePage({ user, profile, onSignOut }) {
  const [loading, setLoading] = useState(true);
  const [instances, setInstances] = useState([]);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeExerciseInstanceId, setActiveExerciseInstanceId] = useState(null);
  const [activeResultInstanceId, setActiveResultInstanceId] = useState(null);

  useEffect(() => {
    fetchExerciseInstances();
  }, []);

  const fetchExerciseInstances = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/exercises', {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Authentication required. Please sign in.');
        }
        throw new Error(`Failed to load exercises (HTTP ${res.status})`);
      }
      const data = await res.json();
      setInstances(data.instances || []);
    } catch (err) {
      console.error('[ExercisePage] Fetch error:', err);
      setError(err.message || 'Unable to connect to exercise server.');
    } finally {
      setLoading(false);
    }
  };

  // Group instances by V4 lifecycle status
  const availableInstances = instances.filter(i => i.status === 'available');
  const inProgressInstances = instances.filter(i => ['started', 'in_progress'].includes(i.status));
  const completedInstances = instances.filter(i => ['submitted', 'processing', 'completed'].includes(i.status));
  const lockedInstances = instances.filter(i => i.status === 'locked');

  const filteredInstances = () => {
    switch (activeCategory) {
      case 'available': return availableInstances;
      case 'in_progress': return inProgressInstances;
      case 'completed': return completedInstances;
      case 'locked': return lockedInstances;
      default: return instances;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available
          </span>
        );
      case 'started':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 border border-amber-500/20">
            <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '4s' }} />
            In Progress
          </span>
        );
      case 'submitted':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-500/10 text-sky-700 border border-sky-500/20">
            <RotateCw className="w-3 h-3 text-sky-600 animate-spin" />
            Processing
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-700 border border-slate-500/20">
            <CheckCircle2 className="w-3 h-3 text-slate-600" />
            Completed
          </span>
        );
      case 'locked':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-gray-500/10 text-gray-500 border border-gray-500/20">
            <Lock className="w-3 h-3 text-gray-400" />
            Locked
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#ECEFF0] text-[#1E2A2E] font-sans pb-16">
      <DashboardNavbar activeTab="exercises" />

      {/* Render Exercise Runner Modal Flow if Active */}
      {activeExerciseInstanceId && (() => {
        const inst = instances.find(i => i.id === activeExerciseInstanceId);
        if (inst?.exercise_id === 'exercise_1') {
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
        if (inst?.exercise_id === 'exercise_1') {
          return (
            <Exercise1ResultView
              result={{ analysis: inst.data, summary: inst.summary }}
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
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
            </button>
            <h1 className="text-3xl md:text-4xl font-serif italic text-primary tracking-tight">
              Exercise &amp; Self-Exploration Hub
            </h1>
            <p className="text-sm text-mid mt-1 max-w-xl">
              Deepen your cognitive reflection and emotional awareness through structured exercises.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchExerciseInstances}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/70 hover:bg-white border border-white/90 text-xs font-semibold text-primary shadow-sm transition-all cursor-pointer"
            >
              <RotateCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Refresh Status
            </button>
          </div>
        </div>

        {/* Categories Tab Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Exercises', count: instances.length },
            { id: 'available', label: 'Available', count: availableInstances.length, color: 'text-emerald-700 bg-emerald-500/10' },
            { id: 'in_progress', label: 'In Progress', count: inProgressInstances.length, color: 'text-amber-700 bg-amber-500/10' },
            { id: 'completed', label: 'Completed', count: completedInstances.length, color: 'text-slate-700 bg-slate-500/10' },
            { id: 'locked', label: 'Locked', count: lockedInstances.length, color: 'text-gray-500 bg-gray-500/10' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCategory(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border ${
                activeCategory === tab.id
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'bg-white/60 text-mid hover:text-primary border-white/80 hover:bg-white/80'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                activeCategory === tab.id ? 'bg-white/20 text-white' : tab.color || 'bg-black/5 text-mid'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="py-24 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto flex items-center justify-center">
              <div className="absolute w-14 h-14 rounded-full border-2 border-secondary/20 animate-ping" />
              <RotateCw className="w-8 h-8 text-primary animate-spin" />
            </div>
            <p className="text-sm font-serif italic text-mid animate-pulse">Gathering exercise data...</p>
          </div>
        ) : error ? (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-6 text-center max-w-lg mx-auto space-y-3">
            <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
            <h3 className="font-serif italic text-lg text-primary">Unable to load exercises</h3>
            <p className="text-xs text-mid">{error}</p>
            <button
              onClick={fetchExerciseInstances}
              className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer"
            >
              Try Again
            </button>
          </div>
        ) : instances.length === 0 ? (
          /* PREMIUM FOUNDER EMPTY STATE */
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/60 backdrop-blur-md border border-white/80 rounded-3xl p-12 text-center max-w-2xl mx-auto space-y-6 shadow-sm"
          >
            <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
              <div className="absolute w-20 h-20 rounded-full border border-secondary/20 animate-pulse" />
              <div className="w-14 h-14 rounded-full bg-secondary/10 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-secondary" />
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-serif italic text-primary">
                Your exercise space is settling in
              </h2>
              <p className="text-sm text-mid leading-relaxed max-w-md mx-auto">
                Exercises unlock automatically as your journey unfolds. Continue your daily reflections and journal entries to reveal upcoming exercises.
              </p>
            </div>

            <div className="pt-4 border-t border-black/5 flex flex-wrap items-center justify-center gap-4 text-xs font-medium text-mid">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Automatic Unlocks
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                Cycle-Based Progression
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                Reflective Analysis
              </span>
            </div>
          </motion.div>
        ) : (
          /* EXERCISE INSTANCE CARDS */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredInstances().map(instance => (
                <motion.div
                  key={instance.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="bg-white/70 hover:bg-white backdrop-blur-md border border-white/90 rounded-2xl p-6 space-y-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-mono text-mid uppercase tracking-wider">
                        {instance.exercise_id.replace(/_/g, ' ')}
                      </span>
                      {getStatusBadge(instance.status)}
                    </div>

                    <h3 className="font-serif italic text-xl text-primary leading-tight">
                      {instance.exercise_id === 'exercise_0'
                        ? 'Exercise 0: Cognitive & Emotional Baseline'
                        : instance.exercise_id === 'exercise_1'
                        ? 'Exercise 1: Word Association'
                        : `Exercise: ${instance.exercise_id}`}
                    </h3>

                    <p className="text-xs text-mid leading-relaxed">
                      {instance.exercise_id === 'exercise_0'
                        ? 'Initial baseline assessment measuring emotional processing, internal tension responses, and values alignment.'
                        : instance.exercise_id === 'exercise_1'
                        ? '12-word rapid association exercise measuring emotional register and suppression.'
                        : 'Structured cognitive exercise.'}
                    </p>
                  </div>

                  <div className="pt-4 border-t border-black/5 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-mid">
                      {instance.unlock_time ? (
                        <span>Unlocked {new Date(instance.unlock_time).toLocaleDateString()}</span>
                      ) : (
                        <span>Locked</span>
                      )}
                    </div>

                    {instance.status === 'available' && (
                      <button
                        onClick={() => setActiveExerciseInstanceId(instance.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary text-white text-xs font-semibold hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
                      >
                        Start Exercise <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {['started', 'in_progress'].includes(instance.status) && (
                      <button
                        onClick={() => setActiveExerciseInstanceId(instance.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 transition-all cursor-pointer shadow-sm"
                      >
                        Continue Exercise <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {['submitted', 'processing', 'completed'].includes(instance.status) && (
                      <button
                        onClick={() => setActiveResultInstanceId(instance.id)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-secondary/90 transition-all cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-white" /> View Analysis
                      </button>
                    )}

                    {instance.status === 'locked' && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                        <Lock className="w-3.5 h-3.5" /> Locked
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}
