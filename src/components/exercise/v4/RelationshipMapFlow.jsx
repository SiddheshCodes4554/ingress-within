import React, { useState, useEffect } from 'react';
import { RELATIONSHIP_LABELS, FREQUENCY_CHOICES } from '../../../lib/exercises/v4/definitions/relationshipMapCatalog';
import RelationshipMapResultView from './RelationshipMapResultView';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function RelationshipMapFlow({ instanceId, onClose, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [instance, setInstance] = useState(null);
  const [phase, setPhase] = useState('intro'); // 'intro' | 'naming' | 'questions' | 'loading' | 'result'

  // Phase 1 Naming: Array of up to 5 people [{ name, label }]
  const [peopleInputs, setPeopleInputs] = useState([
    { name: '', label: '' },
    { name: '', label: '' },
    { name: '', label: '' },
    { name: '', label: '' },
    { name: '', label: '' }
  ]);
  const [validPeople, setValidPeople] = useState([]);
  const [personIdx, setPersonIdx] = useState(0);

  // Phase 2 Questions: answers per personIndex { feeling, energy, frequency }
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    initializeFlow();
  }, [instanceId]);

  const initializeFlow = async () => {
    setLoading(true);
    try {
      let currentInst = null;
      if (instanceId) {
        const resumeRes = await fetch(`/api/exercises/current?instance_id=${instanceId}`);
        if (resumeRes.ok) {
          const data = await resumeRes.json();
          currentInst = data.instance;
        }
      }

      if (!currentInst) {
        const startRes = await fetch('/api/exercises/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ exercise_id: 'relationship_map' })
        });
        if (startRes.ok) {
          const data = await startRes.json();
          currentInst = data.instance;
        }
      }

      setInstance(currentInst);
      if (currentInst?.status === 'completed') {
        setPhase('result');
      }
    } catch (err) {
      console.error('[RelationshipMapFlow] Init error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (idx, val) => {
    const updated = [...peopleInputs];
    updated[idx].name = val;
    setPeopleInputs(updated);
  };

  const handleLabelChange = (idx, val) => {
    const updated = [...peopleInputs];
    updated[idx].label = val;
    setPeopleInputs(updated);
  };

  const filledCount = peopleInputs.filter(p => p.name.trim().length > 0 && p.label !== '').length;

  const handleProceedToQuestions = () => {
    const valid = peopleInputs.filter(p => p.name.trim().length > 0 && p.label !== '');
    if (valid.length < 3) return;
    setValidPeople(valid);
    setPersonIdx(0);
    setPhase('questions');
  };

  const handleAnswerQuestion = (field, value) => {
    setAnswers(prev => ({
      ...prev,
      [personIdx]: {
        ...prev[personIdx],
        [field]: value
      }
    }));
  };

  const currentPerson = validPeople[personIdx] || { name: '', label: '' };
  const currentAnswer = answers[personIdx] || { feeling: '', energy: '', frequency: '' };
  const isPersonComplete = currentAnswer.feeling?.trim().length > 0 && currentAnswer.energy && currentAnswer.frequency;

  const handleNextPerson = () => {
    if (!isPersonComplete) return;
    if (personIdx < validPeople.length - 1) {
      setPersonIdx(prev => prev + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    setPhase('loading');

    const AMBIVALENT_WORDS = ['complicated', 'mixed', 'both', 'unsure', 'confused', 'weird'];
    const relationshipMapData = validPeople.map((p, idx) => {
      const a = answers[idx] || {};
      const feeling = a.feeling || '';
      const energy = a.energy || '';
      const freq = (a.frequency || '').toLowerCase().replace(' ', '_');
      const ambivalent = AMBIVALENT_WORDS.some(w => feeling.toLowerCase().includes(w));
      return {
        position: idx + 1,
        name: p.name,
        label: p.label,
        feeling,
        energy,
        frequency: freq || 'a_little',
        ambivalent
      };
    });

    const targetInstanceId = instance?.id || instanceId;

    try {
      await fetch('/api/exercises/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          instance_id: targetInstanceId,
          exercise_id: 'relationship_map',
          relationship_map: relationshipMapData
        })
      });
    } catch (err) {
      console.error('[RelationshipMapFlow] Submission error:', err);
    } finally {
      setPhase('result');
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#ECEFF0] flex items-center justify-center font-serif italic text-[18px] text-[#4A6A64] animate-pulse">
        Loading Relationship Map...
      </div>
    );
  }

  if (phase === 'result') {
    return (
      <RelationshipMapResultView
        instanceId={instance?.id || instanceId}
        onClose={() => {
          if (onComplete) onComplete();
          if (onClose) onClose();
        }}
      />
    );
  }

  if (phase === 'loading') {
    return (
      <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] flex flex-col items-center justify-center p-6 text-center font-sans">
        <p className="font-serif italic text-xl md:text-2xl text-[#1E2A2E]">
          Mapping what you shared.
        </p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#FAF9F6] text-[#1E2A2E] font-sans overflow-y-auto flex flex-col justify-between">
      <div className="w-full max-w-[480px] mx-auto min-h-screen flex flex-col justify-between p-6 sm:p-8">
        
        {/* Intro Phase */}
        {phase === 'intro' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div className="space-y-6 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                Relationship Map
              </span>
              <h1 className="font-serif text-3xl md:text-4xl text-primary font-normal">
                Who's On Your Mind
              </h1>
              <p className="text-sm md:text-base text-[#1E2A2E]/80 leading-relaxed">
                Think about the people who take up the most mental space right now — not necessarily who you love most, but who is actually in your head. Could be someone you're worried about, someone you're in conflict with, someone you miss, someone who energises you. You'll name five people, then answer three short questions about each. One of the questions asks whether someone gives you energy or takes it — if the answer is complicated, go with your first instinct.
              </p>
            </div>

            <div className="pt-8">
              <button
                onClick={() => setPhase('naming')}
                className="w-full py-4 rounded-2xl bg-[#1E2A2E] text-white text-xs font-semibold hover:bg-[#1E2A2E]/90 transition-colors shadow-sm cursor-pointer"
              >
                Begin
              </button>
            </div>
          </div>
        )}

        {/* Naming Phase */}
        {phase === 'naming' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div>
              <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                    Name five people
                  </span>
                  <h2 className="font-serif text-xl text-primary font-normal">
                    Start with whoever comes to mind first.
                  </h2>
                </div>
                {onClose && (
                  <button onClick={onClose} className="p-1.5 text-mid hover:text-primary rounded-full hover:bg-black/5">
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
              </div>

              <p className="text-xs text-mid mb-6">
                Use a first name, nickname, or just an initial — whatever feels right. Names are only used to personalize your questions.
              </p>

              <div className="space-y-4 pb-24">
                {peopleInputs.map((p, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="text-xs font-mono text-mid w-14 flex-shrink-0">
                      Person {idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="First name or nickname"
                      value={p.name}
                      onChange={(e) => handleNameChange(idx, e.target.value)}
                      className="flex-1 px-3 py-2.5 rounded-xl border border-line bg-white text-sm focus:outline-none focus:border-primary"
                    />
                    <select
                      value={p.label}
                      onChange={(e) => handleLabelChange(idx, e.target.value)}
                      className="w-28 px-2 py-2.5 rounded-xl border border-line bg-white text-xs focus:outline-none focus:border-primary"
                    >
                      <option value="" disabled>Relationship</option>
                      {RELATIONSHIP_LABELS.map(lbl => (
                        <option key={lbl} value={lbl}>{lbl}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 z-30">
              <div className="max-w-[480px] mx-auto">
                <button
                  disabled={filledCount < 3}
                  onClick={handleProceedToQuestions}
                  className={`w-full py-4 rounded-2xl text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
                    filledCount >= 3
                      ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {filledCount >= 3 && filledCount < 5 ? `Continue with ${filledCount} people` : 'Continue to questions'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Questions Phase */}
        {phase === 'questions' && (
          <div className="flex flex-col justify-between min-h-[calc(100vh-4rem)]">
            <div>
              <div className="flex items-center justify-between border-b border-[#1E2A2E]/10 pb-4 mb-6">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8DBFB4]">
                    Person {personIdx + 1} of {validPeople.length}
                  </span>
                  <h2 className="font-serif text-2xl text-primary font-normal mt-0.5">
                    {currentPerson.name}
                  </h2>
                  <p className="text-xs text-mid font-medium">{currentPerson.label}</p>
                </div>
                {personIdx > 0 && (
                  <button
                    onClick={() => setPersonIdx(prev => prev - 1)}
                    className="text-xs text-[#8DBFB4] hover:text-primary font-medium cursor-pointer"
                  >
                    ← Back
                  </button>
                )}
              </div>

              <div className="space-y-6 pb-24">
                {/* Q1 Feeling */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-primary block">
                    When you think of {currentPerson.name}, what feeling comes up first?
                  </label>
                  <input
                    type="text"
                    placeholder="One word or short phrase"
                    value={currentAnswer.feeling || ''}
                    onChange={(e) => handleAnswerQuestion('feeling', e.target.value)}
                    className="w-full border-b-2 border-line bg-transparent py-2 font-serif italic text-base focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Q2 Energy */}
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-primary block">
                    Thinking about {currentPerson.name} — does it give you energy or take it?
                  </label>
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleAnswerQuestion('energy', 'gives')}
                      className={`flex-1 py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        currentAnswer.energy === 'gives'
                          ? 'bg-emerald-700 border-emerald-700 text-white'
                          : 'bg-white border-line text-primary hover:border-primary/40'
                      }`}
                    >
                      Gives energy
                    </button>
                    <button
                      onClick={() => handleAnswerQuestion('energy', 'takes')}
                      className={`flex-1 py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        currentAnswer.energy === 'takes'
                          ? 'bg-amber-700 border-amber-700 text-white'
                          : 'bg-white border-line text-primary hover:border-primary/40'
                      }`}
                    >
                      Takes energy
                    </button>
                  </div>
                </div>

                {/* Q3 Frequency */}
                <div className="space-y-2 pt-2">
                  <label className="text-sm font-medium text-primary block">
                    How often does {currentPerson.name} come up in your thoughts this week?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {FREQUENCY_CHOICES.map(freq => (
                      <button
                        key={freq}
                        onClick={() => handleAnswerQuestion('frequency', freq)}
                        className={`py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                          currentAnswer.frequency === freq
                            ? 'bg-[#1E2A2E] border-[#1E2A2E] text-white'
                            : 'bg-white border-line text-primary hover:border-primary/40'
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-[#FAF9F6]/90 backdrop-blur-md border-t border-[#1E2A2E]/10 z-30">
              <div className="max-w-[480px] mx-auto">
                <button
                  disabled={!isPersonComplete}
                  onClick={handleNextPerson}
                  className={`w-full py-4 rounded-2xl text-xs font-semibold transition-colors shadow-sm cursor-pointer ${
                    isPersonComplete
                      ? 'bg-[#1E2A2E] text-white hover:bg-[#1E2A2E]/90'
                      : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                >
                  {personIdx === validPeople.length - 1 ? 'Done' : 'Next person'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
