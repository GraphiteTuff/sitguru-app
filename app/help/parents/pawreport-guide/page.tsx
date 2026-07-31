import type { Metadata } from "next";
import Link from "next/link";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";

export const metadata: Metadata = {
  title: "PawReport Live Guide for Pet Parents",
  description:
    "Learn how to watch your dog’s live route, read potty and break badges, and find your permanent PawReport history.",
};

export default function ParentPawReportGuidePage() {
  return (
    <HelpArticleChrome
      eyebrow="Pet Parent Support"
      title="PawReport Live — ultra-simple guide"
      summary="Open your live walk link, get instant push alerts for potty breaks, and receive a beautiful responsive email report the moment a walk ends."
      backHref="/help"
      jumps={[
        { href: "#live-tracking", label: "Live Tracking" },
        { href: "#event-badges", label: "Event Badges" },
        { href: "#end-summary", label: "End Summary" },
      ]}
    >
      <section id="live-tracking" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Live Tracking
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          When your Guru starts a walk, SitGuru streams their phone GPS to your
          mobile view at{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-bold">
            /parent/walk/[bookingId]
          </code>
          .
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Polyline route:</span>{" "}
            Watch the green line grow as your Guru walks — it redraws in
            real time from each GPS ping.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Pulsing pin:</span>{" "}
            The animated dog pin marks the Guru’s latest phone coordinates so
            you always know where the walk is right now.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Hero metrics:</span>{" "}
            Distance (miles), elapsed time, and logged event counts update at
            the top of your screen without refreshing.
          </li>
        </ul>
      </section>

      <section id="event-badges" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Event Badges
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          When your Guru taps an action on their phone, a snackbar slides down
          and a map pin drops on the route.
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            <span className="font-black">💩 Poop</span> — Guru logged a poop
            potty break at that exact GPS spot.
          </li>
          <li className="rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3">
            <span className="font-black">💦 Pee</span> — Guru logged a pee potty
            break on the route.
          </li>
          <li className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="font-black">🌳 Water Break</span> — Walk is paused;
            GPS collection stops so the map doesn’t “drift” while they rest.
          </li>
        </ul>
      </section>

      <section id="end-summary" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          End Summary
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          When the walk ends, SitGuru locks the route and saves your permanent
          PawReport.
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">On your phone:</span>{" "}
            The live view switches to a “home safe” success card with final
            miles, minutes, and event counts.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Receipt dashboard:</span>{" "}
            Reopen the booking’s visit updates anytime under your Pet Parent
            dashboard for the full timeline and photos.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Automated email:</span>{" "}
            The moment the walk ends, SitGuru sends a beautiful responsive
            PawReport email with metrics, timeline, and a button to reopen the
            interactive route map — no waiting for a manual text or “email
            update later.”
          </li>
          <li className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <span className="font-black text-emerald-800">Push alerts:</span>{" "}
            Potty breaks fire instant push notifications while the Guru tracks
            live on their high-accuracy phone dashboard.
          </li>
        </ul>

        <p className="mt-5 text-sm font-semibold text-slate-600">
          Related:{" "}
          <Link
            href="/help/gurus/tracking-mastery"
            className="font-black text-emerald-800 underline"
          >
            Guru Tracking Mastery
          </Link>{" "}
          ·{" "}
          <Link
            href="/help/booking/live-care-updates"
            className="font-black text-emerald-800 underline"
          >
            Live care updates
          </Link>
        </p>
      </section>
    </HelpArticleChrome>
  );
}
