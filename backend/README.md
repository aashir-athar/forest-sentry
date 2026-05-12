# ForestSentry Backend (Supabase)

This is the cloud-side companion to the ForestSentry mobile app. It is intentionally thin: the field device is the source of truth during a session, and the cloud is the durable target.

## What lives here

| Path | Purpose |
|---|---|
| `migrations/` | Idempotent SQL migrations — schema, indexes, RLS, triggers. Apply in numeric order. |
| `seed.sql` | Optional researcher seed data — Nathia Gali Ridge zone + a few real species rows. |
| `policies/RLS.md` | Plain-English description of every RLS policy and who can see what. |
| `types/` | Hand-mirrored TypeScript types that match the migrations one-to-one. |
| `functions/` | Edge functions for any future server-side processing (none required for v1). |
| `storage/buckets.md` | Bucket layout for tree and incident photos. |

## Stack

- **Postgres 15+ with PostGIS** (Supabase default)
- **Row-Level Security** on every row-bearing table
- **Supabase Auth** with magic-link (email OTP)
- **Storage bucket** for tree / incident photos
- No edge functions in v1 — the mobile app drives every write directly via the JS client

## Apply migrations

```sh
# Install the Supabase CLI once
brew install supabase/tap/supabase   # or: npm i -g supabase

# Link to your project (only the first time)
supabase login
supabase link --project-ref YOUR_PROJECT_REF

# Apply the migrations in order
supabase db push
```

Alternatively, paste each `migrations/*.sql` file into the Supabase SQL editor in order.

## Roles

ForestSentry has exactly two app roles, encoded in `auth.users.raw_user_meta_data->>'role'`:

- `ranger` — sees own records + records inside zones they're assigned to.
- `researcher` — sees the full dataset.

Assignments and roles can be promoted via the `wwf_admin_promote` SQL helper (see `migrations/0003_helpers.sql`).
