import { create } from 'zustand';

export const useExerciseStore = create((set, get) => ({
  currentInstance: null,
  currentStepIndex: 0,
  responses: {},
  autosaveStatus: 'idle', // 'idle' | 'saving' | 'saved' | 'error'
  lastSavedAt: null,
  stimulusList: null,

  init: (instance, initialResponses = {}, stepIndex = 0, stimulusList = null) => {
    set({
      currentInstance: instance,
      responses: initialResponses,
      currentStepIndex: stepIndex,
      autosaveStatus: 'idle',
      lastSavedAt: null,
      stimulusList
    });
  },

  setStepIndex: (index) => {
    set({ currentStepIndex: index });
  },

  setResponse: (questionId, responseVal) => {
    set((state) => ({
      responses: {
        ...state.responses,
        [questionId]: responseVal
      }
    }));
  },

  setAutosaveStatus: (status) => {
    set({
      autosaveStatus: status,
      lastSavedAt: status === 'saved' ? new Date().toISOString() : get().lastSavedAt
    });
  },

  clearStore: () => {
    set({
      currentInstance: null,
      currentStepIndex: 0,
      responses: {},
      autosaveStatus: 'idle',
      lastSavedAt: null,
      stimulusList: null
    });
  }
}));
