import { insertIncident, listIncidents } from '@/src/db/repos';
import { incidentId } from '@/src/lib/id';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useMlStore } from '@/src/stores/useMlStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { IncidentRecord, IncidentSeverity, LoggingClassKind } from './types';

export const INCIDENTS_KEY = ['incidents'] as const;

export function useIncidents() {
  return useQuery({ queryKey: INCIDENTS_KEY, queryFn: listIncidents });
}

export function useReportIncident() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (input: {
      severity: IncidentSeverity;
      lat: number;
      lng: number;
      insideZoneId?: string;
      notes: string;
      photoUri?: string;
      // Active-learning audit fields. Filled in by the logging-detection
      // model when it exists; null today.
      predictedSeverity?: IncidentSeverity;
      correctedSeverity?: IncidentSeverity;
      modelVersion?: string;
      aiConfidence?: number;
      photoClassificationKind?: LoggingClassKind;
    }) => {
      const optIn = useMlStore.getState().trainingOptIn;
      const contributedToTraining = optIn && !!input.photoUri;
      const record: IncidentRecord = {
        id: incidentId(),
        severity: input.severity,
        lat: input.lat,
        lng: input.lng,
        insideZoneId: input.insideZoneId,
        notes: input.notes,
        photoUri: input.photoUri,
        createdBy: user?.id,
        createdAt: new Date().toISOString(),
        synced: false,
        predictedSeverity: input.predictedSeverity,
        correctedSeverity: input.correctedSeverity,
        modelVersion: input.modelVersion,
        aiConfidence: input.aiConfidence,
        photoClassificationKind: input.photoClassificationKind,
        contributedToTraining,
      };
      await insertIncident(record);
      return record;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: INCIDENTS_KEY });
    },
  });
}
