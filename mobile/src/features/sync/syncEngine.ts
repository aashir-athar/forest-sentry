// Sync engine — drains unsynced local rows to Supabase in dependency order.
// Idempotent: every row has a stable client-generated UUID-shaped ID, upserts by PK.
import { supabase } from '@/src/api/supabaseClient';
import {
  countsForSync,
  markIncidentSynced,
  markInspectionSynced,
  markTreeSynced,
  markZoneSynced,
  unsyncedIncidents,
  unsyncedInspections,
  unsyncedTrees,
  unsyncedZones,
} from '@/src/db/repos';
import { errorReporter } from '@/src/lib/errorReporter';

export type SyncResult = {
  attempted: number;
  succeeded: number;
  failed: number;
  errors: string[];
};

export async function drainSyncQueue(): Promise<SyncResult> {
  const result: SyncResult = { attempted: 0, succeeded: 0, failed: 0, errors: [] };

  // No-op when there is no authenticated session. Records stay queued locally
  // and will drain on the next reconnect after the user signs in. This also
  // suppresses the noisy first-run errors when Supabase migrations haven't
  // been applied yet.
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session) {
    return result;
  }

  // Order matters: zones → trees → inspections → incidents.
  const zones = await unsyncedZones();
  for (const z of zones) {
    result.attempted++;
    try {
      const { error } = await supabase.from('zones').upsert({
        id: z.id,
        name: z.name,
        protection_level: z.protectionLevel,
        boundary: z.boundary,
        area_hectares: z.areaHectares ?? null,
        notes: z.notes ?? null,
        created_by: z.createdBy ?? null,
        created_at: z.createdAt,
        updated_at: z.updatedAt,
      });
      if (error) throw error;
      await markZoneSynced(z.id);
      result.succeeded++;
    } catch (error) {
      result.failed++;
      result.errors.push(error instanceof Error ? error.message : String(error));
      errorReporter.capture(error, { entity: 'zone', id: z.id });
    }
  }

  const trees = await unsyncedTrees();
  for (const t of trees) {
    result.attempted++;
    try {
      const { error } = await supabase.from('trees').upsert({
        id: t.id,
        species: t.species,
        lat: t.lat,
        lng: t.lng,
        girth_cm: t.girthCm ?? null,
        height_m: t.heightM ?? null,
        notes: t.notes ?? null,
        photo_uri: t.photoUri ?? null,
        last_health_score: t.lastHealthScore ?? null,
        last_health_label: t.lastHealthLabel ?? null,
        zone_id: t.zoneId ?? null,
        created_by: t.createdBy ?? null,
        created_at: t.createdAt,
        updated_at: t.updatedAt,
      });
      if (error) throw error;
      await markTreeSynced(t.id);
      result.succeeded++;
    } catch (error) {
      result.failed++;
      result.errors.push(error instanceof Error ? error.message : String(error));
      errorReporter.capture(error, { entity: 'tree', id: t.id });
    }
  }

  const inspections = await unsyncedInspections();
  for (const i of inspections) {
    result.attempted++;
    try {
      const { error } = await supabase.from('inspections').upsert({
        id: i.id,
        tree_id: i.treeId,
        health_score: i.healthScore,
        health_label: i.healthLabel,
        confidence: i.confidence ?? null,
        notes: i.notes ?? null,
        photo_uri: i.photoUri ?? null,
        inferred_on_device: i.inferredOnDevice,
        created_by: i.createdBy ?? null,
        created_at: i.createdAt,
        predicted_label: i.predictedLabel ?? null,
        corrected_label: i.correctedLabel ?? null,
        model_version: i.modelVersion ?? null,
        prediction_source: i.predictionSource ?? null,
        contributed_to_training: i.contributedToTraining,
      });
      if (error) throw error;
      await markInspectionSynced(i.id);
      result.succeeded++;
    } catch (error) {
      result.failed++;
      result.errors.push(error instanceof Error ? error.message : String(error));
      errorReporter.capture(error, { entity: 'inspection', id: i.id });
    }
  }

  const incidents = await unsyncedIncidents();
  for (const ic of incidents) {
    result.attempted++;
    try {
      const { error } = await supabase.from('incidents').upsert({
        id: ic.id,
        severity: ic.severity,
        lat: ic.lat,
        lng: ic.lng,
        inside_zone_id: ic.insideZoneId ?? null,
        notes: ic.notes ?? null,
        photo_uri: ic.photoUri ?? null,
        created_by: ic.createdBy ?? null,
        created_at: ic.createdAt,
        predicted_severity: ic.predictedSeverity ?? null,
        corrected_severity: ic.correctedSeverity ?? null,
        model_version: ic.modelVersion ?? null,
        ai_confidence: ic.aiConfidence ?? null,
        photo_classification_kind: ic.photoClassificationKind ?? null,
        contributed_to_training: ic.contributedToTraining,
      });
      if (error) throw error;
      await markIncidentSynced(ic.id);
      result.succeeded++;
    } catch (error) {
      result.failed++;
      result.errors.push(error instanceof Error ? error.message : String(error));
      errorReporter.capture(error, { entity: 'incident', id: ic.id });
    }
  }

  return result;
}

export { countsForSync };
