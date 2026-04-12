"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type ProfileRow = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  last_name?: string | null;
};

type SitterRow = {
  id: string;
  profile_id?: string | null;
  full_name?: string | null;
  slug?: string | null;
};

type BookingRow = {
  id: string;
  pet_name?: string | null;
  service?: string | null;
  status?: string | null;
  price?: number | null;
};

type DisputeCaseRow = {
  id: string;
  case_number?: string | null;
  booking_id?: string | null;
  customer_profile_id?: string | null;
  guru_profile_id?: string | null;
  title?: string | null;
  summary?: string | null;
  status?: string | null;
  severity?: string | null;
  resolution?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EnrichedDispute = DisputeCaseRow & {
  customerName: string;
  guruName: string;
  bookingLabel: string;
  partiesLabel: string;
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

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "Unknown user";
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return profile.role ? `${profile.role} account` : "User";
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

function timeAgo(dateString?: string | null) {
  if (!dateString) return "Recently";

  const diffMs = Date.now() - new Date(dateString).getTime();
  const mins = Math.max(1, Math.floor(diffMs / 60000));

  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day ago`;
}

function severityClasses(severity?: string | null) {
  const value = String(severity || "").toLowerCase();

  if (value === "critical") return "border border-red-200 bg-red-50 text-red-700";
  if (value === "high") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (value === "medium") return "border border-cyan-200 bg-cyan-50 text-cyan-700";
  if (value === "low") return "border border-slate-200 bg-slate-100 text-slate-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function statusClasses(status?: string | null) {
  const value = String(status || "").toLowerCase();

  if (value === "open") return "border border-red-200 bg-red-50 text-red-700";
  if (value === "reviewing") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (value === "resolved") return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "closed") return "border border-slate-200 bg-slate-100 text-slate-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export default function AdminDisputesPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [disputes, setDisputes] = useState<EnrichedDispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [updatingCaseId, setUpdatingCaseId] = useState<string | null>(null);

  async function loadPage() {
    setLoading(true);
    setError("");

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

    const [
      { data: disputeRows, error: disputesError },
      { data: profileRows, error: profilesError },
      { data: sitterRows, error: sittersError },
      { data: bookingRows, error: bookingsError },
    ] = await Promise.all([
      supabase
        .from("disputes_cases")
        .select(
          "id, case_number, booking_id, customer_profile_id, guru_profile_id, title, summary, status, severity, resolution, created_at, updated_at"
        )
        .order("updated_at", { ascending: false })
        .limit(300),
      supabase
        .from("profiles")
        .select("id, role, first_name, last_name")
        .limit(1000),
      supabase
        .from("sitters")
        .select("id, profile_id, full_name, slug")
        .limit(1000),
      supabase
        .from("bookings")
        .select("id, pet_name, service, status, price")
        .limit(1000),
    ]);

    if (disputesError || profilesError || sittersError || bookingsError) {
      setError(
        disputesError?.message ||
          profilesError?.message ||
          sittersError?.message ||
          bookingsError?.message ||
          "Unable to load disputes."
      );
      setLoading(false);
      return;
    }

    const safeDisputes = (disputeRows as DisputeCaseRow[]) || [];
    const safeProfiles = (profileRows as ProfileRow[]) || [];
    const safeSitters = (sitterRows as SitterRow[]) || [];
    const safeBookings = (bookingRows as BookingRow[]) || [];

    const profileMap = new Map<string, ProfileRow>();
    safeProfiles.forEach((item) => {
      profileMap.set(item.id, item);
    });

    const sitterByProfileMap = new Map<string, SitterRow>();
    safeSitters.forEach((item) => {
      if (item.profile_id) sitterByProfileMap.set(item.profile_id, item);
    });

    const bookingMap = new Map<string, BookingRow>();
    safeBookings.forEach((item) => {
      bookingMap.set(item.id, item);
    });

    const enriched: EnrichedDispute[] = safeDisputes.map((dispute) => {
      const customer = dispute.customer_profile_id ? profileMap.get(dispute.customer_profile_id) : null;
      const guru = dispute.guru_profile_id ? sitterByProfileMap.get(dispute.guru_profile_id) : null;
      const booking = dispute.booking_id ? bookingMap.get(dispute.booking_id) : null;

      const customerName = getProfileName(customer);
      const guruName = guru?.full_name || "Unknown guru";

      const bookingLabel = booking
        ? `${booking.pet_name || "Pet"}${booking.service ? ` • ${booking.service}` : ""}${booking.price ? ` • ${formatMoney(booking.price)}` : ""}`
        : dispute.booking_id
        ? `Booking ${dispute.booking_id.slice(0, 8)}`
        : "No linked booking";

      return {
        ...dispute,
        customerName,
        guruName,
        bookingLabel,
        partiesLabel: `${customerName} vs ${guruName}`,
      };
    });

    setDisputes(enriched);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-disputes-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "disputes_cases" },
        () => {
          void loadPage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id]);

  async function updateCaseStatus(caseId: string, nextStatus: string, resolution?: string | null) {
    setUpdatingCaseId(caseId);
    setError("");

    const payload: { status: string; resolution?: string | null } = {
      status: nextStatus,
    };

    if (typeof resolution !== "undefined") {
      payload.resolution = resolution;
    }

    const { error: updateError } = await supabase
      .from("disputes_cases")
      .update(payload)
      .eq("id", caseId);

    setUpdatingCaseId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadPage();
  }

  const filteredDisputes = useMemo(() => {
    return disputes.filter((dispute) => {
      const haystack = [
        dispute.case_number,
        dispute.title,
        dispute.summary,
        dispute.customerName,
        dispute.guruName,
        dispute.partiesLabel,
        dispute.bookingLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || String(dispute.status || "").toLowerCase() === statusFilter;
      const matchesSeverity =
        severityFilter === "all" || String(dispute.severity || "").toLowerCase() === severityFilter;

      return matchesQuery && matchesStatus && matchesSeverity;
    });
  }, [disputes, query, statusFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: disputes.length,
      open: disputes.filter((d) => String(d.status || "").toLowerCase() === "open").length,
      reviewing: disputes.filter((d) => String(d.status || "").toLowerCase() === "reviewing").length,
      resolvedThisWeek: disputes.filter((d) => {
        const status = String(d.status || "").toLowerCase();
        if (status !== "resolved") return false;
        const updated = d.updated_at ? new Date(d.updated_at) : null;
        if (!updated) return false;
        const now = new Date();
        const diffDays = (now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      }).length,
      highOrCritical: disputes.filter((d) => {
        const sev = String(d.severity || "").toLowerCase();
        return sev === "high" || sev === "critical";
      }).length,
    };
  }, [disputes]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading disputes...</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru HQ</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Disputes
            </h1>
            <p className="mt-2 text-slate-600">
              Trust, safety, legal review, booking conflicts, and issue resolution.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                void loadPage();
              }}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>
            <Link
              href="/admin"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Open Cases</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.open}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Under Review</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.reviewing}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Resolved This Week</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.resolvedThisWeek}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">High / Critical</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.highOrCritical}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px_220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search case number, title, customer, guru, booking"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="reviewing">Reviewing</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredDisputes.length > 0 ? (
            filteredDisputes.map((dispute) => (
              <Card key={dispute.id} className="p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900">
                          {dispute.title || "Untitled dispute case"}
                        </h2>

                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {dispute.case_number || dispute.id.slice(0, 8)}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClasses(dispute.severity)}`}>
                          {dispute.severity || "medium"}
                        </span>

                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(dispute.status)}`}>
                          {dispute.status || "open"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Parties:</span>{" "}
                        {dispute.partiesLabel}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Booking:</span>{" "}
                        {dispute.bookingLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={updatingCaseId === dispute.id}
                        onClick={() => updateCaseStatus(dispute.id, "reviewing")}
                        className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        Review
                      </button>
                      <button
                        disabled={updatingCaseId === dispute.id}
                        onClick={() => updateCaseStatus(dispute.id, "resolved", "Resolved by admin review")}
                        className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        Resolve
                      </button>
                      <button
                        disabled={updatingCaseId === dispute.id}
                        onClick={() => updateCaseStatus(dispute.id, "closed")}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-7 text-slate-700">
                      {dispute.summary || "No dispute summary has been added yet."}
                    </p>
                  </div>

                  {dispute.resolution ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                        Resolution
                      </p>
                      <p className="mt-2 text-sm leading-7 text-emerald-900">
                        {dispute.resolution}
                      </p>
                    </div>
                  ) : null}

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>Created: {formatDateTime(dispute.created_at)}</span>
                    <span>Updated: {formatDateTime(dispute.updated_at)}</span>
                    <span>{timeAgo(dispute.updated_at)}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-black text-slate-900">No disputes found</h3>
              <p className="mt-2 text-sm text-slate-600">Try another search or filter.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}