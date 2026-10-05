// Helpers shared by all server actions and forms.
export type FormState = { error?: string; ok?: boolean; notice?: string };

export const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Only allow same-site relative redirects after sign-in.
export const safeNext = (n: string) => (n.startsWith("/") && !n.startsWith("//") ? n : "");

// Most files a company can share with students on its profile.
export const MAX_COMPANY_FILES = 6;
