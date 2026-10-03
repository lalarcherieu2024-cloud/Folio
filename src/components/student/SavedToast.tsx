"use client";

import { useEffect } from "react";
import { toast } from "sonner";

export function SavedToast({ notified }: { notified: number }) {
  useEffect(() => {
    toast.success("Changes saved", { description: notified > 0 ? `${notified} applicant${notified === 1 ? " was" : "s were"} notified.` : undefined });
  }, [notified]);
  return null;
}
