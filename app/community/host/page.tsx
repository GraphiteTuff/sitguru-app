import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarPlus,
  ClipboardList,
  HeartHandshake,
  MapPin,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from "lucide-react";
import CommunityHostSurfaceCtas from "@/components/community/CommunityHostSurfaceCtas";

export const metadata: Metadata = {
  title: "Host Pet Events | SitGuru",
  description:
    "Pet event planners and managers: publish adoption days, meetups, and festivals on SitGuru. Partner Events stay front and center for Pet Parents nearby.",
  alternates: {
    canonical: "/community/host",
  },
};

const steps = [
  {
    icon: CalendarPlus,
    title: "Create your event",
    body: "Add the name, photo, date, place, and a short description. It should feel as easy as posting an event your friends would actually open.",
  },
  {
    icon: ShieldCheck,
    title: "We give it a quick review",
    body: "SitGuru checks Partner listings before they go live so Pet Parents see clear, trustworthy details — not half-finished posts.",
  },
  {
    icon: HeartHandshake,
    title: "Reach local pet parents",
    body: "Published Partner Events show on the Pet Events map, event list, and homepage highlights — with top priority over general listings.",
  },
];

export default function CommunityHostPage() {
  return (
    <main className="min-h-screen bg-[#f8fcfd]">
      <section className="public-dark-section border-b border-emerald-900/20 bg-[#0D5C3A] py-10 text-white sm:py-14">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-100 sm:text-xs">
            Pet Event Planners & Managers
          </p>
          <h1 className="mt-3 max-w-3xl text-[1.85rem] font-black leading-tight tracking-tight !text-white sm:text-4xl lg:text-5xl">
            Put your pet event on SitGuru
          </h1>
          <p className="mt-4 max-w-2xl text-sm font-semibold leading-relaxed text-emerald-50 sm:text-base lg:text-lg">
            Rescues, shelters, trainers, groomers, vets, and local organizers can
            publish and update events so Pet Parents find the real gathering —
            with photos, time, and a clear place to show interest.
          </p>

          <CommunityHostSurfaceCtas className="mt-7" />
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-12 lg:px-8">
        <div className="mb-6 sm:mb-8">
          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 sm:text-xs">
            How hosting works
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Simple for hosts. Clear for Pet Parents.
          </h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold text-slate-600 sm:text-base">
            You stay in control of your listing. SitGuru helps the right local
            pet people see it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-3">
          {steps.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm sm:rounded-[1.75rem] sm:p-6"
            >
              <Icon className="h-5 w-5 text-emerald-700" aria-hidden />
              <h3 className="mt-3 text-base font-black text-slate-950 sm:text-lg">
                {title}
              </h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                {body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:gap-4 md:grid-cols-2">
          <article className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50 p-5 sm:rounded-[1.75rem] sm:p-6">
            <div className="inline-flex items-center gap-2 text-emerald-900">
              <ClipboardList className="h-5 w-5" aria-hidden />
              <p className="text-[11px] font-black uppercase tracking-[0.12em] sm:text-xs">
                SitGuru Partner Event
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-emerald-950/90 sm:text-base">
              You create and update the listing — photos, time, venue, and
              interest buttons. Partner Events always show first on Pet Events.
            </p>
            <Link
              href="/partners/dashboard/community/events"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white sm:w-auto"
            >
              Open Event Manager
            </Link>
          </article>

          <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:rounded-[1.75rem] sm:p-6">
            <div className="inline-flex items-center gap-2 text-slate-800">
              <Sparkles className="h-5 w-5 text-emerald-700" aria-hidden />
              <p className="text-[11px] font-black uppercase tracking-[0.12em] sm:text-xs">
                Pet Event
              </p>
            </div>
            <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600 sm:text-base">
              Extra local pet gatherings SitGuru surfaces so the map stays full.
              If one of those is yours, claim it as a Partner Event for full
              control and top placement.
            </p>
            <Link
              href="/community"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800 sm:w-auto"
            >
              Browse Pet Events map
            </Link>
          </article>
        </div>

        <div className="mt-8 rounded-[1.5rem] border border-slate-200 bg-white p-5 sm:mt-10 sm:rounded-[1.75rem] sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 sm:text-xs">
                <MapPin className="h-4 w-4" aria-hidden />
                Ready to host?
              </p>
              <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl lg:text-3xl">
                Apply once, then manage events anytime
              </h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
                Pet event planners, rescue managers, shelter coordinators, and
                venue hosts use the same Event Manager — create, update,
                promote, and see interest from Pet Parents and Gurus.
              </p>
              <p className="mt-3 inline-flex items-start gap-2 text-sm font-semibold text-slate-500">
                <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
                Works on SitGuru website, mobile web, and the SitGuru app —
                same Partner tools, sized for your screen.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:max-w-xs lg:min-w-[220px]">
              <Link
                href="/partners/apply?intent=community_events&source=community_host"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white"
              >
                Apply as Partner Host
              </Link>
              <Link
                href="/help/account/update-community-events"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800"
              >
                How to update events
              </Link>
              <Link
                href="/partners"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 text-sm font-black text-slate-700"
              >
                Learn about Partners
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
