-- Student startups: IE students with their own startup can hire other IE students. Run in the SQL Editor after 0030.
--
-- A founder signs up as a company (a separate account, with the startup's email). On the details step they pick
-- "Student startup, not registered yet": no CIF, but their IE email and a website or LinkedIn page. The founder's own
-- LinkedIn is asked for as for any company, and Folio reviews it by hand as before (approve_company()); the reviewer
-- also emails the IE address. Until the startup is registered:
--   * projects are capped at €500;
--   * before the first payment only the founder's ID is asked for (no registry extract).
-- Registering later (register_startup(): legal name + CIF) turns it into a company: the cap lifts and the registry
-- extract is asked for before the next payment.
--
-- Reviewing: the IE email is private (organizations are public), so look it up with
--   select o.id, o.name, o.website, f.ie_email from organizations o join startup_founders f on f.org_id = o.id
--   where o.status = 'pending';

-- ---------------------------------------------------------------- the kind of organization
alter table organizations add column if not exists kind text not null default 'company';
alter table organizations drop constraint if exists organizations_kind_check;
alter table organizations add constraint organizations_kind_check check (kind in ('company', 'student_startup'));
grant insert (kind) on organizations to authenticated;
grant update (kind) on organizations to authenticated;

-- What Folio checked can't change once submitted: now also the kind. register_startup() is the one exception.
create or replace function lock_reviewed_identity() returns trigger language plpgsql as $$
begin
  if coalesce(current_setting('folio.registering', true), '') = 'on' then return new; end if;
  if old.status in ('pending', 'verified')
     and (new.name is distinct from old.name or new.cif is distinct from old.cif or new.kind is distinct from old.kind) then
    raise exception 'The name, CIF and type can''t be changed after they were submitted for review.';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------- the founder's IE email (private)
create table if not exists startup_founders (
  org_id uuid primary key references organizations(id) on delete cascade,
  ie_email text not null,
  updated_at timestamptz not null default now()
);
alter table startup_founders enable row level security;
drop policy if exists "owner reads founder email" on startup_founders;
create policy "owner reads founder email" on startup_founders for select to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid()));
drop policy if exists "owner sets founder email before review" on startup_founders;
create policy "owner sets founder email before review" on startup_founders for insert to authenticated
  with check (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.status in ('draft', 'rejected')));
drop policy if exists "owner changes founder email before review" on startup_founders;
create policy "owner changes founder email before review" on startup_founders for update to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.status in ('draft', 'rejected')))
  with check (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.status in ('draft', 'rejected')));

create or replace function check_founder_email() returns trigger language plpgsql set search_path = public as $$
begin
  new.ie_email := lower(trim(new.ie_email));
  if not is_university_email(new.ie_email) then raise exception 'Use your IE University email, like you@student.ie.edu.'; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists startup_founders_check on startup_founders;
create trigger startup_founders_check before insert or update on startup_founders for each row execute function check_founder_email();

-- ---------------------------------------------------------------- verification stage 1, per kind
-- Funnel timestamp (0030): a student startup needs no CIF. (Its IE email lives in startup_founders and is checked on
-- submit, so this mark can come a moment early for startups.)
create or replace function org_mark_details_complete() returns trigger language plpgsql as $$
begin
  if new.details_completed_at is null
     and coalesce(trim(new.name), '') <> '' and coalesce(trim(new.website), '') <> '' and coalesce(trim(new.blurb), '') <> ''
     and (new.kind = 'student_startup' or coalesce(trim(new.cif), '') <> '') then
    new.details_completed_at := now();
  end if;
  return new;
end $$;

create or replace function submit_company_verification() returns void language plpgsql security definer set search_path = public as $$
declare o organizations; p profiles;
begin
  select * into o from organizations where owner_id = auth.uid();
  if not found then raise exception 'Add your company details first.'; end if;
  if o.status not in ('draft', 'rejected') then raise exception 'Your company was already submitted.'; end if;
  if coalesce(trim(o.name), '') = '' or coalesce(trim(o.website), '') = '' or coalesce(trim(o.blurb), '') = '' then
    raise exception 'Fill in all company details first.';
  end if;
  if o.kind = 'student_startup' then
    if not exists (select 1 from startup_founders f where f.org_id = o.id) then raise exception 'Add your IE email first.'; end if;
  elsif coalesce(trim(o.cif), '') = '' then
    raise exception 'Fill in all company details first.';
  end if;
  select * into p from profiles where id = auth.uid();
  if not coalesce(p.linkedin_verified, false) and coalesce(trim(p.linkedin_url), '') = '' then
    raise exception 'Connect your LinkedIn or add a link to your LinkedIn profile first.';
  end if;
  update organizations set status = 'pending', submitted_at = now(), review_note = null where id = o.id;
end $$;

-- ---------------------------------------------------------------- stage 2: documents before paying, per kind
create or replace function required_docs(k text) returns text[] language sql immutable as $$
  select case k when 'student_startup' then array['representative_id'] else array['registry_extract', 'representative_id'] end
$$;

create or replace function org_mark_documents_complete() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update organizations o set documents_completed_at = now()
  where o.id = new.org_id and o.documents_completed_at is null
    and not exists (select 1 from unnest(required_docs(o.kind)) k
                    where not exists (select 1 from company_documents d where d.org_id = o.id and d.kind::text = k));
  return new;
end $$;

-- Before the first payment, as in 0030; after it, only a document the company doesn't have yet (a startup that
-- registered adds its registry extract before its next payment).
drop policy if exists "owner adds documents before paying" on company_documents;
create policy "owner adds documents before paying" on company_documents for insert to authenticated
  with check (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid()
    and (o.first_paid_at is null or not exists (select 1 from company_documents d where d.org_id = o.id and d.kind = company_documents.kind)))));

-- ---------------------------------------------------------------- the budget cap
create or replace function check_startup_budget() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.org_id is not null and new.price_eur > 500
     and exists (select 1 from organizations o where o.id = new.org_id and o.kind = 'student_startup') then
    raise exception 'Student startups can post projects of up to €500 until the startup is registered.';
  end if;
  return new;
end $$;
drop trigger if exists projects_startup_budget on projects;
create trigger projects_startup_budget before insert or update of price_eur on projects
  for each row execute function check_startup_budget();

-- ---------------------------------------------------------------- registering the startup
create or replace function register_startup(p_name text, p_cif text) returns void
language plpgsql security definer set search_path = public as $$
declare o organizations; v_cif text := upper(regexp_replace(coalesce(p_cif, ''), '[\s-]', '', 'g'));
begin
  select * into o from organizations where owner_id = auth.uid() for update;
  if not found or o.kind <> 'student_startup' then raise exception 'Only a student startup can do this.'; end if;
  if char_length(trim(coalesce(p_name, ''))) < 2 then raise exception 'Add the registered (legal) name.'; end if;
  if v_cif !~ '^[A-Z0-9]{8,10}$' then raise exception 'A CIF / NIF is 9 letters and numbers, like B12345678.'; end if;
  perform set_config('folio.registering', 'on', true);
  update organizations set kind = 'company', name = trim(p_name), cif = v_cif, documents_completed_at = null where id = o.id;
  perform set_config('folio.registering', 'off', true);
end $$;

revoke execute on function register_startup(text, text) from public, anon;
grant execute on function register_startup(text, text) to authenticated;
