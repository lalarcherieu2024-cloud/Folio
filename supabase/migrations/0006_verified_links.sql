-- Verified GitHub / LinkedIn. Run in the SQL Editor after 0005.
-- "Verified" means the student signed in to that account through OAuth while logged in to Folio,
-- so Supabase holds a linked identity for it. Users cannot write these columns (see 0005 grants).
alter table profiles
  add column if not exists github_verified boolean not null default false,
  add column if not exists linkedin_verified boolean not null default false;

-- Reads the caller's real linked identities and updates their profile to match.
-- Called by the app after an OAuth link completes. Only ever touches the caller's own row.
create or replace function sync_verified_identities() returns void
language sql security definer set search_path = public, auth as $$
  update public.profiles p set
    github_verified = exists (select 1 from auth.identities i where i.user_id = auth.uid() and i.provider = 'github'),
    github_handle = coalesce((select i.identity_data->>'user_name' from auth.identities i where i.user_id = auth.uid() and i.provider = 'github' limit 1), p.github_handle),
    linkedin_verified = exists (select 1 from auth.identities i where i.user_id = auth.uid() and i.provider = 'linkedin_oidc')
  where p.id = auth.uid();
$$;
revoke all on function sync_verified_identities() from public, anon;
grant execute on function sync_verified_identities() to authenticated;
