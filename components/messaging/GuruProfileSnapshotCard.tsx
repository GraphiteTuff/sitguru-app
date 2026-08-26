"use client";

import Link from "next/link";
import type { GuruChatSnapshot } from "@/lib/gurus/guru-chat-snapshot";

export function GuruProfileSnapshotCard({ guru }: { guru: GuruChatSnapshot }) {
  const rateLabel =
    guru.rate != null && Number.isFinite(guru.rate)
      ? `From $${Math.round(guru.rate)}`
      : null;
  const ratingLabel =
    guru.rating != null ? `${guru.rating.toFixed(1)}` : null;
  const rebookHref =
    guru.bookingUrl || guru.profileUrl || `/guru/${guru.slug}`;
  const servicesLabel =
    guru.services.slice(0, 3).join(" · ") || "Pet care";

  return (
    <article className="overflow-hidden rounded-2xl border border-[#0D5C3A]/18 bg-white shadow-[0_8px_20px_rgba(15,23,42,0.06)]">
      <div className="flex gap-3 p-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-[#E8F3EC] ring-1 ring-[#0D5C3A]/12">
          <span className="absolute inset-0 bg-white" aria-hidden />
          {guru.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={guru.photoUrl}
              alt=""
              className="sg-face-photo absolute inset-0 h-full w-full"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-lg font-black text-[#0D5C3A]">
              {guru.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <p className="m-0 truncate text-sm font-black text-slate-950">
              {guru.name}
            </p>
            {ratingLabel ? (
              <span className="shrink-0 text-[11px] font-black text-amber-600">
                ★ {ratingLabel}
              </span>
            ) : null}
          </div>
          <p className="m-0 mt-0.5 truncate text-[11px] font-semibold text-slate-500">
            {guru.location}
          </p>
          <p className="m-0 mt-1 line-clamp-2 text-[11px] font-semibold leading-4 text-slate-700">
            {servicesLabel}
            {rateLabel ? ` · ${rateLabel}` : ""}
          </p>
        </div>
      </div>

      <div className="flex gap-2 border-t border-slate-100 bg-[#f7fbf8] px-3 py-2">
        <Link
          href={guru.profileUrl || `/guru/${guru.slug}`}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full border border-[#0D5C3A]/30 bg-white px-3 text-center text-[11px] font-black text-[#0D5C3A] transition hover:bg-emerald-50"
        >
          View profile
        </Link>
        <Link
          href={rebookHref}
          className="inline-flex min-h-9 flex-1 items-center justify-center rounded-full bg-[#0D5C3A] px-3 text-center text-[11px] font-black text-white transition hover:bg-[#0a4a2e]"
        >
          {guru.canBook ? "Book" : "Open"}
        </Link>
      </div>
    </article>
  );
}
