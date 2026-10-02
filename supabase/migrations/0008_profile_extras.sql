-- Payout link + additional files (portfolio etc.). Run in the SQL Editor after 0007.
alter table profiles add column if not exists payout_link text;
grant update (payout_link) on profiles to authenticated;

-- Extra files a student can attach (portfolio PDF, work samples). The files themselves live in
-- the private "cvs" storage bucket under the student's own folder, so the existing storage rules apply.
create table if not exists profile_files (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  path text not null,
  name text not null,
  size_kb int not null,
  created_at timestamptz not null default now()
);
alter table profile_files enable row level security;
create policy "see own files"    on profile_files for select to authenticated using (user_id = auth.uid());
create policy "add own files"    on profile_files for insert to authenticated with check (user_id = auth.uid());
create policy "remove own files" on profile_files for delete to authenticated using (user_id = auth.uid());
