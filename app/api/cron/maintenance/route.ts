import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { invalidateMaintenanceStateCache } from "@/lib/maintenance-server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ message: "Maintenance automation is not configured." }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  const service = createAdminClient();
  if (!service) return NextResponse.json({ message: "Maintenance automation is not configured." }, { status: 503 });
  const { data, error } = await (service as any).rpc("process_due_maintenance_automation");
  if (error) {
    console.error("Maintenance automation failed.", { code: error.code ?? "unknown" });
    return NextResponse.json({ message: "Maintenance automation could not be processed." }, { status: 500 });
  }
  const result = data && typeof data === "object" ? data as Record<string, unknown> : {};
  const changed = result.started === true || result.ended === true || result.progress === true || result.update === true;
  if (changed) {
    invalidateMaintenanceStateCache();
    revalidatePath("/", "layout");
    revalidatePath("/maintenance");
  }
  return NextResponse.json({ processed: true, changed, result }, { headers: { "Cache-Control": "no-store" } });
}
