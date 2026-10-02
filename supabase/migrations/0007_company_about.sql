-- Company "About" details shown in the project sheet. Run in the SQL Editor after 0006.
alter table organizations
  add column if not exists industry text,
  add column if not exists size text,
  add column if not exists founded text,
  add column if not exists blurb text,
  add column if not exists website text;

-- Demo companies (matched by name; harmless if they don't exist).
update organizations set industry='Fintech · Payments', size='11–50 employees', founded='2019',
  blurb='Payment infrastructure for Spanish online merchants. Cobalto Pay handles card and Bizum checkout for 1,200+ shops and settles funds daily.' where name='Cobalto Pay';
update organizations set industry='Food & Grocery delivery', size='11–50 employees', founded='2020',
  blurb='Weekly boxes of seasonal fruit and vegetables from farms within 150 km of Madrid, delivered by their own electric vans.' where name='Huerta Box';
update organizations set industry='EdTech', size='2–10 employees', founded='2022',
  blurb='Live, small-group online classes for secondary-school students, taught by vetted university tutors.' where name='Aula Viva';
update organizations set industry='Health tech · Clinics', size='51–200 employees', founded='2017',
  blurb='Booking and patient-messaging software used by 300+ private clinics across Spain.' where name='Lumen Health';
update organizations set industry='Logistics · Last-mile', size='51–200 employees', founded='2018',
  blurb='Same-day delivery for Madrid retailers, running a 40-van fleet out of a hub in Tetuán.' where name='Rutas';

-- Same view as before, with the new columns appended (a view may only gain columns at the end).
create or replace view project_cards as
select p.*, o.name as org_name, coalesce(o.verified, false) as org_verified,
       (select count(*) from applications a where a.project_id = p.id)::int as applicant_count,
       o.industry as org_industry, o.size as org_size, o.founded as org_founded, o.blurb as org_blurb, o.website as org_website
from projects p
left join organizations o on o.id = p.org_id
where p.status = 'open'
   or p.client_id = auth.uid()
   or exists (select 1 from applications a where a.project_id = p.id and a.student_id = auth.uid());

-- Demo websites so the "Website" button shows. These companies are fictional: replace with real
-- URLs, or let each company fill its own in once the company side is built.
update organizations set website = 'https://example.com' where name in ('Cobalto Pay','Huerta Box','Aula Viva','Lumen Health','Rutas') and website is null;
