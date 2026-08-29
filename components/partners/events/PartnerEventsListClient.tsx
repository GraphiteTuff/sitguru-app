"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CalendarDays,
  Copy,
  Eye,
  MapPin,
  MoreHorizontal,
  Plus,
  Share2,
  Trash2,
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
import type { CommunityEventRow, PartnerEventTab } from "@/lib/community/types";
import { getPublicEventPath } from "@/lib/community/slug";

const tabs: { id: PartnerEventTab; label: string }[] = [
  { id: "upcoming", label: "Upcoming" },
  { id: "published", label: "Published" },
  { id: "drafts", label: "Drafts" },
  { id: "pending", label: "Pending" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
];

function statusLabel(status: string) {
  return status.replace(/_/g, " ");
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
    case "draft":
    default:
      return "bg-slate-100 text-slate-700 border-slate-200";
  }
}

export default function PartnerEventsListClient({
  events,
  initialTab,
}: {
  events: CommunityEventRow[];
  initialTab: PartnerEventTab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<PartnerEventTab>(initialTab);
  const [creating, startCreate] = useTransition();

  async function refreshTab(nextTab: PartnerEventTab) {
    setTab(nextTab);
    router.push(`/partners/dashboard/community/events?tab=${nextTab}`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Partner Dashboard • Community
          </p>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">My Events</h1>
        </div>
        <button
          type="button"
          disabled={creating}
          onClick={() =>
            startCreate(async () => {
              const result = await createPartnerEventDraft({ title: "New Pet Event" });
              if (result.ok && result.event) {
                router.push(`/partners/dashboard/community/events/${result.event.id}/edit`);
              }
            })
          }
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white"
        >
          <Plus className="h-4 w-4" />
          {creating ? "Creating…" : "Create Event"}
        </button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => void refreshTab(item.id)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black ${
              tab === item.id ? "bg-emerald-700 text-white" : "bg-white text-slate-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {events.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white p-10 text-center">
          <p className="text-lg font-black text-slate-900">No events in this view yet</p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Create your first community event in a few taps.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((event) => {
            const imageUrl = getEventCardImage(event);
            const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);

            return (
              <article
                key={event.id}
                className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="relative aspect-[16/10] bg-emerald-50">
                  {imageUrl ? (
                    <Image src={imageUrl} alt={event.title} fill className="object-cover" />
                  ) : null}
                  <span
                    className={`absolute left-4 top-4 rounded-full border px-3 py-1 text-xs font-black capitalize ${statusClass(event.status)}`}
                  >
                    {statusLabel(event.status)}
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  <h2 className="text-xl font-black text-slate-950">{event.title}</h2>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <CalendarDays className="h-4 w-4 text-emerald-700" />
                    {timing.dateLabel} • {timing.timeLabel}
                  </p>
                  <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <MapPin className="h-4 w-4 text-emerald-700" />
                    {formatEventLocationInline(event)}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <Link
                      href={`/partners/dashboard/community/events/${event.id}/edit`}
                      className="inline-flex min-h-10 items-center rounded-xl bg-emerald-700 px-4 text-sm font-black text-white"
                    >
                      Edit
                    </Link>
                    {event.status === "published" ? (
                      <Link
                        href={getPublicEventPath(event.slug)}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black"
                      >
                        <Eye className="h-4 w-4" />
                        Preview
                      </Link>
                    ) : null}
                    <Link
                      href={`/partners/dashboard/community/events/${event.id}/promote`}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black"
                    >
                      <Share2 className="h-4 w-4" />
                      Promote
                    </Link>
                    <button
                      type="button"
                      onClick={() => void duplicatePartnerEvent(event.id).then(() => router.refresh())}
                      className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black"
                    >
                      <Copy className="h-4 w-4" />
                      Duplicate
                    </button>
                    {event.status !== "cancelled" && event.status !== "draft" ? (
                      <button
                        type="button"
                        onClick={() => void cancelPartnerEvent(event.id).then(() => router.refresh())}
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-black text-red-700"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                        Cancel
                      </button>
                    ) : null}
                    {event.status === "draft" ? (
                      <button
                        type="button"
                        onClick={() =>
                          void deletePartnerEventDraft(event.id).then(() => router.refresh())
                        }
                        className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-black text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete draft
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
