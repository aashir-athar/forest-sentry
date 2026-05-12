export type IncidentSeverity = 'observation' | 'minor' | 'serious' | 'critical';

// Coarse classes the future logging-detection model emits. The mobile app
// stores these alongside severity so the training pipeline can learn the
// photo → severity mapping when enough labelled records accumulate.
export type LoggingClassKind = 'clean' | 'stump' | 'fresh-cut' | 'equipment' | 'piled-timber';

export type IncidentRecord = {
  id: string;
  // severity is the operator's filed verdict — the canonical column every
  // downstream chart / report reads.
  severity: IncidentSeverity;
  lat: number;
  lng: number;
  insideZoneId?: string;
  notes?: string;
  photoUri?: string;
  createdBy?: string;
  createdAt: string;
  synced: boolean;
  // Active-learning audit trail. predictedSeverity is what the model said
  // first; correctedSeverity is set when the operator overrode it. Both null
  // until the logging-detection model exists; mobile pipeline ready for it.
  predictedSeverity?: IncidentSeverity;
  correctedSeverity?: IncidentSeverity;
  modelVersion?: string;
  aiConfidence?: number;
  photoClassificationKind?: LoggingClassKind;
  contributedToTraining: boolean;
};
