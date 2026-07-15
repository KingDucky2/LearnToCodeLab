import { isAdminRole } from "@/lib/maintenance";
import { getCurrentUserRole } from "@/lib/maintenance-server";
import { AppNavClient } from "@/components/AppNavClient";

export async function AppNav() {
  const { user, profile, role } = await getCurrentUserRole();
  const avatar = profile?.avatar_url;
  const label = profile?.display_name || user?.email || "Account";

  return <AppNavClient user={user ? { label, avatar: avatar ?? null, isAdmin: isAdminRole(role) } : null} />;
}
