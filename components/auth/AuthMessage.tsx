export function AuthMessage({ type, children }: { type: "error" | "success" | "info"; children: string }) {
  const tone = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-border bg-surface-secondary text-secondary"
  }[type];

  return (
    <p aria-live="polite" className={`rounded-lg border p-3 text-sm font-bold ${tone}`}>
      {children}
    </p>
  );
}
