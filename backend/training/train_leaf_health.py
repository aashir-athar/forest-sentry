"""
ForestSentry — Leaf-health model trainer.

Pulls operator-corrected inspection samples from Supabase, fine-tunes a
MobileNetV2 head, quantizes to int8 TFLite, uploads the model + labels JSON
to Supabase Storage, and inserts a new row in `public.model_versions` with
status='staging'. A researcher promotes it to 'production' in the dashboard
when validation accuracy looks healthy.

Designed to run in Google Colab end-to-end. Sections are marked with `# %%`
so VS Code / Jupyter splits them into cells; in Colab paste the file or use
`!python train_leaf_health.py` after uploading.

Requirements (Colab pre-installed except supabase + tflite-support):
    pip install supabase pillow numpy tensorflow tflite-support

Environment variables (set in Colab via os.environ or a .env file):
    SUPABASE_URL                — your project URL
    SUPABASE_SERVICE_ROLE_KEY   — service role key (bypasses RLS to read view)
    MODEL_TAG                   — semver-ish version tag, e.g. "leaf-health-v1.2.0"
"""

# %% Imports
from __future__ import annotations

import io
import json
import os
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
import tensorflow as tf
from PIL import Image
from supabase import Client, create_client

# %% Configuration
SUPABASE_URL = os.environ["SUPABASE_URL"]
SUPABASE_KEY = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
MODEL_TAG    = os.environ.get("MODEL_TAG", f"leaf-health-{int(time.time())}")

IMAGE_SIZE  = (224, 224)
BATCH_SIZE  = 32
EPOCHS_HEAD = 8
EPOCHS_FT   = 6
LR_HEAD     = 1e-3
LR_FT       = 1e-5
SEED        = 42
WORKDIR     = Path("workdir")
WORKDIR.mkdir(exist_ok=True)

# The four buckets the mobile app surfaces — must match `labels.ts` BUCKETS.
CLASSES: list[str] = ["healthy", "stressed", "diseased", "pest"]
CLASS_TO_IDX = {c: i for i, c in enumerate(CLASSES)}

# %% Supabase client
print(f"[ForestSentry] Connecting to {SUPABASE_URL}")
client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# %% Pull operator-corrected training samples
@dataclass
class Sample:
    inspection_id: str
    photo_path: str  # local filesystem path
    label_idx: int


def fetch_samples() -> list[Sample]:
    """Read `training_samples_leaf` view, download every photo to ./workdir/photos."""
    print("[ForestSentry] Fetching training samples…")
    rows = client.table("training_samples_leaf").select("*").execute().data
    print(f"[ForestSentry] {len(rows)} candidate samples")

    photo_dir = WORKDIR / "photos"
    photo_dir.mkdir(exist_ok=True)

    out: list[Sample] = []
    for row in rows:
        label = row["label"]
        if label not in CLASS_TO_IDX:
            continue
        photo_uri = row["photo_uri"]
        if not photo_uri:
            continue
        # photo_uri shapes: 'tree-photos/<filename>' or full Supabase Storage URL.
        local = photo_dir / f"{row['inspection_id']}.jpg"
        if not local.exists():
            try:
                if photo_uri.startswith("http"):
                    import urllib.request
                    urllib.request.urlretrieve(photo_uri, local)
                else:
                    bucket, _, key = photo_uri.partition("/")
                    blob = client.storage.from_(bucket).download(key)
                    local.write_bytes(blob)
            except Exception as exc:
                print(f"  ! skip {row['inspection_id']}: {exc}")
                continue
        out.append(Sample(row["inspection_id"], str(local), CLASS_TO_IDX[label]))
    print(f"[ForestSentry] {len(out)} usable samples after downloads")
    return out


samples = fetch_samples()
if len(samples) < 40:
    print("Not enough samples to train responsibly. Need at least 10 per class.")
    sys.exit(0)


# %% Build a tf.data pipeline from in-memory paths/labels
def load_image(path: tf.Tensor, label: tf.Tensor) -> tuple[tf.Tensor, tf.Tensor]:
    raw = tf.io.read_file(path)
    img = tf.io.decode_image(raw, channels=3, expand_animations=False)
    img = tf.image.resize(img, IMAGE_SIZE)
    img = tf.cast(img, tf.float32)
    return img, label


def make_dataset(items: Iterable[Sample], training: bool) -> tf.data.Dataset:
    paths  = tf.constant([s.photo_path for s in items])
    labels = tf.constant([s.label_idx  for s in items], dtype=tf.int32)
    ds = tf.data.Dataset.from_tensor_slices((paths, labels))
    ds = ds.shuffle(len(paths), seed=SEED) if training else ds
    ds = ds.map(load_image, num_parallel_calls=tf.data.AUTOTUNE)
    if training:
        ds = ds.map(
            lambda x, y: (tf.image.random_flip_left_right(x), y),
            num_parallel_calls=tf.data.AUTOTUNE,
        )
    return ds.batch(BATCH_SIZE).prefetch(tf.data.AUTOTUNE)


# %% Split 80/20 stratified by class
rng = np.random.default_rng(SEED)
by_class: dict[int, list[Sample]] = {i: [] for i in range(len(CLASSES))}
for s in samples:
    by_class[s.label_idx].append(s)

train, val = [], []
for i, group in by_class.items():
    rng.shuffle(group)
    cut = max(1, int(0.8 * len(group)))
    train += group[:cut]
    val   += group[cut:]
rng.shuffle(train)
print(f"[ForestSentry] train={len(train)}  val={len(val)}")
train_ds = make_dataset(train, training=True)
val_ds   = make_dataset(val,   training=False)


# %% Build MobileNetV2 + new head
backbone = tf.keras.applications.MobileNetV2(
    input_shape=(*IMAGE_SIZE, 3), include_top=False, weights="imagenet",
)
backbone.trainable = False

inputs  = tf.keras.Input(shape=(*IMAGE_SIZE, 3))
x       = tf.keras.applications.mobilenet_v2.preprocess_input(inputs)
x       = backbone(x, training=False)
x       = tf.keras.layers.GlobalAveragePooling2D()(x)
x       = tf.keras.layers.Dropout(0.25)(x)
outputs = tf.keras.layers.Dense(len(CLASSES), activation="softmax")(x)
model   = tf.keras.Model(inputs, outputs)
model.compile(
    optimizer=tf.keras.optimizers.Adam(LR_HEAD),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)


# %% Train head, then fine-tune top of backbone
print("[ForestSentry] Phase 1 — head only")
model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_HEAD, verbose=2)

print("[ForestSentry] Phase 2 — fine-tune top block")
backbone.trainable = True
for layer in backbone.layers[:-30]:
    layer.trainable = False
model.compile(
    optimizer=tf.keras.optimizers.Adam(LR_FT),
    loss="sparse_categorical_crossentropy",
    metrics=["accuracy"],
)
history = model.fit(train_ds, validation_data=val_ds, epochs=EPOCHS_FT, verbose=2)
val_acc = float(history.history["val_accuracy"][-1])
print(f"[ForestSentry] Final val_accuracy = {val_acc:.4f}")


# %% Convert to int8 quantized TFLite
def representative_dataset():
    for batch, _ in train_ds.take(32):
        for img in batch:
            yield [tf.expand_dims(img, axis=0)]


converter = tf.lite.TFLiteConverter.from_keras_model(model)
converter.optimizations = [tf.lite.Optimize.DEFAULT]
converter.representative_dataset = representative_dataset
converter.target_spec.supported_ops = [tf.lite.OpsSet.TFLITE_BUILTINS_INT8]
converter.inference_input_type  = tf.uint8
converter.inference_output_type = tf.uint8
tflite_bytes = converter.convert()

tflite_path = WORKDIR / f"{MODEL_TAG}.tflite"
labels_path = WORKDIR / f"{MODEL_TAG}-labels.json"
tflite_path.write_bytes(tflite_bytes)
labels_path.write_text(
    json.dumps(
        {
            "kind": "leaf-health",
            "tag": MODEL_TAG,
            "input_size": IMAGE_SIZE[0],
            "classes": [
                {"index": i, "key": c, "display": c.capitalize(), "bucket": c}
                for i, c in enumerate(CLASSES)
            ],
        },
        indent=2,
    )
)
print(f"[ForestSentry] Wrote {tflite_path} ({tflite_path.stat().st_size / 1024:.1f} KB)")


# %% Upload to Supabase Storage and register the version
TFLITE_KEY = f"models/{MODEL_TAG}.tflite"
LABELS_KEY = f"models/{MODEL_TAG}-labels.json"
BUCKET     = "training-photos"  # reuse, or create a dedicated 'models' bucket

print("[ForestSentry] Uploading to Supabase Storage…")
client.storage.from_(BUCKET).upload(TFLITE_KEY, tflite_bytes, {"contentType": "application/octet-stream"})
client.storage.from_(BUCKET).upload(LABELS_KEY, labels_path.read_bytes(), {"contentType": "application/json"})

tflite_url = client.storage.from_(BUCKET).get_public_url(TFLITE_KEY)
labels_url = client.storage.from_(BUCKET).get_public_url(LABELS_KEY)

print("[ForestSentry] Inserting model_versions row (status=staging)…")
client.table("model_versions").insert(
    {
        "id": MODEL_TAG,
        "kind": "leaf-health",
        "tag": MODEL_TAG,
        "tflite_url": tflite_url,
        "labels_url": labels_url,
        "sample_count": len(train) + len(val),
        "validation_acc": val_acc,
        "status": "staging",
        "notes": f"Trained on {len(train)+len(val)} samples; head+top-30 fine-tune; int8 quantized.",
    }
).execute()

print(f"[ForestSentry] Done. Promote with:\n  select public.wwf_model_promote('{MODEL_TAG}');")
