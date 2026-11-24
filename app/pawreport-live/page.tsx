/**
 * Public PawReport Live explainer.
 * Booking-specific streams live under the authenticated customer / Guru dashboards.
 * The interactive example below contains illustrative, non-persistent sample data.
 */
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  CalendarCheck2,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Droplets,
  Footprints,
  HeartHandshake,
  MapPin,
  MessageSquareText,
  PawPrint,
  PlayCircle,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { PawReportLiveDashboard } from "@/components/pawreport";

export const metadata = {
  title: "PawReport Live | Walk Updates, Pet Photos & Visit Notes | SitGuru",
  description:
    "Explore SitGuru PawReport Live. See how pet parents can follow available walk details, view care photos and notes, and review completed visit history.",
};

const benefits = [
  {
    icon: Route,
    title: "Walk progress",
    description: "Follow time, distance, and available route information while your Guru cares for your pet.",
  },
  {
    icon: Camera,
    title: "Photos from care",
    description: "Enjoy visit photos shared by your Guru, organized with the booking.",
  },
  {
    icon: ClipboardCheck,
    title: "Care checklist",
    description: "Catch updates for water, food, potty breaks, medication, and play when logged.",
  },
  {
    icon: CalendarCheck2,
    title: "Visit history",
    description: "Look back on completed care notes and PawReports from your bookings.",
  },
] as const;

const steps = [
  {
    number: "01",
    icon: CalendarCheck2,
    title: "Book your Guru",
    body: "Find local care and select a Guru who fits your pet's needs. Your booking becomes the home for care updates.",
  },
  {
    number: "02",
    icon: Footprints,
    title: "Follow their visit",
    body: "As your Guru shares progress, photos, and notes, you can see those updates in your booking's PawReport.",
  },
  {
    number: "03",
    icon: HeartHandshake,
    title: "Keep the memories",
    body: "When the visit ends, return to the booking to review the care record and photos that were shared.",
  },
] as const;

const faq = [
  {
    question: "Are the walk route and photos on this page real?",
    answer:
      "No. This public page uses a sample visit so anyone can explore the experience. Your own PawReport displays information from an eligible booking after your Guru starts sharing updates.",
  },
  {
    question: "How do I see my pet's PawReport?",
    answer:
      "Sign in to SitGuru as a Pet Parent and open Bookings. Select your booking and choose its visit updates to see any photos, care notes, and walk information available.",
  },
  {
    question: "Can I use PawReport on my phone?",
    answer:
      "Yes. PawReport is designed for mobile browsers, desktop browsers, and the SitGuru app. The installed app's live view uses your authenticated booking, while the public demo shown here is illustrative.",
  },
  {
    question: "What if my Guru hasn't added any updates yet?",
    answer:
      "Your booking may show that care has not started or that there are no updates yet. Photos, tracked walk details, and checklist items appear only when they have been provided for the booking.",
  },
] as const;

export default function PawReportLiveMarketingPage() {
  return (
    <main className="min-w-0 overflow-x-clip bg-[#f8fcf9] text-[#132138]">
      <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#f0fff7] via-white to-[#f1faf4] px-4 pb-16 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pb-24">
        <PawPrint aria-hidden="true" className="pointer-events-none absolute -right-12 top-0 h-48 w-48 -rotate-12 text-emerald-100/80 lg:right-10" />
        <div className="relative mx-auto grid max-w-7xl min-w-0 items-center gap-10 lg:grid-cols-[minmax(0,1.06fr)_minmax(0,.94fr)] lg:gap-12">
          <div className="min-w-0">
            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[.12em] text-emerald-800 shadow-sm">
              <PawPrint aria-hidden="true" className="h-4 w-4 fill-emerald-700" />
              SitGuru Care Experience
            </div>

            <h1 className="mt-6 max-w-3xl text-[clamp(2.55rem,5.1vw,5rem)] font-black leading-[1.04] tracking-[-.055em] text-[#111b35]">
              Every visit.
              <span className="block text-[#007743]">Every update.</span>
              <span className="block">One place.</span>
            </h1>
            <p className="mt-5 max-w-2xl text-[15px] font-medium leading-7 text-slate-600 sm:text-lg sm:leading-8">
              From a first walk to the last wag, PawReport Live keeps your Guru&apos;s shared
              photos, care notes, and available walk details connected to the booking.
              Stay in the loop even when you&apos;re away.
            </p>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <a
                href="#pawreport-demo"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-800 to-green-600 px-7 py-3.5 text-sm font-black text-white shadow-[0_12px_28px_rgba(0,105,60,.2)] transition hover:from-emerald-900 hover:to-green-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:text-base"
              >
                <PlayCircle aria-hidden="true" className="h-5 w-5" />
                Explore the demo
              </a>
              <Link
                href="/search"
                className="inline-flex min-h-13 items-center justify-center gap-2 rounded-full border-2 border-emerald-800 bg-white px-7 py-3.5 text-sm font-black text-emerald-900 transition hover:bg-emerald-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 sm:text-base"
              >
                <PawPrint aria-hidden="true" className="h-5 w-5" />
                Find a Guru
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-x-5 gap-y-3 text-xs font-extrabold text-emerald-950 sm:text-sm">
              <span className="inline-flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-emerald-700" aria-hidden="true" /> Connected to bookings</span>
              <span className="inline-flex items-center gap-2"><Camera className="h-5 w-5 text-emerald-700" aria-hidden="true" /> Guru-shared photos</span>
              <span className="inline-flex items-center gap-2"><Clock3 className="h-5 w-5 text-emerald-700" aria-hidden="true" /> Visit progress</span>
            </div>
          </div>

          <div className="relative min-w-0 rounded-[32px] border border-emerald-700/20 bg-gradient-to-br from-[#003c2d] via-[#005c3c] to-[#007b4b] p-4 shadow-[0_26px_65px_rgba(0,65,42,.22)] sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div className="inline-flex items-center gap-2 text-xl font-black tracking-tight text-white sm:text-2xl">
                <PawPrint className="h-7 w-7 fill-white" aria-hidden="true" />
                PawReport <span className="text-lime-400">Live</span>
              </div>
              <span className="rounded-full border border-lime-400/60 bg-emerald-950/70 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-lime-200">
                Sample preview
              </span>
            </div>
            <div className="overflow-hidden rounded-[24px] bg-white shadow-xl">
              <div className="flex flex-wrap items-center gap-3 bg-emerald-50 p-4">
                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border-4 border-white shadow-md">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/images/pawreport/scout-on-trail.jpg" alt="Scout enjoying an outdoor walk" loading="lazy" className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-800">Sample visit</p>
                  <h2 className="text-xl font-black text-[#111b35]">Scout&apos;s Walk</h2>
                  <p className="flex items-center gap-1 text-xs font-semibold text-slate-600"><MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Quakertown, PA</p>
                </div>
                <span className="rounded-full bg-emerald-700 px-3 py-1.5 text-xs font-extrabold text-white">60% demo</span>
              </div>
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-black text-[#111b35]">Walk in progress</p>
                  <p className="text-sm font-black text-emerald-800">0.8 mi · 18 min</p>
                </div>
                <div role="progressbar" aria-label="Example walk progress" aria-valuenow={60} aria-valuemin={0} aria-valuemax={100} className="mt-3 h-2.5 overflow-hidden rounded-full bg-emerald-100">
                  <div className="h-full w-[60%] rounded-full bg-gradient-to-r from-green-600 to-lime-500" />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {[
                    ["/images/pawreport/scout-park-entrance.jpg", "Scout visiting the park"],
                    ["/images/pawreport/scout-on-trail.jpg", "Scout walking on the trail"],
                    ["/images/pawreport/scout-resting-after-walk.jpg", "Scout resting after a walk"],
                  ].map(([src, alt]) => (
                    <div key={src} className="aspect-[1.05/1] min-w-0 overflow-hidden rounded-xl bg-emerald-50">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-2">
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
                    <Droplets className="h-5 w-5 shrink-0 text-sky-500" aria-hidden="true" /> Water refreshed <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" aria-hidden="true" />
                  </div>
                  <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
                    <MessageSquareText className="h-5 w-5 shrink-0 text-violet-600" aria-hidden="true" /> Scout loved the park! <CheckCircle2 className="ml-auto h-5 w-5 text-emerald-600" aria-hidden="true" />
                  </div>
                </div>
              </div>
            </div>
            <p className="mt-3 text-center text-xs font-medium leading-5 text-emerald-50">
              Illustrative sample only. Real updates appear within your booking.
            </p>
          </div>
        </div>
        <svg aria-hidden="true" viewBox="0 0 1440 90" preserveAspectRatio="none" className="pointer-events-none absolute bottom-0 left-0 h-10 w-full sm:h-14">
          <path d="M0 45 C200 10 400 90 720 62 S1220 24 1440 42 V90 H0Z" fill="#c4ef7c" />
          <path d="M0 57 C200 20 400 92 720 76 S1220 35 1440 56 V90 H0Z" fill="#006944" />
        </svg>
      </section>

      <section aria-labelledby="pawreport-benefits-heading" className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">More than a visit summary</p>
            <h2 id="pawreport-benefits-heading" className="mt-3 text-3xl font-black tracking-tight text-[#111b35] sm:text-4xl">
              Thoughtful pet care, with you along for the journey.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              PawReport brings the details your Guru shares into a single, easy-to-follow care experience.
            </p>
          </div>
          <div className="mt-9 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {benefits.map(({ icon: Icon, title, description }) => (
              <article key={title} className="rounded-[24px] border border-emerald-100 bg-gradient-to-b from-white to-emerald-50/50 p-6 shadow-[0_12px_32px_rgba(15,23,42,.06)]">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <h3 className="mt-5 text-xl font-black text-[#111b35]">{title}</h3>
                <p className="mt-3 text-sm font-medium leading-7 text-slate-600">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="pawreport-demo" aria-labelledby="pawreport-demo-heading" className="scroll-mt-20 bg-gradient-to-b from-[#effbf3] via-[#f7fffb] to-white px-3 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-800">
              <Sparkles className="h-4 w-4" aria-hidden="true" /> Interactive demo
            </div>
            <h2 id="pawreport-demo-heading" className="mt-4 text-3xl font-black tracking-tight text-[#111b35] sm:text-4xl lg:text-5xl">
              Take PawReport for a test walk.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600 sm:text-lg">
              Switch between Pet Parent and Guru views. Explore photos, care notes, sample walk progress, and history — without an account.
            </p>
          </div>
          <div className="mx-auto mt-9 max-w-6xl">
            <PawReportLiveDashboard
              role="pet_parent"
              allowRoleSwitch
              isDemo
              petName="Scout"
              guruName="your Guru"
            />
          </div>
          <p className="mx-auto mt-5 max-w-3xl text-center text-xs font-semibold leading-6 text-slate-500">
            This is a safe, sample-only walkthrough. Switching tabs or tapping demo actions does not save care updates, notify a Guru, or start a real walk.
          </p>
        </div>
      </section>

      <section aria-labelledby="pawreport-how-heading" className="bg-white px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">How it works</p>
            <h2 id="pawreport-how-heading" className="mt-3 text-3xl font-black tracking-tight text-[#111b35] sm:text-4xl">
              From booking to beautiful memories.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Simple for Pet Parents. Easy for Gurus. Built around the care your pet actually receives.
            </p>
          </div>
          <div className="mt-9 grid gap-4 md:grid-cols-3">
            {steps.map(({ number, icon: Icon, title, body }) => (
              <article key={number} className="relative overflow-hidden rounded-[26px] border border-emerald-100 bg-[#f6fcf8] p-6 sm:p-7">
                <span aria-hidden="true" className="absolute right-5 top-2 text-7xl font-black text-emerald-100">{number}</span>
                <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-700 text-white">
                  <Icon className="h-7 w-7" aria-hidden="true" />
                </div>
                <p className="relative mt-5 text-xs font-black uppercase tracking-wider text-emerald-700">Step {number}</p>
                <h3 className="relative mt-2 text-xl font-black text-[#111b35]">{title}</h3>
                <p className="relative mt-3 text-sm font-medium leading-7 text-slate-600">{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section aria-labelledby="pawreport-questions-heading" className="bg-[#f3fbf6] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[minmax(0,.76fr)_minmax(0,1.24fr)] lg:gap-14">
          <div>
            <p className="text-xs font-black uppercase tracking-[.16em] text-emerald-700">Helpful answers</p>
            <h2 id="pawreport-questions-heading" className="mt-3 text-3xl font-black tracking-tight text-[#111b35] sm:text-4xl">
              Good questions. Clear answers.
            </h2>
            <p className="mt-4 text-base font-medium leading-7 text-slate-600">
              Every PawReport is tied to an individual booking, and what you see depends on the updates your Guru has shared.
            </p>
          </div>
          <div className="space-y-3">
            {faq.map(({ question, answer }) => (
              <details key={question} className="group rounded-2xl border border-emerald-100 bg-white px-5 py-4 shadow-sm open:shadow-md sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black text-[#111b35] marker:content-none sm:text-base">
                  {question}
                  <span aria-hidden="true" className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-lg font-black text-emerald-800 group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 border-t border-emerald-50 pt-3 text-sm font-medium leading-7 text-slate-600">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Get started with PawReport" className="bg-white px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 rounded-[30px] bg-gradient-to-br from-[#003c2d] via-[#005d3a] to-[#007b4b] p-7 text-white shadow-[0_16px_55px_rgba(0,75,48,.15)] sm:p-10 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-widest text-lime-300">Care you can follow</p>
            <h2 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">A little more connection. A lot more peace of mind.</h2>
            <p className="mt-3 text-sm font-medium leading-7 text-emerald-50 sm:text-base">
              Find a Guru, or open an existing booking to see the visit updates shared for your pet.
            </p>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Link href="/search" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-lime-300 px-6 py-3 text-sm font-black text-emerald-950 hover:bg-lime-200">
              Find a Guru <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link href="/customer/dashboard/bookings" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/50 bg-white/10 px-6 py-3 text-sm font-black text-white hover:bg-white/20">
              My bookings
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
