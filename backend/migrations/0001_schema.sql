-- ForestSentry — base schema.
-- PostGIS-backed tree points and zone polygons; idempotent for repeat runs.

create extension if not exists "postgis";
create extension if not exists "pgcrypto";

-- ----- zones --------------------------------------------------------
create table if not exists public.zones (
  id text primary key,
  name text not null,
  protection_level text not null check (protection_level in ('monitor', 'restricted', 'core')),
  boundary jsonb not null,
  boundary_geom geometry(Polygon, 4326),
  area_hectares numeric,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_zones_geom on public.zones using gist (boundary_geom);

-- Auto-compute boundary_geom on write so PostGIS queries Just Work.
create or replace function public.zones_compute_geom() returns trigger as $$
declare
  coords jsonb;
  ring text;
begin
  coords := new.boundary;
  if coords is null or jsonb_array_length(coords) < 3 then
    new.boundary_geom := null;
    return new;
  end if;
  ring := (
    select string_agg(
      (point->>'lng') || ' ' || (point->>'lat'),
      ','
      order by ord
    )
    from jsonb_array_elements(coords) with ordinality as t(point, ord)
  );
  -- close the ring
  ring := ring || ',' || ((coords->0->>'lng')) || ' ' || ((coords->0->>'lat'));
  new.boundary_geom := ST_GeomFromText('POLYGON((' || ring || '))', 4326);
  return new;
end;
$$ language plpgsql;

drop trigger if exists tg_zones_compute_geom on public.zones;
create trigger tg_zones_compute_geom
  before insert or update on public.zones
  for each row execute function public.zones_compute_geom();

-- ----- trees --------------------------------------------------------
create table if not exists public.trees (
  id text primary key,
  species text not null,
  lat double precision not null,
  lng double precision not null,
  point_geom geometry(Point, 4326),
  girth_cm numeric,
  height_m numeric,
  notes text,
  photo_uri text,
  last_health_score numeric,
  last_health_label text check (last_health_label in ('healthy', 'stressed', 'diseased', 'pest')),
  zone_id text references public.zones(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_trees_geom on public.trees using gist (point_geom);
create index if not exists idx_trees_zone on public.trees(zone_id);
create index if not exists idx_trees_created_at on public.trees(created_at desc);

create or replace function public.trees_compute_geom() returns trigger as $$
begin
  new.point_geom := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326);
  return new;
end;
$$ language plpgsql;

drop trigger if exists tg_trees_compute_geom on public.trees;
create trigger tg_trees_compute_geom
  before insert or update on public.trees
  for each row execute function public.trees_compute_geom();

-- ----- inspections --------------------------------------------------
create table if not exists public.inspections (
  id text primary key,
  tree_id text not null references public.trees(id) on delete cascade,
  health_score numeric not null,
  health_label text not null check (health_label in ('healthy', 'stressed', 'diseased', 'pest')),
  confidence numeric,
  notes text,
  photo_uri text,
  inferred_on_device boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inspections_tree on public.inspections(tree_id, created_at desc);
create index if not exists idx_inspections_created_by on public.inspections(created_by);

-- ----- incidents ----------------------------------------------------
create table if not exists public.incidents (
  id text primary key,
  severity text not null check (severity in ('observation', 'minor', 'serious', 'critical')),
  lat double precision not null,
  lng double precision not null,
  point_geom geometry(Point, 4326),
  inside_zone_id text references public.zones(id) on delete set null,
  notes text,
  photo_uri text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_incidents_geom on public.incidents using gist (point_geom);
create index if not exists idx_incidents_severity_created on public.incidents(severity, created_at desc);

create or replace function public.incidents_compute_geom() returns trigger as $$
begin
  new.point_geom := ST_SetSRID(ST_MakePoint(new.lng, new.lat), 4326);
  return new;
end;
$$ language plpgsql;

drop trigger if exists tg_incidents_compute_geom on public.incidents;
create trigger tg_incidents_compute_geom
  before insert or update on public.incidents
  for each row execute function public.incidents_compute_geom();

-- ----- ranger_zone_assignments -------------------------------------
-- Many-to-many for rangers ↔ zones; researchers bypass this via the RLS function.
create table if not exists public.ranger_zone_assignments (
  user_id uuid not null references auth.users(id) on delete cascade,
  zone_id text not null references public.zones(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  primary key (user_id, zone_id)
);
