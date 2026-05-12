// Time-sortable IDs for offline-first records that need to round-trip with Postgres.
// Uses ULID-style timestamp prefix + random suffix for human-glanceable order in lists.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ALPHABET_LEN = ALPHABET.length;

function randomChar(): string {
  return ALPHABET[Math.floor(Math.random() * ALPHABET_LEN)] ?? '0';
}

export function newId(prefix?: string): string {
  const ts = Date.now().toString(36).toUpperCase().padStart(9, '0');
  let suffix = '';
  for (let i = 0; i < 10; i++) suffix += randomChar();
  return prefix ? `${prefix}_${ts}${suffix}` : `${ts}${suffix}`;
}

export const treeId = () => newId('TRE');
export const inspectionId = () => newId('INS');
export const incidentId = () => newId('ICD');
export const zoneId = () => newId('ZNE');
