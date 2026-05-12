# Zero to Deploy — ForestSentry

A pragmatic, step-by-step path from a fresh machine to a production App Store / Play Store release plus OTA updates.

> All `mobile/`-prefixed commands run inside `forest-sentry/mobile/`. All `backend/`-prefixed commands run from `forest-sentry/backend/` or the Supabase dashboard.

---

## 0. One-time machine setup

### macOS
```sh
# Node + tooling
brew install node@22 git
brew install --cask cursor   # or VS Code, JetBrains Fleet, etc.
# iOS toolchain
xcode-select --install
# Xcode 16+ from the Mac App Store. After install:
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
# Android toolchain
brew install --cask android-studio
# In Android Studio: SDK Manager → install Android 14 (API 34) + Build Tools 35.0
# Add to ~/.zshrc:
#   export ANDROID_HOME=$HOME/Library/Android/sdk
#   export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
# Java (required by Android builds)
brew install --cask zulu@17
# Expo + EAS CLI
npm install -g eas-cli
# Supabase CLI (optional but recommended)
brew install supabase/tap/supabase
```

### Windows
```powershell
# Node + tooling
winget install OpenJS.NodeJS.LTS Git.Git Microsoft.VisualStudioCode
# Android toolchain
winget install Google.AndroidStudio
# In Android Studio: SDK Manager → Android 14 (API 34) + Build Tools 35.0
# Set ANDROID_HOME and add platform-tools/emulator to PATH
# Java
winget install Azul.Zulu.17.JDK
# Expo + EAS CLI
npm install -g eas-cli
# Supabase CLI (optional)
scoop install supabase   # or download from https://github.com/supabase/cli/releases
```

iOS builds require macOS. Use **EAS Build cloud** to ship to the App Store from Windows.

---

## 1. Clone and install

```sh
git clone https://github.com/aashir-athar/forest-sentry.git
cd forest-sentry/mobile
npm install
cp .env.example .env
```

Fill `.env` with your Supabase project values (created in section 2):
```
EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
EXPO_PUBLIC_APP_ENV=development
```

---

## 2. Supabase project

1. Create a project at <https://supabase.com>. Region: Singapore or Mumbai for South-Asia pilots.
2. Copy the **Project URL** and **anon public key** into `.env`.
3. Apply the SQL migrations in order:
   ```sh
   cd ../backend
   supabase login
   supabase link --project-ref <project-ref>
   supabase db push
   ```
   Or paste each `migrations/0001_schema.sql`, `0002_rls.sql`, `0003_helpers.sql`, `0004_active_learning.sql` into the Supabase **SQL editor** in order.
4. Create the three **Storage buckets**:
   - `tree-photos` — see `backend/storage/buckets.md`
   - `incident-photos` — see `backend/storage/buckets.md`
   - `training-photos` — private bucket for the active-learning loop; policies at the bottom of `0004_active_learning.sql`
   Apply each bucket's storage policies.
5. Email OTP is enabled by default. Edit **Authentication → Email Templates → Magic Link** so the body renders `{{ .Token }}` prominently — the app verifies the code in-place rather than handling deep-link URLs.

The database starts empty by design — `backend/seed.sql` is intentionally a no-op so every record in the system is captured in the field by an authenticated WWF operator. Field rangers draw their own zones via the Zone Editor inside the app.

### Promote your first researcher

```sql
select public.wwf_admin_promote('field-lead@wwfpak.org');
```

### Assign a ranger to a zone

After a ranger has drawn a zone in the app and it has synced to Supabase, copy its zone ID and run:

```sql
select public.wwf_admin_assign('ranger.alia@wwfpak.org', '<zone-id>');
```

### Promote (or roll back) an ML model

After the training pipeline runs (see `backend/training/README.md`), promote a staged model to production so every device picks it up on next launch:

```sql
select public.wwf_model_promote('leaf-health-v1.1.0');
```

To roll back to an earlier version:

```sql
select public.wwf_model_retire('leaf-health-v1.1.0');
select public.wwf_model_promote('leaf-health-v1.0.0');
```

The mobile app's model registry polls `public.model_versions` on every launch and downloads the new `.tflite` + labels JSON into `expo-file-system`. The bundled placeholder model stays as the offline-first fallback for cold installs.

### Verify the active-learning loop (smoke test)

Run this end-to-end check after migrations + bucket + first sign-in. Each step should succeed without errors in the dev console.

1. In the app, open **Settings → Training contribution** and toggle it **ON**.
2. Tap **Trees → Add** (or the home-screen "Tag a tree" CTA). Save a new tree with any species (GPS auto-captures).
3. Open **Inspect a leaf** from the tree detail screen. Take a photo of any leaf (or pick one from the library).
4. The model returns a verdict (e.g. "Healthy" with the bundled placeholder).
5. In the **Confirm verdict** card, tap a *different* pill — say "Stressed". You should see the override note: "Override: model said healthy, you filed stressed."
6. Tap **Log correction**. Toast: "Inspection logged (corrected) — Thanks, your correction goes to the next training cycle."
7. Wait for the sync queue to drain (Settings → Sync debug shows 0 pending).
8. In Supabase **Table Editor → inspections**, find your record. It should have:
   - `predicted_label = 'healthy'`
   - `corrected_label = 'stressed'`
   - `health_label = 'stressed'` (canonical filed verdict, what every downstream chart reads)
   - `model_version = 'bundled-placeholder'` (or your trained-model tag if you've promoted one)
   - `prediction_source = 'tflite'` or `'heuristic'`
   - `contributed_to_training = true`
9. Verify the training view picks it up:
   ```sql
   select inspection_id, label, predicted_label
     from public.training_samples_leaf;
   ```
   Your row should appear with `label = 'stressed'` and `predicted_label = 'healthy'`.

If steps 1–9 all pass, the active-learning loop is live. Every operator correction from this point on is fuel for the next training run.

---

## 3. Run the dev server

```sh
cd forest-sentry/mobile
npx expo start
```

- Press `i` for iOS simulator, `a` for Android emulator, or scan the QR with **Expo Go** on a physical device.
- Expo Go works for everything except the TFLite native module — see section 4 for a dev client.

---

## 4. Build a dev client (required for TFLite)

`react-native-fast-tflite` and `react-native-maps` are native modules. Expo Go can't run them — you need a custom **dev client**.

```sh
cd forest-sentry/mobile
npx eas login
npx eas init --id <auto>          # creates an EAS project
npx eas build --profile development --platform ios       # or --platform android
```

Install the resulting `.ipa` / `.apk` on your test device, then run:
```sh
npx expo start --dev-client
```

---

## 5. Drop in the production TFLite model (WWF custom model)

1. Save the trained model as `mobile/assets/models/leaf-health.tflite`.
2. If your class index order differs from `healthy / stressed / diseased / pest`, edit `mobile/src/features/inspections/labels.ts`.
3. Re-run the dev client build (the file is bundled as a Metro asset, not a native asset, so a JS rebuild is enough for OTA — see section 8).

The mobile app auto-detects the bundled model at runtime; if it can't load, it falls back to the heuristic without crashing.

---

## 6. App config (one-time, before production builds)

`app.json` ships ready for `expo-router` / `react-native-fast-tflite` / `expo-sqlite`. Before your first production build, edit it once to:

1. Change `ios.bundleIdentifier` from the default to your reverse-DNS, e.g. `org.wwfpak.forestsentry`.
2. Change `android.package` likewise, e.g. `org.wwfpak.forestsentry`.
3. Replace `assets/images/icon.png`, `splash-icon.png`, and the Android adaptive icon trio with your own (generate from `mobile/assets/icon-prompts.md` via Nano Banana Pro, then strip the chroma-green background).
4. Set `ios.infoPlist.NSCameraUsageDescription`, `NSLocationWhenInUseUsageDescription`, `NSPhotoLibraryUsageDescription` to user-facing strings explaining usage. Example values:
   - Camera: `"Capture leaves and incident evidence for the field record."`
   - Location: `"Pin tree records and detect protected-zone presence."`
   - Photo library: `"Attach an existing leaf or incident photo to a record."`

These are the only manual edits `app.json` needs. Everything else is auto-wired by `npx expo install`.

---

## 7. Production builds with EAS

`mobile/eas.json` already defines three profiles: `development`, `preview`, `production`.

### iOS

```sh
cd forest-sentry/mobile
npx eas credentials                 # walks you through Apple signing
npx eas build --profile production --platform ios
npx eas submit --profile production --platform ios   # submits to App Store Connect
```

Before `eas submit`, fill the `submit.production.ios` block in `eas.json`:
- `ascAppId` — App Store Connect app ID
- `appleTeamId` — Apple Developer team ID

### Android

```sh
cd forest-sentry/mobile
npx eas credentials                 # generates the upload key
npx eas build --profile production --platform android
npx eas submit --profile production --platform android   # submits to Play Console
```

Save your Google Play service account JSON as `forest-sentry/mobile/pc-api-service-account.json` (gitignored) — `eas.json` already points at it.

---

## 8. OTA updates with EAS Update

```sh
cd forest-sentry/mobile
npx eas update:configure
npx eas update --branch production --message "v1.0.1 — better stressed-class threshold"
```

The mobile app is already wired to `expo-updates`; users on a matching runtime version get the new bundle on next launch.

---

## 9. Operations checklist

- [ ] Monitor Supabase **Database → Logs** for slow queries; PostGIS GIST indexes are in place but custom queries on `inspections` may need additional indexes at scale.
- [ ] Set up Supabase **Auth → Rate limits** to a sensible value (default is fine for a pilot).
- [ ] Configure Supabase **Storage → Lifecycle rules** to expire dev-bucket photos after 30 days if you have a separate dev project.
- [ ] Back up the database weekly via `supabase db dump`.
- [ ] Rotate the anon key every six months; the JS client will pick the new one up via `.env` + EAS Secrets.

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Metro: Unable to resolve "react-native-fast-tflite"` | running in Expo Go | Build a dev client (section 4) |
| Map shows a gray rectangle on iOS | missing API key (only Android needs an actual key) | iOS uses Apple Maps by default, no key required |
| "TFLite model not available" toast | no `.tflite` bundled yet | Either bundle one (section 5) or rely on the heuristic |
| Magic-link email never arrives | redirect URL not allowlisted | Section 2, step 6 |
| `relation "zones" does not exist` | migrations not applied | Re-run `supabase db push` |
| Photos upload but never show in researcher view | storage RLS missing | Apply the policies in `backend/storage/buckets.md` |

---

## 11. Where to put EAS environment secrets

For anything sensitive (Supabase service-role key, future API tokens), use EAS Secrets — not `.env`:

```sh
eas secret:create --name SUPABASE_SERVICE_ROLE_KEY --value <key> --scope project
```

Only the **anon public** key belongs in `.env` (it's safe to ship to mobile clients because RLS gates every row).

---

That's it. Cold-start a contributor takes ~25 minutes from `git clone` to "first tree tagged on a simulator." A real field pilot — Supabase project, custom icon, signed iOS build, dev devices in hand — is one focused afternoon.
