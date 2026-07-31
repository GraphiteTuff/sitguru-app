import type { Metadata } from "next";
import Link from "next/link";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";

export const metadata: Metadata = {
  title: "Guru Tracking Mastery",
  description:
    "Mandatory smartphone training for SitGuru walk publishing — screen wake, potty taps, and 12-second GPS battery savings.",
};

export default function GuruTrackingMasteryPage() {
  return (
    <HelpArticleChrome
      eyebrow="Guru Success & Training Hub"
      title="Tracking Mastery — smartphone walk checklist"
      summary="This is the mandatory training module for publishing PawReport Live walks from your cell phone. Complete every item before your next paid walk."
      backHref="/help"
      jumps={[
        { href: "#screens-open", label: "Keep Screens Open" },
        { href: "#action-grid", label: "High-Tap Action Grid" },
        { href: "#battery", label: "Battery Conservation" },
      ]}
    >
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-950">
        Training checklist — open{" "}
        <code className="rounded bg-white px-1.5 py-0.5 text-xs">
          /guru/walk/[bookingId]
        </code>{" "}
        on the booking assigned to you, then practice each section below.
      </div>

      <section id="screens-open" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Keeping Screens Open
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Mobile browsers pause JavaScript when the tab is backgrounded or the
          screen locks. That freezes GPS <code>watchPosition</code> loops — Pet
          Parents stop seeing live movement.
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            Keep the SitGuru walk tab in the <span className="font-black">foreground</span> for the whole visit.
          </li>
          <li className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            Raise your screen timeout (or plug in) so auto-lock doesn’t suspend tracking mid-route.
          </li>
          <li className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
            If you see “Disconnected / Reconnecting,” bring the tab forward — GPS will re-lock automatically.
          </li>
        </ul>
      </section>

      <section id="action-grid" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          High-Tap Action Grid
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          The Guru control pad is built for thumb taps while you hold a leash —
          oversized buttons, high contrast, single-click potty logging.
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Start Walk Session</span>{" "}
            — begins high-accuracy GPS and notifies the Pet Parent.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">💩 Poop / 💦 Pee</span>{" "}
            — one tap reads your current GPS, writes the event, and fires
            notifications. No forms. No extra screens.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">Water / Rest Break</span>{" "}
            — suspends coordinate collection so park sitting doesn’t draw a
            spaghetti line on the map.
          </li>
          <li className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
            <span className="font-black text-emerald-800">End &amp; Send PawReport</span>{" "}
            — confirm once to lock the route. SitGuru automatically delivers
            instant potty push alerts during the walk and a beautiful responsive
            email report the moment you end — you do not manually text or email
            the Pet Parent when the walk is done.
          </li>
        </ul>
      </section>

      <section id="battery" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Battery Conservation
        </h2>
        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
          Continuous GPS can drain phones fast. SitGuru throttles the publish
          pipeline so you stay live without cooking the battery.
        </p>
        <ul className="mt-4 space-y-3 text-sm font-semibold leading-6 text-slate-700">
          <li className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            Hardware still uses high-accuracy <code className="text-xs">watchPosition</code>, but coordinate batches post about every{" "}
            <span className="font-black">12 seconds</span> (safe 10–15s window).
          </li>
          <li className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            Breaks pause pings entirely — zero GPS upload traffic while resting.
          </li>
          <li className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            Potty taps still fire instantly (they don’t wait for the next batch
            window).
          </li>
        </ul>

        <p className="mt-5 text-sm font-semibold text-slate-600">
          Related:{" "}
          <Link
            href="/help/parents/pawreport-guide"
            className="font-black text-emerald-800 underline"
          >
            Pet Parent PawReport Guide
          </Link>
        </p>
      </section>
    </HelpArticleChrome>
  );
}
