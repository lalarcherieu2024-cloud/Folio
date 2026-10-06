// IE University degree programmes for the "Programme and year" picker.
// Source: ie.edu/university/studies (checked October 2026). Update this list when IE adds or renames programmes.
export const IE_PROGRAMS: { group: string; programs: string[] }[] = [
  { group: "Bachelor's degrees", programs: [
    "Bachelor in Applied Mathematics",
    "Bachelor in Architectural Studies",
    "Bachelor in Behavior and Social Sciences",
    "Bachelor in Business Administration",
    "Global Bachelor in Business Administration",
    "Bachelor in Communication and Digital Media",
    "Bachelor in Computer Science and Artificial Intelligence",
    "Bachelor in Data and Business Analytics",
    "Bachelor in Design",
    "Bachelor in Economics",
    "Bachelor in Environmental Sciences for Sustainability",
    "Bachelor in Fashion Design",
    "Bachelor in Humanities",
    "Bachelor in International Relations",
    "Bachelor of Laws (LL.B.)",
    "Bachelor in Philosophy, Politics, Law and Economics (PPLE)",
    "Bachelor in Political Science",
  ] },
  { group: "Dual bachelor's degrees", programs: [
    "Dual Degree in Business Administration & Computer Science and Artificial Intelligence",
    "Dual Degree in Business Administration & Data and Business Analytics",
    "Dual Degree in Business Administration & Design",
    "Dual Degree in Business Administration & Fashion Design",
    "Dual Degree in Business Administration & Humanities",
    "Dual Degree in Business Administration & International Relations",
    "Dual Degree in Business Administration & Laws (LL.B.)",
    "Dual Degree in Business Administration & Political Science",
    "Dual Degree in Economics & Applied Mathematics",
    "Dual Degree in Economics & International Relations",
    "Dual Degree in Laws (LL.B.) & International Relations",
    "Dual Degree in PPLE & Data and Business Analytics",
  ] },
  { group: "Master's degrees and MBAs", programs: [
    "International MBA",
    "Global MBA",
    "Global Executive MBA",
    "Master in Management",
    "Master in Management & Strategy",
    "Master in Finance",
    "Master in Financial Technology",
    "Master in Applied Artificial Intelligence",
    "Master in Business Analytics and Data Science",
    "Master in Computer Science & Business Technology",
    "Master in Digital Strategy, AI & Innovation",
    "Master in Digital Marketing",
    "Master in Strategic Marketing & Communication",
    "Master in Market Research & Consumer Behavior",
    "Master in Creative Direction, Content & Branding",
    "Master in Sports Management & Innovation",
    "Master in Sustainability and Business Transformation",
    "Master in Talent Development & Human Resources",
    "Master in Applied Economics",
    "Master in Public Policy",
    "Master in International Relations",
    "Master in International Development",
    "Master of Laws (LL.M.)",
    "LL.M. in International Legal Studies",
    "Master in Architecture",
    "Master in Interior Design (MDes)",
    "Master in Design for Immersive Experiences and XR",
    "Master in Product Management & Design Innovation",
    "Master in Business for Architecture and Design",
    "Master in Real Estate Development",
  ] },
];

export const ALL_IE_PROGRAMS = IE_PROGRAMS.flatMap((g) => g.programs);

// IE's own abbreviations, so profiles saved as free text before the picker ("BCSAI, 2027") still match.
const ABBREVIATIONS: Record<string, string> = {
  BAM: "Bachelor in Applied Mathematics", BBSS: "Bachelor in Behavior and Social Sciences", BBA: "Bachelor in Business Administration",
  BCDM: "Bachelor in Communication and Digital Media", BCSAI: "Bachelor in Computer Science and Artificial Intelligence",
  BDBA: "Bachelor in Data and Business Analytics", PPLE: "Bachelor in Philosophy, Politics, Law and Economics (PPLE)", LLB: "Bachelor of Laws (LL.B.)",
  BBALLB: "Dual Degree in Business Administration & Laws (LL.B.)", BBABID: "Dual Degree in Business Administration & Design",
  BBABIR: "Dual Degree in Business Administration & International Relations", BBACSAI: "Dual Degree in Business Administration & Computer Science and Artificial Intelligence",
  BBABIFD: "Dual Degree in Business Administration & Fashion Design", IMBA: "International MBA",
};

/** Split a stored "Programme, 2027" value back into its parts (unrecognised free text comes back as `other`). */
export function parseProgram(value: string): { program: string; year: string; other: string } {
  const m = value.match(/^(.*?),\s*(\d{4})$/);
  const raw = (m ? m[1] : value).trim(), year = m ? m[2] : "";
  const name = ABBREVIATIONS[raw.toUpperCase().replace(/[^A-Z]/g, "")] ?? raw;
  return ALL_IE_PROGRAMS.includes(name) ? { program: name, year, other: "" } : { program: name ? "other" : "", year, other: name };
}
