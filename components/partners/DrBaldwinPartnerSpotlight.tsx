"use client";

import Link from "next/link";

const spotlightHref = "/partners/spotlight/dr-gracyn-baldwin";
const partnerHref = "https://annabelstouchchiropracticandrehab.janeapp.com/";

type Props = {
  onTrack: (label: string, destination: string) => void;
};

/**
 * A first-party featured partner block. Keep it directly after the partner
 * carousel and before Local Pet Life so the placement matches the homepage
 * spotlight design without interrupting existing partner rotation.
 */
export default function DrBaldwinPartnerSpotlight({ onTrack }: Props) {
  return (
    <section
      aria-labelledby="dr-baldwin-spotlight-heading"
      className="bg-white px-4 pb-7 pt-0 sm:px-6 sm:pb-10 lg:px-8"
    >
      <div className="mx-auto max-w-7xl rounded-[1.6rem] border border-slate-200 bg-white p-5 shadow-sm sm:p-7 lg:p-8">
        <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-9">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-emerald-800 sm:text-sm">
              Partner Spotlight
            </p>
            <h2
              id="dr-baldwin-spotlight-heading"
              className="mt-2 text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl lg:text-[2.6rem]"
            >
              Meet Dr. Gracyn Baldwin
            </h2>
            <p className="mt-1 text-lg font-semibold text-slate-700 sm:text-xl">
              Annabel&apos;s Touch Chiropractic
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-700 sm:text-base">
              Dr. Gracyn Baldwin brings personalized, movement-focused
              chiropractic care directly to people in the Orlando area. Inspired
              by her beloved dog, Annabel, she is also preparing to extend her
              approach to four-legged companions. Her individual sessions combine
              chiropractic adjustments, hands-on therapies, mobility work, and
              corrective exercise. Animal services are planned for the future,
              subject to the appropriate certification and veterinary requirements.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <Link
                href={spotlightHref}
                onClick={() => onTrack("Read Dr. Gracyn Baldwin spotlight", spotlightHref)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#075b41] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#064b35] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              >
                Read spotlight <span aria-hidden="true" className="ml-2">→</span>
              </Link>
              <a
                href={partnerHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => onTrack("View Annabel's Touch Chiropractic partner", partnerHref)}
                className="inline-flex min-h-11 items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-2.5 text-sm font-bold text-emerald-900 transition hover:border-emerald-700 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-800"
              >
                View partner <span aria-hidden="true" className="ml-2">→</span>
              </a>
            </div>
          </div>
          <div className="relative min-w-0 overflow-hidden rounded-[1.3rem] bg-emerald-50 shadow-sm">
            <img
              src="/images/partners/dr-gracyn-baldwin-spotlight.webp"
              alt="Featured partner illustration from the supplied Dr. Gracyn Baldwin spotlight reference"
              className="aspect-[2.2/1] h-auto w-full object-cover"
              loading="lazy"
            />
            <span className="sr-only">Local Partner Feature</span>
          </div>
        </div>
      </div>
    </section>
  );
}
