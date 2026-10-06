-- Folio is for IE students: a student account needs a confirmed IE email (allowed_email_domains) before it can use
-- the app. Someone who signed up with LinkedIn or a personal email confirms their IE address in onboarding, which
-- changes the account's email to it (Supabase email change). Run in the SQL Editor after 0027.
--
-- 0002 only grants the badge when an email is first confirmed; this also grants it when a confirmed email changes to
-- an IE address, and takes it away when it changes to anything else.
create or replace function handle_email_changed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set uni_email_verified = new.email_confirmed_at is not null and public.is_university_email(new.email)
   where id = new.id;
  return new;
end $$;

drop trigger if exists on_auth_user_email_changed on auth.users;
create trigger on_auth_user_email_changed
  after update of email on auth.users
  for each row when (old.email is distinct from new.email)
  execute function handle_email_changed();
