-- Student-feel features: effort/learning tags, saved projects, milestones. Run after 0011.

-- 1) Effort and learning info on each project.
alter table projects
  add column if not exists hours_per_week int check (hours_per_week between 1 and 60),
  add column if not exists learn text[] not null default '{}',
  add column if not exists beginner_friendly boolean not null default false;

-- Demo projects (matched by title; harmless if absent).
update projects set hours_per_week = 6, learn = array['Metabase','Dashboards']      where title = 'Payments reconciliation dashboard';
update projects set hours_per_week = 5, learn = array['Data cleaning','Excel'],    beginner_friendly = true where title = 'Clean and merge supplier price lists';
update projects set hours_per_week = 8, learn = array['Webflow','Responsive design'] where title = 'Rebuild our landing page in Webflow';
update projects set hours_per_week = 6, learn = array['Email copywriting','HubSpot'], beginner_friendly = true where title = 'Onboarding email sequence for new clinics';
update projects set hours_per_week = 8, learn = array['Financial modeling']          where title = 'Unit-economics model for our 40-van fleet';
update projects set hours_per_week = 5, learn = array['Market research'],           beginner_friendly = true where title = 'Competitor scan: Madrid veggie-box delivery';
update projects set hours_per_week = 6, learn = array['Video editing','Storytelling'] where title = '60-second product demo video';
update projects set hours_per_week = 6, learn = array['React','Landing pages'],     beginner_friendly = true where title = 'Landing page and waitlist for my campus-delivery startup';
update projects set hours_per_week = 5, learn = array['Branding','Canva'],          beginner_friendly = true where title = 'Logo and brand kit for my thrift-fashion Instagram shop';

-- 2) Rebuild the browse view so it includes the new columns (a view's "p.*" is fixed when created).
drop view if exists project_cards;
create view project_cards as
select p.*, o.name as org_name, coalesce(o.verified, false) as org_verified,
       (select count(*) from applications a where a.project_id = p.id)::int as applicant_count,
       o.industry as org_industry, o.size as org_size, o.founded as org_founded, o.blurb as org_blurb, o.website as org_website
from projects p
left join organizations o on o.id = p.org_id
where p.status = 'open'
   or p.client_id = auth.uid()
   or exists (select 1 from applications a where a.project_id = p.id and a.student_id = auth.uid());
grant select on project_cards to anon, authenticated;

-- 3) Credentials also expose the field and the price, so milestones can be computed.
create or replace view credential_cards as
select c.id, c.student_id, c.project_id, c.rating, c.review, c.issued_at,
       p.title as project_title, p.client_name, o.name as org_name, p.hood,
       p.category, p.price_eur
from credentials c
join projects p on p.id = c.project_id
left join organizations o on o.id = p.org_id;

-- 4) Saved projects (the heart).
create table if not exists saved_projects (
  user_id uuid not null references profiles(id) on delete cascade,
  project_id uuid not null references projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, project_id)
);
alter table saved_projects enable row level security;
create policy "see own saved projects" on saved_projects for select to authenticated using (user_id = auth.uid());
create policy "save for myself"        on saved_projects for insert to authenticated with check (user_id = auth.uid());
create policy "unsave"                 on saved_projects for delete to authenticated using (user_id = auth.uid());

-- 5) Editing a request now also covers the new fields.
drop function if exists update_project(uuid, text, text, text, text[], text, int, int, text[]);
create or replace function update_project(
  p_id uuid, p_title text, p_category text, p_summary text, p_deliverables text[],
  p_done_when text, p_price int, p_weeks int, p_skills text[],
  p_hours int, p_learn text[], p_beginner boolean
) returns int language plpgsql security definer set search_path = public as $$
declare o projects%rowtype; v_notified int := 0;
begin
  select * into o from projects where id = p_id for update;
  if not found then raise exception 'Project not found'; end if;
  if o.client_id is distinct from auth.uid() then raise exception 'This is not your project'; end if;
  if o.status <> 'open' then raise exception 'This project can no longer be edited'; end if;

  if o.title = p_title and o.category = p_category and o.summary = p_summary and o.deliverables = p_deliverables
     and o.done_when = p_done_when and o.price_eur = p_price and o.weeks = p_weeks and o.skills = p_skills
     and o.hours_per_week is not distinct from p_hours and o.learn = p_learn and o.beginner_friendly = p_beginner then
    return 0;
  end if;

  update projects set title = p_title, category = p_category, summary = p_summary, deliverables = p_deliverables,
    done_when = p_done_when, price_eur = p_price, weeks = p_weeks, skills = p_skills,
    hours_per_week = p_hours, learn = p_learn, beginner_friendly = p_beginner where id = p_id;

  insert into notifications (user_id, kind, title, body, link)
  select a.student_id, 'project_edited', 'A project you applied to was updated', p_title, '/projects?project=' || p_id
  from applications a where a.project_id = p_id and a.status = 'pending';
  get diagnostics v_notified = row_count;
  return v_notified;
end $$;
revoke all on function update_project(uuid, text, text, text, text[], text, int, int, text[], int, text[], boolean) from public, anon;
grant execute on function update_project(uuid, text, text, text, text[], text, int, int, text[], int, text[], boolean) to authenticated;
