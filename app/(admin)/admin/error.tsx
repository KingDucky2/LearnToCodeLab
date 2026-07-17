"use client";

export default function AdminError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <section className="surface-panel"><h1 className="type-page">Admin data could not be loaded</h1><p className="mt-3 text-muted">No account action was performed. Try the request again; if it continues, verify the migration and server configuration.</p><button className="btn-primary mt-5" onClick={reset}>Try again</button></section>;
}
