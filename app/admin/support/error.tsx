"use client";

export default function AdminSupportError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-xl rounded-[28px] border border-rose-100 bg-white p-8 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-rose-700">
        Support desk
      </p>
      <h1 className="mt-2 text-3xl font-black text-slate-950">
        Support couldn’t load
      </h1>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        Something failed while opening the support queue. Reload to try again,
        or head back to Admin.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Reload support
        </button>
        <a
          href="/admin"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-5 py-2.5 text-sm font-black text-emerald-900 transition hover:bg-emerald-50"
        >
          Back to Admin
        </a>
      </div>
    </div>
  );
}
