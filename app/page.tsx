import Link from "next/link";
import { Code2, Compass, GraduationCap, Sparkles } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { learningPaths } from "@/lib/curriculum";

export default function HomePage() {
  return (
    <PageShell>
      <section className="grid gap-6 lg:grid-cols-[1.05fr_.95fr] lg:items-center">
        <div className="glass rounded-[2rem] p-7 md:p-10">
          <p className="mb-3 text-xs font-black uppercase text-amber-700">Mistakes are the lesson</p>
          <h1 className="max-w-4xl text-5xl font-black leading-none tracking-tight text-lab-navy md:text-7xl">Learn coding through lessons built around you.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            LearnToCode Lab adapts to what you know, what you struggle with, and what you want to build. Start with a pathway, prove mastery, then build real projects.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/auth/create-account" className="rounded-2xl bg-gradient-to-r from-lab-teal to-lab-blue px-5 py-4 font-black text-lab-navy">Start Learning Free</Link>
            <Link href="/practice" className="rounded-2xl border border-slate-200 bg-white px-5 py-4 font-black text-lab-navy">Try the Coding Lab</Link>
          </div>
        </div>
        <div className="dark-panel rounded-[2rem] p-5 shadow-lab">
          <div className="rounded-2xl bg-[#0c1725] p-4">
            <div className="mb-4 flex gap-2"><span className="h-3 w-3 rounded-full bg-red-400" /><span className="h-3 w-3 rounded-full bg-yellow-300" /><span className="h-3 w-3 rounded-full bg-lab-teal" /></div>
            <pre className="overflow-auto whitespace-pre-wrap text-sm leading-7 text-teal-50">{`function win(score) {
  if (score = 50) {
    return "level complete";
  }
}

Feedback:
Use === to compare values.
= changes the score instead.`}</pre>
          </div>
          <div className="mt-4 rounded-2xl bg-white/8 p-4">
            <p className="font-black text-white">Interactive feedback preview</p>
            <p className="mt-2 text-sm leading-6 text-slate-300">The platform explains what happened, why it happened, and how to investigate it before revealing the full answer.</p>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 md:grid-cols-4">
        {[
          ["Tell us your goals", Compass],
          ["Receive a pathway", Sparkles],
          ["Practice with feedback", Code2],
          ["Build real projects", GraduationCap]
        ].map(([label, Icon], index) => (
          <div key={String(label)} className="glass rounded-3xl p-5">
            <Icon className="h-7 w-7 text-lab-blue" />
            <p className="mt-8 text-sm font-black text-lab-blue">0{index + 1}</p>
            <h2 className="mt-2 text-xl font-black text-lab-navy">{String(label)}</h2>
          </div>
        ))}
      </section>

      <section className="mt-8 glass rounded-[2rem] p-7">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase text-amber-700">First release paths</p>
            <h2 className="mt-2 text-3xl font-black text-lab-navy">Seven deep learning paths</h2>
          </div>
          <Link href="/learn" className="rounded-xl bg-lab-navy px-4 py-3 font-black text-white">Explore languages</Link>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {learningPaths.map((path) => (
            <Link key={path.slug} href={`/learn/${path.slug}`} className="rounded-2xl border border-slate-200 bg-white p-4">
              <div className={`mb-5 h-2 rounded-full bg-gradient-to-r ${path.color}`} />
              <h3 className="text-xl font-black text-lab-navy">{path.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">{path.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </PageShell>
  );
}
