export default function MaintenanceLoading() {
  return (
    <main data-maintenance-page className="maintenance-page grid min-h-screen place-items-center px-5 py-12" aria-busy="true">
      <div className="w-full max-w-lg rounded-lg border border-slate-200 bg-white p-8 shadow-lab">
        <div className="h-5 w-36 animate-pulse rounded bg-slate-200" />
        <div className="mt-7 h-11 w-full animate-pulse rounded bg-slate-200" />
        <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-slate-100" />
        <div className="mt-8 h-3 w-full animate-pulse rounded bg-slate-100" />
        <span className="sr-only">Loading maintenance status</span>
      </div>
    </main>
  );
}
