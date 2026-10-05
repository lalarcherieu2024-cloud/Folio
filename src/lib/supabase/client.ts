import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Only used for things that must happen in the browser:
// OAuth linking and live chat updates (Realtime).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
