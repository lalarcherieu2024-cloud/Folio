// TEMPORARY: while true, sign-up and sign-in skip email confirmation for students and companies
// (no confirmation link, no 6-digit code). Accounts are confirmed server-side with the service role.
// The "verified student" badge is NOT granted while this is on, since the email was never proven.
// Remove this flag (and the branches that read it) before real users sign up.
export const SKIP_EMAIL_CONFIRMATION = process.env.NEXT_PUBLIC_SKIP_EMAIL_CONFIRMATION === "true";
