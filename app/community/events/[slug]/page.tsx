import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  MapPin,
  PawPrint,
  Ticket,
} from "lucide-react";
import CommunityEventCompanionSeed from "@/components/community/CommunityEventCompanionSeed";
import EventDetailShare from "@/components/community/EventDetailShare";
import EventGoingButton from "@/components/community/EventGoingButton";
import EventPetParentSignupBox from "@/components/community/EventPetParentSignupBox";
import EventRsvpReturnHandler from "@/components/community/EventRsvpReturnHandler";
import EventViewTracker from "@/components/community/EventViewTracker";
import { getEventAttendanceCounts } from "@/lib/community/attendance";
import {
  formatEventCountyState,
  formatEventDateRange,
  formatEventLocation,
  formatEventLocationInline,
  getEventHeroImage,
} from "@/lib/community/format";
import { fetchPublicEventBySlug } from "@/lib/community/queries";
import { buildEventShareMeta } from "@/lib/community/share";
import { isGoogleDiscoveryEvent } from "@/lib/community/event-preview";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = await fetchPublicEventBySlug(slug);

  if (!event) {
    return {
      title: "Event not found",
    };
  }

  const meta = buildEventShareMeta(event, event.partners?.business_name);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: meta.url,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: meta.url,
      siteName: "SitGuru",
      images: [{ url: meta.image, width: 1200, height: 630, alt: meta.title }],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      images: [meta.image],
    },
  };
}

export default async function CommunityEventDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const event = await fetchPublicEventBySlug(slug);

  if (!event) {
    notFound();
  }

  const attendanceCounts = await getEventAttendanceCounts(event.id);

  const partnerName = event.partners?.business_name || "SitGuru Partner";
  const partnerSlug = event.partners?.slug;
  const imageUrl = getEventHeroImage(event);
  const timing = formatEventDateRange(event.start_at, event.end_at, event.timezone);
  const locationBlock = formatEventLocation(event);
  const googleDiscovery = isGoogleDiscoveryEvent(event);
  const sourceLabel = googleDiscovery
    ? "Pet Event"
    : "SitGuru Partner Event";

  return (
    <main className="min-h-screen bg-[#f8fcfd]">
      <EventViewTracker eventId={event.id} slug={event.slug} />
      <CommunityEventCompanionSeed
        id={event.id}
        slug={event.slug}
        title={event.title}
        city={event.city}
        state={event.state}
      />

      <section className="border-b border-slate-100 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
            <div className="order-2 overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-sm lg:order-1">
              <div className="relative min-h-[280px] bg-emerald-50 lg:min-h-[420px]">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={event.title}
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 1024px) 100vw, 70vw"
                  />
                ) : (
                  <div className="flex h-full min-h-[280px] items-center justify-center">
                    <PawPrint className="h-16 w-16 text-emerald-700/30" />
                  </div>
                )}
              </div>

              <div className="space-y-6 p-6 sm:p-8">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                      {sourceLabel}
                    </p>
                    <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                      {event.title}
                    </h1>
                    <p className="text-sm font-bold text-emerald-800">
                      {formatEventCountyState(event)}
                    </p>
                    <p className="text-sm font-semibold text-slate-600">
                      Hosted by{" "}
                      {partnerSlug ? (
                        <Link
                          href={`/p/${partnerSlug}`}
                          className="font-black text-emerald-800"
                        >
                          {partnerName}
                        </Link>
                      ) : (
                        partnerName
                      )}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {event.is_free ? (
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                        Free Event
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                        <Ticket className="h-3.5 w-3.5" />
                        Tickets
                      </span>
                    )}
                    {event.pet_friendly ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-800">
                        <PawPrint className="h-3.5 w-3.5" />
                        Pet Friendly
                      </span>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-black text-slate-800">
                      <CalendarDays className="h-4 w-4 text-emerald-700" />
                      {timing.dateLabel}
                    </p>
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {timing.timeLabel}
                    </p>
                  </div>
                  <div className="rounded-3xl border border-slate-100 bg-slate-50 p-5">
                    <p className="inline-flex items-center gap-2 text-sm font-black text-slate-800">
                      <MapPin className="h-4 w-4 text-emerald-700" />
                      {formatEventLocationInline(event)}
                    </p>
                    <p className="mt-2 whitespace-pre-line text-sm font-semibold text-slate-700">
                      {locationBlock}
                    </p>
                  </div>
                </div>

                {event.short_description ? (
                  <p className="text-base font-medium leading-relaxed text-slate-700">
                    {event.short_description}
                  </p>
                ) : null}

                {event.description ? (
                  <div className="rounded-3xl border border-slate-100 bg-white p-5 text-sm leading-relaxed text-slate-700">
                    {event.description}
                  </div>
                ) : null}

                {(event.categories || []).length ? (
                  <div className="flex flex-wrap gap-2">
                    {(event.categories || []).map((category) => (
                      <span
                        key={category}
                        className="rounded-full border border-slate-200 px-3 py-1 text-xs font-black text-slate-700"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="flex flex-col gap-3">
                  <Suspense fallback={null}>
                    <EventRsvpReturnHandler
                      eventId={event.id}
                      slug={event.slug}
                    />
                  </Suspense>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    <EventGoingButton
                      eventId={event.id}
                      eventSlug={event.slug}
                      initialCounts={attendanceCounts}
                    />
                    {event.ticket_url ? (
                      <a
                        href={event.ticket_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-900"
                      >
                        Register / Tickets
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    ) : null}
                    {partnerSlug ? (
                      <Link
                        href={`/p/${partnerSlug}`}
                        className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-900"
                      >
                        View Partner
                      </Link>
                    ) : null}
                    <Link
                      href={`/search?city=${encodeURIComponent(event.city || "")}&state=${encodeURIComponent(event.state || "")}`}
                      className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-black text-slate-900"
                    >
                      Meet Local Gurus
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            <div className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-24">
              <EventPetParentSignupBox
                event={event}
                source="community_event_detail"
                campaign="event_detail_pet_parent_signup"
              />
              <EventDetailShare event={event} partnerName={partnerName} />
              <Link
                href="/community"
                className="inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 text-sm font-black text-slate-800"
              >
                ← Back to Community search
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
