import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
export { createClient as createClientSideSupabase, hasSupabaseEnv } from "@/lib/supabase/browser";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export function createServerSupabase() {
  if (!supabaseUrl || !supabasePublishableKey) {
    return null;
  }

  return createClient<Database>(supabaseUrl, supabasePublishableKey, {
    auth: {
      persistSession: false
    }
  });
}
