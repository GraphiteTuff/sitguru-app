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

type GuruRow = {
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

type SupportTicketRow = {
  id: string;
  ticket_number?: string | null;
  requester_profile_id?: string | null;
  assigned_admin_profile_id?: string | null;
  booking_id?: string | null;
  guru_profile_id?: string | null;
  category?: string | null;
  channel?: string | null;
  subject?: string | null;
  message?: string | null;
  status?: string | null;
  priority?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type SupportTicketMessageRow = {
  id: string;
  ticket_id: string;
  author_profile_id?: string | null;
  author_type?: string | null;
  body?: string | null;
  created_at?: string | null;
};

type EnrichedTicket = SupportTicketRow & {
  requesterName: string;
  guruName: string;
  assignedAdminName: string;
  bookingLabel: string;
  messageCount: number;
  latestMessageAt?: string | null;
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

function getProfileName(profile?: ProfileRow | null) {
  if (!profile) return "Unknown user";
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  return profile.role ? `${profile.role} account` : "User";
}

function statusClasses(status?: string | null) {
  const value = String(status || "").toLowerCase();

  if (value === "open") return "border border-red-200 bg-red-50 text-red-700";
  if (value === "pending") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (value === "resolved") return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "closed") return "border border-slate-200 bg-slate-100 text-slate-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

function priorityClasses(priority?: string | null) {
  const value = String(priority || "").toLowerCase();

  if (value === "urgent") return "border border-red-200 bg-red-50 text-red-700";
  if (value === "high") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (value === "normal") return "border border-cyan-200 bg-cyan-50 text-cyan-700";
  if (value === "low") return "border border-slate-200 bg-slate-100 text-slate-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export default function AdminSupportPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [tickets, setTickets] = useState<EnrichedTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [updatingTicketId, setUpdatingTicketId] = useState<string | null>(null);

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
      { data: ticketRows, error: ticketsError },
      { data: messageRows, error: messagesError },
      { data: profileRows, error: profilesError },
      { data: guruRows, error: gurusError },
      { data: bookingRows, error: bookingsError },
    ] = await Promise.all([
      supabase
        .from("support_tickets")
        .select(
          "id, ticket_number, requester_profile_id, assigned_admin_profile_id, booking_id, guru_profile_id, category, channel, subject, message, status, priority, created_at, updated_at",
        )
        .order("updated_at", { ascending: false })
        .limit(200),
      supabase
        .from("support_ticket_messages")
        .select("id, ticket_id, author_profile_id, author_type, body, created_at")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("profiles")
        .select("id, role, first_name, last_name")
        .limit(1000),
      supabase
        .from("gurus")
        .select("id, profile_id, full_name, slug")
        .limit(1000),
      supabase
        .from("bookings")
        .select("id, pet_name, service, status, price")
        .limit(1000),
    ]);

    if (ticketsError || messagesError || profilesError || gurusError || bookingsError) {
      setError(
        ticketsError?.message ||
          messagesError?.message ||
          profilesError?.message ||
          gurusError?.message ||
          bookingsError?.message ||
          "Unable to load support tickets.",
      );
      setLoading(false);
      return;
    }

    const safeTickets = (ticketRows as SupportTicketRow[]) || [];
    const safeMessages = (messageRows as SupportTicketMessageRow[]) || [];
    const safeProfiles = (profileRows as ProfileRow[]) || [];
    const safeGurus = (guruRows as GuruRow[]) || [];
    const safeBookings = (bookingRows as BookingRow[]) || [];

    const profileMap = new Map<string, ProfileRow>();
    safeProfiles.forEach((item) => {
      profileMap.set(item.id, item);
    });

    const guruByProfileMap = new Map<string, GuruRow>();
    safeGurus.forEach((item) => {
      if (item.profile_id) {
        guruByProfileMap.set(item.profile_id, item);
      }
    });

    const bookingMap = new Map<string, BookingRow>();
    safeBookings.forEach((item) => {
      bookingMap.set(item.id, item);
    });

    const messagesByTicketMap = new Map<string, SupportTicketMessageRow[]>();
    safeMessages.forEach((item) => {
      const existing = messagesByTicketMap.get(item.ticket_id) || [];
      existing.push(item);
      messagesByTicketMap.set(item.ticket_id, existing);
    });

    const enriched: EnrichedTicket[] = safeTickets.map((ticket) => {
      const requester = ticket.requester_profile_id
        ? profileMap.get(ticket.requester_profile_id)
        : null;

      const assignedAdmin = ticket.assigned_admin_profile_id
        ? profileMap.get(ticket.assigned_admin_profile_id)
        : null;

      const guruProfile = ticket.guru_profile_id
        ? guruByProfileMap.get(ticket.guru_profile_id)
        : null;

      const booking = ticket.booking_id ? bookingMap.get(ticket.booking_id) : null;
      const ticketMessages = messagesByTicketMap.get(ticket.id) || [];
      const latestMessageAt =
        ticketMessages.length > 0
          ? ticketMessages
              .map((m) => m.created_at || "")
              .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]
          : null;

      const bookingLabel = booking
        ? `${booking.pet_name || "Pet"}${booking.service ? ` • ${booking.service}` : ""}${booking.price ? ` • ${formatMoney(booking.price)}` : ""}`
        : ticket.booking_id
          ? `Booking ${ticket.booking_id.slice(0, 8)}`
          : "No linked booking";

      return {
        ...ticket,
        requesterName: getProfileName(requester),
        guruName: guruProfile?.full_name || "No guru linked",
        assignedAdminName: getProfileName(assignedAdmin),
        bookingLabel,
        messageCount: ticketMessages.length,
        latestMessageAt,
      };
    });

    setTickets(enriched);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-support-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_tickets" },
        () => {
          void loadPage();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "support_ticket_messages" },
        () => {
          void loadPage();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id]);

  async function updateTicketStatus(ticketId: string, nextStatus: string) {
    setUpdatingTicketId(ticketId);
    setError("");

    const { error: updateError } = await supabase
      .from("support_tickets")
      .update({
        status: nextStatus,
        assigned_admin_profile_id: adminProfile?.id || null,
      })
      .eq("id", ticketId);

    setUpdatingTicketId(null);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    await loadPage();
  }

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const text = [
        ticket.ticket_number,
        ticket.subject,
        ticket.message,
        ticket.requesterName,
        ticket.guruName,
        ticket.bookingLabel,
        ticket.category,
        ticket.channel,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query.trim() || text.includes(query.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || String(ticket.status || "").toLowerCase() === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || String(ticket.priority || "").toLowerCase() === priorityFilter;

      return matchesQuery && matchesStatus && matchesPriority;
    });
  }, [tickets, query, statusFilter, priorityFilter]);

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((t) => String(t.status || "").toLowerCase() === "open").length,
      pending: tickets.filter((t) => String(t.status || "").toLowerCase() === "pending").length,
      resolved: tickets.filter((t) => String(t.status || "").toLowerCase() === "resolved").length,
      urgent: tickets.filter((t) => String(t.priority || "").toLowerCase() === "urgent").length,
    };
  }, [tickets]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading support tickets...</p>
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
              Support
            </h1>
            <p className="mt-2 text-slate-600">
              Customer and guru support queue with live ticket visibility.
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

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-5">
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Total Tickets</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.total}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Open</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.open}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Pending</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.pending}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Resolved</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.resolved}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Urgent</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.urgent}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px_220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search ticket number, subject, requester, guru, booking"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              <option value="open">Open</option>
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredTickets.length > 0 ? (
            filteredTickets.map((ticket) => (
              <Card key={ticket.id} className="p-6">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-black text-slate-900">
                          {ticket.subject || "Untitled support ticket"}
                        </h2>

                        <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                          {ticket.ticket_number || ticket.id.slice(0, 8)}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(ticket.status)}`}
                        >
                          {ticket.status || "open"}
                        </span>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityClasses(ticket.priority)}`}
                        >
                          {ticket.priority || "normal"}
                        </span>
                      </div>

                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Requester:</span> {ticket.requesterName}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Guru:</span> {ticket.guruName}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Booking:</span> {ticket.bookingLabel}
                      </p>
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-slate-900">Assigned admin:</span>{" "}
                        {ticket.assignedAdminName}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        disabled={updatingTicketId === ticket.id}
                        onClick={() => updateTicketStatus(ticket.id, "pending")}
                        className="rounded-full border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        Mark Pending
                      </button>
                      <button
                        disabled={updatingTicketId === ticket.id}
                        onClick={() => updateTicketStatus(ticket.id, "resolved")}
                        className="rounded-full border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        Resolve
                      </button>
                      <button
                        disabled={updatingTicketId === ticket.id}
                        onClick={() => updateTicketStatus(ticket.id, "closed")}
                        className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                      >
                        Close
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-sm leading-7 text-slate-700">
                      {ticket.message || "No initial message saved for this ticket."}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold text-slate-500">Category</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{ticket.category || "general"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold text-slate-500">Channel</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{ticket.channel || "support"}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold text-slate-500">Messages</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">{ticket.messageCount}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-semibold text-slate-500">Updated</p>
                      <p className="mt-2 text-sm font-bold text-slate-900">
                        {timeAgo(ticket.latestMessageAt || ticket.updated_at || ticket.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
                    <span>Created: {formatDateTime(ticket.created_at)}</span>
                    <span>Updated: {formatDateTime(ticket.updated_at)}</span>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-black text-slate-900">No tickets found</h3>
              <p className="mt-2 text-sm text-slate-600">Try another search or filter.</p>
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}