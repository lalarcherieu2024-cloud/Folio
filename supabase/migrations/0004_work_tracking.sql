-- Redesign support: delivered status, withdraw, CV strengths. Run in the SQL Editor after 0003.
alter type app_status add value if not exists 'delivered';

alter table profiles add column if not exists strengths jsonb;   -- { fields: [{label,pct}], skills: [{label,pct}] }

-- A student may withdraw an application that is still pending.
create policy "withdraw own pending application" on applications for delete to authenticated
  using (student_id = auth.uid() and status::text = 'pending');

-- A student may mark their own accepted application as delivered (and nothing else).
create policy "mark own accepted application delivered" on applications for update to authenticated
  using (student_id = auth.uid() and status::text = 'accepted')
  with check (student_id = auth.uid() and status::text in ('accepted', 'delivered'));
