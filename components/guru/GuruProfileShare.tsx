"use client";

import Link from "next/link";
import { useState } from "react";

export default function GuruProfileShare({
  name,
  location,
  photo,
  services,
  experienceYears,
  url,
  qrHref,
  perksHref,
}: {
  name: string;
  location: string;
  photo?: string | null;
  services: string[];
  experienceYears: number;
  url: string;
  qrHref?: string;
  perksHref: string;
}) {
  const [message, setMessage] = useState("");
  const firstName = name.trim().split(/\s+/)[0] || "your Guru";
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
    <section id="share-guru-profile" className="mx-auto mt-4 w-full max-w-3xl scroll-mt-28 overflow-hidden rounded-[1.75rem] border border-emerald-100 bg-white shadow-sm" aria-label={`Share ${name}'s profile`}>
      <div data-brand-green="true" className="bg-[linear-gradient(135deg,#103743,#07583F)]">
        <div className="flex items-center justify-between gap-3 pr-5">
          <div className="flex w-1/2 items-center justify-center rounded-br-[70%] border-b-4 border-lime-400 bg-white py-5 pl-2 pr-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/sitguru-logo-cropped.png" alt="SitGuru" width={152} height={52} className="h-auto w-full max-w-48 object-contain" />
          </div>
          <p className="max-w-48 text-right text-base font-black uppercase leading-tight !text-white sm:text-2xl">Meet your<br /><span className="!text-lime-200">local Guru!</span></p>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-center gap-3 p-4 sm:gap-7 sm:p-6">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photo} alt="" loading="lazy" className="aspect-[4/5] w-full rounded-2xl object-cover object-center " />
          ) : null}
          <div className={photo ? "min-w-0" : "min-w-0 col-span-2"}>
            <h2 className="break-words text-3xl font-black leading-tight !text-white sm:text-5xl">{firstName}</h2>
            {location ? <p className="mt-2 font-bold !text-emerald-50 sm:text-xl">{location}</p> : null}
            {services[0] ? (
              <p className="mt-4 rounded-full bg-lime-100 px-3 py-2 text-sm font-black !text-[#103743] sm:text-xl">{services[0]}</p>
            ) : null}
            <ul className="mt-4 space-y-2 text-sm font-bold !text-white sm:text-lg">
              <li><span aria-hidden="true" className="mr-2 !text-lime-300">✓</span>Explore services</li>
              <li><span aria-hidden="true" className="mr-2 !text-lime-300">✓</span>Check availability</li>
            </ul>
            {Number.isFinite(experienceYears) && experienceYears > 0 ? (
              <p className="mt-4 text-sm font-bold !text-white sm:text-lg">
                <span aria-hidden="true" className="mr-1 !text-lime-300">✓</span>
                {experienceYears} {experienceYears === 1 ? "year" : "years"} of experience
              </p>
            ) : null}
          </div>
        </div>
      </div>
      <div className="border-t-4 border-lime-400 p-5 sm:p-6">
        <div className={qrHref ? "grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] items-center gap-3 sm:grid-cols-[1fr_minmax(0,17rem)]" : ""}>
          <div className="min-w-0">
            <h3 className="text-2xl font-black leading-tight text-slate-950 sm:text-4xl">Reliable care for happier pets!</h3>
            <p className="mt-3 border-t-4 border-lime-400 pt-3 text-sm font-black uppercase text-[#0D5C3A]">{qrHref ? `Scan to view ${firstName}’s profile` : `View ${firstName}’s profile`}</p>
            <p className="mt-1 text-sm text-slate-600">See profile &amp; booking options</p>
          </div>
          {qrHref ? (
            // eslint-disable-next-line @next/next/no-img-element
            <a href={qrHref} target="_blank" rel="noreferrer" aria-label="Open full-size profile QR code">
              <img src={qrHref} width={640} height={640} loading="lazy" alt={`QR code for ${name}'s SitGuru profile`} className="mx-auto h-auto w-full max-w-[17rem] rounded-2xl border-[3px] border-lime-500 bg-white" />
            </a>
          ) : null}
        </div>
        </div>
      <div className="flex items-center justify-between gap-3 bg-[#103743] px-5 py-2 font-black !text-white"><span>sitguru.com</span><span className="text-right text-xs uppercase !text-lime-200">Local pet care. Big heart.</span></div>
      <div className="px-5 pb-4"><div className="mt-5 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          <button type="button" onClick={() => void share()} className="min-h-12 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">Share {firstName}’s profile</button>
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
