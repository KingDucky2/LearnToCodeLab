import { AccountAvatar } from "@/components/AccountAvatar";
import { LocalTime } from "@/components/LocalTime";
import type { AccountIdentity } from "@/lib/identity";

export function SupportMessageCard({ body, createdAt, identity, staff = false }: { body: string; createdAt: string; identity: AccountIdentity; staff?: boolean }) {
  return <article className={`rounded-xl border p-4 shadow-sm ${staff ? "border-blue-200 bg-blue-50 text-slate-950" : "border-border bg-surface-secondary"}`}>
    <header className="flex items-center gap-3">
      <AccountAvatar identity={identity} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black">{staff ? "LearnToCodeLab Staff" : identity.label}</p>
        <LocalTime value={createdAt} className="text-xs text-muted" />
      </div>
    </header>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-6">{body}</p>
  </article>;
}
