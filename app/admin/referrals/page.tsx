"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type ReferralLead = {
  id: string;
  referrer_sitter_id?: string | null;
  referral_code?: string | null;
  referred_name?: string | null;
  referred_email?: string | null;
  referred_role?: "sitter" | "walker" | "caretaker" | "customer" | null;
  city?: string | null;
  state?: string | null;
  notes?: string | null;
  status?: "pending" | "approved" | "rejected" | null;
  created_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
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
      <p className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-600">{subtext}</p>
    </Card>
  );
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
    return "border border-green-200 bg-green-50 text-green-700";
  }

  if (normalized === "rejected") {
    return "border border-red-200 bg-red-50 text-red-700";
  }

  return "border border-amber-200 bg-amber-50 text-amber-700";
}

function getRoleLabel(role?: string | null) {
  if (role === "sitter") return "Sitter";
  if (role === "walker") return "Walker";
  if (role === "caretaker") return "Caretaker";
  if (role === "customer") return "Customer";
  return "Unknown";
}

export default function AdminReferralsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialStatus = searchParams.get("status") || "all";

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [referrals, setReferrals] = useState<ReferralLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [processingId, setProcessingId] = useState<string | null>(null);

  async function loadReferrals() {
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

    const { data, error: referralError } = await supabase
      .from("referral_leads")
      .select(`
        id,
        referrer_sitter_id,
        referral_code,
        referred_name,
        referred_email,
        referred_role,
        city,
        state,
        notes,
        status,
        created_at,
        reviewed_at,
        reviewed_by
      `)
      .order("created_at", { ascending: false })
      .limit(500);

    if (referralError) {
      setError(referralError.message);
      setLoading(false);
      return;
    }

    setReferrals((data as ReferralLead[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadReferrals();
  }, []);

  async function handleApprove(id: string) {
    if (!adminProfile?.id) return;

    setProcessingId(id);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("referral_leads")
      .update({
        status: "approved",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminProfile.id,
      })
      .eq("id", id);

    setProcessingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Referral lead approved");
    await loadReferrals();
  }

  async function handleReject(id: string) {
    if (!adminProfile?.id) return;

    setProcessingId(id);
    setError("");
    setSuccess("");

    const { error } = await supabase
      .from("referral_leads")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminProfile.id,
      })
      .eq("id", id);

    setProcessingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("Referral lead rejected");
    await loadReferrals();
  }

  const filteredReferrals = useMemo(() => {
    const query = search.trim().toLowerCase();

    return referrals.filter((item) => {
      const matchesStatus =
        statusFilter === "all"
          ? true
          : (item.status || "").toLowerCase() === statusFilter.toLowerCase();

      const haystack = [
        item.referred_name,
        item.referred_email,
        item.referred_role,
        item.city,
        item.state,
        item.referral_code,
        item.notes,
        item.id,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = query ? haystack.includes(query) : true;

      return matchesStatus && matchesSearch;
    });
  }, [referrals, search, statusFilter]);

  const stats = useMemo(() => {
    const pending = referrals.filter((r) => (r.status || "").toLowerCase() === "pending").length;
    const approved = referrals.filter((r) => (r.status || "").toLowerCase() === "approved").length;
    const rejected = referrals.filter((r) => (r.status || "").toLowerCase() === "rejected").length;

    const sitterLeads = referrals.filter(
      (r) => (r.referred_role || "").toLowerCase() === "sitter"
    ).length;

    const walkerLeads = referrals.filter(
      (r) => (r.referred_role || "").toLowerCase() === "walker"
    ).length;

    const caretakerLeads = referrals.filter(
      (r) => (r.referred_role || "").toLowerCase() === "caretaker"
    ).length;

    const customerLeads = referrals.filter(
      (r) => (r.referred_role || "").toLowerCase() === "customer"
    ).length;

    const guruLeads = sitterLeads + walkerLeads + caretakerLeads;

    return {
      total: referrals.length,
      pending,
      approved,
      rejected,
      sitterLeads,
      walkerLeads,
      caretakerLeads,
      customerLeads,
      guruLeads,
    };
  }, [referrals]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading referrals...</p>
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
            <h1 className="mt-2 text-3xl font-black text-slate-900">Referral Leads</h1>
            <p className="mt-2 text-slate-600">
              Review, search, approve, and reject guru and customer referral leads.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
            <Link
              href="/admin/referrals/settings"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Referral Settings
            </Link>
            <Link
              href="/admin/referrals/commissions"
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Commission Approvals
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
            label="Total Referral Leads"
            value={String(stats.total)}
            subtext="All captured referral submissions"
          />
          <StatCard
            label="Pending"
            value={String(stats.pending)}
            subtext="Awaiting admin review"
          />
          <StatCard
            label="Approved"
            value={String(stats.approved)}
            subtext="Accepted into referral flow"
          />
          <StatCard
            label="Rejected"
            value={String(stats.rejected)}
            subtext="Removed from referral flow"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Guru Leads"
            value={String(stats.guruLeads)}
            subtext="Sitters, walkers, and caretakers"
          />
          <StatCard
            label="Sitters"
            value={String(stats.sitterLeads)}
            subtext="Referred sitter leads"
          />
          <StatCard
            label="Walkers"
            value={String(stats.walkerLeads)}
            subtext="Referred walker leads"
          />
          <StatCard
            label="Caretakers"
            value={String(stats.caretakerLeads)}
            subtext="Referred caretaker leads"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Customers"
            value={String(stats.customerLeads)}
            subtext="Referred customer leads"
          />
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_220px]">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Search referral leads
              </label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, role, city, state, or referral code..."
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
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>
        </Card>

        <div className="space-y-5">
          {filteredReferrals.length > 0 ? (
            filteredReferrals.map((lead) => {
              const isGuruLead =
                lead.referred_role === "sitter" ||
                lead.referred_role === "walker" ||
                lead.referred_role === "caretaker";

              return (
                <Card key={lead.id} className="p-6">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h2 className="text-xl font-black text-slate-900">
                          {lead.referred_name || "Unnamed referral"}
                        </h2>
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                            lead.status
                          )}`}
                        >
                          {lead.status || "pending"}
                        </span>
                        <span className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                          {isGuruLead ? "Guru Lead" : "Customer Lead"}
                        </span>
                      </div>

                      <div className="mt-4 grid gap-2 text-sm text-slate-600">
                        <p>
                          <span className="font-semibold text-slate-900">Email:</span>{" "}
                          {lead.referred_email || "No email"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Role:</span>{" "}
                          {getRoleLabel(lead.referred_role)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Location:</span>{" "}
                          {lead.city || "Unknown city"}, {lead.state || "Unknown state"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Referral Code:</span>{" "}
                          {lead.referral_code || "—"}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Submitted:</span>{" "}
                          {formatDateTime(lead.created_at)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Reviewed:</span>{" "}
                          {formatDateTime(lead.reviewed_at)}
                        </p>
                        <p>
                          <span className="font-semibold text-slate-900">Notes:</span>{" "}
                          {lead.notes || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {lead.status !== "approved" ? (
                        <button
                          onClick={() => handleApprove(lead.id)}
                          disabled={processingId === lead.id}
                          className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                        >
                          {processingId === lead.id ? "Working..." : "Approve"}
                        </button>
                      ) : null}

                      {lead.status !== "rejected" ? (
                        <button
                          onClick={() => handleReject(lead.id)}
                          disabled={processingId === lead.id}
                          className="inline-flex items-center justify-center rounded-full border border-red-300 bg-white px-5 py-3 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {processingId === lead.id ? "Working..." : "Reject"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </Card>
              );
            })
          ) : (
            <Card className="p-8">
              <p className="text-slate-600">No referral leads found for the current filters.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}