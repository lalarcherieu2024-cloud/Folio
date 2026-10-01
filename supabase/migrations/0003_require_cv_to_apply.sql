-- A student must have a CV on their profile before they can apply. Run in the SQL Editor after 0002.
drop policy if exists "apply as yourself, not to your own project" on applications;
create policy "apply as yourself, not to your own project, with a CV" on applications for insert to authenticated
  with check (
    student_id = auth.uid() and status = 'pending'
    and exists (select 1 from profiles pr where pr.id = auth.uid() and pr.cv_path is not null)
    and exists (select 1 from projects p where p.id = project_id and p.status = 'open' and p.client_id is distinct from auth.uid())
  );
