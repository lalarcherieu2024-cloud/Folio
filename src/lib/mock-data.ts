import type { Credential } from "./types";

// Sample plaques shown on the marketing pages (not stored in the database).
export const SAMPLE_CREDENTIALS: Credential[] = [
  { id: "s1", projectId: "x", projectTitle: "Delivery route cost model", clientName: "Javier Olmo", orgName: "Huerta Box",
    hood: "Arganzuela", rating: 5, issuedAt: "July 2026", category: "Business & Finance", priceEur: 400,
    review: "Lucía found that two zones were losing money on every order. We repriced them the next week." },
  { id: "s2", projectId: "x", projectTitle: "Onboarding email sequence", clientName: "Irene Castro", orgName: "Lumen Health",
    hood: "Salamanca", rating: 5, issuedAt: "June 2026", category: "Marketing & Growth", priceEur: 350,
    review: "Five emails, live in a week. Open rates doubled what we had expected." },
];
