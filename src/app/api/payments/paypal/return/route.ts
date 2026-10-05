import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { completeFunding } from "@/lib/data/payments";

// PayPal sends the company back here after they approved the payment (?token=<order id>&escrow=<our id>).
export async function GET(request: Request) {
  const url = new URL(request.url);
  const escrowId = url.searchParams.get("escrow") ?? "", orderId = url.searchParams.get("token") ?? "";
  const user = await getSession();
  if (!user || user.role !== "company") return NextResponse.redirect(new URL(`/company/signin?next=${encodeURIComponent(url.pathname + url.search)}`, url.origin));

  const res = await completeFunding(user, escrowId, orderId);
  if (res.projectId) return NextResponse.redirect(new URL(`/company/projects/${res.projectId}?paid=1`, url.origin));

  // Failed: send them back to the payment page for this project, with the reason.
  const { createClient } = await import("@/lib/supabase/server");
  const { data } = await (await createClient()).from("escrows").select("project_id").eq("id", escrowId).maybeSingle();
  const back = data ? `/company/projects/${data.project_id}/pay` : "/company/projects";
  return NextResponse.redirect(new URL(`${back}?error=${encodeURIComponent(res.error ?? "The payment didn't go through.")}`, url.origin));
}
