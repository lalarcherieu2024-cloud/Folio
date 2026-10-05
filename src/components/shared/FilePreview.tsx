"use client";

import { Download, Eye, FileText } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtKb, isPdf, isPreviewable } from "@/lib/files";

type Kind = "brief" | "submission" | "chat";
type Props = { kind: Kind; id: string; name: string; sizeKb: number; allowDownload: boolean };

/** One file row: opens an in-app preview. The Download link only exists when `allowDownload` is true. */
export function FileRow({ kind, id, name, sizeKb, allowDownload }: Props) {
  const [open, setOpen] = useState(false);
  const src = `/api/files/${kind}/${id}`;
  const canPreview = isPreviewable(name);
  return (
    <>
      <li className="flex items-center gap-3 rounded-lg border bg-panel p-2.5">
        <span className="grid size-9 shrink-0 place-items-center rounded-md bg-white text-[0.625rem] font-semibold ring-1 ring-border">{name.split(".").pop()?.toUpperCase().slice(0, 4) || <FileText className="size-4" />}</span>
        <div className="flex min-w-0 flex-1 flex-col"><span className="truncate text-sm font-medium">{name}</span><span className="text-xs text-muted-foreground">{fmtKb(sizeKb)}</span></div>
        {canPreview && <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)} className="h-8 gap-1.5 bg-white px-2.5 text-[0.8125rem]"><Eye className="size-3.5" />Preview</Button>}
        {allowDownload && <a href={`${src}?download=1`} download={name} className="inline-flex h-8 items-center gap-1.5 rounded-md border bg-white px-2.5 text-[0.8125rem] font-medium hover:bg-muted"><Download className="size-3.5" />Download</a>}
        {!canPreview && !allowDownload && <span className="text-xs text-muted-foreground">No preview</span>}
      </li>
      {canPreview && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[min(64rem,calc(100vw-2rem))] p-5 sm:max-w-[min(64rem,calc(100vw-2rem))]">
            <DialogHeader>
              <DialogTitle className="truncate text-base font-semibold">{name}</DialogTitle>
              {!allowDownload && <DialogDescription>Preview only. This file can&apos;t be downloaded.</DialogDescription>}
            </DialogHeader>
            {/* The wrapper blocks the right-click menu on images; the PDF viewer's own toolbar (save, print) is hidden. */}
            <div className="select-none overflow-hidden rounded-lg border bg-zinc-100" onContextMenu={allowDownload ? undefined : (e) => e.preventDefault()}>
              {isPdf(name)
                ? <iframe title={name} src={`${src}#toolbar=0&navpanes=0`} className="h-[72vh] w-full" />
                // eslint-disable-next-line @next/next/no-img-element
                : <img src={src} alt={name} draggable={false} className="mx-auto max-h-[72vh] w-auto object-contain" />}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

export function FileList({ kind, files, allowDownload }: { kind: Kind; files: { id: string; fileName: string; sizeKb: number }[]; allowDownload: boolean }) {
  return <ul className="flex flex-col gap-2">{files.map((f) => <FileRow key={f.id} kind={kind} id={f.id} name={f.fileName} sizeKb={f.sizeKb} allowDownload={allowDownload} />)}</ul>;
}
