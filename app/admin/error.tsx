"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-rose-100 bg-white p-8 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
        Super Admin HQ
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">
        Admin couldn&apos;t load
      </h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        Something failed while opening this Admin page. Reload to try again, or
        return to the Action Center.
      </p>
      {error?.digest ? (
        <p className="mt-2 text-xs font-semibold text-slate-400">
          Ref {error.digest}
        </p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-black !text-white"
          style={{ background: "#0D5C3A" }}
        >
          Reload
        </button>
        <a
          href="/admin/action-center"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black text-emerald-900"
        >
          Action Center
        </a>
        <a
          href="/admin/login"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-800"
        >
          Sign in again
        </a>
      </div>
    </div>
  );
}
