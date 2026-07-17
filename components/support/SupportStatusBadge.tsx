import { formatSupportStatus } from "@/lib/support";

const tones: Record<string, string> = {
  open: "bg-red-100 text-red-800",
  in_progress: "bg-blue-100 text-blue-800",
  waiting_on_user: "bg-amber-100 text-amber-900",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-slate-200 text-slate-700"
};

export function SupportStatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-black ${tones[status] ?? "bg-surface-secondary text-foreground"}`}>{formatSupportStatus(status)}</span>;
}
