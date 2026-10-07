// A payment receipt for one project, in the certificate's typography and colours (A4 portrait).
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { embedFolioFonts } from "./certificate";

export type ReceiptData = {
  receiptNo: string;          // short, from the escrow id
  paidAt: string;             // ISO
  company: string;
  cif: string;
  payerName: string;
  payerEmail: string;
  projectTitle: string;
  student: string | null;
  amountCents: number;        // paid to the student when the work is verified
  feeCents: number;           // Folio's fee
  status: string;             // "Held in escrow", "Paid to the student", ...
  method: string;             // "PayPal" or "Test mode (no real money)"
  reference: string | null;
};

const MM = 72 / 25.4, mm = (v: number) => v * MM;
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const NAVY = hex("#13324f"), GOLD = hex("#b08d57"), INK = hex("#1b2430"), MUTED = hex("#6a7380"), LINE = hex("#e3ded3"), PAPER = hex("#fdfbf6");
const clean = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7E -ÿ–—‘’“”…€]/g, "").trim();
const money = (cents: number) => "€" + (cents / 100).toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

export async function buildReceipt(d: ReceiptData, origin: string): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Folio receipt ${d.receiptNo}`);
  pdf.setAuthor("Folio");
  const W = mm(210), H = mm(297);
  const page = pdf.addPage([W, H]);
  const f = await embedFolioFonts(pdf, origin);
  const L = mm(22), R = W - mm(22);
  let y = H - mm(28);
  const text = (t: string, x: number, yy: number, font: PDFFont, size: number, color = INK) => page.drawText(clean(t), { x, y: yy, size, font, color });
  const right = (t: string, yy: number, font: PDFFont, size: number, color = INK) => text(t, R - font.widthOfTextAtSize(clean(t), size), yy, font, size, color);
  const rule = (yy: number, color = LINE, w = 0.8) => page.drawLine({ start: { x: L, y: yy }, end: { x: R, y: yy }, thickness: w, color });

  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  page.drawRectangle({ x: 0, y: H - mm(6), width: W, height: mm(6), color: NAVY });

  // Header
  text("FOLIO", L, y, f.serif, 24, NAVY);
  right("PAYMENT RECEIPT", y + 4, f.sansBold, 9, MUTED);
  right(`No. ${d.receiptNo}`, y - 10, f.sans, 9, MUTED);
  y -= mm(12);
  rule(y, GOLD, 1);

  // Who and when
  y -= mm(12);
  text("Billed to", L, y, f.sansBold, 8.5, MUTED);
  text("Date paid", L + mm(95), y, f.sansBold, 8.5, MUTED);
  y -= 15;
  text(d.company, L, y, f.sansBold, 11);
  text(date(d.paidAt), L + mm(95), y, f.sans, 11);
  y -= 14;
  if (d.cif) text(`CIF ${d.cif}`, L, y, f.sans, 9.5, MUTED);
  text(d.method, L + mm(95), y, f.sans, 9.5, MUTED);
  y -= 13;
  text(`${d.payerName} · ${d.payerEmail}`, L, y, f.sans, 9.5, MUTED);
  if (d.reference) text(`Ref. ${d.reference}`, L + mm(95), y, f.sans, 9.5, MUTED);

  // The project
  y -= mm(16);
  text("Project", L, y, f.sansBold, 8.5, MUTED);
  y -= 22;
  text(d.projectTitle, L, y, f.serif, 17, NAVY);
  if (d.student) { y -= 15; text(`Done by ${d.student}`, L, y, f.serif, 11, MUTED); }

  // Lines
  y -= mm(14);
  text("Description", L, y, f.sansBold, 8.5, MUTED);
  right("Amount", y, f.sansBold, 8.5, MUTED);
  y -= 8; rule(y);
  const line = (label: string, sub: string, cents: number) => {
    y -= 18; text(label, L, y, f.sans, 10.5); right(money(cents), y, f.sansMedium, 10.5);
    y -= 12; text(sub, L, y, f.sans, 8.5, MUTED);
    y -= 8; rule(y);
  };
  line("Project price", "Held by Folio and paid to the student once you verify their work", d.amountCents);
  line("Folio fee (15%)", "Matching, verification, escrow and the signed certificate", d.feeCents);
  y -= 22;
  text("Total paid", L, y, f.sansBold, 12, NAVY);
  right(money(d.amountCents + d.feeCents), y, f.sansBold, 13, NAVY);
  y -= 16;
  text(`Status: ${d.status}`, L, y, f.sans, 9.5, MUTED);

  // Footer
  const fy = mm(24);
  rule(fy + 14, GOLD, 0.6);
  text("Folio · Paid projects for IE students, verified by the companies they work for.", L, fy, f.sans, 8, MUTED);
  text("This receipt confirms a payment held by Folio for the project above. It is not a tax invoice.", L, fy - 11, f.sans, 8, MUTED);
  return pdf.save();
}
