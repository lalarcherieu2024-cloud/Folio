import type { Credential } from "./types";

// Demo plaques shown on the marketing pages (not stored in the database).
// Placeholder content only: no real clients, people or reviews.
export const SAMPLE_CREDENTIALS: Credential[] = [
  { id: "s1", projectId: "x", projectTitle: "Delivery route cost model", clientName: "the client", orgName: "Example startup",
    hood: "Arganzuela", rating: 5, issuedAt: "Demo", category: "Business & Finance", priceEur: 400,
    review: "When you finish a project, the client writes a short review of your work here." },
  { id: "s2", projectId: "x", projectTitle: "Onboarding email sequence", clientName: "the client", orgName: "Example business",
    hood: "Salamanca", rating: 5, issuedAt: "Demo", category: "Marketing & Growth", priceEur: 350,
    review: "Each signed review becomes a verified credential on your profile." },
];
