import Link from "next/link";
import { Fill, LegalPage, type LegalSection } from "@/components/marketing/LegalPage";
import { FEE_PERCENT, OPERATOR } from "@/lib/legal";

export const metadata = { title: "Terms of Service · Folio" };

// DRAFT for legal review. It describes how Folio works today (fixed-price projects, payment held by Folio through
// PayPal until the client verifies the work). Change the text when the product changes.

const sections: LegalSection[] = [
  { id: "about", title: "About these terms", body: <>
    <p>These terms are the agreement between you and <strong><Fill>{OPERATOR.legalName}</Fill></strong> (&ldquo;Folio&rdquo;, &ldquo;we&rdquo;), which runs the Folio website and service. They apply to everyone who creates an account: students who take on projects and companies, organisations or individuals who post them (&ldquo;clients&rdquo;).</p>
    <p>By creating an account you accept these terms and confirm you have read our <Link href="/legal/privacy">Privacy Policy</Link>. If you don&apos;t agree, please don&apos;t use Folio.</p>
  </> },
  { id: "eligibility", title: "Who can use Folio", body: <>
    <ul>
      <li>You must be at least <strong>18 years old</strong>.</li>
      <li><strong>Students</strong> must be enrolled at a university or business school, and must be legally allowed to do paid work. If you are in Spain on a student visa or permit, check what work it allows before taking a project.</li>
      <li><strong>Clients</strong> must act for a genuine business, organisation or project, and the person who signs up must be authorised to act for it. We verify clients before their projects can be published, and ask for documents (a company registry extract and the representative&apos;s ID) before their first payment.</li>
      <li><strong>Student startups</strong> (an IE student&apos;s own startup that isn&apos;t registered yet) can be clients too. The founder signs up with a separate client account and is responsible for the startup&apos;s projects and payments in person. Until the startup is registered, its projects are limited to €500 each, and only the founder&apos;s ID is asked for before the first payment.</li>
    </ul>
  </> },
  { id: "accounts", title: "Your account", body: <>
    <p>Keep your details accurate and up to date, keep your password safe, and don&apos;t share your account. You are responsible for what happens under it. You may sign in with LinkedIn; in that case LinkedIn&apos;s terms also apply to that sign-in. Tell us straight away at <Fill>{OPERATOR.email}</Fill> if you think someone else has used your account.</p>
  </> },
  { id: "role", title: "What Folio does, and doesn't do", body: <>
    <p>Folio is a platform that connects clients with students for fixed-price projects. We provide the tools to post projects, apply, agree a brief, deliver the work, sign it off, and hold and release the payment.</p>
    <ul>
      <li>When a client accepts a student and the student accepts the brief, <strong>the contract for the project is between the client and the student</strong>. Folio is not a party to it, other than for handling the payment as described below.</li>
      <li>Students work as <strong>independent providers</strong>, not as employees, agents or interns of Folio or of the client. Nothing in these terms creates an employment relationship.</li>
      <li>We don&apos;t guarantee that a project will find a student, that a student will be accepted, or the quality of any work or the conduct of any user, although we act on reports (see section 14).</li>
    </ul>
  </> },
  { id: "projects", title: "Projects, applications and the brief", body: <>
    <ul>
      <li>Clients describe each project with a fixed price, a timeline and a clear &ldquo;done when&rdquo; test. Projects must be real, lawful work that a student can do remotely or as described.</li>
      <li>Students apply with a short pitch and their CV. The client may review applications, interview applicants and choose one.</li>
      <li>Once chosen, the client sends the full brief (requirements, milestones and the &ldquo;done when&rdquo; test). <strong>The brief is the agreed scope.</strong> When the student accepts it, the project starts. Changes to scope should be agreed in writing in Folio.</li>
      <li>We may refuse, edit for clarity, or remove a project that breaks these terms.</li>
    </ul>
  </> },
  { id: "students", title: "If you are a student", body: <>
    <ul>
      <li>Do the work yourself, to the brief, honestly and on time, and tell the client early if you can&apos;t.</li>
      <li><strong>Taxes are your responsibility.</strong> Money you earn on Folio is income. Depending on your situation you may need to declare it, register as self-employed (<em>autónomo</em>) or issue invoices. Folio doesn&apos;t give tax advice; check with your university&apos;s careers service or an adviser.</li>
      <li>Don&apos;t accept work that would breach your university&apos;s rules, such as doing someone else&apos;s graded coursework.</li>
    </ul>
  </> },
  { id: "payments", title: "Payments, fees and refunds", body: <>
    <ul>
      <li><strong>Price.</strong> The price shown on a project is what the student receives for completing it.</li>
      <li><strong>Folio&apos;s fee.</strong> The client pays a service fee of <strong>{FEE_PERCENT}%</strong> of the price on top. Students pay no fee to Folio. Payment providers may charge their own fees (for example PayPal on withdrawals).</li>
      <li><strong>Paying upfront.</strong> The client pays the price and the fee when posting the project, through PayPal. We hold the price until the work is verified; the project is only published once it is paid.</li>
      <li><strong>Release.</strong> When the client verifies and signs off the work, the price is released to the student&apos;s Folio balance, and the student can withdraw it to their PayPal account.</li>
      <li><strong>Cancelling.</strong> A client can cancel a paid project before any student has started it and gets the full payment back, fee included.</li>
      <li><strong>Disagreements.</strong> If the client and student can&apos;t agree whether the work meets the brief, either can ask us to review it at <Fill>{OPERATOR.email}</Fill>. We look at the brief, the delivery and the messages in Folio, and may release the payment to the student, refund the client, or split it. We aim to decide within 14 days.</li>
      <li><strong>No response.</strong> If a client doesn&apos;t verify or request changes within 14 days of a delivery, we may review the delivery ourselves and release the payment if it meets the brief.</li>
      <li><strong>Pay through Folio.</strong> Don&apos;t arrange payment outside Folio for a project you found on Folio; it removes the protection the held payment gives both sides.</li>
    </ul>
  </> },
  { id: "ownership", title: "Who owns the work", body: <>
    <ul>
      <li>Unless the brief says otherwise, once the client has paid in full and the payment is released, the student <strong>transfers to the client the rights to use, copy, change and distribute the deliverables</strong>, worldwide and for the full legal term, as far as the law allows. Until then, the student keeps those rights.</li>
      <li>The student may mention the project title, a short description and the signed credential in their portfolio, unless the brief marks the project as confidential.</li>
      <li>Material the client provides stays the client&apos;s, and may only be used for the project.</li>
      <li>Students must not hand over work that copies someone else&apos;s without permission.</li>
    </ul>
  </> },
  { id: "confidentiality", title: "Confidentiality", body: <>
    <p>Keep what you learn about the other side through a project (business information, data, files, messages) confidential and use it only for the project, unless it is already public or you are required by law to disclose it.</p>
  </> },
  { id: "credentials", title: "Credentials, ratings and reviews", body: <>
    <p>When a client signs off a project, Folio issues a credential: a certificate with the project, the client&apos;s rating and review, and both signatures. It appears on the student&apos;s profile and can be checked by anyone through its verification link. Ratings and reviews must be honest and about the work. We may remove a review or credential that is false, abusive or the result of manipulation.</p>
  </> },
  { id: "conduct", title: "Rules for everyone", body: <>
    <p>Don&apos;t use Folio to:</p>
    <ul>
      <li>post or do anything illegal, fraudulent, misleading, discriminatory, harassing or sexual;</li>
      <li>impersonate someone, or misrepresent your studies, skills or business;</li>
      <li>collect other users&apos; data, send spam, or recruit users for work outside Folio;</li>
      <li>upload malware, scrape the site, or try to get around its security or limits.</li>
    </ul>
  </> },
  { id: "content", title: "Your content", body: <>
    <p>You keep ownership of what you upload (profile, CV, messages, files). You give Folio a non-exclusive, free licence to store, display and process it only as needed to run the service, for example to show your profile to clients you apply to. This ends when the content is deleted, except where it is part of a credential or record we must keep (see the <Link href="/legal/privacy">Privacy Policy</Link>).</p>
  </> },
  { id: "ai", title: "AI features", body: <>
    <p>Folio uses AI to suggest a project brief from a client&apos;s idea and to read a student&apos;s CV to show their strengths. These are suggestions and may be wrong: check them before relying on them. They don&apos;t decide on their own who gets a project.</p>
  </> },
  { id: "ranking", title: "How projects are shown", body: <>
    <p>On a student&apos;s home page, recommended projects are matched on the fields and skills from their CV; without a CV, the newest projects come first. Project lists can be filtered by field. Nobody can pay for a better position.</p>
  </> },
  { id: "reporting", title: "Reporting a problem", body: <>
    <p>To report content or behaviour you believe is illegal or breaks these terms, email <Fill>{OPERATOR.email}</Fill> with a link to it and why. We review reports carefully and without undue delay, tell the person who reported it what we decided, and tell the affected user why if we remove their content or restrict their account. You can ask us to reconsider any such decision by replying to it.</p>
  </> },
  { id: "termination", title: "Suspending or closing accounts", body: <>
    <p>You can close your account at any time by emailing us; projects in progress need to be finished or cancelled first. We may suspend or close an account that breaks these terms, puts others at risk, or where the law requires it. Where we can, we&apos;ll warn you first and explain why. Money held for a student for work already verified will still be paid out.</p>
  </> },
  { id: "liability", title: "Responsibility and liability", body: <>
    <ul>
      <li>We work to keep Folio available and secure, but it is provided as it is and may sometimes be unavailable.</li>
      <li>We are not responsible for the work students deliver, for clients&apos; projects, or for what users agree between themselves, beyond our role in handling the payment.</li>
      <li>Our total liability to you in connection with Folio is limited to the fees you paid to Folio in the 12 months before the claim (for students, who pay no fee, to €100).</li>
      <li>Nothing in these terms limits liability for intent or gross negligence, for death or personal injury, or any other liability that can&apos;t be limited by law, or takes away your rights as a consumer.</li>
    </ul>
  </> },
  { id: "changes", title: "Changes to these terms", body: <>
    <p>We may update these terms as Folio changes. For significant changes we&apos;ll tell you by email or in Folio at least 15 days before they apply, and may ask you to accept them again. The date at the top shows the current version.</p>
  </> },
  { id: "law", title: "Law and disputes", body: <>
    <p>These terms are governed by Spanish law. Any dispute will be handled by the courts of Madrid, unless the law gives you the right to go to the courts where you live. Please contact us first: most problems can be solved quickly.</p>
  </> },
  { id: "contact", title: "Contact", body: <>
    <p><Fill>{OPERATOR.legalName}</Fill> · <Fill>{OPERATOR.address}</Fill> · <Fill>{OPERATOR.email}</Fill>. See the <Link href="/legal/notice">legal notice</Link> for our full details.</p>
  </> },
];

export default function Terms() {
  return (
    <LegalPage current="/legal/terms" title="Terms of Service" sections={sections}
      intro={<p>The rules for using Folio: who can join, how projects, payments and ownership work, and what we each promise. We&apos;ve kept them as plain as we can.</p>} />
  );
}
