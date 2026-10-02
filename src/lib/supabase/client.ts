import { createBrowserClient } from "@supabase/ssr";

// Browser-side Supabase client. Only used for flows that must start in the browser (OAuth linking).
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
}
