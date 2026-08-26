"use client";

/**
 * Guru referral share card — tracking link, code, and share actions.
 */

import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Gift,
  Link2,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";

type GuruLinkShareCardProps = {
  referralCode: string;
  referralUrl: string;
  guruName?: string;
  rewardLabel?: string;
};

type ShareChip = {
  id: string;
  label: string;
  href?: string;
  onClick?: () => void;
  tone: string;
  icon: ReactNode;
};

function shareMessage(url: string, guruName?: string) {
  const who = guruName?.trim() || "a SitGuru Guru";
  return `Join SitGuru as a pet care Guru — ${who} invited you. Apply here: ${url}`;
}

function buildShareHref(
  platform: "whatsapp" | "facebook" | "x" | "email" | "sms",
  url: string,
  message: string,
) {
  const encodedUrl = encodeURIComponent(url);
  const encodedText = encodeURIComponent(message);
  const subject = encodeURIComponent("Become a SitGuru Guru");

  switch (platform) {
    case "whatsapp":
      return `https://wa.me/?text=${encodedText}`;
    case "facebook":
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case "x":
      return `https://twitter.com/intent/tweet?text=${encodedText}`;
    case "email":
      return `mailto:?subject=${subject}&body=${encodedText}`;
    case "sms":
      return `sms:?&body=${encodedText}`;
    default:
      return url;
  }
}

export default function GuruLinkShareCard({
  referralCode,
  referralUrl,
  guruName,
  rewardLabel,
}: GuruLinkShareCardProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [shareHint, setShareHint] = useState("");

  const message = useMemo(
    () => shareMessage(referralUrl, guruName),
    [referralUrl, guruName],
  );

  async function copyText(value: string, kind: "link" | "code") {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      setShareHint(kind === "code" ? "Code copied" : "Link copied");
      window.setTimeout(() => {
        setCopied(null);
        setShareHint("");
      }, 1600);
    } catch {
      setShareHint("Copy failed — select the text manually");
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyText(referralUrl, "link");
      return;
    }

    try {
      await navigator.share({
        title: "Become a SitGuru Guru",
        text: message,
        url: referralUrl,
      });
      setShareHint("Shared");
      window.setTimeout(() => setShareHint(""), 1600);
    } catch {
      // user cancelled
    }
  }

  const chips: ShareChip[] = [
    {
      id: "copy",
      label: copied === "link" ? "Copied" : "Copy link",
      onClick: () => void copyText(referralUrl, "link"),
      tone: "border-emerald-600 bg-emerald-600 text-white hover:bg-emerald-700",
      icon:
        copied === "link" ? (
          <Check className="h-4 w-4" />
        ) : (
          <Copy className="h-4 w-4" />
        ),
    },
    {
      id: "native",
      label: "Share",
      onClick: () => void nativeShare(),
      tone: "border-slate-200 bg-white text-slate-800 hover:bg-slate-50",
      icon: <Share2 className="h-4 w-4" />,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: buildShareHref("whatsapp", referralUrl, message),
      tone: "border-emerald-100 bg-emerald-50 text-emerald-900 hover:bg-emerald-100",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: buildShareHref("facebook", referralUrl, message),
      tone: "border-sky-100 bg-sky-50 text-sky-900 hover:bg-sky-100",
      icon: <span className="text-sm font-black leading-none">f</span>,
    },
    {
      id: "x",
      label: "X",
      href: buildShareHref("x", referralUrl, message),
      tone: "border-slate-200 bg-slate-50 text-slate-900 hover:bg-slate-100",
      icon: <span className="text-sm font-black leading-none">𝕏</span>,
    },
    {
      id: "sms",
      label: "SMS",
      href: buildShareHref("sms", referralUrl, message),
      tone: "border-violet-100 bg-violet-50 text-violet-900 hover:bg-violet-100",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: "email",
      label: "Email",
      href: buildShareHref("email", referralUrl, message),
      tone: "border-amber-100 bg-amber-50 text-amber-950 hover:bg-amber-100",
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  return (
    <article className="overflow-hidden rounded-[2rem] border border-emerald-200/80 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.08)]">
      <div className="bg-[radial-gradient(circle_at_12%_20%,rgba(255,255,255,0.55),transparent_34%),linear-gradient(115deg,#03d39c_0%,#72dec5_48%,#b9e3ff_100%)] px-5 py-5 sm:px-7 sm:py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-[#07132f] text-white shadow-lg shadow-slate-900/20">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.2em] !text-[#07132f]">
                Your referral toolkit
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight !text-[#07132f] sm:text-3xl">
                Share SitGuru. Earn rewards.
              </h2>
              {rewardLabel ? (
                <p className="mt-1 max-w-xl text-sm font-semibold text-slate-800/85">
                  {rewardLabel}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={() => void copyText(referralCode, "code")}
            disabled={!referralCode}
            className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/85 px-4 text-sm font-black text-[#07132f] shadow-sm backdrop-blur transition hover:bg-white disabled:opacity-50"
          >
            <Link2 className="h-4 w-4 text-emerald-700" />
            Code{" "}
            <span className="font-mono tracking-wide">
              {referralCode || "—"}
            </span>
            {copied === "code" ? (
              <Check className="h-4 w-4 text-emerald-700" />
            ) : (
              <Copy className="h-4 w-4 text-slate-500" />
            )}
          </button>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 sm:flex-row sm:items-stretch">
          <div className="min-w-0 flex-1 rounded-2xl border border-white/70 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
              Tracking link
            </p>
            <p className="mt-1 truncate font-mono text-xs font-bold !text-slate-950 sm:text-sm">
              {referralUrl || "Generating link…"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void copyText(referralUrl, "link")}
            disabled={!referralUrl}
            className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-[#07132f] px-6 text-sm font-black text-white shadow-[0_12px_28px_rgba(7,19,47,0.22)] transition hover:bg-[#0b1436] disabled:opacity-50"
          >
            {copied === "link" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied === "link" ? "Copied" : "Copy link"}
          </button>
        </div>

        {shareHint ? (
          <p className="mt-3 text-xs font-black text-[#07132f]">{shareHint}</p>
        ) : null}
      </div>

      <div className="border-t border-emerald-100 bg-white px-5 py-4 sm:px-7">
        <p className="mb-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
          Share with your network
        </p>
        <div className="-mx-1 overflow-x-auto whitespace-nowrap px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:overflow-visible sm:whitespace-normal">
          <div className="inline-flex gap-2 sm:flex sm:flex-wrap">
            {chips.map((chip) =>
              chip.href ? (
                <a
                  key={chip.id}
                  href={chip.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`inline-flex snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${chip.tone}`}
                >
                  {chip.icon}
                  {chip.label}
                </a>
              ) : (
                <button
                  key={chip.id}
                  type="button"
                  onClick={chip.onClick}
                  className={`inline-flex snap-start items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-black shadow-sm transition hover:-translate-y-0.5 ${chip.tone}`}
                >
                  {chip.icon}
                  {chip.label}
                </button>
              ),
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
