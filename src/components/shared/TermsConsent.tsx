import Link from "next/link";

// Sign-up's agreement to the Terms and Privacy Policy. Required: signUpAction refuses an account without it and
// stores which version was accepted (TERMS_VERSION) on the account.
export function TermsConsent() {
  return (
    <label className="flex items-start gap-2.5 text-[0.8125rem] leading-snug text-muted-foreground">
      <input type="checkbox" name="terms" required className="mt-0.5 size-4 shrink-0 accent-[var(--primary)]" />
      <span>I agree to Folio&apos;s <Link href="/legal/terms" target="_blank" className="font-medium text-foreground underline underline-offset-2">Terms of Service</Link> and have read the <Link href="/legal/privacy" target="_blank" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</Link>. I&apos;m 18 or older.</span>
    </label>
  );
}

// The same agreement for one-click sign-in buttons, which can't carry a checkbox: shown right under the button.
export function TermsNotice({ action = "continuing" }: { action?: string }) {
  return (
    <p className="text-center text-xs leading-snug text-muted-foreground">
      By {action}, you agree to the <Link href="/legal/terms" target="_blank" className="underline underline-offset-2">Terms of Service</Link> and confirm you&apos;ve read the <Link href="/legal/privacy" target="_blank" className="underline underline-offset-2">Privacy Policy</Link>.
    </p>
  );
}
