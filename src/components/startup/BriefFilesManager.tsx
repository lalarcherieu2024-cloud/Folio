"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { addBriefFileAction, removeBriefFileAction } from "@/app/actions/submissions";
import { FileRow } from "@/components/shared/FilePreview";
import { BRIEF_EXTENSIONS, extOf, MAX_BRIEF_FILES, MAX_BRIEF_MB, safeName } from "@/lib/files";
import { createClient } from "@/lib/supabase/client";

/** Brief files the company shares with the hired student. Students can only preview them in the app. */
export function BriefFilesManager({ projectId, userId, files }: { projectId: string; userId: string; files: { id: string; fileName: string; sizeKb: number }[] }) {
  const [busy, start] = useTransition();
  const [removing, setRemoving] = useState<string | null>(null);
  const input = useRef<HTMLInputElement>(null);

  function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!(BRIEF_EXTENSIONS as readonly string[]).includes(extOf(file.name))) { toast.error("Use a PDF or an image (PNG, JPG, WebP) so students can preview it."); return; }
    if (file.size > MAX_BRIEF_MB * 1024 * 1024) { toast.error(`The file must be under ${MAX_BRIEF_MB} MB.`); return; }
    start(async () => {
      const path = `${userId}/${projectId}/${Date.now()}-${safeName(file.name)}`;
      const { error } = await createClient().storage.from("project-files").upload(path, file, { contentType: file.type || undefined });
      if (error) { toast.error(/bucket not found/i.test(error.message) ? "File sharing isn't set up yet. Run migration 0019 in Supabase." : "Upload failed. Try again."); return; }
      const r = await addBriefFileAction(projectId, { path, name: file.name, sizeKb: Math.max(1, Math.round(file.size / 1024)) });
      if (r.error) toast.error(r.error); else toast.success("File added");
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border bg-white p-5 shadow-[0_0.0625rem_0.125rem_rgba(0,0,0,.04)]">
      <div className="flex flex-col gap-1">
        <span className="text-base font-semibold">Brief files <span className="font-normal text-muted-foreground">(optional)</span></span>
        <span className="text-[0.8125rem] text-muted-foreground">Templates, examples or data the student needs. Once you accept a student they can <b>preview</b> these inside Folio, but not download them. PDF or image, up to {MAX_BRIEF_MB} MB, {MAX_BRIEF_FILES} files.</span>
      </div>
      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <div key={f.id} className="flex items-center gap-2">
              <div className="min-w-0 flex-1"><FileRow kind="brief" id={f.id} name={f.fileName} sizeKb={f.sizeKb} allowDownload /></div>
              <button type="button" disabled={removing === f.id} aria-label={`Remove ${f.fileName}`} onClick={() => { setRemoving(f.id); removeBriefFileAction(f.id).then((r) => { setRemoving(null); if (r.error) toast.error(r.error); else toast.success("File removed"); }); }} className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-red-50 hover:text-destructive"><Trash2 className="size-4" /></button>
            </div>
          ))}
        </ul>
      )}
      <input ref={input} type="file" accept={BRIEF_EXTENSIONS.join(",")} className="sr-only" onChange={pick} />
      {files.length < MAX_BRIEF_FILES && (
        <button type="button" disabled={busy} onClick={() => input.current?.click()} className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-sm font-medium hover:bg-panel disabled:opacity-60">
          <Plus className="size-4 text-muted-foreground" />{busy ? "Uploading…" : files.length ? "Add another file" : "Add a file"}
        </button>
      )}
    </div>
  );
}
