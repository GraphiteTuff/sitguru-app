"use client";

/**
 * Homepage showcase for PawReport Live.
 * All progress, locations and care events below are illustrative marketing
 * content, never a live booking or location feed.
 */
import Link from "next/link";
import {
  CalendarCheck2,
  Camera,
  Check,
  Clock3,
  Droplets,
  Flame,
  Footprints,
  Heart,
  MapPin,
  PawPrint,
  Play,
  Route,
  Search,
  ShieldCheck,
  FileText,
} from "lucide-react";

type Props = {
  onTrack: (label: string, destination: string) => void;
};

const samplePhotos = [
  {
    src: "/images/pawreport/scout-on-trail.jpg",
    alt: "Scout enjoying a sunny walk outdoors",
  },
  {
    src: "/images/pawreport/scout-park-entrance.jpg",
    alt: "Scout exploring the park during a walk",
  },
  {
    src: "/images/pawreport/scout-resting-after-walk.jpg",
    alt: "Scout relaxing after the walk",
  },
] as const;

const highlights = [
  {
    icon: Route,
    title: "Follow Walks in Real Time",
    description: "See walk time, progress, distance, and available route details.",
  },
  {
    icon: Camera,
    title: "Get Live Updates",
    description: "Receive photos and notes about food, water, potty, medication, and play.",
  },
  {
    icon: CalendarCheck2,
    title: "Keep a Full History",
    description: "Review completed PawReports from past bookings in one place.",
  },
  {
    icon: Heart,
    title: "Peace of Mind",
    description: "Stay connected to your pet's care with transparent visit updates.",
  },
] as const;

function SampleWalkMap() {
  return (
    <div
      className="relative isolate h-[158px] overflow-hidden rounded-2xl border border-emerald-100 bg-[#e8f5ec] sm:h-[176px]"
      role="img"
      aria-label="Illustrative map of Scout's walk route with a starting point and finishing point; not live GPS data"
    >
      <svg
        viewBox="0 0 520 240"
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="pawreport-showcase-map-bg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e8f6ea" />
            <stop offset="100%" stopColor="#e1f2e9" />
          </linearGradient>
        </defs>
        <rect width="520" height="240" fill="url(#pawreport-showcase-map-bg)" />
        <path d="M0 145 L145 110 205 160 337 131 520 165 V240 H0Z" fill="#d4eecb" />
        <path d="M320 0 385 40 404 92 520 105 V0Z" fill="#d4eecb" />
        <path d="M0 36 110 54 180 13 295 48 378 15 520 45" stroke="#fff" strokeWidth="18" fill="none" />
        <path d="M21 240 118 168 205 152 290 103 336 0" stroke="#fff" strokeWidth="16" fill="none" />
        <path d="M0 102 88 120 199 86 287 117 377 91 520 131" stroke="#fff" strokeWidth="13" fill="none" />
        <path d="M168 0 168 83 220 140 231 240" stroke="#fff" strokeWidth="11" fill="none" />
        <path d="M430 0 414 68 444 158 508 240" stroke="#fff" strokeWidth="12" fill="none" />
        <path d="M382 0 C389 30 364 47 385 70 S444 98 432 141" stroke="#a8daf0" strokeWidth="22" fill="none" opacity=".85" />
        <path d="M0 36 110 54 180 13 295 48 378 15 520 45" stroke="#cbded2" strokeWidth="1.5" fill="none" />
        <path d="M21 240 118 168 205 152 290 103 336 0" stroke="#cbded2" strokeWidth="1.5" fill="none" />
        <path d="M0 102 88 120 199 86 287 117 377 91 520 131" stroke="#cbded2" strokeWidth="1.5" fill="none" />
        <path d="M58 184 C115 196 149 149 197 130 S258 106 290 122 S365 125 406 91 L460 65" stroke="#fff" strokeWidth="12" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M58 184 C115 196 149 149 197 130 S258 106 290 122 S365 125 406 91 L460 65" stroke="#00a54d" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <circle cx="58" cy="184" r="15" fill="#fff" />
        <circle cx="58" cy="184" r="10" fill="#00834e" />
        <circle cx="58" cy="184" r="4" fill="#fff" />
        <circle cx="460" cy="65" r="23" fill="#fff" />
        <circle cx="460" cy="65" r="17" fill="#00834e" />
        <circle cx="460" cy="65" r="6" fill="#fff" />
      </svg>
      <span className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-emerald-900 shadow-sm">
        Sample walk route
      </span>
      <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-1 text-[10px] font-bold text-emerald-900 shadow-sm">
        <PawPrint className="h-3.5 w-3.5" />
        Scout
      </span>
    </div>
  );
}

export default function HomepagePawReportExperience({ onTrack }: Props) {
  return (
    <section
      aria-labelledby="pawreport-homepage-heading"
      className="relative isolate overflow-hidden bg-gradient-to-br from-[#f8fffb] via-white to-[#f4fcf6] pb-20 pt-12 text-slate-950 sm:pt-16 lg:pb-24"
    >
      <PawPrint
        aria-hidden="true"
        className="pointer-events-none absolute right-7 top-4 h-28 w-28 -rotate-12 text-emerald-100/70 sm:right-14 sm:h-36 sm:w-36"
      />

      <div className="relative z-10 mx-auto grid max-w-[1600px] items-center gap-8 px-4 sm:px-6 lg:grid-cols-[minmax(0,0.84fr)_minmax(0,1.16fr)] lg:gap-9 lg:px-8 2xl:gap-12">
        {/* Marketing preview: real booking data appears only on the booking dashboards. */}
        <div className="min-w-0 rounded-[32px] border border-emerald-700/20 bg-gradient-to-br from-[#003c2d] via-[#005938] to-[#006c44] p-4 shadow-[0_26px_60px_rgba(0,65,42,0.18)] sm:p-5 lg:p-6">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2 text-white">
              <PawPrint aria-hidden="true" className="h-8 w-8 shrink-0 fill-white" />
              <div className="text-[25px] font-black tracking-[-0.055em] sm:text-[30px]">
                PawReport <span className="text-lime-400">Live</span><sup className="ml-0.5 text-[10px]">TM</sup>
              </div>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400 bg-emerald-900/60 px-3 py-2 text-[10px] font-extrabold uppercase tracking-wide text-white shadow-sm sm:text-xs">
              <span className="h-2.5 w-2.5 rounded-full bg-lime-400 shadow-[0_0_0_3px_rgba(163,230,53,0.12)]" />
              Live care update
            </span>
          </div>

          <div className="overflow-hidden rounded-[30px] border border-white/40 bg-white p-4 shadow-[0_16px_40px_rgba(0,0,0,0.14)] sm:p-5">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-md sm:h-20 sm:w-20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/pawreport/scout-on-trail.jpg"
                  alt="Scout, the dog featured in this sample PawReport"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.13em] text-emerald-700">
                  Sample PawReport
                </p>
                <h3 className="text-[24px] font-black leading-tight tracking-tight text-[#111b35] sm:text-[29px]">
                  Scout&apos;s Walk
                </h3>
                <p className="mt-0.5 text-xs font-semibold text-slate-600 sm:text-sm">
                  Care updates from your Guru
                </p>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <CalendarCheck2 className="h-3.5 w-3.5" />
                    Sample visit
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    Quakertown, PA
                  </span>
                </div>
              </div>
              <PawPrint aria-hidden="true" className="hidden h-9 w-9 shrink-0 fill-emerald-100 text-emerald-100 sm:block" />
            </div>

            <div className="mt-4 rounded-[22px] border border-emerald-100 bg-gradient-to-b from-emerald-50 to-[#e5f8eb] p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-2.5">
                  <Footprints className="h-8 w-8 shrink-0 text-emerald-700" />
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800">
                      Walk in progress
                    </p>
                    <p className="mt-0.5 text-xl font-black leading-tight tracking-tight text-[#111b35] sm:text-[24px]">
                      0.8 mi <span className="text-emerald-700">·</span> 18 min
                    </p>
                  </div>
                </div>
                <div className="min-w-[114px] flex-1 sm:max-w-[190px]">
                  <p className="mb-1 text-right text-[11px] font-extrabold text-slate-900">
                    60% complete
                  </p>
                  <div
                    role="progressbar"
                    aria-label="Sample walk progress"
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={60}
                    className="h-2.5 overflow-hidden rounded-full bg-emerald-100"
                  >
                    <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-green-500 to-lime-500" />
                  </div>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-[minmax(0,1fr)_100px] gap-2 sm:grid-cols-[minmax(0,1fr)_116px]">
                <SampleWalkMap />
                <div className="flex flex-col justify-center gap-3 rounded-2xl border border-emerald-100 bg-white/70 px-2.5 py-3 sm:gap-4">
                  <div className="flex items-start gap-1.5">
                    <Route className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div>
                      <p className="text-sm font-black leading-tight text-[#111b35]">0.8 mi</p>
                      <p className="text-[10px] font-semibold text-slate-500">Distance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                    <div>
                      <p className="text-sm font-black leading-tight text-[#111b35]">18 min</p>
                      <p className="text-[10px] font-semibold text-slate-500">Walk time</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <Flame className="mt-0.5 h-4 w-4 shrink-0 text-orange-500" />
                    <div>
                      <p className="text-sm font-black leading-tight text-[#111b35]">62 cal</p>
                      <p className="text-[10px] font-semibold text-slate-500">Demo estimate</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-1.5 sm:gap-2">
              {samplePhotos.map((photo, index) => (
                <Link
                  key={photo.src}
                  href="/pawreport-live"
                  onClick={() => onTrack("PawReport demo photo", "/pawreport-live")}
                  aria-label="See how PawReport photos work"
                  className="group relative aspect-[1.35/1] min-w-0 overflow-hidden rounded-xl bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={photo.src}
                    alt={photo.alt}
                    loading="lazy"
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {index === 0 ? (
                    <span className="absolute bottom-1.5 left-1.5 inline-flex items-center gap-1 rounded-md bg-slate-950/80 px-2 py-1 text-[10px] font-bold text-white">
                      <Camera className="h-3 w-3" />
                      3 Photos
                    </span>
                  ) : null}
                </Link>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              {[
                { icon: Droplets, text: "Water refreshed", color: "text-sky-500" },
                { icon: PawPrint, text: "Potty break completed", color: "text-amber-600" },
                { icon: FileText, text: "Scout loved the park!", color: "text-violet-500" },
              ].map(({ icon: Icon, text, color }) => (
                <div
                  key={text}
                  className="flex min-h-10 items-center gap-2.5 rounded-xl bg-[#f4f6fa] px-3 py-2"
                >
                  <Icon aria-hidden="true" className={"h-5 w-5 shrink-0 " + color} />
                  <span className="flex-1 text-xs font-bold text-slate-900 sm:text-sm">
                    {text}
                  </span>
                  <span className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white">
                    <Check aria-hidden="true" className="h-3.5 w-3.5 stroke-[3]" />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-w-0 pb-6 lg:pb-9">
          <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800 sm:text-sm">
            <span className="hidden h-[2px] max-w-[95px] flex-1 bg-emerald-700 sm:block" />
            The SitGuru care experience
            <span className="h-[2px] flex-1 bg-emerald-700" />
          </div>

          <h2
            id="pawreport-homepage-heading"
            className="mt-5 max-w-[960px] text-[clamp(2.45rem,4.6vw,5rem)] font-black leading-[1.06] tracking-[-0.052em] text-[#111b35]"
          >
            Know how <span className="relative whitespace-normal text-emerald-800">every visit<span aria-hidden="true" className="absolute -bottom-1 left-0 h-[5px] w-full rounded-full bg-lime-400/80" /></span> went.
          </h2>
          <p className="mt-5 max-w-3xl text-base font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
            PawReport keeps walk progress, photos, care notes, and a complete visit
            history connected to the booking — so you always feel in the loop.
          </p>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
            {highlights.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="flex h-full flex-col items-center rounded-[24px] border border-slate-100 bg-white px-3 pb-5 pt-5 text-center shadow-[0_10px_25px_rgba(15,23,42,0.09)] transition-transform hover:-translate-y-1 sm:px-4 sm:pb-6"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e6f8eb] text-emerald-700 sm:h-20 sm:w-20">
                  <Icon aria-hidden="true" className="h-9 w-9 stroke-[2.4] sm:h-11 sm:w-11" />
                </span>
                <h3 className="mt-4 min-h-[48px] text-base font-black leading-[1.15] tracking-tight text-[#111b35] sm:text-lg">
                  {title}
                </h3>
                <span aria-hidden="true" className="my-3 h-[3px] w-10 rounded-full bg-lime-500" />
                <p className="text-xs font-medium leading-[1.65] text-slate-700 sm:text-sm">
                  {description}
                </p>
              </article>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
            <Link
              href="/search"
              onClick={() => onTrack("Find a Guru PawReport", "/search")}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-700 to-green-600 px-8 py-3 text-base font-black text-white shadow-[0_7px_15px_rgba(0,113,66,0.18)] transition hover:from-emerald-800 hover:to-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
              Find a Guru
            </Link>
            <Link
              href="/pawreport-live"
              onClick={() => onTrack("See how PawReport works", "/pawreport-live")}
              className="inline-flex min-h-14 items-center justify-center gap-3 rounded-full border-2 border-emerald-700 bg-white px-6 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:text-base"
            >
              <Play aria-hidden="true" className="h-5 w-5 fill-current" />
              See How PawReport Works
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-3 text-xs font-extrabold text-[#111b35] sm:gap-x-6 sm:text-sm xl:pr-28">
            <span className="inline-flex items-center gap-2"><ShieldCheck aria-hidden="true" className="h-6 w-6 text-emerald-700" />Trusted Gurus</span>
            <span className="hidden h-6 w-px bg-emerald-200 sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2"><CalendarCheck2 aria-hidden="true" className="h-6 w-6 text-emerald-700" />Real-Time Care</span>
            <span className="hidden h-6 w-px bg-emerald-200 sm:block" aria-hidden="true" />
            <span className="inline-flex items-center gap-2"><PawPrint aria-hidden="true" className="h-6 w-6 fill-emerald-700 text-emerald-700" />Complete Visit Records</span>
          </div>

          <p className="mt-4 text-[11px] font-medium text-slate-500">
            Illustrative PawReport preview. Actual updates and route availability depend on your booking and Guru.
          </p>
        </div>
      </div>

      {/* Decorative illustration and wave frame the same section on every screen size. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/images/booking-hero-pets.png"
        alt=""
        aria-hidden="true"
        loading="lazy"
        className="pointer-events-none absolute bottom-8 right-1 z-20 hidden h-36 w-44 object-contain object-bottom drop-shadow-xl 2xl:block"
      />
      <svg
        viewBox="0 0 1440 110"
        preserveAspectRatio="none"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 left-0 z-0 h-16 w-full sm:h-20"
      >
        <path d="M0 45 C240 -5 355 99 650 74 S1080 10 1440 42 V110 H0Z" fill="#bef264" />
        <path d="M0 65 C248 20 355 110 650 90 S1090 28 1440 60 V110 H0Z" fill="#006c45" />
      </svg>
    </section>
  );
}
