<div align="center">

<img src="https://raw.githubusercontent.com/aashir-athar/forest-sentry/feat/forest-sentry-v1-scaffold/mobile/assets/images/icon.png" alt="ForestSentry app icon — a stylised pine tree on a deep forest disc" width="120" height="120" />

# 🌲 ForestSentry

**On-device forest monitoring for the rangers who actually walk the trails.**

[![Stars](https://img.shields.io/github/stars/aashir-athar/forest-sentry?style=for-the-badge&logo=github&color=FFD33D)](https://github.com/aashir-athar/forest-sentry/stargazers)
[![License: MIT](https://img.shields.io/github/license/aashir-athar/forest-sentry?style=for-the-badge&color=2A5C45)](./LICENSE)
[![Last commit](https://img.shields.io/github/last-commit/aashir-athar/forest-sentry?style=for-the-badge&color=5A7F4A)](https://github.com/aashir-athar/forest-sentry/commits)
[![Top language](https://img.shields.io/github/languages/top/aashir-athar/forest-sentry?style=for-the-badge&color=3178C6)](https://github.com/aashir-athar/forest-sentry)
[![Issues](https://img.shields.io/github/issues/aashir-athar/forest-sentry?style=for-the-badge&color=D97706)](https://github.com/aashir-athar/forest-sentry/issues)

![Expo SDK 54](https://img.shields.io/badge/Expo-SDK_54-000020?style=flat-square&logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=flat-square&logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-Postgres_+_PostGIS-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![TensorFlow Lite](https://img.shields.io/badge/TensorFlow_Lite-on--device-FF6F00?style=flat-square&logo=tensorflow&logoColor=white)
![Platforms](https://img.shields.io/badge/platforms-iOS_%7C_Android-2A5C45?style=flat-square)

<a href="#-features"><strong>Features</strong></a> ·
<a href="#-getting-started"><strong>Getting Started</strong></a> ·
<a href="#-usage"><strong>Usage</strong></a> ·
<a href="https://github.com/aashir-athar/forest-sentry/issues"><strong>Report Bug</strong></a> ·
<a href="https://github.com/aashir-athar/forest-sentry/issues"><strong>Request Feature</strong></a>

</div>

---

**ForestSentry** is an **offline-first React Native app** for forest rangers and conservation researchers to tag trees, classify leaf health **on-device with TensorFlow Lite**, log illegal-logging incidents, and monitor protected zones with **PostGIS**. Built with WWF Pakistan for remote forests like Nathia Gali — where signal disappears but the case file still has to hold up. Open-source, Expo SDK 54, TypeScript strict, MIT.

> 🚧 **Active development** — V1 scaffold is feature-complete (tree registry, on-device classifier, incident reporting, zone polygons, offline sync, active-learning loop). Field data collection and production model training are in progress. See the [Roadmap](#️-roadmap).

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 📍 | **20-second tree registry** | GPS auto-captures; species, girth, and height in a single form. Photo optional. |
| 🍃 | **On-device leaf-health AI** | Bundled PlantVillage MobileNet (39-class → 4-bucket verdict) via `react-native-fast-tflite`. Deterministic HSV fallback keeps the flow working without the native module. |
| 🔁 | **Active-learning loop** | Operators confirm or correct every verdict; corrections feed a Supabase pipeline that retrains MobileNetV2 and ships improved models **OTA — no app-store release**. |
| 🚨 | **Incident reporting** | Observation / minor / serious / critical severity, with photo + GPS + notes. Queues offline. |
| 🗺️ | **PostGIS zone monitoring** | Draw polygons on the map; real-time inside/outside detection for protected zones. |
| 📈 | **Trend projection** | Linear regression + EMA over inspection history, rendered with Skia. |
| 📤 | **Dataset export** | CSV for spreadsheets, GeoJSON for QGIS — one tap. |
| 🧭 | **Offline-first by design** | SQLite is the source of truth; the sync engine drains to Supabase the moment signal returns. |
| ♿ | **Field-grade UX** | High-visibility sun mode, system/light/dark themes, skeleton loading, full a11y (role + label + hint, reduced-motion aware). |

---

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Expo SDK 54 (New Architecture), React Native 0.81 |
| **Language** | TypeScript (strict + `noUncheckedIndexedAccess`) |
| **Navigation** | expo-router (file-based, typed routes) |
| **UI / Motion** | react-native-reanimated 4, @shopify/flash-list v2, @shopify/react-native-skia, expo-image |
| **AI inference** | react-native-fast-tflite + jpeg-js (JPEG → RGB tensor) |
| **Training** | TensorFlow 2.16 / Keras, MobileNetV2 transfer learning, int8 TFLite (off-device, Colab) |
| **Local data** | expo-sqlite (WAL), @tanstack/react-query + AsyncStorage persister |
| **State / Forms** | zustand, react-hook-form + zod |
| **Maps** | react-native-maps (native MapView + polygons) |
| **Backend** | Supabase — Postgres + PostGIS + Storage, RLS-enforced |
| **Auth** | @supabase/supabase-js email OTP (6/8-digit code, no deep links) |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 20 (22 recommended)
- **Git**
- **Xcode 16** + iOS Simulator, or **Android Studio** + a Pixel emulator
- A **Supabase** project (free tier is fine)

### Installation

```bash
git clone https://github.com/aashir-athar/forest-sentry.git
cd forest-sentry/mobile
npm install
```

### Configure

```bash
cp .env.example .env
# fill in EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY
```

### Run

```bash
npx expo start
```

> For full Supabase setup, EAS builds, and store submission, see [`zero-to-deploy.md`](./zero-to-deploy.md).

---

## 📖 Usage

All scripts run inside `mobile/`.

```bash
npm run start      # Boot the Expo dev server
npm run ios        # Open the iOS simulator
npm run android    # Open the Android emulator
npm run web        # Web preview (for inspection)
npm run lint       # Run the Expo ESLint config
npx tsc --noEmit   # Strict TypeScript pass
```

<details>
<summary><strong>Active-learning loop: classify, correct, retrain, ship OTA</strong></summary>

1. **Settings → Training contribution → ON** (opt-in, off by default).
2. Tag a tree and open **Inspect a leaf** → take a photo.
3. The on-device classifier predicts a verdict (`healthy` / `stressed` / `diseased` / `pest-damaged`).
4. Confirm it, or tap a different pill to **correct** it — the diff is the training signal.
5. Local SQLite records `predicted_label`, `corrected_label`, and `model_version`; the sync engine pushes it to `public.training_samples_leaf` when signal returns.
6. Retrain MobileNetV2 with [`backend/training/train_leaf_health.py`](./backend/training/train_leaf_health.py), then promote the new model:

```sql
select public.wwf_model_promote('leaf-health-v1.1.0');
```

Every device downloads the new `.tflite` on next launch via `expo-file-system`. The bundled placeholder remains the offline-first cold-install fallback.

</details>

<details>
<summary><strong>Swap in your own WWF-trained classifier</strong></summary>

Overwrite `mobile/assets/models/leaf-health.tflite` with your `.tflite`, then update the `modelClasses` array and `BUCKETS` table in `mobile/src/features/inspections/labels.ts` to match your class order and bucket assignments. The classifier reads the model's declared input shape and dtype at load time — no other code changes required.

</details>

---

## 🗺️ Roadmap

- [x] **V1** — Tree registry, on-device classifier, incident reporting, zone polygons, offline sync
- [x] **V1** — Supabase backend with RLS, PostGIS, role helpers
- [x] **V1** — CSV / GeoJSON export, trend projection, high-visibility sun mode
- [x] **V1** — Active-learning loop: correction UI, training opt-in, `model_versions` registry, OTA downloads, Colab training script
- [ ] **V1.1** — Logging-detection model trainer (once a field corpus exists)
- [ ] **V1.1** — Vision Camera frame-processor TFLite (live leaf scan, no shutter)
- [ ] **V1.2** — Multi-language UI (Urdu, Pashto)
- [ ] **V2** — Predictive tree-health time series + incident-hotspot anomaly models
- [ ] **V2** — WatermelonDB and cluster rendering for very large datasets

---

## 🤝 Contributing

Contributions are very welcome — there's a [`good first issue`](https://github.com/aashir-athar/forest-sentry/labels/good%20first%20issue) label for newcomers, and the codebase is intentionally readable.

1. Fork the repo
2. Create a branch (`git checkout -b feat/your-thing`)
3. Commit using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`)
4. Push and open a PR against `main`

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details. If you're a botanist or forest scientist, the highest-impact contribution is a real `.tflite` leaf-health model — see [`mobile/assets/models/README.md`](./mobile/assets/models/README.md).

---

## 📄 License

Distributed under the **MIT License**. See [LICENSE](./LICENSE) for details.

---

## 👤 Author

**Aashir Athar**

[![GitHub](https://img.shields.io/badge/GitHub-aashir--athar-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aashir-athar)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-aashirathar-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/aashirathar/)
[![X](https://img.shields.io/badge/X_(Twitter)-aashirathar-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/aashirathar)

---

<div align="center">

If ForestSentry helps your conservation work, consider leaving a ⭐ — it helps other rangers and researchers find it.

<sub><strong>Keywords:</strong> react native offline-first app · expo sdk 54 starter · tensorflow lite leaf classifier mobile · on-device plant disease classifier · plantvillage mobilenet react native · active learning loop react native · supabase postgis react native · conservation field app open source · WWF forest monitoring tool · expo-router file-based navigation · react-native-fast-tflite example · on-device ML conservation · GPS tree registry · illegal logging incident reporting</sub>

<br/>

<sub>Built by <a href="https://github.com/aashir-athar">aashir-athar</a> · MIT Licensed</sub>

</div>
