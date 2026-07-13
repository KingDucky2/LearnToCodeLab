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
  const cards = [
    { icon: Construction, label: "Maintenance", value: settings?.maintenance_enabled ? "Enabled" : "Site online", href: "/admin/maintenance", live: true },
    { icon: ShieldCheck, label: "Authentication", value: "Supabase connected", live: true },
    { icon: GraduationCap, label: "Personalization", value: "Foundation active", live: true },
    { icon: Code2, label: "Editor", value: "Planned", live: false },
    { icon: Bot, label: "AI tutor", value: "Planned", live: false },
    { icon: Activity, label: "Analytics", value: "Placeholder", live: false }
  ];
  return <PageShell><SectionHeader eyebrow="Administration" title="Operate LearnToCode Lab." copy="Secure controls for maintenance, platform status, and the administration tools that will grow with the learning system." /><section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{cards.map((card) => { const Icon = card.icon; const content = <><div className="flex items-center justify-between"><Icon className="h-6 w-6 text-lab-blue" /><span className={`text-xs font-black uppercase ${card.live ? "text-emerald-700" : "text-slate-500"}`}>{card.live ? "Live" : "Coming later"}</span></div><h2 className="mt-5 text-xl font-black text-lab-navy">{card.label}</h2><p className="mt-1 text-slate-600">{card.value}</p></>; return card.href ? <Link key={card.label} href={card.href} className="rounded-lg border border-slate-200 bg-white p-5 shadow-lab focus:outline-none focus:ring-4 focus:ring-lab-blue/30">{content}</Link> : <article key={card.label} className="rounded-lg border border-slate-200 bg-white p-5">{content}</article>; })}</section><nav className="mt-8 flex flex-wrap gap-2" aria-label="Future administration sections">{["Users", "Lessons", "Announcements", "Analytics", "Site Settings"].map((item) => <span key={item} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-500">{item}</span>)}</nav></PageShell>;
}
