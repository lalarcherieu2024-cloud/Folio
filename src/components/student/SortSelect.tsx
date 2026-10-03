"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortSelect({ value }: { value: string }) {
  const router = useRouter();
  const params = useSearchParams();
  return (
    <select
      aria-label="Sort projects" value={value}
      onChange={(e) => { const n = new URLSearchParams(params.toString()); n.set("sort", e.target.value); router.replace(`/projects?${n}`, { scroll: false }); }}
      className="h-8 cursor-pointer rounded-md border bg-white px-2.5 pr-7 text-[0.8125rem] outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <option value="new">Newest</option><option value="pay">Highest pay</option><option value="short">Shortest</option><option value="open">Fewest applicants</option>
    </select>
  );
}
