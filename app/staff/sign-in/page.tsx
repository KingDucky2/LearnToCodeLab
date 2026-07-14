import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";
import { PageShell } from "@/components/PageShell";
import { sanitizeAdminReturnPath } from "@/lib/auth-utils";
import { isAdminRole } from "@/lib/maintenance";
import { getCurrentUserRole } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export default async function StaffSignInPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const [{ next }, session] = await Promise.all([searchParams, getCurrentUserRole()]);
  const safeNext = sanitizeAdminReturnPath(next);
  if (session.user && isAdminRole(session.role)) redirect(safeNext);

  return (
    <PageShell narrow>
      <Suspense fallback={<div className="surface-panel font-black text-foreground">Loading staff sign in...</div>}>
        <LoginForm mode="staff" />
      </Suspense>
    </PageShell>
  );
}
