import Link from "next/link";

type AdvancedAccountOptionsCardProps = {
  isGuru?: boolean;
};

export default function AdvancedAccountOptionsCard({
  isGuru = false,
}: AdvancedAccountOptionsCardProps) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">
            Advanced
          </p>

          <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
            Advanced account options
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Need to step away from SitGuru? You can manage temporary account
            access, review Guru service options, or continue to permanent
            deletion options.
          </p>
        </div>

        <Link
          href="/account/advanced"
          className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
        >
          Manage options
        </Link>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {isGuru ? (
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-sm font-black text-emerald-800">
              Pause Guru services
            </p>
            <p className="mt-1 text-xs leading-5 text-emerald-700">
              Temporarily hide yourself from new Guru requests.
            </p>
          </div>
        ) : null}

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-800">
            Deactivate account
          </p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Temporarily disable access without permanent deletion.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-black text-slate-800">Delete account</p>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            Review permanent deletion only after safer options.
          </p>
        </div>
      </div>
    </section>
  );
}