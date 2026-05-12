# Storage buckets

Create the buckets below in the Supabase dashboard (Storage → New bucket).

## tree-photos
- Public: **no**
- File size limit: 10 MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/heic`, `image/webp`
- Path convention: `tree-photos/<tree_id>/<timestamp>.jpg`

## incident-photos
- Public: **no**
- File size limit: 10 MB
- Allowed MIME types: as above
- Path convention: `incident-photos/<incident_id>/<timestamp>.jpg`

## RLS policy (apply via the dashboard or SQL)

```sql
-- Only the uploader (and researchers) can read their photos.
create policy "tree_photos_read"
  on storage.objects for select
  using (
    bucket_id in ('tree-photos', 'incident-photos')
    and (
      auth.uid() = owner
      or public.is_researcher()
    )
  );

create policy "tree_photos_write"
  on storage.objects for insert
  with check (
    bucket_id in ('tree-photos', 'incident-photos')
    and auth.role() = 'authenticated'
  );
```
