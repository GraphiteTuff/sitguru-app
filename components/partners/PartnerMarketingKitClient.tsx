"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, QrCode, Share2 } from "lucide-react";

export default function PartnerMarketingKitClient({ partnerName, referralCode, slug }: {
  partnerName: string; referralCode: string; slug: string;
}) {
  const [notice, setNotice] = useState("");
  const link = useMemo(() => {
    const url = new URL("/p/" + encodeURIComponent(slug), "https://www.sitguru.com");
    url.searchParams.set("utm_source", "partner_website");
    url.searchParams.set("utm_medium", "website");
    url.searchParams.set("utm_campaign", "partner_referral");
    return url.toString();
  }, [slug]);
  const qrLink = useMemo(() => {
    const url = new URL(link);
    url.searchParams.set("utm_medium", "qr");
    return url.toString();
  }, [link]);
  const qrImage = "https://api.qrserver.com/v1/create-qr-code/?size=460x460&margin=12&data=" + encodeURIComponent(qrLink);
  const snippet = `<a href="${link}" target="_blank" rel="noopener noreferrer">Find trusted local pet care on SitGuru</a>`;

  async function copy(value: string, label: string) {
    try { await navigator.clipboard.writeText(value); setNotice(label + " copied."); }
    catch { setNotice("Select the text to copy the " + label.toLowerCase() + "."); }
  }
  async function share() {
    if (navigator.share) {
      try { await navigator.share({ title: "SitGuru — " + partnerName, text: "Find local pet care with SitGuru", url: link }); }
      catch (e) { if (!(e instanceof Error && e.name === "AbortError")) setNotice("Share menu unavailable. Use Copy link."); }
    } else await copy(link, "Partner link");
  }

  return (
    <section id="partner-marketing-kit" className="rounded-[28px] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">Official SitGuru Partner Marketing Kit</p>
      <h2 className="mt-1 text-2xl font-black !text-slate-950">Promote SitGuru from your website or storefront</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
        Each link and scan credits your partner code. Conversions and rewards are counted only after SitGuru verifies qualifying activity.
      </p>
      <div className="mt-5 grid gap-4 md:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-w-0 space-y-3">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
            <p className="text-xs font-black uppercase tracking-wide text-emerald-800">Your referral code</p>
            <p className="mt-1 break-all text-2xl font-black text-emerald-950">{referralCode}</p>
            <p className="mt-3 break-all text-sm font-semibold text-slate-700">{link}</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button onClick={() => void copy(link, "Partner website link")} type="button" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl bg-emerald-800 px-3 text-sm font-black !text-white"><Copy size={18} /> Copy Link</button>
            <button onClick={() => void share()} type="button" className="inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 text-sm font-black text-emerald-950"><Share2 size={18} /> Share</button>
            <a href={link} target="_blank" rel="noopener noreferrer" className="col-span-2 inline-flex min-h-13 items-center justify-center gap-2 rounded-xl border border-emerald-200 px-3 text-sm font-black text-emerald-950 sm:col-span-1"><ExternalLink size={18}/> Preview</a>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-black text-slate-950">Website button code</p>
            <p className="mt-1 text-xs font-semibold text-slate-600">Paste into a website HTML block, or give the code to your web developer.</p>
            <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all rounded-xl bg-white p-3 text-[11px] text-slate-800">{snippet}</pre>
            <button type="button" onClick={() => void copy(snippet, "Website button code")} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-900"><Copy size={16}/> Copy HTML</button>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <QrCode size={24} className="text-emerald-800" aria-hidden="true" />
          <p className="mt-2 text-center text-sm font-black text-emerald-950">{partnerName}</p>
          <img src={qrImage} alt={`Scan to visit SitGuru through ${partnerName}`} className="mt-3 aspect-square w-full rounded-xl bg-white p-2"/>
          <p className="mt-3 text-center text-xs font-semibold text-slate-600">This QR is tagged separately from website link visits.</p>
        </div>
      </div>
      {notice ? <p role="status" className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-emerald-900"><Check size={17}/>{notice}</p> : null}
    </section>
  );
}
