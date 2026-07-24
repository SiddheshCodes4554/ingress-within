import React from 'react';
import { CheckCircle, Brain, Zap, Shield, ArrowRight } from 'lucide-react';

const DIMENSION_DEFS = {
  openness: {
    title: 'Openness to Experience',
    desc: 'Traces your conceptual curiosity, interest in novelty, variety, and cognitive connections.'
  },
  conscientiousness: {
    title: 'Conscientiousness & Order',
    desc: 'Traces your detail orientation, internal self-discipline, execution, and structure.'
  },
  extraversion: {
    title: 'Extraversion & Sociality',
    desc: 'Traces your energy recharge patterns, collaborative thinking, and social engagement.'
  },
  agreeableness: {
    title: 'Agreeableness & Alignment',
    desc: 'Traces your boundary-setting style, empathy levels, and conflict navigation approach.'
  },
  neuroticism: {
    title: 'Neuroticism & Sensitivity',
    desc: 'Traces your emotional reactivity, mood sensitivity, and reflective worry loops.'
  }
};

export default function ExerciseAnalysis({ result, onClose, exerciseId }) {
  if (!result) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-12 text-center">
        <div className="w-12 h-12 mx-auto rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
        <p className="font-serif text-lg text-primary">Finalizing your clinical analysis report...</p>
      </div>
    );
  }

  const { analysis, scores, branch, lens, summary, generated_at } = result;

  // Check exercise type
  const isInkblot = exerciseId === 'exercise_2' || (result.instance_id && result.instance_id.includes('exercise_2')) || (result.raw_json && result.raw_json.exercise_id === 'exercise_2');
  const isWordAssociation = exerciseId === 'exercise_1' || (result.instance_id && result.instance_id.includes('exercise_1')) || (result.raw_json && result.raw_json.exercise_id === 'exercise_1');

  if (isInkblot) {
    const formattedDate = generated_at
      ? new Date(generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const cleanAnalysisText = (analysis || '')
      .split('**').join('')
      .split('*').join('')
      .replace(/^#+\s*/gm, '')
      .replace(/```[\s\S]*?```/gm, '')
      .replace(/\{[\s\S]*$/m, '')
      .trim();

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-6 animate-fade-in text-left">
        <div className="space-y-2">
          <div className="font-label-md text-xs font-semibold uppercase tracking-wider text-accent">
            Inkblot Exercise
          </div>
          <div className="text-xs text-primary/40">
            Completed {formattedDate}
          </div>
        </div>

        <p className="font-serif text-lg leading-relaxed text-primary/80">
          {cleanAnalysisText || 'Your responses have been recorded. They will feed into your Day 30 report.'}
        </p>

        <hr className="border-t border-[#B8A8D4] w-8 my-4" />

        <p className="text-xs text-primary/50 leading-relaxed italic">
          This feeds into your Day 30 report.
        </p>

        <div className="flex justify-center border-t border-primary/5 pt-6 mt-8">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-8 py-3.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <span>Done</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  if (isWordAssociation) {
    const formattedDate = generated_at
      ? new Date(generated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
      : new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    // Strip markdown wrappers cleanly
    const cleanAnalysisText = (analysis || '')
      .split('**').join('')
      .split('*').join('')
      .replace(/^#+\s*/gm, '')
      .trim();

    return (
      <div className="space-y-8 max-w-2xl mx-auto py-6 animate-fade-in text-left">
        <div className="space-y-2">
          <div className="font-label-md text-xs font-semibold uppercase tracking-wider text-accent">
            Word Association
          </div>
          <div className="text-xs text-primary/40">
            Completed {formattedDate}
          </div>
        </div>

        <p className="font-serif text-lg leading-relaxed text-primary/80">
          {cleanAnalysisText || 'Your responses have been recorded. They will feed into your Day 30 report.'}
        </p>

        <hr className="border-t border-[#B8A8D4] w-8 my-4" />

        <p className="text-xs text-primary/50 leading-relaxed italic">
          This feeds into your Day 30 report.
        </p>

        <div className="flex justify-center border-t border-primary/5 pt-6 mt-8">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-8 py-3.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <span>Done</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Check if this is an OCEAN Personality Report
  const isOcean = scores && scores.openness !== undefined;

  if (isOcean) {
    return (
      <div className="space-y-8 max-w-2xl mx-auto py-6 animate-fade-in">
        {/* Intro Block */}
        <div className="space-y-4 text-center sm:text-left">
          <div className="font-label-md text-xs font-semibold uppercase tracking-wider text-accent">
            What we noticed
          </div>
          <p className="font-serif text-xl md:text-2xl text-primary font-normal leading-relaxed text-left">
            {analysis}
          </p>
          <hr className="border-t-2 border-[#B8A8D4] w-8 my-4" />
          <p className="text-xs text-primary/50 leading-relaxed text-left italic">
            This shapes how we respond to you. You won't see it again — but it's working in the background.
          </p>
        </div>

        {/* Five Dimensions */}
        <div className="space-y-6 pt-4">
          <h3 className="font-serif text-lg text-primary font-normal border-b border-primary/5 pb-2">
            Your Personality Baseline Profile
          </h3>
          <div className="space-y-5">
            {Object.keys(DIMENSION_DEFS).map((dimKey) => {
              const def = DIMENSION_DEFS[dimKey];
              const score = scores[dimKey] || 3;
              const percentage = (score / 5) * 100;

              return (
                <div key={dimKey} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-serif text-sm font-semibold text-primary/80">{def.title}</span>
                    <span className="font-mono text-xs text-primary/40">Score: {score.toFixed(1)}/5.0</span>
                  </div>
                  <div className="h-1.5 bg-primary/5 rounded-full overflow-hidden w-full relative">
                    <div
                      style={{ width: `${percentage}%` }}
                      className="h-full bg-accent rounded-full transition-all duration-500"
                    />
                  </div>
                  <p className="text-[11px] text-primary/50 leading-relaxed">
                    {def.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Exit */}
        <div className="flex justify-center border-t border-primary/5 pt-6 mt-8">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-8 py-3.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          >
            <span>Continue to App</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  // Fallback for guided/clinical assessments (Exercise 1, 2, 3)
  const getScoreCircle = (label, score) => {
    return (
      <div className="flex flex-col items-center p-4 bg-surface-container-low border border-primary/5 rounded-2xl flex-1 text-center min-w-[90px]">
        <span className="font-serif text-3xl font-normal text-primary mb-1">{score || 5}</span>
        <span className="font-label-md text-[9px] uppercase tracking-wider font-semibold text-primary/40">{label}</span>
      </div>
    );
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto py-6">
      {/* Intro Block */}
      <div className="space-y-3 text-center sm:text-left">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-[10px] font-semibold uppercase tracking-wider font-label-md">
          <CheckCircle size={10} />
          <span>Evaluation Complete</span>
        </div>
        <h2 className="font-serif text-3xl text-primary font-normal">Clinical Analysis</h2>
        <p className="font-body-md text-primary/70 text-sm italic leading-relaxed">
          "{summary || 'Exercise insights generated successfully.'}"
        </p>
      </div>

      {/* Score Grid */}
      <div className="flex gap-4">
        {getScoreCircle('Clarity', scores?.clarity)}
        {getScoreCircle('Intensity', scores?.intensity)}
        {getScoreCircle('Reactivity', scores?.reactivity)}
      </div>

      {/* Primary Narrative */}
      <div className="p-6 bg-surface-container-low border border-primary/5 rounded-3xl space-y-4">
        <div className="flex items-center gap-2 text-primary font-serif text-lg font-normal">
          <Brain size={18} className="text-accent" />
          <h3>Psychological Narrative</h3>
        </div>
        <p className="font-body-md text-primary/80 text-sm leading-relaxed whitespace-pre-wrap">
          {analysis}
        </p>
      </div>

      {/* Meta Insights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {lens && (
          <div className="p-5 border border-primary/5 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-primary/60 text-xs font-semibold uppercase tracking-wider font-label-md">
              <Zap size={14} className="text-secondary" />
              <span>Cognitive Lens</span>
            </div>
            <p className="font-serif text-base font-normal text-primary">{lens}</p>
          </div>
        )}
        {branch && (
          <div className="p-5 border border-primary/5 rounded-2xl space-y-2">
            <div className="flex items-center gap-1.5 text-primary/60 text-xs font-semibold uppercase tracking-wider font-label-md">
              <Shield size={14} className="text-accent" />
              <span>CBT Pathway Focus</span>
            </div>
            <p className="font-serif text-base font-normal text-primary">{branch.replace(/_/g, ' ')}</p>
          </div>
        )}
      </div>

      {/* Navigation Exit */}
      <div className="flex justify-center border-t border-primary/5 pt-6 mt-8">
        <button
          onClick={onClose}
          className="flex items-center gap-1.5 px-6 py-2.5 bg-primary hover:bg-[#2A3A3E] text-mint-grey rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
        >
          <span>Return to Dashboard</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
