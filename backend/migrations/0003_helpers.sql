-- Admin helpers. Call from the Supabase SQL editor as the postgres user.

-- Promote a user to researcher (sees the whole dataset).
create or replace function public.wwf_admin_promote(target_email text)
returns void language sql security definer as $$
  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
       || jsonb_build_object('role', 'researcher')
   where email = target_email;
$$;

-- Demote to ranger.
create or replace function public.wwf_admin_demote(target_email text)
returns void language sql security definer as $$
  update auth.users
     set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
       || jsonb_build_object('role', 'ranger')
   where email = target_email;
$$;

-- Assign a ranger to a zone.
create or replace function public.wwf_admin_assign(target_email text, zone_id_arg text)
returns void language plpgsql security definer as $$
declare uid uuid;
begin
  select id into uid from auth.users where email = target_email;
  if uid is null then
    raise exception 'user % not found', target_email;
  end if;
  insert into public.ranger_zone_assignments (user_id, zone_id)
       values (uid, zone_id_arg)
  on conflict (user_id, zone_id) do nothing;
end;
$$;
