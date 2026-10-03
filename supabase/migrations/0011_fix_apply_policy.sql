-- Fix: students could never apply. The insert rule on "applications" looked up the project in the
-- "projects" table, but students are not allowed to read that table (they browse through the
-- project_cards view), so the lookup always came back empty and every application was refused.
-- This helper does that one check with its own rights. Run in the SQL Editor after 0010.

create or replace function project_accepts_applications(p_project uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from projects p
    where p.id = p_project and p.status = 'open' and p.client_id is distinct from auth.uid()
  );
$$;
revoke all on function project_accepts_applications(uuid) from public, anon;
grant execute on function project_accepts_applications(uuid) to authenticated;

drop policy if exists "apply as yourself, not to your own project" on applications;
drop policy if exists "apply as yourself, not to your own project, with a CV" on applications;
create policy "apply as yourself, not to your own project, with a CV" on applications for insert to authenticated
  with check (
    student_id = auth.uid() and status = 'pending'
    and exists (select 1 from profiles pr where pr.id = auth.uid() and pr.cv_path is not null)
    and project_accepts_applications(project_id)
  );
