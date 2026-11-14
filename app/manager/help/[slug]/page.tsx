import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, Lightbulb, MessageCircle, Wrench } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { MANAGER_HELP_ARTICLES, managerHelpArticle, managerHelpUrl } from "@/lib/manager/manager-help";
import { DESK_UI } from "@/lib/portal/desk-ui";

export const dynamic="force-dynamic";
export function generateStaticParams(){return MANAGER_HELP_ARTICLES.map(article=>({slug:article.slug}));}
export async function generateMetadata({params}:{params:Promise<{slug:string}>}):Promise<Metadata> {
  const article=managerHelpArticle((await params).slug);
  return article?{title:`${article.title} | SitGuru Manager Help`,description:article.summary}:{title:"Manager Help | SitGuru"};
}
export default async function ManagerHelpArticlePage({params}:{params:Promise<{slug:string}>}) {
  const access=await requireGrowthWorkplace("manager");
  if(!access.ok)return access.ui;
  const article=managerHelpArticle((await params).slug);
  if(!article)notFound();
  const related=MANAGER_HELP_ARTICLES.filter(other=>other.slug!==article.slug&&other.category===article.category).slice(0,4);
  return (
    <main className="mx-auto w-full max-w-6xl min-w-0 space-y-5 px-3 pb-28 sm:px-5 lg:px-6 lg:pb-8">
      <DeskPageHero icon={<BookOpen size={22}/>} title={article.title} subtitle={article.summary} quote="Find the answer. Complete the task."/>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link href="/manager/help" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#2563EB] hover:underline"><ArrowLeft size={16} aria-hidden="true"/> All Manager Help</Link>
        <span className="rounded-full bg-[#EFF6FF] px-3 py-2 text-xs font-black text-[#1D4ED8]">{article.category}</span>
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          <section aria-labelledby="steps-title" className={`${DESK_UI.card} min-w-0 p-4 sm:p-6`}>
            <h2 id="steps-title" className="flex items-center gap-2 text-xl font-black text-[#0F2744]"><BookOpen size={20} aria-hidden="true" className="text-[#2563EB]"/> Step-by-step instructions</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">Follow these steps in order. Use the link to open the relevant working page.</p>
            <ol className="mt-5 space-y-4">
              {article.steps.map((step,index)=>(
                <li key={index} className="flex min-w-0 items-start gap-3">
                  <span aria-hidden="true" className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#EFF6FF] text-sm font-black text-[#2563EB]">{index+1}</span>
                  <p className="min-w-0 flex-1 pt-1 text-sm font-medium leading-7 text-[#0F2744]">{step}</p>
                </li>
              ))}
            </ol>
            <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-5">
              <Link href={article.route} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">Open the relevant SitGuru page <ArrowRight size={16} aria-hidden="true"/></Link>
              <span className="break-all text-xs font-semibold text-slate-500">{article.route}</span>
            </div>
          </section>
          <section className="rounded-2xl border border-[#DCFCE7] bg-[#F0FDF4] p-4 sm:p-5">
            <h2 className="flex items-center gap-2 text-base font-black text-[#166534]"><CheckCircle2 size={19} aria-hidden="true"/> What success looks like</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-[#14532D]">{article.result}</p>
          </section>
          <section aria-labelledby="faq-title" className={`${DESK_UI.card} p-4 sm:p-5`}>
            <h2 id="faq-title" className="flex items-center gap-2 text-lg font-black text-[#0F2744]"><CircleHelp size={20} className="text-[#2563EB]" aria-hidden="true"/> Frequently asked questions</h2>
            <div className="mt-3 space-y-2">
              {article.faqs.map((faq,index)=>(
                <details key={index} open={index===0} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
                  <summary className="min-h-10 cursor-pointer py-2 text-sm font-black leading-6 text-[#0F2744]">{faq.q}</summary>
                  <p className="mt-2 border-t border-slate-200 pt-3 text-sm font-medium leading-6 text-slate-700">{faq.a}</p>
                </details>
              ))}
            </div>
          </section>
          <section aria-labelledby="trouble-title" className={`${DESK_UI.card} p-4 sm:p-5`}>
            <h2 id="trouble-title" className="flex items-center gap-2 text-lg font-black text-[#0F2744]"><Wrench size={20} className="text-[#C2410C]" aria-hidden="true"/> Troubleshooting</h2>
            {article.troubleshooting.map((problem,index)=>(
              <div key={index} className="mt-3 rounded-xl border border-amber-100 bg-[#FFF7ED] p-3">
                <h3 className="text-sm font-black text-[#9A3412]">Problem: {problem.issue}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700"><strong>What to check:</strong> {problem.fix}</p>
              </div>
            ))}
          </section>
        </div>
        <aside className="min-w-0 space-y-4 lg:sticky lg:top-20">
          <section className={`${DESK_UI.card} p-4`}>
            <h2 className="flex items-center gap-2 text-base font-black text-[#0F2744]"><Lightbulb size={18} className="text-[#2563EB]" aria-hidden="true"/> Manager tip</h2>
            <ul className="mt-3 space-y-3">
              {article.tips.map(tip=><li key={tip} className="text-sm font-medium leading-6 text-slate-600">{tip}</li>)}
            </ul>
          </section>
          {related.length?(
            <section className={`${DESK_UI.card} p-4`}>
              <h2 className="text-base font-black text-[#0F2744]">Related help guides</h2>
              <ul className="mt-2 divide-y divide-slate-100">
                {related.map(item=>(
                  <li key={item.slug}><Link href={managerHelpUrl(item.slug)} className="inline-flex min-h-11 w-full items-center justify-between gap-2 py-2 text-sm font-bold text-[#2563EB] hover:underline">{item.title}<ArrowRight size={15} className="shrink-0" aria-hidden="true"/></Link></li>
                ))}
              </ul>
            </section>
          ):null}
          <section className={`${DESK_UI.card} p-4`}>
            <h2 className="text-base font-black text-[#0F2744]">Need personalized help?</h2>
            <p className="mt-2 text-xs font-medium leading-5 text-slate-600">Ask about your specific situation. Do not send passwords, banking records, or private student identifiers.</p>
            <Link href="/manager/messages" className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white"><MessageCircle size={16} aria-hidden="true"/> Message the team</Link>
          </section>
        </aside>
      </div>
    </main>
  );
}
