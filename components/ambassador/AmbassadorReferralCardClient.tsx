"use client";

import { useMemo, useState } from "react";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Maximize2,
  PawPrint,
  Share2,
  X,
} from "lucide-react";

type AmbassadorReferralCardClientProps = {
  ambassadorName: string;
  referralCode: string;
  referralUrl: string;
  avatarUrl?: string | null;
};

function getInitials(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SG"
  );
}

function getQrCodeUrl(value: string, size = 760) {
  const params = new URLSearchParams({
    size: `${size}x${size}`,
    data: value,
    margin: "18",
    format: "svg",
  });

  return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export default function AmbassadorReferralCardClient({
  ambassadorName,
  referralCode,
  referralUrl,
  avatarUrl,
}: AmbassadorReferralCardClientProps) {
  const [copiedField, setCopiedField] = useState<"code" | "link" | null>(null);
  const [isVendorModeOpen, setIsVendorModeOpen] = useState(false);
  const [message, setMessage] = useState("");

  const qrCodeUrl = useMemo(
    () => getQrCodeUrl(`${referralUrl}${referralUrl.includes("?") ? "&" : "?"}via=qr`),
    [referralUrl],
  );

  const compactUrl = useMemo(() => {
    try {
      const parsed = new URL(referralUrl);
      return `${parsed.host}${parsed.pathname}`;
    } catch {
      return referralUrl.replace(/^https?:\/\//, "");
    }
  }, [referralUrl]);

  async function copyValue(value: string, field: "code" | "link") {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setMessage(field === "code" ? "Referral code copied." : "Referral link copied.");

      window.setTimeout(() => {
        setCopiedField(null);
        setMessage("");
      }, 2200);
    } catch {
      setMessage("Unable to copy automatically. Press and hold the text to copy it.");
    }
  }

  async function shareReferralCard() {
    const shareText = `Join SitGuru for trusted local pet care using Ambassador code ${referralCode}.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Join SitGuru",
          text: shareText,
          url: referralUrl,
        });

        setMessage("Referral card shared.");
        window.setTimeout(() => setMessage(""), 2200);
        return;
      }

      await copyValue(referralUrl, "link");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      setMessage("Sharing was not completed. The referral link is still available below.");
    }
  }

  function downloadReferralCard() {
    const safeName = escapeXml(ambassadorName);
    const safeCode = escapeXml(referralCode);
    const safeUrl = escapeXml(compactUrl);
    const safeQrUrl = escapeXml(qrCodeUrl);

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
        <defs>
          <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#14532d" />
            <stop offset="55%" stop-color="#166534" />
            <stop offset="100%" stop-color="#052e16" />
          </linearGradient>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="24" stdDeviation="24" flood-color="#022c22" flood-opacity="0.35" />
          </filter>
        </defs>

        <rect width="1080" height="1350" rx="64" fill="url(#background)" />

        <g transform="translate(90 70)">
          <circle cx="44" cy="44" r="44" fill="#dcfce7" />
          <text x="44" y="59" text-anchor="middle" font-size="42" font-family="Arial, sans-serif">🐾</text>
          <text x="108" y="58" fill="#ffffff" font-size="50" font-weight="800" font-family="Arial, sans-serif">SitGuru</text>
        </g>

        <text x="540" y="235" fill="#ffffff" text-anchor="middle" font-size="58" font-weight="800" font-family="Arial, sans-serif">
          Find trusted local pet care
        </text>
        <text x="540" y="292" fill="#bbf7d0" text-anchor="middle" font-size="30" font-weight="600" font-family="Arial, sans-serif">
          Referred by ${safeName}
        </text>

        <g filter="url(#shadow)">
          <rect x="210" y="355" width="660" height="660" rx="54" fill="#ffffff" />
          <image href="${safeQrUrl}" x="255" y="400" width="570" height="570" />
        </g>

        <text x="540" y="1095" fill="#dcfce7" text-anchor="middle" font-size="30" font-weight="700" font-family="Arial, sans-serif">
          Scan to join SitGuru
        </text>

        <rect x="275" y="1135" width="530" height="92" rx="30" fill="#15803d" stroke="#86efac" stroke-width="3" />
        <text x="540" y="1195" fill="#ffffff" text-anchor="middle" font-size="48" font-weight="900" letter-spacing="2" font-family="Arial, sans-serif">
          ${safeCode}
        </text>

        <text x="540" y="1285" fill="#ffffff" text-anchor="middle" font-size="27" font-weight="700" font-family="Arial, sans-serif">
          ${safeUrl}
        </text>
      </svg>
    `.trim();

    const blob = new Blob([svg], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = objectUrl;
    anchor.download = `sitguru-referral-${referralCode.toLowerCase()}.svg`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);

    setMessage("Referral card downloaded.");
    window.setTimeout(() => setMessage(""), 2200);
  }

  return (
    <>
      <section className="mx-auto w-full max-w-md rounded-[2rem] border border-green-100 bg-white p-4 shadow-[0_20px_70px_rgba(20,83,45,0.12)] sm:p-5">
        <div className="flex items-center gap-3">
          <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-green-100 text-lg font-black text-green-900 ring-2 ring-green-200">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={`${ambassadorName} profile`}
                className="h-full w-full object-cover"
              />
            ) : (
              getInitials(ambassadorName)
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-base font-black text-green-950">
              {ambassadorName}
            </p>
            <p className="text-xs font-bold text-slate-600">
              SitGuru Ambassador
            </p>
            <span className="mt-1 inline-flex rounded-full bg-green-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-green-800">
              Active
            </span>
          </div>
        </div>

        <div className="mt-5 rounded-[1.75rem] border border-green-100 bg-[#fbfdf9] p-4">
          <button
            type="button"
            onClick={() => setIsVendorModeOpen(true)}
            className="group block w-full rounded-[1.4rem] bg-white p-3 shadow-sm ring-1 ring-green-100 transition hover:ring-green-300"
            aria-label="Open full-screen Vendor Mode QR code"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrCodeUrl}
              alt="SitGuru Ambassador referral QR code"
              className="mx-auto aspect-square w-full max-w-[300px] object-contain"
            />
            <span className="mt-2 inline-flex items-center gap-2 text-xs font-black text-green-800">
              Tap for Full-Screen Vendor Mode
              <Maximize2 className="h-4 w-4 transition group-hover:scale-110" />
            </span>
          </button>

          <div className="mt-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500">
              Your Referral Code
            </p>
            <p className="mt-2 break-all text-3xl font-black tracking-tight text-green-950">
              {referralCode}
            </p>
            <p className="mt-2 break-all rounded-xl bg-green-50 px-3 py-2 text-xs font-black leading-5 text-green-900">
              {compactUrl}
            </p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => copyValue(referralCode, "code")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-green-800 px-3 py-2 text-xs font-black text-white transition hover:bg-green-900"
          >
            {copiedField === "code" ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            Copy Code
          </button>

          <button
            type="button"
            onClick={() => copyValue(referralUrl, "link")}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-white px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-50"
          >
            {copiedField === "link" ? (
              <Check className="h-4 w-4" />
            ) : (
              <ExternalLink className="h-4 w-4" />
            )}
            Copy Link
          </button>

          <button
            type="button"
            onClick={shareReferralCard}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100"
          >
            <Share2 className="h-4 w-4" />
            Share Card
          </button>

          <button
            type="button"
            onClick={downloadReferralCard}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs font-black text-green-900 transition hover:bg-green-100"
          >
            <Download className="h-4 w-4" />
            Download Card
          </button>
        </div>

        {message ? (
          <div
            role="status"
            className="mt-3 rounded-xl border border-green-100 bg-green-50 px-3 py-2 text-center text-xs font-black text-green-900"
          >
            {message}
          </div>
        ) : null}
      </section>

      {isVendorModeOpen ? (
        <div className="fixed inset-0 z-[100] flex min-h-[100svh] items-center justify-center bg-green-950 p-4">
          <button
            type="button"
            onClick={() => setIsVendorModeOpen(false)}
            className="absolute right-4 top-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition hover:bg-white/20"
            aria-label="Close Vendor Mode"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto flex w-fit items-center gap-3 text-white">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-green-800">
                <PawPrint className="h-8 w-8" />
              </div>
              <p className="text-4xl font-black">SitGuru</p>
            </div>

            <h2 className="mt-6 text-3xl font-black text-white sm:text-5xl">
              Find trusted local pet care
            </h2>

            <div className="mx-auto mt-7 max-w-xl rounded-[2.5rem] bg-white p-5 shadow-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={qrCodeUrl}
                alt="Full-screen SitGuru Ambassador referral QR code"
                className="aspect-square w-full object-contain"
              />
            </div>

            <p className="mt-6 text-2xl font-black text-white">
              Scan to join SitGuru
            </p>

            <p className="mx-auto mt-4 w-fit rounded-2xl bg-green-800 px-6 py-3 text-3xl font-black tracking-wide text-white ring-1 ring-green-400">
              {referralCode}
            </p>

            <p className="mt-4 break-all text-base font-bold text-green-100">
              {compactUrl}
            </p>

            <p className="mt-6 text-sm font-bold text-green-200">
              Referred by {ambassadorName}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}