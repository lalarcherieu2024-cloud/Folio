-- Files in the message channel (company <-> hired student). Run in the SQL Editor after 0019.
-- A message may now carry files; text-only messages keep working exactly as before.

-- A message can be files only, so an empty body is allowed at the table level. Direct inserts (plain
-- text messages) still have to contain text: that is enforced in the write policy below.
alter table messages drop constraint if exists messages_body_check;
alter table messages drop constraint if exists messages_body_length;
alter table messages add constraint messages_body_length check (char_length(body) <= 2000);

drop policy if exists "participants write as themselves" on messages;
create policy "participants write as themselves" on messages for insert to authenticated
  with check (sender_id = auth.uid() and can_message(application_id) and char_length(trim(body)) >= 1);

create table if not exists message_files (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references messages(id) on delete cascade,
  path text not null,
  file_name text not null,
  size_kb int not null
);
alter table message_files enable row level security;
drop policy if exists "participants read message files" on message_files;
create policy "participants read message files" on message_files for select to authenticated
  using (exists (select 1 from messages m where m.id = message_id and can_message(m.application_id)));
-- No insert/update/delete policy: rows are written only by send_message_with_files().
revoke insert, update, delete on message_files from anon, authenticated;

-- Private bucket, up to 25 MB per file. People upload into their own folder; nobody gets a read policy,
-- the app serves files to the two participants (src/app/api/files/[kind]/[id]/route.ts).
insert into storage.buckets (id, name, public, file_size_limit)
values ('chat-files', 'chat-files', false, 26214400)
on conflict (id) do nothing;
drop policy if exists "upload own chat files" on storage.objects;
create policy "upload own chat files" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-files' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own chat files" on storage.objects;
create policy "delete own chat files" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-files' and (storage.foldername(name))[1] = auth.uid()::text);

-- p_files: [{ "path": "<user id>/...", "name": "plan.pdf", "size_kb": 120 }, ...] (1 to 5), p_body optional.
create or replace function send_message_with_files(p_app uuid, p_body text, p_files jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare v_id uuid; f jsonb; v_body text := trim(coalesce(p_body, ''));
begin
  if not can_message(p_app) then raise exception 'Messages open once the student is accepted.'; end if;
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
revoke execute on function send_message_with_files(uuid, text, jsonb) from public, anon;
grant execute on function send_message_with_files(uuid, text, jsonb) to authenticated;

-- The "new message" notification of a files-only message says so instead of showing an empty line.
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
  values (v_to, 'message', 'New message from ' || coalesce(v_from, 'Folio'), left(coalesce(nullif(new.body, ''), 'Sent you a file'), 120), v_link);
  return new;
end $$;
