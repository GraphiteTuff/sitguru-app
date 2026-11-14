"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Check, ChevronDown, CircleHelp, Search, Sparkles, X, MessageCircle, Layers3 } from "lucide-react";
import { MANAGER_HELP_ARTICLES, MANAGER_HELP_CATEGORIES, managerHelpUrl } from "@/lib/manager/manager-help";
import { MANAGER_HELP_POPULAR_QUESTIONS, searchManagerHelp } from "@/lib/manager/manager-help-search";
import { DESK_UI } from "@/lib/portal/desk-ui";

export default function ManagerHelpExplorer({initialQuery=""}:{initialQuery?:string}) {
  const [query,setQuery]=useState(initialQuery);
  const [category,setCategory]=useState("all");
  const [showAll,setShowAll]=useState(false);
  const searchRef=useRef<HTMLInputElement>(null);
  const activeQuery=query.trim();
  const results=useMemo(()=>searchManagerHelp(activeQuery,category,showAll?MANAGER_HELP_ARTICLES.length:12),[activeQuery,category,showAll]);
  const top=activeQuery?results[0]:null;
  const byCategory=useMemo(()=>new Map(MANAGER_HELP_CATEGORIES.map(c=>[c.title,MANAGER_HELP_ARTICLES.filter(a=>a.category===c.title).length])),[]);
  const popular=MANAGER_HELP_POPULAR_QUESTIONS.slice(0,8);
  function ask(question:string){setQuery(question);setCategory("all");setShowAll(false);searchRef.current?.focus();}
  return (
    <div className="min-w-0 space-y-5">
      <section className={`${DESK_UI.card} relative min-w-0 overflow-hidden p-4 sm:p-6`} aria-labelledby="help-search-title">
        <div className="relative z-10 min-w-0">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] text-[#2563EB]">
            <Sparkles size={16} aria-hidden="true"/> Search the official SitGuru Manager Guide
          </p>
          <h2 id="help-search-title" className="mt-2 text-xl font-black tracking-tight text-[#0F2744] sm:text-2xl">What do you need help with?</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
            Ask a question in your own words. Search checks all step-by-step instructions, FAQs and troubleshooting—not just page titles. Answers come from reviewed SitGuru guidance, not invented actions.
          </p>
          <label className="relative mt-4 block" htmlFor="manager-help-search">
            <Search size={21} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#2563EB]"/>
            <input
              id="manager-help-search" ref={searchRef} type="search" autoComplete="off" spellCheck
              placeholder="Example: How do I approve Lola's weekly check-in?"
              value={query}
              onChange={e=>{setQuery(e.target.value);setShowAll(false);}}
              className="min-h-14 w-full min-w-0 rounded-2xl border-2 border-[#BFDBFE] bg-[#F8FAFC] py-3 pl-12 pr-12 text-base font-semibold text-[#0F2744] shadow-sm outline-none placeholder:text-slate-400 focus:border-[#2563EB] focus:ring-4 focus:ring-[#DBEAFE]"
              aria-describedby="help-search-count"
            />
            {query?<button type="button" aria-label="Clear Help search" onClick={()=>{setQuery("");setShowAll(false);searchRef.current?.focus();}} className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-xl text-slate-500 hover:bg-slate-200"><X size={18}/></button>:null}
          </label>
          <p id="help-search-count" aria-live="polite" className="mt-2 text-xs font-semibold text-slate-500">
            {activeQuery?results.length===0?"No matching help articles":`Showing ${results.length} matching ${results.length===1?"guide":"guides"}`:`${MANAGER_HELP_ARTICLES.length} detailed guides across ${MANAGER_HELP_CATEGORIES.length} topics`}
          </p>
        </div>
      </section>
      {!activeQuery ? (
        <section aria-labelledby="popular-title" className="space-y-3">
          <div className="flex items-center gap-2">
            <CircleHelp size={18} className="text-[#2563EB]" aria-hidden="true"/>
            <h2 id="popular-title" className="text-lg font-black text-[#0F2744]">Questions managers ask most</h2>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {popular.map(question=>(
              <button type="button" key={question} onClick={()=>ask(question)}
                className="group flex min-h-12 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 text-left text-sm font-bold text-[#0F2744] shadow-sm hover:border-[#BFDBFE] hover:bg-[#EFF6FF] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2563EB]">
                <MessageCircle size={16} aria-hidden="true" className="shrink-0 text-[#2563EB]"/>
                <span className="min-w-0 flex-1">{question}</span>
                <ArrowRight size={15} aria-hidden="true" className="shrink-0 text-slate-400 group-hover:text-[#2563EB]"/>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <section aria-labelledby="topics-title">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 id="topics-title" className="text-lg font-black text-[#0F2744]">{activeQuery?"Search results":"Browse help by topic"}</h2>
          {activeQuery?<span className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-black text-[#1D4ED8]">Instant results</span>:null}
        </div>
        <div aria-label="Filter Help Center topics" className="flex max-w-full flex-wrap gap-2">
          <button type="button" onClick={()=>{setCategory("all");setShowAll(false);}}
            aria-pressed={category==="all"}
            className={`min-h-10 rounded-xl border px-3 text-xs font-black ${category==="all"?"border-[#2563EB] bg-[#2563EB] !text-white":"border-slate-200 bg-white text-[#0F2744] hover:bg-[#EFF6FF]"}`}>All topics ({MANAGER_HELP_ARTICLES.length})</button>
          {MANAGER_HELP_CATEGORIES.map(c=>(
            <button key={c.id} type="button" onClick={()=>{setCategory(c.title);setShowAll(false);}}
              aria-pressed={category===c.title}
              className={`min-h-10 rounded-xl border px-3 text-xs font-black ${category===c.title?"border-[#2563EB] bg-[#2563EB] !text-white":"border-slate-200 bg-white text-[#0F2744] hover:bg-[#EFF6FF]"}`}>
              {c.title} ({byCategory.get(c.title)||0})
            </button>
          ))}
        </div>
      </section>

      {top && top.score>0 ? (
        <section aria-label="Best matching help answer" className="rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4 sm:p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#1D4ED8]">Best matching how-to</p>
          <h3 className="mt-2 text-lg font-black text-[#0F2744]">{top.article.title}</h3>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{top.excerpt}</p>
          <ol className="mt-3 space-y-2">
            {top.article.steps.slice(0,3).map((step,i)=>(
              <li key={i} className="flex items-start gap-2 text-sm font-medium leading-6 text-slate-700">
                <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white text-[11px] font-black text-[#2563EB]">{i+1}</span>{step}
              </li>
            ))}
          </ol>
          <Link href={managerHelpUrl(top.article.slug)} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">
            Read full step-by-step guide <ArrowRight size={17} aria-hidden="true"/>
          </Link>
        </section>
      ) : null}
      {results.length?(
        <section className="grid gap-3 md:grid-cols-2" aria-label="Manager Help guides">
          {results.map(({article})=>(
            <article key={article.slug} className={`${DESK_UI.card} flex min-w-0 flex-col p-4 sm:p-5`}>
              <p className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.1em] text-[#0D5C3A]"><BookOpen size={15} aria-hidden="true"/>{article.category}</p>
              <h3 className="mt-2 text-base font-black leading-6 text-[#0F2744]">{article.title}</h3>
              <p className="mt-2 flex-1 text-sm font-medium leading-6 text-slate-600">{article.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-slate-500">
                <span>{article.steps.length} clear steps</span><span>·</span><span>FAQ & troubleshooting</span>
              </div>
              <Link href={managerHelpUrl(article.slug)} className="mt-3 inline-flex min-h-11 items-center gap-1 self-start text-sm font-black text-[#2563EB] hover:underline">
                Open instructions <ArrowRight size={16} aria-hidden="true"/>
              </Link>
            </article>
          ))}
        </section>
      ) : (
        <section className={`${DESK_UI.card} p-5 sm:p-6`} role="status">
          <h3 className="text-lg font-black text-[#0F2744]">We couldn't find an exact guide.</h3>
          <p className="mt-2 text-sm font-medium text-slate-600">Try the name of the screen or a short phrase such as “approve check-in,” “Lola access,” “Planner sync,” “brand logo,” or “pay hours.” You can also ask the team directly.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={()=>{setQuery("");setCategory("all");setShowAll(false);searchRef.current?.focus();}} className="min-h-11 rounded-xl bg-[#2563EB] px-4 text-xs font-black !text-white">Clear search and browse</button>
            <Link href="/manager/messages" className="inline-flex min-h-11 items-center rounded-xl border border-slate-200 px-4 text-xs font-black text-[#0F2744]">Ask the team</Link>
          </div>
        </section>
      )}
      {!activeQuery && category==="all" && !showAll && MANAGER_HELP_ARTICLES.length>results.length ?(
        <div className="flex justify-center">
          <button type="button" onClick={()=>setShowAll(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 text-sm font-black text-[#0F2744] hover:bg-[#EFF6FF]">
            <Layers3 size={16} aria-hidden="true"/> Show all {MANAGER_HELP_ARTICLES.length} guides <ChevronDown size={16} aria-hidden="true"/>
          </button>
        </div>
      ):null}
      <section className={`${DESK_UI.card} flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5`}>
        <div>
          <h2 className="text-base font-black text-[#0F2744]">Still need help?</h2>
          <p className="mt-1 max-w-2xl text-sm font-medium text-slate-600">Use team messaging to report an issue or ask about a situation the guide doesn't cover. Formal approvals must still happen in SitGuru, not in chat.</p>
        </div>
        <Link href="/manager/messages" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
          <MessageCircle size={16} aria-hidden="true"/> Ask the team
        </Link>
      </section>
      <p className="px-1 text-xs font-medium leading-5 text-slate-500">
        Manager Help content is maintained by SitGuru. External social, Microsoft 365, and provider permissions must be verified separately. Search runs immediately within this page; it does not transmit your question to a third-party AI.
      </p>
    </div>
  );
}
