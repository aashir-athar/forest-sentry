// CSV + GeoJSON exporters — researchers ship local datasets to peers.
import type { IncidentRecord } from '@/src/features/incidents/types';
import type { TreeRecord } from '@/src/features/trees/types';
import type { ZoneRecord } from '@/src/features/zones/types';

export function treesToCsv(trees: TreeRecord[]): string {
  const header = ['id', 'species', 'lat', 'lng', 'girth_cm', 'height_m', 'health_score', 'notes', 'created_at'];
  const rows = trees.map((t) =>
    [
      t.id,
      t.species,
      t.lat,
      t.lng,
      t.girthCm ?? '',
      t.heightM ?? '',
      t.lastHealthScore ?? '',
      JSON.stringify(t.notes ?? ''),
      t.createdAt,
    ].join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function incidentsToCsv(items: IncidentRecord[]): string {
  const header = ['id', 'severity', 'lat', 'lng', 'inside_zone', 'notes', 'created_at', 'synced'];
  const rows = items.map((i) =>
    [
      i.id,
      i.severity,
      i.lat,
      i.lng,
      i.insideZoneId ?? '',
      JSON.stringify(i.notes ?? ''),
      i.createdAt,
      i.synced ? '1' : '0',
    ].join(','),
  );
  return [header.join(','), ...rows].join('\n');
}

export function zonesToGeoJSON(zones: ZoneRecord[]): string {
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: zones.map((z) => ({
        type: 'Feature',
        properties: { id: z.id, name: z.name, protectionLevel: z.protectionLevel },
        geometry: {
          type: 'Polygon',
          coordinates: [z.boundary.map((p) => [p.lng, p.lat])],
        },
      })),
    },
    null,
    2,
  );
}

export function treesToGeoJSON(trees: TreeRecord[]): string {
  return JSON.stringify(
    {
      type: 'FeatureCollection',
      features: trees.map((t) => ({
        type: 'Feature',
        properties: {
          id: t.id,
          species: t.species,
          girth_cm: t.girthCm,
          height_m: t.heightM,
          health: t.lastHealthScore,
          created_at: t.createdAt,
        },
        geometry: { type: 'Point', coordinates: [t.lng, t.lat] },
      })),
    },
    null,
    2,
  );
}
