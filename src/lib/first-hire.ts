// What hiring someone on Folio involves, one stage at a time: the "Your first hire" card on the company home and the
// hiring guide (/company/hiring-guide) both read from here. Written for someone who has never hired anyone, like a
// student founder (migration 0031), but true for every company.

export type HireStage = { key: "scope" | "publish" | "choose" | "work" | "approve"; title: string; line: string; points: string[] };

export const HIRE_STAGES: HireStage[] = [
  {
    key: "scope", title: "Scope the work",
    line: "Write a brief: what you need, who it's for, and what “done” looks like.",
    points: [
      "One project, one result. If you need a website and a logo, that's two projects.",
      "Describe the deliverable so precisely that you could check it off. That's what you'll approve against.",
      "Share context, not instructions: who your customers are, what you've tried, what good looks like.",
      "Not sure where to start? The templates on “Post a project” cover the work young companies need most.",
    ],
  },
  {
    key: "publish", title: "Set a fair price and publish",
    line: "Pay into escrow to open it. Folio holds the money until you approve the work.",
    points: [
      "Price for the time it really takes. The price step shows what similar open projects pay.",
      "The student is paid the price you set; Folio's fee is added on top.",
      "Paying up front is what makes students trust a new company. You can cancel before you hire anyone and get it back.",
    ],
  },
  {
    key: "choose", title: "Choose someone",
    line: "Read their notes and CVs, interview your favourites, then hire one.",
    points: [
      "Look for someone who understood your brief, not the longest CV.",
      "A 20-minute call is enough. Ask how they'd approach it, what they'd need from you, and when they're free.",
      "Hiring one student declines the other applicants on that project, so decide once you've talked to your favourites.",
    ],
  },
  {
    key: "work", title: "Work together",
    line: "Send a kickoff message with everything they need, then check in once a week.",
    points: [
      "Day one: share the files, logins and people they'll need, and agree on when you'll check in.",
      "Answer questions quickly. A student waiting on you is the most common reason work runs late.",
      "Give feedback on drafts early. It's cheaper than changes at the end.",
    ],
  },
  {
    key: "approve", title: "Approve, pay and sign",
    line: "Check the work against the brief. When it's right, approve it and sign their credential.",
    points: [
      "Compare what's submitted with the deliverable in your brief. Ask for changes if something's missing; the money stays held meanwhile.",
      "Approving pays the student and turns the project into a credential on their profile, with your rating and review.",
      "Sign it. Your signature is what makes the credential count, for them and for the next company.",
    ],
  },
];
