"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { deleteCompanyFileAction, uploadCompanyFileAction } from "@/app/actions/startup";
import type { CompanyFile } from "@/lib/data/startup";
import { MAX_COMPANY_FILES } from "@/lib/form";

/** Files the company shares with students (deck, one-pager, brand kit). */
export function CompanyFilesCard({ files }: { files: CompanyFile[] }) {
  const [busy, start] = useTransition();
  const ref = useRef<HTMLInputElement>(null);
  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.error) toast.error(r.error); else toast.success(ok); });

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("file", file);
    run(() => uploadCompanyFileAction(fd), "File added");
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">Files <span className="font-normal text-muted-foreground">(optional)</span></span>
        <span className="text-[0.8125rem] text-muted-foreground">A pitch deck, one-pager or brand kit helps students understand what you do. Up to {MAX_COMPANY_FILES} files, 10 MB each. Signed-in students can open them.</span>
      </div>
      <input ref={ref} type="file" accept=".pdf,.pptx,.docx,.jpg,.jpeg,.png,.webp" className="sr-only" onChange={onFile} />
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.id} className="flex items-center gap-3 rounded-lg border bg-panel p-2.5">
              <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-[0.625rem] font-semibold ring-1 ring-border">{f.fileName.split(".").pop()?.toUpperCase().slice(0, 4)}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                {f.url ? <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate text-sm font-medium hover:underline">{f.fileName}</a> : <span className="truncate text-sm font-medium">{f.fileName}</span>}
                <span className="text-xs text-muted-foreground">{f.sizeKb} KB</span>
              </div>
              <button type="button" disabled={busy} onClick={() => run(() => deleteCompanyFileAction(f.id), "File removed")} className="grid size-8 place-items-center rounded-md text-muted-foreground hover:bg-white hover:text-destructive" aria-label={`Remove ${f.fileName}`}><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
      )}
      {files.length < MAX_COMPANY_FILES && (
        <button type="button" disabled={busy} onClick={() => ref.current?.click()} className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-sm font-medium hover:bg-panel disabled:opacity-60">
          <Plus className="size-4 text-muted-foreground" />{busy ? "Uploading…" : files.length ? "Add another file" : "Add a file"}
        </button>
      )}
    </div>
  );
}
