-- Two-stage company verification, and timestamps to see where companies stall. Run in the SQL Editor after 0029.
--
-- Stage 1, at sign-up (about 2 minutes): company details (legal name, CIF, website, description) and the founder's
--   LinkedIn (connected, or a profile link). Folio checks these by hand against public sources, then approves the
--   company with approve_company() as before. It can then publish projects.
-- Stage 2, before the company's first payment: the registry extract and the representative's ID. The app asks for
--   them on the payment page and won't take a payment without them. The bank certificate is no longer asked for:
--   the escrow payment comes from the company's own account.
--
-- Funnel (run in the SQL Editor, leave out your own test accounts):
--   select count(*) signed_up, count(o.created_at) started, count(o.details_completed_at) details_done,
--          count(o.submitted_at) submitted, count(o.verified_at) verified, count(o.documents_completed_at) documents_done,
--          count(o.first_paid_at) paid
--   from profiles p left join organizations o on o.owner_id = p.id where p.role = 'company';

-- ---------------------------------------------------------------- funnel timestamps (set by triggers, never by users)
alter table organizations
  add column if not exists details_completed_at timestamptz,
  add column if not exists documents_completed_at timestamptz,
  add column if not exists first_paid_at timestamptz;

-- Details complete: the first time legal name, CIF, website and description are all filled in.
create or replace function org_mark_details_complete() returns trigger language plpgsql as $$
begin
  if new.details_completed_at is null
     and coalesce(trim(new.name), '') <> '' and coalesce(trim(new.cif), '') <> ''
     and coalesce(trim(new.website), '') <> '' and coalesce(trim(new.blurb), '') <> '' then
    new.details_completed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists org_details_complete on organizations;
create trigger org_details_complete before insert or update on organizations
  for each row execute function org_mark_details_complete();

-- Documents complete: the first time both stage-2 documents are uploaded.
create or replace function org_mark_documents_complete() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update organizations o set documents_completed_at = now()
  where o.id = new.org_id and o.documents_completed_at is null
    and (select count(distinct d.kind) from company_documents d
         where d.org_id = new.org_id and d.kind in ('registry_extract', 'representative_id')) = 2;
  return new;
end $$;
drop trigger if exists company_documents_complete on company_documents;
create trigger company_documents_complete after insert on company_documents
  for each row execute function org_mark_documents_complete();

-- First payment: the first time one of the company's escrows is funded.
create or replace function org_mark_first_paid() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status::text <> 'awaiting_payment' and old.status::text = 'awaiting_payment' then
    update organizations o set first_paid_at = now() where o.owner_id = new.payer_id and o.first_paid_at is null;
  end if;
  return new;
end $$;
drop trigger if exists escrows_first_paid on escrows;
create trigger escrows_first_paid after update of status on escrows
  for each row execute function org_mark_first_paid();

-- Existing rows: fill in what can be known.
update organizations set details_completed_at = coalesce(submitted_at, created_at)
where details_completed_at is null and coalesce(trim(name), '') <> '' and coalesce(trim(cif), '') <> ''
  and coalesce(trim(website), '') <> '' and coalesce(trim(blurb), '') <> '';
update organizations o set documents_completed_at = (select max(d.uploaded_at) from company_documents d where d.org_id = o.id)
where documents_completed_at is null
  and (select count(distinct d.kind) from company_documents d where d.org_id = o.id and d.kind in ('registry_extract', 'representative_id')) = 2;

-- ---------------------------------------------------------------- stage 1: submit without documents
create or replace function submit_company_verification() returns void language plpgsql security definer set search_path = public as $$
declare o organizations; p profiles;
begin
  select * into o from organizations where owner_id = auth.uid();
  if not found then raise exception 'Add your company details first.'; end if;
  if o.status not in ('draft', 'rejected') then raise exception 'Your company was already submitted.'; end if;
  if coalesce(trim(o.name), '') = '' or coalesce(trim(o.cif), '') = '' or coalesce(trim(o.website), '') = '' or coalesce(trim(o.blurb), '') = '' then
    raise exception 'Fill in all company details first.';
  end if;
  select * into p from profiles where id = auth.uid();
  if not coalesce(p.linkedin_verified, false) and coalesce(trim(p.linkedin_url), '') = '' then
    raise exception 'Connect your LinkedIn or add a link to your LinkedIn profile first.';
  end if;
  update organizations set status = 'pending', submitted_at = now(), review_note = null where id = o.id;
end $$;

-- ---------------------------------------------------------------- stage 2: documents any time before the first payment
-- (Before, they could only change before submitting.) Once a project has been paid for, they're kept as they are.
drop policy if exists "owner adds documents before submitting" on company_documents;
drop policy if exists "owner removes documents before submitting" on company_documents;
drop policy if exists "owner adds documents before paying" on company_documents;
drop policy if exists "owner removes documents before paying" on company_documents;
create policy "owner adds documents before paying" on company_documents for insert to authenticated
  with check (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.first_paid_at is null));
create policy "owner removes documents before paying" on company_documents for delete to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.first_paid_at is null));
