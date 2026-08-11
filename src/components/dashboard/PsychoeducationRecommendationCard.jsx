import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight, BookOpen, CheckCircle, Clock, Tag, ShieldAlert } from 'lucide-react';

/**
 * PsychoeducationRecommendationCard
 * Displays the user's single persisted monthly psychoeducation module recommendation.
 * Does NOT run recommendation AI, recalculate patterns, or quote private journal content.
 */
export default function PsychoeducationRecommendationCard({ cycleId = 'latest', onNavigateToModule }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchRecommendation() {
      try {
        setLoading(true);
        const res = await fetch(`/api/modules/recommended?cycleId=${encodeURIComponent(cycleId)}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (!res.ok) {
          if (res.status === 401) {
            setLoading(false);
            return;
          }
          throw new Error('Failed to fetch recommendation.');
        }

        const json = await res.json();
        if (isMounted) {
          setData(json);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRecommendation();

    return () => {
      isMounted = false;
    };
  }, [cycleId]);

  if (loading) {
    return (
      <div className="bg-stone-900/60 border border-amber-900/20 rounded-2xl p-6 backdrop-blur-md animate-pulse">
        <div className="h-4 w-44 bg-amber-500/20 rounded mb-3"></div>
        <div className="h-6 w-64 bg-stone-700/40 rounded mb-2"></div>
        <div className="h-4 w-full bg-stone-800/40 rounded mb-4"></div>
        <div className="h-10 w-36 bg-amber-500/20 rounded-xl"></div>
      </div>
    );
  }

  if (error || !data || data.status === 'NO_RECOMMENDATION') {
    return null; // State 1: No recommendation (silent hide per spec)
  }

  // State 6: Crisis Route (Do NOT show purchase card or sell anything)
  if (data.status === 'CRISIS_ROUTE') {
    return (
      <div className="bg-rose-950/40 border border-rose-800/40 rounded-2xl p-6 backdrop-blur-md">
        <div className="flex items-center gap-2 text-rose-400 text-sm font-medium mb-2">
          <ShieldAlert className="w-4 h-4" />
          <span>Support & Crisis Resources</span>
        </div>
        <p className="text-stone-300 text-sm mb-4 leading-relaxed">
          If you are experiencing intense distress or need immediate support, please reach out to our dedicated helpline resources or your healthcare practitioner.
        </p>
        <a
          href="/support"
          className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-medium text-sm rounded-xl transition-colors"
        >
          <span>Access support helpline</span>
          <ArrowRight className="w-4 h-4" />
        </a>
      </div>
    );
  }

  const rec = data.recommendation;
  if (!rec || !rec.module) {
    return null;
  }

  const { module, triggeringConcern, purchaseStatus } = rec;
  const isOwned = purchaseStatus === 'active' || purchaseStatus === 'completed' || data.status === 'PURCHASED' || data.status === 'ACTIVE' || data.status === 'COMPLETED';
  const isCompleted = purchaseStatus === 'completed' || data.status === 'COMPLETED';
  const isActive = purchaseStatus === 'active' || data.status === 'ACTIVE';

  // Safe explanation derived from taxonomy concern without quoting journal text
  const getExplanation = () => {
    switch (module.id) {
      case 'M1':
        return 'Structured guided practice to shift harsh self-talk, build core self-worth, and break imposter syndrome loops.';
      case 'M2':
        return 'Structured guided practice for overcoming rigid standards, over-polishing, and task avoidance.';
      case 'M3':
        return 'Structured evidence-based program for breaking chronic overthinking, worry, panic, and intrusive thoughts.';
      default:
        return 'A structured psychoeducation module tailored to your current focus areas.';
    }
  };

  const getDuration = () => {
    switch (module.id) {
      case 'M1': return '7 weeks · 35 touches';
      case 'M2': return '5 weeks · 25 touches';
      case 'M3': return '9 weeks · 45 touches';
      default: return 'Guided program';
    }
  };

  const handleCtaClick = () => {
    if (onNavigateToModule) {
      onNavigateToModule(module.id || module.slug);
    } else {
      window.location.href = `/modules/${module.id}`;
    }
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-amber-950/30 via-stone-900/80 to-stone-950 border border-amber-500/20 rounded-2xl p-6 backdrop-blur-md shadow-xl transition-all duration-300 hover:border-amber-500/40">
      <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none text-amber-500">
        <Sparkles className="w-32 h-32" />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Your monthly recommendation</span>
          </div>

          {isCompleted ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-medium bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Completed</span>
            </span>
          ) : isActive ? (
            <span className="inline-flex items-center gap-1.5 text-amber-400 text-xs font-medium bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Active</span>
            </span>
          ) : null}
        </div>

        <h3 className="text-xl font-bold text-stone-100 tracking-tight mb-2">
          {module.name}
        </h3>

        <p className="text-stone-300 text-sm leading-relaxed mb-5 max-w-xl">
          {getExplanation()}
        </p>

        <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 mb-6 border-t border-stone-800/60 pt-4">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-amber-400/80" />
            <span>{getDuration()}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-amber-400/80" />
            <span>{module.currency === 'INR' ? `₹${module.price}` : `$${module.price}`}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCtaClick}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-stone-950 font-semibold text-sm rounded-xl shadow-lg shadow-amber-950/40 transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <span>
              {isCompleted ? 'Review module' : isOwned ? 'Continue module' : 'View module'}
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
