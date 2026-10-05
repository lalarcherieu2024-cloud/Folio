-- Submitting work, reviewing it, and brief files. Run in the SQL Editor after 0018. Owner: startup + student.
--
-- Flow: student works (accepted) → SUBMITS files (delivered) → company either APPROVES (verify_delivery,
-- issues the credential) or REQUESTS CHANGES with feedback (back to accepted, student resubmits).
-- Brief files are uploaded by the company; students can only preview them inside the app (see
-- src/app/api/files/[kind]/[id]/route.ts), they get no storage access of their own.

-- ---------------------------------------------------------------- 1) close the shortcut
-- Until now a student could flip their own application to 'delivered' straight through the API.
-- From here on, "delivered" is only reachable through submit_work() below.
drop policy if exists "mark own accepted application delivered" on applications;

-- ---------------------------------------------------------------- 2) brief files (company → students, preview only)
create table if not exists project_files (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  path text not null,
  file_name text not null,
  size_kb int not null,
  uploaded_at timestamptz not null default now()
);
alter table project_files enable row level security;

-- The client sees their own files; a student sees them only once they were accepted for that project.
create or replace function can_see_brief_files(proj uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from projects p where p.id = proj and p.client_id = auth.uid())
      or exists (select 1 from applications a
                 where a.project_id = proj and a.student_id = auth.uid() and a.status::text in ('accepted', 'delivered'));
$$;

drop policy if exists "see brief files you may see" on project_files;
create policy "see brief files you may see" on project_files for select to authenticated using (can_see_brief_files(project_id));
drop policy if exists "client adds brief files" on project_files;
create policy "client adds brief files" on project_files for insert to authenticated
  with check (exists (select 1 from projects p where p.id = project_id and p.client_id = auth.uid()));
drop policy if exists "client removes brief files" on project_files;
create policy "client removes brief files" on project_files for delete to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.client_id = auth.uid()));

-- Private bucket. Only the owner may upload or delete (folder = their user id); NOBODY gets a read policy:
-- files are served by the app after it has checked who is asking.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('project-files', 'project-files', false, 15728640, array['application/pdf', 'image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
drop policy if exists "upload own brief files" on storage.objects;
create policy "upload own brief files" on storage.objects for insert to authenticated
  with check (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own brief files" on storage.objects;
create policy "delete own brief files" on storage.objects for delete to authenticated
  using (bucket_id = 'project-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- 3) submissions
do $$ begin
  create type submission_status as enum ('submitted', 'changes_requested', 'accepted');
exception when duplicate_object then null; end $$;

create table if not exists submissions (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  round int not null,
  note text,
  status submission_status not null default 'submitted',
  feedback text,                       -- the client's feedback when they ask for changes
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  unique (application_id, round)
);
create table if not exists submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references submissions(id) on delete cascade,
  path text not null,
  file_name text not null,
  size_kb int not null
);
alter table submissions enable row level security;
alter table submission_files enable row level security;

create or replace function can_see_submission(app uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from applications a join projects p on p.id = a.project_id
                 where a.id = app and (a.student_id = auth.uid() or p.client_id = auth.uid()));
$$;
drop policy if exists "student and client read submissions" on submissions;
create policy "student and client read submissions" on submissions for select to authenticated using (can_see_submission(application_id));
drop policy if exists "student and client read submission files" on submission_files;
create policy "student and client read submission files" on submission_files for select to authenticated
  using (exists (select 1 from submissions s where s.id = submission_id and can_see_submission(s.application_id)));
-- No insert/update/delete policy on either table: they are written only by the functions below.
revoke insert, update, delete on submissions, submission_files from anon, authenticated;

-- Private bucket for the student's files (any document type, up to 25 MB each). The student uploads to
-- their own folder; the app serves the files to the student and to the project's client.
insert into storage.buckets (id, name, public, file_size_limit)
values ('submissions', 'submissions', false, 26214400)
on conflict (id) do nothing;
drop policy if exists "upload own submission files" on storage.objects;
create policy "upload own submission files" on storage.objects for insert to authenticated
  with check (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own submission files" on storage.objects;
create policy "delete own submission files" on storage.objects for delete to authenticated
  using (bucket_id = 'submissions' and (storage.foldername(name))[1] = auth.uid()::text);

-- ---------------------------------------------------------------- 4) student submits
-- p_files: [{ "path": "<user id>/...", "name": "report.pdf", "size_kb": 120 }, ...]
create or replace function submit_work(p_app uuid, p_note text, p_files jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare a applications; p projects; v_round int; v_id uuid; f jsonb; v_link text;
begin
  select * into a from applications where id = p_app for update;
  if not found or a.student_id <> auth.uid() then raise exception 'Application not found.'; end if;
  if a.status::text <> 'accepted' then raise exception 'You can only submit work that is in progress.'; end if;
  select * into p from projects where id = a.project_id;
  if p.status = 'verified' then raise exception 'This project is already verified.'; end if;
  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) not between 1 and 10 then
    raise exception 'Add between 1 and 10 files.';
  end if;
  select coalesce(max(round), 0) + 1 into v_round from submissions where application_id = p_app;
  insert into submissions (application_id, round, note) values (p_app, v_round, nullif(trim(coalesce(p_note, '')), '')) returning id into v_id;
  for f in select * from jsonb_array_elements(p_files) loop
    if coalesce(f->>'path', '') not like auth.uid()::text || '/%' then raise exception 'Invalid file.'; end if;
    insert into submission_files (submission_id, path, file_name, size_kb)
    values (v_id, f->>'path', left(coalesce(nullif(f->>'name', ''), 'file'), 120), greatest(1, coalesce((f->>'size_kb')::int, 1)));
  end loop;
  update applications set status = 'delivered' where id = p_app;
  v_link := case when p.org_id is not null then '/company/applicants/' || p_app else '/requests/' || p.id end;
  insert into notifications (user_id, kind, title, body, link)
  values (p.client_id, 'submission', case when v_round = 1 then 'Work submitted' else 'Work resubmitted' end, p.title, v_link);
  return v_id;
end $$;

-- ---------------------------------------------------------------- 5) client asks for changes
create or replace function request_changes(p_app uuid, p_feedback text) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; p projects; v_sub uuid;
begin
  select * into a from applications where id = p_app for update;
  if not found then raise exception 'Application not found.'; end if;
  select * into p from projects where id = a.project_id;
  if p.client_id is distinct from auth.uid() then raise exception 'Application not found.'; end if;
  if a.status::text <> 'delivered' then raise exception 'There is no submitted work to review.'; end if;
  if char_length(trim(coalesce(p_feedback, ''))) < 10 then raise exception 'Explain what to change (at least 10 characters).'; end if;
  select id into v_sub from submissions where application_id = p_app and status = 'submitted' order by round desc limit 1;
  if v_sub is null then raise exception 'There is no submitted work to review.'; end if;
  update submissions set status = 'changes_requested', feedback = trim(p_feedback), reviewed_at = now() where id = v_sub;
  update applications set status = 'accepted' where id = p_app;     -- back to "in progress" for the student
  insert into notifications (user_id, kind, title, body, link)
  values (a.student_id, 'changes_requested', 'Changes requested', p.title, '/applications/' || p_app);
end $$;

-- ---------------------------------------------------------------- 6) approving also closes the submission
create or replace function verify_delivery(app_id uuid, stars int, review_text text) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; v_title text;
begin
  select * into a from applications where id = app_id for update;
  if not found or not exists (select 1 from projects p where p.id = a.project_id and p.client_id = auth.uid()) then
    raise exception 'Application not found.';
  end if;
  if a.status::text <> 'delivered' then raise exception 'The student hasn''t submitted their work yet.'; end if;
  if exists (select 1 from credentials c where c.project_id = a.project_id) then raise exception 'You already verified this work.'; end if;
  if stars is null or stars not between 1 and 5 then raise exception 'Pick a rating from 1 to 5 stars.'; end if;
  if char_length(trim(coalesce(review_text, ''))) < 10 then raise exception 'Write a short review (at least 10 characters).'; end if;
  insert into credentials (project_id, student_id, rating, review) values (a.project_id, a.student_id, stars, trim(review_text));
  update submissions set status = 'accepted', reviewed_at = now() where application_id = app_id and status = 'submitted';
  update projects set status = 'verified' where id = a.project_id returning title into v_title;
  insert into notifications (user_id, kind, title, body, link)
  values (a.student_id, 'credential_issued', 'Your work was verified!', v_title, '/profile');
end $$;

revoke execute on function submit_work(uuid, text, jsonb) from public, anon;
revoke execute on function request_changes(uuid, text) from public, anon;
revoke execute on function can_see_brief_files(uuid) from public, anon;
revoke execute on function can_see_submission(uuid) from public, anon;
grant execute on function submit_work(uuid, text, jsonb), request_changes(uuid, text), can_see_brief_files(uuid), can_see_submission(uuid) to authenticated;
