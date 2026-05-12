// SQLite wrapper — opens a single shared database connection.
//
// Migration strategy uses SQLite's PRAGMA user_version: on every open we read
// the current version, apply any pending migration scripts in order, then bump
// user_version to the target. v1 → v2 adds the active-learning audit columns.
import * as SQLite from 'expo-sqlite';
import { errorReporter } from '@/src/lib/errorReporter';
import { SCHEMA_SQL, SCHEMA_VERSION, V2_ALTERS } from './schema';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function applyAltersTolerantly(db: SQLite.SQLiteDatabase, alters: readonly string[]): Promise<void> {
  for (const sql of alters) {
    try {
      await db.execAsync(sql);
    } catch (error) {
      // ALTER TABLE ... ADD COLUMN throws "duplicate column" if the column
      // already exists — that's expected on a fresh install (where the column
      // was already created by SCHEMA_SQL) and a no-op upgrade.
      const message = error instanceof Error ? error.message.toLowerCase() : '';
      if (!message.includes('duplicate column')) {
        errorReporter.warn('Migration ALTER failed (continuing).', { sql, error: message });
      }
    }
  }
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= SCHEMA_VERSION) return;

  if (current < 2) {
    await applyAltersTolerantly(db, V2_ALTERS);
  }

  await db.execAsync(`PRAGMA user_version = ${SCHEMA_VERSION}`);
}

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('forest-sentry.db');
      await db.execAsync(SCHEMA_SQL);
      await migrate(db);
      return db;
    })();
  }
  return dbPromise;
}

export async function resetDb(): Promise<void> {
  const db = await getDb();
  await db.execAsync(`
    DROP TABLE IF EXISTS sync_queue;
    DROP TABLE IF EXISTS incidents;
    DROP TABLE IF EXISTS inspections;
    DROP TABLE IF EXISTS trees;
    DROP TABLE IF EXISTS zones;
    PRAGMA user_version = 0;
  `);
  await db.execAsync(SCHEMA_SQL);
  await migrate(db);
}
