import type { LatLng } from '@/src/lib/geo';

export type ProtectionLevel = 'monitor' | 'restricted' | 'core';

export type ZoneRecord = {
  id: string;
  name: string;
  protectionLevel: ProtectionLevel;
  boundary: LatLng[];
  areaHectares?: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  synced: boolean;
};
