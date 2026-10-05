import { Bricolage_Grotesque, DM_Mono, DM_Sans } from "next/font/google";

// "Campus Quirk" pairing for the public front page: characterful headings, calm body, mono numbers.
// Scoped by the .campus-quirk class in globals.css; the signed-in app keeps Geist.
const heading = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-cq-heading" });
const body = DM_Sans({ subsets: ["latin"], variable: "--font-cq-body" });
const mono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-cq-mono" });

export const campusQuirk = `${heading.variable} ${body.variable} ${mono.variable} campus-quirk`;
