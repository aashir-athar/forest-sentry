// Last known position — captured once a screen mounts, refreshed on tag/inspect actions.
import { create } from 'zustand';

export type LiveLocation = {
  lat: number;
  lng: number;
  accuracyM?: number;
  recordedAt: string;
};

type LocationState = {
  current: LiveLocation | null;
  insideZoneId: string | null;
  setCurrent: (loc: LiveLocation | null) => void;
  setInsideZone: (id: string | null) => void;
};

export const useLocationStore = create<LocationState>((set) => ({
  current: null,
  insideZoneId: null,
  setCurrent: (current) => set({ current }),
  setInsideZone: (insideZoneId) => set({ insideZoneId }),
}));
