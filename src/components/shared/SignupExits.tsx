"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { signOutAction, startOverAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

// The ways out of an unfinished sign-up (see getUnfinishedSignup): sign out, or delete it and start from scratch.

const roleName = (r: Role) => (r === "company" ? "company" : "student");

/** Deletes the unfinished account after a confirm step, then opens a fresh sign-up as `to`. */
export function StartOverButton({ email, to, className, children }: { email: string; to: Role; className?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  // On success the action redirects to the new sign-up; it only returns when something went wrong.
  const go = () => start(async () => {
    const r = await startOverAction(to);
    if (r?.error) toast.error(r.error);
  });
  return (
    <Dialog open={open} onOpenChange={(o) => { if (!busy) setOpen(o); }}>
      <DialogTrigger render={<button type="button" className={className} />}>{children}</DialogTrigger>
      <DialogContent className="p-6 sm:max-w-[26rem]">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">Start from scratch?</DialogTitle>
          <DialogDescription>
            This deletes your unfinished account for <span className="font-medium text-foreground">{email}</span>, then opens a new {roleName(to)} sign-up. You can use the same email again.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-end">
          <Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)}>Keep it</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={go}>{busy ? "Deleting…" : "Delete and start over"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SignOutButton({ className, children = "Sign out" }: { className?: string; children?: React.ReactNode }) {
  return <form action={signOutAction} className="contents"><button type="submit" className={className}>{children}</button></form>;
}

export type SignupAccount = { email: string; role: Role; canStartOver: boolean };

/** Bottom of the sign-up frame's side panel while setting up: who's signed in, and every way out. */
export function AccountStrip({ account }: { account: SignupAccount }) {
  const other: Role = account.role === "company" ? "student" : "company";
  const link = "underline-offset-4 hover:text-foreground hover:underline";
  return (
    <div className="mt-auto flex flex-col gap-2 border-t border-brand/10 pt-5 text-[0.8125rem] text-muted-foreground">
      <span>Signed in as <span className="font-medium text-foreground">{account.email}</span></span>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <SignOutButton className={link} />
        {account.canStartOver && <StartOverButton email={account.email} to={account.role} className={link}>Start from scratch</StartOverButton>}
        <Link href={other === "company" ? "/company/signup" : "/signup"} className={cn(link)}>I&apos;m a {other} instead</Link>
      </div>
    </div>
  );
}
