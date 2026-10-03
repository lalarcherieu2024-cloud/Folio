import { createClient } from "../supabase/server";
import type { Notification, StudentProfile } from "../types";

export async function getNotifications(user: StudentProfile): Promise<{ items: Notification[]; unread: number }> {
  const supabase = await createClient();
  const [{ data }, { count }] = await Promise.all([
    supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(10),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).is("read_at", null),
  ]);
  return {
    items: (data ?? []).map((n) => ({ id: n.id, kind: n.kind, title: n.title, body: n.body, link: n.link, read: !!n.read_at, createdAt: n.created_at })),
    unread: count ?? 0,
  };
}

export async function markAllRead(user: StudentProfile) {
  const supabase = await createClient();
  await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id).is("read_at", null);
}
