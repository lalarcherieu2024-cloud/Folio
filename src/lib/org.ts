import type { Organization } from "./data/startup";

/** The company details step is done: "Finish later" can save a part-filled draft, so the row existing isn't enough. */
export const detailsComplete = (o: Pick<Organization, "name" | "cif" | "website" | "about"> | null | undefined) =>
  !!o && !!o.name && !!o.cif && !!o.website && !!o.about;
