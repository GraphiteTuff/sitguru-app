import type { Metadata } from "next";
import PartnerForm from "@/components/reads/PartnerForm";
import TrackPageView from "@/components/reads/TrackPageView";

export const metadata: Metadata = {
  title: "Partner with SitGuru | Reads & Listen",
  description:
    "Authors, publishers, podcasters, magazines, and pet experts — bring your work to the SitGuru community.",
  alternates: { canonical: "https://www.sitguru.com/reads/partner" },
};

export default function ReadsPartnerPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <TrackPageView eventName="partner_cta_click" metadata={{ surface: "form" }} />
      <h1 className="text-4xl font-black tracking-tight text-[#0F2744]">
        Become a Featured Partner
      </h1>
      <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-slate-600">
        Are you an author, publisher, podcaster, magazine, veterinarian, trainer,
        behaviorist, or pet expert? Share your work for SitGuru community
        consideration. Contact details stay private and are never shown publicly.
      </p>
      <div className="mt-8">
        <PartnerForm />
      </div>
    </div>
  );
}
