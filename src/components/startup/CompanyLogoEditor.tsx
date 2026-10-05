"use client";

import { Camera, Check, ImageUp, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { removeLogoAction, setLogoColorAction, uploadLogoAction } from "@/app/actions/startup";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { squareResize } from "@/components/student/AvatarEditor";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AVATAR_COLORS } from "@/lib/avatar";
import type { Organization } from "@/lib/data/startup";
import { cn } from "@/lib/utils";
import { softColor } from "@/lib/work";

/** Company logo: click it to upload an image or pick a colour for the initials. Same behaviour as the student photo. */
export function CompanyLogoEditor({ org }: { org: Organization }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const current = org.logoColor ?? softColor(org.name).background;
  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.error) toast.error(r.error); else toast.success(ok); });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const fd = new FormData();
    fd.set("photo", await squareResize(file));
    run(() => uploadLogoAction(fd), "Logo updated");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" aria-label="Change company logo" className="group relative shrink-0 rounded-[0.875rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
        <UserAvatar name={org.name} color={org.logoColor} url={org.logoUrl} className="size-[4.5rem] rounded-[0.875rem] text-2xl" />
        <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border bg-white text-zinc-600 shadow-sm transition-transform group-hover:scale-110"><Camera className="size-3.5" /></span>
      </DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[26rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Company logo</DialogTitle>
          <DialogDescription>Upload your logo, or pick a colour for your initials.</DialogDescription>
        </DialogHeader>
        <div className="flex items-center gap-4">
          <UserAvatar name={org.name} color={org.logoColor} url={org.logoUrl} className="size-20 rounded-2xl text-3xl" />
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} />
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="h-9 gap-2 bg-white px-3.5"><ImageUp className="size-4" />{org.logoUrl ? "Replace logo" : "Upload logo"}</Button>
            {org.logoUrl && <Button type="button" variant="ghost" disabled={busy} onClick={() => run(removeLogoAction, "Logo removed")} className="h-8 justify-start gap-2 px-3 text-[0.8125rem] text-destructive hover:bg-red-50 hover:text-destructive"><Trash2 className="size-3.5" />Remove logo</Button>}
            <span className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB. Squared automatically.</span>
          </div>
        </div>
        <div className="grid gap-2">
          <span className="text-sm font-medium">Colour {org.logoUrl && <span className="font-normal text-muted-foreground">(shown when there is no logo)</span>}</span>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_COLORS.map((c) => {
              const on = current === c.bg;
              return (
                <button key={c.bg} type="button" title={c.name} aria-label={c.name} aria-pressed={on} disabled={busy}
                  onClick={() => run(() => setLogoColorAction(c.bg), "Colour saved")} style={{ background: c.bg, color: c.fg }}
                  className={cn("grid size-9 place-items-center rounded-full border border-black/10 transition-transform duration-200 hover:scale-110 active:scale-95", on && "ring-2 ring-offset-2 ring-zinc-900")}>
                  {on && <Check className="size-4" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
