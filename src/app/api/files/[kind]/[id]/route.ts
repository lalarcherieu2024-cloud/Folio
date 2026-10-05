import { inlineType } from "@/lib/files";
import { UUID } from "@/lib/data/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

// Serves brief files and submission files. Nobody gets a storage link: this route checks who is asking
// (through row-level security) and then streams the file.
//
//  - brief files:      the client may open and download them. A student can only PREVIEW them: the browser must be
//                      embedding the file (iframe / image), never opening or saving it directly.
//  - submission files: the student who sent them and the project's client may open and download them.
//  - chat files:       the two people in the conversation may open and download them.
//
// "Preview only" stops the app's own download buttons and casual saving. It can't stop a screenshot, and a
// determined person with developer tools can still copy what their browser has displayed.
const EMBEDDED = new Set(["iframe", "image", "embed", "object"]);

export async function GET(request: Request, { params }: { params: Promise<{ kind: string; id: string }> }) {
  const { kind, id } = await params;
  if (!UUID.test(id) || (kind !== "brief" && kind !== "submission" && kind !== "chat")) return new Response("Not found", { status: 404 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Sign in first", { status: 401 });

  let path: string, name: string, bucket: string, previewOnly = false;
  if (kind === "brief") {
    const { data } = await supabase.from("project_files").select("path, file_name, project_id").eq("id", id).maybeSingle(); // RLS: client or accepted student
    if (!data) return new Response("Not found", { status: 404 });
    const { data: own } = await supabase.from("projects").select("id").eq("id", data.project_id).eq("client_id", user.id).maybeSingle();
    path = data.path; name = data.file_name; bucket = "project-files"; previewOnly = !own;
  } else if (kind === "chat") {
    const { data } = await supabase.from("message_files").select("path, file_name").eq("id", id).maybeSingle(); // RLS: the two participants
    if (!data) return new Response("Not found", { status: 404 });
    path = data.path; name = data.file_name; bucket = "chat-files";
  } else {
    const { data } = await supabase.from("submission_files").select("path, file_name").eq("id", id).maybeSingle(); // RLS: student or client
    if (!data) return new Response("Not found", { status: 404 });
    path = data.path; name = data.file_name; bucket = "submissions";
  }

  const url = new URL(request.url);
  const wantsDownload = url.searchParams.get("download") === "1";
  if (previewOnly && (wantsDownload || !EMBEDDED.has(request.headers.get("sec-fetch-dest") ?? ""))) {
    return new Response("This file can only be previewed inside Folio.", { status: 403 });
  }

  const { data: blob, error } = await createAdminClient().storage.from(bucket).download(path);
  if (error || !blob) return new Response("File not found", { status: 404 });

  // Type comes from the file name against an allow-list, never from what the uploader claimed.
  const safeType = inlineType(name);
  const inline = !!safeType && !wantsDownload;
  return new Response(blob, {
    headers: {
      "Content-Type": safeType ?? "application/octet-stream",
      "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
      "Cross-Origin-Resource-Policy": "same-origin",
    },
  });
}
