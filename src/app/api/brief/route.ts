import Anthropic from "@anthropic-ai/sdk";
import { getSession } from "@/lib/auth";
import { draftBrief } from "@/lib/brief";

export async function POST(req: Request) {
  if (!(await getSession())) return Response.json({ error: "Sign in to use the brief builder." }, { status: 401 });

  let idea = "";
  try {
    idea = String((await req.json()).idea ?? "").trim();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  if (idea.length < 15) return Response.json({ error: "Describe your idea in a sentence or two first." }, { status: 400 });
  if (idea.length > 2000) return Response.json({ error: "Please keep your idea under 2000 characters." }, { status: 400 });

  try {
    return Response.json(await draftBrief(idea));
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return Response.json({ error: "Busy right now, try again in a minute." }, { status: 429 });
    if (err instanceof Anthropic.APIError) {
      console.error("brief: Anthropic API error", err.status, err.message);
      return Response.json({ error: "The assistant is unavailable. You can fill the brief in manually." }, { status: 502 });
    }
    return Response.json({ error: err instanceof Error ? err.message : "Something went wrong." }, { status: 500 });
  }
}
