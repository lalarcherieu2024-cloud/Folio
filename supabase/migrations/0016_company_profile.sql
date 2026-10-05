-- Company profile extras: logo, LinkedIn page, and files students can download. Run after 0015.
-- (Verifying the founder's own LinkedIn reuses profiles.linkedin_verified from 0006: nothing new needed.)

alter table organizations
  add column if not exists linkedin_url text,
  add column if not exists logo_path text,     -- file in the public "avatars" bucket, folder = owner's user id
  add column if not exists logo_color text;    -- colour for the initials when there is no logo
grant update (linkedin_url, logo_path, logo_color) on organizations to authenticated;

-- Files a company shares with students (pitch deck, one-pager, brand kit...). Private bucket:
-- only signed-in users can open them, through short-lived links the app generates.
create table if not exists company_files (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  path text not null,
  file_name text not null,
  size_kb int not null,
  uploaded_at timestamptz not null default now()
);
alter table company_files enable row level security;

drop policy if exists "signed-in users read files of verified companies and own files" on company_files;
create policy "signed-in users read files of verified companies and own files" on company_files for select to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and (o.verified or o.owner_id = auth.uid())));
drop policy if exists "owner adds files" on company_files;
create policy "owner adds files" on company_files for insert to authenticated
  with check (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid()));
drop policy if exists "owner removes files" on company_files;
create policy "owner removes files" on company_files for delete to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-files', 'company-files', false, 10485760,
        array['application/pdf', 'image/jpeg', 'image/png', 'image/webp',
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

drop policy if exists "signed-in users open company files" on storage.objects;
create policy "signed-in users open company files" on storage.objects for select to authenticated
  using (bucket_id = 'company-files');
drop policy if exists "upload own company files" on storage.objects;
create policy "upload own company files" on storage.objects for insert to authenticated
  with check (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own company files" on storage.objects;
create policy "delete own company files" on storage.objects for delete to authenticated
  using (bucket_id = 'company-files' and (storage.foldername(name))[1] = auth.uid()::text);
