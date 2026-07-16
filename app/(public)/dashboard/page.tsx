import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { AccountAvatar } from "@/components/AccountAvatar";
import { learningPaths } from "@/lib/curriculum";
import { resolveAccountIdentity } from "@/lib/identity";
import { getCurrentUserRole } from "@/lib/maintenance-server";

export default async function DashboardPage() {
  const session = await getCurrentUserRole();
  if (!session.user) redirect("/login?next=/dashboard");
  const identity = resolveAccountIdentity(session.user, session.profile);

  const focus = learningPaths.slice(0, 3);
  return (
    <PageShell>
      <SectionHeader eyebrow="Dashboard" title="Continue your path." copy="The dashboard answers what to do next, how you are improving, and what you are working toward." />
      <div className="mb-5 flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3"><AccountAvatar identity={identity} decorative /><p className="min-w-0"><span className="block truncate font-black text-foreground">{identity.label}</span><span className="block truncate text-sm text-subtle">{identity.email}</span></p></div>
      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="surface-panel">
          <p className="text-sm font-extrabold text-warning">Continue learning</p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-foreground sm:text-3xl">JavaScript DOM: events and state</h2>
          <p className="mt-4 max-w-2xl text-muted">Recommended because interactive websites match your goals and DOM selection mistakes are common in early attempts.</p>
          <Link href="/learn/javascript/dom-events" className="btn-primary mt-6">Continue lesson</Link>
        </div>
        <div className="surface-card">
          <p className="text-sm font-extrabold text-warning">Weekly progress</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["3 lessons", "71% avg", "2 projects", "4-day streak"].map((stat) => (
              <div key={stat} className="rounded-lg border border-border bg-surface-secondary p-4 text-lg font-black text-foreground">{stat}</div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {focus.map((path) => (
          <Link key={path.slug} href={`/learn/${path.slug}`} className="surface-card transition-colors hover:border-border-strong focus-visible:outline-none">
            <p className="text-xs font-black uppercase text-primary">Skill focus</p>
            <h3 className="mt-3 text-2xl font-black text-foreground">{path.title}</h3>
            <p className="mt-2 text-muted">{path.buildGoal}</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
