import Link from "next/link";
import { redirect } from "next/navigation";
import PartnerEventPromoteWorkspace from "@/components/partners/events/PartnerEventPromoteWorkspace";
import { requireEventHostPartnerAccount } from "@/lib/community/partner-access";
import { createClient } from "@/lib/supabase/server";
import type { CommunityEventRow } from "@/lib/community/types";
import { buildEventHostCreateSignupHref } from "@/lib/community/pet-parent-signup";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartnerEventPromotePage({ params }: PageProps) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.partner) {
    redirect(buildEventHostCreateSignupHref({ source: "event_promote" }));
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from("community_events")
    .select("*")
    .eq("partner_id", access.partner.id)
    .order("start_at", { ascending: false });

  const eventList = (events || []) as CommunityEventRow[];
  const selectedEvent = eventList.find((event) => event.id === id);

  if (!selectedEvent) {
    redirect("/partners/dashboard/community/events");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <div className="mx-auto max-w-[1400px] px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/partners/dashboard"
              className="text-sm font-black text-emerald-800 hover:underline"
            >
              Partner Dashboard
            </Link>
            <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-500">
              Community &gt; Events &gt; Promote
            </p>
          </div>
          <Link
            href="/partners/dashboard/community/events"
            className="text-sm font-black text-emerald-800 hover:underline"
          >
            All events
          </Link>
        </div>

        <PartnerEventPromoteWorkspace
          events={eventList}
          selectedEvent={selectedEvent}
          partner={access.partner}
        />
      </div>
    </main>
  );
}
