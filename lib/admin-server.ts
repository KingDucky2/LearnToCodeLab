import "server-only";
import { cache } from "react";
import { requireAdmin } from "@/lib/maintenance-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const getAdminContext = cache(async function getAdminContext() {
  const session = await requireAdmin();
  return { ...session, service: session.authorized ? createAdminClient() : null };
});

export async function writeAdminAudit(input: {
  service: NonNullable<ReturnType<typeof createAdminClient>>;
  actorId: string;
  actorRole: string;
  action: string;
  targetType: string;
  targetId?: string | null;
  summary: string;
  result: "success" | "denied" | "failed";
  correlationId?: string;
}) {
  const db = input.service as any;
  const { error } = await db.from("admin_audit_log").insert({
    actor_id: input.actorId,
    actor_role: input.actorRole,
    action: input.action.slice(0, 100),
    target_type: input.targetType.slice(0, 50),
    target_id: input.targetId?.slice(0, 200) || null,
    summary: input.summary.slice(0, 500),
    result: input.result,
    correlation_id: input.correlationId
  });
  if (error) console.error("Admin audit event could not be recorded", { action: input.action, result: input.result });
}
