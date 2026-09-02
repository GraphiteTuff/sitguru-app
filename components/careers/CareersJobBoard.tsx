"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Search } from "lucide-react";
import {
  CATEGORY_LABELS,
  TRACK_LABELS,
  jobMetaChips,
  type CareerCategory,
  type CareerJob,
  type CareerTrack,
} from "@/lib/careers/types";

const FILTERS: Array<{ id: "all" | CareerCategory; label: string }> = [
  { id: "all", label: "All openings" },
  { id: "career", label: "Careers" },
  { id: "internship", label: "Internships" },
];

export function CareersJobBoard({ jobs }: { jobs: CareerJob[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | CareerCategory>("all");
  const [track, setTrack] = useState<"all" | CareerTrack>("all");

  const tracks = useMemo(() => {
    const set = new Set(jobs.map((job) => job.track));
    return Array.from(set);
  }, [jobs]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return jobs.filter((job) => {
      if (filter !== "all" && job.category !== filter) return false;
      if (track !== "all" && job.track !== track) return false;
      if (!needle) return true;
      const haystack = [
        job.title,
        job.summary,
        job.location,
        CATEGORY_LABELS[job.category],
        TRACK_LABELS[job.track],
        ...job.highlights,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [jobs, query, filter, track]);

  return (
    <div>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <label className="relative min-w-0 flex-1">
          <Search
            size={18}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-emerald-700"
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search careers and internships"
            className="min-h-12 w-full rounded-2xl border border-emerald-100 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-950 shadow-sm outline-none ring-emerald-200 placeholder:text-slate-400 focus:ring-4"
          />
        </label>
        {tracks.length > 1 ? (
          <select
            value={track}
            onChange={(event) =>
              setTrack(event.target.value as "all" | CareerTrack)
            }
            className="min-h-12 rounded-2xl border border-emerald-100 bg-white px-4 text-sm font-black text-emerald-900"
          >
            <option value="all">All tracks</option>
            {tracks.map((value) => (
              <option key={value} value={value}>
                {TRACK_LABELS[value]}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((item) => {
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={`rounded-full px-4 py-2 text-sm font-black transition ${
                active
                  ? "bg-green-800 text-white"
                  : "border border-emerald-100 bg-white text-emerald-900 hover:bg-emerald-50"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {visible.map((job) => (
          <article
            key={job.id}
            className="flex flex-col rounded-[28px] border border-[#e3ece5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-green-200 hover:shadow-md sm:p-6"
          >
            <p className="text-xs font-black uppercase tracking-[0.16em] text-green-700">
              {CATEGORY_LABELS[job.category]} · {TRACK_LABELS[job.track]}
            </p>
            <h3 className="mt-2 text-2xl font-black tracking-tight text-green-950">
              {job.title}
            </h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {jobMetaChips(job)
                .slice(0, 5)
                .map((chip) => (
                  <span
                    key={chip}
                    className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-900"
                  >
                    {chip}
                  </span>
                ))}
            </div>
            <p className="mt-3 flex-1 text-sm font-semibold leading-6 text-slate-600">
              {job.summary}
            </p>
            <Link
              href={`/careers/${job.slug}`}
              className="mt-5 inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-green-800 px-5 text-sm font-black text-white transition hover:bg-green-900"
            >
              View role
              <ArrowRight size={16} />
            </Link>
          </article>
        ))}
      </div>

      {!visible.length ? (
        <div className="mt-5 rounded-[28px] border border-dashed border-emerald-200 bg-emerald-50/60 p-6 text-center">
          <p className="text-base font-black text-emerald-950">
            No openings match that search.
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Try All openings, or apply as a Guru / program participant while we
            add more roles.
          </p>
        </div>
      ) : null}
    </div>
  );
}
