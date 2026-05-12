export type HealthLabel = 'healthy' | 'stressed' | 'diseased' | 'pest';

export type TreeRecord = {
  id: string;
  species: string;
  lat: number;
  lng: number;
  girthCm?: number;
  heightM?: number;
  notes?: string;
  photoUri?: string;
  lastHealthScore?: number;
  lastHealthLabel?: HealthLabel;
  zoneId?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
};
