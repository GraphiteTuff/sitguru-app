"use client";

/**
 * Omnichannel Chat Insights panel — channel tabs + convert drawer.
 */

import { useMemo, useState, useTransition } from "react";
import { supabase } from "@/lib/supabase";
import type { HelpCategory } from "@/lib/help/articles";
import type { ChatChannelSource } from "@/lib/chat/insights";

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
};

type ChannelFilter = "ALL" | ChatChannelSource;
type SortKey = "tally" | "topic" | "recent" | "question";

const CATEGORIES: HelpCategory[] = [
  "Pet Parent Support",
  "Guru Success & Training Hub",
  "Billing & Refunds",
  "Account & Profiles",
  "Booking & Cancellations",
  "Trust & Safety",
];

const CHANNEL_LABELS: Record<string, string> = {
  HOMEPAGE_LEAD: "Homepage Lead",
  ACTIVE_WALK: "Active Walk",
  ADMIN_SUPPORT: "Admin Support",
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

export default function ChatInsightsPanel({
  initialInsights,
}: {
  initialInsights: GlobalInsightRow[];
}) {
  const [insights, setInsights] = useState(initialInsights);
  const [channel, setChannel] = useState<ChannelFilter>("ALL");
  const [sortKey, setSortKey] = useState<SortKey>("tally");
  const [active, setActive] = useState<GlobalInsightRow | null>(null);
  const [title, setTitle] = useState("");
  const [solution, setSolution] = useState("");
  const [category, setCategory] = useState<HelpCategory>("Pet Parent Support");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const rows =
      channel === "ALL"
        ? [...insights]
        : insights.filter((row) => row.channel_source_enum === channel);

    rows.sort((a, b) => {
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
    return rows;
  }, [insights, channel, sortKey]);

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
          `Committed! Live at ${json.href || `/help/insights/${json.slug}`}`,
        );
        setTimeout(() => closeDrawer(), 900);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Publish failed.");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {(
          [
            ["ALL", "All channels"],
            ["HOMEPAGE_LEAD", "Homepage Lead"],
            ["ACTIVE_WALK", "Active Walk"],
            ["ADMIN_SUPPORT", "Admin Support"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setChannel(key)}
            className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
              channel === key
                ? "bg-[#0D5C3A] text-white"
                : "border border-emerald-200 bg-white text-emerald-900 hover:bg-emerald-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-slate-600">Sort</span>
        {(
          [
            ["tally", "Tally"],
            ["topic", "Topic"],
            ["recent", "Recent"],
            ["question", "Question"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSortKey(key)}
            className={`rounded-full px-3 py-1.5 text-xs font-bold transition ${
              sortKey === key
                ? "bg-emerald-800 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-[#0D5C3A]/[0.07] text-xs font-black uppercase tracking-wide text-emerald-950">
              <tr>
                <th className="px-4 py-3">Question Summary</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Channel</th>
                <th className="px-4 py-3">Tally</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    No omnichannel insights in this filter yet.
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.insight_id}
                    className="border-t border-emerald-50 align-top hover:bg-emerald-50/40"
                  >
                    <td className="max-w-md px-4 py-3 font-medium text-slate-800">
                      {row.core_question_summary}
                      {row.is_friction_flag ? (
                        <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-rose-700">
                          Friction
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-900">
                        {row.ai_assigned_category}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-bold ${channelBadgeClass(
                          String(row.channel_source_enum),
                        )}`}
                      >
                        {CHANNEL_LABELS[String(row.channel_source_enum)] ||
                          row.channel_source_enum}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-black text-[#0D5C3A]">
                      {row.frequency_tally_count}
                    </td>
                    <td className="px-4 py-3">
                      {row.is_converted_to_article ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800">
                          Published
                          {row.converted_article_slug
                            ? ` · ${row.converted_article_slug}`
                            : ""}
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openConvert(row)}
                          className="rounded-full bg-[#0D5C3A] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-[#09462c]"
                        >
                          🚀 Instant Convert to Help Article
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
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
                  Staging drawer
                </p>
                <h3 className="mt-1 text-lg font-black text-slate-900">
                  Instant Help Article
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

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              <p className="rounded-xl bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
                <span className="font-bold">Source:</span>{" "}
                {CHANNEL_LABELS[String(active.channel_source_enum)] ||
                  active.channel_source_enum}
                <br />
                <span className="font-bold">Question:</span>{" "}
                {active.core_question_summary}
              </p>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Article title
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-100"
                />
              </label>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Category
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as HelpCategory)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-[#0D5C3A]"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-bold uppercase tracking-wide text-slate-500">
                Expert solution guide
                <textarea
                  rows={12}
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-emerald-200 px-3 py-2 text-sm leading-6 text-slate-800 outline-none focus:border-[#0D5C3A] focus:ring-2 focus:ring-emerald-100"
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
                className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={pending || !title.trim() || !solution.trim()}
                onClick={commitPublish}
                className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold text-white disabled:opacity-40"
              >
                {pending ? "Committing…" : "Commit"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
