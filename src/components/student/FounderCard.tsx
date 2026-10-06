import { Rocket } from "lucide-react";
import { startFounderSignupAction } from "@/app/actions/auth";
import { STARTUP_MAX_PAY } from "@/lib/org";

/** The way in for student founders (migration 0031), quietly at the end of the student home: a startup hires through
 *  its own company account, so the button signs out of this one and opens the founder sign-up. */
export function FounderCard() {
  return (
    <section className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-2xl bg-soft/50 px-5 py-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand ring-1 ring-brand/10"><Rocket className="size-5" /></span>
      <div className="flex min-w-[15rem] flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">Have a startup? Hire other IE students</span>
        <span className="text-[0.8125rem] leading-relaxed text-zinc-600">
          Your startup gets its own account, separate from this one. Not registered yet is fine: projects up to €{STARTUP_MAX_PAY}, and we show you how hiring works.
        </span>
      </div>
      <form action={startFounderSignupAction}>
        <button type="submit" className="inline-flex h-9 items-center rounded-md border bg-white px-3.5 text-[0.8125rem] font-medium hover:border-zinc-400">
          Sign out and set it up
        </button>
      </form>
    </section>
  );
}
