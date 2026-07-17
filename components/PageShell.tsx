import type { ReactNode } from "react";

export function PageShell({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return <main className={`page-shell mx-auto py-7 sm:py-10 ${narrow ? "w-[min(720px,calc(100%_-_24px))]" : "w-[min(1180px,calc(100%_-_24px))]"}`}>{children}</main>;
}

export function SectionHeader({ eyebrow, title, copy }: { eyebrow: string; title: string; copy?: string }) {
  return (
    <div className="mb-7 max-w-3xl">
      <p className="mb-2 text-sm font-extrabold text-warning">{eyebrow}</p>
      <h1 className="type-page">{title}</h1>
      {copy ? <p className="mt-3 max-w-[68ch] text-base leading-7 text-muted sm:text-lg">{copy}</p> : null}
    </div>
  );
}
