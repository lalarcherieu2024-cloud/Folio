-- Removing a project its poster no longer wants to run. Run in the SQL Editor after 0022.
--
--   * Not paid yet (draft) or a student request / legacy project with no money held:  delete_project() removes it
--     and tells anyone who had applied.
--   * Already paid, nobody accepted yet:  the app refunds the company through PayPal and then calls
--     cancel_funded_project(), which marks the escrow refunded and the project cancelled (records are kept).
--   * Someone is already working on it (or it is finished):  it can't be removed.

alter table escrows add column if not exists refund_ref text, add column if not exists refunded_at timestamptz;

create or replace function delete_project(p_id uuid) returns text
language plpgsql security definer set search_path = public as $$
declare p projects;
begin
  select * into p from projects where id = p_id for update;
  if not found or p.client_id is distinct from auth.uid() then raise exception 'Project not found.'; end if;
  if p.status::text not in ('draft', 'open')
     or exists (select 1 from applications a where a.project_id = p_id and a.status::text in ('accepted', 'delivered')) then
    raise exception 'Someone is already working on this, so it can''t be removed.';
  end if;
  if exists (select 1 from escrows e where e.project_id = p_id and e.status::text <> 'awaiting_payment') then
    raise exception 'This project was already paid. Cancel it instead to get your money back.';
  end if;
  insert into notifications (user_id, kind, title, body, link)
  select a.student_id, 'project_removed', 'A project you applied to was removed', p.title, '/applications'
  from applications a where a.project_id = p_id and a.status::text in ('pending', 'interview');
  delete from projects where id = p_id;      -- takes its applications, files and unpaid escrow with it
  return 'deleted';
end $$;

-- Server only: called after the app has refunded the company.
create or replace function cancel_funded_project(p_project uuid, p_owner uuid, p_refund_ref text) returns void
language plpgsql security definer set search_path = public as $$
declare e escrows; p projects;
begin
  select * into p from projects where id = p_project for update;
  if not found or p.client_id is distinct from p_owner then raise exception 'Project not found.'; end if;
  if p.status::text <> 'open' or exists (select 1 from applications a where a.project_id = p_project and a.status::text in ('accepted', 'delivered')) then
    raise exception 'Someone is already working on this, so it can''t be cancelled.';
  end if;
  select * into e from escrows where project_id = p_project for update;
  if not found or e.status <> 'held' then raise exception 'There is no payment to refund.'; end if;
  update escrows set status = 'refunded', refund_ref = p_refund_ref, refunded_at = now() where id = e.id;
  update projects set status = 'cancelled' where id = p_project;
  insert into notifications (user_id, kind, title, body, link)
  select a.student_id, 'project_removed', 'A project you applied to was cancelled', p.title, '/applications'
  from applications a where a.project_id = p_project and a.status::text in ('pending', 'interview');
  update applications set status = 'declined' where project_id = p_project and status::text in ('pending', 'interview');
end $$;

revoke execute on function delete_project(uuid) from public, anon;
revoke execute on function cancel_funded_project(uuid, uuid, text) from public, anon, authenticated;
grant execute on function delete_project(uuid) to authenticated;
