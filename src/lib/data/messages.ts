// The message channel between a company and the student it hired (migration 0017).
// Shared by both sides: the database only lets those two people read or write a conversation,
// and only once the student was accepted on a company project.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "../supabase/server";
import type { StudentProfile } from "../types";
import type { FileRef, NewFile } from "./submissions";
import { UUID } from "./shared";

export type Message = { id: string; mine: boolean; senderName: string; body: string; createdAt: string; files: FileRef[] };

export async function getMessages(user: StudentProfile, applicationId: string): Promise<Message[]> {
  if (!UUID.test(applicationId)) return [];
  const supabase = await createClient();
  const { data: rows, error } = await supabase.from("messages").select("id, sender_id, body, created_at")
    .eq("application_id", applicationId).order("created_at", { ascending: true }).limit(500);
  if (error || !rows?.length) return [];

  // Names: the student by their profile, the company by its organization name.
  const { data: app } = await supabase.from("applications").select("student_id, project_id").eq("id", applicationId).maybeSingle();
  const { data: project } = app ? await supabase.from("project_cards").select("client_id, client_name, org_name").eq("id", app.project_id).maybeSingle() : { data: null };
  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", [...new Set(rows.map((r: any) => r.sender_id))]);
  const nameOf = (id: string) => (project && id === project.client_id ? project.org_name ?? project.client_name : (profiles ?? []).find((p: any) => p.id === id)?.full_name) ?? "Folio user";

  // Files attached to these messages (table exists after migration 0020; before that there are none).
  const { data: fileRows } = await supabase.from("message_files").select("id, message_id, file_name, size_kb").in("message_id", rows.map((r: any) => r.id));
  const filesOf = (messageId: string): FileRef[] => (fileRows ?? []).filter((f: any) => f.message_id === messageId).map((f: any) => ({ id: f.id, fileName: f.file_name, sizeKb: f.size_kb }));

  return rows.map((r: any) => ({ id: r.id, mine: r.sender_id === user.id, senderName: nameOf(r.sender_id), body: r.body, createdAt: r.created_at, files: filesOf(r.id) }));
}


/** A finished (verified) project's conversation is history only. */
async function isClosed(applicationId: string): Promise<boolean> {
  const supabase = await createClient();
  const { data: app } = await supabase.from("applications").select("project_id").eq("id", applicationId).maybeSingle();
  if (!app) return false;
  const { data: project } = await supabase.from("projects").select("status").eq("id", app.project_id).maybeSingle();
  return project?.status === "verified";
}
const CLOSED = "This project is complete, so the conversation is now read-only.";

export async function sendMessage(user: StudentProfile, applicationId: string, body: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Conversation not found." };
  const text = body.trim();
  if (!text) return { error: "Write a message first." };
  if (text.length > 2000) return { error: "Keep messages under 2,000 characters." };
  if (await isClosed(applicationId)) return { error: CLOSED };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ application_id: applicationId, sender_id: user.id, body: text });
  if (!error) return {};
  if (error.code === "42501") return { error: "Messages open once the student is accepted." };
  if (error.code === "42P01" || error.code === "PGRST205") return { error: "Messages need migration 0017. Run it in the Supabase SQL Editor." };
  console.error("sendMessage", error);
  return { error: "Couldn't send. Try again." };
}

/** A message with 1 to 5 files already uploaded to the "chat-files" bucket (migration 0020). */
export async function sendMessageWithFiles(applicationId: string, body: string, files: NewFile[]): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Conversation not found." };
  if (await isClosed(applicationId)) return { error: CLOSED };
  const supabase = await createClient();
  const { error } = await supabase.rpc("send_message_with_files", {
    p_app: applicationId, p_body: body.trim(), p_files: files.map((f) => ({ path: f.path, name: f.name, size_kb: f.sizeKb })),
  });
  if (!error) return {};
  if (error.code === "P0001") return { error: error.message };
  if (error.code === "PGRST202" || error.code === "42883") return { error: "Sending files needs migration 0020. Run it in the Supabase SQL Editor." };
  console.error("sendMessageWithFiles", error);
  return { error: "Couldn't send. Try again." };
}
