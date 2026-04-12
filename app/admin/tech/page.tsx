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

type BookingRow = {
  id: string;
  pet_name?: string | null;
  service?: string | null;
  status?: string | null;
  price?: number | null;
};

type TechIssueRow = {
  id: string;
  issue_number?: string | null;
  title?: string | null;
  description?: string | null;
  category?: string | null;
  severity?: string | null;
  status?: string | null;
  assigned_team?: string | null;
  related_profile_id?: string | null;
  related_booking_id?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EnrichedIssue = TechIssueRow & {
  relatedProfileName: string;
  relatedBookingLabel: string;
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
  if (!profile) return "No linked user";
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
  if (value === "investigating") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (value === "queued") return "border border-slate-200 bg-slate-100 text-slate-700";
  if (value === "in_progress") return "border border-cyan-200 bg-cyan-50 text-cyan-700";
  if (value === "resolved") return "border border-emerald-200 bg-emerald-50 text-emerald-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export default function AdminTechPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [issues, setIssues] = useState<EnrichedIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [updatingIssueId, setUpdatingIssueId] = useState<string | null>(null);

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
      { data: issueRows, error: issuesError },
      { data: profileRows, error: profilesError },
      { data: bookingRows, error: bookingsError },
    ] = await Promise.all([
      supabase
        .from("tech_issues")
        .select(
          "id, issue_number, title, description, category, severity, status, assigned_team, related_profile_id, related_booking_id, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(300),
      supabase.from("profiles").select("id, role, first_name, last_name").limit(1000),
      supabase.from("bookings").select("id, pet_name, service, status, price").limit(1000),
    ]);

    if (issuesError || profilesError || bookingsError) {
      setError(
        issuesError?.message ||
          profilesError?.message ||
          bookingsError?.message ||
          "Unable to load tech issues.",
      );
      setLoading(false);
      return;
    }

    const safeIssues = (issueRows as TechIssueRow[]) || [];
    const safeProfiles = (profileRows as ProfileRow[]) || [];
    const safeBookings = (bookingRows as BookingRow[]) || [];

    const profileMap = new Map<string, ProfileRow>();
    safeProfiles.forEach((item) => {
      profileMap.set(item.id, item);
    });

    const bookingMap = new Map<string, BookingRow>();
    safeBookings.forEach((item) => {
      bookingMap.set(item.id, item);
    });

    const enriched: EnrichedIssue[] = safeIssues.map((issue) => {
      const relatedProfile = issue.related_profile_id ? profileMap.get(issue.related_profile_id) : null;
      const relatedBooking = issue.related_booking_id ? bookingMap.get(issue.related_booking_id) : null;

      const relatedBookingLabel = relatedBooking
        ? `${relatedBooking.pet_name || "Pet"}${relatedBooking.service ? ` • ${relatedBooking.service}` : ""}${relatedBooking.price ? ` • ${formatMoney(relatedBooking.price)}` : ""}`
        : issue.related_booking_id
          ? `Booking ${issue.related_booking_id.slice(0, 8)}`
          : "No linked booking";

      return {
        ...issue,
        relatedProfileName: getProfileName(relatedProfile),
        relatedBookingLabel,
      };
    });

    setIssues(enriched);
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-tech-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tech_issues" },
        () => {
          void loadPage();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id]);

  async function updateIssueStatus(issueId: string, nextStatus: string) {
    setUpdatingIssueId(issueId);
    setError("");

    const { error: updateError } = await supabase
      .from("tech_issues")
      .update({ status: nextStatus })
      .eq("id", issueId);

    setUpdatingIssueId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadPage();
  }

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const haystack = [
        issue.issue_number,
        issue.title,
        issue.description,
        issue.category,
        issue.assigned_team,
        issue.relatedProfileName,
        issue.relatedBookingLabel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || String(issue.status || "").toLowerCase() === statusFilter;
      const matchesSeverity =
        severityFilter === "all" || String(issue.severity || "").toLowerCase() === severityFilter;

      return matchesQuery && matchesStatus && matchesSeverity;
    });
  }, [issues, query, statusFilter, severityFilter]);

  const stats = useMemo(() => {
    return {
      total: issues.length,
      open: issues.filter((i) => String(i.status || "").toLowerCase() === "open").length,
      critical: issues.filter((i) => String(i.severity || "").toLowerCase() === "critical").length,
      investigating: issues.filter((i) => String(i.status || "").toLowerCase() === "investigating").length,
      resolvedToday: issues.filter((i) => {
        const status = String(i.status || "").toLowerCase();
        if (status !== "resolved") return false;
        const updated = i.updated_at ? new Date(i.updated_at) : null;
        if (!updated) return false;
        const now = new Date();
        return (
          updated.getFullYear() === now.getFullYear() &&
          updated.getMonth() === now.getMonth() &&
          updated.getDate() === now.getDate()
        );
      }).length,
    };
  }, [issues]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading tech issues...</p>
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
              Tech Ops
            </h1>
            <p className="mt-2 text-slate-600">
              Engineering, incidents, bugs, payments issues, auth issues, and platform operations.
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
            <p className="text-sm font-semibold text-slate-500">Open Issues</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.open}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Critical Alerts</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.critical}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Investigating</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.investigating}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Resolved Today</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.resolvedToday}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px_220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search issue number, title, team, category, user, or booking"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="investigating">Investigating</option>
              <option value="queued">Queued</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
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
          {filteredIssues.length > 0 ? (
            filteredIssues.map((issue) => (
              <Card key={issue.id} className="p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900">
                          {issue.title || "Untitled issue"}
                        </h2>

                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {issue.issue_number || issue.id.slice(0, 8)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${severityClasses(issue.severity)}`}
                        >
                          {issue.severity || "medium"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(issue.status)}`}
                        >
                          {issue.status || "open"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Team:</span>{" "}
                        {issue.assigned_team || "Unassigned"}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Category:</span>{" "}
                        {issue.category || "bug"}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Linked user:</span>{" "}
                        {issue.relatedProfileName}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Linked booking:</span>{" "}
                        {issue.relatedBookingLabel}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={updatingIssueId === issue.id}
                        onClick={() => updateIssueStatus(issue.id, "investigating")}
                        className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        Investigate
                      </button>
                      <button
                        disabled={updatingIssueId === issue.id}
                        onClick={() => updateIssueStatus(issue.id, "in_progress")}
                        className="rounded-full border border-cyan-300 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 hover:bg-cyan-50 disabled:opacity-60"
                      >
                        In Progress
                      </button>
                      <button
                        disabled={updatingIssueId === issue.id}
                        onClick={() => updateIssueStatus(issue.id, "resolved")}
                        className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-7 text-slate-700">
                      {issue.description || "No technical issue description saved yet."}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>Created: {formatDateTime(issue.created_at)}</span>
                    <span>Updated: {formatDateTime(issue.updated_at)}</span>
                    <span>{timeAgo(issue.updated_at)}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-black text-slate-900">No tech issues found</h3>
              <p className="mt-2 text-sm text-slate-600">Try another search or filter.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}