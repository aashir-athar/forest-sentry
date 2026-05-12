# ForestSentry — Training Pipeline

The active-learning loop that turns operator-corrected field photos into a better TFLite model. This directory holds the scripts that the WWF data team runs (weekly, monthly, or on-demand) to retrain ForestSentry's on-device classifiers from real Supabase records.

The training pipeline is **off-device**. It pulls labelled samples from Supabase, fine-tunes a MobileNetV2 head, quantizes to int8 TFLite, uploads the model to Supabase Storage, and registers a new row in `public.model_versions` with `status='staging'`. A researcher promotes it to `production` in the SQL Editor. The mobile app's [model registry](../../mobile/src/features/ml/modelRegistry.ts) polls on launch, downloads the new model to `expo-file-system`, and the inspect screen starts using it the next time a leaf photo is captured.

---

## What's here

| File | What it does |
|---|---|
| `train_leaf_health.py` | End-to-end training script for the leaf-health classifier. Pulls `training_samples_leaf`, fine-tunes MobileNetV2, int8 quantizes, uploads, registers. |
| `README.md` | This file. |

> The logging-detection model trainer (`train_logging_detection.py`) lands when the `training_samples_logging` view has enough operator-corrected incident photos to train on (target: 200+ samples per class). Same script shape, different label space.

## Prerequisites

You need:

1. **A Supabase service-role key.** The training views are gated to researchers; only the service role bypasses RLS. Keep this key in a secret manager — never check it into git.
2. **Python 3.11 with TensorFlow 2.16+ and the Supabase client.**
   ```sh
   pip install supabase pillow numpy tensorflow tflite-support
   ```
   On Google Colab, TensorFlow is pre-installed — only `supabase` and `tflite-support` need installing.
3. **At least 40 operator-confirmed leaf-health samples** (10 per class minimum). The script bails politely below this threshold.

## How to train (Google Colab)

1. Open a new Colab notebook.
2. Upload `train_leaf_health.py` or paste it into a cell.
3. Set environment variables (use Colab's "Secrets" tab so they don't leak in shared notebooks):
   ```python
   import os
   os.environ["SUPABASE_URL"] = "https://<project-ref>.supabase.co"
   os.environ["SUPABASE_SERVICE_ROLE_KEY"] = "<service-role-key>"
   os.environ["MODEL_TAG"] = "leaf-health-v1.1.0"
   ```
4. Install deps and run:
   ```python
   !pip -q install supabase pillow tflite-support
   %run train_leaf_health.py
   ```

You'll see:

- Sample count by class
- Train / val split sizes
- Per-epoch loss + accuracy for the head phase, then the fine-tune phase
- Final `val_accuracy`
- A confirmation that the model was uploaded and registered

The new model lands in Supabase as `status='staging'` — invisible to mobile clients until a researcher promotes it.

## How to train locally

Same flow without Colab:

```sh
cd backend/training
export SUPABASE_URL="https://<project-ref>.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="<service-role-key>"
export MODEL_TAG="leaf-health-v1.1.0"
python -m venv .venv && source .venv/bin/activate
pip install supabase pillow numpy tensorflow tflite-support
python train_leaf_health.py
```

GPU is nice-to-have but not required for transfer learning on a few hundred samples — CPU runs the whole pipeline in 5–15 minutes.

## How to promote a staged model

In the Supabase SQL Editor, signed in as a researcher:

```sql
select public.wwf_model_promote('leaf-health-v1.1.0');
```

`wwf_model_promote` (defined in [`0004_active_learning.sql`](../migrations/0004_active_learning.sql)) does two things atomically:

1. Sets every currently-`production` row of the same `kind` to `status='retired'`.
2. Sets the named row to `status='production'` with the current `auth.uid()` recorded.

The mobile app picks up the new model on the next launch (or via pull-to-refresh on the Settings → AI engine row in V1.1).

## How to roll back

If a freshly promoted model misbehaves in the field, retire it and re-promote the previous version:

```sql
select public.wwf_model_retire('leaf-health-v1.1.0');
select public.wwf_model_promote('leaf-health-v1.0.0');
```

Devices download the older model on next launch.

## Schema reference

The training pipeline reads from these Supabase objects (all defined in [`0004_active_learning.sql`](../migrations/0004_active_learning.sql)):

| Object | Purpose |
|---|---|
| `training_samples_leaf` (view) | Per-photo training rows derived from operator-corrected inspections where `contributed_to_training = true` |
| `training_samples_logging` (view) | Same shape for incident photos (logging-detection model) |
| `model_versions` (table) | Registry of trained model artifacts; `status` controls what mobile clients pick up |
| `wwf_model_promote(model_id)` | Atomic promote-with-retire-previous helper |
| `wwf_model_retire(model_id)` | Manual retire helper |

## Privacy & data handling

- The training script only reads rows that operators explicitly opted into via the **Settings → Training contribution** toggle. The opt-in flag flows through `inspections.contributed_to_training` and `incidents.contributed_to_training`.
- Photos in the `training-photos` storage bucket should have their EXIF GPS stripped client-side before upload (per the brief's "no operator identity leakage" guidance). The mobile upload helper does this; do not bypass it.
- Never check the service-role key into git. Use Colab Secrets, GitHub Actions Secrets, or a vault.

## Roadmap

- [x] V1 — Leaf-health classifier trainer, manual promote
- [ ] V1.1 — Logging-detection trainer (`train_logging_detection.py`) once corpus exists
- [ ] V1.2 — Automatic nightly retraining via GitHub Actions + admin Slack notification on staged models
- [ ] V2 — Predictive (time-series of tree health) and anomaly (incident hotspots) trainers; need 6+ months of accumulated field data first
