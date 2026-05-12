import { listZones, upsertZone } from '@/src/db/repos';
import type { LatLng } from '@/src/lib/geo';
import { polygonCentroid } from '@/src/lib/geo';
import { zoneId } from '@/src/lib/id';
import { useAuthStore } from '@/src/stores/useAuthStore';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProtectionLevel, ZoneRecord } from './types';

export const ZONES_KEY = ['zones'] as const;

export function useZones() {
  return useQuery({ queryKey: ZONES_KEY, queryFn: listZones });
}

export function useCreateOrUpdateZone() {
  const qc = useQueryClient();
  const user = useAuthStore((s) => s.user);
  return useMutation({
    mutationFn: async (input: {
      id?: string;
      name: string;
      protectionLevel: ProtectionLevel;
      boundary: LatLng[];
      notes?: string;
    }) => {
      const now = new Date().toISOString();
      // Surveyor's polygon area (approx for KP-latitude scale): convert to local meters.
      const c = polygonCentroid(input.boundary);
      const mPerLat = 111_320;
      const mPerLng = 111_320 * Math.cos((c.lat * Math.PI) / 180);
      let s = 0;
      for (let i = 0, j = input.boundary.length - 1; i < input.boundary.length; j = i++) {
        const pi = input.boundary[i];
        const pj = input.boundary[j];
        if (!pi || !pj) continue;
        s += (pj.lng - pi.lng) * mPerLng * ((pi.lat + pj.lat) / 2) * mPerLat;
      }
      const areaHectares = Math.abs(s) / 20_000; // approx: 1 ha = 10_000 m^2
      const record: ZoneRecord = {
        id: input.id ?? zoneId(),
        name: input.name,
        protectionLevel: input.protectionLevel,
        boundary: input.boundary,
        areaHectares: Number.isFinite(areaHectares) ? areaHectares : undefined,
        notes: input.notes,
        createdBy: user?.id,
        createdAt: now,
        updatedAt: now,
        synced: false,
      };
      await upsertZone(record);
      return record;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ZONES_KEY });
    },
  });
}
