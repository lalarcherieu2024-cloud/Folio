"use client";

import { Camera, Check, ImageUp, Trash2 } from "lucide-react";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { removeAvatarAction, setAvatarColorAction, uploadAvatarAction } from "@/app/actions/student";
import { UserAvatar } from "@/components/shared/UserAvatar";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AVATAR_COLORS } from "@/lib/avatar";
import type { StudentProfile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { softColor } from "@/lib/work";

// Crops to a centred square and shrinks to 512px before upload, so photos stay small and look right.
export async function squareResize(file: File): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const side = Math.min(bmp.width, bmp.height);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    canvas.getContext("2d")!.drawImage(bmp, (bmp.width - side) / 2, (bmp.height - side) / 2, side, side, 0, 0, 512, 512);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/jpeg", 0.9));
    return blob ? new File([blob], "avatar.jpg", { type: "image/jpeg" }) : file;
  } catch {
    return file;
  }
}

export function AvatarEditor({ user }: { user: StudentProfile }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const current = user.avatarColor ?? softColor(user.fullName).background;

  const run = (fn: () => Promise<{ error?: string }>, ok: string) => start(async () => { const r = await fn(); if (r.error) toast.error(r.error); else toast.success(ok); });

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const small = await squareResize(file);
    const fd = new FormData();
    fd.set("photo", small);
    run(() => uploadAvatarAction(fd), "Photo updated");
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button type="button" aria-label="Change profile picture" className="group relative shrink-0 rounded-[0.875rem] outline-none focus-visible:ring-2 focus-visible:ring-ring" />}>
        <UserAvatar name={user.fullName} color={user.avatarColor} url={user.avatarUrl} className="size-[4.5rem] rounded-[0.875rem] text-2xl" />
        <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full border bg-white text-zinc-600 shadow-sm transition-transform group-hover:scale-110"><Camera className="size-3.5" /></span>
      </DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[26rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Profile picture</DialogTitle>
          <DialogDescription>Upload a photo, or pick a colour for your initials.</DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4">
          <UserAvatar name={user.fullName} color={user.avatarColor} url={user.avatarUrl} className="size-20 rounded-2xl text-3xl" />
          <div className="flex flex-col gap-2">
            <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={onFile} />
            <Button type="button" variant="outline" disabled={busy} onClick={() => fileRef.current?.click()} className="h-9 gap-2 bg-white px-3.5"><ImageUp className="size-4" />{user.avatarUrl ? "Replace photo" : "Upload photo"}</Button>
            {user.avatarUrl && <Button type="button" variant="ghost" disabled={busy} onClick={() => run(removeAvatarAction, "Photo removed")} className="h-8 justify-start gap-2 px-3 text-[0.8125rem] text-destructive hover:bg-red-50 hover:text-destructive"><Trash2 className="size-3.5" />Remove photo</Button>}
            <span className="text-xs text-muted-foreground">JPG, PNG or WebP, up to 2 MB. Squared automatically.</span>
          </div>
        </div>

        <div className="grid gap-2">
          <span className="text-sm font-medium">Colour {user.avatarUrl && <span className="font-normal text-muted-foreground">(shown when you have no photo)</span>}</span>
          <div className="flex flex-wrap gap-2.5">
            {AVATAR_COLORS.map((c) => {
              const on = current === c.bg;
              return (
                <button
                  key={c.bg} type="button" title={c.name} aria-label={c.name} aria-pressed={on} disabled={busy}
                  onClick={() => run(() => setAvatarColorAction(c.bg), "Colour saved")}
                  style={{ background: c.bg, color: c.fg }}
                  className={cn("grid size-9 place-items-center rounded-full border border-black/10 transition-transform duration-200 hover:scale-110 active:scale-95", on && "ring-2 ring-offset-2 ring-zinc-900")}
                >
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
