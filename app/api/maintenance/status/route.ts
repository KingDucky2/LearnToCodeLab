import { NextResponse } from "next/server";
import { getPublicMaintenanceState } from "@/lib/maintenance-server";

export async function GET() {
  const state = await getPublicMaintenanceState({ forceRefresh: true });
  return NextResponse.json({ enabled: state.settings.maintenance_enabled, emergency: state.emergency, available: state.available }, { headers: { "Cache-Control": "no-store" } });
}
