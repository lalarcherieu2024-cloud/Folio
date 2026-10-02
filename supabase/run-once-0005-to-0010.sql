-- Folio: everything not yet applied to your database (migrations 0005 to 0010), in order.
-- Paste the whole file into Supabase > SQL Editor > New query > Run. Run it ONCE.

-- ==============================================================
-- 0005_roles
-- ==============================================================
-- Account roles + locking down what a user can edit about their own profile.
-- Run in the SQL Editor after 0004.
create type user_role as enum ('student', 'company');
alter table profiles add column if not exists role user_role not null default 'student';

-- New accounts pick their side at sign-up (metadata.role); anything else becomes a student.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, program, role, uni_email_verified)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          coalesce(new.raw_user_meta_data->>'program', ''),
          case when new.raw_user_meta_data->>'role' = 'company' then 'company'::user_role else 'student'::user_role end,
          new.email_confirmed_at is not null and public.is_university_email(new.email));
  return new;
end $$;

-- A signed-in user may only edit these profile columns. Without this they could set their own
-- role or uni_email_verified through the API, since the row-level policy lets them update their row.
revoke update on profiles from authenticated;
grant update (full_name, program, github_handle, linkedin_url, cv_path, cv_name, cv_size_kb, cv_uploaded_at, strengths)
  on profiles to authenticated;

-- ==============================================================
-- 0006_verified_links
-- ==============================================================
-- Verified GitHub / LinkedIn. Run in the SQL Editor after 0005.
-- "Verified" means the student signed in to that account through OAuth while logged in to Folio,
-- so Supabase holds a linked identity for it. Users cannot write these columns (see 0005 grants).
alter table profiles
  add column if not exists github_verified boolean not null default false,
  add column if not exists linkedin_verified boolean not null default false;

-- Reads the caller's real linked identities and updates their profile to match.
-- Called by the app after an OAuth link completes. Only ever touches the caller's own row.
create or replace function sync_verified_identities() returns void
language sql security definer set search_path = public, auth as $$
  update public.profiles p set
    github_verified = exists (select 1 from auth.identities i where i.user_id = auth.uid() and i.provider = 'github'),
    github_handle = coalesce((select i.identity_data->>'user_name' from auth.identities i where i.user_id = auth.uid() and i.provider = 'github' limit 1), p.github_handle),
    linkedin_verified = exists (select 1 from auth.identities i where i.user_id = auth.uid() and i.provider = 'linkedin_oidc')
  where p.id = auth.uid();
$$;
revoke all on function sync_verified_identities() from public, anon;
grant execute on function sync_verified_identities() to authenticated;

-- ==============================================================
-- 0007_company_about
-- ==============================================================
-- Company "About" details shown in the project sheet. Run in the SQL Editor after 0006.
alter table organizations
  add column if not exists industry text,
  add column if not exists size text,
  add column if not exists founded text,
  add column if not exists blurb text,
  add column if not exists website text;

-- Demo companies (matched by name; harmless if they don't exist).
update organizations set industry='Fintech · Payments', size='11–50 employees', founded='2019',
  blurb='Payment infrastructure for Spanish online merchants. Cobalto Pay handles card and Bizum checkout for 1,200+ shops and settles funds daily.' where name='Cobalto Pay';
update organizations set industry='Food & Grocery delivery', size='11–50 employees', founded='2020',
  blurb='Weekly boxes of seasonal fruit and vegetables from farms within 150 km of Madrid, delivered by their own electric vans.' where name='Huerta Box';
update organizations set industry='EdTech', size='2–10 employees', founded='2022',
  blurb='Live, small-group online classes for secondary-school students, taught by vetted university tutors.' where name='Aula Viva';
update organizations set industry='Health tech · Clinics', size='51–200 employees', founded='2017',
  blurb='Booking and patient-messaging software used by 300+ private clinics across Spain.' where name='Lumen Health';
update organizations set industry='Logistics · Last-mile', size='51–200 employees', founded='2018',
  blurb='Same-day delivery for Madrid retailers, running a 40-van fleet out of a hub in Tetuán.' where name='Rutas';

-- Same view as before, with the new columns appended (a view may only gain columns at the end).
create or replace view project_cards as
select p.*, o.name as org_name, coalesce(o.verified, false) as org_verified,
       (select count(*) from applications a where a.project_id = p.id)::int as applicant_count,
       o.industry as org_industry, o.size as org_size, o.founded as org_founded, o.blurb as org_blurb, o.website as org_website
from projects p
left join organizations o on o.id = p.org_id
where p.status = 'open'
   or p.client_id = auth.uid()
   or exists (select 1 from applications a where a.project_id = p.id and a.student_id = auth.uid());

-- Demo websites so the "Website" button shows. These companies are fictional: replace with real
-- URLs, or let each company fill its own in once the company side is built.
update organizations set website = 'https://example.com' where name in ('Cobalto Pay','Huerta Box','Aula Viva','Lumen Health','Rutas') and website is null;

-- ==============================================================
-- 0008_profile_extras
-- ==============================================================
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

-- ==============================================================
-- 0009_requests
-- ==============================================================
-- Reviewing applicants on your own project. Run in the SQL Editor after 0008.

-- 1) An application can now share the student's extra files, and the short note is optional.
alter table applications add column if not exists include_files boolean not null default false;
alter table applications drop constraint if exists applications_pitch_check;
alter table applications alter column pitch set default '';

-- 2) A project's owner may read the files an applicant chose to share with them.
--    The CV always goes with an application; extra files only when include_files is true.
create policy "owners see shared files of applicants" on profile_files for select to authenticated
  using (exists (select 1 from applications a join projects p on p.id = a.project_id
                 where a.student_id = profile_files.user_id and a.include_files and p.client_id = auth.uid()));

create policy "owners read applicant files in storage" on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and exists (
    select 1 from applications a join projects p on p.id = a.project_id
    where a.student_id::text = (storage.foldername(name))[1]
      and p.client_id = auth.uid()
      and (storage.filename(name) like 'cv-%' or a.include_files)));

-- 3) Accepting an applicant: one transaction. Accepts that application, declines the other pending
--    ones and moves the project to in_progress, so it leaves "Find projects" for everyone else.
create or replace function accept_applicant(p_application_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_owner uuid; v_status project_status;
begin
  select project_id into v_project from applications where id = p_application_id;
  if v_project is null then raise exception 'Application not found'; end if;
  select client_id, status into v_owner, v_status from projects where id = v_project for update;
  if v_owner is distinct from auth.uid() then raise exception 'This is not your project'; end if;
  if v_status <> 'open' then raise exception 'This project is no longer open'; end if;
  update applications set status = 'accepted' where id = p_application_id;
  update applications set status = 'declined' where project_id = v_project and id <> p_application_id and status = 'pending';
  update projects set status = 'in_progress' where id = v_project;
end $$;
revoke all on function accept_applicant(uuid) from public, anon;
grant execute on function accept_applicant(uuid) to authenticated;

-- ==============================================================
-- 0010_edit_requests
-- ==============================================================
-- Editing a request + notifications. Run in the SQL Editor after 0009.

-- 1) Notifications. Rows are created only by the trusted functions/triggers below, never by users.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
alter table notifications enable row level security;
create policy "see own notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications read" on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

-- 2) Nobody edits a project directly any more: every change goes through update_project() (open
--    projects only) or accept_applicant(). Once someone is accepted the project is locked for everyone.
revoke update on projects from authenticated;

create or replace function update_project(
  p_id uuid, p_title text, p_category text, p_summary text, p_deliverables text[],
  p_done_when text, p_price int, p_weeks int, p_skills text[]
) returns int language plpgsql security definer set search_path = public as $$
declare o projects%rowtype; v_notified int := 0;
begin
  select * into o from projects where id = p_id for update;
  if not found then raise exception 'Project not found'; end if;
  if o.client_id is distinct from auth.uid() then raise exception 'This is not your project'; end if;
  if o.status <> 'open' then raise exception 'This project can no longer be edited'; end if;

  -- Nothing changed: don't bother applicants.
  if o.title = p_title and o.category = p_category and o.summary = p_summary and o.deliverables = p_deliverables
     and o.done_when = p_done_when and o.price_eur = p_price and o.weeks = p_weeks and o.skills = p_skills then
    return 0;
  end if;

  update projects set title = p_title, category = p_category, summary = p_summary, deliverables = p_deliverables,
    done_when = p_done_when, price_eur = p_price, weeks = p_weeks, skills = p_skills where id = p_id;

  insert into notifications (user_id, kind, title, body, link)
  select a.student_id, 'project_edited', 'A project you applied to was updated', p_title, '/projects?project=' || p_id
  from applications a where a.project_id = p_id and a.status = 'pending';
  get diagnostics v_notified = row_count;
  return v_notified;
end $$;
revoke all on function update_project(uuid, text, text, text, text[], text, int, int, text[]) from public, anon;
grant execute on function update_project(uuid, text, text, text, text[], text, int, int, text[]) to authenticated;

-- 3) Tell a student when their application is accepted or declined (fires for any status change,
--    including the ones made by accept_applicant()).
create or replace function notify_application_decision() returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.status = old.status or new.status::text not in ('accepted', 'declined') then return new; end if;
  select title into v_title from projects where id = new.project_id;
  insert into notifications (user_id, kind, title, body, link)
  values (new.student_id, 'application_' || new.status::text,
          case when new.status::text = 'accepted' then 'You were accepted!' else 'Not selected this time' end,
          v_title, '/applications');
  return new;
end $$;
drop trigger if exists on_application_decision on applications;
create trigger on_application_decision after update of status on applications
  for each row execute function notify_application_decision();
