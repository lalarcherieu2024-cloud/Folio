import type { Category } from "./types";

// Starting points for a first brief: the work young companies most often need. The [brackets] are where the company
// fills in its own details, which is most of what writing a good brief is. Prices stay within a student startup's cap
// (STARTUP_MAX_PAY) and the €150 minimum.

export type BriefTemplate = { id: string; label: string; title: string; category: Category; summary: string; deliverable: string; skills: string[]; pay: number; weeks: number };

export const BRIEF_TEMPLATES: BriefTemplate[] = [
  {
    id: "landing", label: "Landing page", title: "Landing page for our launch", category: "Design & Creative",
    summary: "We're launching [what you're building] for [who it's for]. We need a one-page site that explains what it does in a few seconds and gets people to [join the waitlist / sign up]. We'll share our logo, colours and notes on what to say.",
    deliverable: "A desktop and mobile design in Figma, and the page built in Webflow, ready to publish",
    skills: ["Figma", "UI design", "Webflow"], pay: 450, weeks: 2,
  },
  {
    id: "research", label: "Market research", title: "Market research: who would pay for our product", category: "Research & Analysis",
    summary: "We think [who] has a problem with [what], and we're building [your solution]. Before we go further we want to know how big the market is, who else is solving it, and which customers to start with.",
    deliverable: "A 10–15 slide report: market size, 5 competitors compared, 3 customer segments, and what to do first",
    skills: ["Market research", "Excel"], pay: 400, weeks: 3,
  },
  {
    id: "deck", label: "Pitch deck", title: "Investor pitch deck redesign", category: "Design & Creative",
    summary: "We're raising [amount] from [angels / an accelerator] in [month]. Our current deck has the content but doesn't look the part. We'll share the deck, our numbers and our brand.",
    deliverable: "A 12-slide deck in Google Slides or Figma, with an editable master so we can update it",
    skills: ["Branding", "Figma", "Copywriting"], pay: 350, weeks: 2,
  },
  {
    id: "social", label: "Social media plan", title: "A month of social media, planned and designed", category: "Marketing & Growth",
    summary: "We want [Instagram / LinkedIn / TikTok] to bring us [customers / waitlist sign-ups]. Right now we post when we remember. We need a plan for a month and the first posts ready to go.",
    deliverable: "A 4-week content calendar and 8 ready-to-post designs with captions",
    skills: ["Content", "Copywriting", "Branding"], pay: 300, weeks: 2,
  },
  {
    id: "model", label: "Financial model", title: "A simple financial model for our first year", category: "Business & Finance",
    summary: "We need to know what [your product] costs us, what we can charge, and when the money runs out. We'll share our prices, costs and plans for the next 12 months.",
    deliverable: "A spreadsheet with 12 months of revenue, costs and cash, three scenarios, and a one-page summary",
    skills: ["Excel", "Data analysis"], pay: 400, weeks: 2,
  },
  {
    id: "interviews", label: "User interviews", title: "10 user interviews to test our idea", category: "Research & Analysis",
    summary: "We're building [what] for [who] and want to hear from real people before we build more. We'll introduce you to some of them; finding a few more is part of the job.",
    deliverable: "The interview guide, notes from 10 interviews, and a summary with the 5 things we should change",
    skills: ["Market research", "Content"], pay: 350, weeks: 3,
  },
];
