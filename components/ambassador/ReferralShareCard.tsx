"use client";

import Image from "next/image";
import { useState } from "react";
import { creatorRoleLabel } from "@/lib/ambassador/creator-referral";

type ReferralShareCardProps = {
  code: string;
  url: string;
  roleLabel?: string;
  ambassadorType?: string | null;
};

export default function ReferralShareCard({
  code,
  url,
  ambassadorType,
}: ReferralShareCardProps) {
  const [notice, setNotice] = useState("");
  const label = creatorRoleLabel(ambassadorType);
  const qrHref = `/api/referrals/qr?code=${encodeURIComponent(code)}&download=1`;
  const displayUrl = url.replace(/^https?:\/\//, "");

  async function copy(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(message);
    } catch {
      setNotice("Select the link and copy it from your browser.");
    }
  }

  async function share() {
    const payload = {
      title: "SitGuru",
      text: "Find trusted pet care with SitGuru.",
      url,
    };
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(payload);
        return;
      }
    } catch {
      // Fall through to copy when the share sheet is dismissed or unavailable.
    }
    await copy(url, "Referral link copied.");
  }

  return (
    <section className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#0D5C3A]">
        {label}
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
        You&apos;re ready to share SitGuru.
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        One link for texts, stories, and printed cards. Pet Parents land on Find Care with your code attached.
      </p>

      <p className="mt-4 break-all rounded-2xl bg-[#F4FBF7] px-4 py-3 text-base font-black text-slate-950">
        {displayUrl}
      </p>
      <p className="mt-3 text-sm font-bold text-slate-700">
        Code <span className="font-black tracking-wide text-slate-950">{code}</span>
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#0D5C3A] px-4 text-sm font-black text-white"
          onClick={() => void copy(url, "Referral link copied.")}
        >
          Copy link
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#0D5C3A] bg-white px-4 text-sm font-black text-[#0D5C3A]"
          onClick={() => void copy(code, "Referral code copied.")}
        >
          Copy code
        </button>
        <button
          type="button"
          className="inline-flex min-h-12 items-center justify-center rounded-full border border-slate-200 bg-slate-50 px-4 text-sm font-black text-slate-900"
          onClick={() => void share()}
        >
          Share
        </button>
      </div>

      <a
        href={qrHref}
        className="mt-2 inline-flex min-h-12 w-full items-center justify-center rounded-full border border-slate-200 px-4 text-sm font-black text-slate-900 sm:w-auto"
      >
        Download QR code
      </a>
      <Image
        src={`/api/referrals/qr?code=${encodeURIComponent(code)}`}
        alt={`QR code for ${displayUrl}`}
        width={180}
        height={180}
        unoptimized
        className="mt-4 h-44 w-44 rounded-2xl border border-slate-200 bg-white p-2"
      />
      <p className="mt-3 text-xs font-semibold leading-5 text-slate-500">
        If SitGuru provided payment, credit, or a gift, say so in your post. Examples: #ad, Paid partnership with SitGuru. This is a reminder, not legal advice.
      </p>
      {notice ? (
        <p className="mt-2 text-sm font-bold text-[#0D5C3A]" role="status">
          {notice}
        </p>
      ) : null}
    </section>
  );
}
