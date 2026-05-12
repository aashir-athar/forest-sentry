// On-device leaf-health classifier.
//
// Two paths:
//   (1) Real TFLite inference via `react-native-fast-tflite` against the bundled
//       PlantVillage MobileNet at `mobile/assets/models/leaf-health.tflite`.
//       Decodes the JPEG to a pixel tensor, shapes it to the model's declared
//       input (NHWC, uint8 or float32), runs inference, softmaxes if needed,
//       then folds the 39-class output into 4 buckets via labels.ts.
//   (2) Deterministic HSV byte-fingerprint heuristic — last-resort fallback if
//       the model fails to load or inference throws.
//
// Drop a replacement `.tflite` at the same path and update labels.ts to swap
// models; nothing else in this file needs to change.

import type { HealthLabel } from '@/src/features/trees/types';
import { activeModelPath, activeModelVersion } from '@/src/features/ml/modelRegistry';
import { errorReporter } from '@/src/lib/errorReporter';
import { decode as decodeJpeg } from 'jpeg-js';
import * as FileSystem from 'expo-file-system/legacy';
import * as ImageManipulator from 'expo-image-manipulator';
import {
  bucketFor,
  classFor,
  foldBuckets,
  labelByKey,
  MODEL_CLASS_COUNT,
  type ModelClass,
} from './labels';

export type ClassifyResult = {
  label: HealthLabel;
  display: string;
  score: number;
  confidence: number;
  source: 'tflite' | 'heuristic';
  // Model identity for the audit trail. Empty string for the heuristic path.
  modelVersion: string;
  raw: Record<HealthLabel, number>;
  topClass?: { index: number; display: string; species: string; condition: string; probability: number };
};

type TFLiteTensorInfo = {
  readonly name?: string;
  readonly dataType: 'uint8' | 'int8' | 'float32' | 'float16' | 'int16' | 'int32' | 'int64' | string;
  readonly shape: readonly number[];
};

type TFLiteModel = {
  readonly inputs: readonly TFLiteTensorInfo[];
  readonly outputs: readonly TFLiteTensorInfo[];
  runSync: (inputs: readonly (Uint8Array | Int8Array | Float32Array)[]) => readonly (Uint8Array | Int8Array | Float32Array | number[])[];
};

let loadedModel: TFLiteModel | null = null;
let loadedFromPath: string | null = null;
let modelTried = false;
let modelInputSize = 224;

// Reset the cached model reference whenever the registry installs a newer
// version on this device, so the next inference picks up fresh weights.
export function resetClassifierCache(): void {
  loadedModel = null;
  loadedFromPath = null;
  modelTried = false;
}

async function tryLoadModel(): Promise<TFLiteModel | null> {
  // If the active model on disk changed (e.g. OTA update finished mid-session)
  // re-load instead of serving stale weights.
  const fsPath = activeModelPath('leaf-health')?.tflite;
  if (modelTried && loadedFromPath !== (fsPath ?? null)) {
    resetClassifierCache();
  }
  if (modelTried) return loadedModel;
  modelTried = true;

  try {
    const { loadTensorflowModel } = await import('react-native-fast-tflite');
    let model: TFLiteModel | null = null;

    // 1) Prefer the OTA-downloaded model from expo-file-system.
    if (fsPath) {
      try {
        const info = await FileSystem.getInfoAsync(fsPath);
        if (info.exists && info.size && info.size > 0) {
          model = (await loadTensorflowModel({ url: fsPath } as never, [])) as unknown as TFLiteModel;
          loadedFromPath = fsPath;
        }
      } catch (error) {
        errorReporter.warn('OTA model load failed; falling back to bundled.', {
          path: fsPath,
          reason: error instanceof Error ? error.message : 'unknown',
        });
      }
    }

    // 2) Fall back to the bundled placeholder shipped with the app binary.
    if (!model) {
      let asset: unknown;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        asset = require('../../../assets/models/leaf-health.tflite');
      } catch {
        errorReporter.info('No bundled TFLite model found; using heuristic classifier.');
        return null;
      }
      if (!asset) return null;
      model = (await loadTensorflowModel(asset as never, [])) as unknown as TFLiteModel;
      loadedFromPath = null;
    }

    const inShape = model.inputs[0]?.shape ?? [];
    const edge = inShape[1] ?? inShape[2] ?? 224;
    if (edge > 0 && edge < 2048) {
      modelInputSize = edge;
    }
    loadedModel = model;
    return model;
  } catch (error) {
    errorReporter.info('TFLite model load failed; using heuristic classifier.', {
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return null;
  }
}

async function resizeToBase64(uri: string, edge: number): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: edge, height: edge } }],
    { compress: 0.92, format: ImageManipulator.SaveFormat.JPEG, base64: true },
  );
  if (!result.base64) {
    throw new Error('Image decode produced no base64 payload.');
  }
  return result.base64;
}

function base64ToUint8Array(b64: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const bin = globalThis.atob(b64);
    const out = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
    return out;
  }
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = b64.replace(/=+$/, '');
  const out = new Uint8Array(Math.floor((clean.length * 3) / 4));
  let p = 0;
  for (let i = 0, bs = 0, bc = 0; i < clean.length; i++) {
    const idx = chars.indexOf(clean.charAt(i));
    if (idx === -1) continue;
    bs = bc % 4 ? bs * 64 + idx : idx;
    bc++;
    if (bc % 4) {
      out[p++] = 0xff & (bs >> ((-2 * bc) & 6));
    }
  }
  return out.slice(0, p);
}

type DecodedFrame = { rgba: Uint8Array; width: number; height: number };

function decodeJpegToRgba(jpegBytes: Uint8Array): DecodedFrame {
  const decoded = decodeJpeg(jpegBytes, { useTArray: true });
  return { rgba: decoded.data, width: decoded.width, height: decoded.height };
}

function buildUint8Input(rgba: Uint8Array, channels: number): Uint8Array {
  // rgba is length W*H*4 (RGBA). Strip alpha if model expects 3 channels.
  if (channels === 4) return rgba;
  const px = rgba.length / 4;
  const out = new Uint8Array(px * channels);
  for (let i = 0, j = 0; i < rgba.length; i += 4, j += channels) {
    out[j] = rgba[i] ?? 0;
    out[j + 1] = rgba[i + 1] ?? 0;
    out[j + 2] = rgba[i + 2] ?? 0;
  }
  return out;
}

function buildFloat32Input(rgba: Uint8Array, channels: number, scale: 'unit' | 'centered'): Float32Array {
  const px = rgba.length / 4;
  const out = new Float32Array(px * channels);
  if (scale === 'unit') {
    for (let i = 0, j = 0; i < rgba.length; i += 4, j += channels) {
      out[j] = (rgba[i] ?? 0) / 255;
      out[j + 1] = (rgba[i + 1] ?? 0) / 255;
      out[j + 2] = (rgba[i + 2] ?? 0) / 255;
    }
  } else {
    for (let i = 0, j = 0; i < rgba.length; i += 4, j += channels) {
      out[j] = ((rgba[i] ?? 0) - 127.5) / 127.5;
      out[j + 1] = ((rgba[i + 1] ?? 0) - 127.5) / 127.5;
      out[j + 2] = ((rgba[i + 2] ?? 0) - 127.5) / 127.5;
    }
  }
  return out;
}

function softmax(scores: readonly number[]): number[] {
  if (scores.length === 0) return [];
  let max = -Infinity;
  for (const s of scores) if (s > max) max = s;
  const exps = scores.map((s) => Math.exp(s - max));
  let sum = 0;
  for (const e of exps) sum += e;
  if (sum === 0) return exps.map(() => 1 / exps.length);
  return exps.map((e) => e / sum);
}

function looksLikeProbabilityDistribution(values: readonly number[]): boolean {
  if (values.length === 0) return false;
  let sum = 0;
  let outOfRange = 0;
  for (const v of values) {
    sum += v;
    if (v < -0.001 || v > 1.001) outOfRange++;
  }
  return outOfRange === 0 && Math.abs(sum - 1) < 0.05;
}

function pickTopClass(probs: readonly number[]): { index: number; score: number } {
  let best = 0;
  let bestScore = -Infinity;
  for (let i = 0; i < probs.length; i++) {
    const v = probs[i] ?? 0;
    if (v > bestScore) {
      bestScore = v;
      best = i;
    }
  }
  return { index: best, score: bestScore };
}

function pickBucketWinner(raw: Record<HealthLabel, number>): { label: HealthLabel; score: number } {
  let label: HealthLabel = 'healthy';
  let best = -Infinity;
  for (const l of Object.keys(raw) as HealthLabel[]) {
    const v = raw[l];
    if (v > best) {
      best = v;
      label = l;
    }
  }
  return { label, score: best };
}

function rgbToHsv(r: number, g: number, b: number): { h: number; s: number; v: number } {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === rn) h = ((gn - bn) / d) % 6;
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

type HeuristicFingerprint = {
  meanH: number;
  meanS: number;
  meanV: number;
  greenDominance: number;
  brownDominance: number;
  yellowDominance: number;
  variance: number;
};

function fingerprintFromRgba(rgba: Uint8Array): HeuristicFingerprint {
  let sumH = 0;
  let sumS = 0;
  let sumV = 0;
  let greenCount = 0;
  let brownCount = 0;
  let yellowCount = 0;
  let total = 0;
  let prevG = 0;
  let variance = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    const r = rgba[i] ?? 0;
    const g = rgba[i + 1] ?? 0;
    const b = rgba[i + 2] ?? 0;
    const hsv = rgbToHsv(r, g, b);
    sumH += hsv.h;
    sumS += hsv.s;
    sumV += hsv.v;
    variance += (g - prevG) * (g - prevG);
    prevG = g;
    if (hsv.h >= 75 && hsv.h <= 165 && hsv.s > 0.18) greenCount++;
    if (hsv.h >= 20 && hsv.h <= 50 && hsv.s > 0.18 && hsv.v < 0.7) brownCount++;
    if (hsv.h >= 40 && hsv.h <= 70 && hsv.s > 0.22 && hsv.v > 0.5) yellowCount++;
    total++;
  }
  if (total === 0) {
    return { meanH: 0, meanS: 0, meanV: 0, greenDominance: 0, brownDominance: 0, yellowDominance: 0, variance: 0 };
  }
  return {
    meanH: sumH / total,
    meanS: sumS / total,
    meanV: sumV / total,
    greenDominance: greenCount / total,
    brownDominance: brownCount / total,
    yellowDominance: yellowCount / total,
    variance: variance / total / (255 * 255),
  };
}

function heuristicScores(fp: HeuristicFingerprint): Record<HealthLabel, number> {
  const healthy = 0.6 * fp.greenDominance + 0.25 * fp.meanS + 0.15 * (1 - fp.brownDominance);
  const stressed = 0.45 * fp.yellowDominance + 0.25 * (1 - fp.meanV) + 0.20 * (1 - fp.greenDominance) + 0.10 * fp.variance;
  const diseased = 0.55 * fp.brownDominance + 0.25 * (1 - fp.greenDominance) + 0.20 * fp.variance;
  const pest = 0.40 * fp.variance + 0.25 * (1 - fp.greenDominance) + 0.25 * fp.brownDominance + 0.10 * fp.yellowDominance;
  const probs = softmax([healthy * 6, stressed * 5, diseased * 5, pest * 4.5]);
  return {
    healthy: probs[0] ?? 0,
    stressed: probs[1] ?? 0,
    diseased: probs[2] ?? 0,
    pest: probs[3] ?? 0,
  };
}

function tensorValuesToArray(out: Uint8Array | Int8Array | Float32Array | number[]): number[] {
  if (Array.isArray(out)) return out as number[];
  const arr = new Array<number>(out.length);
  for (let i = 0; i < out.length; i++) arr[i] = out[i] ?? 0;
  return arr;
}

export async function classifyLeafPhoto(uri: string): Promise<ClassifyResult> {
  const model = await tryLoadModel();
  const edge = model ? modelInputSize : 64;
  const b64 = await resizeToBase64(uri, edge);
  const jpegBytes = base64ToUint8Array(b64);
  const frame = decodeJpegToRgba(jpegBytes);

  if (model) {
    try {
      const input = model.inputs[0];
      const inShape = input?.shape ?? [1, edge, edge, 3];
      const channels = inShape[3] ?? 3;
      const dtype = input?.dataType ?? 'uint8';

      let tensor: Uint8Array | Float32Array;
      if (dtype === 'float32' || dtype === 'float16') {
        // PlantVillage / Teachable-Machine MobileNets trained on Keras use
        // centered normalization. Plain ImageNet pipelines use unit. Try
        // centered first since the bundled model is Teachable-Machine derived.
        tensor = buildFloat32Input(frame.rgba, channels, 'centered');
      } else {
        tensor = buildUint8Input(frame.rgba, channels);
      }

      const outputs = model.runSync([tensor]);
      const head = outputs[0];
      if (!head) throw new Error('Empty TFLite output.');
      const values = tensorValuesToArray(head);

      // Quantized uint8/int8 outputs are 0..255 ints; convert to a normalized
      // probability distribution via softmax. Float models that already emit
      // probabilities are passed through unchanged.
      let probs: number[];
      if (looksLikeProbabilityDistribution(values)) {
        probs = values.slice(0, MODEL_CLASS_COUNT);
      } else {
        probs = softmax(values.slice(0, MODEL_CLASS_COUNT));
      }

      const top = pickTopClass(probs);
      const cls: ModelClass | undefined = classFor(top.index);
      const buckets = foldBuckets(probs);
      const { label, score } = pickBucketWinner(buckets);
      return {
        label,
        display: labelByKey[label]?.display ?? label,
        score,
        confidence: Math.max(0, Math.min(1, score)),
        source: 'tflite',
        modelVersion: activeModelVersion('leaf-health') ?? 'bundled-placeholder',
        raw: buckets,
        topClass: cls
          ? {
              index: cls.index,
              display: cls.display,
              species: cls.species,
              condition: cls.condition,
              probability: top.score,
            }
          : undefined,
      };
    } catch (error) {
      errorReporter.warn('TFLite inference failed; falling back to heuristic.', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  const fp = fingerprintFromRgba(frame.rgba);
  const raw = heuristicScores(fp);
  const { label, score } = pickBucketWinner(raw);
  return {
    label,
    display: labelByKey[label]?.display ?? label,
    score,
    confidence: Math.max(0.55, Math.min(0.92, score)),
    source: 'heuristic',
    modelVersion: '',
    raw,
  };
}

export async function probeClassifier(): Promise<{
  available: boolean;
  source: 'tflite' | 'heuristic';
  inputSize?: number;
  dtype?: string;
  classCount?: number;
}> {
  const model = await tryLoadModel();
  if (!model) return { available: false, source: 'heuristic' };
  const input = model.inputs[0];
  const output = model.outputs[0];
  return {
    available: true,
    source: 'tflite',
    inputSize: modelInputSize,
    dtype: input?.dataType,
    classCount: output?.shape[output.shape.length - 1] ?? MODEL_CLASS_COUNT,
  };
}

export async function fileInfo(uri: string): Promise<{ exists: boolean; size?: number }> {
  try {
    const info = await FileSystem.getInfoAsync(uri);
    return { exists: info.exists, size: info.exists ? info.size : undefined };
  } catch {
    return { exists: false };
  }
}
