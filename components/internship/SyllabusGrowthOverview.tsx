import Link from "next/link";
import { GROWTH_PILLARS, GROWTH_AUDIENCES, GROWTH_ALLOCATION_RULE, SYLLABUS_PHASES } from "@/lib/internship/university-syllabus";
export default function SyllabusGrowthOverview({ mode }: { mode: "intern" | "manager" | "admin" }) {
 const links = mode === "admin" ? [{href:"/admin/internship",label:"Internship oversight"}] : [{href:"/"+mode+"/assignments",label:mode==="intern"?"My assignments & submissions":"Review assignments"},{href:"/"+mode+"/milestones",label:"Milestones"},{href:"/"+mode+"/check-ins",label:"Weekly check-ins"}];
 return <section className="space-y-4 rounded-3xl border border-emerald-200 bg-white p-4 sm:p-6">
 <h2 className="text-xl font-black text-slate-950">Market Growth Project · syllabus alignment</h2>
 <div className="grid gap-3 sm:grid-cols-2">{GROWTH_PILLARS.map(p=><div key={p.id} className="rounded-xl bg-emerald-50 p-4"><p className="text-2xl font-black text-emerald-900">{p.weight}%</p><p className="font-bold text-slate-950">{p.label}</p></div>)}</div>
 <p className="text-sm text-slate-700">{GROWTH_ALLOCATION_RULE}</p><p className="text-sm text-slate-700">Both pillars serve {GROWTH_AUDIENCES.join(", ")}.</p>
 <details className="rounded-xl border border-slate-200 p-3"><summary className="cursor-pointer font-bold text-slate-950">Existing semester milestones</summary><ol className="mt-3 space-y-3">{SYLLABUS_PHASES.map(p=><li key={p.label}><p className="font-bold text-slate-950">{p.label} · {p.title}</p><p className="text-sm text-slate-700">{p.description}</p></li>)}</ol></details>
 <p className="text-sm text-slate-700">Use the existing assignment record to submit evidence, review feedback and revise work. Approved contributions feed the existing Business Growth Report. Employer feedback is distinct from university grading.</p>
 <nav className="grid gap-2 sm:grid-cols-3">{links.map(l=><Link key={l.href} href={l.href} className="flex min-h-12 items-center justify-center rounded-xl bg-[#10583F] px-3 py-2 text-center text-sm font-bold !text-white">{l.label}</Link>)}</nav></section>;
}
