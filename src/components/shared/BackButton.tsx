"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

// Goes back to where you came from (keeps your filters), or to a fallback page if there is no history.
export function BackButton({ fallback, label }: { fallback: string; label: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => (window.history.length > 1 ? router.back() : router.push(fallback))}
      className="inline-flex w-fit items-center gap-1.5 rounded-md border bg-white px-3 py-1.5 text-[0.8125rem] font-medium text-zinc-700 hover:bg-muted"
    >
      <ArrowLeft className="size-3.5" />{label}
    </button>
  );
}
