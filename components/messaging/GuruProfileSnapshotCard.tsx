"use client";

import Link from "next/link";
import type { GuruChatSnapshot } from "@/lib/gurus/guru-chat-snapshot";

export function GuruProfileSnapshotCard({ guru }: { guru: GuruChatSnapshot }) {
  const rateLabel =
    guru.rate != null && Number.isFinite(guru.rate)
      ? `$${Math.round(guru.rate)}`
      : null;
  const ratingLabel =
    guru.rating != null
      ? `${guru.rating.toFixed(1)}${guru.reviewCount ? ` · ${guru.reviewCount} reviews` : ""}`
      : null;
  const rebookHref =
    guru.bookingUrl || guru.profileUrl || `/guru/${guru.slug}`;

  return (
    <div className="mt-2 overflow-hidden rounded-2xl border border-[#0D5C3A]/20 bg-white shadow-sm">
      <div className="flex gap-3 p-3">
        <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-[#E8F3EC]">
          {guru.photoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={guru.photoUrl}
              alt=""
              className="h-full w-full object-cover"
              style={{ objectPosition: "50% 28%" }}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-[#0D5C3A]">
              {guru.name.slice(0, 1).toUpperCase()}
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="m-0 truncate text-sm font-semibold text-slate-900">
            {guru.name}
          </p>
          <p className="m-0 mt-0.5 truncate text-xs text-slate-600">
            {guru.location}
          </p>
          <p className="m-0 mt-1 line-clamp-2 text-xs text-slate-700">
            {guru.services.slice(0, 3).join(" · ") || "Pet care"}
            {rateLabel ? ` · from ${rateLabel}` : ""}
            {ratingLabel ? ` · ★ ${ratingLabel}` : ""}
          </p>
        </div>
      </div>
      <p className="m-0 border-t border-slate-100 px-3 pt-2 text-[10px] font-medium uppercase tracking-wide text-slate-500">
        Book through SitGuru
      </p>
      <div className="flex gap-2 px-3 pb-2 pt-1.5">
        <Link
          href={guru.profileUrl || `/guru/${guru.slug}`}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-[#0D5C3A] px-3 py-1.5 text-center text-xs font-semibold text-[#0D5C3A]"
        >
          View profile
        </Link>
        <Link
          href={rebookHref}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-[#0D5C3A] px-3 py-1.5 text-center text-xs font-semibold text-white"
        >
          Rebook
        </Link>
      </div>
    </div>
  );
}
