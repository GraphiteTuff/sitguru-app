import Link from "next/link";
import { redirect } from "next/navigation";
import PartnerEventsListClient from "@/components/partners/events/PartnerEventsListClient";
import { fetchPartnerEvents } from "@/lib/community/queries";
import { requirePartnerAccount } from "@/lib/community/partner-access";
import type { PartnerEventTab } from "@/lib/community/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ tab?: string }>;
};

function parseTab(value?: string): PartnerEventTab {
  const tabs = new Set([
    "upcoming",
    "published",
    "drafts",
    "pending",
    "past",
    "cancelled",
  ]);

  if (value && tabs.has(value)) {
    return value as PartnerEventTab;
  }

  return "upcoming";
}

export default async function PartnerCommunityEventsPage({ searchParams }: PageProps) {
  const access = await requirePartnerAccount();

  if (!access.ok || !access.partner) {
    redirect("/partners/apply");
  }

  const params = await searchParams;
  const tab = parseTab(params?.tab);
  const events = await fetchPartnerEvents(access.partner.id, tab);

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/partners/dashboard"
            className="text-sm font-black text-emerald-800 hover:underline"
          >
            ← Partner Dashboard
          </Link>
        </div>
        <PartnerEventsListClient events={events} initialTab={tab} />
      </div>
    </main>
  );
}
