import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { loadInternSectionWorkspace } from "@/lib/internship/intern-section-data";
import { InternCheckInsPageView } from "@/components/internship/InternSectionPages";

export const dynamic = "force-dynamic";

export default async function InternCheckInsPage({searchParams}:{
  searchParams?:Promise<Record<string,string|string[]|undefined>>;
}) {
  const access = await requireGrowthWorkplace("intern");
  if (!access.ok) return access.ui;
  const data = await loadInternSectionWorkspace();
  if (!data) {
    return (
      <div className="mx-auto max-w-lg rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-black text-slate-950">Check-Ins unavailable</h1>
      </div>
    );
  }
  const params=searchParams?await searchParams:{};
  const first=(v:string|string[]|undefined)=>Array.isArray(v)?v[0]||"":v||"";
  return (
    <InternCheckInsPageView workspace={data.workspace} hourSummary={data.hourSummary} notice={first(params.ok)} error={first(params.error)} />
  );
}
