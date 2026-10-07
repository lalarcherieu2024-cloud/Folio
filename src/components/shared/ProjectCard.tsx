import { ArrowRight, Check, Sprout } from "lucide-react";
import Link from "next/link";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { SaveButton } from "@/components/student/SaveButton";
import { FIELD_TONES } from "@/lib/fields";
import { eur, type Viewer } from "@/lib/work";
import type { Project } from "@/lib/types";


// How many skill chips a card shows before "+N", so cards stay the same height in the grid.
const MAX_SKILLS = 3;

// Built to be scanned in a grid: only what helps decide whether to open a project. Text is clamped so every card
// is the same shape; the rest (length, hours, what you'll learn, applicants, the brief) is on the project page,
// which the card opens: applying happens there, after reading the full listing.
// The title's link stretches over the whole card (after:inset-0), so the client's photo and name can be a link of
// their own on top (links can't nest): it opens the project page at "About <client>".
export function ProjectCard({ p, applied, href, viewer }: { p: Project; applied?: boolean; href?: string; viewer?: Viewer }) {
  const mine = new Set(viewer?.skills ?? []);
  const pic = p.orgLogoUrl;
  const name = p.orgName ?? p.clientName;
  const url = href ?? `/projects/${p.id}`;
  const tone = FIELD_TONES[p.category] ?? { bg: "#f1f5f9", fg: "#334155" };
  // Skills you already have first, so a match shows even when the list is cut short.
  const skills = [...p.skills].sort((a, b) => Number(mine.has(b.toLowerCase())) - Number(mine.has(a.toLowerCase())));
  return (
    <article className="card-hover relative flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)] has-[a:focus-visible]:ring-2 has-[a:focus-visible]:ring-ring">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-6 min-w-0 items-center truncate rounded-md px-2 text-xs font-semibold" style={{ background: tone.bg, color: tone.fg }}>{p.category}</span>
        {p.beginnerFriendly && <span className="inline-flex h-6 shrink-0 items-center gap-1 text-xs font-medium text-[#166534]"><Sprout className="size-3.5" />First project</span>}
        {viewer?.id && <span className="relative z-10 -my-1 ml-auto shrink-0"><SaveButton projectId={p.id} initial={viewer.saved.includes(p.id)} /></span>}
      </div>

      <div className="flex flex-col gap-1.5">
        <h3 className="line-clamp-2 text-balance text-[1.0625rem] font-semibold leading-snug tracking-tight">
          <Link href={url} scroll={false} className="outline-none after:absolute after:inset-0 after:rounded-xl">{p.title}</Link>
        </h3>
        <div className="flex min-w-0 items-center gap-1.5 text-[0.8125rem] text-muted-foreground">
          {/* The company's logo (initials without one), linking to who they are. */}
          <Link href={`${url}#client`} title={`About ${name}`} className="group/client relative z-10 flex min-w-0 items-center gap-2 rounded-md">
            <UserAvatar name={name} url={pic} className="size-6 rounded-md text-[0.625rem] ring-1 ring-black/5" />
            <span className="truncate font-medium text-zinc-700 underline-offset-2 group-hover/client:text-foreground group-hover/client:underline">{name}</span>
          </Link>
          {p.orgVerified && <Check className="size-3.5 shrink-0 text-[#16a34a]" strokeWidth={2.5} aria-label="Verified" />}
          <span className="truncate">· {p.hood}</span>
        </div>
      </div>

      <p className="line-clamp-2 text-pretty text-sm leading-relaxed text-muted-foreground">{p.summary}</p>

      <div className="flex flex-wrap gap-1.5">
        {skills.slice(0, MAX_SKILLS).map((s) => {
          const match = mine.has(s.toLowerCase());
          return (
            <span key={s} title={match ? "On your profile" : "Not on your profile yet"}
              className={`inline-flex h-6 items-center gap-1 rounded-md px-2 text-xs font-medium ${match ? "bg-[#dcfce7] text-[#166534]" : "bg-secondary text-zinc-700"}`}>
              {match && <Check className="size-[0.6875rem]" strokeWidth={3} />}{s}
            </span>
          );
        })}
        {skills.length > MAX_SKILLS && <span className="inline-flex h-6 items-center px-1 text-xs text-muted-foreground" title={skills.slice(MAX_SKILLS).join(", ")}>+{skills.length - MAX_SKILLS}</span>}
      </div>

      <div className="mt-auto flex items-center gap-3 border-t border-zinc-100 pt-3.5">
        <span className="text-base font-semibold tabular-nums">{eur(p.priceEur)}</span>
        {applied
          ? <span className="ml-auto inline-flex h-8 shrink-0 items-center gap-1 rounded-md bg-[#dcfce7] px-2.5 text-xs font-medium text-[#166534]"><Check className="size-3" strokeWidth={3} />Applied</span>
          : <span aria-hidden className="ml-auto inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 text-[0.8125rem] font-medium text-primary-foreground">View project<ArrowRight className="size-[0.8125rem]" strokeWidth={2.5} /></span>}
      </div>
    </article>
  );
}
