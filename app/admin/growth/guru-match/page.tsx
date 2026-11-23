import GuruMatchBoard from "@/components/guru-match/GuruMatchBoard";
import {requireGrowthWorkplace} from "@/lib/admin/growth/workplace";
export const dynamic="force-dynamic";
export default async function AdminGuruMatchPage(){
  const access=await requireGrowthWorkplace("admin");
  if(!access.ok)return access.ui;
  if(!access.actor.isSuperUser)return <div className="mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-6">
    <h1 className="text-xl font-black">Admin Guru Outreach</h1>
    <p className="mt-2">Full-company analytics are reserved for SitGuru super administrators.</p>
    <a href="/manager/community-studio/guru-match" className="mt-3 inline-block font-bold text-blue-700">Open team outreach →</a>
  </div>;
  return <GuruMatchBoard role="admin"/>;
}
