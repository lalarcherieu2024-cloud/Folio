import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getApplicantCvUrl } from "@/lib/data/startup";

// "Open CV": sends the company to a 5-minute signed link for the applicant's CV.
export async function GET(request: Request, ctx: RouteContext<"/company/applicants/[id]/cv">) {
  const { id } = await ctx.params;
  const user = await getSession();
  if (!user || user.role !== "company") return NextResponse.redirect(new URL("/company/signin", request.url));
  const url = await getApplicantCvUrl(user, id);
  if (!url) return new NextResponse("This CV isn't available. If you're the developer, check that the Student-view migrations (0009) were run.", { status: 404 });
  return NextResponse.redirect(url);
}
