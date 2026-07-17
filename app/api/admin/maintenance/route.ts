import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { clampProgress, isMaintenanceTaskStatus, type MaintenanceSettings, type MaintenanceTask, type MaintenanceUpdate } from "@/lib/maintenance";
import { invalidateMaintenanceStateCache, requireAdmin } from "@/lib/maintenance-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAdminAudit } from "@/lib/admin-server";

type Payload = { settings?: Partial<MaintenanceSettings>; tasks?: MaintenanceTask[]; updates?: MaintenanceUpdate[] };
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function PUT(request: Request) {
  const admin = await requireAdmin();
  if (!admin.user || !admin.supabase) return NextResponse.json({ message: "Sign in to continue." }, { status: 401 });
  if (!admin.authorized) return NextResponse.json({ message: "Administrator access is required." }, { status: 403 });

  const payload = (await request.json().catch(() => null)) as Payload | null;
  if (!payload?.settings || !Array.isArray(payload.tasks) || !Array.isArray(payload.updates)) return NextResponse.json({ message: "Invalid maintenance configuration." }, { status: 400 });
  if (!String(payload.settings.maintenance_title ?? "").trim() || !String(payload.settings.maintenance_message ?? "").trim()) return NextResponse.json({ message: "A public title and message are required." }, { status: 400 });
  if (payload.tasks.length > 50 || payload.updates.length > 50) return NextResponse.json({ message: "Maintenance lists cannot contain more than 50 items." }, { status: 400 });
  if (payload.tasks.some((task) => !uuidPattern.test(task.id)) || payload.updates.some((update) => !uuidPattern.test(update.id))) return NextResponse.json({ message: "Invalid maintenance item identifier." }, { status: 400 });
  if (payload.tasks.some((task) => !task.title.trim() || !isMaintenanceTaskStatus(task.status))) return NextResponse.json({ message: "Every task needs a valid title and status." }, { status: 400 });
  if (payload.updates.some((update) => !update.title.trim() || !update.message.trim())) return NextResponse.json({ message: "Every update needs a title and message." }, { status: 400 });
  const contactEmail = String(payload.settings.contact_email ?? "").trim();
  if (contactEmail && !emailPattern.test(contactEmail)) return NextResponse.json({ message: "Enter a valid support email address." }, { status: 400 });
  const estimatedReturn = payload.settings.estimated_return_at;
  if (estimatedReturn && !Number.isFinite(Date.parse(estimatedReturn))) return NextResponse.json({ message: "Enter a valid estimated return time." }, { status: 400 });
  const scheduledStart = payload.settings.scheduled_start_at;
  const scheduledEnd = payload.settings.scheduled_end_at;
  if (scheduledStart && !Number.isFinite(Date.parse(scheduledStart))) return NextResponse.json({ message: "Enter a valid automatic start time." }, { status: 400 });
  if (scheduledEnd && !Number.isFinite(Date.parse(scheduledEnd))) return NextResponse.json({ message: "Enter a valid automatic end time." }, { status: 400 });
  if (scheduledEnd && Date.parse(scheduledEnd) <= Date.now()) return NextResponse.json({ message: "Automatic end must be in the future." }, { status: 400 });
  if (scheduledStart && scheduledEnd && Date.parse(scheduledEnd) <= Date.parse(scheduledStart)) return NextResponse.json({ message: "Automatic end must be later than automatic start." }, { status: 400 });
  if ((payload.settings.automatic_progress || payload.settings.automatic_updates) && (!scheduledStart || !scheduledEnd)) return NextResponse.json({ message: "Automatic progress and updates require both a scheduled start and end." }, { status: 400 });

  const settings = payload.settings;
  const db = admin.supabase as any;
  const normalizedSettings = {
    maintenance_enabled: Boolean(settings.maintenance_enabled),
    maintenance_title: String(settings.maintenance_title ?? "").trim().slice(0, 180),
    maintenance_message: String(settings.maintenance_message ?? "").trim().slice(0, 2000),
    maintenance_status: String(settings.maintenance_status ?? "upgrading").trim().slice(0, 80),
    maintenance_badge_text: String(settings.maintenance_badge_text ?? "Maintenance").trim().slice(0, 80),
    estimated_return_at: estimatedReturn || null,
    show_countdown: Boolean(settings.show_countdown),
    show_progress: Boolean(settings.show_progress),
    progress_percent: clampProgress(Number(settings.progress_percent)),
    allow_admin_bypass: Boolean(settings.allow_admin_bypass),
    allow_authenticated_users: Boolean(settings.allow_authenticated_users),
    allow_login_during_maintenance: Boolean(settings.allow_login_during_maintenance),
    show_personalized_message: Boolean(settings.show_personalized_message),
    show_saved_progress_message: Boolean(settings.show_saved_progress_message),
    auto_refresh_enabled: Boolean(settings.auto_refresh_enabled),
    auto_refresh_interval_seconds: Math.min(3600, Math.max(15, Number(settings.auto_refresh_interval_seconds) || 60)),
    support_message: String(settings.support_message ?? "").trim().slice(0, 500) || null,
    contact_email: contactEmail.slice(0, 254) || null,
    preset_key: String(settings.preset_key ?? "custom").trim().slice(0, 80),
    scheduled_start_at: scheduledStart || null,
    scheduled_end_at: scheduledEnd || null,
    schedule_event_id: settings.schedule_event_id || randomUUID(),
    automatic_progress: Boolean(settings.automatic_progress),
    automatic_messages: Boolean(settings.automatic_messages),
    automatic_updates: Boolean(settings.automatic_updates),
  };
  const normalizedTasks = payload.tasks.map((task, index) => ({
      id: task.id,
      title: task.title.trim().slice(0, 120),
      description: task.description?.trim().slice(0, 500) || null,
      status: task.status,
      progress_percent: task.progress_percent === null ? null : clampProgress(Number(task.progress_percent)),
      display_order: index * 10,
      visible: task.visible
    }));
  const normalizedUpdates = payload.updates.map((update) => ({ id: update.id, title: update.title.trim().slice(0, 120), message: update.message.trim().slice(0, 1000), published_at: update.published_at, visible: update.visible }));
  const { error: saveError } = await db.rpc("save_maintenance_configuration_v2", {
    settings_payload: normalizedSettings,
    tasks_payload: normalizedTasks,
    updates_payload: normalizedUpdates
  });
  if (saveError) {
    console.error("Maintenance configuration transaction failed.", { code: saveError.code ?? "unknown" });
    const migrationMissing = ["42703", "42883", "PGRST202"].includes(saveError.code);
    return NextResponse.json({ message: migrationMissing ? "Maintenance automation is not configured. Apply the latest Supabase migration before publishing." : saveError.code === "42501" ? "You do not have permission to change maintenance settings." : "The database rejected the maintenance update. No changes were published." }, { status: migrationMissing ? 503 : saveError.code === "42501" ? 403 : 500 });
  }

  const auditClient = createAdminClient();
  if (auditClient) await writeAdminAudit({ service: auditClient, actorId: admin.user.id, actorRole: admin.role || "unknown", action: "maintenance.configuration", targetType: "site", targetId: "global", summary: normalizedSettings.maintenance_enabled ? "Maintenance configuration saved with maintenance enabled." : "Maintenance configuration saved with the site online.", result: "success" });

  invalidateMaintenanceStateCache();
  revalidatePath("/", "layout");
  revalidatePath("/maintenance");
  revalidatePath("/admin/maintenance");
  return NextResponse.json({ message: "Maintenance controls saved." }, { headers: { "Cache-Control": "no-store" } });
}
