"use client";

import Link from "next/link";
import { SlidersHorizontal, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useAdminInterfaceMode } from "@/components/admin/AdminShell";
import { formatSupportCategory, formatSupportStatus, supportCategories, supportStatuses } from "@/lib/support";

const rememberedFields = ["q", "status", "sort", "category", "priority", "assigned", "archive"] as const;

type FilterValues = Record<(typeof rememberedFields)[number], string>;
type StaffOption = { id: string; label: string };

export function SupportQueueFilters({ values, staff, adminId }: { values: FilterValues; staff: StaffOption[]; adminId: string }) {
  const router = useRouter();
  const { isAdvanced } = useAdminInterfaceMode();
  const restored = useRef(false);
  const storageKey = `ltcl:admin-support-filters:${adminId}`;
  const advancedActive = values.category !== "all" || values.priority !== "all" || values.assigned !== "all" || values.archive !== "active";

  useEffect(() => {
    if (restored.current) return;
    restored.current = true;
    const current = new URLSearchParams(window.location.search);
    if (rememberedFields.some((field) => current.has(field))) return;
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null") as Partial<FilterValues> | null;
      if (!saved) return;
      const next = new URLSearchParams();
      for (const field of rememberedFields) {
        const value = saved[field];
        if (typeof value === "string" && value) next.set(field, value);
      }
      if (next.size) router.replace(`/admin/support?${next}`);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }, [router, storageKey]);

  function remember(form: HTMLFormElement) {
    const data = new FormData(form);
    const saved = Object.fromEntries(rememberedFields.map((field) => [field, String(data.get(field) ?? "")])) as FilterValues;
    try {
      localStorage.setItem(storageKey, JSON.stringify(saved));
    } catch {
      // Filtering still works when browser storage is unavailable.
    }
  }

  function forget() {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // The link still resets the server-rendered queue.
    }
  }

  return (
    <form action="/admin/support" className="grid gap-4" onSubmit={(event) => remember(event.currentTarget)}>
      <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_180px_auto]">
        <label className="form-label">Search<input className="form-control" name="q" defaultValue={values.q} placeholder="Subject, ticket #, name, or email" /></label>
        <label className="form-label">Status<select className="form-control" name="status" defaultValue={values.status}><option value="all">All statuses</option>{supportStatuses.map((item) => <option key={item} value={item}>{formatSupportStatus(item)}</option>)}</select></label>
        <label className="form-label">Sort<select className="form-control" name="sort" defaultValue={values.sort}><option value="recent">Newest activity</option><option value="oldest">Oldest activity</option></select></label>
        <button className="btn-primary self-end"><Search className="h-4 w-4" />Search</button>
      </div>

      {isAdvanced || advancedActive ? <details className="group rounded-lg border border-border bg-surface-secondary/45" open={advancedActive || undefined}>
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-3 text-sm font-bold text-foreground hover:bg-surface-secondary [&::-webkit-details-marker]:hidden">
          <span className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Advanced filters</span>
          <span className="text-xs font-semibold text-muted">{advancedActive ? "Filters applied" : "Category, priority, staff, archive"}</span>
        </summary>
        <div className="grid gap-3 border-t border-border p-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="form-label">Category<select className="form-control" name="category" defaultValue={values.category}><option value="all">All categories</option>{supportCategories.map((item) => <option key={item} value={item}>{formatSupportCategory(item)}</option>)}</select></label>
          <label className="form-label">Priority<select className="form-control" name="priority" defaultValue={values.priority}><option value="all">All priorities</option>{["low", "normal", "high", "urgent"].map((item) => <option key={item} value={item}>{item[0].toUpperCase() + item.slice(1)}</option>)}</select></label>
          <label className="form-label">Assigned staff<select className="form-control" name="assigned" defaultValue={values.assigned}><option value="all">Anyone</option><option value="me">Assigned to me</option><option value="unassigned">Unassigned</option>{staff.map((person) => <option key={person.id} value={person.id}>{person.label}</option>)}</select></label>
          <label className="form-label">Archive<select className="form-control" name="archive" defaultValue={values.archive}><option value="active">Active only</option><option value="archived">Archived only</option><option value="all">All tickets</option></select></label>
        </div>
      </details> : null}

      {advancedActive || values.q || values.status !== "all" || values.sort !== "recent" ? <div className="flex justify-end"><Link href="/admin/support" className="text-sm font-bold text-primary hover:underline" onClick={forget}>Clear all filters</Link></div> : null}
    </form>
  );
}
