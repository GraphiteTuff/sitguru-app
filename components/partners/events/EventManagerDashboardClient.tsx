"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Copy,
  Eye,
  MapPin,
  MoreHorizontal,
  Plus,
  Share2,
  AlertTriangle,
} from "lucide-react";
import {
  cancelPartnerEvent,
  createPartnerEventDraft,
  deletePartnerEventDraft,
  duplicatePartnerEvent,
} from "@/app/partners/dashboard/community/events/actions";
import {
  formatEventDateRange,
  formatEventLocationInline,
  getEventCardImage,
} from "@/lib/community/format";
import { computeEventQualityScore } from "@/lib/community/event-quality";
import type {
  CommandCenterRange,
  PartnerCommandCenterStats,
  PartnerEventCardMetrics,
} from "@/lib/community/event-command-center";
import type { PartnerAccount } from "@/lib/community/partner-access";
import type { CommunityEventRow, PartnerEventTab } from "@/lib/community/types";
import { getPublicEventPath } from "@/lib/community/slug";

const RANGE_OPTIONS: { id: CommandCenterRange; label: string }[] = [
  { id: "month", label: "This month" },
  { id: "30d", label: "Last 30 days" },
  { id: "90d", label: "Last 90 days" },
  { id: "all", label: "All time" },
];

const TABS: { id: PartnerEventTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
  { id: "pending", label: "Pending" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

function greetingForNow(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function statusClass(status: string) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-800 border-emerald-100";
    case "pending_review":
    case "approved":
      return "bg-sky-50 text-sky-900 border-sky-100";
    case "changes_requested":
      return "bg-amber-50 text-amber-900 border-amber-100";
    case "cancelled":
      return "bg-red-50 text-red-800 border-red-100";
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

function filterEventsByTab(events: CommunityEventRow[], tab: PartnerEventTab) {
  const now = Date.now();
  switch (tab) {
    case "drafts":
      return events.filter((e) => e.status === "draft");
    case "pending":
      return events.filter((e) =>
        ["pending_review", "changes_requested", "approved"].includes(e.status),
      );
    case "published":
      return events.filter((e) => e.status === "published");
    case "cancelled":
      return events.filter((e) => e.status === "cancelled");
    case "past":
      return events.filter(
        (e) => new Date(e.start_at).getTime() < now && e.status !== "draft",
      );
    case "upcoming":
    default:
      return events.filter(
        (e) =>
          new Date(e.start_at).getTime() >= now - 6 * 60 * 60 * 1000 &&
          ["draft", "pending_review", "changes_requested", "approved", "published"].includes(
            e.status,
          ),
      );
  }
}

function MetricBar({
  label,
  value,
  max,
  tone = "emerald",
}: {
  label: string;
  value: number;
  max: number;
  tone?: "emerald" | "sky" | "amber";
}) {
  const pct = max > 0 ? Math.max(6, Math.round((value / max) * 100)) : 6;
  const bar =
    tone === "sky"
      ? "bg-sky-500"
      : tone === "amber"
        ? "bg-amber-500"
        : "bg-emerald-600";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm font-bold text-slate-700">
        <span>{label}</span>
        <span className="tabular-nums text-slate-950">{value.toLocaleString()}</span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full ${bar}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function EventManagerDashboardClient({
  partner,
  events,
  initialStats,
  initialTab = "upcoming",
}: {
  partner: PartnerAccount;
  events: CommunityEventRow[];
  initialStats: PartnerCommandCenterStats;
  initialTab?: PartnerEventTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<PartnerEventTab>(initialTab);
  const [range, setRange] = useState<CommandCenterRange>(initialStats.range);
  const [stats, setStats] = useState(initialStats);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [creating, startCreate] = useTransition();
  const [loadingRange, startRange] = useTransition();

  const displayName =
    partner.contact_name?.split(" ")[0] ||
    partner.business_name ||
    "Event Manager";

  const metricsById = useMemo(() => {
    const map = new Map<string, PartnerEventCardMetrics>();
    for (const row of stats.perEvent) map.set(row.eventId, row);
    return map;
  }, [stats.perEvent]);

  const visibleEvents = useMemo(
    () => filterEventsByTab(events, tab),
    [events, tab],
  );

  const maxPerf = Math.max(stats.views, stats.interested, stats.shares, 1);

  function loadRange(next: CommandCenterRange) {
    setRange(next);
    startRange(async () => {
      try {
        const response = await fetch(
          `/api/partners/events/command-center?range=${next}`,
        );
        const payload = await response.json();
        if (response.ok && payload.stats) {
          setStats(payload.stats as PartnerCommandCenterStats);
        }
      } catch {
        // keep current
      }
    });
  }

  function createEvent() {
    startCreate(async () => {
      const result = await createPartnerEventDraft({
        title: "New Pet Event",
      });
      if (result.ok && result.event) {
        router.push(
          `/partners/dashboard/community/events/${result.event.id}/edit`,
        );
      }
    });
  }

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Header */}
      <section className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            SitGuru · Pet Event Manager
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            {greetingForNow()}, {displayName}
          </h1>
          <p className="mt-1 text-lg font-black text-slate-800">
            Pet Event Manager Dashboard
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Create, manage, promote, and measure your pet-friendly events across
            SitGuru.
          </p>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={createEvent}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white shadow-sm transition hover:bg-emerald-900 disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "Create Event"}
        </button>
      </section>

      {/* Stats */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {RANGE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              disabled={loadingRange}
              onClick={() => loadRange(option.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                range === option.id
                  ? "bg-emerald-700 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:border-emerald-300"
              }`}
            >
              {option.label}
            </button>
          ))}
          {loadingRange ? (
            <span className="text-xs font-bold text-slate-500">Updating…</span>
          ) : null}
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            { label: "Upcoming Events", value: stats.upcoming },
            { label: "Event Views", value: stats.views },
            { label: "RSVPs / Interested", value: stats.interested },
            { label: "Shares", value: stats.shares },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-[1.35rem] border border-slate-200 bg-white p-4 shadow-sm"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
                {card.label}
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums tracking-tight text-slate-950">
                {card.value.toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Your Events */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-slate-950">
              Your Events
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Manage details, view live pages, and share without digging through menus.
            </p>
          </div>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
                tab === item.id
                  ? "bg-emerald-700 text-white"
                  : "bg-white text-slate-700 ring-1 ring-slate-200"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {visibleEvents.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-black text-slate-900">
              No events in this view yet
            </p>
            <p className="mt-2 text-sm font-semibold text-slate-600">
              Create a polished SitGuru Partner Event in a couple of minutes.
            </p>
            <button
              type="button"
              onClick={createEvent}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
            >
              <Plus className="h-4 w-4" />
              Create Event
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {visibleEvents.map((event) => {
              const imageUrl = getEventCardImage(event);
              const timing = formatEventDateRange(
                event.start_at,
                event.end_at,
                event.timezone,
              );
              const metrics = metricsById.get(event.id);
              const quality = computeEventQualityScore(event, partner);
              const menuOpen = menuOpenId === event.id;

              return (
                <article
                  key={event.id}
                  className="overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-sm"
                >
                  <div className="grid gap-0 lg:grid-cols-[220px_minmax(0,1fr)]">
                    <div className="relative min-h-[160px] bg-emerald-50 lg:min-h-full">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt={event.title}
                          fill
                          className="object-cover"
                          sizes="220px"
                        />
                      ) : (
                        <div className="flex h-full min-h-[160px] items-center justify-center text-sm font-black text-emerald-800/70">
                          Add cover photo
                        </div>
                      )}
                    </div>

                    <div className="space-y-4 p-5 sm:p-6">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                              {event.title}
                            </h3>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] ${statusClass(event.status)}`}
                            >
                              {event.status.replace(/_/g, " ")}
                            </span>
                            <span className="rounded-full bg-[#0D5C3A] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.08em] text-white">
                              SitGuru Partner Event
                            </span>
                          </div>
                          <p className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <CalendarDays className="h-4 w-4 text-emerald-700" />
                            {timing.dateLabel} · {timing.timeLabel}
                          </p>
                          <p className="mt-1 inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                            <MapPin className="h-4 w-4 text-emerald-700" />
                            {formatEventLocationInline(event)}
                          </p>
                          <p className="mt-3 text-sm font-bold text-slate-700">
                            {(metrics?.views || 0).toLocaleString()} views ·{" "}
                            {(metrics?.interested || 0).toLocaleString()}{" "}
                            interested ·{" "}
                            {(metrics?.shares || 0).toLocaleString()} shares
                          </p>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            aria-label="More actions"
                            onClick={() =>
                              setMenuOpenId(menuOpen ? null : event.id)
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          {menuOpen ? (
                            <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-2xl border border-slate-200 bg-white py-1 shadow-lg">
                              <Link
                                href={`/partners/dashboard/community/events/${event.id}/edit`}
                                className="block px-4 py-2.5 text-sm font-bold text-slate-800 hover:bg-slate-50"
                              >
                                Edit
                              </Link>
                              <button
                                type="button"
                                className="block w-full px-4 py-2.5 text-left text-sm font-bold text-slate-800 hover:bg-slate-50"
                                onClick={() =>
                                  void duplicatePartnerEvent(event.id).then(() =>
                                    router.refresh(),
                                  )
                                }
                              >
                                Duplicate
                              </button>
                              {event.status !== "cancelled" &&
                              event.status !== "draft" ? (
                                <button
                                  type="button"
                                  className="block w-full px-4 py-2.5 text-left text-sm font-bold text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    void cancelPartnerEvent(event.id).then(() =>
                                      router.refresh(),
                                    )
                                  }
                                >
                                  Cancel
                                </button>
                              ) : null}
                              {event.status === "draft" ? (
                                <button
                                  type="button"
                                  className="block w-full px-4 py-2.5 text-left text-sm font-bold text-red-700 hover:bg-red-50"
                                  onClick={() =>
                                    void deletePartnerEventDraft(event.id).then(
                                      () => router.refresh(),
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      </div>

                      {(event.status === "draft" ||
                        event.status === "changes_requested") && (
                        <div className="rounded-2xl border border-amber-100 bg-amber-50/80 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-black text-amber-950">
                              Event Setup — {quality.percent}% Complete
                            </p>
                            <Link
                              href={`/partners/dashboard/community/events/${event.id}/edit`}
                              className="text-sm font-black text-emerald-800 hover:underline"
                            >
                              Complete your event →
                            </Link>
                          </div>
                          <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                            {quality.checks.slice(0, 8).map((check) => (
                              <li
                                key={check.id}
                                className="inline-flex items-center gap-2 text-xs font-bold text-amber-950/90"
                              >
                                {check.done ? (
                                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-700" />
                                ) : (
                                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                )}
                                {check.done ? check.label : `Add ${check.label.toLowerCase()}`}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2">
                        <Link
                          href={`/partners/dashboard/community/events/${event.id}/edit`}
                          className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
                        >
                          Manage Event
                        </Link>
                        {event.status === "published" ? (
                          <Link
                            href={getPublicEventPath(event.slug)}
                            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800"
                          >
                            <Eye className="h-4 w-4" />
                            View Live
                          </Link>
                        ) : null}
                        <Link
                          href={`/partners/dashboard/community/events/${event.id}/promote`}
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800"
                        >
                          <Share2 className="h-4 w-4" />
                          Share
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            void duplicatePartnerEvent(event.id).then(() =>
                              router.refresh(),
                            )
                          }
                          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800"
                        >
                          <Copy className="h-4 w-4" />
                          Duplicate
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        {/* Performance */}
        <section
          data-performance
          className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-700" />
            <h2 className="text-xl font-black text-slate-950">Event Performance</h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { label: "Event views", value: stats.views },
              { label: "Interested / RSVPs", value: stats.interested },
              { label: "Shares", value: stats.shares },
              { label: "Website clicks", value: stats.clicks },
              {
                label: "Pet Parents going",
                value: stats.petParents,
              },
              { label: "Gurus going", value: stats.gurus },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3"
              >
                <p className="text-2xl font-black tabular-nums text-slate-950">
                  {item.value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs font-bold text-slate-600">{item.label}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
            <MetricBar label="Views" value={stats.views} max={maxPerf} />
            <MetricBar
              label="Interested"
              value={stats.interested}
              max={maxPerf}
              tone="sky"
            />
            <MetricBar
              label="Shares"
              value={stats.shares}
              max={maxPerf}
              tone="amber"
            />
          </div>

          {stats.viewsByDay.length > 0 ? (
            <div className="mt-6">
              <p className="mb-3 text-sm font-black text-slate-800">Views over time</p>
              <div className="flex h-28 items-end gap-1.5">
                {stats.viewsByDay.map((day) => {
                  const maxDay = Math.max(
                    ...stats.viewsByDay.map((d) => d.views),
                    1,
                  );
                  const h = Math.max(8, Math.round((day.views / maxDay) * 100));
                  return (
                    <div
                      key={day.date}
                      className="flex flex-1 flex-col items-center justify-end gap-1"
                      title={`${day.date}: ${day.views}`}
                    >
                      <div
                        className="w-full rounded-t-md bg-emerald-600/90"
                        style={{ height: `${h}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm font-semibold text-slate-500">
              Views over time will appear after Pet Parents open your live event pages.
            </p>
          )}
        </section>

        {/* Interest + Reach */}
        <div className="space-y-6">
          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">Community Interest</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {stats.interested.toLocaleString()} people interested
            </p>
            <ul className="mt-4 space-y-2 text-sm font-bold text-slate-700">
              <li className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Pet Parents</span>
                <span className="tabular-nums">{stats.petParents}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Gurus</span>
                <span className="tabular-nums">{stats.gurus}</span>
              </li>
              <li className="flex justify-between rounded-xl bg-slate-50 px-3 py-2">
                <span>Ambassadors</span>
                <span className="tabular-nums">{stats.ambassadors}</span>
              </li>
            </ul>
            <Link
              href="/help/account/update-community-events"
              className="mt-4 inline-flex text-sm font-black text-emerald-800 hover:underline"
            >
              How to update events →
            </Link>
          </section>

          <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-black text-slate-950">
              SitGuru Pet Events Reach
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Your Partner Events are currently visible in:
            </p>
            <ul className="mt-4 space-y-2">
              {stats.reachLabels.map((label) => (
                <li
                  key={label}
                  className="inline-flex w-full items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-950"
                >
                  <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                  {label}
                </li>
              ))}
            </ul>
            <Link
              href="/contact?topic=community-markets"
              className="mt-4 inline-flex text-sm font-black text-emerald-800 hover:underline"
            >
              Request additional market →
            </Link>
          </section>
        </div>
      </div>

      {/* Promotion + Organizer */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Promotion Center</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Share to social, download assets, and copy your live event link.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {visibleEvents[0] || events.find((e) => e.status === "published") ? (
              <Link
                href={`/partners/dashboard/community/events/${
                  (visibleEvents[0] ||
                    events.find((e) => e.status === "published")!).id
                }/promote`}
                className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
              >
                Open Promotion Center
              </Link>
            ) : (
              <button
                type="button"
                onClick={createEvent}
                className="inline-flex min-h-11 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
              >
                Create an event to promote
              </button>
            )}
            <Link
              href="/community"
              className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800"
            >
              Preview Pet Events map
            </Link>
          </div>
        </section>

        <section className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-black text-slate-950">Your Organization</h2>
          <p className="mt-2 text-lg font-black text-slate-900">
            {partner.business_name || "Your organization"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {[partner.city, partner.state].filter(Boolean).join(", ") ||
              "Add your city and state"}
          </p>
          <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-600">
            {partner.website ? <li>{partner.website}</li> : null}
            {partner.email ? <li>{partner.email}</li> : null}
            {partner.phone ? <li>{partner.phone}</li> : null}
          </ul>
          <Link
            href="/partners/dashboard/community/organization"
            className="mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-800"
          >
            Edit Organizer Profile
          </Link>
        </section>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 px-3 py-2 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-1">
          <Link
            href="/partners/dashboard/community/events"
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-black text-emerald-800"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => setTab("upcoming")}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-black text-slate-600"
          >
            Events
          </button>
          <button
            type="button"
            onClick={createEvent}
            className="-mt-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#0D5C3A] text-white shadow-lg"
            aria-label="Create Event"
          >
            <Plus className="h-6 w-6" />
          </button>
          <a
            href="#performance"
            onClick={(e) => {
              e.preventDefault();
              document
                .querySelector("[data-performance]")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-black text-slate-600"
          >
            Analytics
          </a>
          <Link
            href="/partners/dashboard/community/organization"
            className="flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-black text-slate-600"
          >
            Account
          </Link>
        </div>
      </nav>
    </div>
  );
}
