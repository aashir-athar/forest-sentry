// Typed repos over the local SQLite — every offline-first feature talks here.
import type { IncidentRecord } from '@/src/features/incidents/types';
import type { InspectionRecord } from '@/src/features/inspections/types';
import type { TreeRecord } from '@/src/features/trees/types';
import type { ZoneRecord } from '@/src/features/zones/types';
import { getDb } from './database';

function nowIso(): string {
  return new Date().toISOString();
}

// Trees ---------------------------------------------------------------

export async function listTrees(): Promise<TreeRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    species: string;
    lat: number;
    lng: number;
    girth_cm: number | null;
    height_m: number | null;
    notes: string | null;
    photo_uri: string | null;
    last_health_score: number | null;
    last_health_label: string | null;
    zone_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    synced: number;
  }>('SELECT * FROM trees ORDER BY created_at DESC');
  return rows.map(rowToTree);
}

export async function getTree(id: string): Promise<TreeRecord | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<{
    id: string;
    species: string;
    lat: number;
    lng: number;
    girth_cm: number | null;
    height_m: number | null;
    notes: string | null;
    photo_uri: string | null;
    last_health_score: number | null;
    last_health_label: string | null;
    zone_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    synced: number;
  }>('SELECT * FROM trees WHERE id = ?', [id]);
  return row ? rowToTree(row) : null;
}

export async function upsertTree(t: TreeRecord): Promise<void> {
  const db = await getDb();
  const updatedAt = nowIso();
  await db.runAsync(
    `INSERT INTO trees (id, species, lat, lng, girth_cm, height_m, notes, photo_uri, last_health_score, last_health_label, zone_id, created_by, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       species=excluded.species, lat=excluded.lat, lng=excluded.lng, girth_cm=excluded.girth_cm,
       height_m=excluded.height_m, notes=excluded.notes, photo_uri=excluded.photo_uri,
       last_health_score=excluded.last_health_score, last_health_label=excluded.last_health_label,
       zone_id=excluded.zone_id, updated_at=excluded.updated_at, synced=excluded.synced`,
    [
      t.id,
      t.species,
      t.lat,
      t.lng,
      t.girthCm ?? null,
      t.heightM ?? null,
      t.notes ?? null,
      t.photoUri ?? null,
      t.lastHealthScore ?? null,
      t.lastHealthLabel ?? null,
      t.zoneId ?? null,
      t.createdBy ?? null,
      t.createdAt,
      updatedAt,
      t.synced ? 1 : 0,
    ],
  );
}

export async function markTreeSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE trees SET synced = 1 WHERE id = ?', [id]);
}

export async function unsyncedTrees(): Promise<TreeRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    species: string;
    lat: number;
    lng: number;
    girth_cm: number | null;
    height_m: number | null;
    notes: string | null;
    photo_uri: string | null;
    last_health_score: number | null;
    last_health_label: string | null;
    zone_id: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    synced: number;
  }>('SELECT * FROM trees WHERE synced = 0');
  return rows.map(rowToTree);
}

function rowToTree(r: {
  id: string;
  species: string;
  lat: number;
  lng: number;
  girth_cm: number | null;
  height_m: number | null;
  notes: string | null;
  photo_uri: string | null;
  last_health_score: number | null;
  last_health_label: string | null;
  zone_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  synced: number;
}): TreeRecord {
  return {
    id: r.id,
    species: r.species,
    lat: r.lat,
    lng: r.lng,
    girthCm: r.girth_cm ?? undefined,
    heightM: r.height_m ?? undefined,
    notes: r.notes ?? undefined,
    photoUri: r.photo_uri ?? undefined,
    lastHealthScore: r.last_health_score ?? undefined,
    lastHealthLabel: (r.last_health_label as TreeRecord['lastHealthLabel']) ?? undefined,
    zoneId: r.zone_id ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    synced: r.synced === 1,
  };
}

// Inspections ---------------------------------------------------------

type InspectionRow = {
  id: string;
  tree_id: string;
  health_score: number;
  health_label: string;
  confidence: number | null;
  notes: string | null;
  photo_uri: string | null;
  inferred_on_device: number;
  created_by: string | null;
  created_at: string;
  synced: number;
  predicted_label: string | null;
  corrected_label: string | null;
  model_version: string | null;
  prediction_source: string | null;
  contributed_to_training: number;
};

function rowToInspection(r: InspectionRow): InspectionRecord {
  return {
    id: r.id,
    treeId: r.tree_id,
    healthScore: r.health_score,
    healthLabel: r.health_label as InspectionRecord['healthLabel'],
    confidence: r.confidence ?? undefined,
    notes: r.notes ?? undefined,
    photoUri: r.photo_uri ?? undefined,
    inferredOnDevice: r.inferred_on_device === 1,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    synced: r.synced === 1,
    predictedLabel: (r.predicted_label ?? undefined) as InspectionRecord['predictedLabel'],
    correctedLabel: (r.corrected_label ?? undefined) as InspectionRecord['correctedLabel'],
    modelVersion: r.model_version ?? undefined,
    predictionSource: (r.prediction_source ?? undefined) as InspectionRecord['predictionSource'],
    contributedToTraining: r.contributed_to_training === 1,
  };
}

export async function listInspectionsForTree(treeId: string): Promise<InspectionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<InspectionRow>(
    'SELECT * FROM inspections WHERE tree_id = ? ORDER BY created_at DESC',
    [treeId],
  );
  return rows.map(rowToInspection);
}

export async function insertInspection(i: InspectionRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO inspections (
       id, tree_id, health_score, health_label, confidence, notes, photo_uri,
       inferred_on_device, created_by, created_at, synced,
       predicted_label, corrected_label, model_version, prediction_source, contributed_to_training
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      i.id,
      i.treeId,
      i.healthScore,
      i.healthLabel,
      i.confidence ?? null,
      i.notes ?? null,
      i.photoUri ?? null,
      i.inferredOnDevice ? 1 : 0,
      i.createdBy ?? null,
      i.createdAt,
      i.synced ? 1 : 0,
      i.predictedLabel ?? null,
      i.correctedLabel ?? null,
      i.modelVersion ?? null,
      i.predictionSource ?? null,
      i.contributedToTraining ? 1 : 0,
    ],
  );
  await db.runAsync(
    'UPDATE trees SET last_health_score = ?, last_health_label = ?, updated_at = ?, synced = 0 WHERE id = ?',
    [i.healthScore, i.healthLabel, i.createdAt, i.treeId],
  );
}

export async function unsyncedInspections(): Promise<InspectionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<InspectionRow>('SELECT * FROM inspections WHERE synced = 0');
  return rows.map(rowToInspection);
}

export async function markInspectionSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE inspections SET synced = 1 WHERE id = ?', [id]);
}

// Incidents -----------------------------------------------------------

type IncidentRow = {
  id: string;
  severity: string;
  lat: number;
  lng: number;
  inside_zone_id: string | null;
  notes: string | null;
  photo_uri: string | null;
  created_by: string | null;
  created_at: string;
  synced: number;
  predicted_severity: string | null;
  corrected_severity: string | null;
  model_version: string | null;
  ai_confidence: number | null;
  photo_classification_kind: string | null;
  contributed_to_training: number;
};

function rowToIncident(r: IncidentRow): IncidentRecord {
  return {
    id: r.id,
    severity: r.severity as IncidentRecord['severity'],
    lat: r.lat,
    lng: r.lng,
    insideZoneId: r.inside_zone_id ?? undefined,
    notes: r.notes ?? undefined,
    photoUri: r.photo_uri ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    synced: r.synced === 1,
    predictedSeverity: (r.predicted_severity ?? undefined) as IncidentRecord['predictedSeverity'],
    correctedSeverity: (r.corrected_severity ?? undefined) as IncidentRecord['correctedSeverity'],
    modelVersion: r.model_version ?? undefined,
    aiConfidence: r.ai_confidence ?? undefined,
    photoClassificationKind: (r.photo_classification_kind ?? undefined) as IncidentRecord['photoClassificationKind'],
    contributedToTraining: r.contributed_to_training === 1,
  };
}

export async function listIncidents(): Promise<IncidentRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<IncidentRow>('SELECT * FROM incidents ORDER BY created_at DESC');
  return rows.map(rowToIncident);
}

export async function insertIncident(i: IncidentRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO incidents (
       id, severity, lat, lng, inside_zone_id, notes, photo_uri, created_by, created_at, synced,
       predicted_severity, corrected_severity, model_version, ai_confidence, photo_classification_kind, contributed_to_training
     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      i.id,
      i.severity,
      i.lat,
      i.lng,
      i.insideZoneId ?? null,
      i.notes ?? null,
      i.photoUri ?? null,
      i.createdBy ?? null,
      i.createdAt,
      i.synced ? 1 : 0,
      i.predictedSeverity ?? null,
      i.correctedSeverity ?? null,
      i.modelVersion ?? null,
      i.aiConfidence ?? null,
      i.photoClassificationKind ?? null,
      i.contributedToTraining ? 1 : 0,
    ],
  );
}

export async function unsyncedIncidents(): Promise<IncidentRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<IncidentRow>('SELECT * FROM incidents WHERE synced = 0');
  return rows.map(rowToIncident);
}

export async function markIncidentSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE incidents SET synced = 1 WHERE id = ?', [id]);
}

// Zones --------------------------------------------------------------

export async function listZones(): Promise<ZoneRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    protection_level: string;
    boundary_json: string;
    area_hectares: number | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    synced: number;
  }>('SELECT * FROM zones ORDER BY name ASC');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    protectionLevel: r.protection_level as ZoneRecord['protectionLevel'],
    boundary: JSON.parse(r.boundary_json),
    areaHectares: r.area_hectares ?? undefined,
    notes: r.notes ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    synced: r.synced === 1,
  }));
}

export async function upsertZone(z: ZoneRecord): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO zones (id, name, protection_level, boundary_json, area_hectares, notes, created_by, created_at, updated_at, synced)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       name=excluded.name, protection_level=excluded.protection_level,
       boundary_json=excluded.boundary_json, area_hectares=excluded.area_hectares,
       notes=excluded.notes, updated_at=excluded.updated_at, synced=excluded.synced`,
    [
      z.id,
      z.name,
      z.protectionLevel,
      JSON.stringify(z.boundary),
      z.areaHectares ?? null,
      z.notes ?? null,
      z.createdBy ?? null,
      z.createdAt,
      z.updatedAt,
      z.synced ? 1 : 0,
    ],
  );
}

export async function unsyncedZones(): Promise<ZoneRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    protection_level: string;
    boundary_json: string;
    area_hectares: number | null;
    notes: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
    synced: number;
  }>('SELECT * FROM zones WHERE synced = 0');
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    protectionLevel: r.protection_level as ZoneRecord['protectionLevel'],
    boundary: JSON.parse(r.boundary_json),
    areaHectares: r.area_hectares ?? undefined,
    notes: r.notes ?? undefined,
    createdBy: r.created_by ?? undefined,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    synced: r.synced === 1,
  }));
}

export async function markZoneSynced(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE zones SET synced = 1 WHERE id = ?', [id]);
}

// Sync queue inspection ----------------------------------------------

export async function countsForSync(): Promise<{ trees: number; inspections: number; incidents: number; zones: number }> {
  const db = await getDb();
  const t = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM trees WHERE synced = 0');
  const i = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM inspections WHERE synced = 0');
  const c = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM incidents WHERE synced = 0');
  const z = await db.getFirstAsync<{ n: number }>('SELECT COUNT(*) as n FROM zones WHERE synced = 0');
  return { trees: t?.n ?? 0, inspections: i?.n ?? 0, incidents: c?.n ?? 0, zones: z?.n ?? 0 };
}
