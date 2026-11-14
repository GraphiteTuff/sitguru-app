"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Lightbulb, RefreshCw, Sparkles } from "lucide-react";

const IDEAS=[
  {title:"The Student Sitter Spotlight",audience:"Future Gurus",idea:"Research where students already seek flexible pet-care work. Suggest an approved, practical way to introduce SitGuru's Guru signup.",deliverable:"One permission-aware outreach concept, likely campus channels, a sample CTA and a learning question.",href:"#add-opportunity"},
  {title:"Pets of Campus",audience:"Pet Parents",idea:"Find a campus pet club or pet-friendly community activity. Propose a consent-based story or event for SitGuru's Community Studio.",deliverable:"A researched opportunity, photo/website/social consent requirements and an audience-specific message.",href:"#add-opportunity"},
  {title:"The Weekend Away Test",audience:"Pet Parents",idea:"Develop a message for students or local residents who need reliable pet care while traveling. Research nearby markets and competing alternatives first.",deliverable:"A short campaign hypothesis, potential CTA and how you would verify real bookings.",href:"#add-opportunity"},
  {title:"One Campus, Two Audiences",audience:"Market research",idea:"Compare which student groups might benefit from earning opportunities as Gurus versus which may need pet-care services.",deliverable:"A target-audience matrix and one ethically sourced campus insight.",href:"#add-opportunity"},
  {title:"Campus Partner Discovery",audience:"Community partners",idea:"Identify a local shelter, rescue, student organization or pet business that might welcome a mutually beneficial partnership.",deliverable:"Document one verified prospect, contact/permission route, benefits and next recommended step.",href:"#campus-leads-form"},
  {title:"Make Every Click Count",audience:"Campaign measurement",idea:"Plan how you would distinguish QR scans, site visits, completed Guru profiles and Pet Parent bookings—without counting a test scan as a signup.",deliverable:"A short measurement plan and one campaign-specific tracking link after approval.",href:"#campus-tracking-form"},
  {title:"The Curious Campus Question",audience:"Student research",idea:"Design a neutral question to understand whether pet care or income opportunities are more relevant to a chosen campus audience.",deliverable:"One unbiased question, proposed sample method and note about privacy and campus consent.",href:"#add-opportunity"},
  {title:"Tell the Real Growth Story",audience:"Final project",idea:"Review the actual campus activity records, identify one result or obstacle and explain what SitGuru should do differently.",deliverable:"A sourced learning summary and a specific recommendation for your final Growth Report.",href:"#campus-results-form"},
] as const;

export default function CampusIdeaDeck(){
  const [index,setIndex]=useState(0);
  const current=IDEAS[index];
  return (
    <section aria-labelledby="campus-idea-title" className="relative min-w-0 overflow-hidden rounded-[1.5rem] border border-[#99F6E4] bg-gradient-to-br from-[#0F2744] via-[#123A60] to-[#0D5C3A] p-5 text-white shadow-sm sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.12em] !text-white/80"><Sparkles size={17} aria-hidden="true"/> Campus Idea Generator</p>
        <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold !text-white">{index+1} of {IDEAS.length} inspiration cards</span>
      </div>
      <h2 id="campus-idea-title" className="mt-3 text-2xl font-black !text-white sm:text-3xl">{current.title}</h2>
      <p className="mt-2 text-xs font-black uppercase tracking-wider !text-teal-200">{current.audience}</p>
      <p className="mt-3 max-w-3xl text-sm font-medium leading-7 !text-white/95">{current.idea}</p>
      <div className="mt-4 rounded-2xl border border-white/20 bg-white/10 p-4">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wide !text-teal-200"><Lightbulb size={16} aria-hidden="true"/> Your creative challenge</p>
        <p className="mt-2 text-sm font-medium leading-6 !text-white">{current.deliverable}</p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={()=>setIndex(n=>(n+1)%IDEAS.length)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/25 bg-white/15 px-4 text-sm font-black !text-white hover:bg-white/25">
          <RefreshCw size={17} aria-hidden="true"/> Surprise me with another
        </button>
        <Link href={current.href} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-white px-4 text-sm font-black !text-[#0F2744] hover:bg-[#EFF6FF]">
          Explore this idea <ArrowRight size={17} aria-hidden="true"/>
        </Link>
      </div>
      <p className="mt-4 text-xs font-semibold leading-5 !text-white/80">These are optional inspiration prompts, not assigned tasks, approved campaigns or guaranteed work hours. Send ideas to Ava and confirm campus permissions before outreach.</p>
    </section>
  );
}
