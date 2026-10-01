-- Account roles + locking down what a user can edit about their own profile.
-- Run in the SQL Editor after 0004.
create type user_role as enum ('student', 'company');
alter table profiles add column if not exists role user_role not null default 'student';

-- New accounts pick their side at sign-up (metadata.role); anything else becomes a student.
create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, program, role, uni_email_verified)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          coalesce(new.raw_user_meta_data->>'program', ''),
          case when new.raw_user_meta_data->>'role' = 'company' then 'company'::user_role else 'student'::user_role end,
          new.email_confirmed_at is not null and public.is_university_email(new.email));
  return new;
end $$;

-- A signed-in user may only edit these profile columns. Without this they could set their own
-- role or uni_email_verified through the API, since the row-level policy lets them update their row.
revoke update on profiles from authenticated;
grant update (full_name, program, github_handle, linkedin_url, cv_path, cv_name, cv_size_kb, cv_uploaded_at, strengths)
  on profiles to authenticated;
