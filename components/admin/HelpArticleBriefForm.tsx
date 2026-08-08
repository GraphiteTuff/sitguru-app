"use client";

/**
 * Prefill + publish Help Center article briefs from chat friction flags.
 */

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { HelpCenterArticleBrief } from "@/lib/actions/admin-reporting";
import type { HelpCategory } from "@/lib/help/articles";

const CATEGORIES: HelpCategory[] = [
  "Pet Parent Support",
  "Guru Success & Training Hub",
  "Billing & Refunds",
  "Account & Profiles",
  "Booking & Cancellations",
  "Trust & Safety",
];

async function getAdminBearer() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || "";
}

export function HelpArticleBriefForm({
  initialBrief,
  briefs,
}: {
  initialBrief: HelpCenterArticleBrief;
  briefs: HelpCenterArticleBrief[];
}) {
  const [selectedId, setSelectedId] = useState(initialBrief.insightId);
  const selected = useMemo(
    () =>
      briefs.find((brief) => brief.insightId === selectedId) || initialBrief,
    [briefs, initialBrief, selectedId],
  );
  const [title, setTitle] = useState(selected.title);
  const [summary, setSummary] = useState(selected.summary);
  const [solution, setSolution] = useState(selected.solution);
  const [category, setCategory] = useState<HelpCategory>(selected.category);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [articleHref, setArticleHref] = useState("");
  const [pending, startTransition] = useTransition();

  function applyBrief(brief: HelpCenterArticleBrief) {
    setSelectedId(brief.insightId);
    setTitle(brief.title);
    setSummary(brief.summary);
    setSolution(brief.solution);
    setCategory(brief.category);
    setError("");
    setSuccess("");
    setArticleHref("");
  }

  function onPublish() {
    setError("");
    setSuccess("");
    startTransition(async () => {
      try {
        if (!selected.insightId || selected.insightId === "draft") {
          setError("Pick a live friction insight before publishing.");
          return;
        }
        const token = await getAdminBearer();
        const response = await fetch("/api/admin/insights/convert", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            insightId: selected.insightId,
            title,
            summary,
            solution,
            category,
            audience: selected.audience || "all",
            tags: selected.tags,
          }),
        });
        const payload = (await response.json().catch(() => ({}))) as {
          ok?: boolean;
          error?: string;
          article?: { href?: string; slug?: string };
        };
        if (!response.ok || !payload.ok) {
          setError(payload.error || "Failed to publish Help article.");
          return;
        }
        setSuccess("Help article published.");
        setArticleHref(
          payload.article?.href ||
            (payload.article?.slug
              ? `/help/insights/${payload.article.slug}`
              : ""),
        );
      } catch (publishError) {
        setError(
          publishError instanceof Error
            ? publishError.message
            : "Failed to publish Help article.",
        );
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="rounded-2xl border border-slate-200 bg-white p-4">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
          Friction briefs
        </p>
        <ul className="mt-3 space-y-2">
          {briefs.length === 0 ? (
            <li className="text-sm text-slate-500">No friction briefs yet.</li>
          ) : (
            briefs.map((brief) => (
              <li key={brief.insightId}>
                <button
                  type="button"
                  onClick={() => applyBrief(brief)}
                  className={`w-full rounded-xl px-3 py-2 text-left text-sm transition ${
                    selectedId === brief.insightId
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-50 text-slate-700 hover:bg-emerald-50"
                  }`}
                >
                  <span className="line-clamp-2 font-semibold">{brief.title}</span>
                  <span
                    className={`mt-1 block text-[11px] ${
                      selectedId === brief.insightId
                        ? "text-emerald-50"
                        : "text-slate-500"
                    }`}
                  >
                    {brief.category}
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      </aside>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-700">Insight:</span>{" "}
            {selected.insightId}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Session:</span>{" "}
            {selected.sessionId || "—"}
          </p>
          <p>
            <span className="font-semibold text-slate-700">User:</span>{" "}
            {selected.userId || "—"}
          </p>
        </div>

        <label className="block text-sm font-semibold text-slate-800">
          Title
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-800">
          Category
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as HelpCategory)
            }
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-800">
          Summary
          <textarea
            value={summary}
            onChange={(event) => setSummary(event.target.value)}
            rows={3}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <label className="mt-4 block text-sm font-semibold text-slate-800">
          Solution body
          <textarea
            value={solution}
            onChange={(event) => setSolution(event.target.value)}
            rows={10}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-950">
          <span className="font-semibold">Friction snippet:</span>{" "}
          {selected.frictionSnippet || "—"}
        </div>

        {error ? (
          <p className="mt-4 text-sm font-semibold text-rose-600">{error}</p>
        ) : null}
        {success ? (
          <p className="mt-4 text-sm font-semibold text-emerald-700">
            {success}{" "}
            {articleHref ? (
              <Link href={articleHref} className="underline">
                View article
              </Link>
            ) : null}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onPublish}
            disabled={pending}
            className="rounded-xl bg-[#0D5C3A] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-emerald-800 disabled:opacity-60"
          >
            {pending ? "Publishing…" : "Publish Help article"}
          </button>
          <Link
            href="/api/admin/diagnostics/conversion-leak"
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-emerald-300"
          >
            Open conversion diagnostics JSON
          </Link>
        </div>
      </section>
    </div>
  );
}
