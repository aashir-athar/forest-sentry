// Local SQLite schema — the field session's source of truth.
// Supabase is the sync target, not the source while offline.
//
// Migration discipline: bump SCHEMA_VERSION and add a corresponding entry in
// the migrations table below. The runner in database.ts reads PRAGMA
// user_version and applies any migrations whose target version is higher.

export const SCHEMA_VERSION = 2;

export const SCHEMA_SQL = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS trees (
  id TEXT PRIMARY KEY NOT NULL,
  species TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  girth_cm REAL,
  height_m REAL,
  notes TEXT,
  photo_uri TEXT,
  last_health_score REAL,
  last_health_label TEXT,
  zone_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_trees_synced ON trees(synced);
CREATE INDEX IF NOT EXISTS idx_trees_created_at ON trees(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trees_zone ON trees(zone_id);

CREATE TABLE IF NOT EXISTS inspections (
  id TEXT PRIMARY KEY NOT NULL,
  tree_id TEXT NOT NULL,
  health_score REAL NOT NULL,
  health_label TEXT NOT NULL,
  confidence REAL,
  notes TEXT,
  photo_uri TEXT,
  inferred_on_device INTEGER NOT NULL DEFAULT 1,
  created_by TEXT,
  created_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  predicted_label TEXT,
  corrected_label TEXT,
  model_version TEXT,
  prediction_source TEXT,
  contributed_to_training INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (tree_id) REFERENCES trees(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_inspections_tree ON inspections(tree_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inspections_synced ON inspections(synced);
-- idx_inspections_training is created by the v2 migration after the
-- contributed_to_training column is added (it can't live here because
-- SCHEMA_SQL runs on every open against the *existing* table layout).

CREATE TABLE IF NOT EXISTS incidents (
  id TEXT PRIMARY KEY NOT NULL,
  severity TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  inside_zone_id TEXT,
  notes TEXT,
  photo_uri TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0,
  predicted_severity TEXT,
  corrected_severity TEXT,
  model_version TEXT,
  ai_confidence REAL,
  photo_classification_kind TEXT,
  contributed_to_training INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_incidents_synced ON incidents(synced);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
-- idx_incidents_training is created by the v2 migration (see comment above).

CREATE TABLE IF NOT EXISTS zones (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  protection_level TEXT NOT NULL,
  boundary_json TEXT NOT NULL,
  area_hectares REAL,
  notes TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  synced INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_zones_synced ON zones(synced);

CREATE TABLE IF NOT EXISTS sync_queue (
  id TEXT PRIMARY KEY NOT NULL,
  entity TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  payload TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  enqueued_at TEXT NOT NULL,
  last_attempt_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_entity ON sync_queue(entity, entity_id);
`;

// Idempotent per-statement migrations for upgrading existing installs from
// v1 → v2. ALTERs run first to add the new columns; then the indexes that
// reference them. Each step is wrapped in a try/catch at the call site so
// "duplicate column" / "index already exists" errors on already-migrated DBs
// are silently absorbed.
export const V2_ALTERS: readonly string[] = [
  `ALTER TABLE inspections ADD COLUMN predicted_label TEXT`,
  `ALTER TABLE inspections ADD COLUMN corrected_label TEXT`,
  `ALTER TABLE inspections ADD COLUMN model_version TEXT`,
  `ALTER TABLE inspections ADD COLUMN prediction_source TEXT`,
  `ALTER TABLE inspections ADD COLUMN contributed_to_training INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE incidents ADD COLUMN predicted_severity TEXT`,
  `ALTER TABLE incidents ADD COLUMN corrected_severity TEXT`,
  `ALTER TABLE incidents ADD COLUMN model_version TEXT`,
  `ALTER TABLE incidents ADD COLUMN ai_confidence REAL`,
  `ALTER TABLE incidents ADD COLUMN photo_classification_kind TEXT`,
  `ALTER TABLE incidents ADD COLUMN contributed_to_training INTEGER NOT NULL DEFAULT 0`,
  `CREATE INDEX IF NOT EXISTS idx_inspections_training ON inspections(contributed_to_training) WHERE contributed_to_training = 1`,
  `CREATE INDEX IF NOT EXISTS idx_incidents_training ON incidents(contributed_to_training) WHERE contributed_to_training = 1`,
];
