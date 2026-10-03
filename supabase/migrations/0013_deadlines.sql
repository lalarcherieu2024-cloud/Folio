-- Deadline nudges: remember when a student was accepted, so "due in N days" can be shown.
-- Run in the SQL Editor after 0012.
alter table applications add column if not exists accepted_at timestamptz;
update applications set accepted_at = created_at where status::text in ('accepted', 'delivered') and accepted_at is null;

create or replace function accept_applicant(p_application_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare v_project uuid; v_owner uuid; v_status project_status;
begin
  select project_id into v_project from applications where id = p_application_id;
  if v_project is null then raise exception 'Application not found'; end if;
  select client_id, status into v_owner, v_status from projects where id = v_project for update;
  if v_owner is distinct from auth.uid() then raise exception 'This is not your project'; end if;
  if v_status <> 'open' then raise exception 'This project is no longer open'; end if;
  update applications set status = 'accepted', accepted_at = now() where id = p_application_id;
  update applications set status = 'declined' where project_id = v_project and id <> p_application_id and status = 'pending';
  update projects set status = 'in_progress' where id = v_project;
end $$;
revoke all on function accept_applicant(uuid) from public, anon;
grant execute on function accept_applicant(uuid) to authenticated;
