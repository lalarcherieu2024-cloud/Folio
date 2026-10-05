-- Payments with escrow. Run in the SQL Editor after 0019, 0020 and 0021 (it rewrites verify_delivery from 0021).
--
-- Money flow:
--   1. A company posts a project. It starts as a DRAFT (students can't see it) with an escrow awaiting payment.
--   2. The company pays price + Folio's fee. Folio holds the money (escrow status "held"); the project opens.
--   3. A student is accepted, works, submits, and the company verifies the work: the escrow is RELEASED, which
--      puts the student's price into their available balance.
--   4. The student withdraws their balance to PayPal.
--
-- Every function that moves money is callable only by the server (service role), never by a signed-in user,
-- and no table here has an insert/update/delete policy. The app code is in src/lib/data/payments.ts.
-- Amounts are in cents (EUR).

alter type project_status add value if not exists 'draft';

do $$ begin
  create type escrow_status as enum ('awaiting_payment', 'held', 'released', 'paid_out', 'refunded');
exception when duplicate_object then null; end $$;
do $$ begin
  create type withdrawal_status as enum ('pending', 'sent', 'failed');
exception when duplicate_object then null; end $$;

-- The PayPal account a student gets paid to. (PayPal payouts need an email, not a paypal.me link.)
alter table profiles add column if not exists paypal_email text;
grant update (paypal_email) on profiles to authenticated;

create table if not exists withdrawals (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references profiles(id),
  amount_cents int not null check (amount_cents > 0),
  paypal_email text not null,
  status withdrawal_status not null default 'pending',
  provider text not null,                -- 'paypal' | 'simulated'
  provider_ref text,                     -- PayPal payout batch id
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists escrows (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references projects(id) on delete cascade,
  payer_id uuid not null references profiles(id),
  student_id uuid references profiles(id),            -- who gets the money; set when it is released
  amount_cents int not null check (amount_cents > 0), -- what the student receives (the project price)
  fee_cents int not null check (fee_cents >= 0),      -- Folio's fee, paid by the company on top
  status escrow_status not null default 'awaiting_payment',
  provider text not null,                             -- 'paypal' | 'simulated'
  provider_ref text,                                  -- PayPal order id, then the capture id
  withdrawal_id uuid references withdrawals(id),
  created_at timestamptz not null default now(),
  funded_at timestamptz,
  released_at timestamptz,
  paid_out_at timestamptz
);

alter table escrows enable row level security;
alter table withdrawals enable row level security;

drop policy if exists "payer and student read their escrow" on escrows;
create policy "payer and student read their escrow" on escrows for select to authenticated
  using (payer_id = auth.uid() or student_id = auth.uid()
         or exists (select 1 from applications a where a.project_id = escrows.project_id and a.student_id = auth.uid() and a.status::text in ('accepted', 'delivered')));
drop policy if exists "students read their withdrawals" on withdrawals;
create policy "students read their withdrawals" on withdrawals for select to authenticated using (student_id = auth.uid());
revoke insert, update, delete on escrows, withdrawals from anon, authenticated;

-- Companies can only post DRAFTS; a project opens when its escrow is funded (fund_escrow below).
drop policy if exists "verified companies post as their organization" on projects;
drop policy if exists "companies post unpaid drafts as their organization" on projects;
create policy "companies post unpaid drafts as their organization" on projects for insert to authenticated
  with check (client_id = auth.uid() and status::text = 'draft'   -- text compare: the new enum value can't be used as a literal in the same transaction that adds it

              and exists (select 1 from organizations o where o.id = org_id and o.owner_id = auth.uid() and o.verified));

-- ---------------------------------------------------------------- server-only money functions
-- Called by the app with the service role after it has confirmed the payment with PayPal.
create or replace function fund_escrow(p_escrow uuid, p_provider_ref text) returns boolean
language plpgsql security definer set search_path = public as $$
declare e escrows;
begin
  select * into e from escrows where id = p_escrow for update;
  if not found or e.status <> 'awaiting_payment' then return false; end if;
  update escrows set status = 'held', provider_ref = p_provider_ref, funded_at = now() where id = p_escrow;
  update projects set status = 'open' where id = e.project_id and status::text = 'draft';
  return true;
end $$;

-- Moves the student's released money into a pending withdrawal (all or nothing, one at a time).
create or replace function create_withdrawal(p_student uuid, p_provider text)
returns table (out_id uuid, out_cents int, out_email text)
language plpgsql security definer set search_path = public as $$
declare v_email text; v_total int; v_id uuid;
begin
  select paypal_email into v_email from profiles where id = p_student;
  if v_email is null or trim(v_email) = '' then raise exception 'Add your PayPal email first.'; end if;
  perform 1 from escrows where student_id = p_student and status = 'released' and withdrawal_id is null for update;
  select coalesce(sum(amount_cents), 0) into v_total from escrows where student_id = p_student and status = 'released' and withdrawal_id is null;
  if v_total <= 0 then raise exception 'Nothing to withdraw yet.'; end if;
  if exists (select 1 from withdrawals where student_id = p_student and status = 'pending') then
    raise exception 'A withdrawal is already being processed.';
  end if;
  insert into withdrawals (student_id, amount_cents, paypal_email, provider) values (p_student, v_total, v_email, p_provider) returning id into v_id;
  update escrows set withdrawal_id = v_id where student_id = p_student and status = 'released' and withdrawal_id is null;
  return query select v_id, v_total, v_email;
end $$;

create or replace function complete_withdrawal(p_id uuid, p_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare w withdrawals;
begin
  update withdrawals set status = 'sent', provider_ref = p_ref, sent_at = now() where id = p_id and status = 'pending' returning * into w;
  if not found then return; end if;
  update escrows set status = 'paid_out', paid_out_at = now() where withdrawal_id = p_id;
  insert into notifications (user_id, kind, title, body, link)
  values (w.student_id, 'payout', 'Your payout is on its way', to_char(w.amount_cents / 100.0, 'FM999990.00') || ' EUR sent to ' || w.paypal_email, '/payments');
end $$;

-- A failed payout puts the money back in the student's available balance.
create or replace function fail_withdrawal(p_id uuid, p_error text) returns void
language plpgsql security definer set search_path = public as $$
begin
  update withdrawals set status = 'failed', error = left(coalesce(p_error, 'Unknown error'), 500) where id = p_id and status = 'pending';
  if found then update escrows set withdrawal_id = null where withdrawal_id = p_id and status = 'released'; end if;
end $$;

revoke execute on function fund_escrow(uuid, text) from public, anon, authenticated;
revoke execute on function create_withdrawal(uuid, text) from public, anon, authenticated;
revoke execute on function complete_withdrawal(uuid, text) from public, anon, authenticated;
revoke execute on function fail_withdrawal(uuid, text) from public, anon, authenticated;

-- ---------------------------------------------------------------- verifying the work releases the money
drop function if exists verify_delivery(uuid, int, text, text);
create or replace function verify_delivery(app_id uuid, stars int, review_text text, p_signature text default null) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; v_title text; v_name text; v_paid int := 0;
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

  -- Projects with an escrow must have been paid for; verifying releases the student's money.
  if exists (select 1 from escrows e where e.project_id = a.project_id) then
    update escrows set status = 'released', student_id = a.student_id, released_at = now()
      where project_id = a.project_id and status = 'held' returning amount_cents into v_paid;
    if not found then raise exception 'This project hasn''t been paid yet.'; end if;
  end if;

  select full_name into v_name from profiles where id = auth.uid();
  insert into credentials (project_id, student_id, rating, review, client_signature, client_signer, client_signed_at)
  values (a.project_id, a.student_id, stars, trim(review_text), p_signature,
          case when p_signature is null then null else coalesce(v_name, 'Authorised signatory') end,
          case when p_signature is null then null else now() end);
  update submissions set status = 'accepted', reviewed_at = now() where application_id = app_id and status = 'submitted';
  update projects set status = 'verified' where id = a.project_id returning title into v_title;
  insert into notifications (user_id, kind, title, body, link)
  values (a.student_id, 'credential_issued', 'Your work was verified!',
          v_title || case when v_paid > 0 then '. ' || to_char(v_paid / 100.0, 'FM999990.00') || ' EUR is now available to withdraw.' else '' end
                  || case when p_signature is null then '' else ' Sign your certificate to complete it.' end,
          case when v_paid > 0 then '/payments' else '/profile' end);
end $$;
revoke execute on function verify_delivery(uuid, int, text, text) from public, anon;
grant execute on function verify_delivery(uuid, int, text, text) to authenticated;

-- ---------------------------------------------------------------- finished projects: conversation is history only
-- Reading stays open to the two participants (can_message); writing needs the project NOT to be verified yet.
create or replace function can_write_message(app uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select can_message(app) and not exists (
    select 1 from applications a join projects p on p.id = a.project_id where a.id = app and p.status::text = 'verified');
$$;
revoke execute on function can_write_message(uuid) from public, anon;
grant execute on function can_write_message(uuid) to authenticated;

drop policy if exists "participants write as themselves" on messages;
create policy "participants write as themselves" on messages for insert to authenticated
  with check (sender_id = auth.uid() and can_write_message(application_id) and char_length(trim(body)) >= 1);

create or replace function send_message_with_files(p_app uuid, p_body text, p_files jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; f jsonb; v_body text := trim(coalesce(p_body, ''));
begin
  if not can_message(p_app) then raise exception 'Messages open once the student is accepted.'; end if;
  if not can_write_message(p_app) then raise exception 'This project is complete, so the conversation is now read-only.'; end if;
  if char_length(v_body) > 2000 then raise exception 'Keep messages under 2,000 characters.'; end if;
  if p_files is null or jsonb_typeof(p_files) <> 'array' or jsonb_array_length(p_files) not between 1 and 5 then
    raise exception 'Attach between 1 and 5 files.';
  end if;
  insert into messages (application_id, sender_id, body) values (p_app, auth.uid(), v_body) returning id into v_id;
  for f in select * from jsonb_array_elements(p_files) loop
    if coalesce(f->>'path', '') not like auth.uid()::text || '/%' then raise exception 'Invalid file.'; end if;
    insert into message_files (message_id, path, file_name, size_kb)
    values (v_id, f->>'path', left(coalesce(nullif(f->>'name', ''), 'file'), 120), greatest(1, coalesce((f->>'size_kb')::int, 1)));
  end loop;
  return v_id;
end $$;
