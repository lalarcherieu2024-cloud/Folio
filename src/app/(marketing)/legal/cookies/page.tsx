import Link from "next/link";
import { LegalPage, LegalTable, type LegalSection } from "@/components/marketing/LegalPage";

export const metadata = { title: "Cookie Policy · Folio" };

// Folio sets only cookies it needs to work (sign-in) or that remember a choice the visitor made (sidebar), so it
// needs no consent banner. Adding analytics, ads or any third-party script that sets cookies changes that:
// it then needs a consent banner first, and a row here.

const sections: LegalSection[] = [
  { id: "what", title: "What cookies are", body: <>
    <p>Cookies are small text files a website stores in your browser so it can remember something between pages or visits, such as that you&apos;re signed in.</p>
  </> },
  { id: "list", title: "The cookies Folio uses", body: <>
    <LegalTable head={["Cookie", "What it does", "Type", "How long"]} rows={[
      ["sb-…-auth-token", "Keeps you signed in (set by our sign-in provider, Supabase). May be split over several cookies ending in .0, .1…", "Strictly necessary", "Until you sign out, up to 400 days"],
      ["sb-…-auth-token-code-verifier", "Protects a sign-in with LinkedIn or GitHub while you're away on their site", "Strictly necessary", "Minutes, removed after sign-in"],
      ["folio_sidebar_v2", "Remembers whether you collapsed the side menu", "Preference you set", "1 year"],
    ]} />
    <p>Folio has <strong>no analytics, advertising or tracking cookies</strong>, and no third-party scripts that set them. Fonts are served from our own site.</p>
  </> },
  { id: "consent", title: "Why there's no cookie banner", body: <>
    <p>Spanish and EU law (LSSI-CE art. 22.2) only require consent for cookies that aren&apos;t needed for a service you asked for. Ours are all needed to sign you in, or remember a setting you chose yourself. If we ever add other cookies, we&apos;ll ask first.</p>
  </> },
  { id: "control", title: "Controlling cookies", body: <>
    <p>You can see and delete cookies in your browser&apos;s settings. If you block Folio&apos;s cookies, you won&apos;t be able to sign in. For how we handle personal data generally, see the <Link href="/legal/privacy">Privacy Policy</Link>.</p>
  </> },
];

export default function Cookies() {
  return <LegalPage current="/legal/cookies" title="Cookie Policy" sections={sections} intro={<p>Folio uses as few cookies as possible: only the ones it needs to work.</p>} />;
}
