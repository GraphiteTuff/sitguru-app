"use client";

import { useMemo, useState } from "react";
import { Check, Copy, Download, ExternalLink, Maximize2, Share2, X } from "lucide-react";

type Props = { ambassadorName: string; referralCode: string; referralUrl: string; avatarUrl?: string | null };

export default function AmbassadorReferralCardClient({ ambassadorName, referralCode, referralUrl }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [posterFailed, setPosterFailed] = useState(false);
  const { publicUrl, posterUrl } = useMemo(() => {
    let origin = "https://www.sitguru.com";
    try { origin = new URL(referralUrl).origin; } catch { /* canonical fallback */ }
    return {
      publicUrl: `${origin}/r/${encodeURIComponent(referralCode)}?utm_source=sitguru_ambassador&utm_campaign=ambassador_card`,
      posterUrl: `/api/ambassador/card/${encodeURIComponent(referralCode)}`,
    };
  }, [referralCode, referralUrl]);
  const qrCode = "https://api.qrserver.com/v1/create-qr-code/?size=440x440&margin=12&data=" +
    encodeURIComponent(publicUrl + "&via=qr");

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setMessage("Personal Ambassador invitation link copied.");
    } catch {
      setMessage("Select the invitation link to copy it manually.");
    }
  }

  async function sharePoster() {
    try {
      if (navigator.share) {
        const response = await fetch(posterUrl, { cache: "no-store" });
        if (response.ok && typeof File !== "undefined") {
          const file = new File([await response.blob()], `sitguru-${referralCode.toLowerCase()}-ambassador.png`, { type: "image/png" });
          if (navigator.canShare?.({ files: [file] })) {
            await navigator.share({
              title: "SitGuru Ambassador invitation",
              text: `Join SitGuru with Ambassador ${ambassadorName}. Scan the card or visit ${publicUrl}`,
              files: [file],
            });
            return;
          }
        }
        await navigator.share({ title: "SitGuru Ambassador invitation", text: `${ambassadorName} invites you to SitGuru`, url: publicUrl });
        return;
      }
      await copyLink();
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") return;
      setMessage("Could not open the share menu. Try copying the invitation link.");
    }
  }

  const poster = posterFailed ? (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
      <span className="text-lg font-black text-emerald-950">{ambassadorName}</span>
      <span className="mt-2 text-sm font-semibold text-slate-700">SitGuru Ambassador · {referralCode}</span>
      <img src={qrCode} alt="QR code to your SitGuru Ambassador invitation" className="mt-4 aspect-square w-full max-w-[230px] bg-white p-3" />
    </div>
  ) : (
    <img
      src={posterUrl}
      alt={`Downloadable SitGuru Ambassador referral card for ${ambassadorName}`}
      className="w-full rounded-[22px] border border-emerald-100 shadow-md"
      onError={() => setPosterFailed(true)}
    />
  );

  return (
    <>
      <section className="mx-auto w-full max-w-lg rounded-[26px] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Official Ambassador Card</p>
            <h3 className="mt-1 text-xl font-black !text-slate-950">{ambassadorName}</h3>
            <p className="mt-1 text-sm font-bold text-emerald-900">Referral code: {referralCode}</p>
          </div>
          <button type="button" onClick={() => setExpanded(true)} className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-emerald-50 px-3 text-sm font-black text-emerald-900 hover:bg-emerald-100">
            <Maximize2 size={19} aria-hidden="true" /> Enlarge
          </button>
        </div>
        <button type="button" onClick={() => setExpanded(true)} className="block w-full cursor-zoom-in" aria-label="Show enlarged Ambassador promotional card">
          {poster}
        </button>
        <p className="mt-4 text-sm font-semibold text-slate-600">
          Scan the card to open your personalized SitGuru invitation, where visitors can choose Pet Parent or Guru.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <button type="button" onClick={() => void sharePoster()} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 text-sm font-black !text-white hover:bg-emerald-900">
            <Share2 size={18} aria-hidden="true" /> Share
          </button>
          <a href={posterUrl + "?download=1"} download={`sitguru-${referralCode.toLowerCase()}-ambassador.png`} className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 text-sm font-black text-emerald-950 hover:bg-emerald-100">
            <Download size={18} aria-hidden="true" /> PNG
          </a>
          <button type="button" onClick={() => void copyLink()} className="col-span-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-950 hover:bg-emerald-50 sm:col-span-1">
            <Copy size={18} aria-hidden="true" /> Copy link
          </button>
        </div>
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex min-h-11 items-center gap-2 break-all text-xs font-black text-emerald-800 hover:underline">
          <ExternalLink size={15} className="shrink-0" aria-hidden="true" /> View tracked public invitation
        </a>
        {message ? <p role="status" className="mt-2 flex items-center gap-2 text-sm font-semibold text-emerald-900"><Check size={16} aria-hidden="true" />{message}</p> : null}
      </section>
      {expanded ? (
        <div role="dialog" aria-modal="true" aria-label="Ambassador card full-screen" className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/90 p-3">
          <div className="flex max-h-[95svh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white p-3 sm:p-5">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-base font-black text-emerald-950">SitGuru Ambassador • {referralCode}</span>
              <button autoFocus type="button" onClick={() => setExpanded(false)} className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 text-slate-950" aria-label="Close card"><X size={24} /></button>
            </div>
            <div className="min-h-0 overflow-y-auto">{poster}</div>
            <button type="button" onClick={() => void sharePoster()} className="mt-3 flex min-h-14 w-full items-center justify-center gap-2 rounded-xl bg-emerald-800 font-black text-white"><Share2 size={19} /> Share card</button>
          </div>
        </div>
      ) : null}
    </>
  );
}
