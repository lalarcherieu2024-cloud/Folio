-- The company side: company verification, verified posting, delivery verification.
-- Run in the SQL Editor after 0014 (the Student-view migrations). Owner: startup interface.
-- Reuses what 0007–0013 already added: organizations.website/founded/size/blurb, accept_applicant(),
-- the "owners read applicant files in storage" rule and the notifications table.
--
-- Approving a company (no admin screen yet). In the SQL Editor:
--   select id, name, cif, status, submitted_at from organizations where status = 'pending';
--   select approve_company('<organization id>');
--   select reject_company('<organization id>', 'The registry extract is older than 3 months.');
-- Uploaded documents are in Storage → company-docs, one folder per account.

-- ---------------------------------------------------------------- verification status
create type org_status as enum ('draft', 'pending', 'verified', 'rejected');

alter table organizations
  add column if not exists status org_status not null default 'draft',
  add column if not exists review_note text,          -- why Folio rejected it, shown to the company
  add column if not exists submitted_at timestamptz,
  add column if not exists verified_at timestamptz,
  add column if not exists created_at timestamptz not null default now();

update organizations set status = 'verified' where verified;   -- seeded demo companies
create unique index if not exists organizations_one_per_owner on organizations (owner_id);

-- A company edits its own details, but never its status or verified flag (only the functions below do).
drop policy if exists "owner manages org" on organizations;
create policy "owner creates own org" on organizations for insert to authenticated with check (owner_id = auth.uid());
create policy "owner edits own org" on organizations for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
revoke insert, update, delete on organizations from anon, authenticated;
grant insert (owner_id, name, hood, cif, website, blurb, founded, size, industry) on organizations to authenticated;
grant update (name, hood, cif, website, blurb, founded, size, industry) on organizations to authenticated;

-- What Folio checked (legal name, CIF) can't change once it's been submitted.
create function lock_reviewed_identity() returns trigger language plpgsql as $$
begin
  if old.status in ('pending', 'verified') and (new.name is distinct from old.name or new.cif is distinct from old.cif) then
    raise exception 'The legal name and CIF can''t be changed after they were submitted for review.';
  end if;
  return new;
end $$;
create trigger org_lock_reviewed_identity before update on organizations for each row execute function lock_reviewed_identity();

-- ---------------------------------------------------------------- verification documents (private)
create type company_doc_kind as enum ('registry_extract', 'representative_id', 'bank_certificate');

create table company_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references organizations(id) on delete cascade,
  kind company_doc_kind not null,
  path text not null,
  file_name text not null,
  size_kb int not null,
  uploaded_at timestamptz not null default now(),
  unique (org_id, kind)
);
alter table company_documents enable row level security;

create policy "owner reads own documents" on company_documents for select to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid()));
create policy "owner adds documents before submitting" on company_documents for insert to authenticated
  with check (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.status in ('draft', 'rejected')));
create policy "owner removes documents before submitting" on company_documents for delete to authenticated
  using (exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.status in ('draft', 'rejected')));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('company-docs', 'company-docs', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "read own company docs" on storage.objects for select to authenticated
  using (bucket_id = 'company-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "upload own company docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'company-docs' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete own company docs" on storage.objects for delete to authenticated
  using (bucket_id = 'company-docs' and (storage.foldername(name))[1] = auth.uid()::text);

-- The company sends everything for review: all details filled in and all three documents uploaded.
create function submit_company_verification() returns void language plpgsql security definer set search_path = public as $$
declare o organizations;
begin
  select * into o from organizations where owner_id = auth.uid();
  if not found then raise exception 'Add your company details first.'; end if;
  if o.status not in ('draft', 'rejected') then raise exception 'Your company was already submitted.'; end if;
  if coalesce(trim(o.name), '') = '' or coalesce(trim(o.cif), '') = '' or coalesce(trim(o.website), '') = '' or coalesce(trim(o.blurb), '') = '' then
    raise exception 'Fill in all company details first.';
  end if;
  if (select count(*) from company_documents d where d.org_id = o.id) < 3 then raise exception 'Upload all three documents first.'; end if;
  update organizations set status = 'pending', submitted_at = now(), review_note = null where id = o.id;
end $$;

-- Admin only: run from the SQL Editor (see the top of this file).
create function approve_company(org uuid) returns void language sql security definer set search_path = public as $$
  update organizations set status = 'verified', verified = true, verified_at = now(), review_note = null where id = org;
$$;
create function reject_company(org uuid, note text) returns void language sql security definer set search_path = public as $$
  update organizations set status = 'rejected', verified = false, review_note = note where id = org;
$$;
revoke execute on function approve_company(uuid) from public, anon, authenticated;
revoke execute on function reject_company(uuid, text) from public, anon, authenticated;

-- A verified company posts projects under its organization (name + verified badge on every card).
create policy "verified companies post as their organization" on projects for insert to authenticated
  with check (client_id = auth.uid() and status = 'open'
              and exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.verified));

-- ---------------------------------------------------------------- verifying delivery -> credential
-- The client confirms the delivered work: this issues the student's verified credential,
-- completes the project and tells the student. Works for company projects and student requests alike.
create function verify_delivery(app_id uuid, stars int, review_text text) returns void language plpgsql security definer set search_path = public as $$
declare a applications; v_title text;
begin
  select * into a from applications where id = app_id for update;
  if not found or not exists (select 1 from projects p where p.id = a.project_id and p.client_id = auth.uid()) then
    raise exception 'Application not found.';
  end if;
  if a.status::text <> 'delivered' then raise exception 'The student hasn''t marked this work as delivered yet.'; end if;
  if exists (select 1 from credentials c where c.project_id = a.project_id) then raise exception 'You already verified this work.'; end if;
  if stars is null or stars not between 1 and 5 then raise exception 'Pick a rating from 1 to 5 stars.'; end if;
  if char_length(trim(coalesce(review_text, ''))) < 10 then raise exception 'Write a short review (at least 10 characters).'; end if;
  insert into credentials (project_id, student_id, rating, review) values (a.project_id, a.student_id, stars, trim(review_text));
  update projects set status = 'verified' where id = a.project_id returning title into v_title;
  insert into notifications (user_id, kind, title, body, link)
  values (a.student_id, 'credential_issued', 'Your work was verified!', v_title, '/profile');
end $$;

revoke execute on function submit_company_verification() from public, anon;
revoke execute on function verify_delivery(uuid, int, text) from public, anon;
grant execute on function submit_company_verification(), verify_delivery(uuid, int, text) to authenticated;
