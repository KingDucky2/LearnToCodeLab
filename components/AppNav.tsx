import { isAdminRole } from "@/lib/maintenance";
import { resolveAccountIdentity } from "@/lib/identity";
import { getCurrentUserRole } from "@/lib/maintenance-server";
import { AppNavClient } from "@/components/AppNavClient";

export async function AppNav() {
  const { user, profile, role } = await getCurrentUserRole();
  return <AppNavClient user={user ? { identity: resolveAccountIdentity(user, profile), isAdmin: isAdminRole(role), role: role ?? "learner" } : null} />;
}
