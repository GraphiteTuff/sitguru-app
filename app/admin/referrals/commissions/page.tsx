"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type ReferralCommission = {
  id: string;
  referral_id?: string | null;
  referrer_profile_id?: string | null;
  referred_profile_id?: string | null;
  booking_id?: string | null;
  referral_type: "provider_referral" | "customer_referral";
  payout_method:
    | "percent_of_platform_fee"
    | "percent_of_booking_total"
    | "fixed_amount";
  booking_total?: number | null;
  platform_fee?: number | null;
  percent_value?: number | null;
  fixed_amount?: number | null;
  calculated_payout: number;
  approved_payout?: number | null;
  admin_override: boolean;
  status: "pending" | "approved" | "paid" | "rejected" | "canceled";
  notes?: string | null;
  created_at?: string | null;
  approved_at?: string | null;
  paid_at?: string | null;
  approved_by?: string | null;
  paid_by?: string | null;
};

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function StatCard({
  label,
  value,
  subtext,
}: {
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <p className="text-sm font-semibold text-slate-500">{label}</p>
      <p className="mt-3 text-3xl sm:text-4xl font-black tracking-tight text-slate-900">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-600">{subtext}</p>
    </Card>
  );
}

function formatMoney(value?: number | null) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDateTime(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusClasses(status?: string | null) {
  const normalized = (status || "").toLowerCase();

  if (normalized === "approved") {
    return "bg-green-50 text-green-700 border border-green-200";
  }

  if (normalized === "paid") {
    return "bg-blue-50 text-blue-700 border border-blue-200";
  }

  if (normalized === "rejected" || normalized === "canceled") {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  return "bg-amber-50 text-amber-700 border border-amber-200";
}

function getReferralTypeLabel(type?: string | null) {
  if (type === "provider_referral") return "Guru Referral";
  if (type === "customer_referral") return "Customer Referral";
  return type || "—";
}

export default function AdminReferralCommissionsPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [commissions, setCommissions] = useState<ReferralCommission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  async function loadPage() {
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/admin/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      router.push("/admin/login");
      return;
    }

    setAdminProfile(profile as AdminProfile);

    const { data, error: commissionError } = await supabase
      .from("referral_commissions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);

    if (commissionError) {
      setError(commissionError.message);
      setLoading(false);
      return;
    }

    setCommissions((data as ReferralCommission[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateLocalCommission<K extends keyof ReferralCommission>(
    id: string,
    field: K,
    value: ReferralCommission[K]
  ) {
    setCommissions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function logAdjustment(params: {
    commissionId: string;
    oldPayout?: number | null;
    newPayout?: number | null;
    oldMethod?: string | null;
    newMethod?: string | null;
    reason?: string | null;
  }) {
    if (!adminProfile?.id) return;

    await supabase.from("referral_commission_adjustments").insert({
      commission_id: params.commissionId,
      admin_profile_id: adminProfile.id,
      old_payout: params.oldPayout ?? null,
      new_payout: params.newPayout ?? null,
      old_method: params.oldMethod ?? null,
      new_method: params.newMethod ?? null,
      reason: params.reason ?? null,
    });
  }

  async function saveOverride(item: ReferralCommission) {
    setProcessingId(item.id);
    setError("");
    setSuccess("");

    const existing = commissions.find((c) => c.id === item.id);

    const approvedPayout =
      item.approved_payout !== null && item.approved_payout !== undefined
        ? Number(item.approved_payout)
        : Number(item.calculated_payout || 0);

    const { error } = await supabase
      .from("referral_commissions")
      .update({
        payout_method: item.payout_method,
        percent_value:
          item.payout_method === "fixed_amount" ? null : Number(item.percent_value || 0),
        fixed_amount:
          item.payout_method === "fixed_amount" ? Number(item.fixed_amount || 0) : null,
        approved_payout: approvedPayout,
        admin_override: true,
        notes: item.notes || null,
      })
      .eq("id", item.id);

    if (error) {
      setProcessingId(null);
      setError(error.message);
      return;
    }

    await logAdjustment({
      commissionId: item.id,
      oldPayout: existing?.approved_payout ?? existing?.calculated_payout ?? null,
      newPayout: approvedPayout,
      oldMethod: existing?.payout_method ?? null,
      newMethod: item.payout_method,
      reason: item.notes || "Manual admin override",
    });

    setProcessingId(null);
    setSuccess("Commission override saved");
    await loadPage();
  }

  async function approveCommission(item: ReferralCommission) {
    if (!adminProfile?.id) return;

    setProcessingId(item.id);
    setError("");
    setSuccess("");

    const approvedPayout =
      item.approved_payout !== null && item.approved_payout !== undefined
        ? Number(item.approved_payout)
        : Number(item.calculated_payout || 0);

    const { error } = await supabase
      .from("referral_commissions")
      .update({
        approved_payout: approvedPayout,
        status: "approved",
        approved_at: new Date().toISOString(),
        approved_by: adminProfile.id,
        notes: item.notes || null,
      })
      .eq("id", item.id);

    setProcessingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Commission approved");
    await loadPage();
  }

  async function rejectCommission(item: ReferralCommission) {
    if (!adminProfile?.id) return;

    setProcessingId(item.id);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("referral_commissions")
      .update({
        status: "rejected",
        approved_by: adminProfile.id,
        approved_at: new Date().toISOString(),
        notes: item.notes || null,
      })
      .eq("id", item.id);

    setProcessingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Commission rejected");
    await loadPage();
  }

  async function markPaid(item: ReferralCommission) {
    if (!adminProfile?.id) return;

    setProcessingId(item.id);
    setError("");
    setSuccess("");

    const approvedPayout =
      item.approved_payout !== null && item.approved_payout !== undefined
        ? Number(item.approved_payout)
        : Number(item.calculated_payout || 0);

    const { error } = await supabase
      .from("referral_commissions")
      .update({
        status: "paid",
        approved_payout: approvedPayout,
        paid_at: new Date().toISOString(),
        paid_by: adminProfile.id,
        notes: item.notes || null,
      })
      .eq("id", item.id);

    setProcessingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Commission marked as paid");
    await loadPage();
  }

  const filteredCommissions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return commissions.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (item.status || "").toLowerCase() === statusFilter.toLowerCase();

      const haystack = [
        item.id,
        item.referral_id,
        item.booking_id,
        item.referrer_profile_id,
        item.referred_profile_id,
        item.referral_type === "provider_referral" ? "guru referral" : item.referral_type,
        item.payout_method,
        item.status,
        item.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = query ? haystack.includes(query) : true;

      return matchesStatus && matchesSearch;
    });
  }, [commissions, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = commissions.filter((c) => c.status === "pending");
    const approved = commissions.filter((c) => c.status === "approved");
    const paid = commissions.filter((c) => c.status === "paid");
    const rejected = commissions.filter((c) => c.status === "rejected");

    const totalCalculated = commissions.reduce(
      (sum, item) => sum + Number(item.calculated_payout || 0),
      0
    );

    const totalApproved = commissions.reduce(
      (sum, item) => sum + Number(item.approved_payout || 0),
      0
    );

    const totalPaid = paid.reduce(
      (sum, item) =>
        sum +
        Number(
          item.approved_payout !== null && item.approved_payout !== undefined
            ? item.approved_payout
            : item.calculated_payout || 0
        ),
      0
    );

    const guruReferralCount = commissions.filter(
      (c) => c.referral_type === "provider_referral"
    ).length;

    const customerReferralCount = commissions.filter(
      (c) => c.referral_type === "customer_referral"
    ).length;

    return {
      total: commissions.length,
      pending: pending.length,
      approved: approved.length,
      paid: paid.length,
      rejected: rejected.length,
      totalCalculated,
      totalApproved,
      totalPaid,
      guruReferralCount,
      customerReferralCount,
    };
  }, [commissions]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading commissions...</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru Admin</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Referral Commission Approvals
            </h1>
            <p className="mt-2 text-slate-600">
              Review, override, approve, reject, and mark referral payouts as paid.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/referrals"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Referrals
            </Link>
            <Link
              href="/admin/referrals/settings"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Referral Settings
            </Link>
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <Card className="p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </Card>
        ) : null}

        {success ? (
          <Card className="p-4">
            <p className="text-sm font-semibold text-emerald-700">{success}</p>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Total Commissions"
            value={String(stats.total)}
            subtext="All payout records"
          />
          <StatCard
            label="Pending"
            value={String(stats.pending)}
            subtext="Awaiting admin review"
          />
          <StatCard
            label="Approved"
            value={String(stats.approved)}
            subtext={formatMoney(stats.totalApproved)}
          />
          <StatCard
            label="Paid"
            value={String(stats.paid)}
            subtext={formatMoney(stats.totalPaid)}
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Rejected"
            value={String(stats.rejected)}
            subtext="Not approved for payout"
          />
          <StatCard
            label="Calculated Total"
            value={formatMoney(stats.totalCalculated)}
            subtext="System-generated payout value"
          />
          <StatCard
            label="Guru Referral Commissions"
            value={String(stats.guruReferralCount)}
            subtext="From guru referrals"
          />
          <StatCard
            label="Customer Referral Commissions"
            value={String(stats.customerReferralCount)}
            subtext="From referred customer bookings"
          />
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search commissions
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by IDs, referral type, payout method, or notes..."
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          {filteredCommissions.length > 0 ? (
            filteredCommissions.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900">
                          Commission #{item.id.slice(0, 8)}
                        </h2>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                        {item.admin_override ? (
                          <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                            Override
                          </span>
                        ) : null}
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-900">Referral Type:</span>{" "}
                          {getReferralTypeLabel(item.referral_type)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Booking ID:</span>{" "}
                          {item.booking_id || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Referral ID:</span>{" "}
                          {item.referral_id || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Referrer Profile:</span>{" "}
                          {item.referrer_profile_id || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Referred Profile:</span>{" "}
                          {item.referred_profile_id || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Created:</span>{" "}
                          {formatDateTime(item.created_at)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Approved At:</span>{" "}
                          {formatDateTime(item.approved_at)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Paid At:</span>{" "}
                          {formatDateTime(item.paid_at)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Booking Total</p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {formatMoney(item.booking_total)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Platform Fee</p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {formatMoney(item.platform_fee)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Calculated</p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {formatMoney(item.calculated_payout)}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">Approved</p>
                        <p className="mt-2 text-lg font-black text-slate-900">
                          {formatMoney(
                            item.approved_payout !== null &&
                              item.approved_payout !== undefined
                              ? item.approved_payout
                              : item.calculated_payout
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Payout Method
                        </label>
                        <select
                          value={item.payout_method}
                          onChange={(e) =>
                            updateLocalCommission(
                              item.id,
                              "payout_method",
                              e.target.value as ReferralCommission["payout_method"]
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        >
                          <option value="percent_of_platform_fee">
                            Percent of Platform Fee
                          </option>
                          <option value="percent_of_booking_total">
                            Percent of Booking Total
                          </option>
                          <option value="fixed_amount">Fixed Amount</option>
                        </select>
                      </div>

                      {item.payout_method === "fixed_amount" ? (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Fixed Amount
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.fixed_amount ?? 0}
                            onChange={(e) =>
                              updateLocalCommission(
                                item.id,
                                "fixed_amount",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="mb-2 block text-sm font-semibold text-slate-700">
                            Percent Value
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={item.percent_value ?? 0}
                            onChange={(e) =>
                              updateLocalCommission(
                                item.id,
                                "percent_value",
                                Number(e.target.value)
                              )
                            }
                            className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                          />
                        </div>
                      )}

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Approved Payout
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={
                            item.approved_payout !== null && item.approved_payout !== undefined
                              ? item.approved_payout
                              : item.calculated_payout
                          }
                          onChange={(e) =>
                            updateLocalCommission(
                              item.id,
                              "approved_payout",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Admin Notes
                        </label>
                        <textarea
                          rows={7}
                          value={item.notes || ""}
                          onChange={(e) =>
                            updateLocalCommission(item.id, "notes", e.target.value)
                          }
                          placeholder="Reason for change, approval notes, payout details..."
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                        <p className="font-semibold text-slate-900">Override preview</p>
                        <p className="mt-2">
                          Method: <span className="font-medium">{item.payout_method}</span>
                        </p>
                        <p className="mt-1">
                          Final payout:{" "}
                          <span className="font-medium">
                            {formatMoney(
                              item.approved_payout !== null &&
                                item.approved_payout !== undefined
                                ? item.approved_payout
                                : item.calculated_payout
                            )}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                    <button
                      onClick={() => saveOverride(item)}
                      disabled={processingId === item.id}
                      className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {processingId === item.id ? "Saving..." : "Save Override"}
                    </button>

                    <div className="flex flex-wrap gap-3">
                      {item.status !== "approved" && item.status !== "paid" ? (
                        <button
                          onClick={() => approveCommission(item)}
                          disabled={processingId === item.id}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {processingId === item.id ? "Working..." : "Approve"}
                        </button>
                      ) : null}

                      {item.status !== "rejected" && item.status !== "paid" ? (
                        <button
                          onClick={() => rejectCommission(item)}
                          disabled={processingId === item.id}
                          className="inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {processingId === item.id ? "Working..." : "Reject"}
                        </button>
                      ) : null}

                      {item.status === "approved" ? (
                        <button
                          onClick={() => markPaid(item)}
                          disabled={processingId === item.id}
                          className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                          {processingId === item.id ? "Working..." : "Mark Paid"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8">
              <p className="text-slate-600">No commissions found for the current filters.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}