import Link from "next/link";
import { Fill, LegalPage, LegalTable, type LegalSection } from "@/components/marketing/LegalPage";
import { OPERATOR } from "@/lib/legal";

export const metadata = { title: "Legal notice · Folio" };

// The "aviso legal" Spanish law (LSSI-CE art. 10) requires on every commercial website: who runs it and how to reach them.

const sections: LegalSection[] = [
  { id: "owner", title: "Who runs this website", body: <>
    <LegalTable head={["", ""]} rows={[
      ["Operator", <Fill key="n">{OPERATOR.legalName}</Fill>],
      ["Tax ID (NIF/CIF)", <Fill key="t">{OPERATOR.taxId}</Fill>],
      ["Address", <Fill key="a">{OPERATOR.address}</Fill>],
      ["Registry", <Fill key="r">{OPERATOR.registry}</Fill>],
      ["Email", <Fill key="e">{OPERATOR.email}</Fill>],
    ]} />
  </> },
  { id: "purpose", title: "What the website is for", body: <>
    <p>Folio is a platform where students take on paid, fixed-price projects from companies and other clients, and earn signed credentials for finished work. Using it with an account is governed by the <Link href="/legal/terms">Terms of Service</Link>.</p>
  </> },
  { id: "ip", title: "Intellectual property", body: <>
    <p>The Folio name, logo, design and software belong to the operator or its licensors. You may not copy or reuse them without permission. Content users upload belongs to them, as described in the Terms of Service.</p>
  </> },
  { id: "links", title: "Links to other websites", body: <>
    <p>Folio links to other sites, such as PayPal, LinkedIn or a client&apos;s website. We aren&apos;t responsible for their content, and will remove a link if we learn it leads to unlawful content.</p>
  </> },
  { id: "data", title: "Personal data and cookies", body: <>
    <p>See the <Link href="/legal/privacy">Privacy Policy</Link> and the <Link href="/legal/cookies">Cookie Policy</Link>.</p>
  </> },
  { id: "law", title: "Applicable law", body: <>
    <p>This website and this notice are governed by Spanish law, in particular Law 34/2002 on information society services (LSSI-CE).</p>
  </> },
];

export default function Notice() {
  return <LegalPage current="/legal/notice" title="Legal notice" sections={sections} intro={<p>The details Spanish law asks every commercial website to publish (<em>aviso legal</em>).</p>} />;
}
