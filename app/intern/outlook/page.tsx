import InternshipOutlook from "@/components/microsoft/InternshipOutlook";

export const dynamic = "force-dynamic";
export const metadata = { title: "Microsoft Outlook | SitGuru", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default function OutlookPage({ searchParams }: {
  searchParams: Promise<{ view?: string; month?: string; result?: string }>;
}) {
  return <InternshipOutlook portal="intern" searchParams={searchParams} />;
}
