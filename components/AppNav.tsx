import { createClient } from "@/lib/supabase/server";
import { isAdminRole } from "@/lib/maintenance";
import { AppNavClient } from "@/components/AppNavClient";

export async function AppNav() {
  const supabase = await createClient();
  const {
    data: { user }
  } = (await supabase?.auth.getUser()) ?? { data: { user: null } };
  const db = supabase as any;
  const { data: profile } = user && supabase ? await db.from("profiles").select("display_name, avatar_url, role").eq("id", user.id).maybeSingle() : { data: null };
  const avatar = profile?.avatar_url;
  const label = profile?.display_name || user?.email || "Account";

  return <AppNavClient user={user ? { label, avatar: avatar ?? null, isAdmin: isAdminRole(profile?.role) } : null} />;
}
