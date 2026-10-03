"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

/** Shows the "Project posted" toast once after publishing, then drops ?posted=1 from the URL. */
export function PostedToast() {
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    toast("Project posted", { description: "Students can now see and apply." });
    router.replace(path, { scroll: false });
  }, [router, path]);
  return null;
}
