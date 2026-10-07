-- Unfinished project drafts: a company can start a project, save it half-done and finish it later.
-- Run in the SQL Editor after 0028. Safe to run more than once.
-- A draft is just the form as it was left (any field may be empty), so it lives apart from projects, whose
-- columns are all required. Publishing creates the real project and deletes the draft.

create table if not exists project_drafts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id) on delete cascade,
  title text not null default '',
  data jsonb not null default '{}'::jsonb,   -- title, category, summary, deliverable, skills, pay, weeks
  step int not null default 1 check (step between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists project_drafts_owner on project_drafts (owner_id, updated_at desc);
alter table project_drafts enable row level security;

drop policy if exists "owners manage their drafts" on project_drafts;
create policy "owners manage their drafts" on project_drafts for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
grant select, insert, update, delete on project_drafts to authenticated;
