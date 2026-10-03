-- Profile picture: a chosen colour for the initials, or an uploaded photo. Run after 0013.
alter table profiles add column if not exists avatar_color text, add column if not exists avatar_path text;
grant update (avatar_color, avatar_path) on profiles to authenticated;

-- Photos live in a bucket that anyone with the link can view, because clients must be able to see the
-- face of a student who applied. File names are unguessable (user id + timestamp), nothing lists them,
-- and only the owner can upload, replace or delete their own.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own avatar" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own avatar" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
