// Pending-sync state across the app. The actual drain happens in useSyncQueue.
import { create } from 'zustand';

type SyncState = {
  pending: { trees: number; inspections: number; incidents: number; zones: number };
  isOnline: boolean;
  isDraining: boolean;
  lastSyncIso?: string;
  lastError?: string;
  setPending: (pending: SyncState['pending']) => void;
  setOnline: (online: boolean) => void;
  setDraining: (draining: boolean) => void;
  setLastSync: (iso: string) => void;
  setLastError: (msg?: string) => void;
};

export const useSyncStore = create<SyncState>((set) => ({
  pending: { trees: 0, inspections: 0, incidents: 0, zones: 0 },
  isOnline: true,
  isDraining: false,
  setPending: (pending) => set({ pending }),
  setOnline: (isOnline) => set({ isOnline }),
  setDraining: (isDraining) => set({ isDraining }),
  setLastSync: (lastSyncIso) => set({ lastSyncIso }),
  setLastError: (lastError) => set({ lastError }),
}));
