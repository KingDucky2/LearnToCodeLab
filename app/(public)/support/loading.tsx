import { PageShell } from "@/components/PageShell";

export default function SupportLoading() {
  return <PageShell narrow><div className="surface-panel animate-pulse" aria-label="Loading support"><div className="h-8 w-1/2 rounded bg-surface-secondary" /><div className="mt-5 h-28 rounded bg-surface-secondary" /></div></PageShell>;
}
