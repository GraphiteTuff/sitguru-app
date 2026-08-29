"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  Loader2,
  MapPin,
  PawPrint,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  autosaveAdminEvent,
  createAdminEventSeriesAction,
  publishAdminEvent,
  saveCommunityEventFeaturedSettings,
} from "@/app/admin/community/events/actions";
import EventSharePanel from "@/components/community/EventSharePanel";
import {
  formatEventDateRange,
  formatEventLocationInline,
  getEventHeroImage,
} from "@/lib/community/format";
import { COMMUNITY_EVENT_CATEGORIES } from "@/lib/community/types";
import type { CommunityEventRow } from "@/lib/community/types";
import type { AdminPartnerOption } from "@/lib/community/admin-event-mutations";
import { EVENT_IMAGE_ACCEPT } from "@/lib/community/event-images";
import { getPublicEventPath } from "@/lib/community/slug";
import type { RecurrenceRule } from "@/lib/community/recurring";

type EditorStep = "basics" | "datetime" | "details" | "featured" | "preview";

function toLocalDateInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 10);
}

function toLocalTimeInput(value: string) {
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(11, 16);
}

function combineLocalDateTime(date: string, time: string) {
  if (!date || !time) return "";
  return new Date(`${date}T${time}:00`).toISOString();
}

function toDatetimeLocalInput(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-bold text-slate-800">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition ${checked ? "bg-emerald-700" : "bg-slate-200"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${checked ? "left-5" : "left-0.5"}`}
        />
      </button>
    </label>
  );
}

export default function AdminEventEditor({
  event,
  partnerName,
}: {
  event: CommunityEventRow;
  partnerName: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState(event);
  const [step, setStep] = useState<EditorStep>("basics");
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveMessage, setSaveMessage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, startSubmit] = useTransition();
  const [recurrenceRule, setRecurrenceRule] = useState<RecurrenceRule>("none");
  const [recurrenceCount, setRecurrenceCount] = useState(4);
  const [featuredStatus, setFeaturedStatus] = useState(event.featured_status || "none");
  const [featuredPriority, setFeaturedPriority] = useState(String(event.featured_priority || 0));
  const [featuredStartAt, setFeaturedStartAt] = useState(
    toDatetimeLocalInput(event.featured_start_at),
  );
  const [featuredEndAt, setFeaturedEndAt] = useState(toDatetimeLocalInput(event.featured_end_at));
  const [featuredMarketCity, setFeaturedMarketCity] = useState(event.featured_market_city || "");
  const [featuredMarketState, setFeaturedMarketState] = useState(event.featured_market_state || "");
  const skipAutosaveRef = useRef(true);

  const startDate = useMemo(() => toLocalDateInput(draft.start_at), [draft.start_at]);
  const startTime = useMemo(() => toLocalTimeInput(draft.start_at), [draft.start_at]);
  const endTime = useMemo(
    () => (draft.end_at ? toLocalTimeInput(draft.end_at) : ""),
    [draft.end_at],
  );

  const persist = useCallback(
    async (nextDraft: CommunityEventRow) => {
      setSaveState("saving");
      const result = await autosaveAdminEvent(nextDraft.id, nextDraft);

      if (!result.ok) {
        setSaveState("error");
        setSaveMessage(result.error || "Save failed");
        return;
      }

      setDraft(result.event);
      setSaveState("saved");
      setSaveMessage("Saved");
      router.refresh();
    },
    [router],
  );

  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      void persist(draft);
    }, 900);

    return () => window.clearTimeout(timer);
  }, [draft, persist]);

  async function handleImageUpload(file: File) {
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/admin/community/events/upload", {
        method: "POST",
        body: formData,
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "Upload failed");
      }

      setDraft((current) => ({
        ...current,
        image_original_url: payload.image_original_url,
        image_hero_url: payload.image_hero_url,
        image_card_url: payload.image_card_url,
        image_mobile_url: payload.image_mobile_url,
        social_square_url: payload.social_square_url,
        social_story_url: payload.social_story_url,
        social_landscape_url: payload.social_landscape_url,
        image_storage_bucket: payload.storage_bucket,
        image_storage_path: payload.storage_path,
      }));
    } catch (error) {
      setSaveState("error");
      setSaveMessage(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function toggleCategory(category: string) {
    setDraft((current) => {
      const categories = current.categories || [];
      const exists = categories.includes(category);
      return {
        ...current,
        categories: exists
          ? categories.filter((item) => item !== category)
          : [...categories, category],
      };
    });
  }

  const previewImage = getEventHeroImage(draft);
  const previewTiming = formatEventDateRange(draft.start_at, draft.end_at, draft.timezone);

  function sectionClass(stepName: EditorStep) {
    return step === stepName ? "block space-y-4" : "hidden space-y-4 lg:block";
  }

  const mobileSteps: EditorStep[] = ["basics", "datetime", "details", "featured", "preview"];

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Link href="/admin/community/events" className="text-sm font-black text-emerald-800">
            ← Pet Events
          </Link>
          <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : "Admin Editor"}
          </p>
          <h1 className="text-2xl font-black text-slate-950 sm:text-3xl">{draft.title}</h1>
          <p className="mt-1 text-sm font-semibold text-slate-600">{partnerName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {draft.status === "published" ? (
            <Link
              href={getPublicEventPath(draft.slug)}
              className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black"
            >
              View live
            </Link>
          ) : null}
          <Link
            href={`/admin/community/events/${draft.id}`}
            className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black"
          >
            Review
          </Link>
          <button
            type="button"
            disabled={submitting}
            onClick={() =>
              startSubmit(async () => {
                const result = await publishAdminEvent({
                  eventId: draft.id,
                  publishSeries: true,
                });
                if (!result.ok) {
                  setSaveState("error");
                  setSaveMessage(result.error || "Publish failed");
                  return;
                }
                setDraft(result.event);
                setSaveMessage("Published — series occurrences included when applicable.");
                router.refresh();
              })
            }
            className="inline-flex min-h-11 items-center rounded-2xl bg-emerald-700 px-5 text-sm font-black text-white disabled:opacity-60"
          >
            {submitting ? "Publishing…" : "Publish now"}
          </button>
        </div>
      </div>

      {saveMessage ? (
        <p
          className={`text-sm font-black ${saveState === "error" ? "text-red-700" : "text-emerald-800"}`}
        >
          {saveMessage}
        </p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1 lg:hidden">
        {mobileSteps.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setStep(item)}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-black capitalize ${
              step === item ? "bg-emerald-700 text-white" : "bg-white text-slate-700"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-6">
          <section className={sectionClass("basics")}>
            <div>
              <label className="text-sm font-black text-slate-800">Event Name *</label>
              <input
                value={draft.title}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, title: event.target.value }))
                }
                className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                placeholder="Pints & Pups"
              />
            </div>
            <div>
              <label className="text-sm font-black text-slate-800">Short Description *</label>
              <textarea
                value={draft.short_description || ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, short_description: event.target.value }))
                }
                rows={3}
                className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium"
              />
            </div>
            <div>
              <label className="text-sm font-black text-slate-800">Event Image *</label>
              <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
                {previewImage ? (
                  <div className="relative mb-4 aspect-[16/10] overflow-hidden rounded-2xl">
                    <Image src={previewImage} alt={draft.title} fill className="object-cover" />
                  </div>
                ) : null}
                <label className="inline-flex min-h-12 cursor-pointer items-center gap-2 rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white">
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Upload image
                  <input
                    type="file"
                    accept={EVENT_IMAGE_ACCEPT}
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleImageUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </section>

          <section className={sectionClass("datetime")}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-black text-slate-800">Date *</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      start_at: combineLocalDateTime(event.target.value, startTime || "12:00"),
                    }))
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                />
              </div>
              <div>
                <label className="text-sm font-black text-slate-800">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      start_at: combineLocalDateTime(startDate, event.target.value),
                    }))
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-black text-slate-800">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      end_at: combineLocalDateTime(startDate, event.target.value),
                    }))
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                />
              </div>
              <div>
                <label className="text-sm font-black text-slate-800">Venue *</label>
                <input
                  value={draft.venue_name || ""}
                  onChange={(event) =>
                    setDraft((current) => ({ ...current, venue_name: event.target.value }))
                  }
                  className="mt-2 min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                />
              </div>
            </div>
            <input
              value={draft.address_line_1 || ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, address_line_1: event.target.value }))
              }
              className="min-h-12 w-full rounded-2xl border border-slate-200 px-4 text-base font-semibold"
              placeholder="Street address"
            />
            <div className="grid gap-4 sm:grid-cols-3">
              <input
                value={draft.city || ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, city: event.target.value }))
                }
                className="min-h-12 rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                placeholder="City"
              />
              <input
                value={draft.state || ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, state: event.target.value }))
                }
                className="min-h-12 rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                placeholder="State"
              />
              <input
                value={draft.postal_code || ""}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, postal_code: event.target.value }))
                }
                className="min-h-12 rounded-2xl border border-slate-200 px-4 text-base font-semibold"
                placeholder="ZIP"
              />
            </div>
          </section>

          <section className={sectionClass("details")}>
            <textarea
              value={draft.description || ""}
              onChange={(event) =>
                setDraft((current) => ({ ...current, description: event.target.value }))
              }
              rows={6}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base font-medium"
              placeholder="Full description"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <ToggleRow
                label="Pet Friendly"
                checked={draft.pet_friendly}
                onChange={(value) => setDraft((current) => ({ ...current, pet_friendly: value }))}
              />
              <ToggleRow
                label="Free Event"
                checked={draft.is_free}
                onChange={(value) => setDraft((current) => ({ ...current, is_free: value }))}
              />
              <ToggleRow
                label="Family Friendly"
                checked={draft.family_friendly}
                onChange={(value) =>
                  setDraft((current) => ({ ...current, family_friendly: value }))
                }
              />
              <ToggleRow
                label="Outdoor Event"
                checked={draft.outdoor}
                onChange={(value) => setDraft((current) => ({ ...current, outdoor: value }))}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {COMMUNITY_EVENT_CATEGORIES.map((category) => {
                const active = (draft.categories || []).includes(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    className={`rounded-full px-4 py-2 text-sm font-black ${
                      active ? "bg-emerald-700 text-white" : "border border-slate-200 bg-white"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
            {!draft.parent_event_id && !draft.is_series_parent ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-black text-slate-800">Recurring series</p>
                <p className="mt-1 text-xs font-semibold text-slate-600">
                  Create draft occurrences — publishing the parent publishes the whole series.
                </p>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <select
                    value={recurrenceRule}
                    onChange={(event) => setRecurrenceRule(event.target.value as RecurrenceRule)}
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  >
                    <option value="none">Does not repeat</option>
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Every 2 weeks</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <input
                    type="number"
                    min={2}
                    max={26}
                    value={recurrenceCount}
                    onChange={(event) => setRecurrenceCount(Number(event.target.value) || 2)}
                    disabled={recurrenceRule === "none"}
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold disabled:opacity-50"
                  />
                </div>
                <button
                  type="button"
                  disabled={recurrenceRule === "none" || submitting}
                  onClick={() =>
                    startSubmit(async () => {
                      const result = await createAdminEventSeriesAction(
                        draft.id,
                        recurrenceRule,
                        recurrenceCount,
                      );
                      if (!result.ok) {
                        setSaveState("error");
                        setSaveMessage(result.error || "Unable to create series");
                        return;
                      }
                      setSaveMessage(`Created ${result.createdCount} additional occurrence(s)`);
                      router.refresh();
                    })
                  }
                  className="mt-3 inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 disabled:opacity-50"
                >
                  Create series
                </button>
              </div>
            ) : null}
          </section>

          <section className={sectionClass("featured")}>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-emerald-700" />
                <p className="text-sm font-black text-slate-900">Featured placement</p>
              </div>
              <div className="mt-4 space-y-3">
                <select
                  value={featuredStatus}
                  onChange={(event) => setFeaturedStatus(event.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                >
                  <option value="none">Not featured</option>
                  <option value="homepage">Homepage — Happening Near You</option>
                  <option value="community">Community hub</option>
                  <option value="market">Market-targeted</option>
                </select>
                <input
                  type="number"
                  value={featuredPriority}
                  onChange={(event) => setFeaturedPriority(event.target.value)}
                  className="min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  placeholder="Priority (higher first)"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    type="datetime-local"
                    value={featuredStartAt}
                    onChange={(event) => setFeaturedStartAt(event.target.value)}
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  />
                  <input
                    type="datetime-local"
                    value={featuredEndAt}
                    onChange={(event) => setFeaturedEndAt(event.target.value)}
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={featuredMarketCity}
                    onChange={(event) => setFeaturedMarketCity(event.target.value)}
                    placeholder="Market city"
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  />
                  <input
                    value={featuredMarketState}
                    onChange={(event) => setFeaturedMarketState(event.target.value)}
                    placeholder="Market state"
                    className="min-h-11 rounded-2xl border border-slate-200 px-3 text-sm font-semibold"
                  />
                </div>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() =>
                    startSubmit(async () => {
                      const result = await saveCommunityEventFeaturedSettings({
                        eventId: draft.id,
                        featuredStatus,
                        featuredPriority: Number(featuredPriority) || 0,
                        featuredStartAt: featuredStartAt
                          ? new Date(featuredStartAt).toISOString()
                          : null,
                        featuredEndAt: featuredEndAt ? new Date(featuredEndAt).toISOString() : null,
                        featuredMarketCity: featuredMarketCity || null,
                        featuredMarketState: featuredMarketState || null,
                      });
                      if (!result.ok) {
                        setSaveState("error");
                        setSaveMessage(result.error || "Featured save failed");
                        return;
                      }
                      setDraft(result.event);
                      setSaveMessage("Featured settings saved");
                    })
                  }
                  className="min-h-11 w-full rounded-2xl bg-emerald-700 px-4 text-sm font-black text-white disabled:opacity-60"
                >
                  Save featured settings
                </button>
              </div>
            </div>
          </section>

          <section
            className={
              step === "preview" ? "block space-y-4" : "hidden space-y-4 lg:block lg:col-span-2"
            }
          >
            <EventSharePanel
              title={draft.title}
              slug={draft.slug}
              startAt={draft.start_at}
              endAt={draft.end_at}
              timezone={draft.timezone}
              venueName={draft.venue_name}
              city={draft.city}
              state={draft.state}
              shortDescription={draft.short_description}
              partnerName={partnerName}
              source="admin_event_editor"
            />
          </section>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
              Live Preview
            </p>
            <div className="mt-4 overflow-hidden rounded-3xl border border-slate-100">
              {previewImage ? (
                <div className="relative aspect-[16/10]">
                  <Image src={previewImage} alt={draft.title} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex aspect-[16/10] items-center justify-center bg-emerald-50">
                  <PawPrint className="h-10 w-10 text-emerald-700/40" />
                </div>
              )}
              <div className="space-y-3 p-5">
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black capitalize">
                  {draft.status.replace(/_/g, " ")}
                </span>
                <h3 className="text-2xl font-black text-slate-950">{draft.title}</h3>
                <p className="text-sm font-semibold text-slate-600">{partnerName}</p>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <CalendarDays className="h-4 w-4 text-emerald-700" />
                  {previewTiming.dateLabel} • {previewTiming.timeLabel}
                </p>
                <p className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <MapPin className="h-4 w-4 text-emerald-700" />
                  {formatEventLocationInline(draft)}
                </p>
                <p className="text-sm text-slate-600">{draft.short_description}</p>
                {featuredStatus !== "none" ? (
                  <p className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-900">
                    <Check className="h-3.5 w-3.5" />
                    Featured ({featuredStatus})
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
