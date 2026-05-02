import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

type PartnerPayout = {
  id: string;
  payout_type: "partner" | "affiliate" | "ambassador" | "donation" | "manual";
  partner_id: string | null;
  ambassador_id: string | null;
  recipient_user_id: string | null;
  recipient_name: string | null;
  recipient_email: string | null;
  amount: number;
  currency: string;
  status:
    | "pending"
    | "approved"
    | "processing"
    | "paid"
    | "failed"
    | "cancelled";
  payout_method:
    | "manual"
    | "stripe"
    | "paypal"
    | "check"
    | "bank_transfer"
    | "donation"
    | null;
  payout_period_start: string | null;
  payout_period_end: string | null;
  reward_ids: string[] | null;
  external_reference: string | null;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  paid_by: string | null;
  paid_at: string | null;
  failed_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
  partners: {
    id: string;
    business_name: string;
    partner_type: string;
    email: string | null;
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    ambassador_type: string;
    email: string;
  } | null;
};

type ReferralReward = {
  id: string;
  referral_code_id: string | null;
  partner_id: string | null;
  ambassador_id: string | null;
  reward_type: "cash" | "credit" | "donation" | "badge" | "boost" | "manual_bonus";
  amount: number | null;
  currency: string | null;
  status: "pending" | "qualified" | "approved" | "paid" | "rejected" | "reversed";
  payout_id: string | null;
  created_at: string;
  partners: {
    id: string;
    business_name: string;
    partner_type: string;
    email: string | null;
  } | null;
  ambassadors: {
    id: string;
    display_name: string;
    ambassador_type: string;
    email: string;
  } | null;
  referral_codes: {
    id: string;
    code: string;
    owner_type: string;
    campaign_type: string;
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

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
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

function statusClasses(status: PartnerPayout["status"]) {
  switch (status) {
    case "paid":
      return "border-green-200 bg-green-50 text-green-800";
    case "approved":
      return "border-blue-200 bg-blue-50 text-blue-800";
    case "processing":
      return "border-purple-200 bg-purple-50 text-purple-800";
    case "failed":
      return "border-red-200 bg-red-50 text-red-800";
    case "cancelled":
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

function payoutTypeIcon(type: PartnerPayout["payout_type"] | ReferralReward["reward_type"]) {
  switch (type) {
    case "ambassador":
      return "⭐";
    case "affiliate":
      return "📈";
    case "donation":
      return "💚";
    case "manual":
    case "manual_bonus":
      return "🧾";
    case "credit":
      return "🎟️";
    case "cash":
      return "💵";
    default:
      return "🤝";
  }
}

function getPayoutRecipient(payout: PartnerPayout) {
  if (payout.recipient_name) return payout.recipient_name;
  if (payout.partners?.business_name) return payout.partners.business_name;
  if (payout.ambassadors?.display_name) return payout.ambassadors.display_name;
  return "Unknown Recipient";
}

function getRewardRecipient(reward: ReferralReward) {
  if (reward.partners?.business_name) return reward.partners.business_name;
  if (reward.ambassadors?.display_name) return reward.ambassadors.display_name;
  return "Unassigned Reward";
}

export default async function AdminPartnerPayoutsPage() {
  const supabase = await createClient();

  const { data: payoutsData, error: payoutsError } = await supabase
    .from("partner_payouts")
    .select(
      `
        *,
        partners (
          id,
          business_name,
          partner_type,
          email
        ),
        ambassadors (
          id,
          display_name,
          ambassador_type,
          email
        )
      `
    )
    .order("created_at", { ascending: false })
    .limit(50);

  const { data: approvedRewardsData, error: approvedRewardsError } = await supabase
    .from("referral_rewards")
    .select(
      `
        *,
        partners (
          id,
          business_name,
          partner_type,
          email
        ),
        ambassadors (
          id,
          display_name,
          ambassador_type,
          email
        ),
        referral_codes (
          id,
          code,
          owner_type,
          campaign_type
        )
      `
    )
    .eq("status", "approved")
    .is("payout_id", null)
    .order("created_at", { ascending: false })
    .limit(50);

  const payouts = (payoutsData ?? []) as PartnerPayout[];
  const approvedRewards = (approvedRewardsData ?? []) as ReferralReward[];

  const pendingPayouts = payouts.filter((payout) => payout.status === "pending").length;
  const approvedPayouts = payouts.filter((payout) => payout.status === "approved").length;
  const processingPayouts = payouts.filter(
    (payout) => payout.status === "processing"
  ).length;
  const paidPayouts = payouts.filter((payout) => payout.status === "paid").length;

  const pendingPayoutValue = payouts
    .filter((payout) => payout.status === "pending")
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);

  const paidPayoutValue = payouts
    .filter((payout) => payout.status === "paid")
    .reduce((sum, payout) => sum + Number(payout.amount || 0), 0);

  const approvedRewardValue = approvedRewards.reduce(
    (sum, reward) => sum + Number(reward.amount || 0),
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
                Payouts
              </div>

              <h1 className="mt-3 text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Partner Payouts
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Manage payout batches for approved partner, affiliate,
                ambassador, donation, and manual bonus rewards.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/admin/partners/rewards"
                className="inline-flex items-center justify-center rounded-xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Rewards
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
                Pending Payouts
              </p>
              <p className="mt-2 text-3xl font-black text-amber-950">
                {pendingPayouts}
              </p>
            </div>

            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5">
              <p className="text-sm font-bold text-blue-800">
                Approved Payouts
              </p>
              <p className="mt-2 text-3xl font-black text-blue-950">
                {approvedPayouts}
              </p>
            </div>

            <div className="rounded-2xl border border-purple-100 bg-purple-50 p-5">
              <p className="text-sm font-bold text-purple-800">Processing</p>
              <p className="mt-2 text-3xl font-black text-purple-950">
                {processingPayouts}
              </p>
            </div>

            <div className="rounded-2xl border border-green-100 bg-green-50 p-5">
              <p className="text-sm font-bold text-green-800">Paid Payouts</p>
              <p className="mt-2 text-3xl font-black text-green-950">
                {paidPayouts}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1fr_360px] lg:px-10">
        <div className="space-y-6">
          {payoutsError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">Could not load payouts</h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading partner payouts:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {payoutsError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Payout batches
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Recent payouts
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Showing latest 50 payout rows.
                </p>
              </div>

              {payouts.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    💵
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No payout batches yet
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Payout batches will appear here after approved rewards are
                    grouped into manual or automated payouts.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {payouts.map((payout) => (
                    <article
                      key={payout.id}
                      className="overflow-hidden rounded-2xl border border-green-100 bg-[#fbfaf6]"
                    >
                      <div className="flex flex-col gap-4 border-b border-green-100 bg-white p-5 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                            {payoutTypeIcon(payout.payout_type)}
                          </div>

                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <span
                                className={`rounded-full border px-3 py-1 text-xs font-black ${statusClasses(
                                  payout.status
                                )}`}
                              >
                                {formatLabel(payout.status)}
                              </span>

                              <span className="rounded-full border border-green-200 bg-green-50 px-3 py-1 text-xs font-black text-green-800">
                                {formatLabel(payout.payout_type)}
                              </span>

                              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-black text-blue-800">
                                {formatLabel(payout.payout_method)}
                              </span>
                            </div>

                            <h3 className="mt-3 text-2xl font-black text-green-950">
                              {getPayoutRecipient(payout)}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              Created {formatDateTime(payout.created_at)}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-[#fbfaf6] px-5 py-4 text-right">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Amount
                          </p>
                          <p className="mt-1 text-3xl font-black text-green-950">
                            {formatMoney(payout.amount, payout.currency)}
                          </p>
                        </div>
                      </div>

                      <div className="grid gap-4 p-5 md:grid-cols-3">
                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Recipient
                          </p>
                          <p className="mt-2 break-words text-sm font-bold text-slate-900">
                            {payout.recipient_email ||
                              payout.partners?.email ||
                              payout.ambassadors?.email ||
                              "Not provided"}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Payout Period
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {formatDate(payout.payout_period_start)} →{" "}
                            {formatDate(payout.payout_period_end)}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-green-100 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wide text-green-700">
                            Paid At
                          </p>
                          <p className="mt-2 text-sm font-bold text-slate-900">
                            {formatDateTime(payout.paid_at)}
                          </p>
                        </div>
                      </div>

                      {payout.admin_notes ? (
                        <div className="border-t border-green-100 p-5">
                          <div className="rounded-2xl border border-green-100 bg-white p-4">
                            <p className="text-xs font-black uppercase tracking-wide text-green-700">
                              Admin Notes
                            </p>
                            <p className="mt-2 text-sm leading-6 text-slate-700">
                              {payout.admin_notes}
                            </p>
                          </div>
                        </div>
                      ) : null}
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}

          {approvedRewardsError ? (
            <div className="rounded-[1.5rem] border border-red-200 bg-red-50 p-6 text-red-900">
              <h2 className="text-xl font-black">
                Could not load approved rewards
              </h2>
              <p className="mt-2 text-sm leading-6">
                Supabase returned an error while loading approved rewards:
              </p>
              <pre className="mt-4 overflow-auto rounded-xl bg-white p-4 text-xs">
                {approvedRewardsError.message}
              </pre>
            </div>
          ) : (
            <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-[0.22em] text-green-700">
                    Ready for payout
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-green-950">
                    Approved rewards without payout batch
                  </h2>
                </div>

                <p className="text-sm font-semibold text-slate-500">
                  Showing latest 50 approved rewards.
                </p>
              </div>

              {approvedRewards.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-green-100 bg-[#fbfaf6] p-8 text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-3xl">
                    🎁
                  </div>
                  <h3 className="mt-4 text-xl font-black text-green-950">
                    No approved rewards ready for payout
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Rewards marked approved and not assigned to a payout batch
                    will appear here.
                  </p>
                </div>
              ) : (
                <div className="mt-6 grid gap-4">
                  {approvedRewards.map((reward) => (
                    <article
                      key={reward.id}
                      className="rounded-2xl border border-green-100 bg-[#fbfaf6] p-5"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-2xl">
                            {payoutTypeIcon(reward.reward_type)}
                          </div>

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

                            <h3 className="mt-3 text-xl font-black text-green-950">
                              {getRewardRecipient(reward)}
                            </h3>

                            <p className="mt-1 text-sm text-slate-600">
                              Created {formatDateTime(reward.created_at)}
                            </p>
                          </div>
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
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="rounded-[1.5rem] border border-green-100 bg-green-950 p-6 text-white shadow-xl shadow-green-950/15">
            <h2 className="text-2xl font-black">Payout Summary</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Pending Payout Value
                </p>
                <p className="mt-2 text-3xl font-black">
                  {formatMoney(pendingPayoutValue)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Paid Payout Value
                </p>
                <p className="mt-2 text-3xl font-black">
                  {formatMoney(paidPayoutValue)}
                </p>
              </div>

              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-sm font-bold text-green-100">
                  Approved Rewards Ready
                </p>
                <p className="mt-2 text-3xl font-black">
                  {formatMoney(approvedRewardValue)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] border border-green-100 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-black text-green-950">
              Payout Workflow
            </h2>

            <div className="mt-5 space-y-3">
              {[
                "Review approved rewards",
                "Group rewards by partner or ambassador",
                "Create payout batch",
                "Approve payout",
                "Send payment manually or through provider",
                "Mark payout paid",
                "Mark related rewards paid",
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
                href="/admin/partners/rewards"
                className="block rounded-xl border border-green-200 bg-[#fbfaf6] px-4 py-3 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Rewards
              </Link>

              <Link
                href="/admin/partners/campaigns"
                className="block rounded-xl border border-green-200 bg-[#fbfaf6] px-4 py-3 text-center text-sm font-black text-green-900 transition hover:border-green-800 hover:bg-green-50"
              >
                Campaigns
              </Link>

              <Link
                href="/admin/partners"
                className="block rounded-xl bg-green-800 px-4 py-3 text-center text-sm font-black text-white transition hover:bg-green-900"
              >
                Partner Overview
              </Link>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
