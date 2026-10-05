// File-type rules shared by the browser and the server. No server-only imports here.

export const MAX_SUBMISSION_FILES = 10;
export const MAX_SUBMISSION_MB = 25;
export const MAX_BRIEF_FILES = 8;
export const MAX_BRIEF_MB = 15;

/** Brief files (company → students) must be previewable in the browser: PDFs and images. */
export const BRIEF_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".webp"] as const;

export const extOf = (name: string) => (name.match(/\.[^.]+$/)?.[0] ?? "").toLowerCase();

// Content types we are willing to show inline from our own domain. Everything else is only ever
// downloaded (a student's upload could be an .html file, which must never run on our origin).
const INLINE: Record<string, string> = {
  ".pdf": "application/pdf", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
};
export const inlineType = (name: string): string | null => INLINE[extOf(name)] ?? null;
export const isPdf = (name: string) => extOf(name) === ".pdf";
export const isPreviewable = (name: string) => inlineType(name) !== null;

/** A storage-safe version of a file name (keeps the extension). */
export const safeName = (name: string) => name.normalize("NFKD").replace(/[^\w.\-]+/g, "_").replace(/_+/g, "_").slice(-80) || "file";

export const fmtKb = (kb: number) => (kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`);
