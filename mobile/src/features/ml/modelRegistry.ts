// Model registry — polls Supabase for newer model versions, downloads the
// .tflite + labels JSON to expo-file-system, and updates the ML store so the
// classifier loads them on the next inference.
//
// V1 behaviour: pull-on-launch (called from _layout.tsx after sign-in). The
// download is best-effort — failure falls back to the bundled placeholder
// model and the previously-cached FS model.
import { supabase } from '@/src/api/supabaseClient';
import { errorReporter } from '@/src/lib/errorReporter';
import { type ActiveModel, type ModelKind, useMlStore } from '@/src/stores/useMlStore';
import * as FileSystem from 'expo-file-system/legacy';

type ModelVersionRow = {
  id: string;
  kind: ModelKind;
  tag: string;
  tflite_url: string | null;
  labels_url: string | null;
  trained_at: string;
  sample_count: number;
  validation_acc: number | null;
  status: 'staging' | 'production' | 'retired';
};

const MODELS_DIR = `${FileSystem.documentDirectory ?? ''}forest-sentry/models/`;

async function ensureModelsDir(): Promise<void> {
  const info = await FileSystem.getInfoAsync(MODELS_DIR);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(MODELS_DIR, { intermediates: true });
  }
}

function localFileFor(kind: ModelKind, id: string, extension: 'tflite' | 'json'): string {
  return `${MODELS_DIR}${kind}-${id}.${extension}`;
}

async function downloadIfMissing(url: string, dest: string): Promise<boolean> {
  const info = await FileSystem.getInfoAsync(dest);
  if (info.exists && info.size && info.size > 0) return true;
  const res = await FileSystem.downloadAsync(url, dest);
  return res.status >= 200 && res.status < 300;
}

// Fetch the currently-production model for every kind. Returns the rows so
// downstream code can diff against what's already on disk.
async function fetchProductionRows(): Promise<ModelVersionRow[]> {
  const { data, error } = await supabase
    .from('model_versions')
    .select('id, kind, tag, tflite_url, labels_url, trained_at, sample_count, validation_acc, status')
    .eq('status', 'production')
    .order('trained_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ModelVersionRow[];
}

// Best-effort sync. Never throws — every failure path falls back to the
// previously-cached model (or the bundled asset for first-runs).
export async function syncModelRegistry(): Promise<{ updated: ModelKind[] }> {
  const updated: ModelKind[] = [];
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session) return { updated };

    await ensureModelsDir();
    const rows = await fetchProductionRows();
    const seenKinds = new Set<ModelKind>();
    const store = useMlStore.getState();

    for (const row of rows) {
      // Take only the newest production row per kind.
      if (seenKinds.has(row.kind)) continue;
      seenKinds.add(row.kind);

      const current = store.activeModels[row.kind];
      if (current?.id === row.id) continue;

      // Stats-only models (predictive / anomaly) ship without a .tflite — we
      // still record the active version so the training pipeline can target
      // matching weights when one is added later.
      const tflitePath = row.tflite_url ? localFileFor(row.kind, row.id, 'tflite') : '';
      const labelsPath = row.labels_url ? localFileFor(row.kind, row.id, 'json') : '';

      try {
        if (row.tflite_url) {
          const ok = await downloadIfMissing(row.tflite_url, tflitePath);
          if (!ok) {
            errorReporter.warn('TFLite download returned non-2xx; skipping model.', { id: row.id, kind: row.kind });
            continue;
          }
        }
        if (row.labels_url) {
          await downloadIfMissing(row.labels_url, labelsPath);
        }

        const active: ActiveModel = {
          id: row.id,
          kind: row.kind,
          tag: row.tag,
          localPath: tflitePath,
          labelsLocalPath: labelsPath,
          trainedAt: row.trained_at,
          sampleCount: row.sample_count,
          validationAcc: row.validation_acc ?? undefined,
        };
        store.setActiveModel(row.kind, active);
        updated.push(row.kind);
      } catch (error) {
        errorReporter.warn('Model download failed; keeping previous version.', {
          id: row.id,
          kind: row.kind,
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    useMlStore.getState().markRegistryChecked();
  } catch (error) {
    errorReporter.info('Model registry sync skipped.', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
  }
  return { updated };
}

// Helper for the classifier — returns the local TFLite path for the active
// model of a kind, or null when the bundled asset should be used.
export function activeModelPath(kind: ModelKind): { tflite: string; labels: string } | null {
  const model = useMlStore.getState().activeModels[kind];
  if (!model || !model.localPath) return null;
  return { tflite: model.localPath, labels: model.labelsLocalPath };
}

export function activeModelVersion(kind: ModelKind): string | undefined {
  return useMlStore.getState().activeModels[kind]?.tag;
}
