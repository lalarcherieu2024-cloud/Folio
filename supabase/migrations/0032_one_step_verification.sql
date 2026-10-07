-- Verification in one step, and the admin page. Run in the SQL Editor after 0031.
--
-- * Companies send their details for review in one go, from one form. The founder's LinkedIn is no longer required
--   (it's an optional field; connecting it still gives the "LinkedIn verified" badge).
-- * Approving and rejecting now happens on the admin page (/admin, server-side with the service role) instead of the
--   SQL Editor; approve_company() and reject_company() still work from the SQL Editor.

create or replace function submit_company_verification() returns void language plpgsql security definer set search_path = public as $$
declare o organizations;
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
  update organizations set status = 'pending', submitted_at = now(), review_note = null where id = o.id;
end $$;
