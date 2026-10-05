-- Pictures on project cards: the posting company's logo, or the student's photo when a student posted it.
-- Run after 0023. Same view as 0012, plus org_logo_path (from 0016) and client_avatar_path (from 0014).
-- Rebuilt rather than replaced, because the view's "p.*" was fixed when it was created and projects has gained columns since.
drop view if exists project_cards;
create view project_cards as
select p.*, o.name as org_name, coalesce(o.verified, false) as org_verified,
       (select count(*) from applications a where a.project_id = p.id)::int as applicant_count,
       o.industry as org_industry, o.size as org_size, o.founded as org_founded, o.blurb as org_blurb, o.website as org_website,
       o.logo_path as org_logo_path, c.avatar_path as client_avatar_path
from projects p
left join organizations o on o.id = p.org_id
left join profiles c on c.id = p.client_id
where p.status = 'open'
   or p.client_id = auth.uid()
   or exists (select 1 from applications a where a.project_id = p.id and a.student_id = auth.uid());
grant select on project_cards to anon, authenticated;
