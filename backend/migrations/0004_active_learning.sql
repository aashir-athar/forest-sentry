-- ForestSentry — Active-Learning Loop
--
-- Adds the infrastructure for a human-in-the-loop ML pipeline:
--   1. Per-record audit columns (what the model predicted, what the operator
--      finally entered, which model version did the prediction).
--   2. A model_versions registry the mobile app polls for newer .tflite weights.
--   3. A training_samples view that derives a clean training corpus from
--      operator-corrected records.
--   4. A training-photos storage bucket (set up notes — buckets are created
--      via the Supabase Dashboard).
--
-- Safe to run more than once: every ALTER / CREATE uses IF NOT EXISTS.

------------------------------------------------------------------
-- 1. Audit columns on inspections (leaf-health AL signal)
------------------------------------------------------------------
alter table public.inspections
  add column if not exists predicted_label text,
  add column if not exists corrected_label text,
  add column if not exists model_version text,
  add column if not exists prediction_source text check (prediction_source in ('tflite', 'heuristic', 'manual') or prediction_source is null),
  add column if not exists contributed_to_training boolean not null default false;

create index if not exists idx_inspections_training
  on public.inspections (contributed_to_training)
  where contributed_to_training = true;

------------------------------------------------------------------
-- 2. Audit columns on incidents (logging-detection AL signal)
------------------------------------------------------------------
alter table public.incidents
  add column if not exists predicted_severity text,
  add column if not exists corrected_severity text,
  add column if not exists model_version text,
  add column if not exists ai_confidence double precision,
  add column if not exists photo_classification_kind text,
  add column if not exists contributed_to_training boolean not null default false;

create index if not exists idx_incidents_training
  on public.incidents (contributed_to_training)
  where contributed_to_training = true;

------------------------------------------------------------------
-- 3. Model registry
------------------------------------------------------------------
create table if not exists public.model_versions (
  id              text primary key,
  kind            text not null check (kind in ('leaf-health', 'logging-detection', 'predictive', 'anomaly')),
  tag             text not null,                       -- semver-ish, e.g. "1.4.0"
  tflite_url      text,                                -- public URL inside Supabase Storage; null for stats-only models
  labels_url      text,                                -- JSON map of class index → label + bucket
  trained_at      timestamptz not null default now(),
  sample_count    integer not null default 0,          -- training samples used
  validation_acc  double precision,                    -- 0..1
  notes           text,
  status          text not null check (status in ('staging', 'production', 'retired')) default 'staging',
  promoted_at     timestamptz,
  promoted_by     uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  unique (kind, tag)
);

create index if not exists idx_model_versions_kind_status
  on public.model_versions (kind, status);

------------------------------------------------------------------
-- 4. RLS on model_versions — every authenticated user reads, only
--    researchers / admins write & promote.
------------------------------------------------------------------
alter table public.model_versions enable row level security;

drop policy if exists "model_versions_read_all_authenticated" on public.model_versions;
create policy "model_versions_read_all_authenticated"
  on public.model_versions for select
  to authenticated
  using (true);

drop policy if exists "model_versions_write_researcher_only" on public.model_versions;
create policy "model_versions_write_researcher_only"
  on public.model_versions for all
  to authenticated
  using (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
  )
  with check (
    (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
  );

------------------------------------------------------------------
-- 5. training_samples view — clean training corpus, only operator-
--    corrected records the operator opted into contributing.
------------------------------------------------------------------
create or replace view public.training_samples_leaf as
  select
    i.id                       as inspection_id,
    i.tree_id                  as tree_id,
    i.photo_uri                as photo_uri,
    coalesce(i.corrected_label, i.health_label) as label,
    i.predicted_label          as predicted_label,
    i.confidence               as model_confidence,
    i.model_version            as model_version,
    i.prediction_source        as prediction_source,
    i.created_at               as captured_at,
    t.species                  as tree_species,
    t.lat                      as lat,
    t.lng                      as lng,
    t.zone_id                  as zone_id
  from public.inspections i
  join public.trees t on t.id = i.tree_id
  where i.contributed_to_training = true
    and i.photo_uri is not null;

create or replace view public.training_samples_logging as
  select
    id                         as incident_id,
    coalesce(corrected_severity, severity)       as severity,
    predicted_severity         as predicted_severity,
    photo_classification_kind  as photo_kind,
    ai_confidence              as model_confidence,
    model_version              as model_version,
    photo_uri                  as photo_uri,
    notes                      as notes,
    lat                        as lat,
    lng                        as lng,
    inside_zone_id             as zone_id,
    created_at                 as captured_at
  from public.incidents
  where contributed_to_training = true
    and photo_uri is not null;

------------------------------------------------------------------
-- 6. Promote / retire helpers (admin runs in SQL Editor)
------------------------------------------------------------------
create or replace function public.wwf_model_promote(model_id text)
returns void language plpgsql security definer as $$
begin
  update public.model_versions set status = 'retired', promoted_at = now()
    where kind = (select kind from public.model_versions where id = model_id)
      and status = 'production';
  update public.model_versions
     set status = 'production', promoted_at = now(), promoted_by = auth.uid()
   where id = model_id;
end;
$$;

create or replace function public.wwf_model_retire(model_id text)
returns void language sql security definer as $$
  update public.model_versions set status = 'retired' where id = model_id;
$$;

------------------------------------------------------------------
-- 7. Storage bucket for training photos
--
-- Buckets are created via the Dashboard (Storage → New bucket):
--   - name: training-photos
--   - public: false  (private, researcher-only access)
--   - file size limit: 10 MB
--
-- Policies (run after the bucket exists):
--
--   create policy "training_photos_insert_authenticated"
--     on storage.objects for insert to authenticated
--     with check (bucket_id = 'training-photos');
--
--   create policy "training_photos_read_researcher"
--     on storage.objects for select to authenticated
--     using (
--       bucket_id = 'training-photos'
--       and (auth.jwt() -> 'user_metadata' ->> 'role') = 'researcher'
--     );
------------------------------------------------------------------
