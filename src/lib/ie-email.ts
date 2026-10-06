// Folio is for IE students. Mirrors allowed_email_domains in supabase/migrations/0001_init.sql.
export const IE_EMAIL_DOMAINS = ["ie.edu", "student.ie.edu"];

export const isIeEmail = (e: string) => IE_EMAIL_DOMAINS.includes(e.trim().split("@")[1]?.toLowerCase() ?? "");
