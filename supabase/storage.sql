-- Run after supabase/schema.sql. Safe to run repeatedly.
-- Campus report images are public because reports are visible to signed-in campus users.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('complaint-images', 'complaint-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Signed-in students can upload report images to their own folder" on storage.objects;
create policy "Signed-in students can upload report images to their own folder"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Anyone can view published campus report images" on storage.objects;
create policy "Anyone can view published campus report images"
on storage.objects for select to public
using (bucket_id = 'complaint-images');

drop policy if exists "Users can delete their own report images" on storage.objects;
create policy "Users can delete their own report images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'complaint-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);
