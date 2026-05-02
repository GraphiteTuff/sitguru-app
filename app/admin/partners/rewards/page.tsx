import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type ReferralConversion = {
  id: string;
  referral_code_id: string | null;
  referred_user_id: string | null;
  booking_id: string | null;
  partner_id: string | null;
  ambassador_id: string | null;
  conversion_type:
    | "customer_signup"
    | "guru_signup"
    | "partner_application"
    | "partner_approved"
    | "first_booking"
    | "guru_approved"
    | "guru_first_booking";
  status: "pending" | "qualified" | "approved" | "rejected" | "reversed";
  amount: number | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  qualified_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  reversed_at: string | null;
  referral_codes: {
    id: string;
    code: string;
    slug: string | null;
    owner_type: string;
    campaign_type: string;
  } | null;
};

type ReferralReward = {
  id: string;
  referral_code_id: string | null;
  conversion_id: string | null;
  referrer_user_id: string | null;
  referred_user_id: string | null;
  partner_id: string | null;
  ambassador_id: string | null;
  reward_type: "cash" | "credit" | "donation" | "badge" | "boost" | "manual_bonus";
  amount: number | null;
  currency: string | null;
  status: "pending" | "qualified" | "approved" | "paid" | "rejected" | "reversed";
  payout_id: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_at: string | null;
  rejected_at: string | null;
  reversed_at: string | null;
  created_at: string;
  referral_codes: {
    id: string;
    code: string;
    slug: string | null;
    owner_type: string;
    campaign_type: string;
  } | null;
  partners: {
    id: string;
    business_name: string;
    partner_type: string;
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    ambassador_type: string;
  } | null;
};

function formatLabel(value: string | null | undefined) {
  if (!value) return "Not Provided";

  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatMoney(value: number | null | undefined, currency = "USD") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(Number(value || 0));
}

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function conversionStatusClasses(status: ReferralConversion["status"]) {
  switch (status) {
    case "approved":
      return "border-green-200 bg-green-50 text-green-800";
    case "qualified":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "reversed":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function rewardStatusClasses(status: ReferralReward["status"]) {
  switch (status) {
    case "paid":
      return "border-green-200 bg-green-50 text-green-800";
    case "approved":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "qualified":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "rejected":
      return "border-red-200 bg-red-50 text-red-800";
    case "reversed":
      return "border-slate-200 bg-slate-50 text-slate-700";
    default:
      return "border-amber-200 bg-amber-50 text-amber-800";
  }
}

function getRewardOwnerName(reward: ReferralReward) {
  if (reward.partners?.business_name) return reward.partners.business_name;
  if (reward.ambassadors?.display_name) return reward.ambassadors.display_name;
  if (reward.referrer_user_id) return reward.referrer_user_id;
  return "Unknown Referrer";
}

export default async function AdminPartnerRewardsPage() {
  const supabase = await createClient();

  const { data: conversionsData, error: conversionsError } = await supabase
    .from("referral_conversions")
    .select(
      `
        *,
        referral_codes (
          id,
          code,
          slug,
          owner_type,
          campaign_type
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(25);

  const { data: rewardsData, error: rewardsError } = await supabase
    .from("referral_rewards")
    .select(
      `
        *,
        referral_codes (
          id,
          code,
          slug,
          owner_type,
          campaign_type
        ),
        partners (
          id,
          business_name,
          partner_type
        ),
        ambassadors (
          id,
          display_name,
          ambassador_type
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(25);

  const conversions = (conversionsData ?? []) as ReferralConversion[];
  const rewards = (rewardsData ?? []) as ReferralReward[];

  const pendingConversions = conversions.filter(
    (conversion) => conversion.status === "pending"
  ).length;

  const qualifiedConversions = conversions.filter(
    (conversion) => conversion.status === "qualified"
  ).length;

  const pendingRewards = rewards.filter((reward) => reward.status === "pending").length;

  const approvedRewards = rewards.filter(
    (reward) => reward.status === "approved"
  ).length;

  const paidRewardsTotal = rewards
    .filter((reward) => reward.status === "paid")
    .reduce((sum, reward) => sum + Number(reward.amount || 0), 0);

  const approvedRewardsTotal = rewards
    .filter((reward) => reward.status === "approved")
    .reduce((sum, reward) => sum + Number(reward.amount || 0), 0);

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
                Rewards
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Referral Rewards
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Track referral conversions and rewards for completed bookings,
                approved Gurus, partner activations, donations, bonuses, and
                future payout workflows.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/campaigns"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Campaigns
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
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
              <p className="text-sm font-bold text-amber-800">
                Pending Conversions
              </p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {pendingConversions}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">
                Qualified Conversions
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {qualifiedConversions}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm font-bold text-purple-800">
                Pending Rewards
              </p>
              <p className="mt-2 text-3xl font-black text-purple-950">
                {pendingRewards}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">
                Approved Rewards
              </p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {approvedRewards}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="space-y-6">
          {conversionsError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">
                Could not load conversions
              </h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading conversions:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {conversionsError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Conversions
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Recent referral conversions
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Showing latest 25 conversions.
                </p>
              </div>

              {conversions.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    ✅
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No conversions yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Conversion rows will appear after signup, booking, Guru
                    approval, or partner approval events are wired.
                  </p>
                </div>
              ) : (
                <div className="mt-6 overflow-hidden rounded-2xl border border-green-100">
                  <div className="grid grid-cols-[1fr_1fr_0.9fr_1fr] bg-green-50 px-4 py-3 text-xs font-black uppercase tracking-wide text-green-900">
                    <span>Conversion</span>
                    <span>Referral Code</span>
                    <span>Status</span>
                    <span>Created</span>
                  </div>

                  {conversions.map((conversion) => (
                    <div
                      key={conversion.id}
                      className="grid grid-cols-[1fr_1fr_0.9fr_1fr] border-t border-green-100 bg-white px-4 py-4 text-sm"
                    >
                      <div>
                        <p className="font-black text-green-950">
                          {formatLabel(conversion.conversion_type)}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Amount: {formatMoney(conversion.amount)}
                        </p>
                      </div>

                      <div>
                        <p className="font-black text-slate-900">
                          {conversion.referral_codes?.code || "Unknown Code"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatLabel(conversion.referral_codes?.campaign_type)}
                        </p>
                      </div>

                      <div>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-black ${conversionStatusClasses(
                            conversion.status
                          )}`}
                        >
                          {formatLabel(conversion.status)}
                        </span>
                      </div>

                      <div className="text-slate-600">
                        {formatDateTime(conversion.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {rewardsError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">Could not load rewards</h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading rewards:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {rewardsError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Rewards
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Recent referral rewards
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Showing latest 25 rewards.
                </p>
              </div>

              {rewards.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    🎁
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No rewards yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Reward rows will appear after qualified conversions are
                    wired to create pending rewards.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {rewards.map((reward) => (
                    <article
                      key={reward.id}
                      className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-black ${rewardStatusClasses(
                                reward.status
                              )}`}
                            >
                              {formatLabel(reward.status)}
                            </span>

                            <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                              {formatLabel(reward.reward_type)}
                            </span>

                            <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                              {reward.referral_codes?.code || "Unknown Code"}
                            </span>
                          </div>

                          <h3 className="mt-3 text-2xl font-black text-green-950">
                            {getRewardOwnerName(reward)}
                          </h3>

                          <p className="mt-1 text-sm text-slate-600">
                            Created {formatDateTime(reward.created_at)}
                          </p>
                        </div>

                        <div className="rounded-2xl bg-white px-5 py-4 text-right shadow-sm">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Amount
                          </p>
                          <p className="mt-1 text-3xl font-black text-green-950">
                            {formatMoney(reward.amount, reward.currency || "USD")}
                          </p>
                        </div>
                      </div>

                      {reward.admin_notes ? (
                        <div className="mt-4 rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Admin Notes
                          </p>
                          <p className="mt-2 text-sm leading-6 text-slate-700">
                            {reward.admin_notes}
                          </p>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-green-100 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-2xl font-black">Reward Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Approved Reward Value
                </p>
                <p className="mt-2 text-3xl font-black">
                  {formatMoney(approvedRewardsTotal)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Paid Reward Value
                </p>
                <p className="mt-2 text-3xl font-black">
                  {formatMoney(paidRewardsTotal)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Next Workflow
                </p>
                <p className="mt-2 text-sm leading-6 text-green-100">
                  Add actions to approve, reject, reverse, and mark rewards as
                  paid once booking and payout workflows are connected.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Conversion Events to Wire
            </h2>

            <div className="mt-5 space-y-3">
              {[
                "Customer signup with ref code",
                "Guru signup with ref code",
                "First completed booking",
                "Guru approved",
                "Guru first booking completed",
                "Partner application submitted from referral",
                "Partner approved from referral",
              ].map((item) => (
                <div
                  key={item}
                  className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-4 text-sm font-bold text-slate-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">Quick Links</h2>

            <div className="mt-5 space-y-3">
              <Link
                href="/admin/partners/campaigns"
                className="block rounded-xl border border-green-200 bg-[#fbfaf6] px-4 py-3 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Campaigns & Clicks
              </Link>

              <Link
                href="/admin/partners/payouts"
                className="block rounded-xl bg-green-800 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-green-900"
              >
                Payouts
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
