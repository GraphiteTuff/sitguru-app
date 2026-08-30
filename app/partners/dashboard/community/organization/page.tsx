import Link from "next/link";
import { redirect } from "next/navigation";
import { requireEventHostPartnerAccount } from "@/lib/community/partner-access";
import { buildEventHostCreateSignupHref } from "@/lib/community/pet-parent-signup";

export const dynamic = "force-dynamic";

export default async function PartnerOrganizationProfilePage() {
  const access = await requireEventHostPartnerAccount();
  if (!access.ok || !access.partner) {
    redirect(buildEventHostCreateSignupHref({ source: "org_profile" }));
  }

  const partner = access.partner;

  return (
    <main className="mx-auto max-w-3xl space-y-6">
      <div>
        <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
          Organizer profile
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
          Your Organization
        </h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Reused on every SitGuru Partner Event so you do not re-enter contact
          details each time.
        </p>
      </div>

      <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-2xl font-black text-slate-950">
          {partner.business_name || "Organization name"}
        </p>
        <dl className="mt-5 space-y-3 text-sm font-semibold text-slate-700">
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Location
            </dt>
            <dd className="mt-1">
              {[partner.city, partner.state, partner.zip_code]
                .filter(Boolean)
                .join(", ") || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Website
            </dt>
            <dd className="mt-1">{partner.website || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Email
            </dt>
            <dd className="mt-1">{partner.email || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Phone
            </dt>
            <dd className="mt-1">{partner.phone || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
              Public page
            </dt>
            <dd className="mt-1">
              {partner.slug ? (
                <Link
                  href={`/p/${partner.slug}`}
                  className="font-black text-emerald-800 hover:underline"
                >
                  /p/{partner.slug}
                </Link>
              ) : (
                "—"
              )}
            </dd>
          </div>
        </dl>
      </section>

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-semibold text-amber-950">
        Full inline profile editing (logo, social links, organization bio) is
        next — for now update core partner details via SitGuru support or your
        original partner application contact if something is wrong.
      </div>

      <Link
        href="/partners/dashboard/community/events"
        className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
      >
        ← Back to Event Manager
      </Link>
    </main>
  );
}
