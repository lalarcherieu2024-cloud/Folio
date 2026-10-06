import { FEE_RATE } from "./data/shared";

// Who runs Folio and which version of the legal texts is live. The legal pages (src/app/(marketing)/legal) read
// everything that identifies the operator from here, so it's filled in once.
//
// TO FILL before launch: every "[TO FILL …]" value below. Spanish law (LSSI-CE art. 10) requires the operator's
// legal name, tax ID (NIF/CIF), address and a contact email on the site, and the GDPR requires them in the privacy
// policy. Have a lawyer review the texts before relying on them.

export const OPERATOR = {
  /** Legal name of the person or company that runs Folio (e.g. "Folio Platforms S.L."). */
  legalName: "[TO FILL: legal name of the operator]",
  /** NIF (person) or CIF (company). */
  taxId: "[TO FILL: NIF/CIF]",
  address: "[TO FILL: registered address], Madrid, Spain",
  /** Mercantile Registry entry, for a company (e.g. "Registro Mercantil de Madrid, Tomo …, Folio …, Hoja …"). Empty for a person. */
  registry: "[TO FILL: Registro Mercantil details, or remove if not a company]",
  email: "[TO FILL: contact email, e.g. hello@folio.app]",
  /** Where privacy requests go; can be the same as email. */
  privacyEmail: "[TO FILL: privacy email, e.g. privacy@folio.app]",
  /** Who hosts the website itself (the database and files are with Supabase). */
  host: "[TO FILL: website host, e.g. Cloudflare, Inc.]",
  /** The Supabase project's region (Supabase dashboard → Project settings → General). */
  dataRegion: "[TO FILL: Supabase region, e.g. EU (Frankfurt)]",
} as const;

/** Bump this when the Terms or Privacy Policy change in a way users must accept again. Stored on each account at sign-up. */
export const TERMS_VERSION = "2026-10-05";
export const LEGAL_UPDATED = "6 October 2026";

/** Folio's fee as a percentage, for the texts. */
export const FEE_PERCENT = Math.round(FEE_RATE * 100);

export const LEGAL_PAGES = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/cookies", label: "Cookie Policy" },
  { href: "/legal/notice", label: "Legal notice" },
] as const;
