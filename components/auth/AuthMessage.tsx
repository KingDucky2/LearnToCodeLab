export function AuthMessage({ type, children }: { type: "error" | "success" | "info"; children: string }) {
  const tone = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-slate-200 bg-slate-100 text-slate-700"
  }[type];

  return (
    <p aria-live="polite" className={`rounded-xl border p-3 text-sm font-bold ${tone}`}>
      {children}
    </p>
  );
}
