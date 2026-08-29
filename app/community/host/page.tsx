import type { Metadata } from "next";
import Link from "next/link";
import {
  CalendarPlus,
  ClipboardList,
  Globe2,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Host Pet Events | SitGuru Community",
  description:
    "Pet event planners and managers can publish SitGuru Partner Events manually, update listings, and reach Pet Parents — while social and Google discoveries fill the broader community map.",
  alternates: {
    canonical: "/community/host",
  },
};

const paths = [
  {
    icon: CalendarPlus,
    title: "Publish manually (recommended for hosts)",
    body: "Create and update your adoption days, fundraisers, meetups, and festivals in the Partner Dashboard. These become SitGuru Partner Events and always keep top visual priority.",
  },
  {
    icon: Globe2,
    title: "Social & Google discoveries",
    body: "SitGuru also finds pet-relevant events via SerpApi across Community Markets (PA/NJ first). Those show as Community Events — great coverage, but partner-published listings stay ahead.",
  },
  {
    icon: ShieldCheck,
    title: "Review before it goes live",
    body: "Partner submissions go through SitGuru review. Once published, they appear on the Community map, homepage banner, and full events list.",
  },
];

export default function CommunityHostPage() {
  return (
    <main className="min-h-screen bg-[#f8fcfd]">
      <section className="public-dark-section border-b border-emerald-900/20 bg-[#0D5C3A] py-14 text-white">
        <div className="mx-auto max-w-5xl px-5 sm:px-6 lg:px-8">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-100">
            Pet Event Planners & Managers
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight !text-white sm:text-5xl">
            Put your pet event on SitGuru
          </h1>
          <p className="mt-4 max-w-2xl text-base font-semibold text-emerald-50 sm:text-lg">
            Host rescues, shelters, trainers, groomers, vets, and community
            organizers can publish and update events manually — so Pet Parents
            find the real thing, not just a social post.
          </p>
          <div className="mt-7 flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href="/partners/apply?intent=community_events&source=community_host"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-white px-6 text-sm font-black text-emerald-900 sm:w-auto"
            >
              Become a Partner Host
            </Link>
            <Link
              href="/partners/dashboard/community/events"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/40 bg-white/10 px-6 text-sm font-black !text-white sm:w-auto"
            >
              Manage my events
            </Link>
            <Link
              href="/community"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl border border-white/30 px-6 text-sm font-black !text-white sm:w-auto"
            >
              View community map
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-5 py-12 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
            How events enter Community
          </p>
          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Two ways events show up — partners always lead
          </h2>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {paths.map(({ icon: Icon, title, body }) => (
            <article
              key={title}
              className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm"
            >
              <Icon className="h-5 w-5 text-emerald-700" />
              <h3 className="mt-3 text-lg font-black text-slate-950">{title}</h3>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-slate-600">
                {body}
              </p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <article className="rounded-[1.75rem] border border-emerald-100 bg-emerald-50 p-6">
            <div className="inline-flex items-center gap-2 text-emerald-900">
              <ClipboardList className="h-5 w-5" />
              <p className="text-sm font-black uppercase tracking-[0.12em]">
                SitGuru Partner Event
              </p>
            </div>
            <p className="mt-3 text-base font-semibold text-emerald-950/90">
              You (or your team) create and update the listing: photos, time,
              venue, RSVP, and promotion. Highest priority on the map and
              homepage.
            </p>
            <Link
              href="/partners/dashboard/community/events"
              className="mt-5 inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white"
            >
              Open event manager
            </Link>
          </article>

          <article className="rounded-[1.75rem] border border-slate-200 bg-white p-6">
            <div className="inline-flex items-center gap-2 text-slate-800">
              <Sparkles className="h-5 w-5 text-emerald-700" />
              <p className="text-sm font-black uppercase tracking-[0.12em]">
                Community Event (discovered)
              </p>
            </div>
            <p className="mt-3 text-base font-semibold text-slate-600">
              Found from public Google/social signals in enabled Community
              Markets. Helpful for coverage — claim or republish as a Partner
              Event if it&apos;s yours for full control.
            </p>
            <Link
              href="/community"
              className="mt-5 inline-flex min-h-11 items-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800"
            >
              See discoveries on the map
            </Link>
          </article>
        </div>

        <div className="mt-10 rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
                <MapPin className="h-4 w-4" />
                Ready to host?
              </p>
              <h2 className="mt-2 text-2xl font-black text-slate-950 sm:text-3xl">
                Apply once, then manage events anytime
              </h2>
              <p className="mt-3 text-sm font-semibold leading-relaxed text-slate-600">
                Pet event planners, rescue managers, shelter coordinators, and
                venue hosts use the same Partner tools — create drafts, submit
                for review, and update published events as details change.
              </p>
            </div>
            <div className="flex flex-col gap-2 sm:min-w-[220px]">
              <Link
                href="/partners/apply?intent=community_events&source=community_host"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white"
              >
                Apply as Partner Host
              </Link>
              <Link
                href="/partners"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-300 bg-white px-5 text-sm font-black text-slate-800"
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
