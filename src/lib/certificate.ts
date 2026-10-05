// The Folio certificate: A4 landscape, drawn to match the approved design (folio-certificate.html) —
// cream paper, triple navy/gold border, corner ornaments, watermark, centre seal, two signature blocks.
// All measurements below are the design's own millimetres; `top(…)` converts "mm from the top edge".
import fs from "node:fs";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { degrees, LineCapStyle, PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

export type CertificateData = {
  studentName: string;
  projectTitle: string;
  client: string;       // company name, or the student client's name
  hood: string;
  rating: number;
  review: string;
  issuedAt: string;     // "October 2026"
  credentialId: string;
  verifyUrl: string;
  // Each party's signature as a PNG data URL, once they signed (the client first, then the student).
  clientSignature?: string | null;
  clientSigner?: string | null;
  clientSignedAt?: string | null;
  studentSignature?: string | null;
  studentSignedAt?: string | null;
};

// ---------------------------------------------------------------- units and colours
const MM = 72 / 25.4;
const mm = (v: number) => v * MM;
const W = mm(297), H = mm(210);
const top = (v: number) => H - mm(v);                     // y of a point v mm below the top edge
const hex = (h: string) => rgb(parseInt(h.slice(1, 3), 16) / 255, parseInt(h.slice(3, 5), 16) / 255, parseInt(h.slice(5, 7), 16) / 255);
const NAVY = hex("#13324f"), GOLD = hex("#b08d57"), GOLD2 = hex("#d6bd8e"), INK = hex("#1b2430"), MUTED = hex("#6a7380"), PAPER = hex("#fdfbf6");

// ---------------------------------------------------------------- fonts (OFL: Cormorant Garamond, Inter)
const FONT_DIR = path.join(process.cwd(), "src/assets/fonts");
const FILES = {
  serif: "CormorantGaramond-SemiBold.ttf", serifItalic: "CormorantGaramond-MediumItalic.ttf",
  sans: "Inter-Regular.ttf", sansMedium: "Inter-Medium.ttf", sansBold: "Inter-SemiBold.ttf",
} as const;
type Fonts = Record<keyof typeof FILES, PDFFont>;

async function embedFonts(pdf: PDFDocument): Promise<Fonts> {
  pdf.registerFontkit(fontkit);
  const out = {} as Fonts;
  for (const [k, file] of Object.entries(FILES)) out[k as keyof typeof FILES] = await pdf.embedFont(fs.readFileSync(path.join(FONT_DIR, file)), { subset: false }); // embedded whole: the subsetter in pdf-lib's font library mangles composed letters (í, á, ñ)
  return out;
}

// ---------------------------------------------------------------- text helpers
// Only characters the fonts cover (Latin-1 plus typographic punctuation); anything else is dropped.
const clean = (s: string) => s.replace(/[\r\n\t]+/g, " ").replace(/[^\x20-\x7E -ÿ–—‘’“”…]/g, "").replace(/ +/g, " ").trim();
const pngBytes = (dataUrl: string) => Uint8Array.from(Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), "base64"));
const shortDate = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Width of text with CSS-style letter-spacing (em of the font size); the trailing space is not counted. */
function spacedWidth(text: string, font: PDFFont, size: number, spacingEm: number) {
  return font.widthOfTextAtSize(text, size) + Math.max(0, text.length - 1) * spacingEm * size;
}

function drawSpaced(page: PDFPage, text: string, x: number, baseline: number, font: PDFFont, size: number, color: ReturnType<typeof rgb>, spacingEm: number, opacity = 1) {
  if (!spacingEm) { page.drawText(text, { x, y: baseline, size, font, color, opacity }); return; }
  let cx = x;
  for (const ch of text) { page.drawText(ch, { x: cx, y: baseline, size, font, color, opacity }); cx += font.widthOfTextAtSize(ch, size) + spacingEm * size; }
}

/** Centred on `cx` (pt). `baselineMm` is measured from the top edge. */
function centeredAt(page: PDFPage, text: string, cx: number, baselineMm: number, font: PDFFont, sizeMm: number, color: ReturnType<typeof rgb>, spacingEm = 0) {
  const size = mm(sizeMm);
  drawSpaced(page, text, cx - spacedWidth(text, font, size, spacingEm) / 2, top(baselineMm), font, size, color, spacingEm);
}
/** Centred on the page. */
const centered = (page: PDFPage, text: string, baselineMm: number, font: PDFFont, sizeMm: number, color: ReturnType<typeof rgb>, spacingEm = 0) =>
  centeredAt(page, text, W / 2, baselineMm, font, sizeMm, color, spacingEm);

function wrap(text: string, font: PDFFont, size: number, maxWidth: number, maxLines: number): string[] {
  const lines: string[] = [];
  let line = "";
  const words = clean(text).split(" ");
  for (let i = 0; i < words.length; i++) {
    const next = line ? `${line} ${words[i]}` : words[i];
    if (font.widthOfTextAtSize(next, size) <= maxWidth || !line) { line = next; continue; }
    lines.push(line); line = words[i];
    if (lines.length === maxLines) { line = ""; words.length = i; lines[maxLines - 1] += "…"; break; }
  }
  if (line) lines.push(line);
  return lines.slice(0, maxLines);
}

// Star used in the rating row, drawn in a 10×10 box.
const STAR = (() => {
  const p = Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 2.15 : 5, a = (-90 + k * 36) * Math.PI / 180; return `${(5 + r * Math.cos(a)).toFixed(3)} ${(5.3 + r * Math.sin(a)).toFixed(3)}`; });
  return `M${p.join("L")}Z`;
})();

// Corner ornament in a 40×40 box, mirrored by hand for the other three corners.
const CORNERS = {
  tl: "M2 38V8a6 6 0 0 1 6-6h30M8 38V14a6 6 0 0 1 6-6h24M14 20a6 6 0 0 1 6-6",
  tr: "M38 38V8a6 6 0 0 0-6-6h-30M32 38V14a6 6 0 0 0-6-6h-24M26 20a6 6 0 0 0-6-6",
  bl: "M2 2V32a6 6 0 0 0 6 6h30M8 2V26a6 6 0 0 0 6 6h24M14 20a6 6 0 0 0 6 6",
  br: "M38 2V32a6 6 0 0 1-6 6h-30M32 2V26a6 6 0 0 1-6 6h-24M26 20a6 6 0 0 1-6 6",
};

export async function buildCertificate(d: CertificateData): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Folio certificate: ${clean(d.projectTitle)}`);
  pdf.setAuthor("Folio");
  const page = pdf.addPage([W, H]);
  const f = await embedFonts(pdf);
  const cx = W / 2;

  // ---- paper and the triple border (CSS borders sit inside their box, so strokes are inset by half a width)
  page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: PAPER });
  const frame = (inset: number, border: number, color: ReturnType<typeof rgb>) =>
    page.drawRectangle({ x: mm(inset + border / 2), y: mm(inset + border / 2), width: W - mm(2 * inset + border), height: H - mm(2 * inset + border), borderColor: color, borderWidth: mm(border) });
  frame(8, 1.6, NAVY); frame(11.5, 0.35, GOLD); frame(12.8, 0.2, GOLD2);

  // ---- corner ornaments (14 mm boxes, 14.5 mm from the edges)
  const unit = mm(14) / 40;
  const corner = (p: string, left: number, topMm: number) => page.drawSvgPath(p, { x: mm(left), y: top(topMm), scale: unit, borderColor: GOLD, borderWidth: unit * 0.9 });
  corner(CORNERS.tl, 14.5, 14.5); corner(CORNERS.tr, 297 - 14.5 - 14, 14.5);
  corner(CORNERS.bl, 14.5, 210 - 14.5 - 14); corner(CORNERS.br, 297 - 14.5 - 14, 210 - 14.5 - 14);

  // ---- watermark: a ring with an F, 4.5% opacity
  const wmU = mm(120) / 100, wmTop = 210 * 0.52 - 60;
  page.drawCircle({ x: cx, y: top(210 * 0.52), size: 46 * wmU, borderColor: NAVY, borderWidth: 2 * wmU, borderOpacity: 0.045, opacity: 0 });
  const fSize = 52 * wmU;
  page.drawText("F", { x: cx - f.serif.widthOfTextAtSize("F", fSize) / 2, y: top(wmTop + (66 * 120) / 100), size: fSize, font: f.serif, color: NAVY, opacity: 0.045 });

  // ---- brand
  centered(page, "FOLIO", 25.47, f.serif, 7, NAVY, 0.42);
  const ornY = top(30.38);
  page.drawRectangle({ x: cx - mm(25.9), y: ornY - mm(0.15), width: mm(22), height: mm(0.3), color: GOLD });
  page.drawRectangle({ x: cx + mm(3.9), y: ornY - mm(0.15), width: mm(22), height: mm(0.3), color: GOLD });
  page.drawRectangle({ x: cx - mm(0.9), y: ornY - mm(0.9), width: mm(1.8), height: mm(1.8), color: GOLD, rotate: degrees(45), xSkew: degrees(0), ySkew: degrees(0) });
  centered(page, "CERTIFICATE OF VERIFIED WORK", 38.28, f.sansMedium, 3.1, MUTED, 0.38);

  // ---- who, what
  centered(page, "This is to certify that", 53.02, f.serifItalic, 5.4, MUTED);
  let nameMm = 17;
  while (f.serif.widthOfTextAtSize(clean(d.studentName), mm(nameMm)) > mm(235) && nameMm > 9) nameMm -= 0.5;
  centered(page, clean(d.studentName), 70.49 + (17 - nameMm) * 0.82, f.serif, nameMm, NAVY, 0.01);
  for (let i = 0; i < 40; i++) {                                    // gold rule fading out at both ends
    const t = (i + 0.5) / 40;
    page.drawRectangle({ x: cx - mm(60) + (mm(120) / 40) * i, y: top(76.87), width: mm(120) / 40 + 0.2, height: mm(0.3), color: GOLD, opacity: 1 - Math.abs(2 * t - 1) });
  }
  centered(page, "has successfully completed the project", 86.67, f.serifItalic, 5.2, MUTED);

  const titleLines = wrap(d.projectTitle, f.serif, mm(8.6), mm(210), 2);
  titleLines.forEach((l, i) => centered(page, l, 97.36 + i * 9.89, f.serif, 8.6, INK));
  const dy = (titleLines.length - 1) * 9.89;
  const hood = d.hood ? ` · ${clean(d.hood)}${/madrid/i.test(d.hood) ? "" : ", Madrid"}` : "";
  centered(page, `for ${clean(d.client)}${hood}`, 105.55 + dy, f.sans, 3.6, MUTED, 0.02);

  // ---- rating row: five stars, then the sentence, centred together
  const starBox = mm(3.6), starGap = mm(0.8), ratingText = `RATED ${d.rating} OUT OF 5 BY THE CLIENT`, rSize = mm(3.3);
  const starsW = 5 * starBox + 4 * starGap, textW = spacedWidth(ratingText, f.sansMedium, rSize, 0.06), rowW = starsW + mm(3) + textW;
  const rowX = cx - rowW / 2, rowMid = top(114.96 + dy);
  for (let i = 0; i < 5; i++) page.drawSvgPath(STAR, { x: rowX + i * (starBox + starGap), y: rowMid + starBox / 2, scale: starBox / 10, color: GOLD, opacity: i < d.rating ? 1 : 0.25 });
  drawSpaced(page, ratingText, rowX + starsW + mm(3), rowMid - mm(1.15), f.sansMedium, rSize, NAVY, 0.06);

  const quoteLines = wrap(`“${d.review}”`, f.serifItalic, mm(5.4), mm(200), titleLines.length > 1 ? 2 : 3);
  quoteLines.forEach((l, i) => centered(page, l, 124.99 + dy + i * 6.54, f.serifItalic, 5.4, INK));

  // ---- signature blocks (student left, client right) and the seal between them
  const colW = 90.5, leftX = 31, rightX = 175.5, lineY = 172.27;
  const block = async (x: number, caption: string, sub: string, sig: string | null | undefined, signedAt: string | null | undefined) => {
    if (sig) {
      const img = await pdf.embedPng(pngBytes(sig));
      const scale = Math.min(mm(colW - 12) / img.width, mm(13) / img.height);
      page.drawImage(img, { x: mm(x + colW / 2) - (img.width * scale) / 2, y: top(lineY) + mm(1), width: img.width * scale, height: img.height * scale });
    }
    page.drawRectangle({ x: mm(x + 6), y: top(lineY + 0.3), width: mm(colW - 12), height: mm(0.3), color: INK, opacity: 0.55 });
    const mid = mm(x + colW / 2);
    centeredAt(page, caption.toUpperCase(), mid, 177.38, f.sansBold, 2.9, NAVY, 0.16);
    centeredAt(page, clean(sub), mid, 181.59, f.sans, 2.8, MUTED);
    if (signedAt) centeredAt(page, `Signed ${shortDate(signedAt)}`, mid, 185, f.sansMedium, 2.6, GOLD, 0.02);
    else centeredAt(page, "Awaiting signature", mid, 185.2, f.serifItalic, 3.4, MUTED);
  };
  await block(leftX, "Student", clean(d.studentName), d.studentSignature, d.studentSignedAt);
  await block(rightX, "Client", `${clean(d.clientSigner || "Authorised signatory")} · ${clean(d.client)}`, d.clientSignature, d.clientSignedAt);

  // seal: 34 mm, centre at (148.5, 166.27)
  const su = mm(34) / 120, sx = cx, sy = top(166.27);
  page.drawCircle({ x: sx, y: sy, size: 57 * su, color: NAVY });
  page.drawCircle({ x: sx, y: sy, size: 53 * su, borderColor: GOLD2, borderWidth: su, opacity: 0 });
  page.drawCircle({ x: sx, y: sy, size: 31 * su, borderColor: GOLD2, borderWidth: su, opacity: 0 });
  const ringText = "FOLIO · VERIFIED · FOLIO · VERIFIED · ", rSz = 7.2 * su, r = 40 * su;
  let s = 0;
  for (const ch of ringText) {                                       // text running clockwise along the ring, from the left
    const phi = Math.PI - s / r;
    if (s > 2 * Math.PI * r) break;
    page.drawText(ch, { x: sx + r * Math.cos(phi), y: sy + r * Math.sin(phi), size: rSz, font: f.sansBold, color: GOLD2, rotate: degrees(((phi - Math.PI / 2) * 180) / Math.PI) });
    s += f.sansBold.widthOfTextAtSize(ch, rSz) + 2.1 * su;
  }
  const tick = (x1: number, y1: number, x2: number, y2: number) => page.drawLine({ start: { x: sx + (x1 - 60) * su, y: sy - (y1 - 60) * su }, end: { x: sx + (x2 - 60) * su, y: sy - (y2 - 60) * su }, thickness: 5 * su, color: GOLD2, lineCap: LineCapStyle.Round });
  tick(47, 61, 56, 70); tick(56, 70, 73, 52);

  // ---- meta row
  page.drawRectangle({ x: mm(31), y: top(187.27), width: mm(235), height: mm(0.2), color: GOLD, opacity: 0.45 });
  const mSize = mm(2.5), baseline = top(192.39);
  const runs = (parts: [string, boolean][]) => parts.map(([t, b]) => ({ t, font: b ? f.sansBold : f.sans }));
  const groups = [
    runs([["Verified by ", false], ["Folio", true], [" · Issued ", false], [clean(d.issuedAt), true]]),
    runs([["Credential ID ", false], [d.credentialId, true]]),
    runs([["Verify at ", false], [d.verifyUrl.replace(/^https?:\/\//, ""), true]]),
  ];
  const widthOf = (g: ReturnType<typeof runs>) => g.reduce((n, r) => n + spacedWidth(r.t, r.font, mSize, 0.03) + 0.03 * mSize, 0);
  const gap = (mm(235) - groups.reduce((n, g) => n + widthOf(g), 0)) / 2;
  let mx = mm(31);
  for (const g of groups) {
    for (const r of g) { drawSpaced(page, r.t, mx, baseline, r.font, mSize, r.font === f.sansBold ? INK : MUTED, 0.03); mx += spacedWidth(r.t, r.font, mSize, 0.03) + 0.03 * mSize; }
    mx += gap;
  }

  return pdf.save();
}
