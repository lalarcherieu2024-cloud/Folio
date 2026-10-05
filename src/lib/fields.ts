import type { Category } from "./types";

// A soft colour per field, picked to match what people expect of it (tech = blue, finance = green, …).
// `bg` is the soft fill, `fg` the readable text/accent colour on top of it.
export const FIELD_TONES: Record<Category, { bg: string; fg: string }> = {
  "Tech & Data": { bg: "#dbeafe", fg: "#1e40af" },
  "Design & Creative": { bg: "#fce7f3", fg: "#9d174d" },
  "Marketing & Growth": { bg: "#ffedd5", fg: "#9a3412" },
  "Business & Finance": { bg: "#dcfce7", fg: "#166534" },
  "Research & Analysis": { bg: "#ede9fe", fg: "#5b21b6" },
  "Writing & Content": { bg: "#fef3c7", fg: "#92400e" },
  "Video & Photo": { bg: "#cffafe", fg: "#155e75" },
  "Operations & Admin": { bg: "#e2e8f0", fg: "#334155" },
};
