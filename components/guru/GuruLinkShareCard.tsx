"use client";

/**
 * Compact Guru referral share card — one-click copy + swipeable share ribbon.
 */

import { useMemo, useState, type ReactNode } from "react";
import {
  Check,
  Copy,
  Link2,
  Mail,
  MessageCircle,
  Share2,
} from "lucide-react";

type GuruLinkShareCardProps = {
  referralCode: string;
  referralUrl: string;
  guruName?: string;
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
}: GuruLinkShareCardProps) {
  const [copied, setCopied] = useState(false);
  const [shareHint, setShareHint] = useState("");

  const message = useMemo(
    () => shareMessage(referralUrl, guruName),
    [referralUrl, guruName],
  );

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setShareHint("Link copied");
      window.setTimeout(() => {
        setCopied(false);
        setShareHint("");
      }, 1600);
    } catch {
      setShareHint("Copy failed — select the link manually");
    }
  }

  async function nativeShare() {
    if (typeof navigator === "undefined" || !navigator.share) {
      await copyLink();
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
      label: copied ? "Copied" : "Copy",
      onClick: () => void copyLink(),
      tone: "border-emerald-200 bg-emerald-600 text-white",
      icon: copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />,
    },
    {
      id: "native",
      label: "Share",
      onClick: () => void nativeShare(),
      tone: "border-slate-200 bg-white text-slate-800",
      icon: <Share2 className="h-4 w-4" />,
    },
    {
      id: "whatsapp",
      label: "WhatsApp",
      href: buildShareHref("whatsapp", referralUrl, message),
      tone: "border-emerald-100 bg-emerald-50 text-emerald-800",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: "facebook",
      label: "Facebook",
      href: buildShareHref("facebook", referralUrl, message),
      tone: "border-sky-100 bg-sky-50 text-sky-800",
      icon: <span className="text-sm font-black">f</span>,
    },
    {
      id: "x",
      label: "X",
      href: buildShareHref("x", referralUrl, message),
      tone: "border-slate-200 bg-slate-50 text-slate-900",
      icon: <span className="text-sm font-black">𝕏</span>,
    },
    {
      id: "sms",
      label: "SMS",
      href: buildShareHref("sms", referralUrl, message),
      tone: "border-violet-100 bg-violet-50 text-violet-800",
      icon: <MessageCircle className="h-4 w-4" />,
    },
    {
      id: "email",
      label: "Email",
      href: buildShareHref("email", referralUrl, message),
      tone: "border-amber-100 bg-amber-50 text-amber-900",
      icon: <Mail className="h-4 w-4" />,
    },
  ];

  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-emerald-200 bg-white shadow-sm">
      <div className="border-b border-emerald-100 bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_55%)] px-5 py-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-600 text-white">
            <Link2 className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Your tracking link
            </p>
            <p className="text-sm font-bold text-slate-600">
              Code{" "}
              <span className="font-black text-slate-950">{referralCode || "—"}</span>
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <p className="min-w-0 flex-1 truncate rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-mono text-xs font-bold text-slate-800 sm:text-sm">
            {referralUrl || "Generating link…"}
          </p>
          <button
            type="button"
            onClick={() => void copyLink()}
            disabled={!referralUrl}
            className="inline-flex min-h-[48px] shrink-0 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy link"}
          </button>
        </div>

        {shareHint ? (
          <p className="mt-2 text-xs font-bold text-emerald-700">{shareHint}</p>
        ) : null}
      </div>

      <div className="-mx-0 overflow-x-auto whitespace-nowrap px-5 py-4 [scrollbar-width:none] sm:px-6 [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-2 md:flex md:flex-wrap md:whitespace-normal">
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
    </article>
  );
}
