"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LaunchSignup = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  zip_code: string | null;
  interest_type: "customer" | "guru" | "both";
  pet_types: string | null;
  services_offered: string | null;
  notes: string | null;
  source: string;
  created_at: string;
};

type ApiResponse = {
  success?: boolean;
  error?: string;
  signups?: LaunchSignup[];
};

type InterestFilter = "all" | "customer" | "guru" | "both";

const sourceOptions = [
  { label: "All Sources", value: "all" },
  { label: "Instagram", value: "instagram" },
  { label: "Facebook", value: "facebook" },
  { label: "TikTok", value: "tiktok" },
  { label: "Direct", value: "direct" },
  { label: "Referral", value: "referral" },
  { label: "Email", value: "email" },
];

const interestOptions: { label: string; value: InterestFilter }[] = [
  { label: "All Interest Types", value: "all" },
  { label: "Customer", value: "customer" },
  { label: "Guru", value: "guru" },
  { label: "Both", value: "both" },
];

function formatInterestType(value: LaunchSignup["interest_type"]) {
  if (value === "customer") return "Customer";
  if (value === "guru") return "Guru";
  return "Both";
}

function formatSource(value: string) {
  if (!value) return "Direct";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }

  return date.toLocaleString();
}

function badgeClasses(type: string) {
  switch (type) {
    case "customer":
      return "border-violet-400/20 bg-violet-400/10 text-violet-200";
    case "guru":
      return "border-sky-400/20 bg-sky-400/10 text-sky-200";
    case "both":
      return "border-emerald-400/20 bg-emerald-400/10 text-emerald-200";
    case "instagram":
      return "border-pink-400/20 bg-pink-400/10 text-pink-200";
    case "facebook":
      return "border-blue-400/20 bg-blue-400/10 text-blue-200";
    case "tiktok":
      return "border-cyan-400/20 bg-cyan-400/10 text-cyan-200";
    case "direct":
      return "border-amber-400/20 bg-amber-400/10 text-amber-200";
    case "referral":
      return "border-rose-400/20 bg-rose-400/10 text-rose-200";
    case "email":
      return "border-slate-300/20 bg-slate-300/10 text-slate-200";
    default:
      return "border-white/10 bg-white/5 text-slate-200";
  }
}

function SummaryCard({
  title,
  value,
  subtext,
  toneClass,
}: {
  title: string;
  value: string;
  subtext: string;
  toneClass: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-[0_10px_40px_rgba(0,0,0,0.18)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
        {title}
      </p>
      <p className="mt-3 text-3xl font-black tracking-tight text-white">{value}</p>
      <div
        className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${toneClass}`}
      >
        Live
      </div>
      <p className="mt-3 text-sm text-slate-400">{subtext}</p>
    </div>
  );
}

export default function AdminLaunchSignupsPage() {
  const [signups, setSignups] = useState<LaunchSignup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [interestFilter, setInterestFilter] = useState<InterestFilter>("all");
  const [limit, setLimit] = useState("50");

  useEffect(() => {
    async function loadSignups() {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();

        if (sourceFilter !== "all") {
          params.set("source", sourceFilter);
        }

        if (interestFilter !== "all") {
          params.set("interestType", interestFilter);
        }

        if (search.trim()) {
          params.set("search", search.trim());
        }

        if (limit) {
          params.set("limit", limit);
        }

        const queryString = params.toString();
        const url = queryString
          ? `/api/launch-signup?${queryString}`
          : "/api/launch-signup";

        const response = await fetch(url, {
          cache: "no-store",
        });

        const data = (await response.json().catch(() => null)) as ApiResponse | null;

        if (!response.ok) {
          throw new Error(data?.error || "Unable to load launch signups.");
        }

        setSignups(data?.signups || []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Something went wrong while loading launch signups."
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadSignups();
  }, [search, sourceFilter, interestFilter, limit]);

  const totals = useMemo(() => {
    const total = signups.length;
    const customers = signups.filter((item) => item.interest_type === "customer").length;
    const gurus = signups.filter((item) => item.interest_type === "guru").length;
    const both = signups.filter((item) => item.interest_type === "both").length;
    const instagram = signups.filter((item) => item.source === "instagram").length;

    return {
      total,
      customers,
      gurus,
      both,
      instagram,
    };
  }, [signups]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.10),_transparent_30%),radial-gradient(circle_at_right,_rgba(14,165,233,0.10),_transparent_28%),linear-gradient(to_bottom_right,_#020617,_#0f172a,_#111827)] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-slate-950 to-sky-500/10 p-6 shadow-[0_12px_60px_rgba(0,0,0,0.28)] lg:p-8">
          <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-4xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-300">
                SitGuru Launch Funnel
              </p>
              <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
                Early-access signups, sources, and launch interest in one view.
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base">
                Review live signups captured through the homepage, Instagram,
                Facebook, TikTok, referral links, and direct traffic while the
                platform continues to build.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Back to Admin
              </Link>
              <Link
                href="/admin/messages"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Messages
              </Link>
              <Link
                href="/"
                className="rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
              >
                Open Live Site
              </Link>
            </div>
          </div>
        </section>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
          <SummaryCard
            title="Total Signups"
            value={String(totals.total)}
            subtext="Current rows returned by the live launch signup API."
            toneClass="border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          />
          <SummaryCard
            title="Customers"
            value={String(totals.customers)}
            subtext="People interested as pet parents."
            toneClass="border-violet-400/20 bg-violet-400/10 text-violet-200"
          />
          <SummaryCard
            title="Gurus"
            value={String(totals.gurus)}
            subtext="People interested in becoming Gurus."
            toneClass="border-sky-400/20 bg-sky-400/10 text-sky-200"
          />
          <SummaryCard
            title="Both"
            value={String(totals.both)}
            subtext="People interested as customer and Guru."
            toneClass="border-emerald-400/20 bg-emerald-400/10 text-emerald-200"
          />
          <SummaryCard
            title="Instagram"
            value={String(totals.instagram)}
            subtext="Tracked through ?source=instagram."
            toneClass="border-pink-400/20 bg-pink-400/10 text-pink-200"
          />
        </div>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_50px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Filters
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Search and narrow launch signups
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Filter by source, interest type, and search text to review lead quality
                and see which channels are performing best.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-4">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Search
              </label>
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Name, email, zip, notes..."
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(event) => setSourceFilter(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Interest Type
              </label>
              <select
                value={interestFilter}
                onChange={(event) =>
                  setInterestFilter(event.target.value as InterestFilter)
                }
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              >
                {interestOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-slate-900">
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-300">
                Limit
              </label>
              <select
                value={limit}
                onChange={(event) => setLimit(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none transition focus:border-emerald-400"
              >
                {["25", "50", "100", "200"].map((option) => (
                  <option key={option} value={option} className="bg-slate-900">
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_50px_rgba(0,0,0,0.2)]">
          <div className="flex flex-col gap-4 border-b border-white/10 pb-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Live Results
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-white">
                Launch signup submissions
              </h2>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-400">
                Newest entries appear first. This section is powered by your live
                launch signup API route.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/api/launch-signup"
                className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                Open API
              </Link>
            </div>
          </div>

          {error ? (
            <div className="mt-6 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm font-medium text-rose-200">
              {error}
            </div>
          ) : null}

          {isLoading ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-10 text-center text-sm font-medium text-slate-300">
              Loading launch signups...
            </div>
          ) : signups.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-10 text-center text-sm font-medium text-slate-300">
              No launch signups found for the current filters.
            </div>
          ) : (
            <div className="mt-6 overflow-hidden rounded-3xl border border-white/10">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-white/5 text-slate-400">
                    <tr>
                      <th className="px-4 py-3 font-semibold">Name</th>
                      <th className="px-4 py-3 font-semibold">Email</th>
                      <th className="px-4 py-3 font-semibold">Interest</th>
                      <th className="px-4 py-3 font-semibold">Source</th>
                      <th className="px-4 py-3 font-semibold">Phone</th>
                      <th className="px-4 py-3 font-semibold">ZIP</th>
                      <th className="px-4 py-3 font-semibold">Pet Types</th>
                      <th className="px-4 py-3 font-semibold">Services</th>
                      <th className="px-4 py-3 font-semibold">Notes</th>
                      <th className="px-4 py-3 font-semibold">Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {signups.map((signup) => (
                      <tr
                        key={signup.id}
                        className="border-t border-white/10 text-slate-300 transition hover:bg-white/5"
                      >
                        <td className="px-4 py-3 font-semibold text-white">
                          {signup.full_name}
                        </td>
                        <td className="px-4 py-3">{signup.email}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClasses(
                              signup.interest_type
                            )}`}
                          >
                            {formatInterestType(signup.interest_type)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${badgeClasses(
                              signup.source
                            )}`}
                          >
                            {formatSource(signup.source)}
                          </span>
                        </td>
                        <td className="px-4 py-3">{signup.phone || "—"}</td>
                        <td className="px-4 py-3">{signup.zip_code || "—"}</td>
                        <td className="px-4 py-3">{signup.pet_types || "—"}</td>
                        <td className="px-4 py-3">
                          {signup.services_offered || "—"}
                        </td>
                        <td className="px-4 py-3 max-w-[260px] whitespace-pre-wrap">
                          {signup.notes || "—"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {formatDate(signup.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}