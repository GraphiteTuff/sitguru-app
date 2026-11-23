import GuruMatchBoard from "@/components/guru-match/GuruMatchBoard";
import {requireGrowthWorkplace} from "@/lib/admin/growth/workplace";
export const dynamic="force-dynamic";
export default async function InternGuruMatchPage(){
  const access=await requireGrowthWorkplace("intern");
  if(!access.ok)return access.ui;
  return <GuruMatchBoard role="intern"/>;
}
