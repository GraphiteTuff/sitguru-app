"use client";

import Link from "next/link";
import { useState } from "react";

export default function GuruProfileShare({
  name,
  location,
  photo,
  services,
  url,
  qrHref,
  perksHref,
}: {
  name: string;
  location: string;
  photo?: string | null;
  services: string[];
  url: string;
  qrHref?: string;
  perksHref: string;
}) {
  const [message, setMessage] = useState("");
  const title = `Meet ${name} on SitGuru`;
  const button = "inline-flex min-h-12 items-center justify-center rounded-xl border border-emerald-200 px-4 text-center text-sm font-bold text-[#0D5C3A] hover:bg-emerald-50";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setMessage("Profile link copied.");
    } catch {
      setMessage("Select and copy the profile link below.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await copyLink();
      return;
    }
    try {
      await navigator.share({ title, url });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setMessage("Sharing is unavailable. You can copy the link instead.");
      }
    }
  }

  return (
    <section id="share-guru-profile" className="mt-4 scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm" aria-label={`Share ${name}'s profile`}>
      <div data-brand-green="true" className="bg-[linear-gradient(135deg,#103743,#07583F)]">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-5 pt-5">
          <div className="rounded-br-[2rem] rounded-tl-xl bg-white py-2 pl-3 pr-6 ring-2 ring-lime-400">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sitguru-logo-cropped.png" alt="SitGuru" width={152} height={52} className="h-12 w-auto object-contain" />
          </div>
          <p className="text-sm font-black uppercase tracking-wide !text-lime-200">Meet your local Guru</p>
        </div>
        <div className="grid items-center gap-4 p-5 sm:grid-cols-[minmax(0,15rem)_1fr] sm:p-6">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover object-center sm:aspect-square" />
          ) : null}
          <div className={photo ? "min-w-0" : "min-w-0 sm:col-span-2"}>
            <h2 className="break-words text-3xl font-black leading-tight !text-white">{name}</h2>
            {location ? <p className="mt-1 font-semibold !text-emerald-50">{location}</p> : null}
            {services.length ? (
              <ul className="mt-3 flex flex-wrap gap-2">
                {services.slice(0, 3).map((service) => (
                  <li key={service} className="rounded-full bg-lime-100 px-3 py-1 text-sm font-bold !text-[#103743]">{service}</li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t-4 border-lime-400 p-5 sm:p-6">
        <div className={qrHref ? "grid items-center gap-5 sm:grid-cols-[1fr_minmax(0,17rem)]" : ""}>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-slate-950">{qrHref ? "Scan to view this Guru" : "Share this Guru"}</h3>
            <p className="mt-1 font-medium text-slate-600">See services and booking options.</p>
          </div>
          {qrHref ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrHref} width={640} height={640} loading="lazy" alt={`QR code for ${name}'s SitGuru profile`} className="mx-auto h-auto w-full max-w-[17rem] rounded-2xl border-[3px] border-lime-500 bg-white" />
          ) : null}
        </div>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={() => void share()} className="min-h-12 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Share profile</button>
          <button type="button" onClick={() => void copyLink()} className={button}>Copy link</button>
          <a href={`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(url)}`} className={button}>Email link</a>
          {qrHref ? <a href={qrHref} download="sitguru-profile-qr.png" className={button}>Download QR</a> : null}
        </div>
        <p className="mt-3 break-all text-sm text-slate-600">{url}</p>
        <p role="status" className="text-sm font-semibold text-emerald-800">{message}</p>
      </div>
      <div className="border-t border-emerald-100 bg-emerald-50 px-5 py-3">
        <Link href={perksHref} className="inline-flex min-h-12 items-center text-sm font-black text-[#0D5C3A] underline underline-offset-4">
          {perksHref === "/petperks" ? "Explore PetPerks" : "Share my PetPerks invite"}
        </Link>
      </div>
    </section>
  );
}
