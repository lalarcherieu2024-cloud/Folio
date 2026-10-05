-- Interviews + a message channel between a company and the student it hired. Run after 0016.
--
-- Flow: applied (pending) → [optional] interview → accepted → delivered → verified.
-- The company can invite an applicant to an interview (date, time, link or address), the student
-- confirms it, then the company accepts or declines. Once accepted, the two can message each other.

-- ---------------------------------------------------------------- interview step
alter type app_status add value if not exists 'interview' after 'pending';

alter table applications
  add column if not exists interview_at timestamptz,
  add column if not exists interview_where text,          -- meeting link, or an address for in person
  add column if not exists interview_note text,
  add column if not exists interview_confirmed_at timestamptz;

-- The client invites (or reschedules) an applicant. Tells the student.
create or replace function invite_to_interview(app_id uuid, at timestamptz, place text, note text) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; p projects;
begin
  select * into a from applications where id = app_id for update;
  if not found then raise exception 'Application not found.'; end if;
  select * into p from projects where id = a.project_id;
  if p.client_id is distinct from auth.uid() then raise exception 'Application not found.'; end if;
  if p.status <> 'open' then raise exception 'This project is no longer open.'; end if;
  if a.status::text not in ('pending', 'interview') then raise exception 'You already decided on this applicant.'; end if;
  if at is null or at < now() then raise exception 'Pick a date and time in the future.'; end if;
  if char_length(trim(coalesce(place, ''))) < 3 then raise exception 'Add a meeting link or an address.'; end if;

  update applications set status = 'interview', interview_at = at, interview_where = trim(place),
    interview_note = nullif(trim(coalesce(note, '')), ''), interview_confirmed_at = null
  where id = app_id;

  insert into notifications (user_id, kind, title, body, link)
  values (a.student_id, 'interview_invited',
          case when a.status::text = 'interview' then 'Your interview was rescheduled' else 'You''re invited to an interview' end,
          p.title || ' · ' || to_char(at at time zone 'Europe/Madrid', 'Dy DD Mon, HH24:MI'), '/applications/' || a.id);
end $$;

-- The student confirms they'll be there. Tells the client.
create or replace function confirm_interview(app_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a applications; p projects; v_name text;
begin
  select * into a from applications where id = app_id for update;
  if not found or a.student_id is distinct from auth.uid() then raise exception 'Application not found.'; end if;
  if a.status::text <> 'interview' then raise exception 'There is no interview to confirm.'; end if;
  update applications set interview_confirmed_at = now() where id = app_id;
  select * into p from projects where id = a.project_id;
  select full_name into v_name from profiles where id = a.student_id;
  insert into notifications (user_id, kind, title, body, link)
  values (p.client_id, 'interview_confirmed', v_name || ' confirmed the interview', p.title, '/company/applicants/' || a.id);
end $$;

-- A student may also withdraw while an interview is planned (0004 only allowed it while pending).
create policy "withdraw own application during interview" on applications for delete to authenticated
  using (student_id = auth.uid() and status::text = 'interview');

-- Accepting someone now also declines applicants who were interviewing (same as 0013 otherwise).
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
  update applications set status = 'declined' where project_id = v_project and id <> p_application_id and status::text in ('pending', 'interview');
  update projects set status = 'in_progress' where id = v_project;
end $$;

-- ---------------------------------------------------------------- messages (after acceptance)
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references applications(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null check (char_length(trim(body)) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index if not exists messages_by_application on messages (application_id, created_at);
alter table messages enable row level security;

-- Who may read and write a conversation: the hired student and the company, once the student was accepted.
create or replace function can_message(app uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from applications a join projects p on p.id = a.project_id
    where a.id = app and p.org_id is not null and a.status::text in ('accepted', 'delivered')
      and (a.student_id = auth.uid() or p.client_id = auth.uid()));
$$;

create policy "participants read the conversation" on messages for select to authenticated using (can_message(application_id));
create policy "participants write as themselves" on messages for insert to authenticated
  with check (sender_id = auth.uid() and can_message(application_id));
-- No update or delete: a conversation is a record of what was agreed.
revoke update, delete on messages from anon, authenticated;

-- Each new message notifies the other person.
create or replace function notify_new_message() returns trigger
language plpgsql security definer set search_path = public as $$
declare a applications; p projects; v_to uuid; v_from text; v_link text;
begin
  select * into a from applications where id = new.application_id;
  select * into p from projects where id = a.project_id;
  if new.sender_id = a.student_id then
    v_to := p.client_id; v_link := '/company/applicants/' || a.id;
    select full_name into v_from from profiles where id = a.student_id;
  else
    v_to := a.student_id; v_link := '/applications/' || a.id;
    select coalesce(o.name, p.client_name) into v_from from organizations o where o.id = p.org_id;
  end if;
  insert into notifications (user_id, kind, title, body, link)
  values (v_to, 'message', 'New message from ' || coalesce(v_from, 'Folio'), left(new.body, 120), v_link);
  return new;
end $$;
drop trigger if exists on_new_message on messages;
create trigger on_new_message after insert on messages for each row execute function notify_new_message();

revoke execute on function invite_to_interview(uuid, timestamptz, text, text) from public, anon;
revoke execute on function confirm_interview(uuid) from public, anon;
revoke execute on function can_message(uuid) from public, anon;
grant execute on function invite_to_interview(uuid, timestamptz, text, text), confirm_interview(uuid), can_message(uuid) to authenticated;
