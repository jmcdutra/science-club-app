import { create } from 'zustand';
import type { ActiveCardioSession } from '../types';

interface CardioStore {
  completedSession: ActiveCardioSession | null;
  setCompletedSession: (session: ActiveCardioSession) => void;
  clearCompletedSession: () => void;
}

export const useCardioStore = create<CardioStore>((set) => ({
  completedSession: null,
  setCompletedSession: (session) => set({ completedSession: session }),
  clearCompletedSession: () => set({ completedSession: null }),
}));
