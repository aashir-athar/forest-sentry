// Label map for the on-device leaf classifier.
//
// Bundled model: PlantVillage MobileNet (39 classes — 38 species/disease pairs
// plus a background class), sourced from
// github.com/akshayrana30/plant-disease-detection.
//
// The UI surfaces a 4-bucket verdict (healthy / stressed / diseased / pest), so
// every model class folds into one of those buckets via `bucketFor()`. When a
// custom WWF-trained model is dropped in, replace `modelClasses` with the new
// class order and re-bucket — the rest of the pipeline stays unchanged.
import type { HealthLabel } from '@/src/features/trees/types';

export type ModelClass = {
  index: number;
  raw: string;
  display: string;
  bucket: HealthLabel;
  species: string;
  condition: string;
};

export type ModelLabel = {
  index: number;
  key: HealthLabel;
  display: string;
};

// Bucket-level labels surfaced in the UI.
export const labelMap: ModelLabel[] = [
  { index: 0, key: 'healthy', display: 'Healthy' },
  { index: 1, key: 'stressed', display: 'Stressed' },
  { index: 2, key: 'diseased', display: 'Diseased' },
  { index: 3, key: 'pest', display: 'Pest damage' },
];

export const labelByKey: Record<HealthLabel, ModelLabel> = Object.fromEntries(
  labelMap.map((l) => [l.key, l]),
) as Record<HealthLabel, ModelLabel>;

// Buckets per PlantVillage class index. Order matches labels.txt shipped with
// the model — do not reorder.
const BUCKETS: HealthLabel[] = [
  'diseased', // 0  apple scab
  'diseased', // 1  apple black rot
  'diseased', // 2  apple cedar rust
  'healthy',  // 3  apple healthy
  'healthy',  // 4  blueberry healthy
  'diseased', // 5  cherry powdery mildew
  'healthy',  // 6  cherry healthy
  'diseased', // 7  corn cercospora leaf spot
  'diseased', // 8  corn common rust
  'diseased', // 9  corn northern leaf blight
  'healthy',  // 10 corn healthy
  'diseased', // 11 grape black rot
  'diseased', // 12 grape esca (black measles)
  'diseased', // 13 grape leaf blight
  'healthy',  // 14 grape healthy
  'diseased', // 15 orange huanglongbing (citrus greening)
  'diseased', // 16 peach bacterial spot
  'healthy',  // 17 peach healthy
  'diseased', // 18 pepper bell bacterial spot
  'healthy',  // 19 pepper bell healthy
  'diseased', // 20 potato early blight
  'diseased', // 21 potato late blight
  'healthy',  // 22 potato healthy
  'healthy',  // 23 raspberry healthy
  'healthy',  // 24 soybean healthy
  'diseased', // 25 squash powdery mildew
  'stressed', // 26 strawberry leaf scorch  (environmental stress)
  'healthy',  // 27 strawberry healthy
  'diseased', // 28 tomato bacterial spot
  'diseased', // 29 tomato early blight
  'diseased', // 30 tomato late blight
  'diseased', // 31 tomato leaf mold
  'diseased', // 32 tomato septoria leaf spot
  'pest',     // 33 tomato two-spotted spider mite
  'diseased', // 34 tomato target spot
  'diseased', // 35 tomato yellow leaf curl virus
  'diseased', // 36 tomato mosaic virus
  'healthy',  // 37 tomato healthy
  'healthy',  // 38 background  (no leaf in frame, default benign)
];

const RAW: { raw: string; species: string; condition: string; display: string }[] = [
  { raw: 'apple apple scab', species: 'Apple', condition: 'Apple scab', display: 'Apple — apple scab' },
  { raw: 'apple black rot', species: 'Apple', condition: 'Black rot', display: 'Apple — black rot' },
  { raw: 'apple cedar apple rust', species: 'Apple', condition: 'Cedar apple rust', display: 'Apple — cedar apple rust' },
  { raw: 'apple healthy', species: 'Apple', condition: 'Healthy', display: 'Apple — healthy' },
  { raw: 'blueberry healthy', species: 'Blueberry', condition: 'Healthy', display: 'Blueberry — healthy' },
  { raw: 'cherry including sour powdery mildew', species: 'Cherry', condition: 'Powdery mildew', display: 'Cherry — powdery mildew' },
  { raw: 'cherry including sour healthy', species: 'Cherry', condition: 'Healthy', display: 'Cherry — healthy' },
  { raw: 'corn maize cercospora leaf spot gray leaf spot', species: 'Corn', condition: 'Cercospora / gray leaf spot', display: 'Corn — gray leaf spot' },
  { raw: 'corn maize common rust', species: 'Corn', condition: 'Common rust', display: 'Corn — common rust' },
  { raw: 'corn maize northern leaf blight', species: 'Corn', condition: 'Northern leaf blight', display: 'Corn — northern leaf blight' },
  { raw: 'corn maize healthy', species: 'Corn', condition: 'Healthy', display: 'Corn — healthy' },
  { raw: 'grape black rot', species: 'Grape', condition: 'Black rot', display: 'Grape — black rot' },
  { raw: 'grape esca black measles', species: 'Grape', condition: 'Esca (black measles)', display: 'Grape — esca (black measles)' },
  { raw: 'grape leaf blight isariopsis leaf spot', species: 'Grape', condition: 'Leaf blight (isariopsis)', display: 'Grape — leaf blight' },
  { raw: 'grape healthy', species: 'Grape', condition: 'Healthy', display: 'Grape — healthy' },
  { raw: 'orange haunglongbing citrus greening', species: 'Orange', condition: 'Huanglongbing (citrus greening)', display: 'Orange — citrus greening' },
  { raw: 'peach bacterial spot', species: 'Peach', condition: 'Bacterial spot', display: 'Peach — bacterial spot' },
  { raw: 'peach healthy', species: 'Peach', condition: 'Healthy', display: 'Peach — healthy' },
  { raw: 'pepper bell bacterial spot', species: 'Pepper (bell)', condition: 'Bacterial spot', display: 'Pepper — bacterial spot' },
  { raw: 'pepper bell healthy', species: 'Pepper (bell)', condition: 'Healthy', display: 'Pepper — healthy' },
  { raw: 'potato early blight', species: 'Potato', condition: 'Early blight', display: 'Potato — early blight' },
  { raw: 'potato late blight', species: 'Potato', condition: 'Late blight', display: 'Potato — late blight' },
  { raw: 'potato healthy', species: 'Potato', condition: 'Healthy', display: 'Potato — healthy' },
  { raw: 'raspberry healthy', species: 'Raspberry', condition: 'Healthy', display: 'Raspberry — healthy' },
  { raw: 'soybean healthy', species: 'Soybean', condition: 'Healthy', display: 'Soybean — healthy' },
  { raw: 'squash powdery mildew', species: 'Squash', condition: 'Powdery mildew', display: 'Squash — powdery mildew' },
  { raw: 'strawberry leaf scorch', species: 'Strawberry', condition: 'Leaf scorch', display: 'Strawberry — leaf scorch' },
  { raw: 'strawberry healthy', species: 'Strawberry', condition: 'Healthy', display: 'Strawberry — healthy' },
  { raw: 'tomato bacterial spot', species: 'Tomato', condition: 'Bacterial spot', display: 'Tomato — bacterial spot' },
  { raw: 'tomato early blight', species: 'Tomato', condition: 'Early blight', display: 'Tomato — early blight' },
  { raw: 'tomato late blight', species: 'Tomato', condition: 'Late blight', display: 'Tomato — late blight' },
  { raw: 'tomato leaf mold', species: 'Tomato', condition: 'Leaf mold', display: 'Tomato — leaf mold' },
  { raw: 'tomato septoria leaf spot', species: 'Tomato', condition: 'Septoria leaf spot', display: 'Tomato — septoria leaf spot' },
  { raw: 'tomato spider mites two spotted spider mite', species: 'Tomato', condition: 'Two-spotted spider mite', display: 'Tomato — spider mites' },
  { raw: 'tomato target spot', species: 'Tomato', condition: 'Target spot', display: 'Tomato — target spot' },
  { raw: 'tomato tomato yellow leaf curl virus', species: 'Tomato', condition: 'Yellow leaf curl virus', display: 'Tomato — yellow leaf curl virus' },
  { raw: 'tomato tomato mosaic virus', species: 'Tomato', condition: 'Mosaic virus', display: 'Tomato — mosaic virus' },
  { raw: 'tomato healthy', species: 'Tomato', condition: 'Healthy', display: 'Tomato — healthy' },
  { raw: 'background', species: 'Background', condition: 'No leaf detected', display: 'Background — no leaf detected' },
];

export const modelClasses: ModelClass[] = RAW.map((r, i) => {
  const bucket = BUCKETS[i];
  if (!bucket) {
    throw new Error(`Missing bucket for model class index ${i}`);
  }
  return {
    index: i,
    raw: r.raw,
    display: r.display,
    bucket,
    species: r.species,
    condition: r.condition,
  };
});

export const MODEL_CLASS_COUNT = modelClasses.length;

export function bucketFor(index: number): HealthLabel {
  return modelClasses[index]?.bucket ?? 'healthy';
}

export function classFor(index: number): ModelClass | undefined {
  return modelClasses[index];
}

// Fold a length-N probability vector into a length-4 bucket distribution.
export function foldBuckets(probs: readonly number[]): Record<HealthLabel, number> {
  const out: Record<HealthLabel, number> = { healthy: 0, stressed: 0, diseased: 0, pest: 0 };
  for (let i = 0; i < probs.length && i < modelClasses.length; i++) {
    const p = probs[i] ?? 0;
    const bucket = bucketFor(i);
    out[bucket] += p;
  }
  return out;
}
