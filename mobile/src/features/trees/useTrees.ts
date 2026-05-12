// React Query hooks over the trees repo. Mutations are optimistic + offline-safe.
import { getTree, insertInspection, listTrees, upsertTree } from '@/src/db/repos';
import type { InspectionRecord, PredictionSource } from '@/src/features/inspections/types';
import { inspectionId, newId, treeId } from '@/src/lib/id';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useMlStore } from '@/src/stores/useMlStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { HealthLabel, TreeRecord } from './types';

export const TREES_KEY = ['trees'] as const;
const TREE_DETAIL = (id: string) => ['tree', id] as const;

export function useTrees() {
  return useQuery({ queryKey: TREES_KEY, queryFn: listTrees });
}

export function useTree(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? TREE_DETAIL(id) : ['tree', 'none'],
    queryFn: () => (id ? getTree(id) : Promise.resolve(null)),
    enabled: !!id,
  });
}

export function useCreateTree() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (input: {
      species: string;
      lat: number;
      lng: number;
      girthCm?: number;
      heightM?: number;
      notes?: string;
      photoUri?: string;
      zoneId?: string;
    }) => {
      const now = new Date().toISOString();
      const record: TreeRecord = {
        id: treeId(),
        species: input.species,
        lat: input.lat,
        lng: input.lng,
        girthCm: input.girthCm,
        heightM: input.heightM,
        notes: input.notes,
        photoUri: input.photoUri,
        zoneId: input.zoneId,
        createdBy: user?.id,
        createdAt: now,
        updatedAt: now,
        synced: false,
      };
      await upsertTree(record);
      return record;
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: TREES_KEY });
      void qc.invalidateQueries({ queryKey: TREE_DETAIL(r.id) });
    },
  });
}

export function useRecordInspection() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (input: {
      treeId: string;
      // Final verdict — what the operator chose to file.
      healthScore: number;
      healthLabel: HealthLabel;
      confidence?: number;
      notes?: string;
      photoUri?: string;
      inferredOnDevice: boolean;
      // Active-learning audit fields. predictedLabel is what the model said
      // first; correctedLabel is set only if the operator overrode it.
      predictedLabel?: HealthLabel;
      correctedLabel?: HealthLabel;
      modelVersion?: string;
      predictionSource?: PredictionSource;
    }) => {
      const optIn = useMlStore.getState().trainingOptIn;
      // Only contribute when the operator has opted in AND the verdict was
      // either confirmed by them (carries signal) or actively corrected.
      const contributedToTraining = optIn && !!input.photoUri && !!input.predictedLabel;
      const record: InspectionRecord = {
        id: inspectionId(),
        treeId: input.treeId,
        healthScore: input.healthScore,
        healthLabel: input.healthLabel,
        confidence: input.confidence,
        notes: input.notes,
        photoUri: input.photoUri,
        inferredOnDevice: input.inferredOnDevice,
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        synced: false,
        predictedLabel: input.predictedLabel,
        correctedLabel: input.correctedLabel,
        modelVersion: input.modelVersion,
        predictionSource: input.predictionSource,
        contributedToTraining,
      };
      await insertInspection(record);
      return record;
    },
    onSuccess: (r) => {
      void qc.invalidateQueries({ queryKey: TREES_KEY });
      void qc.invalidateQueries({ queryKey: TREE_DETAIL(r.treeId) });
      void qc.invalidateQueries({ queryKey: ['inspections', r.treeId] });
    },
  });
}

export const _newId = newId;
