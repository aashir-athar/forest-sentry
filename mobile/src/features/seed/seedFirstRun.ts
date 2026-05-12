// One-shot local-DB cleanup.
//
// Earlier app versions pre-populated a Nathia Gali demo zone, three sample
// trees, and twelve sample inspections on first launch, and the now-removed
// demo sign-in flow could create records under `demo-ranger` / `demo-researcher`
// pseudo-users. Real WWF deployments should start with an empty database, so
// this routine deletes every record that was authored by the seed (createdBy
// IS NULL) or by the deprecated demo flow (createdBy LIKE 'demo-%').
//
// Runs at most once per install (gated by an AsyncStorage flag) and is a
// no-op on installs that never had the demo data to begin with.
import AsyncStorage from '@react-native-async-storage/async-storage';

const CLEANUP_FLAG = 'forest-sentry:db:demo-cleanup:v1';

export async function seedFirstRun(): Promise<{ seeded: boolean; cleaned: boolean }> {
  const already = await AsyncStorage.getItem(CLEANUP_FLAG);
  if (already) return { seeded: false, cleaned: false };

  const { getDb } = await import('@/src/db/database');
  const db = await getDb();

  // Dependency order: child rows first so foreign keys (if any) stay sane.
  await db.runAsync("DELETE FROM inspections WHERE created_by IS NULL OR created_by LIKE 'demo-%'");
  await db.runAsync("DELETE FROM incidents   WHERE created_by IS NULL OR created_by LIKE 'demo-%'");
  await db.runAsync("DELETE FROM trees       WHERE created_by IS NULL OR created_by LIKE 'demo-%'");
  await db.runAsync("DELETE FROM zones       WHERE created_by IS NULL OR created_by LIKE 'demo-%'");

  await AsyncStorage.setItem(CLEANUP_FLAG, '1');
  return { seeded: false, cleaned: true };
}
