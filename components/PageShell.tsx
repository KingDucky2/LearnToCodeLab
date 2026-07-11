import type { ReactNode } from "react";

export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <main className={`mx-auto py-8 ${narrow ? "w-[min(920px,calc(100%_-_24px))]" : "w-[min(1180px,calc(100%_-_24px))]"}`}>{children}</main>;
}

export function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-6 max-w-3xl">
      <p className="mb-2 text-xs font-black uppercase text-amber-700">{eyebrow}</p>
      <h1 className="text-4xl font-black leading-none tracking-tight text-lab-navy md:text-6xl">{title}</h1>
      {copy ? <p className="mt-4 text-lg leading-8 text-slate-600">{copy}</p> : null}
    </div>
  );
}
