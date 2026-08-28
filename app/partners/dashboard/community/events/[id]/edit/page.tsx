import { redirect } from "next/navigation";
import PartnerEventEditor from "@/components/partners/events/PartnerEventEditor";
import PartnerEventMessagePanel from "@/components/partners/events/PartnerEventMessagePanel";
import { createClient } from "@/lib/supabase/server";
import { requirePartnerAccount } from "@/lib/community/partner-access";
import type { CommunityEventRow } from "@/lib/community/types";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PartnerEventEditPage({ params }: PageProps) {
  const access = await requirePartnerAccount();

  if (!access.ok || !access.partner) {
    redirect("/partners/apply");
  }

  const { id } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("community_events")
    .select("*")
    .eq("id", id)
    .eq("partner_id", access.partner.id)
    .maybeSingle();

  if (!event) {
    redirect("/partners/dashboard/community/events");
  }

  return (
    <main className="min-h-screen bg-[#f7f8f4]">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
        <PartnerEventMessagePanel eventId={event.id} eventTitle={event.title} />
        <PartnerEventEditor event={event as CommunityEventRow} partner={access.partner} />
      </div>
    </main>
  );
}
