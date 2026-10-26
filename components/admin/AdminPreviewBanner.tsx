"use client";

import Link from "next/link";

/** Persistent Admin View-As banner (read-only). */
export default function AdminPreviewBanner({
  viewingAs,
  exitHref,
}: {
  viewingAs: string;
  exitHref: string;
}) {
  return (
    <div
      className="public-dark-section sticky top-0 z-[70] border-b border-emerald-900 px-3 py-2 text-sm font-semibold"
      data-brand-green
      style={{ background: "#0D5C3A" }}
    >
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
        <p className="!text-white">
          <span className="font-black uppercase tracking-[0.14em]">Admin Preview</span>
          {" · "}
          Viewing as {viewingAs}
          {" · "}
          <span className="font-black">Read-Only</span>
        </p>
        <Link
          href={exitHref}
          className="inline-flex min-h-10 items-center rounded-xl bg-white px-3 text-xs font-black text-emerald-900"
        >
          Exit Preview
        </Link>
      </div>
    </div>
  );
}
