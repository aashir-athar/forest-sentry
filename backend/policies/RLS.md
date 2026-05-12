# RLS — who sees what

| Table | Role | SELECT | INSERT | UPDATE |
|---|---|---|---|---|
| zones | researcher | all | yes | yes |
| zones | ranger | assigned + monitor-level | own records only | own records only |
| trees | researcher | all | yes | yes |
| trees | ranger | own + inside assigned zones | own records | own records |
| inspections | researcher | all | yes | n/a |
| inspections | ranger | for visible trees | own records | n/a |
| incidents | researcher | all | yes | n/a |
| incidents | ranger | own + inside assigned zones | own records | n/a |
| ranger_zone_assignments | researcher | all | (admin only) | (admin only) |
| ranger_zone_assignments | ranger | own row only | (admin only) | (admin only) |

## Role storage
`auth.users.raw_user_meta_data->>'role'` is the single source of truth. The mobile app reflects this immediately on next auth session.

## Helper functions
- `public.is_researcher()` — boolean, short-circuits researcher access in every policy.
- `public.assigned_zones(uid)` — set of zone IDs a ranger is allowed to see.
- `public.wwf_admin_promote(email)` / `wwf_admin_demote(email)` — operator-only role flips.
- `public.wwf_admin_assign(email, zone_id)` — pair a ranger to a zone.

Run admin helpers from the Supabase SQL editor; they are `security definer` and bypass RLS by design.
