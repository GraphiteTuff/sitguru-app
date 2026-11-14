import type { Metadata } from "next";
import { CircleHelp } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import ManagerHelpExplorer from "@/components/manager/ManagerHelpExplorer";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";

export const metadata:Metadata={
  title:"Manager Help Center | SitGuru",
  description:"Step-by-step guides, searchable FAQs and troubleshooting for SitGuru Growth Managers.",
};
export const dynamic="force-dynamic";

export default async function ManagerHelpPage({searchParams}:{
  searchParams?:Promise<Record<string,string|string[]|undefined>>;
}) {
  const access=await requireGrowthWorkplace("manager");
  if(!access.ok)return access.ui;
  const params=searchParams?await searchParams:{};
  const search=Array.isArray(params.q)?params.q[0]:params.q||"";
  return (
    <main className="mx-auto w-full max-w-7xl min-w-0 space-y-5 px-3 pb-28 sm:px-5 lg:px-6 lg:pb-8">
      <DeskPageHero
        icon={<CircleHelp size={22}/>}
        title="Manager Help Center"
        subtitle="Clear answers for managing interns, campaigns, approvals and SitGuru growth."
        quote="Learn. Support. Grow Together."
      />
      <ManagerHelpExplorer initialQuery={search.slice(0,200)}/>
    </main>
  );
}
