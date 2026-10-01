-- Folio schema. Paste the whole file into Supabase → SQL Editor → Run.
-- Safe to re-run only on an empty project; it creates types and tables.

create type project_status as enum ('open','in_progress','delivered','verified','cancelled');
create type app_status as enum ('pending','accepted','declined');

-- ---------------------------------------------------------------- sign-up gate
-- Only these email domains can create an account. Add a row to allow another
-- (e.g. `insert into allowed_email_domains values ('gmail.com');` for testing only).
create table allowed_email_domains (domain text primary key);
insert into allowed_email_domains values ('ie.edu'), ('student.ie.edu');
alter table allowed_email_domains enable row level security;  -- no policies: invisible to the API

create function check_signup_domain() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not exists (select 1 from public.allowed_email_domains d where d.domain = lower(split_part(new.email, '@', 2))) then
    raise exception 'Sign-up is limited to IE University email addresses.';
  end if;
  return new;
end $$;
create trigger enforce_signup_domain before insert on auth.users
  for each row execute function check_signup_domain();

-- ---------------------------------------------------------------- tables
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  program text not null default '',
  uni_email_verified boolean not null default false,
  github_handle text,
  linkedin_url text,
  cv_path text,
  cv_name text,
  cv_size_kb int,
  cv_uploaded_at timestamptz,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),            -- null for seeded demo companies
  name text not null,
  hood text,
  cif text,
  verified boolean not null default false
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references profiles(id),           -- null for seeded demo projects
  client_name text not null,
  org_id uuid references organizations(id),         -- null = a student is the client
  hood text not null default 'IE community',
  category text not null check (category in (
    'Tech & Data','Design & Creative','Marketing & Growth','Business & Finance',
    'Research & Analysis','Writing & Content','Video & Photo','Operations & Admin')),
  title text not null check (char_length(title) <= 70),
  summary text not null,
  deliverables text[] not null check (cardinality(deliverables) >= 1),
  done_when text not null,
  price_eur int not null check (price_eur >= 150),
  weeks int not null check (weeks between 1 and 6),
  skills text[] not null default '{}',
  status project_status not null default 'open',
  created_at timestamptz not null default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  student_id uuid not null references profiles(id),
  pitch text not null check (char_length(pitch) >= 20),
  status app_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (project_id, student_id)
);

create table credentials (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id),
  student_id uuid not null references profiles(id),
  rating int not null check (rating between 1 and 5),
  review text not null,
  issued_at timestamptz not null default now()
);

-- ---------------------------------------------------------------- read views
-- Browse needs applicant counts and company names that a student's RLS can't see
-- directly. These views run with owner rights, so each one filters for itself.
create view project_cards as
select p.*, o.name as org_name, coalesce(o.verified, false) as org_verified,
       (select count(*) from applications a where a.project_id = p.id)::int as applicant_count
from projects p
left join organizations o on o.id = p.org_id
where p.status = 'open'
   or p.client_id = auth.uid()
   or exists (select 1 from applications a where a.project_id = p.id and a.student_id = auth.uid());

create view credential_cards as
select c.id, c.student_id, c.project_id, c.rating, c.review, c.issued_at,
       p.title as project_title, p.client_name, o.name as org_name, p.hood
from credentials c
join projects p on p.id = c.project_id
left join organizations o on o.id = p.org_id;

grant select on project_cards, credential_cards to anon, authenticated;

-- ---------------------------------------------------------------- row level security
alter table profiles      enable row level security;
alter table organizations enable row level security;
alter table projects      enable row level security;
alter table applications  enable row level security;
alter table credentials   enable row level security;

create policy "profiles readable by signed-in users" on profiles for select to authenticated using (true);
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "orgs readable" on organizations for select to anon, authenticated using (true);
create policy "owner manages org" on organizations for all to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid() and verified = false);

create policy "own projects readable" on projects for select to authenticated using (client_id = auth.uid());
create policy "students post student requests" on projects for insert to authenticated
  with check (client_id = auth.uid() and org_id is null and status = 'open');
create policy "clients update own projects" on projects for update to authenticated using (client_id = auth.uid());

create policy "see own applications or applications on own projects" on applications for select to authenticated
  using (student_id = auth.uid() or exists (select 1 from projects p where p.id = project_id and p.client_id = auth.uid()));
create policy "apply as yourself, not to your own project" on applications for insert to authenticated
  with check (student_id = auth.uid() and status = 'pending'
              and exists (select 1 from projects p where p.id = project_id and p.status = 'open' and p.client_id is distinct from auth.uid()));
create policy "clients decide on applications" on applications for update to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.client_id = auth.uid()));

create policy "credentials are public" on credentials for select to anon, authenticated using (true);
-- Deliberately NO insert/update policy: credentials are only ever created by a
-- trusted server function (added with the client-side verification step).

-- ---------------------------------------------------------------- profile bootstrap
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, program, uni_email_verified)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          coalesce(new.raw_user_meta_data->>'program', ''),
          new.email_confirmed_at is not null);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create function handle_email_confirmed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    update public.profiles set uni_email_verified = true where id = new.id;
  end if;
  return new;
end $$;
create trigger on_auth_user_confirmed after update of email_confirmed_at on auth.users
  for each row execute function handle_email_confirmed();

-- ---------------------------------------------------------------- CV storage (private bucket)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('cvs', 'cvs', false, 5242880, array[
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "read own cv"   on storage.objects for select to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own cv" on storage.objects for insert to authenticated
  with check (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "replace own cv" on storage.objects for update to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own cv" on storage.objects for delete to authenticated
  using (bucket_id = 'cvs' and (storage.foldername(name))[1] = auth.uid()::text);
