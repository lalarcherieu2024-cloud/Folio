-- Certificates from outside Folio (Coursera, Udemy, Programiz, freeCodeCamp, …) that students show on their profile.
-- Run after 0024. Each has a title and issuer, and a link to the online credential and/or an uploaded copy.
create table if not exists course_certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  issuer text not null check (char_length(issuer) between 1 and 80),
  issued_on date,
  credential_url text check (credential_url is null or credential_url ~* '^https://'),
  path text,          -- uploaded copy in the private "cvs" bucket: <user id>/cert-…
  file_name text,
  size_kb int,
  created_at timestamptz not null default now(),
  check (credential_url is not null or path is not null)   -- something a client can check
);
create index if not exists course_certificates_user on course_certificates (user_id, issued_on desc);

alter table course_certificates enable row level security;
drop policy if exists "see own certificates" on course_certificates;
create policy "see own certificates" on course_certificates for select to authenticated using (user_id = auth.uid());
drop policy if exists "add own certificates" on course_certificates;
create policy "add own certificates" on course_certificates for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "remove own certificates" on course_certificates;
create policy "remove own certificates" on course_certificates for delete to authenticated using (user_id = auth.uid());
-- Clients see the certificates of students who applied to their projects (like the CV).
drop policy if exists "clients see applicant certificates" on course_certificates;
create policy "clients see applicant certificates" on course_certificates for select to authenticated
  using (exists (select 1 from applications a join projects p on p.id = a.project_id
                 where a.student_id = course_certificates.user_id and p.client_id = auth.uid()));

-- Uploaded copies live next to the CV. Clients of an application may open them, like the CV.
drop policy if exists "clients read applicant certificates in storage" on storage.objects;
create policy "clients read applicant certificates in storage" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and storage.filename(name) like 'cert-%' and exists (
    select 1 from applications a join projects p on p.id = a.project_id
    where a.student_id::text = (storage.foldername(name))[1] and p.client_id = auth.uid()));

-- Certificates are often screenshots: let the private bucket take images as well as PDF/Word.
update storage.buckets set allowed_mime_types = array[
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png', 'image/jpeg', 'image/webp']
where id = 'cvs';
