import type { Credential } from "@/lib/types";

export function Plaque({ c }: { c: Credential }) {
  return (
    <article className="plaque" aria-label="Verified project credential">
      <p className="text-center text-[.85rem] font-semibold text-[#3b4a8f]">{c.orgName ?? "Student project"}, {c.hood}, Madrid</p>
      <p className="my-3 text-center font-serif text-2xl font-bold leading-tight">{c.projectTitle}</p>
      <p className="mb-3.5 text-center text-[.92rem] italic text-[#34406e]">“{c.review}”</p>
      <div className="flex flex-wrap justify-between gap-2.5 border-t border-[#c5cde6] pt-2.5 text-[.8rem] text-[#3b4a8f]">
        <span className="font-bold text-[#1e7a4f]">✓ Verified by {c.clientName}</span>
        <span>
          <span className="tracking-widest text-[#b8322a]" aria-label={`${c.rating} out of 5`}>{"★".repeat(c.rating)}{"☆".repeat(5 - c.rating)}</span> {c.issuedAt}
        </span>
      </div>
    </article>
  );
}
