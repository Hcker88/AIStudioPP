import { create } from 'zustand';

interface AppState {
  syncState: 'idle' | 'syncing' | 'synced' | 'error';
  user: any | null;
  decisionInsight: any | null;
  setSyncState: (state: 'idle' | 'syncing' | 'synced' | 'error') => void;
  setUser: (user: any) => void;
  setDecisionInsight: (insight: any) => void;
}

export const useStore = create<AppState>((set) => ({
  syncState: 'idle',
  user: null,
  decisionInsight: null,
  setSyncState: (syncState) => set({ syncState }),
  setUser: (user) => set({ user }),
  setDecisionInsight: (decisionInsight) => set({ decisionInsight }),
}));
