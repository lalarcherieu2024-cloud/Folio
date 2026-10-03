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
