// The message channel between a company and the student it hired (migration 0017).
// Shared by both sides: the database only lets those two people read or write a conversation,
// and only once the student was accepted on a company project.
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "../supabase/server";
import type { StudentProfile } from "../types";
import { UUID } from "./shared";

export type Message = { id: string; mine: boolean; senderName: string; body: string; createdAt: string };

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

  return rows.map((r: any) => ({ id: r.id, mine: r.sender_id === user.id, senderName: nameOf(r.sender_id), body: r.body, createdAt: r.created_at }));
}

export async function sendMessage(user: StudentProfile, applicationId: string, body: string): Promise<{ error?: string }> {
  if (!UUID.test(applicationId)) return { error: "Conversation not found." };
  const text = body.trim();
  if (!text) return { error: "Write a message first." };
  if (text.length > 2000) return { error: "Keep messages under 2,000 characters." };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({ application_id: applicationId, sender_id: user.id, body: text });
  if (!error) return {};
  if (error.code === "42501") return { error: "Messages open once the student is accepted." };
  if (error.code === "42P01" || error.code === "PGRST205") return { error: "Messages need migration 0017. Run it in the Supabase SQL Editor." };
  console.error("sendMessage", error);
  return { error: "Couldn't send. Try again." };
}
