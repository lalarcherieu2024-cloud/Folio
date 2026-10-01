import type { Application, Credential, Project, StudentProfile } from "./types";

export const DEMO_USER: StudentProfile = {
  id: "lucia@student.ie.edu",
  email: "lucia@student.ie.edu",
  fullName: "Lucía Fernández",
  program: "Master in Business Analytics & Data Science, 2026",
  uniEmailVerified: true,
  githubHandle: "lucia-fernandez",
  linkedinUrl: "https://www.linkedin.com/in/lucia-fernandez",
  cv: null,
};

const co = (name: string, founder: string, hood: string) => ({
  postedById: null, clientName: founder, clientKind: "company" as const, orgName: name, orgVerified: true, hood,
  status: "open" as const,
});

export const seedProjects: Project[] = [
  { ...co("Cobalto Pay", "Marta Ruiz", "Chamberí"), id: "p1", category: "Tech & Data",
    title: "Payments reconciliation dashboard",
    summary: "Turn our Stripe exports into a daily dashboard the finance team can read in two minutes.",
    deliverables: ["A Metabase dashboard connected to our Postgres replica", "5 agreed charts", "A one-page handover note"],
    doneWhen: "Finance lead can answer 'what settled yesterday?' without asking engineering.",
    priceEur: 900, weeks: 3, skills: ["SQL", "Python", "Data viz"], applicantCount: 2 },
  { ...co("Huerta Box", "Javier Olmo", "Arganzuela"), id: "p3", category: "Operations & Admin",
    title: "Clean and merge supplier price lists",
    summary: "We get prices from 14 farms in different spreadsheet formats. We need one clean table.",
    deliverables: ["A repeatable process (script or spreadsheet) that outputs one normalized table each week", "A short how-to for the team"],
    doneWhen: "This week's 14 files merge with no manual fixes.",
    priceEur: 450, weeks: 2, skills: ["Excel", "Data cleaning"], applicantCount: 0 },
  { ...co("Aula Viva", "Claudia Méndez", "Malasaña"), id: "p4", category: "Design & Creative",
    title: "Rebuild our landing page in Webflow",
    summary: "Our current page converts at 1.2%. We have new copy and brand assets ready.",
    deliverables: ["A responsive Webflow page", "A working signup form", "Analytics set up"],
    doneWhen: "Page is live, passes Lighthouse accessibility at 90+, and form submissions reach HubSpot.",
    priceEur: 700, weeks: 2, skills: ["Webflow", "UI design"], applicantCount: 0 },
  { ...co("Lumen Health", "Irene Castro", "Salamanca"), id: "p6", category: "Marketing & Growth",
    title: "Onboarding email sequence for new clinics",
    summary: "New clinic customers get no emails after signing up. We need a 5-step welcome sequence.",
    deliverables: ["5 written emails in our brand voice", "A live HubSpot workflow", "A simple open-rate report"],
    doneWhen: "Workflow triggers for every new signup for one full week.",
    priceEur: 400, weeks: 1, skills: ["Copywriting", "HubSpot"], applicantCount: 0 },
  { ...co("Rutas", "Diego Salvatierra", "Tetuán"), id: "p5", category: "Business & Finance",
    title: "Unit-economics model for our 40-van fleet",
    summary: "We don't know which routes make money. We need a model that shows profit per route and per van.",
    deliverables: ["A Google Sheets model with inputs and outputs separated", "A summary of the 3 least profitable routes", "A 20-minute walkthrough call"],
    doneWhen: "Ops manager can change fuel price and see updated profit per route.",
    priceEur: 1100, weeks: 4, skills: ["Financial modeling", "Excel"], applicantCount: 0 },
  { ...co("Huerta Box", "Javier Olmo", "Arganzuela"), id: "p8", category: "Research & Analysis",
    title: "Competitor scan: Madrid veggie-box delivery",
    summary: "Who else delivers farm boxes in Madrid, at what price, and how do they position themselves?",
    deliverables: ["A comparison table of at least 10 competitors", "A 2-page summary of gaps and opportunities"],
    doneWhen: "Founder can cite three concrete opportunities backed by the table.",
    priceEur: 350, weeks: 2, skills: ["Market research", "Writing"], applicantCount: 0 },
  { ...co("Aula Viva", "Claudia Méndez", "Malasaña"), id: "p9", category: "Video & Photo",
    title: "60-second product demo video",
    summary: "A short screen-recorded demo with voiceover for our homepage and LinkedIn.",
    deliverables: ["One 60-second edited video (16:9)", "A square cut for social", "Captions in English and Spanish"],
    doneWhen: "Video is live on the homepage and passes review on first round of feedback.",
    priceEur: 500, weeks: 2, skills: ["Video editing", "Voiceover"], applicantCount: 0 },
  // Student-to-student: the client is a student founder, not a company.
  { postedById: "nico@student.ie.edu", clientName: "Nico Brandt", clientKind: "student", orgName: null, orgVerified: false,
    hood: "IE Tower", status: "open", id: "p7", category: "Tech & Data",
    title: "Landing page and waitlist for my campus-delivery startup",
    summary: "I'm a BBA student validating a late-night food delivery idea and need a developer to build the page.",
    deliverables: ["A deployed one-page site on a custom domain", "A waitlist form that writes to a spreadsheet"],
    doneWhen: "Live on a custom domain and 20 test signups land in the sheet.",
    priceEur: 300, weeks: 1, skills: ["React", "UI design"], applicantCount: 1 },
  { postedById: "sofia@student.ie.edu", clientName: "Sofía Marín", clientKind: "student", orgName: null, orgVerified: false,
    hood: "IE Tower", status: "open", id: "p10", category: "Design & Creative",
    title: "Logo and brand kit for my thrift-fashion Instagram shop",
    summary: "I run a small resale shop and need a simple identity: logo, colors and two post templates.",
    deliverables: ["Logo in 3 formats (SVG, PNG, favicon)", "A color and font guide on one page", "2 Canva post templates"],
    doneWhen: "I can post using the templates without any further design help.",
    priceEur: 250, weeks: 2, skills: ["Branding", "Canva"], applicantCount: 0 },
];

export const seedApplications: (Application & { studentId: string })[] = [];

export const seedCredentials: (Credential & { studentId: string })[] = [
  { id: "c0", studentId: DEMO_USER.id, projectId: "p0", projectTitle: "Delivery route cost model", clientName: "Javier Olmo",
    orgName: "Huerta Box", hood: "Arganzuela", rating: 5, issuedAt: "July 2026",
    review: "Lucía found that two zones were losing money on every order. We repriced them the next week." },
];

// Shown on the marketing pages regardless of who is signed in.
export const SAMPLE_CREDENTIALS: Credential[] = [
  seedCredentials[0],
  { id: "s2", projectId: "x", projectTitle: "Onboarding email sequence", clientName: "Irene Castro", orgName: "Lumen Health",
    hood: "Salamanca", rating: 5, issuedAt: "June 2026",
    review: "Five emails, live in a week. Open rates doubled what we had expected." },
];
