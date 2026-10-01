-- Demo content so the marketplace isn't empty. Run AFTER 0001_init.sql.
-- Company projects have no real owner yet (client_id null); they are replaced
-- when real companies sign up in the startup phase.
insert into organizations (id, name, hood, verified) values
  ('00000000-0000-0000-0000-0000000000a1', 'Cobalto Pay',  'Chamberí',   true),
  ('00000000-0000-0000-0000-0000000000a2', 'Huerta Box',   'Arganzuela', true),
  ('00000000-0000-0000-0000-0000000000a3', 'Aula Viva',    'Malasaña',   true),
  ('00000000-0000-0000-0000-0000000000a4', 'Lumen Health', 'Salamanca',  true),
  ('00000000-0000-0000-0000-0000000000a5', 'Rutas',        'Tetuán',     true);

insert into projects (client_name, org_id, hood, category, title, summary, deliverables, done_when, price_eur, weeks, skills) values
 ('Marta Ruiz','00000000-0000-0000-0000-0000000000a1','Chamberí','Tech & Data','Payments reconciliation dashboard',
  'Turn our Stripe exports into a daily dashboard the finance team can read in two minutes.',
  array['A Metabase dashboard connected to our Postgres replica','5 agreed charts','A one-page handover note'],
  'Finance lead can answer ''what settled yesterday?'' without asking engineering.',900,3,array['SQL','Python','Data viz']),
 ('Javier Olmo','00000000-0000-0000-0000-0000000000a2','Arganzuela','Operations & Admin','Clean and merge supplier price lists',
  'We get prices from 14 farms in different spreadsheet formats. We need one clean table.',
  array['A repeatable process (script or spreadsheet) that outputs one normalized table each week','A short how-to for the team'],
  'This week''s 14 files merge with no manual fixes.',450,2,array['Excel','Data cleaning']),
 ('Claudia Méndez','00000000-0000-0000-0000-0000000000a3','Malasaña','Design & Creative','Rebuild our landing page in Webflow',
  'Our current page converts at 1.2%. We have new copy and brand assets ready.',
  array['A responsive Webflow page','A working signup form','Analytics set up'],
  'Page is live, passes Lighthouse accessibility at 90+, and form submissions reach HubSpot.',700,2,array['Webflow','UI design']),
 ('Irene Castro','00000000-0000-0000-0000-0000000000a4','Salamanca','Marketing & Growth','Onboarding email sequence for new clinics',
  'New clinic customers get no emails after signing up. We need a 5-step welcome sequence.',
  array['5 written emails in our brand voice','A live HubSpot workflow','A simple open-rate report'],
  'Workflow triggers for every new signup for one full week.',400,1,array['Copywriting','HubSpot']),
 ('Diego Salvatierra','00000000-0000-0000-0000-0000000000a5','Tetuán','Business & Finance','Unit-economics model for our 40-van fleet',
  'We don''t know which routes make money. We need a model that shows profit per route and per van.',
  array['A Google Sheets model with inputs and outputs separated','A summary of the 3 least profitable routes','A 20-minute walkthrough call'],
  'Ops manager can change fuel price and see updated profit per route.',1100,4,array['Financial modeling','Excel']),
 ('Javier Olmo','00000000-0000-0000-0000-0000000000a2','Arganzuela','Research & Analysis','Competitor scan: Madrid veggie-box delivery',
  'Who else delivers farm boxes in Madrid, at what price, and how do they position themselves?',
  array['A comparison table of at least 10 competitors','A 2-page summary of gaps and opportunities'],
  'Founder can cite three concrete opportunities backed by the table.',350,2,array['Market research','Writing']),
 ('Claudia Méndez','00000000-0000-0000-0000-0000000000a3','Malasaña','Video & Photo','60-second product demo video',
  'A short screen-recorded demo with voiceover for our homepage and LinkedIn.',
  array['One 60-second edited video (16:9)','A square cut for social','Captions in English and Spanish'],
  'Video is live on the homepage and passes review on first round of feedback.',500,2,array['Video editing','Voiceover']);

-- Student-to-student examples (org_id null = a student is the client)
insert into projects (client_name, org_id, hood, category, title, summary, deliverables, done_when, price_eur, weeks, skills) values
 ('Nico Brandt',null,'IE Tower','Tech & Data','Landing page and waitlist for my campus-delivery startup',
  'I''m a BBA student validating a late-night food delivery idea and need a developer to build the page.',
  array['A deployed one-page site on a custom domain','A waitlist form that writes to a spreadsheet'],
  'Live on a custom domain and 20 test signups land in the sheet.',300,1,array['React','UI design']),
 ('Sofía Marín',null,'IE Tower','Design & Creative','Logo and brand kit for my thrift-fashion Instagram shop',
  'I run a small resale shop and need a simple identity: logo, colors and two post templates.',
  array['Logo in 3 formats (SVG, PNG, favicon)','A color and font guide on one page','2 Canva post templates'],
  'I can post using the templates without any further design help.',250,2,array['Branding','Canva']);
