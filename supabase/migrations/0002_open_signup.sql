-- Open sign-up: anyone can create an account. Run in SQL Editor after 0001.
-- The "verified student" badge is still earned only by confirming a university
-- email (domains listed in allowed_email_domains).
drop trigger if exists enforce_signup_domain on auth.users;
drop function if exists check_signup_domain();

create or replace function is_university_email(addr text) returns boolean language sql stable set search_path = public as $$
  select exists (select 1 from allowed_email_domains d where d.domain = lower(split_part(addr, '@', 2)))
$$;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, program, uni_email_verified)
  values (new.id,
          coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
          coalesce(new.raw_user_meta_data->>'program', ''),
          new.email_confirmed_at is not null and public.is_university_email(new.email));
  return new;
end $$;

create or replace function handle_email_confirmed() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null and public.is_university_email(new.email) then
    update public.profiles set uni_email_verified = true where id = new.id;
  end if;
  return new;
end $$;
