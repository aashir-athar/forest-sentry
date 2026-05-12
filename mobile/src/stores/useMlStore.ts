// ML state — training opt-in + which model versions are active on this device.
// Persists via AsyncStorage so the opt-in survives app restarts and the
// classifier knows on cold-start which local FS .tflite to load.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type ModelKind = 'leaf-health' | 'logging-detection' | 'predictive' | 'anomaly';

export type ActiveModel = {
  // Stable id from model_versions.id on the server.
  id: string;
  kind: ModelKind;
  tag: string;
  // Local file-system path the classifier should load from. Empty string when
  // we're still using the bundled asset.
  localPath: string;
  labelsLocalPath: string;
  trainedAt: string;
  sampleCount: number;
  validationAcc?: number;
};

type MlState = {
  // User-controlled opt-in. When false, no photos / corrections are flagged
  // for training contribution, regardless of what the operator does.
  trainingOptIn: boolean;
  // Per-model-kind: which version is currently loaded on this device.
  activeModels: Partial<Record<ModelKind, ActiveModel>>;
  lastRegistryCheckAt?: string;
  setTrainingOptIn: (next: boolean) => void;
  setActiveModel: (kind: ModelKind, model: ActiveModel) => void;
  clearActiveModel: (kind: ModelKind) => void;
  markRegistryChecked: () => void;
};

export const useMlStore = create<MlState>()(
  persist(
    (set) => ({
      trainingOptIn: false,
      activeModels: {},
      setTrainingOptIn: (next) => set({ trainingOptIn: next }),
      setActiveModel: (kind, model) =>
        set((s) => ({ activeModels: { ...s.activeModels, [kind]: model } })),
      clearActiveModel: (kind) =>
        set((s) => {
          const next = { ...s.activeModels };
          delete next[kind];
          return { activeModels: next };
        }),
      markRegistryChecked: () => set({ lastRegistryCheckAt: new Date().toISOString() }),
    }),
    {
      name: 'forest-sentry:ml',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        trainingOptIn: s.trainingOptIn,
        activeModels: s.activeModels,
        lastRegistryCheckAt: s.lastRegistryCheckAt,
      }),
    },
  ),
);
