import EventMatchBoard from "@/components/event-match/EventMatchBoard";
import {requireGrowthWorkplace} from "@/lib/admin/growth/workplace";
export const dynamic="force-dynamic";
export default async function ManagerEventMatchPage(){
  const access=await requireGrowthWorkplace("manager");
  if(!access.ok)return access.ui;
  return <EventMatchBoard role="manager"/>;
}
