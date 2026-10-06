import Link from "next/link";
import { Fill, LegalPage, LegalTable, type LegalSection } from "@/components/marketing/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const metadata = { title: "Privacy Policy · Folio" };

// DRAFT for legal review, written against what the code does today. Keep it in step with the product: a new kind of
// data, a new outside service or a new public page needs a line here.
// Check before launch: the Gemini API key must be on a PAID Google Cloud project. On the free tier Google may use the
// content to improve its products, which this policy says doesn't happen.

const sections: LegalSection[] = [
  { id: "controller", title: "Who is responsible for your data", body: <>
    <p>The controller of your personal data is <strong><Fill>{OPERATOR.legalName}</Fill></strong> (<Fill>{OPERATOR.taxId}</Fill>), <Fill>{OPERATOR.address}</Fill>. For anything about your data, write to <Fill>{OPERATOR.privacyEmail}</Fill>.</p>
  </> },
  { id: "collect", title: "What we collect", body: <>
    <LegalTable head={["Data", "Examples", "Where it comes from"]} rows={[
      ["Account", "Name, email, password (stored hashed), whether you're a student or a client. Students also confirm an IE University email, which becomes the email they sign in with", "You, when you sign up"],
      ["Signing up or in with LinkedIn, connecting GitHub", "Name, email, profile picture link, account ID; your GitHub username", "LinkedIn or GitHub, when you connect them"],
      ["Student profile", "Photo, programme and year, links, CV, the strengths we read from your CV, certificates from other courses (with their links or uploaded copies), PayPal email for payouts", "You"],
      ["Client profile", "Company name, website, tax ID (CIF), description, logo, files and verification documents", "You"],
      ["Projects and applications", "Briefs, pitches, interviews, milestones, deliveries and files, requested changes", "You and the other side of the project"],
      ["Messages", "Chat messages and attached files", "You and the people you talk to"],
      ["Credentials", "Rating, review, signatures (drawn), dates", "The client and the student"],
      ["Payments", "Amounts, payment status, PayPal transaction IDs, your PayPal email. We never see card or bank details", "You and PayPal"],
      ["Technical", "IP address, browser, sign-in times, error logs", "Your device, automatically"],
    ]} />
  </> },
  { id: "use", title: "Why we use it, and on what basis", body: <>
    <LegalTable head={["Purpose", "Legal basis (GDPR art. 6)"]} rows={[
      ["Running your account and the service: profiles, applications, projects, messages, credentials", "Contract (6.1.b)"],
      ["Taking, holding, releasing and refunding payments", "Contract (6.1.b)"],
      ["Verifying clients before their projects go live, and preventing fraud and abuse", "Legitimate interest in a safe marketplace (6.1.f)"],
      ["Confirming that students study at IE University, by emailing their IE address", "Contract (6.1.b): Folio is for IE students"],
      ["Reading your CV with AI to show your strengths and match projects", "Contract (6.1.b), as a feature you choose by uploading a CV"],
      ["Drafting a brief from a client's idea with AI", "Contract (6.1.b)"],
      ["Keeping payment and accounting records", "Legal obligation (6.1.c)"],
      ["Service emails (confirming your email, important changes)", "Contract (6.1.b)"],
      ["Security, debugging and keeping Folio running", "Legitimate interest (6.1.f)"],
    ]} />
    <p>We don&apos;t sell your data, show ads, or use it for marketing without asking you first.</p>
  </> },
  { id: "ai", title: "AI processing", body: <>
    <p>When you upload a CV, its text is sent to Google&apos;s Gemini service to pick out your fields and skills. When a client describes a project idea, that text is sent to Gemini to draft a brief. Google processes this for us as a service provider and doesn&apos;t use it to train its models. The results are suggestions shown to you; no decision about you is made by AI alone. You can object to the CV analysis by not uploading a CV or by asking us to delete it.</p>
  </> },
  // Keep in step with the verification page's "How we handle your documents" (VerifyFrame) and DOCS in CompanyVerify.
  { id: "company-verification", title: "Company verification", body: <>
    <p>We check every company that wants to post projects, in two stages. This protects students from fake or fraudulent offers and makes sure we deal with someone who can act for the company.</p>
    <LegalTable head={["When", "What we ask for", "What we check"]} rows={[
      ["Before the company can publish", "Legal name, CIF, website and description; the founder's LinkedIn (connected, or a profile link)", "Against public records (for example the company registry and the website) that the company exists and the person is real"],
      ["Before the company's first payment", "Company registry extract (nota simple); ID of the representative (DNI, NIE or passport)", "The company's legal details and who can represent it, and that the person signing up is that representative"],
    ]} />
    <ul>
      <li><strong>Legal basis:</strong> our legitimate interest in keeping the marketplace safe from fraud (GDPR art. 6.1.f), and taking the steps you ask for before entering into our contract (art. 6.1.b).</li>
      <li><strong>Who sees them:</strong> only you and Folio&apos;s review team. Documents are stored in a private storage area that other users, including students, can&apos;t open. Students only see your company name, logo, description and the verified badge.</li>
      <li><strong>What we don&apos;t do:</strong> we don&apos;t share them with anyone else, use them for marketing, or make the verification decision automatically. A person reviews every company.</li>
      <li><strong>Where:</strong> with our database and storage provider, Supabase (<Fill>{OPERATOR.dataRegion}</Fill>), encrypted in transit and at rest.</li>
      <li><strong>How long:</strong> while your company account is open, so we can re-check details if something changes or a dispute comes up. When you close the account, they&apos;re deleted within 30 days, unless we need them to deal with a legal claim already under way.</li>
      <li><strong>Your control:</strong> you can replace or remove the documents yourself until your first payment. After that, ask us at <Fill>{OPERATOR.privacyEmail}</Fill> to see, correct or delete them.</li>
      <li><strong>Progress records:</strong> we note when each verification step is completed (for example when the details were filled in or the documents uploaded), to see where companies get stuck and make the process easier.</li>
    </ul>
  </> },
  { id: "sharing", title: "Who can see your data", body: <>
    <h3>Other Folio users</h3>
    <ul>
      <li>Clients see the profile of students who apply to their projects, including the CV and course certificates, through a private link that expires after an hour.</li>
      <li>Students see client profiles and the projects they post.</li>
      <li>The two sides of a project see their messages, files, deliveries, the brief and the credential.</li>
    </ul>
    <h3>Anyone with a credential link</h3>
    <p>Each credential has a verification page that anyone with the link can open. It shows the student&apos;s name, the project, the client, the rating and review, and the signatures. The link is long and random, so it is only found if someone shares it.</p>
    <h3>Service providers</h3>
    <p>These companies process data for us under contract, only on our instructions:</p>
    <LegalTable head={["Provider", "What for", "Where"]} rows={[
      ["Supabase, Inc.", "Database, sign-in, file storage, sign-up emails", <Fill key="r">{OPERATOR.dataRegion}</Fill>],
      [<Fill key="h">{OPERATOR.host}</Fill>, "Hosting the website", "EU and other regions"],
      ["Google LLC (Gemini API)", "Reading CVs, drafting briefs", "EU / United States"],
    ]} />
    <h3>Independent services</h3>
    <p><strong>PayPal</strong> handles payments and payouts as its own controller, under its own privacy statement. <strong>LinkedIn</strong> and <strong>GitHub</strong> do the same when you sign in or connect your account.</p>
    <h3>When the law requires it</h3>
    <p>We share data with authorities, courts or advisers when the law requires it, or to protect our users or Folio.</p>
  </> },
  { id: "transfers", title: "Transfers outside the EU", body: <>
    <p>Some providers above are based in the United States or may process data there. Where that happens, the transfer is covered by the EU–US Data Privacy Framework or by the European Commission&apos;s Standard Contractual Clauses. Ask us for a copy of the safeguards.</p>
  </> },
  { id: "retention", title: "How long we keep it", body: <>
    <ul>
      <li><strong>Your account and profile:</strong> while your account is open. When you close it, we delete it within 30 days (backups roll over within a further 30 days).</li>
      <li><strong>Company verification documents:</strong> while the company account is open, then deleted within 30 days of closing it (see <a href="#company-verification">Company verification</a>).</li>
      <li><strong>Credentials:</strong> deleted with the student&apos;s account, after which the verification link stops working.</li>
      <li><strong>Projects, messages and files</strong> you share with another user: kept while either side&apos;s account is open, so the other side keeps their record, then deleted.</li>
      <li><strong>Payment records:</strong> kept for 6 years, as Spanish commercial and tax law requires.</li>
      <li><strong>Technical logs:</strong> up to 90 days.</li>
    </ul>
  </> },
  { id: "rights", title: "Your rights", body: <>
    <p>You can ask us to:</p>
    <ul>
      <li>give you a copy of your data, or send it to you in a portable format;</li>
      <li>correct it (you can also edit most of it on your profile);</li>
      <li>delete it, or restrict how we use it;</li>
      <li>stop using it where we rely on legitimate interest.</li>
    </ul>
    <p>Email <Fill>{OPERATOR.privacyEmail}</Fill> from the address on your account. We reply within one month. If you&apos;re unhappy with how we handle your data, you can complain to the Spanish data protection authority, the <a href="https://www.aepd.es" target="_blank" rel="noreferrer">AEPD</a>, or the authority where you live.</p>
  </> },
  { id: "security", title: "Security", body: <>
    <p>Data is encrypted in transit, passwords are stored hashed, files such as CVs and documents are private and only shared through short-lived links, and database rules limit each user to their own data. No system is perfect: if a breach affects you, we&apos;ll tell you and the authorities as the law requires.</p>
  </> },
  { id: "age", title: "Age", body: <>
    <p>Folio is for people aged 18 and over. We don&apos;t knowingly collect data from anyone younger; if we learn we have, we delete it.</p>
  </> },
  { id: "cookies", title: "Cookies", body: <>
    <p>We only use the cookies Folio needs to work, such as keeping you signed in. See the <Link href="/legal/cookies">Cookie Policy</Link>.</p>
  </> },
  { id: "changes", title: "Changes to this policy", body: <>
    <p>If we change how we use your data in a significant way, we&apos;ll tell you by email or in Folio before it applies. The date at the top shows the current version.</p>
  </> },
];

export default function Privacy() {
  return (
    <LegalPage current="/legal/privacy" title="Privacy Policy" sections={sections}
      intro={<p>What personal data Folio collects, why, who sees it, and the rights you have over it under the EU General Data Protection Regulation (GDPR) and Spain&apos;s data protection law (LOPDGDD).</p>} />
  );
}
