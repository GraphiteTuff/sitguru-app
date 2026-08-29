import { redirect } from "next/navigation";
import EventManagerDashboardClient from "@/components/partners/events/EventManagerDashboardClient";
import { createPartnerEventDraft } from "@/app/partners/dashboard/community/events/actions";
import {
  fetchAllPartnerEvents,
  getPartnerCommandCenterStats,
} from "@/lib/community/event-command-center";
import { requirePartnerAccount } from "@/lib/community/partner-access";
import type { PartnerEventTab } from "@/lib/community/types";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{ tab?: string; range?: string; create?: string }>;
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
  if (value && tabs.has(value)) return value as PartnerEventTab;
  return "upcoming";
}

export default async function PartnerCommunityEventsPage({
  searchParams,
}: PageProps) {
  const access = await requirePartnerAccount();

  if (!access.ok || !access.partner) {
    redirect("/partners/apply?intent=community_events");
  }

  const params = await searchParams;

  if (params?.create === "1") {
    const result = await createPartnerEventDraft({
      title: "New Community Event",
    });
    if (result.ok && result.event) {
      redirect(`/partners/dashboard/community/events/${result.event.id}/edit`);
    }
  }

  const tab = parseTab(params?.tab);
  const events = await fetchAllPartnerEvents(access.partner.id);
  const stats = await getPartnerCommandCenterStats(
    events,
    "month",
    access.partner,
  );

  return (
    <EventManagerDashboardClient
      partner={access.partner}
      events={events}
      initialStats={stats}
      initialTab={tab}
    />
  );
}
