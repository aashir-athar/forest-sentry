import type { HealthLabel } from '@/src/features/trees/types';

export type PredictionSource = 'tflite' | 'heuristic' | 'manual';

export type InspectionRecord = {
  id: string;
  treeId: string;
  // healthLabel is the verdict the operator finally agreed to (after any
  // correction). It's what every downstream chart / record reads.
  healthLabel: HealthLabel;
  healthScore: number;
  confidence?: number;
  notes?: string;
  photoUri?: string;
  inferredOnDevice: boolean;
  createdBy?: string;
  createdAt: string;
  synced: boolean;
  // Active-learning audit trail. predictedLabel is what the model said first;
  // correctedLabel is set only when the operator overrode it. modelVersion
  // identifies which weights produced predictedLabel (lets the training job
  // weight recent corrections higher when retraining a specific generation).
  predictedLabel?: HealthLabel;
  correctedLabel?: HealthLabel;
  modelVersion?: string;
  predictionSource?: PredictionSource;
  contributedToTraining: boolean;
};
