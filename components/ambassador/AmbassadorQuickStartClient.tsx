"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Copy,
  GraduationCap,
  Handshake,
  Maximize2,
  MessageCircle,
  PawPrint,
  QrCode,
  Share2,
  Users,
  X,
} from "lucide-react";

type Audience = "pet-parent" | "guru";
type QuickStartProps = {
  firstName: string;
  avatarUrl?: string | null;
  referralCode: string;
  siteUrl: string;
  petParentPath: string;
  guruPath: string;
  petParentSignups: number;
  guruSignups: number;
  socialSignups: number;
  approvedRewards: string;
};

function qrSource(destination: string) {
  const params = new URLSearchParams({
    size: "600x600",
    margin: "12",
    data: destination,
  });
  return "https://api.qrserver.com/v1/create-qr-code/?" + params.toString();
}

export default function AmbassadorQuickStartClient({
  firstName,
  avatarUrl,
  referralCode,
  siteUrl,
  petParentPath,
  guruPath,
  petParentSignups,
  guruSignups,
  socialSignups,
  approvedRewards,
}: QuickStartProps) {
  const [selected, setSelected] = useState<Audience | null>(null);
  const [feedback, setFeedback] = useState("");
  const baseUrl = siteUrl.replace(/\/+$/, "");
  const destinations = {
    "pet-parent": {
      title: "Pet Parent",
      description: "Find trusted local pet care with SitGuru.",
      url: baseUrl + petParentPath,
      qrUrl: qrSource(baseUrl + petParentPath + "?via=qr"),
    },
    guru: {
      title: "Guru",
      description: "Join SitGuru as a local pet care Guru.",
      url: baseUrl + guruPath,
      qrUrl: qrSource(baseUrl + guruPath + "?via=qr"),
    },
  };

  useEffect(() => {
    if (!selected) return;
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setSelected(null);
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [selected]);

  async function copyUrl(audience: Audience) {
    try {
      await navigator.clipboard.writeText(destinations[audience].url);
      setFeedback(destinations[audience].title + " referral link copied.");
    } catch {
      setFeedback("Copy unavailable. Open the referral link and copy it from your browser.");
    }
  }

  async function shareUrl(audience: Audience) {
    const choice = destinations[audience];
    const message = choice.description + " Referred by a SitGuru Ambassador.";
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "Join SitGuru",
          text: message,
          url: choice.url,
        });
        setFeedback("Share menu opened for " + choice.title + ".");
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;
      }
    }
    await copyUrl(audience);
  }

  const quickActions = [
    {
      title: "Log a Lead",
      description: "Record local outreach",
      href: "/ambassador/dashboard/command-center",
      icon: <Handshake size={22} aria-hidden="true" />,
    },
    {
      title: "My Results",
      description: "See referral activity",
      href: "/ambassador/dashboard/performance",
      icon: <BadgeCheck size={22} aria-hidden="true" />,
    },
    {
      title: "Training",
      description: "Build your skills",
      href: "/ambassador/dashboard/training",
      icon: <GraduationCap size={22} aria-hidden="true" />,
    },
    {
      title: "Get Support",
      description: "Message SitGuru",
      href: "/ambassador/dashboard/messages?support=admin&role=ambassador",
      icon: <MessageCircle size={22} aria-hidden="true" />,
    },
  ];

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[28px] bg-gradient-to-br from-[#0D5C3A] via-green-800 to-emerald-950 p-5 text-white shadow-[0_12px_38px_rgba(10,80,50,0.15)] sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-[3px] border-white/80 bg-white text-xl font-black text-green-900">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="Your Ambassador profile" className="h-full w-full object-cover" />
            ) : (
              <PawPrint size={29} aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold tracking-wide text-green-100">Your SitGuru Ambassador Home</p>
            <h1 className="mt-0.5 text-[clamp(1.5rem,6vw,2.25rem)] font-black leading-tight tracking-tight">
              Welcome back, {firstName}!
            </h1>
            <p className="mt-1 text-sm font-semibold text-green-100">
              Share SitGuru. Grow your community.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/10 p-3.5">
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-green-100">
              Your referral code
            </p>
            <p className="mt-1 break-all text-xl font-black tracking-wide text-white">{referralCode}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(referralCode);
                setFeedback("Your Ambassador code was copied.");
              } catch {
                setFeedback("Press and hold your referral code to copy it.");
              }
            }}
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black text-green-950 transition hover:bg-green-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            aria-label="Copy your Ambassador referral code"
          >
            <Copy size={17} aria-hidden="true" />
            Copy
          </button>
        </div>
      </section>

      <section className="rounded-[28px] border border-green-100 bg-white p-4 shadow-sm sm:p-5" aria-label="Invite someone to SitGuru">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-green-700">Start sharing</p>
            <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">Who are you inviting?</h2>
          </div>
          <QrCode size={26} className="shrink-0 text-green-800" aria-hidden="true" />
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {([
            ["pet-parent", <PawPrint key="paw" size={23} aria-hidden="true" />],
            ["guru", <Users key="users" size={23} aria-hidden="true" />],
          ] as const).map(([audience, icon]) => (
            <div key={audience} className="rounded-[22px] border border-green-100 bg-green-50/60 p-3.5">
              <div className="flex items-center gap-2.5 text-green-950">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm">{icon}</span>
                <span className="text-base font-black">{destinations[audience].title}</span>
              </div>
              <button
                type="button"
                onClick={() => setSelected(audience)}
                className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-3 text-base font-black text-white transition hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
              >
                <Maximize2 size={19} aria-hidden="true" />
                Show QR Code
              </button>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => void shareUrl(audience)}
                  className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-white px-2 text-sm font-black text-green-900 ring-1 ring-green-200 transition hover:bg-green-100"
                >
                  <Share2 size={17} aria-hidden="true" />
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => void copyUrl(audience)}
                  className="inline-flex min-h-12 items-center justify-center gap-1.5 rounded-xl bg-white px-2 text-sm font-black text-green-900 ring-1 ring-green-200 transition hover:bg-green-100"
                >
                  <Copy size={17} aria-hidden="true" />
                  Copy link
                </button>
              </div>
            </div>
          ))}
        </div>
        {feedback ? (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2.5 text-sm font-bold text-green-950" role="status" aria-live="polite">
            <Check size={16} className="shrink-0" aria-hidden="true" />
            {feedback}
          </p>
        ) : null}
        <Link
          href="/ambassador/dashboard/referrals"
          className="mt-3 flex min-h-12 items-center justify-center gap-2 text-sm font-black text-green-900 underline-offset-4 hover:underline"
        >
          View referral cards and detailed tracking <ArrowRight size={17} aria-hidden="true" />
        </Link>
      </section>

      <section aria-label="Your verified activity" className="grid grid-cols-2 gap-3">
        {[
          { label: "Pet Parents", value: petParentSignups.toLocaleString("en-US") },
          { label: "Gurus", value: guruSignups.toLocaleString("en-US") },
          { label: "Social referrals", value: socialSignups.toLocaleString("en-US") },
          { label: "Approved + ready", value: approvedRewards },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-[22px] border border-green-100 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold text-slate-600">{label}</p>
            <p className="mt-2 break-words text-2xl font-black tracking-tight text-green-950">{value}</p>
          </div>
        ))}
      </section>

      <section aria-label="Ambassador shortcuts">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-black text-green-950">Quick actions</h2>
          <Link href="/ambassador/dashboard/command-center" className="text-sm font-black text-green-800 underline-offset-4 hover:underline">
            Full Portal
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              className="flex min-h-32 flex-col justify-between rounded-[22px] border border-green-100 bg-white p-4 text-left shadow-sm transition hover:border-green-300 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-50 text-green-800">{action.icon}</span>
              <span className="mt-2 block text-base font-black text-green-950">{action.title}</span>
              <span className="mt-0.5 text-xs font-semibold text-slate-600">{action.description}</span>
            </Link>
          ))}
        </div>
      </section>

      <Link
        href="/ambassador/dashboard/command-center"
        className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 text-base font-black text-white transition hover:bg-green-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-green-800"
      >
        <BriefcaseBusiness size={21} aria-hidden="true" />
        Open Ambassador Portal
        <ArrowRight size={19} aria-hidden="true" />
      </Link>

      {selected ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={destinations[selected].title + " referral QR code"}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/85 p-4"
        >
          <section className="w-full max-w-lg rounded-[28px] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-green-700">SitGuru Ambassador</p>
                <h2 className="mt-1 text-2xl font-black text-slate-950">{destinations[selected].title} QR Code</h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-900 hover:bg-slate-50"
                aria-label="Close QR code"
              >
                <X size={24} aria-hidden="true" />
              </button>
            </div>
            <div className="mx-auto mt-5 w-full max-w-[380px] rounded-2xl border border-green-100 bg-white p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={destinations[selected].qrUrl}
                alt={"Scan to join SitGuru as a " + destinations[selected].title}
                className="aspect-square w-full object-contain"
              />
            </div>
            <p className="mt-3 text-center text-sm font-bold text-slate-600">Let someone scan this code to open your tracked referral link.</p>
            <p className="mt-2 text-center text-xl font-black tracking-wider text-green-950">{referralCode}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => void shareUrl(selected)}
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl bg-green-800 px-3 font-black text-white"
              >
                <Share2 size={18} aria-hidden="true" /> Share
              </button>
              <button
                type="button"
                onClick={() => void copyUrl(selected)}
                className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 font-black text-green-950"
              >
                <Copy size={18} aria-hidden="true" /> Copy link
              </button>
            </div>
            {feedback ? <p role="status" className="mt-3 text-center text-sm font-semibold text-green-900">{feedback}</p> : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
