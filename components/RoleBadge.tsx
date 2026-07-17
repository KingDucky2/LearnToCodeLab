import { getRoleBadgeLabel } from "@/lib/roles";

export function RoleBadge({ role }: { role: string | null | undefined }) {
  const label = getRoleBadgeLabel(role);
  return label ? <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-xs font-black text-blue-900">{label}</span> : null;
}
