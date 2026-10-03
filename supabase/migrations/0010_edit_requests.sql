-- Editing a request + notifications. Run in the SQL Editor after 0009.

-- 1) Notifications. Rows are created only by the trusted functions/triggers below, never by users.
create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null default '',
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on notifications (user_id, created_at desc);
alter table notifications enable row level security;
create policy "see own notifications" on notifications for select to authenticated using (user_id = auth.uid());
create policy "mark own notifications read" on notifications for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
revoke update on notifications from authenticated;
grant update (read_at) on notifications to authenticated;

-- 2) Nobody edits a project directly any more: every change goes through update_project() (open
--    projects only) or accept_applicant(). Once someone is accepted the project is locked for everyone.
revoke update on projects from authenticated;

create or replace function update_project(
  p_id uuid, p_title text, p_category text, p_summary text, p_deliverables text[],
  p_done_when text, p_price int, p_weeks int, p_skills text[]
) returns int language plpgsql security definer set search_path = public as $$
declare o projects%rowtype; v_notified int := 0;
begin
  select * into o from projects where id = p_id for update;
  if not found then raise exception 'Project not found'; end if;
  if o.client_id is distinct from auth.uid() then raise exception 'This is not your project'; end if;
  if o.status <> 'open' then raise exception 'This project can no longer be edited'; end if;

  -- Nothing changed: don't bother applicants.
  if o.title = p_title and o.category = p_category and o.summary = p_summary and o.deliverables = p_deliverables
     and o.done_when = p_done_when and o.price_eur = p_price and o.weeks = p_weeks and o.skills = p_skills then
    return 0;
  end if;

  update projects set title = p_title, category = p_category, summary = p_summary, deliverables = p_deliverables,
    done_when = p_done_when, price_eur = p_price, weeks = p_weeks, skills = p_skills where id = p_id;

  insert into notifications (user_id, kind, title, body, link)
  select a.student_id, 'project_edited', 'A project you applied to was updated', p_title, '/projects?project=' || p_id
  from applications a where a.project_id = p_id and a.status = 'pending';
  get diagnostics v_notified = row_count;
  return v_notified;
end $$;
revoke all on function update_project(uuid, text, text, text, text[], text, int, int, text[]) from public, anon;
grant execute on function update_project(uuid, text, text, text, text[], text, int, int, text[]) to authenticated;

-- 3) Tell a student when their application is accepted or declined (fires for any status change,
--    including the ones made by accept_applicant()).
create or replace function notify_application_decision() returns trigger language plpgsql security definer set search_path = public as $$
declare v_title text;
begin
  if new.status = old.status or new.status::text not in ('accepted', 'declined') then return new; end if;
  select title into v_title from projects where id = new.project_id;
  insert into notifications (user_id, kind, title, body, link)
  values (new.student_id, 'application_' || new.status::text,
          case when new.status::text = 'accepted' then 'You were accepted!' else 'Not selected this time' end,
          v_title, '/applications');
  return new;
end $$;
drop trigger if exists on_application_decision on applications;
create trigger on_application_decision after update of status on applications
  for each row execute function notify_application_decision();
