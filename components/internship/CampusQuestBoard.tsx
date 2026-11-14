"use client";

import Link from "next/link";
import { ArrowRight, Award, CheckCircle2, CircleHelp, Compass, LockKeyhole, Sparkles } from "lucide-react";
import type { CampusQuest, CampusQuests } from "@/lib/internship/campus-quests";

const statusStyle={
  earned:"border-emerald-200 bg-[#F0FDF4]",
  available:"border-slate-200 bg-white",
  unavailable:"border-amber-200 bg-[#FFF7ED]",
};
export default function CampusQuestBoard({
  progress,campusName,mode,onSelect,
}:{
  progress:CampusQuests; campusName:string;mode:"manager"|"intern";
  onSelect?:(tab:CampusQuest["tab"])=>void;
}){
  const upcoming=progress.quests.find(q=>q.status==="available");
  const focus=progress.quests.find(q=>q.status==="unavailable");
  return (
    <section aria-labelledby="campus-quests-title" className="min-w-0 overflow-hidden rounded-[1.5rem] border border-[#BFDBFE] bg-[#EFF6FF] p-4 shadow-sm sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 max-w-3xl">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.11em] text-[#1D4ED8]"><Sparkles size={16} aria-hidden="true"/> Campus Quest Board</p>
          <h2 id="campus-quests-title" className="mt-2 text-xl font-black tracking-tight text-[#0F2744] sm:text-2xl">Make an impact at {campusName}</h2>
          <p className="mt-2 text-sm font-medium leading-6 text-[#334155]">
            Earn playful badges for real work documented in SitGuru: researching, planning responsibly, proposing, launching approved work and learning from results. There are no invented scores or automatic academic credits.
          </p>
        </div>
        <div className="rounded-2xl border border-white/90 bg-white px-5 py-3 text-center shadow-sm">
          <p className="inline-flex items-center justify-center gap-1 text-[11px] font-black uppercase tracking-wide text-[#166534]"><Award size={16} aria-hidden="true"/> Badges</p>
          <p className="mt-1 text-3xl font-black tabular-nums text-[#0F2744]">{progress.earned}<span className="text-lg text-slate-400">/{progress.total}</span></p>
        </div>
      </div>
      <div className="mt-5 h-2.5 w-full overflow-hidden rounded-full bg-[#DBEAFE]" role="progressbar" aria-label="Campus Quest badges earned" aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.earned}>
        <div className="h-full rounded-full bg-[#0D5C3A] transition-[width]" style={{width:progress.percent+"%"}}/>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {progress.quests.map(quest=>(
          <article key={quest.key} className={"min-w-0 rounded-2xl border p-3 sm:p-4 "+statusStyle[quest.status]}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-2xl" aria-hidden="true">{quest.badge}</span>
              <span className={"inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide "+(quest.status==="earned"?"text-[#166534]":quest.status==="unavailable"?"text-amber-900":"text-slate-500")}>
                {quest.status==="earned"?<CheckCircle2 size={13} aria-hidden="true"/>:quest.status==="unavailable"?<CircleHelp size={13} aria-hidden="true"/>:<Compass size={13} aria-hidden="true"/>}
                {quest.status==="earned"?"Earned":quest.status==="unavailable"?"Data unavailable":"To explore"}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-black leading-5 text-[#0F2744]">{quest.title}</h3>
            <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{quest.description}</p>
            <p className={"mt-3 text-[11px] font-bold "+(quest.status==="earned"?"text-[#166534]":"text-[#64748B]")}>
              {quest.status==="earned"?quest.evidence:quest.status==="unavailable"?"Source currently unavailable; no badge awarded":"Next: "+quest.nextAction}
            </p>
            {quest.status!=="unavailable"?(
              mode==="manager" && onSelect?
                <button type="button" onClick={()=>onSelect(quest.tab)} className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs font-black text-[#2563EB] hover:underline">
                  {quest.status==="earned"?"View work area":"Open work area"} <ArrowRight size={14} aria-hidden="true"/>
                </button> :
                <Link href={quest.anchor} className="mt-3 inline-flex min-h-10 items-center gap-1 text-xs font-black text-[#2563EB] hover:underline">
                  {quest.status==="earned"?"View work":"Explore this quest"} <ArrowRight size={14} aria-hidden="true"/>
                </Link>
            ):null}
          </article>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-[#334155]">
        <LockKeyhole size={15} className="shrink-0 text-[#0D5C3A]" aria-hidden="true"/>
        {progress.earned===progress.total?"All optional quests completed! Keep coaching quality, consent and measured outcomes.":
          upcoming?"Suggested next quest: "+upcoming.title+" — "+upcoming.nextAction+".":
          focus?"Some source data is unavailable; retry or ask your manager before recording a badge.":"Explore the campus with your manager."}
      </div>
      <p className="mt-3 text-[11px] font-medium leading-5 text-slate-600">Badges reflect stored activity, not a ranking, employment decision, payment, permission to publish, or university credit. Your assignments and school syllabus still determine required internship work.</p>
    </section>
  );
}
