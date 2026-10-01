-- Sidequest initial schema. Run with `supabase db push` (or paste into the SQL editor).

create type project_status as enum ('open','in_progress','delivered','verified','cancelled');
create type app_status as enum ('pending','accepted','declined');

create table profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text not null,
  program text,
  uni_email_verified boolean not null default false,
  github_handle text,
  linkedin_url text,
  created_at timestamptz not null default now()
);

create table organizations (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references profiles(id),
  name text not null,
  hood text,
  cif text,
  verified boolean not null default false
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references profiles(id),
  org_id uuid references organizations(id),          -- null = a student is the client
  title text not null,
  summary text not null,
  deliverable text not null,
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
  pitch text not null,
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

-- Row Level Security: nothing is readable or writable until a policy allows it.
alter table profiles      enable row level security;
alter table organizations enable row level security;
alter table projects      enable row level security;
alter table applications  enable row level security;
alter table credentials   enable row level security;

create policy "profiles readable by signed-in users" on profiles for select to authenticated using (true);
create policy "update own profile" on profiles for update to authenticated using (id = auth.uid());

create policy "orgs readable" on organizations for select to authenticated using (true);
create policy "owner manages org" on organizations for all to authenticated
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
-- NOTE: `verified` must only be flipped by an admin/service role; revoke column update when you add the admin flow.

create policy "open projects visible, own always" on projects for select to authenticated
  using (status = 'open' or client_id = auth.uid()
         or exists (select 1 from applications a where a.project_id = projects.id and a.student_id = auth.uid()));
create policy "clients create projects" on projects for insert to authenticated with check (client_id = auth.uid());
create policy "clients update own projects" on projects for update to authenticated using (client_id = auth.uid());

create policy "students see own applications" on applications for select to authenticated
  using (student_id = auth.uid()
         or exists (select 1 from projects p where p.id = project_id and p.client_id = auth.uid()));
create policy "students apply as themselves" on applications for insert to authenticated
  with check (student_id = auth.uid() and status = 'pending');
create policy "clients decide on applications" on applications for update to authenticated
  using (exists (select 1 from projects p where p.id = project_id and p.client_id = auth.uid()));

create policy "credentials are public" on credentials for select using (true);
-- Deliberately NO insert/update policy: credentials are created only by the
-- verify_project() function (security definer), so a student can never mint one.

-- Create a profile row for every new auth user.
create function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, full_name, uni_email_verified)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          new.email_confirmed_at is not null);
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();
