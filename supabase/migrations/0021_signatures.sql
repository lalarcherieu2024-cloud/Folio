-- E-signatures on the certificate. Run in the SQL Editor after 0019 (and 0020).
-- Order: the company signs when it approves the work (or later), then the student signs their own copy.
-- A signature is a small PNG (drawn, or a typed name rendered as an image), stored as a data URL.
-- It can be set once and never changed, and only by the right person, through the functions below.
-- Like everything else on a credential, it is readable by anyone: it is printed on the public certificate.

alter table credentials
  add column if not exists client_signature text,
  add column if not exists client_signer text,        -- name of the person who signed for the client
  add column if not exists client_signed_at timestamptz,
  add column if not exists student_signature text,
  add column if not exists student_signed_at timestamptz;

create or replace function valid_signature(sig text) returns boolean language sql immutable as $$
  select sig like 'data:image/png;base64,%' and char_length(sig) between 200 and 200000
$$;

-- The company signs a certificate it issued (once).
create or replace function sign_credential_as_client(p_credential uuid, p_signature text) returns void
language plpgsql security definer set search_path = public as $$
declare c credentials; v_name text;
begin
  select * into c from credentials where id = p_credential for update;
  if not found or not exists (select 1 from projects p where p.id = c.project_id and p.client_id = auth.uid()) then
    raise exception 'Certificate not found.';
  end if;
  if c.client_signed_at is not null then raise exception 'You already signed this certificate.'; end if;
  if not valid_signature(p_signature) then raise exception 'Draw or type your signature first.'; end if;
  select full_name into v_name from profiles where id = auth.uid();
  update credentials set client_signature = p_signature, client_signer = coalesce(v_name, 'Authorised signatory'), client_signed_at = now() where id = p_credential;
  insert into notifications (user_id, kind, title, body, link)
  values (c.student_id, 'certificate_signed', 'Your certificate was signed', 'Sign it too to complete it.', '/profile');
end $$;

-- The student signs their own certificate, after the company has signed (once).
create or replace function sign_credential_as_student(p_credential uuid, p_signature text) returns void
language plpgsql security definer set search_path = public as $$
declare c credentials;
begin
  select * into c from credentials where id = p_credential for update;
  if not found or c.student_id <> auth.uid() then raise exception 'Certificate not found.'; end if;
  if c.client_signed_at is null then raise exception 'The company has to sign first.'; end if;
  if c.student_signed_at is not null then raise exception 'You already signed this certificate.'; end if;
  if not valid_signature(p_signature) then raise exception 'Draw or type your signature first.'; end if;
  update credentials set student_signature = p_signature, student_signed_at = now() where id = p_credential;
end $$;

-- Approving the work can now include the company's signature in the same step.
drop function if exists verify_delivery(uuid, int, text);
create or replace function verify_delivery(app_id uuid, stars int, review_text text, p_signature text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; v_title text; v_cred uuid; v_name text;
begin
  select * into a from applications where id = app_id for update;
  if not found or not exists (select 1 from projects p where p.id = a.project_id and p.client_id = auth.uid()) then
    raise exception 'Application not found.';
  end if;
  if a.status::text <> 'delivered' then raise exception 'The student hasn''t submitted their work yet.'; end if;
  if exists (select 1 from credentials c where c.project_id = a.project_id) then raise exception 'You already verified this work.'; end if;
  if stars is null or stars not between 1 and 5 then raise exception 'Pick a rating from 1 to 5 stars.'; end if;
  if char_length(trim(coalesce(review_text, ''))) < 10 then raise exception 'Write a short review (at least 10 characters).'; end if;
  if p_signature is not null and not valid_signature(p_signature) then raise exception 'Draw or type your signature first.'; end if;
  select full_name into v_name from profiles where id = auth.uid();
  insert into credentials (project_id, student_id, rating, review, client_signature, client_signer, client_signed_at)
  values (a.project_id, a.student_id, stars, trim(review_text), p_signature,
          case when p_signature is null then null else coalesce(v_name, 'Authorised signatory') end,
          case when p_signature is null then null else now() end)
  returning id into v_cred;
  update submissions set status = 'accepted', reviewed_at = now() where application_id = app_id and status = 'submitted';
  update projects set status = 'verified' where id = a.project_id returning title into v_title;
  insert into notifications (user_id, kind, title, body, link)
  values (a.student_id, 'credential_issued', 'Your work was verified!',
          v_title || case when p_signature is null then '' else '. Sign your certificate to complete it.' end, '/profile');
end $$;

revoke execute on function sign_credential_as_client(uuid, text) from public, anon;
revoke execute on function sign_credential_as_student(uuid, text) from public, anon;
revoke execute on function verify_delivery(uuid, int, text, text) from public, anon;
grant execute on function sign_credential_as_client(uuid, text), sign_credential_as_student(uuid, text), verify_delivery(uuid, int, text, text) to authenticated;
