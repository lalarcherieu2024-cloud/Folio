-- Companies can sign up with LinkedIn too. LinkedIn sign-up can't pass metadata.role, so handle_new_user makes
-- every new LinkedIn account a student; right after that first sign-in, /auth/callback calls this to turn it into
-- a company account. Run in the SQL Editor after 0026 (0026_remove_student_posting).
--
-- Only an account that is minutes old and still untouched (no photo, no CV, no applications) can switch, so an
-- existing student can't turn themselves into a company through the API.
create or replace function become_company() returns boolean language plpgsql security definer set search_path = public as $$
declare
  switched integer;
begin
  update profiles p set role = 'company'
  where p.id = auth.uid()
    and p.role = 'student'
    and p.avatar_path is null
    and p.cv_path is null
    and exists (select 1 from auth.users u where u.id = p.id and u.created_at > now() - interval '15 minutes')
    and not exists (select 1 from applications a where a.student_id = p.id);
  get diagnostics switched = row_count;
  return switched > 0;
end $$;

revoke execute on function become_company() from public, anon;
grant execute on function become_company() to authenticated;
