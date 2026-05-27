import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Award,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronRight,
  GraduationCap,
  HandCoins,
  PawPrint,
  Users,
  Wallet,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";

type AmbassadorSummaryRow = {
  ambassador_id: string;
  user_id: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  program: string | null;
  internal_role: string | null;
  source: string | null;
  status: string | null;
  referral_code: string | null;
  referral_link: string | null;
  city: string | null;
  state: string | null;
  county: string | null;
  country: string | null;
  training_status: string | null;
  training_percent: number | null;
  created_at: string | null;
  pet_parent_signups: number | null;
  guru_signups: number | null;
  business_signups: number | null;
  completed_bookings: number | null;
  pending_rewards: number | null;
  approved_rewards: number | null;
  ready_for_payout_rewards: number | null;
  paid_rewards: number | null;
  total_earned: number | null;
  total_paid: number | null;
};

const SUPER_USER_EMAILS = new Set(["jason@sitguru.com", "nette@sitguru.com"]);

function currency(value: number | null | undefined) {
  const amount = Number(value || 0);

  return amount.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

function numberValue(value: number | null | undefined) {
  return Number(value || 0);
}

function prettyStatus(status: string | null | undefined) {
  if (!status) return "New";

  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClass(status: string | null | undefined) {
  switch (status) {
    case "active":
      return "bg-emerald-100 text-emerald-800 ring-emerald-200";
    case "conditional_offer_sent":
    case "onboarding_sent":
      return "bg-blue-100 text-blue-800 ring-blue-200";
    case "paused":
    case "nurture":
      return "bg-amber-100 text-amber-800 ring-amber-200";
    case "not_a_fit":
    case "inactive":
      return "bg-rose-100 text-rose-800 ring-rose-200";
    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function trainingClass(percent: number | null | undefined) {
  const value = numberValue(percent);

  if (value >= 100) return "bg-emerald-500";
  if (value >= 50) return "bg-amber-500";
  return "bg-slate-400";
}

function buildAdminCards(rows: AmbassadorSummaryRow[]) {
  return [
    {
      label: "Total Ambassadors",
      value: rows.length.toLocaleString(),
      subtext: "Indeed Student Ambassador pipeline",
      icon: GraduationCap,
    },
    {
      label: "Pet Parent Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.pet_parent_signups), 0)
        .toLocaleString(),
      subtext: "Referred Pet Parent accounts",
      icon: PawPrint,
    },
    {
      label: "Guru Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.guru_signups), 0)
        .toLocaleString(),
      subtext: "Referred Guru applicants/accounts",
      icon: Users,
    },
    {
      label: "Business Signups",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.business_signups), 0)
        .toLocaleString(),
      subtext: "Local business/community leads",
      icon: BriefcaseBusiness,
    },
    {
      label: "Completed Bookings",
      value: rows
        .reduce((sum, row) => sum + numberValue(row.completed_bookings), 0)
        .toLocaleString(),
      subtext: "Referral-linked completed bookings",
      icon: CheckCircle2,
    },
    {
      label: "Pending Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.pending_rewards), 0),
      ),
      subtext: "Possible future reward review",
      icon: Award,
    },
    {
      label: "Approved Rewards",
      value: currency(
        rows.reduce((sum, row) => sum + numberValue(row.approved_rewards), 0),
      ),
      subtext: "Approved unpaid reward liability",
      icon: HandCoins,
    },
    {
      label: "Ready for Payout",
      value: currency(
        rows.reduce(
          (sum, row) => sum + numberValue(row.ready_for_payout_rewards),
          0,
        ),
      ),
      subtext: "Queued for payout processing",
      icon: Wallet,
    },
  ];
}

export default async function AdminAmbassadorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const email = user?.email?.toLowerCase() || "";

  if (!user || !SUPER_USER_EMAILS.has(email)) {
    redirect("/admin/login");
  }

  const { data, error } = await supabase
    .from("admin_ambassador_dashboard_summary")
    .select("*")
    .order("created_at", { ascending: false });

  const ambassadors = (data || []) as AmbassadorSummaryRow[];
  const cards = buildAdminCards(ambassadors);

  const activeCount = ambassadors.filter((row) => row.status === "active").length;
  const onboardingCount = ambassadors.filter((row) =>
    ["conditional_offer_sent", "onboarding_sent"].includes(row.status || ""),
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f8f3] px-4 py-6 text-[#17351f] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white p-5 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-extrabold uppercase tracking-[0.24em] text-[#2f6f3e]">
                SitGuru Growth
              </p>
              <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-[#102819] sm:text-4xl">
                Ambassador Dashboard
              </h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                Track Student Ambassadors, Pet Parent signups, Guru signups,
                business signups, completed bookings, rewards, commissions, and
                payout readiness from one admin view.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-emerald-700">
                  Active
                </p>
                <p className="mt-1 text-2xl font-extrabold text-emerald-900">
                  {activeCount}
                </p>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                  Onboarding
                </p>
                <p className="mt-1 text-2xl font-extrabold text-blue-900">
                  {onboardingCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {error ? (
          <section className="rounded-3xl border border-rose-200 bg-rose-50 p-5 text-rose-800">
            <h2 className="text-lg font-extrabold">Ambassador data error</h2>
            <p className="mt-2 text-sm">
              SitGuru could not load the ambassador summary view. Supabase
              returned:
            </p>
            <pre className="mt-3 overflow-auto rounded-2xl bg-white p-4 text-xs">
              {error.message}
            </pre>
          </section>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;

            return (
              <div
                key={card.label}
                className="rounded-3xl border border-[#dbe8d5] bg-white p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-slate-500">
                      {card.label}
                    </p>
                    <p className="mt-3 text-3xl font-extrabold text-[#102819]">
                      {card.value}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#e8f5e9] p-3 text-[#2f6f3e]">
                    <Icon className="h-5 w-5" />
                  </div>
                </div>
                <p className="mt-3 text-sm text-slate-600">{card.subtext}</p>
              </div>
            );
          })}
        </section>

        <section className="rounded-[2rem] border border-[#dbe8d5] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#e2ecd9] p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-[#102819]">
                Student Ambassadors
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                One-level admin view of each Ambassador’s signups, rewards, and
                training progress.
              </p>
            </div>

            <div className="rounded-2xl bg-[#f0f7ed] px-4 py-3 text-sm font-bold text-[#2f6f3e]">
              Source: Indeed
            </div>
          </div>

          {ambassadors.length === 0 ? (
            <div className="p-8 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#e8f5e9] text-[#2f6f3e]">
                <GraduationCap className="h-7 w-7" />
              </div>
              <h3 className="mt-4 text-xl font-extrabold text-[#102819]">
                No Ambassadors yet
              </h3>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-600">
                Your database is ready. Next, we will add the Indeed candidates
                to the ambassadors table and then wire their dashboard records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#e2ecd9]">
                <thead className="bg-[#f8fbf6]">
                  <tr>
                    <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Ambassador
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Status
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Signups
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Rewards
                    </th>
                    <th className="px-5 py-4 text-left text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      Training
                    </th>
                    <th className="px-5 py-4 text-right text-xs font-extrabold uppercase tracking-[0.16em] text-slate-500">
                      View
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf3e8] bg-white">
                  {ambassadors.map((ambassador) => {
                    const trainingPercent = numberValue(
                      ambassador.training_percent,
                    );

                    return (
                      <tr key={ambassador.ambassador_id} className="align-top">
                        <td className="px-5 py-4">
                          <div className="min-w-[240px]">
                            <p className="font-extrabold text-[#102819]">
                              {ambassador.full_name || "Unnamed Ambassador"}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">
                              {ambassador.email || "No email saved"}
                            </p>
                            <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#2f6f3e]">
                              {ambassador.referral_code || "No referral code"}
                            </p>
                            <p className="mt-1 text-xs text-slate-500">
                              {[ambassador.city, ambassador.state]
                                .filter(Boolean)
                                .join(", ") || "Location not saved"}
                            </p>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-extrabold ring-1 ${statusClass(
                              ambassador.status,
                            )}`}
                          >
                            {prettyStatus(ambassador.status)}
                          </span>
                          <p className="mt-2 text-xs text-slate-500">
                            {ambassador.program || "Student Hire"}
                          </p>
                        </td>

                        <td className="px-5 py-4">
                          <div className="grid min-w-[220px] grid-cols-3 gap-2 text-center">
                            <div className="rounded-2xl bg-[#f5f8f3] p-3">
                              <p className="text-lg font-extrabold text-[#102819]">
                                {numberValue(ambassador.pet_parent_signups)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Parents
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[#f5f8f3] p-3">
                              <p className="text-lg font-extrabold text-[#102819]">
                                {numberValue(ambassador.guru_signups)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Gurus
                              </p>
                            </div>
                            <div className="rounded-2xl bg-[#f5f8f3] p-3">
                              <p className="text-lg font-extrabold text-[#102819]">
                                {numberValue(ambassador.business_signups)}
                              </p>
                              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">
                                Business
                              </p>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[210px] space-y-1 text-sm">
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Pending</span>
                              <span className="font-bold text-[#102819]">
                                {currency(ambassador.pending_rewards)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Approved</span>
                              <span className="font-bold text-[#102819]">
                                {currency(ambassador.approved_rewards)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Ready</span>
                              <span className="font-bold text-[#102819]">
                                {currency(ambassador.ready_for_payout_rewards)}
                              </span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-500">Paid</span>
                              <span className="font-bold text-[#102819]">
                                {currency(ambassador.paid_rewards)}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4">
                          <div className="min-w-[160px]">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-bold text-[#102819]">
                                {trainingPercent}%
                              </span>
                              <span className="text-xs text-slate-500">
                                {prettyStatus(ambassador.training_status)}
                              </span>
                            </div>
                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                              <div
                                className={`h-full rounded-full ${trainingClass(
                                  trainingPercent,
                                )}`}
                                style={{ width: `${trainingPercent}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/admin/ambassadors/${ambassador.ambassador_id}`}
                            className="inline-flex items-center justify-center rounded-full bg-[#2f6f3e] px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#255b33]"
                          >
                            View
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}