// components/admin/live-walks/AdminAccessDenied.tsx
export default function AdminAccessDenied() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-6 rounded-xl border border-rose-200 bg-white p-10 text-center shadow-sm">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rose-50 text-2xl font-black text-rose-700">
        403
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-950">
          Access Denied
        </h1>
        <p className="text-sm font-semibold leading-6 text-slate-600">
          Live Walks Monitor is restricted to authenticated SitGuru admins
          (`profiles.role = admin`). Your session is missing admin privileges.
        </p>
      </div>
      <a
        href="/admin"
        className="rounded-xl bg-emerald-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-900"
      >
        Return to Admin Home
      </a>
    </div>
  );
}
