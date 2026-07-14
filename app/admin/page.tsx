import Link from "next/link";
import { redirect } from "next/navigation";
import { Activity, Bot, Code2, Construction, GraduationCap, ShieldCheck } from "lucide-react";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { requireAdmin } from "@/lib/maintenance-server";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin.user) redirect("/login?next=/admin");
  if (!admin.authorized || !admin.supabase) redirect("/dashboard");

  const db = admin.supabase as any;
  const { data: settings } = await db.from("site_settings").select("maintenance_enabled,updated_at").eq("id", "global").maybeSingle();
  const maintenanceEnabled = Boolean(settings?.maintenance_enabled);
  const summaries = [
    ["Site", maintenanceEnabled ? "Maintenance" : "Online", maintenanceEnabled ? "warning" : "success"],
    ["Authentication", "Connected", "success"],
    ["Personalization", "Active", "info"],
    ["Access", "Admin verified", "success"]
  ] as const;
  const futureCards = [
    { icon: Code2, label: "Editor", value: "Secure execution and Monaco integration" },
    { icon: Bot, label: "AI tutor", value: "Guided learning assistance" },
    { icon: Activity, label: "Analytics", value: "Learning and platform reporting" }
  ];

  return (
    <PageShell>
      <SectionHeader eyebrow="Administration" title="Operate LearnToCode Lab." copy="Secure controls for platform status and the administration tools that support the learning system." />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Platform status">
        {summaries.map(([label, value, tone]) => (
          <div key={label} className="surface-card p-4">
            <p className="type-caption">{label}</p>
            <p className={`mt-1 font-black ${tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-info"}`}>{value}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
        <Link href="/admin/maintenance" className="surface-panel group block transition-colors hover:border-border-strong focus-visible:outline-none">
          <div className="flex items-start justify-between gap-4">
            <span className="grid h-12 w-12 place-items-center rounded-lg bg-surface-secondary text-primary"><Construction className="h-6 w-6" aria-hidden="true" /></span>
            <span className={`rounded-full px-3 py-1 text-xs font-black ${maintenanceEnabled ? "bg-amber-100 text-amber-950" : "bg-emerald-100 text-emerald-950"}`}>{maintenanceEnabled ? "Enabled" : "Site online"}</span>
          </div>
          <h2 className="mt-5 text-2xl font-black text-foreground">Maintenance controls</h2>
          <p className="mt-2 max-w-2xl text-muted">Manage public messaging, access, progress, maintenance tasks, updates, and the live preview.</p>
          <span className="btn-primary mt-5">Open maintenance</span>
        </Link>

        <div className="surface-card">
          <ShieldCheck className="h-7 w-7 text-success" aria-hidden="true" />
          <h2 className="mt-4 text-xl font-black text-foreground">System foundation</h2>
          <p className="mt-2 text-muted">Supabase authentication and learner personalization are connected.</p>
          <div className="mt-5 grid gap-2">
            <p className="flex items-center gap-2 text-sm font-bold text-secondary"><ShieldCheck className="h-4 w-4 text-success" aria-hidden="true" />Authentication active</p>
            <p className="flex items-center gap-2 text-sm font-bold text-secondary"><GraduationCap className="h-4 w-4 text-info" aria-hidden="true" />Learning foundation active</p>
          </div>
        </div>
      </section>

      <section className="mt-8" aria-labelledby="future-tools-title">
        <h2 id="future-tools-title" className="type-section">Coming later</h2>
        <p className="mt-1 text-muted">These areas are intentionally inactive until their backend services are ready.</p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {futureCards.map(({ icon: Icon, label, value }) => (
            <div key={label} role="group" aria-disabled="true" className="rounded-lg border border-dashed border-border bg-surface-secondary p-5 text-disabled">
              <Icon className="h-6 w-6" aria-hidden="true" />
              <h3 className="mt-4 text-lg font-black">{label}</h3>
              <p className="mt-1 text-sm">{value}</p>
              <span className="mt-4 inline-block text-xs font-black">COMING LATER</span>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
