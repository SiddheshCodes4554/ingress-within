import React, { useState, useEffect } from 'react';
import { ModuleCatalogService } from '../lib/modules/moduleCatalogService';
import { ModuleContentService } from '../lib/modules/moduleContentService';

// Module Components
import ModuleOverview from '../components/modules/ModuleOverview';
import ModuleIntroSequence from '../components/modules/ModuleIntroSequence';
import MhpiBaselineModal from '../components/modules/MhpiBaselineModal';
import ModuleWeekList from '../components/modules/ModuleWeekList';
import ModuleWeekView from '../components/modules/ModuleWeekView';
import ModuleTouchRenderer from '../components/modules/ModuleTouchRenderer';
import MhpiWeeklyView from '../components/modules/MhpiWeeklyView';
import ModuleCompletionView from '../components/modules/ModuleCompletionView';

const STORAGE_KEY_PREFIX = 'ingress_module_player_state_';

export default function ModulePlayerPage() {
  const [moduleCatalog, setModuleCatalog] = useState(null);
  const [moduleContent, setModuleContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Player State
  const [playerState, setPlayerState] = useState({
    view: 'overview', // 'overview' | 'intro' | 'mhpi_baseline' | 'week_list' | 'week_view' | 'touch_view' | 'mhpi_weekly' | 'mhpi_end' | 'mhpi_results' | 'completed'
    introStep: 0,
    weekIdx: 0,
    touchId: null,
    touchStep: 'relate',
    completedTouches: [],
    userAnswers: {},
    mhpiTemp: {},
    mhpiData: {
      baseline: null,
      baselineScore: null,
      weekly: {},
      end: null,
      endScore: null,
      improvementPct: null,
      helpfulness: null,
      nextStep: null
    }
  });

  // Extract moduleId from URL path (e.g. /modules/M1 or /modules/self-worth-self-talk)
  const pathParts = window.location.pathname.split('/').filter(Boolean);
  const moduleIdFromUrl = pathParts[1] || 'M1';

  // Load Module Catalog & Content
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        const catalog = await ModuleCatalogService.getModuleByIdOrSlug(moduleIdFromUrl);
        const content = ModuleContentService.getModuleContent(moduleIdFromUrl);

        if (!catalog && !content) {
          setError(`Module '${moduleIdFromUrl}' not found.`);
          setLoading(false);
          return;
        }

        setModuleCatalog(catalog);
        setModuleContent(content);

        // Load saved state from localStorage
        const storageKey = `${STORAGE_KEY_PREFIX}${content?.moduleId || catalog?.id || moduleIdFromUrl}`;
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            // Re-hydrate completedTouches as Array
            setPlayerState(prev => ({
              ...prev,
              ...parsed,
              completedTouches: Array.isArray(parsed.completedTouches) ? parsed.completedTouches : []
            }));
          } catch (e) {
            console.error('[ModulePlayer] Error parsing saved state from localStorage:', e);
          }
        }
      } catch (err) {
        console.error('[ModulePlayer] Error loading module data:', err);
        setError(err.message || 'Failed to load module.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [moduleIdFromUrl]);

  // Save state to localStorage whenever playerState changes
  useEffect(() => {
    if (!moduleContent && !moduleCatalog) return;
    const targetId = moduleContent?.moduleId || moduleCatalog?.id || moduleIdFromUrl;
    const storageKey = `${STORAGE_KEY_PREFIX}${targetId}`;
    try {
      localStorage.setItem(storageKey, JSON.stringify(playerState));
    } catch (e) {
      console.error('[ModulePlayer] Error saving state to localStorage:', e);
    }
  }, [playerState, moduleContent, moduleCatalog, moduleIdFromUrl]);

  const updateState = (updater) => {
    setPlayerState(prev => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      return next;
    });
  };

  const resetModuleState = () => {
    const targetId = moduleContent?.moduleId || moduleCatalog?.id || moduleIdFromUrl;
    const storageKey = `${STORAGE_KEY_PREFIX}${targetId}`;
    localStorage.removeItem(storageKey);
    setPlayerState({
      view: 'overview',
      introStep: 0,
      weekIdx: 0,
      touchId: null,
      touchStep: 'relate',
      completedTouches: [],
      userAnswers: {},
      mhpiTemp: {},
      mhpiData: {
        baseline: null,
        baselineScore: null,
        weekly: {},
        end: null,
        endScore: null,
        improvementPct: null,
        helpfulness: null,
        nextStep: null
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1B2340] text-[#F5EFE3] flex flex-col justify-center items-center font-sans p-6">
        <div className="w-10 h-10 border-2 border-[#E8A33D] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-serif italic text-sm text-[#C9C2AE]">Loading Psychoeducation Module...</p>
      </div>
    );
  }

  if (error || (!moduleContent && !moduleCatalog)) {
    return (
      <div className="min-h-screen bg-[#1B2340] text-[#F5EFE3] flex flex-col justify-center items-center font-sans p-6 text-center">
        <h2 className="font-serif text-2xl text-[#E8A33D] mb-2">Module Not Found</h2>
        <p className="text-[#C9C2AE] max-w-md mb-6">{error || `Module '${moduleIdFromUrl}' could not be loaded.`}</p>
        <button
          onClick={() => window.navigateTo('/dashboard')}
          className="px-6 py-2.5 bg-[#E8A33D] text-[#1B2340] font-semibold rounded-lg text-sm"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1B2340] text-[#F5EFE3] font-sans">
      <div className="max-w-[760px] mx-auto px-5 py-7 pb-20">
        {/* Render appropriate view based on playerState.view */}
        {playerState.view === 'overview' && (
          <ModuleOverview
            catalog={moduleCatalog}
            content={moduleContent}
            playerState={playerState}
            onStartIntro={() => updateState({ view: 'intro', introStep: 0 })}
            onResume={() => {
              if (!playerState.mhpiData.baseline) {
                updateState({ view: 'mhpi_baseline' });
              } else {
                updateState({ view: 'week_list' });
              }
            }}
            onReset={resetModuleState}
          />
        )}

        {playerState.view === 'intro' && (
          <ModuleIntroSequence
            content={moduleContent}
            step={playerState.introStep}
            onNextStep={() => {
              if (playerState.introStep < moduleContent.introScreens.length - 1) {
                updateState(prev => ({ introStep: prev.introStep + 1 }));
              } else {
                // If baseline is already completed, go to week_list, otherwise mhpi_baseline
                if (playerState.mhpiData.baseline) {
                  updateState({ view: 'week_list' });
                } else {
                  updateState({ view: 'mhpi_baseline' });
                }
              }
            }}
            onPrevStep={() => {
              if (playerState.introStep > 0) {
                updateState(prev => ({ introStep: prev.introStep - 1 }));
              } else {
                updateState({ view: 'overview' });
              }
            }}
          />
        )}

        {playerState.view === 'mhpi_baseline' && (
          <MhpiBaselineModal
            content={moduleContent}
            playerState={playerState}
            updateState={updateState}
            onComplete={() => updateState({ view: 'week_list' })}
          />
        )}

        {playerState.view === 'week_list' && (
          <ModuleWeekList
            catalog={moduleCatalog}
            content={moduleContent}
            playerState={playerState}
            onSelectWeek={(weekIdx) => updateState({ view: 'week_view', weekIdx })}
            onBackToOverview={() => updateState({ view: 'overview' })}
            onCompleteModule={() => updateState({ view: 'mhpi_end' })}
          />
        )}

        {playerState.view === 'week_view' && (
          <ModuleWeekView
            content={moduleContent}
            weekIdx={playerState.weekIdx}
            playerState={playerState}
            onBackToWeekList={() => updateState({ view: 'week_list' })}
            onSelectTouch={(touchId) => updateState({ view: 'touch_view', touchId, touchStep: 'relate' })}
            onOpenMhpiWeekly={() => updateState({ view: 'mhpi_weekly' })}
          />
        )}

        {playerState.view === 'touch_view' && (
          <ModuleTouchRenderer
            content={moduleContent}
            touchId={playerState.touchId}
            playerState={playerState}
            updateState={updateState}
            onBackToWeek={() => updateState({ view: 'week_view' })}
          />
        )}

        {playerState.view === 'mhpi_weekly' && (
          <MhpiWeeklyView
            content={moduleContent}
            weekIdx={playerState.weekIdx}
            playerState={playerState}
            updateState={updateState}
            onComplete={() => updateState({ view: 'week_view' })}
          />
        )}

        {playerState.view === 'mhpi_end' && (
          <ModuleCompletionView
            content={moduleContent}
            playerState={playerState}
            updateState={updateState}
            onFinish={() => updateState({ view: 'overview' })}
          />
        )}
      </div>
    </div>
  );
}
