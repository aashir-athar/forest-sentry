-- ForestSentry — Row-Level Security.
-- Two roles, role read from auth.users.raw_user_meta_data->>'role'.

-- Helper: is the current user a researcher?
create or replace function public.is_researcher() returns boolean
  language sql security definer stable as $$
    select coalesce(
      (select raw_user_meta_data->>'role' from auth.users where id = auth.uid()) = 'researcher',
      false
    );
$$;

-- Helper: zones this ranger is assigned to.
create or replace function public.assigned_zones(uid uuid) returns setof text
  language sql security definer stable as $$
    select zone_id from public.ranger_zone_assignments where user_id = uid;
$$;

-- Enable RLS on every table.
alter table public.zones enable row level security;
alter table public.trees enable row level security;
alter table public.inspections enable row level security;
alter table public.incidents enable row level security;
alter table public.ranger_zone_assignments enable row level security;

-- Zones: researchers see all; rangers see assigned + unassigned (monitor-only or unowned).
drop policy if exists zones_read on public.zones;
create policy zones_read on public.zones
  for select to authenticated
  using (
    public.is_researcher()
    or id in (select public.assigned_zones(auth.uid()))
    or protection_level = 'monitor'
  );

drop policy if exists zones_write on public.zones;
create policy zones_write on public.zones
  for insert to authenticated
  with check (
    public.is_researcher()
    or auth.uid() = created_by
  );

drop policy if exists zones_update on public.zones;
create policy zones_update on public.zones
  for update to authenticated
  using (
    public.is_researcher()
    or auth.uid() = created_by
  );

-- Trees: researchers see all; rangers see their own + ones inside assigned zones.
drop policy if exists trees_read on public.trees;
create policy trees_read on public.trees
  for select to authenticated
  using (
    public.is_researcher()
    or created_by = auth.uid()
    or zone_id in (select public.assigned_zones(auth.uid()))
  );

drop policy if exists trees_insert on public.trees;
create policy trees_insert on public.trees
  for insert to authenticated
  with check (auth.uid() = created_by or created_by is null);

drop policy if exists trees_update on public.trees;
create policy trees_update on public.trees
  for update to authenticated
  using (
    public.is_researcher()
    or created_by = auth.uid()
  );

-- Inspections: same visibility as the parent tree.
drop policy if exists inspections_read on public.inspections;
create policy inspections_read on public.inspections
  for select to authenticated
  using (
    public.is_researcher()
    or created_by = auth.uid()
    or tree_id in (
      select id from public.trees
      where created_by = auth.uid()
         or zone_id in (select public.assigned_zones(auth.uid()))
    )
  );

drop policy if exists inspections_insert on public.inspections;
create policy inspections_insert on public.inspections
  for insert to authenticated
  with check (auth.uid() = created_by or created_by is null);

-- Incidents: researchers see all; rangers see their own + ones inside assigned zones.
drop policy if exists incidents_read on public.incidents;
create policy incidents_read on public.incidents
  for select to authenticated
  using (
    public.is_researcher()
    or created_by = auth.uid()
    or inside_zone_id in (select public.assigned_zones(auth.uid()))
  );

drop policy if exists incidents_insert on public.incidents;
create policy incidents_insert on public.incidents
  for insert to authenticated
  with check (auth.uid() = created_by or created_by is null);

-- Ranger assignments: each user can see their own row; researchers see all.
drop policy if exists rza_read on public.ranger_zone_assignments;
create policy rza_read on public.ranger_zone_assignments
  for select to authenticated
  using (public.is_researcher() or user_id = auth.uid());
