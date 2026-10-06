import type { DocKind, Organization } from "./data/startup";

/** A student's own startup that isn't registered yet (migration 0031): no CIF, the founder's IE email instead. */
export const isStartup = (o: Pick<Organization, "kind"> | null | undefined) => o?.kind === "student_startup";

/** The most a student startup can pay per project until it's registered (enforced by the database too). */
export const STARTUP_MAX_PAY = 500;

/** The company details step is done: "Finish later" can save a part-filled draft, so the row existing isn't enough. */
export const detailsComplete = (o: Pick<Organization, "name" | "cif" | "website" | "about" | "kind" | "founderIeEmail"> | null | undefined) =>
  !!o && !!o.name && !!o.website && !!o.about && (isStartup(o) ? !!o.founderIeEmail : !!o.cif);

// Verification stage 2 (migration 0030): the documents asked for on the payment page, before the first payment. The
// bank certificate is no longer asked for: the escrow payment itself comes from the company's account. A student
// startup isn't registered, so it has no registry extract: only the founder's ID (0031).
export type PaymentDoc = { kind: DocKind; title: string; sub: string };
const COMPANY_DOCS: PaymentDoc[] = [
  { kind: "registry_extract", title: "Company registry extract", sub: "Nota simple from the Registro Mercantil, issued in the last 3 months" },
  { kind: "representative_id", title: "ID of the representative", sub: "DNI, NIE or passport of the person signing up" },
];
const STARTUP_DOCS: PaymentDoc[] = [{ kind: "representative_id", title: "Your ID", sub: "DNI, NIE or passport of the founder signing up" }];

export const paymentDocsFor = (org: Pick<Organization, "kind"> | null | undefined) => (isStartup(org) ? STARTUP_DOCS : COMPANY_DOCS);
export const paymentDocsDone = (org: Pick<Organization, "docs" | "kind"> | null | undefined) =>
  !!org && paymentDocsFor(org).every((d) => org.docs.some((x) => x.kind === d.kind));
