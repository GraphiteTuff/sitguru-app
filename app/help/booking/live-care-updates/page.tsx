import type { Metadata } from "next";
import Link from "next/link";
import HelpArticleChrome from "@/components/help/HelpArticleChrome";
import { HelpFaqList } from "@/components/help/HelpFaqList";
import { AUTOMATED_WALK_REALITY, liveCareFaqs } from "@/lib/help/content";

export const metadata: Metadata = {
  title: "Live Care Updates During Visits",
  description:
    "Automated PawReport Live tracking, potty push alerts, and end-of-walk email reports.",
};

export default function LiveCareUpdatesPage() {
  return (
    <HelpArticleChrome
      eyebrow="Booking & Cancellations"
      title="Live care updates during visits"
      summary={AUTOMATED_WALK_REALITY}
      backHref="/help/booking"
      backLabel="Back to Booking & Cancellations"
      jumps={[
        { href: "#automated", label: "Automated reality" },
        { href: "#faq", label: "FAQ" },
      ]}
    >
      <section id="automated" className="scroll-mt-28">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm font-semibold leading-6 text-emerald-950">
          <p className="font-black">No more waiting on a manual text or “email later.”</p>
          <p className="mt-2">{AUTOMATED_WALK_REALITY}</p>
          <p className="mt-3">
            Deep dives:{" "}
            <Link
              href="/help/parents/pawreport-guide"
              className="font-black underline"
            >
              Pet Parent guide
            </Link>{" "}
            ·{" "}
            <Link
              href="/help/gurus/tracking-mastery"
              className="font-black underline"
            >
              Guru Tracking Mastery
            </Link>
          </p>
        </div>
      </section>

      <section id="faq" className="scroll-mt-28">
        <h2 className="text-xl font-black tracking-[-0.03em] text-slate-950">
          Live care FAQ
        </h2>
        <div className="mt-4">
          <HelpFaqList items={liveCareFaqs} />
        </div>
      </section>
    </HelpArticleChrome>
  );
}
