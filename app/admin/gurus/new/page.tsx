import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminGuruAction } from "@/app/admin/gurus/actions";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  return String(value || "").trim();
}

function errorMessage(code: string) {
  if (code === "missing_name") return "First and last name are required.";
  if (code === "invalid_email") return "Enter a valid email address.";
  if (code === "login_required") {
    return "Turn on “Create SitGuru login” for new emails, or use an email that already has a SitGuru account.";
  }
  if (!code) return "";
  return code;
}

export default async function AdminNewGuruPage({ searchParams }: PageProps) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  const params = searchParams ? await searchParams : {};
  const errorCode = firstParam(params.error);
  const message = errorMessage(errorCode);

  return (
    <main className="mx-auto max-w-3xl space-y-6 px-1 py-2 sm:px-0">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[radial-gradient(circle_at_top_left,rgba(16,185,129,0.12),transparent_34%),linear-gradient(135deg,#ffffff_0%,#ecfdf5_55%,#f8fafc_100%)] p-6 shadow-sm sm:p-8">
        <p className="text-xs font-black uppercase tracking-[0.22em] text-emerald-700">
          Admin / Add Guru
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-tight text-slate-950">
          Create a Guru workspace.
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600 sm:text-base">
          Add a real first and last name plus email so this person lands in the
          Guru work queue with a usable identity — not a generic “SitGuru Member”
          placeholder.
        </p>

        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href="/admin/gurus"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
          >
            Back to Guru Queue
          </Link>
          <Link
            href="/admin/gurus/leads"
            className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
          >
            Guru Leads
          </Link>
        </div>
      </section>

      {message ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {message}
        </div>
      ) : null}

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-8">
        <form action={createAdminGuruAction} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                First name *
              </span>
              <input
                name="firstName"
                required
                autoComplete="given-name"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Last name *
              </span>
              <input
                name="lastName"
                required
                autoComplete="family-name"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Email *
              </span>
              <input
                name="email"
                type="email"
                required
                autoComplete="email"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Phone
              </span>
              <input
                name="phone"
                type="tel"
                inputMode="tel"
                placeholder="(555) 555-5555"
                autoComplete="tel"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <label className="block sm:col-span-1">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                City
              </span>
              <input
                name="city"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                State
              </span>
              <input
                name="state"
                maxLength={2}
                placeholder="PA"
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold uppercase text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                ZIP
              </span>
              <input
                name="zip"
                inputMode="numeric"
                maxLength={5}
                className="min-h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Admin notes
            </span>
            <textarea
              name="notes"
              rows={4}
              placeholder="How this Guru was sourced, screening notes, etc."
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-emerald-300 focus:ring-2"
            />
          </label>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-[#fbfefd] p-4">
            <input
              type="checkbox"
              name="createLogin"
              defaultChecked
              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-500"
            />
            <span>
              <span className="block text-sm font-black text-slate-950">
                Create SitGuru login for this Guru
              </span>
              <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
                Creates a confirmed auth account when one does not already exist
                for this email. Uncheck to create a workspace draft only.
              </span>
            </span>
          </label>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Link
              href="/admin/gurus"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
            >
              Create Guru
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
