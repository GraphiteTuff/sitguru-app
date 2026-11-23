import EventMatchBoard from "@/components/event-match/EventMatchBoard";
import {requireGrowthWorkplace} from "@/lib/admin/growth/workplace";
export const dynamic="force-dynamic";
export default async function AdminEventMatchPage(){
  const access=await requireGrowthWorkplace("admin");
  if(!access.ok)return access.ui;
  if(!access.actor.isSuperUser)return <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white p-6">
    <h1 className="text-xl font-black">Event outreach analytics</h1>
    <p className="mt-2">Full-company event reports are reserved for SitGuru super administrators.</p>
    <a href="/manager/community-studio/event-match" className="mt-3 inline-block font-bold text-blue-700">Open team event outreach</a>
  </div>;
  return <EventMatchBoard role="admin"/>;
}
