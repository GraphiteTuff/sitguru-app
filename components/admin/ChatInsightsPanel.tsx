"use client";

/**
 * Omnichannel Chat Insights panel — searchable ledger + convert drawer.
 */

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { HelpCategory } from "@/lib/help/articles";
import type { ChatChannelSource } from "@/lib/chat/insights";
import {
  INSIGHT_COMPANION_META,
  normalizeCompanionKey,
  pageLabel,
  parseHitMap,
  primaryCompanionKey,
  primaryPagePath,
  rankedHits,
  type CompanionHitMap,
  type PageHitMap,
} from "@/lib/chat/insight-provenance";

export type GlobalInsightRow = {
  insight_id: string;
  core_question_summary: string;
  ai_assigned_category: string;
  channel_source_enum: ChatChannelSource | string;
  frequency_tally_count: number;
  is_converted_to_article: boolean;
  is_friction_flag?: boolean;
  updated_at: string;
  converted_article_slug?: string | null;
  companion_hits?: CompanionHitMap | null;
  page_hits?: PageHitMap | null;
  last_companion_key?: string | null;
  last_source_page_path?: string | null;
};

type ChannelFilter = "ALL" | ChatChannelSource;
type CompanionFilter = "ALL" | "rogue" | "scout" | "taco";
type SortKey = "tally" | "topic" | "recent" | "question";

const COMPANION_FILTERS: Array<{
  key: CompanionFilter;
  label: string;
}> = [
  { key: "ALL", label: "All avatars" },
  { key: "rogue", label: "Rogue" },
  { key: "scout", label: "Scout" },
  { key: "taco", label: "Taco" },
];

const CATEGORIES: HelpCategory[] = [
  "Pet Parent Support",
  "Guru Success & Training Hub",
  "Billing & Refunds",
  "Account & Profiles",
  "Booking & Cancellations",
  "Trust & Safety",
];

const CHANNEL_LABELS: Record<string, string> = {
  HOMEPAGE_LEAD: "Homepage",
  ACTIVE_WALK: "Live walk",
  ADMIN_SUPPORT: "Admin support",
};

async function getAdminBearer(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

function channelBadgeClass(channel: string) {
  if (channel === "HOMEPAGE_LEAD") return "bg-emerald-100 text-emerald-900";
  if (channel === "ACTIVE_WALK") return "bg-sky-100 text-sky-900";
  if (channel === "ADMIN_SUPPORT") return "bg-violet-100 text-violet-900";
  return "bg-slate-100 text-slate-700";
}

function formatUpdated(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function compactQuestion(text: string, max = 160) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  if (!value) return "—";
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1)}…`;
}

function resolveRowProvenance(row: GlobalInsightRow) {
  const companionHits = parseHitMap(row.companion_hits);
  const pageHits = parseHitMap(row.page_hits);
  const channel = String(row.channel_source_enum);
  const companionKey = primaryCompanionKey({
    channel,
    lastCompanion: row.last_companion_key,
    companionHits,
  });
  const pagePath = primaryPagePath({
    channel,
    lastPage: row.last_source_page_path,
    pageHits,
  });
  return {
    companionKey,
    companionMeta: INSIGHT_COMPANION_META[companionKey],
    companionHits: rankedHits(companionHits),
    pagePath,
    pageHits: rankedHits(pageHits),
  };
}

function CompanionAvatar({
  companionKey,
  size = 36,
}: {
  companionKey: string;
  size?: number;
}) {
  const key = normalizeCompanionKey(companionKey);
  const meta = INSIGHT_COMPANION_META[key];
  if (!meta.avatarSrc) {
    return (
      <div
        className="flex items-center justify-center rounded-full bg-slate-200 text-xs font-black text-slate-600"
        style={{ height: size, width: size }}
        title={meta.label}
      >
        ?
      </div>
    );
  }
  return (
    <Image
      src={meta.avatarSrc}
      alt={`${meta.label} — ${meta.title}`}
      width={size}
      height={size}
      className="rounded-full border border-emerald-100 bg-white object-cover"
      style={{
        height: size,
        width: size,
        objectPosition: meta.objectPosition || "50% 50%",
      }}
    />
  );
}

function ProvenanceBlock({ row }: { row: GlobalInsightRow }) {
  const provenance = resolveRowProvenance(row);
  const extras = provenance.companionHits.filter(
    (hit) => normalizeCompanionKey(hit.key) !== provenance.companionKey,
  );

  return (
    <div className="min-w-0 space-y-2">
      <div className="flex items-center gap-2.5">
        <CompanionAvatar companionKey={provenance.companionKey} size={32} />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">
            {provenance.companionMeta.label}
          </p>
          <p className="truncate text-xs leading-5 text-slate-500">
            {provenance.companionMeta.title}
          </p>
        </div>
      </div>
      {extras.length > 0 ? (
        <p className="line-clamp-2 text-xs leading-5 text-slate-500">
          Also asked via{" "}
          {extras
            .map((hit) => {
              const meta = INSIGHT_COMPANION_META[normalizeCompanionKey(hit.key)];
              return `${meta.label} (${hit.count}×)`;
            })
            .join(", ")}
        </p>
      ) : null}
      <div className="min-w-0 space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Source page
        </p>
        <Link
          href={provenance.pagePath || "/"}
          className="block truncate text-sm font-semibold text-[#0D5C3A] underline-offset-2 hover:underline"
          target="_blank"
          rel="noreferrer"
          title={pageLabel(provenance.pagePath)}
        >
          {pageLabel(provenance.pagePath)}
        </Link>
        {provenance.pageHits.length > 1 ? (
          <p className="line-clamp-2 text-xs leading-5 text-slate-500">
            Also seen on{" "}
            {provenance.pageHits
              .slice(1, 3)
              .map((hit) => `${hit.key} (${hit.count}×)`)
              .join(", ")}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export default function ChatInsightsPanel({
  initialInsights,
}: {
  initialInsights: GlobalInsightRow[];
}) {
  const [insights, setInsights] = useState(initialInsights);
  const [channel, setChannel] = useState<ChannelFilter>("ALL");
  const [companion, setCompanion] = useState<CompanionFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("tally");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<GlobalInsightRow | null>(null);
  const [title, setTitle] = useState("");
  const [solution, setSolution] = useState("");
  const [category, setCategory] = useState<HelpCategory>("Pet Parent Support");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    let rows =
      channel === "ALL"
        ? [...insights]
        : insights.filter((row) => row.channel_source_enum === channel);

    if (companion !== "ALL") {
      rows = rows.filter((row) => {
        const provenance = resolveRowProvenance(row);
        if (provenance.companionKey === companion) return true;
        return provenance.companionHits.some(
          (hit) => normalizeCompanionKey(hit.key) === companion,
        );
      });
    }

    const searched = needle
      ? rows.filter((row) => {
          const provenance = resolveRowProvenance(row);
          const haystack = [
            row.core_question_summary,
            row.ai_assigned_category,
            CHANNEL_LABELS[String(row.channel_source_enum)] ||
              row.channel_source_enum,
            row.converted_article_slug || "",
            provenance.companionMeta.label,
            provenance.pagePath,
            ...provenance.companionHits.map((hit) => hit.key),
            ...provenance.pageHits.map((hit) => hit.key),
          ]
            .join(" ")
            .toLowerCase();
          return haystack.includes(needle);
        })
      : rows;

    searched.sort((a, b) => {
      if (sortKey === "tally") {
        return b.frequency_tally_count - a.frequency_tally_count;
      }
      if (sortKey === "topic") {
        return a.ai_assigned_category.localeCompare(b.ai_assigned_category);
      }
      if (sortKey === "recent") {
        return (
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
      }
      return a.core_question_summary.localeCompare(b.core_question_summary);
    });
    return searched;
  }, [insights, channel, companion, sortKey, query]);

  function openConvert(row: GlobalInsightRow) {
    setActive(row);
    setError("");
    setSuccess("");
    setTitle(
      row.core_question_summary.length > 90
        ? `${row.core_question_summary.slice(0, 87)}…`
        : row.core_question_summary.replace(/\?+$/, "") || "Help article",
    );
    setSolution(
      `Here's the clear SitGuru answer to: “${row.core_question_summary}”\n\n`,
    );
    const topic = row.ai_assigned_category;
    setCategory(
      topic.includes("Guru")
        ? "Guru Success & Training Hub"
        : topic.includes("Stripe") ||
            topic.includes("Pricing") ||
            topic.includes("PawPerks")
          ? "Billing & Refunds"
          : topic.includes("Safety") || topic.includes("Leash")
            ? "Trust & Safety"
            : topic.includes("Booking")
              ? "Booking & Cancellations"
              : "Pet Parent Support",
    );
  }

  function closeDrawer() {
    setActive(null);
  }

  function commitPublish() {
    if (!active) return;
    startTransition(async () => {
      setError("");
      setSuccess("");
      try {
        const token = await getAdminBearer();
        if (!token) {
          setError("Admin session expired. Please sign in again.");
          return;
        }
        const res = await fetch("/api/admin/insights/convert", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            insightId: active.insight_id,
            title,
            summary: solution.slice(0, 400),
            solution,
            category,
            audience: "all",
            tags: [
              "omnichannel",
              String(active.channel_source_enum).toLowerCase(),
              active.ai_assigned_category.toLowerCase(),
            ],
          }),
        });
        const json = (await res.json().catch(() => null)) as {
          ok?: boolean;
          error?: string;
          href?: string;
          slug?: string;
        } | null;
        if (!res.ok || !json?.ok) {
          setError(json?.error || "Unable to publish help article.");
          return;
        }
        setInsights((prev) =>
          prev.map((row) =>
            row.insight_id === active.insight_id
              ? {
                  ...row,
                  is_converted_to_article: true,
                  converted_article_slug:
                    json.slug || row.converted_article_slug,
                }
              : row,
          ),
        );
        setSuccess(
          `Published! Live at ${json.href || `/help/insights/${json.slug}`}`,
        );
        setTimeout(() => closeDrawer(), 900);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Publish failed.");
      }
    });
  }

  return (
    <section className="min-w-0 space-y-4 sm:space-y-5">
      <div className="rounded-2xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-1">
            <h2 className="text-lg font-black tracking-tight text-slate-950 sm:text-xl">
              Question ledger
            </h2>
            <p className="text-sm leading-6 text-slate-600">
              Showing{" "}
              <span className="font-semibold text-slate-900">
                {filtered.length}
              </span>{" "}
              of {insights.length} topics
              {companion !== "ALL"
                ? ` · ${INSIGHT_COMPANION_META[companion].label}`
                : ""}
              {channel !== "ALL"
                ? ` · ${CHANNEL_LABELS[channel] || channel}`
                : ""}
              {query.trim() ? ` · matching “${query.trim()}”` : ""}
            </p>
          </div>

          <label className="relative block w-full max-w-none lg:max-w-md">
            <span className="sr-only">Search questions</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Rogue, Scout, Taco, pages…"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-[#0D5C3A] focus:bg-white focus:ring-2 focus:ring-emerald-100"
            />
          </label>
        </div>

        <div className="mt-4 space-y-3">
          <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <span className="shrink-0 text-sm font-medium text-slate-500">
              Avatar
            </span>
            {COMPANION_FILTERS.map((item) => {
              const active = companion === item.key;
              const meta =
                item.key === "ALL" ? null : INSIGHT_COMPANION_META[item.key];
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setCompanion(item.key)}
                  className={`inline-flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    active
                      ? "bg-[#0D5C3A] text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {meta?.avatarSrc ? (
                    <Image
                      src={meta.avatarSrc}
                      alt=""
                      width={20}
                      height={20}
                      className="rounded-full object-cover"
                      style={{
                        objectPosition: meta.objectPosition || "50% 50%",
                      }}
                    />
                  ) : null}
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {(
                [
                  ["ALL", "All channels"],
                  ["HOMEPAGE_LEAD", "Homepage"],
                  ["ACTIVE_WALK", "Live walk"],
                  ["ADMIN_SUPPORT", "Admin support"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setChannel(key)}
                  className={`shrink-0 rounded-full px-3 py-2 text-sm font-semibold transition ${
                    channel === key
                      ? "bg-[#0D5C3A] text-white"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="-mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <span className="shrink-0 text-sm font-medium text-slate-500">
                Sort
              </span>
              {(
                [
                  ["tally", "Most asked"],
                  ["topic", "Topic"],
                  ["recent", "Recent"],
                  ["question", "A–Z"],
                ] as const
              ).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSortKey(key)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                    sortKey === key
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile-friendly stacked cards */}
      <div className="space-y-3 lg:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-5 py-12 text-center text-sm text-slate-500">
            No insights match this filter.
          </div>
        ) : (
          filtered.map((row) => (
            <article
              key={row.insight_id}
              className="rounded-2xl border border-emerald-100 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <p
                  className="min-w-0 text-[15px] font-semibold leading-6 text-slate-900 line-clamp-4"
                  title={row.core_question_summary}
                >
                  {compactQuestion(row.core_question_summary, 220)}
                </p>
                <p className="shrink-0 rounded-xl bg-emerald-50 px-2.5 py-1 text-lg font-black tabular-nums text-[#0D5C3A]">
                  {row.frequency_tally_count}×
                </p>
              </div>

              <div className="mt-3 rounded-xl bg-slate-50 px-3 py-3">
                <ProvenanceBlock row={row} />
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                {row.is_friction_flag ? (
                  <span className="rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                    Friction
                  </span>
                ) : null}
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-900">
                  {row.ai_assigned_category}
                </span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${channelBadgeClass(
                    String(row.channel_source_enum),
                  )}`}
                >
                  {CHANNEL_LABELS[String(row.channel_source_enum)] ||
                    row.channel_source_enum}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                  Updated {formatUpdated(row.updated_at)}
                </span>
              </div>

              <div className="mt-4">
                {row.is_converted_to_article ? (
                  <span className="inline-flex rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                    Published
                    {row.converted_article_slug
                      ? ` · ${row.converted_article_slug}`
                      : ""}
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => openConvert(row)}
                    className="rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#09462c]"
                  >
                    Convert to Help article
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden min-w-0 overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm lg:block">
        <div className="max-h-[min(70vh,52rem)] overflow-auto">
          <table className="w-full min-w-[64rem] table-fixed text-left">
            <thead className="sticky top-0 z-10 border-b border-emerald-100 bg-[#f3faf6]">
              <tr className="text-sm font-semibold text-emerald-950">
                <th className="w-[34%] px-5 py-3.5 font-semibold">Question</th>
                <th className="w-[22%] px-4 py-3.5 font-semibold">Avatar & page</th>
                <th className="w-[14%] px-4 py-3.5 font-semibold">Topic</th>
                <th className="w-[10%] px-4 py-3.5 font-semibold">Channel</th>
                <th className="w-[6%] px-4 py-3.5 font-semibold">Asked</th>
                <th className="w-[8%] px-4 py-3.5 font-semibold">Updated</th>
                <th className="w-[12%] px-5 py-3.5 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-5 py-14 text-center text-sm text-slate-500"
                  >
                    No insights match this filter.
                  </td>
                </tr>
              ) : (
                filtered.map((row, index) => (
                  <tr
                    key={row.insight_id}
                    className={`border-t border-emerald-50 align-top ${
                      index % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                    } hover:bg-emerald-50/50`}
                  >
                    <td className="max-w-md px-5 py-4">
                      <p
                        className="text-[15px] font-medium leading-6 text-slate-900 line-clamp-3"
                        title={row.core_question_summary}
                      >
                        {compactQuestion(row.core_question_summary, 180)}
                      </p>
                      {row.is_friction_flag ? (
                        <span className="mt-2 inline-flex rounded-full bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                          Friction
                        </span>
                      ) : null}
                    </td>
                    <td className="w-[13.5rem] max-w-[13.5rem] px-4 py-4">
                      <ProvenanceBlock row={row} />
                    </td>
                    <td className="px-4 py-4">
                      <span className="inline-flex max-w-[11rem] rounded-full bg-emerald-50 px-2.5 py-1 text-sm font-semibold leading-5 text-emerald-900">
                        {row.ai_assigned_category}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-1 text-sm font-semibold ${channelBadgeClass(
                          String(row.channel_source_enum),
                        )}`}
                      >
                        {CHANNEL_LABELS[String(row.channel_source_enum)] ||
                          row.channel_source_enum}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className="text-lg font-black tabular-nums text-[#0D5C3A]">
                        {row.frequency_tally_count}×
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      {formatUpdated(row.updated_at)}
                    </td>
                    <td className="px-5 py-4">
                      {row.is_converted_to_article ? (
                        <div className="space-y-1">
                          <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-sm font-semibold text-emerald-800">
                            Published
                          </span>
                          {row.converted_article_slug ? (
                            <p className="max-w-[12rem] truncate text-xs text-slate-500">
                              {row.converted_article_slug}
                            </p>
                          ) : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openConvert(row)}
                          className="rounded-full bg-[#0D5C3A] px-3.5 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#09462c]"
                        >
                          Convert to article
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {active ? (
        <div
          className="fixed inset-0 z-[100] flex justify-end bg-slate-950/45"
          role="dialog"
          aria-modal="true"
          aria-label="Convert insight staging drawer"
        >
          <div className="flex h-full w-full max-w-lg flex-col border-l border-emerald-100 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-emerald-50 px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-emerald-800">
                  Convert to Help article
                </p>
                <h3 className="mt-1 text-xl font-black text-slate-900">
                  Draft & publish
                </h3>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full bg-slate-100 px-3 py-1 text-lg leading-none text-slate-600"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm leading-6 text-emerald-950">
                <div className="mb-3 rounded-lg bg-white/70 p-3">
                  <ProvenanceBlock row={active} />
                </div>
                <p>
                  <span className="font-semibold">Source:</span>{" "}
                  {CHANNEL_LABELS[String(active.channel_source_enum)] ||
                    active.channel_source_enum}
                </p>
                <p className="mt-1">
                  <span className="font-semibold">Question:</span>{" "}
                  {active.core_question_summary}
                </p>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Article title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HelpCategory)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base font-medium text-slate-900 outline-none focus:border-[#0D5C3A]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-sm font-semibold text-slate-700">
                Help Center answer
                <textarea
                  rows={12}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-base leading-7 text-slate-800 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-100"
                  placeholder="Write the official Help Center answer…"
                />
              </label>

              {error ? (
                <p className="text-sm font-semibold text-rose-600" role="alert">
                  {error}
                </p>
              ) : null}
              {success ? (
                <p className="text-sm font-semibold text-emerald-700">
                  {success}
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap justify-end gap-2 border-t border-emerald-50 px-5 py-4">
              <button
                type="button"
                onClick={closeDrawer}
                className="rounded-full border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || !title.trim() || !solution.trim()}
                onClick={commitPublish}
                className="rounded-full bg-[#0D5C3A] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-40"
              >
                {pending ? "Publishing…" : "Publish article"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
