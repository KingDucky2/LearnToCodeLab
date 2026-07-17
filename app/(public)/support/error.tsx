"use client";

export default function SupportError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main className="mx-auto w-[min(720px,calc(100%_-_24px))] py-10"><section className="surface-panel"><h1 className="type-page">Support could not be loaded</h1><p className="mt-3 text-muted">Your account details and messages were not changed. Please try again.</p><button className="btn-primary mt-5" onClick={reset}>Try again</button></section></main>;
}
