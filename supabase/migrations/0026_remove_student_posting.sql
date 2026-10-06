-- Folio is companies -> students only: students can no longer post projects for other students.
-- Run in the SQL Editor after 0025. Safe to run more than once.
--
-- * Students lose the right to insert projects (companies keep theirs, see 0022).
-- * Student-posted projects that were still OPEN or a draft are cancelled, so they leave Find projects. Their records are
--   kept (nothing is deleted), people who had applied are told, and projects someone is already working on are left alone.
-- * The student "edit my request" function is dropped.

drop policy if exists "students post student requests" on projects;

with cancelled as (
  update projects set status = 'cancelled'
  where org_id is null and status::text in ('open', 'draft')
  returning id, title
), notified as (
  insert into notifications (user_id, kind, title, body, link)
  select a.student_id, 'project_removed', 'A project you applied to was removed', c.title, '/applications'
  from applications a join cancelled c on c.id = a.project_id
  where a.status::text in ('pending', 'interview')
  returning 1
)
update applications set status = 'declined'
where project_id in (select id from cancelled) and status::text in ('pending', 'interview');

drop function if exists update_project(uuid, text, text, text, text[], text, int, int, text[]);
