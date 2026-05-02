import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type Ambassador = {
  id: string;
  user_id: string | null;
  application_id: string | null;
  display_name: string;
  email: string;
  phone: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  territory: string | null;
  ambassador_type: string;
  tier: "bronze" | "silver" | "gold" | "city_captain";
  points: number;
  referral_code: string | null;
  customer_referral_url: string | null;
  guru_referral_url: string | null;
  partner_referral_url: string | null;
  status: "active" | "paused" | "suspended" | "archived";
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
};

function formatLabel(value: string) {
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function statusClasses(status: Ambassador["status"]) {
  switch (status) {
    case "active":
      return "border-green-200 bg-green-50 text-green-800";
    case "paused":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "suspended":
      return "border-red-200 bg-red-50 text-red-800";
    case "archived":
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

function tierClasses(tier: Ambassador["tier"]) {
  switch (tier) {
    case "city_captain":
      return "border-green-300 bg-green-100 text-green-900";
    case "gold":
      return "border-yellow-300 bg-yellow-50 text-yellow-900";
    case "silver":
      return "border-slate-300 bg-slate-50 text-slate-800";
    default:
      return "border-orange-200 bg-orange-50 text-orange-800";
  }
}

function tierIcon(tier: Ambassador["tier"]) {
  switch (tier) {
    case "city_captain":
      return "🛡️";
    case "gold":
      return "🥇";
    case "silver":
      return "🥈";
    default:
      return "🥉";
  }
}

function ambassadorIcon(type: string) {
  if (type.includes("local_partner")) return "🏪";
  if (type.includes("city_captain")) return "🏙️";
  if (type.includes("campus")) return "🎓";
  if (type.includes("neighborhood")) return "📍";
  if (type.includes("event")) return "📣";
  if (type.includes("rescue")) return "💚";
  return "⭐";
}

export default async function AdminAmbassadorsPage() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("ambassadors")
    .select("*")
    .order("created_at", { ascending: false });

  const ambassadors = (data ?? []) as Ambassador[];

  const activeCount = ambassadors.filter(
    (ambassador) => ambassador.status === "active"
  ).length;

  const pausedCount = ambassadors.filter(
    (ambassador) => ambassador.status === "paused"
  ).length;

  const cityCaptainCount = ambassadors.filter(
    (ambassador) =>
      ambassador.tier === "city_captain" ||
      ambassador.ambassador_type === "city_captain"
  ).length;

  const totalPoints = ambassadors.reduce(
    (sum, ambassador) => sum + (ambassador.points || 0),
    0
  );

  return (
    <main className="min-h-screen bg-[#fbfaf6] text-slate-950">
      <section className="border-b border-green-100 bg-white">
        <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-green-800">
                <Link href="/admin" className="hover:text-green-950">
                  Admin
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                <Link href="/admin/partners" className="hover:text-green-950">
                  Partners
                </Link>
                <span className="mx-2 text-slate-400">/</span>
                Ambassadors
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Ambassadors
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Manage approved SitGuru Ambassadors, local outreach promoters,
                City Captain candidates, territories, referral links, tiers, and
                points.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/applications"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Review Applications
              </Link>

              <Link
                href="/admin/partners"
                className="inline-flex items-center justify-center rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-green-900"
              >
                Partner Overview
              </Link>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">Active</p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {activeCount}
              </p>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-800">Paused</p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {pausedCount}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm font-bold text-purple-800">
                City Captains
              </p>
              <p className="mt-2 text-3xl font-black text-purple-950">
                {cityCaptainCount}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">Total Points</p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {totalPoints}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10">
        {error ? (
          <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
            <h2 className="text-xl font-black">Could not load ambassadors</h2>
            <p className="mt-2 text-sm leading-6">
              Supabase returned an error while loading ambassadors:
            </p>
            <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
              {error.message}
            </pre>
            <p className="mt-4 text-sm font-bold">
              This usually means the Admin RLS policy for the ambassadors table
              still needs to be added or adjusted.
            </p>
          </div>
        ) : ambassadors.length === 0 ? (
          <div className="rounded-[2rem] border border-green-100 bg-white p-10 text-center shadow-sm">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-green-100 text-3xl">
              ⭐
            </div>
            <h2 className="mt-5 text-3xl font-black text-green-950">
              No approved ambassadors yet
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600">
              Once Admin approves Ambassador applications, approved ambassador
              records will appear here with referral links, tiers, and territory
              details.
            </p>
            <Link
              href="/admin/partners/applications"
              className="mt-6 inline-flex rounded-xl bg-green-800 px-5 py-3 text-sm font-black text-white transition hover:bg-green-900"
            >
              Review Applications
            </Link>
          </div>
        ) : (
          <div className="grid gap-5">
            {ambassadors.map((ambassador) => (
              <article
                key={ambassador.id}
                className="overflow-hidden rounded-[1.5rem] border border-green-100 bg-white shadow-sm"
              >
                <div className="border-b border-green-100 bg-[#fbfaf6] p-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                        {ambassadorIcon(ambassador.ambassador_type)}
                      </div>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                            {formatLabel(ambassador.ambassador_type)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${tierClasses(
                              ambassador.tier
                            )}`}
                          >
                            {tierIcon(ambassador.tier)} {formatLabel(ambassador.tier)}
                          </span>

                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                              ambassador.status
                            )}`}
                          >
                            {formatLabel(ambassador.status)}
                          </span>
                        </div>

                        <h2 className="mt-3 text-2xl font-black text-green-950">
                          {ambassador.display_name}
                        </h2>

                        <p className="mt-1 text-sm font-semibold text-slate-600">
                          Approved {formatDate(ambassador.approved_at)} • Created{" "}
                          {formatDate(ambassador.created_at)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      {ambassador.application_id ? (
                        <Link
                          href={`/admin/partners/applications/${ambassador.application_id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-4 py-2 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                        >
                          View Application
                        </Link>
                      ) : null}

                      <Link
                        href={`mailto:${ambassador.email}`}
                        className="inline-flex items-center justify-center rounded-xl bg-green-800 px-4 py-2 text-sm font-black text-white transition hover:bg-green-900"
                      >
                        Email
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="grid gap-5 p-5 lg:grid-cols-3">
                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Contact
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {ambassador.display_name}
                    </p>
                    <p className="mt-1 break-words text-sm text-slate-600">
                      {ambassador.email}
                    </p>
                    {ambassador.phone ? (
                      <p className="mt-1 text-sm text-slate-600">
                        {ambassador.phone}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Territory
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {ambassador.territory ||
                        [ambassador.city, ambassador.state]
                          .filter(Boolean)
                          .join(", ") ||
                        "Not provided"}
                    </p>
                    {ambassador.zip_code ? (
                      <p className="mt-1 text-sm text-slate-600">
                        ZIP {ambassador.zip_code}
                      </p>
                    ) : null}
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Referral Code
                    </p>
                    <p className="mt-3 text-sm font-bold text-slate-900">
                      {ambassador.referral_code || "Not generated"}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      Points: {ambassador.points}
                    </p>
                  </div>
                </div>

                <div className="grid gap-5 border-t border-green-100 p-5 lg:grid-cols-3">
                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Customer Referral
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-green-950">
                      {ambassador.customer_referral_url || "Not generated"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Guru Referral
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-green-950">
                      {ambassador.guru_referral_url || "Not generated"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-green-100 bg-white p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-green-700">
                      Partner Referral
                    </p>
                    <p className="mt-2 break-words text-sm font-bold text-green-950">
                      {ambassador.partner_referral_url || "Not generated"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3 border-t border-green-100 bg-[#fbfaf6] p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-sm text-slate-600">
                    User ID:{" "}
                    <span className="font-bold text-slate-800">
                      {ambassador.user_id || "Not linked to user account"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Link
                      href="/admin/partners/messages"
                      className="rounded-xl border border-green-200 bg-white px-4 py-2 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
                    >
                      Message Ambassador
                    </Link>

                    <Link
                      href="/admin/partners/campaigns"
                      className="rounded-xl bg-green-800 px-4 py-2 text-center text-sm font-black text-white transition hover:bg-green-900"
                    >
                      Create Campaign
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
