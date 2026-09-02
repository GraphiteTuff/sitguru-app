import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";

export const dynamic = "force-dynamic";

const tools = [
  {
    href: "/admin/sales-marketing",
    title: "Sales & Marketing",
    detail: "Campaigns, leads, content, and outreach.",
  },
  {
    href: "/admin/community/events",
    title: "Pet Events",
    detail: "Promote local SitGuru community events.",
  },
  {
    href: "/admin/partners",
    title: "Partners",
    detail: "Spotlight approved local pet businesses.",
  },
  {
    href: "/admin/referrals",
    title: "Referrals",
    detail: "Watch referral signups and community growth.",
  },
  {
    href: "/admin/market-growth",
    title: "Market Density",
    detail: "See Bucks, Lehigh, and nearby Pet Parent density.",
  },
];

export default async function AdminGrowthHomePage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <main className="min-h-screen bg-[#f9faf5] px-4 py-6 text-slate-950">
        <div className="mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.24em] text-rose-700">
            Access Restricted
          </p>
          <h1 className="public-dark-section mt-3 text-3xl font-black tracking-tight text-slate-950">
            Admin access required.
          </h1>
        </div>
      </main>
    );
  }

  const growthOnly = isGrowthOnlyRole(actor.role);

  return (
    <main className="min-h-screen bg-[#f9faf5] px-3 py-4 text-slate-950 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5">
        <section
          className="public-dark-section overflow-hidden rounded-[1.75rem] border border-emerald-100 p-5 shadow-sm sm:p-8"
          data-brand-green
          style={{ background: "#0D5C3A" }}
        >
          <p className="text-xs font-black uppercase tracking-[0.24em] !text-white">
            Growth & Social
          </p>
          <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight !text-white sm:text-5xl">
            Turn SitGuru stories into Pet Parents.
          </h1>
          <p className="mt-4 max-w-3xl text-sm font-semibold leading-7 !text-white sm:text-base">
            {growthOnly
              ? "Your workspace is social and community growth only. Create content, promote Gurus and events, and measure signups — not followers."
              : "Social & Community Managers land here. Superadmin can still use the full Admin sidebar."}
          </p>
          <p className="mt-3 text-xs font-bold !text-white/80">
            Signed in as {actor.email} · {actor.role.replaceAll("_", " ")}
          </p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {tools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300"
            >
              <h2 className="text-lg font-black text-slate-950">{tool.title}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                {tool.detail}
              </p>
              <p className="mt-4 text-sm font-black text-emerald-800">Open →</p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
