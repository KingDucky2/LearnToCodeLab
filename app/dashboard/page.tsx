import Link from "next/link";
import { redirect } from "next/navigation";
import { PageShell, SectionHeader } from "@/components/PageShell";
import { learningPaths } from "@/lib/curriculum";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  if (!supabase) redirect("/login?next=/dashboard");
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/dashboard");

  const focus = learningPaths.slice(0, 3);
  return (
    <PageShell>
      <SectionHeader eyebrow="Dashboard" title="Continue your path." copy="The dashboard answers what to do next, how you are improving, and what you are working toward." />
      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <div className="glass rounded-[2rem] p-7">
          <p className="text-xs font-black uppercase text-amber-700">Continue learning</p>
          <h2 className="mt-2 text-4xl font-black text-lab-navy">JavaScript DOM: events and state</h2>
          <p className="mt-4 max-w-2xl text-slate-600">Recommended because interactive websites match your goals and DOM selection mistakes are common in early attempts.</p>
          <Link href="/learn/javascript/dom-events" className="mt-6 inline-flex rounded-2xl bg-gradient-to-r from-lab-teal to-lab-blue px-5 py-4 font-black text-lab-navy">Continue lesson</Link>
        </div>
        <div className="glass rounded-[2rem] p-7">
          <p className="text-xs font-black uppercase text-amber-700">Weekly progress</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {["3 lessons", "71% avg", "2 projects", "4-day streak"].map((stat) => (
              <div key={stat} className="rounded-2xl bg-white p-4 text-xl font-black text-lab-navy">{stat}</div>
            ))}
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-4 md:grid-cols-3">
        {focus.map((path) => (
          <Link key={path.slug} href={`/learn/${path.slug}`} className="glass rounded-3xl p-5">
            <p className="text-xs font-black uppercase text-lab-blue">Skill focus</p>
            <h3 className="mt-3 text-2xl font-black text-lab-navy">{path.title}</h3>
            <p className="mt-2 text-slate-600">{path.buildGoal}</p>
          </Link>
        ))}
      </section>
    </PageShell>
  );
}
