"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertCircle, ArrowRight, BarChart3, BookOpenCheck, CalendarDays, CheckCircle2,
  ClipboardList, ExternalLink, Flag, GraduationCap, Link2, ListChecks, MapPinned,
  MessageCircle, Plus, Search, ShieldCheck, Sparkles, Target, Users, X,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { InternName } from "@/components/portal/PersonFace";
import { DESK_UI } from "@/lib/portal/desk-ui";
import {
  CAMPUS_CHANNELS, CAMPUS_COACHING_PROMPTS, CAMPUS_GROWTH_PRINCIPLE, CAMPUS_LEAD_TYPES,
  CAMPUS_OPPORTUNITY_TYPES, CAMPUS_PHASES, CAMPUS_TARGETS,
  campusApprovalView, campusTrackingPath,
} from "@/lib/internship/campus-growth";
import {
  CAMPUS_LEAD_STATUSES, createCampusMission, reviewCampusOpportunity,
  saveCampusLead, saveCampusLink, saveCampusOpportunity, saveCampusPolicy,
  saveCampusResult, updateCampusLead,
} from "@/lib/internship/campus-growth-actions";
import type {
  CampusCard, CampusLead, CampusLink, CampusMission, CampusOpportunity,
  CampusResult, CampusSourceHealth,
} from "@/lib/internship/campus-growth-data";

type Tab = "overview" | "opportunities" | "leads" | "tracking" | "missions";
const TABS: Array<{ key: Tab; label: string; icon: typeof Flag }> = [
  {key:"overview",label:"Overview",icon:BarChart3},
  {key:"opportunities",label:"Opportunities & approvals",icon:ShieldCheck},
  {key:"leads",label:"Leads & follow-ups",icon:Users},
  {key:"tracking",label:"Tracking & results",icon:Target},
  {key:"missions",label:"Intern missions",icon:ClipboardList},
];
const REVIEW_STATES = [
  ["approved","Approved — permission and SitGuru review confirmed"],
  ["ava_review","Needs Ava review"],
  ["university_approval","University permission required"],
  ["jason_review","Escalate to Jason"],
  ["not_permitted","Not permitted"],
  ["needs_research","Needs further research"],
] as const;
const PLAYBOOK = [
  {name:"1. Explore",description:"Find credible student, community and pet-care opportunities, then record the source.",key:"Explore"},
  {name:"2. Verify",description:"Confirm campus rules, outreach permissions and whether school or leadership approval is required.",key:"Verify"},
  {name:"3. Propose",description:"Give Ava a specific audience, approved CTA, planned activity and measurable learning goal.",key:"Propose"},
  {name:"4. Approve",description:"Review work, check brand/consent requirements and escalate external or CEO permissions.",key:"Approve"},
  {name:"5. Execute",description:"Create an intern assignment, approved asset and unique tracking link. Launch only when permitted.",key:"Execute"},
  {name:"6. Learn",description:"Separate tracked visits from reported outcomes, record evidence and update the final Growth Report.",key:"Learn"},
];
const MISSION_TEMPLATES = [
  {
    key:"research",label:"Research campus opportunities",
    title:"Campus Opportunity Research & Permission Matrix",
    description:"Identify three credible campus or nearby pet-care opportunities. Document organizer, rules, outreach permissions, audience, proposed benefit for Gurus and Pet Parents, and next recommendation. Do not publish or contact without required approval.",
    lane:"strategy",
  },
  {
    key:"recruit",label:"Recruit student Gurus",
    title:"Student Guru Recruitment Experiment",
    description:"Design one permission-based student Guru outreach experiment. Review brand assets and campus rules, identify the official signup destination, create the tracking link, document outreach, and report visits, conversations and applications separately.",
    lane:"outreach",
  },
  {
    key:"creative",label:"Build approved campus content",
    title:"Campus Pet-Care Content Series",
    description:"Draft audience-specific social and flyer concepts with approved SitGuru wording, real signup links, campus-specific permissions and measurable outcomes. Submit creative for manager review before publishing.",
    lane:"creative",
  },
  {
    key:"results",label:"Analyze campaign results",
    title:"Campus Growth Evidence & Final Report",
    description:"Compare actual tracked link visits and QR events with manually reported outcomes. Explain attribution limits, lessons, proposed changes and how the work contributes to the intern's university final project.",
    lane:"results",
  },
] as const;

function readableDate(value: string) {
  if (!value) return "Not scheduled";
  const date = new Date(value.slice(0,10)+"T12:00:00");
  return Number.isNaN(date.getTime()) ? "Date unavailable" :
    date.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"});
}
function compactNumber(value:number | null) { return value===null?"—":new Intl.NumberFormat("en-US").format(value); }
function Label({children}:{children:React.ReactNode}) {return <span className="text-xs font-black uppercase tracking-wide text-[#0F2744]">{children}</span>;}
const INPUT="min-h-11 w-full min-w-0 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 py-2 text-sm font-semibold text-[#0F2744] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#DBEAFE]";
const BUTTON="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]";
const SECONDARY="inline-flex min-h-11 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#1D4ED8] hover:bg-[#EFF6FF]";

function Stat({label,value,detail,tone="blue"}:{label:string;value:number|null;detail?:string;tone?:"blue"|"green"|"amber"}) {
  const theme=tone==="green"?"bg-[#F0FDF4] border-[#D1FAE5]":tone==="amber"?"bg-[#FFF7ED] border-[#FED7AA]":"bg-[#EFF6FF] border-[#BFDBFE]";
  return (
    <article className={"min-w-0 rounded-2xl border p-3 sm:p-4 "+theme}>
      <p className="text-2xl font-black tabular-nums text-[#0F2744] sm:text-3xl">{compactNumber(value)}</p>
      <p className="mt-1 text-xs font-black text-[#0F2744]">{label}</p>
      {detail?<p className="mt-1 text-[11px] font-medium leading-5 text-slate-600">{detail}</p>:null}
    </article>
  );
}
function Empty({title,detail}:{title:string;detail:string}) {
  return <div className="rounded-2xl border border-dashed border-slate-200 bg-[#F8FAFC] p-5">
    <p className="text-sm font-black text-[#0F2744]">{title}</p>
    <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{detail}</p>
  </div>;
}
function HiddenContext({card,tab}:{card:CampusCard;tab:Tab}){
  return <>
    <input type="hidden" name="returnTo" value="/manager/campus-growth"/>
    <input type="hidden" name="campusContext" value={card.internId}/>
    <input type="hidden" name="tabContext" value={tab}/>
    <input type="hidden" name="internId" value={card.internId}/>
  </>;
}
function ReviewBox({opportunity,card}:{opportunity:CampusOpportunity;card:CampusCard}){
  const [approval,setApproval]=useState(opportunity.approval);
  const view=campusApprovalView(opportunity.approval);
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-black uppercase tracking-wide text-[#2563EB]">{opportunity.type} · {opportunity.status}</p>
          <h4 className="mt-1 text-base font-black text-[#0F2744]">{opportunity.title}</h4>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-600">{opportunity.description||"No description recorded"}</p>
        </div>
        <span className={"rounded-full px-2.5 py-1 text-[11px] font-black "+view.tone}>{view.label}</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-slate-600">
        {opportunity.happensOn?<span className="inline-flex items-center gap-1"><CalendarDays size={14}/>{readableDate(opportunity.happensOn)}</span>:null}
        {opportunity.contactOrganization?<span>{opportunity.contactOrganization}</span>:null}
        {opportunity.location?<span>{opportunity.location}</span>:null}
        {opportunity.sourceUrl?.startsWith("https://")?<a href={opportunity.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-black text-[#2563EB]">Source <ExternalLink size={13}/></a>:null}
      </div>
      {opportunity.rulesNotes?<p className="mt-3 rounded-xl bg-[#FFF7ED] px-3 py-2 text-xs font-semibold leading-5 text-amber-900">Rules or approval notes: {opportunity.rulesNotes}</p>:null}
      {opportunity.avaReview?<p className="mt-2 text-xs font-medium leading-5 text-slate-600"><strong>Ava's previous feedback:</strong> {opportunity.avaReview}</p>:null}
      <form action={reviewCampusOpportunity} className="mt-4 space-y-3 border-t border-slate-100 pt-3">
        <HiddenContext card={card} tab="opportunities"/>
        <input type="hidden" name="opportunityId" value={opportunity.id}/>
        <label className="block space-y-1"><Label>Review decision</Label>
          <select className={INPUT} name="approval" value={approval} onChange={event=>setApproval(event.target.value)}>
            {REVIEW_STATES.map(([value,label])=><option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label className="block space-y-1"><Label>Feedback, approval reason or next action</Label>
          <textarea name="reviewNote" rows={2} required={approval==="approved"} minLength={approval==="approved"?12:undefined} maxLength={1000}
            className={INPUT} placeholder="What has been verified and what should the intern do next?"/>
        </label>
        {approval==="approved" && opportunity.approval==="university_approval" ? (
          <label className="flex items-start gap-2 rounded-xl border border-amber-200 bg-[#FFF7ED] p-3 text-xs font-bold leading-5 text-amber-900">
            <input type="checkbox" name="externalPermissionConfirmed" value="yes" required className="mt-1"/>
            I have independently confirmed that the required university permission was granted, and recorded the basis above.
          </label>
        ):null}
        <button type="submit" className={BUTTON}>Save review decision <ArrowRight size={16}/></button>
      </form>
    </article>
  );
}

function CampusOverview({card,health,opportunities,missions,leads,openTab}:{
  card:CampusCard; health:CampusSourceHealth; opportunities:CampusOpportunity[];missions:CampusMission[];leads:CampusLead[];openTab:(tab:Tab)=>void;
}){
  const reviews=opportunities.filter(o=>["ava_review","university_approval","jason_review"].includes(o.approval));
  const near=opportunities.filter(o=>o.happensOn && o.status!=="Completed" && o.status!=="Not Pursuing").sort((a,b)=>a.happensOn.localeCompare(b.happensOn)).slice(0,4);
  return <div className="space-y-4">
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      <Stat label="Opportunities researched" value={health.opportunities?card.opportunities:null}/>
      <Stat label="Campus missions" value={health.missions?card.missionCount:null}/>
      <Stat label="Pending approvals" value={health.opportunities?reviews.length:null} tone="amber"/>
      <Stat label="Tracked visits" value={health.visits?card.visits:null}/>
      <Stat label="QR scan events" value={health.visits?card.scans:null}/>
      <Stat label="Leads recorded" value={health.leads?leads.length:null} tone="green"/>
    </section>
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <section className={DESK_UI.card+" p-4 sm:p-5"}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-lg font-black text-[#0F2744]">Campus-specific rules & market plan</h3>
          <span className="rounded-full bg-[#EFF6FF] px-3 py-1.5 text-xs font-black text-[#1D4ED8]">{card.campusName}</span>
        </div>
        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Save permission sources, organization rules, ZIP/market observations and safe outreach options. These notes apply only to this intern's campus workspace.</p>
        <form action={saveCampusPolicy} className="mt-4 space-y-3">
          <HiddenContext card={card} tab="overview"/>
          <label className="block space-y-1"><Label>University permissions & rules</Label>
            <textarea name="policyNotes" rows={4} defaultValue={card.policyNotes} maxLength={6000} className={INPUT}
              placeholder="Official source, tabling rules, allowed flyers/groups, contacts, approval required, date checked…"/>
          </label>
          <label className="block space-y-1"><Label>Local market & outreach observations</Label>
            <textarea name="marketNotes" rows={3} defaultValue={card.marketNotes} maxLength={6000} className={INPUT}
              placeholder="Nearby ZIP markets, student providers, pet-parent demand, permitted organizations and recommended experiments…"/>
          </label>
          <button type="submit" className={BUTTON}><CheckCircle2 size={17}/> Save campus plan</button>
        </form>
        {!card.policyNotes?<p className="mt-3 rounded-xl border border-amber-200 bg-[#FFF7ED] p-3 text-xs font-bold text-amber-900">Campus rules have not been documented. Research is welcome; posting, tabling or distributing flyers still requires the appropriate permission.</p>:null}
      </section>
      <section className={DESK_UI.card+" p-4 sm:p-5"}>
        <h3 className="text-lg font-black text-[#0F2744]">This campus's next actions</h3>
        <div className="mt-4 space-y-3">
          {reviews.length ? <button type="button" onClick={()=>openTab("opportunities")} className="flex w-full items-start gap-3 rounded-xl bg-[#FFF7ED] p-3 text-left text-sm font-bold text-amber-900">
            <ShieldCheck size={19} className="mt-0.5 shrink-0"/> Review {reviews.length} permission or approval {reviews.length===1?"request":"requests"} <ArrowRight className="ml-auto shrink-0" size={16}/>
          </button>:<p className="rounded-xl bg-[#F0FDF4] p-3 text-sm font-semibold text-[#166534]">No submitted opportunities are waiting for manager or external approval.</p>}
          {!card.policyNotes?<button type="button" onClick={()=>document.querySelector<HTMLTextAreaElement>('textarea[name="policyNotes"]')?.focus()} className="flex w-full items-center gap-2 rounded-xl bg-[#EFF6FF] p-3 text-left text-sm font-bold text-[#1D4ED8]"><ListChecks size={18}/> Document university rules</button>:null}
          <button type="button" onClick={()=>openTab("missions")} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 p-3 text-left text-sm font-bold text-[#0F2744]"><Flag size={18} className="text-[#2563EB]"/> Assign the next campus mission</button>
          <button type="button" onClick={()=>openTab("tracking")} className="flex w-full items-center gap-2 rounded-xl border border-slate-200 p-3 text-left text-sm font-bold text-[#0F2744]"><Link2 size={18} className="text-[#2563EB]"/> Prepare a unique tracking link</button>
        </div>
        <h4 className="mt-5 text-sm font-black text-[#0F2744]">Upcoming recorded opportunities</h4>
        <div className="mt-2 space-y-2">
          {near.length?near.map(item=><p key={item.id} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-xs font-semibold text-slate-700">
            <span className="font-black text-[#0F2744]">{item.title}</span> · {readableDate(item.happensOn)} · {campusApprovalView(item.approval).label}
          </p>):<p className="text-sm font-medium text-slate-500">No dated opportunities are recorded yet.</p>}
        </div>
      </section>
    </div>
  </div>;
}

function OpportunitiesTab({card,opportunities}:{card:CampusCard;opportunities:CampusOpportunity[]}){
  const [filter,setFilter]=useState<"all"|"needs_review"|"approved"|"research">("all");
  const [query,setQuery]=useState("");
  const list=useMemo(()=>opportunities.filter(o=>{
    if(filter==="needs_review" && !["ava_review","jason_review","university_approval"].includes(o.approval))return false;
    if(filter==="approved" && o.approval!=="approved")return false;
    if(filter==="research" && !["needs_research","not_permitted"].includes(o.approval))return false;
    return (o.title+" "+o.description+" "+o.type+" "+o.contactOrganization).toLowerCase().includes(query.toLowerCase());
  }),[opportunities,filter,query]);
  return <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
    <section className={DESK_UI.card+" min-w-0 p-4 sm:p-5"}>
      <h3 className="text-lg font-black text-[#0F2744]">Opportunity review queue</h3>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Research, permission, manager review and outreach status for this university. An approved SitGuru tactic does not waive a campus's external rules.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {([["all","All"],["needs_review","Needs review"],["approved","Approved"],["research","Research / blocked"]] as const).map(([value,label])=>(
          <button type="button" key={value} onClick={()=>setFilter(value)} aria-pressed={filter===value} className={"min-h-10 rounded-xl px-3 text-xs font-black "+(filter===value?"bg-[#2563EB] !text-white":"bg-[#F1F5F9] text-[#0F2744]")}>{label}</button>
        ))}
      </div>
      <label className="relative mt-3 block">
        <Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#2563EB]"/>
        <input type="search" placeholder="Search opportunities and organizations…" aria-label="Search campus opportunities" className={INPUT+" pl-10"} value={query} onChange={e=>setQuery(e.target.value)}/>
      </label>
      <div className="mt-4 space-y-3">{list.length?list.map(o=><ReviewBox key={o.id} opportunity={o} card={card}/>):<Empty title="No matching opportunities" detail="Choose another filter, or add a new research opportunity on the right."/></div>
    </section>
    <section className={DESK_UI.card+" p-4 sm:p-5 xl:sticky xl:top-24"}>
      <h3 className="text-lg font-black text-[#0F2744]">Add a campus opportunity</h3>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Record a source first. New ideas begin in research; no public activity launches automatically.</p>
      <form action={saveCampusOpportunity} className="mt-4 space-y-3">
        <HiddenContext card={card} tab="opportunities"/>
        <input type="hidden" name="approval" value="needs_research"/>
        <input type="hidden" name="status" value="Idea"/>
        <label className="block space-y-1"><Label>Opportunity title</Label><input name="title" required maxLength={140} placeholder="Student club or campus event" className={INPUT}/></label>
        <label className="block space-y-1"><Label>Type</Label><select name="type" className={INPUT}>{CAMPUS_OPPORTUNITY_TYPES.map(type=><option key={type}>{type}</option>)}</select></label>
        <label className="block space-y-1"><Label>What is the opportunity?</Label><textarea name="description" rows={3} maxLength={1500} className={INPUT} placeholder="Audience, potential benefit, proposed activity and limitations"/></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><Label>Event date (optional)</Label><input name="happensOn" type="date" className={INPUT}/></label>
          <label className="block space-y-1"><Label>Organization</Label><input name="contactOrganization" maxLength={150} className={INPUT}/></label>
        </div>
        <label className="block space-y-1"><Label>Source URL</Label><input name="sourceUrl" type="url" placeholder="https://…" className={INPUT}/></label>
        <label className="block space-y-1"><Label>University rules still to confirm</Label><textarea name="rulesNotes" rows={2} maxLength={1500} className={INPUT} placeholder="Posting, tabling, permission or approval requirements"/></label>
        <button type="submit" className={BUTTON}><Plus size={17}/> Save research opportunity</button>
      </form>
    </section>
  </div>;
}

function LeadsTab({card,leads}:{card:CampusCard;leads:CampusLead[]}){
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const matches=leads.filter(l=>(filter==="all"||l.status===filter)&&([l.name,l.type,l.organization,l.status,l.notes].join(" ").toLowerCase().includes(search.toLowerCase())));
  const pending=leads.filter(l=>!["Converted","Closed","Not Interested"].includes(l.status)).length;
  return <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
    <section className={DESK_UI.card+" p-4 sm:p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-2"><h3 className="text-lg font-black text-[#0F2744]">Campus relationship pipeline</h3><span className="rounded-xl bg-[#EFF6FF] px-3 py-1.5 text-xs font-black text-[#1D4ED8]">{pending} open leads</span></div>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Leads are private team research and follow-ups, not completed Guru registrations or confirmed partnerships.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search names or organizations…" aria-label="Search leads" className={INPUT+" flex-1"}/>
        <select className={INPUT+" !w-auto"} aria-label="Filter lead status" value={filter} onChange={e=>setFilter(e.target.value)}>
          <option value="all">All statuses</option>{CAMPUS_LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}
        </select>
      </div>
      <div className="mt-4 space-y-3">
        {matches.length?matches.map(l=>(
          <article key={l.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1"><h4 className="text-sm font-black text-[#0F2744]">{l.name}</h4><p className="mt-1 text-xs font-semibold text-slate-600">{l.type}{l.organization?" · "+l.organization:""}</p></div>
              <span className="rounded-full bg-[#F1F5F9] px-3 py-1 text-[11px] font-black text-slate-700">{l.status}</span>
            </div>
            {l.notes?<p className="mt-2 whitespace-pre-wrap text-xs font-medium leading-5 text-slate-600">{l.notes}</p>:null}
            <form action={updateCampusLead} className="mt-3 grid gap-2 border-t border-slate-100 pt-3 sm:grid-cols-[170px_minmax(0,1fr)_auto] sm:items-end">
              <HiddenContext card={card} tab="leads"/><input type="hidden" name="leadId" value={l.id}/>
              <label className="block space-y-1"><Label>Follow-up stage</Label><select className={INPUT} name="status" defaultValue={l.status}>{!CAMPUS_LEAD_STATUSES.includes(l.status as typeof CAMPUS_LEAD_STATUSES[number])?<option value={l.status}>{l.status}</option>:null}{CAMPUS_LEAD_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label>
              <label className="block space-y-1"><Label>Latest follow-up note</Label><input name="notes" maxLength={2000} placeholder="Optional: keep current note if blank" className={INPUT}/></label>
              <button type="submit" className={BUTTON}>Save status</button>
            </form>
          </article>
        )):<Empty title="No matching leads" detail="Try another search or capture a new permission-based prospect."/></div>
    </section>
    <section className={DESK_UI.card+" p-4 sm:p-5 xl:sticky xl:top-24"}>
      <h3 className="text-lg font-black text-[#0F2744]">Add a campus lead</h3>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Enter only information necessary for a legitimate outreach follow-up; never add people to marketing lists without permission.</p>
      <form action={saveCampusLead} className="mt-4 space-y-3">
        <HiddenContext card={card} tab="leads"/>
        <label className="block space-y-1"><Label>Person or group name</Label><input name="name" required maxLength={150} className={INPUT} placeholder="Name or approved community organization"/></label>
        <label className="block space-y-1"><Label>Prospect type</Label><select name="type" className={INPUT}>{CAMPUS_LEAD_TYPES.map(t=><option key={t}>{t}</option>)}</select></label>
        <label className="block space-y-1"><Label>Organization</Label><input name="organization" maxLength={180} className={INPUT}/></label>
        <label className="block space-y-1"><Label>Contact channel (optional)</Label><input name="contact" maxLength={180} className={INPUT} placeholder="Public business email or approved contact path"/></label>
        <label className="block space-y-1"><Label>Notes / permission context</Label><textarea name="notes" rows={3} className={INPUT} placeholder="What was discussed? Is a follow-up invited?"/></label>
        <button type="submit" className={BUTTON}><Plus size={17}/> Save lead</button>
      </form>
    </section>
  </div>;
}

function TrackingTab({card,links,results,health}:{card:CampusCard;links:CampusLink[];results:CampusResult[];health:CampusSourceHealth}){
  const reported=results.reduce((a,r)=>({
    parents:a.parents+r.reportedPetParents,gurus:a.gurus+r.reportedGuruApplications,bookings:a.bookings+r.reportedBookings,
  }),{parents:0,gurus:0,bookings:0});
  return <div className="space-y-4">
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <Stat label="Link visits" value={health.visits?card.visits:null}/>
      <Stat label="QR scan events" value={health.visits?card.scans:null}/>
      <Stat label="Reported Guru applications" value={health.results?reported.gurus:null} tone="green" detail="Entered by the team; not verified signup conversions"/>
      <Stat label="Reported Pet Parents" value={health.results?reported.parents:null} tone="green" detail="Entered by the team; not verified signup conversions"/>
    </div>
    <div className="grid items-start gap-4 xl:grid-cols-2">
      <section className={DESK_UI.card+" p-4 sm:p-5"}>
        <h3 className="text-lg font-black text-[#0F2744]">Unique campus tracking links</h3>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Each new campaign gets a separate tracked code. Clicks to the link record visits, and QR-mode links record scan events—not authenticated registrations. A preview/test open will also count.</p>
        <form action={saveCampusLink} className="mt-4 grid gap-3 sm:grid-cols-2">
          <HiddenContext card={card} tab="tracking"/>
          <input type="hidden" name="campus" value={card.campusName}/>
          <label className="block space-y-1 sm:col-span-2"><Label>Campaign name</Label><input className={INPUT} name="campaign" required maxLength={100} placeholder="Campus Guru outreach · Nov 2026"/></label>
          <label className="block space-y-1"><Label>Audience / destination</Label><select name="target" className={INPUT}>{CAMPUS_TARGETS.map(t=><option key={t} value={t}>{t.replaceAll("_"," ")}</option>)}</select></label>
          <label className="block space-y-1"><Label>Channel</Label><select name="channel" className={INPUT}>{CAMPUS_CHANNELS.map(t=><option key={t}>{t}</option>)}</select></label>
          <button type="submit" className={BUTTON+" sm:col-span-2"}><Link2 size={17}/> Create campaign link</button>
        </form>
        <h4 className="mt-5 text-sm font-black text-[#0F2744]">Links for this campus ({links.length})</h4>
        <div className="mt-3 space-y-3">
          {links.length?links.map(link=>{
            const href=campusTrackingPath(link.code)+(link.channel==="qr"?"?scan=1":"");
            return <div key={link.id} className="min-w-0 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
              <p className="text-sm font-black text-[#0F2744]">{link.campaign||"Campus campaign"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-600">{link.channel} · {link.target.replaceAll("_"," ")} · {health.visits?link.visits+" visits · "+link.scans+" QR events":"Tracking data unavailable"}</p>
              <p className="mt-2 break-all rounded-lg bg-white p-2 text-xs font-bold text-[#2563EB]">https://www.sitguru.com{href}</p>
              <a href={href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-10 items-center gap-1 text-xs font-black text-[#2563EB]">Open tracked link <ExternalLink size={14}/></a>
            </div>;
          }):<Empty title="No tracking links yet" detail="Create one for each approved outreach campaign. Links do not grant Ambassador or PetPerks rewards."/ >}
        </div>
      </section>
      <section className={DESK_UI.card+" p-4 sm:p-5"}>
        <h3 className="text-lg font-black text-[#0F2744]">Record and review learning</h3>
        <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Manual numbers are stored as reported outcomes—not automatically verified user signups, commissions or bookings. Add a source and avoid double-counting across reporting periods.</p>
        <form action={saveCampusResult} className="mt-4 space-y-3">
          <HiddenContext card={card} tab="tracking"/>
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block space-y-1"><Label>Reported Guru applications</Label><input type="number" name="guruApplications" min="0" max="100000" step="1" inputMode="numeric" defaultValue={0} className={INPUT}/></label>
            <label className="block space-y-1"><Label>Reported Pet Parents</Label><input type="number" name="petParents" min="0" max="100000" step="1" inputMode="numeric" defaultValue={0} className={INPUT}/></label>
            <label className="block space-y-1"><Label>Reported bookings</Label><input type="number" name="bookings" min="0" max="100000" step="1" inputMode="numeric" defaultValue={0} className={INPUT}/></label>
          </div>
          <label className="block space-y-1"><Label>Evidence, reporting period & what you learned</Label><textarea name="lesson" required minLength={3} maxLength={2500} rows={4} className={INPUT} placeholder="Time period, source, comparisons and outcomes actually observed…"/></label>
          <label className="block space-y-1"><Label>Next recommendation</Label><textarea name="recommendation" rows={3} maxLength={2000} className={INPUT} placeholder="Repeat, change, test or stop what?"/></label>
          <button type="submit" className={BUTTON}><BookOpenCheck size={17}/> Save reported results</button>
        </form>
        <h4 className="mt-5 text-sm font-black text-[#0F2744]">Saved learning entries ({results.length})</h4>
        <div className="mt-3 max-h-[460px] space-y-2 overflow-y-auto">
          {results.length?results.slice(0,25).map(r=><article key={r.id} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
            <p className="text-xs font-black text-[#0F2744]">{readableDate(r.recordedAt)} · {r.reportedGuruApplications} Guru applications · {r.reportedPetParents} Pet Parents · {r.reportedBookings} bookings (reported)</p>
            <p className="mt-1 whitespace-pre-wrap text-xs font-medium leading-5 text-slate-600">{r.lesson||"No learning note"}</p>
            {r.recommendation?<p className="mt-2 text-xs font-semibold text-[#0D5C3A]">Next: {r.recommendation}</p>:null}
          </article>):<Empty title="No results have been recorded yet" detail="Start with one evidence-based lesson after an actual campaign or research activity."/ >}
        </div>
      </section>
    </div>
  </div>;
}

function MissionsTab({card,missions,requestId}:{card:CampusCard;missions:CampusMission[];requestId:string}){
  const [template,setTemplate]=useState("custom");
  const chosen=MISSION_TEMPLATES.find(t=>t.key===template);
  return <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
    <section className={DESK_UI.card+" p-4 sm:p-5"}>
      <h3 className="text-lg font-black text-[#0F2744]">Build a real campus mission</h3>
      <p className="mt-1 text-xs font-medium leading-5 text-slate-600">Publishing adds an actual student assignment to SitGuru. The existing Planner/Teams/SharePoint sync is attempted where configured; its success is not guaranteed by this screen.</p>
      <label className="mt-4 block space-y-1"><Label>Suggested learning activity (optional)</Label>
        <select className={INPUT} value={template} onChange={e=>setTemplate(e.target.value)}>
          <option value="custom">Start from a blank mission</option>
          {MISSION_TEMPLATES.map(t=><option key={t.key} value={t.key}>{t.label}</option>)}
        </select>
      </label>
      <form key={card.internId+"-"+template} action={createCampusMission} className="mt-3 space-y-3">
        <HiddenContext card={card} tab="missions"/>
        <input type="hidden" name="clientRequestId" value={requestId}/>
        <label className="block space-y-1"><Label>Assignment title</Label><input name="title" required maxLength={140} defaultValue={chosen?.title||""} className={INPUT} placeholder="A real outcome-oriented mission"/></label>
        <label className="block space-y-1"><Label>Due date</Label><input type="date" name="dueOn" required className={INPUT}/></label>
        <label className="block space-y-1"><Label>Task brief, evidence & expected deliverable</Label><textarea name="description" required minLength={3} maxLength={2000} rows={5} defaultValue={chosen?.description||""} className={INPUT} placeholder="A clear mission with observable results and project evidence…"/></label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1"><Label>Team workflow lane</Label><select name="lane" defaultValue={chosen?.lane||"strategy"} className={INPUT}>
            <option value="strategy">Growth and Strategy</option><option value="creative">Content and Social</option>
            <option value="coaching">Intern Projects</option><option value="outreach">Partnerships and Community</option>
            <option value="results">Analytics and Results</option>
          </select></label>
          <label className="block space-y-1"><Label>Creative freedom</Label><select name="freedom" defaultValue="Explore" className={INPUT}><option>Explore</option><option>Guided</option><option>Directed</option></select></label>
        </div>
        <fieldset className="space-y-2">
          <legend className="text-xs font-black uppercase tracking-wide text-[#0F2744]">Student learning phases</legend>
          <div className="flex flex-wrap gap-2">
            {CAMPUS_PHASES.map(phase=><label key={phase} className="flex min-h-10 items-center gap-2 rounded-xl border border-slate-200 bg-[#F8FAFC] px-3 text-xs font-semibold text-[#0F2744]">
              <input name="phase" type="checkbox" value={phase}/>{phase[0].toUpperCase()+phase.slice(1)}</label>)}
          </div>
        </fieldset>
        <div className="flex flex-wrap gap-2">
          <button type="submit" name="intent" value="draft" className={SECONDARY}>Save private draft</button>
          <button type="submit" name="intent" value="create" className={BUTTON}>Publish student mission <ArrowRight size={16}/></button>
        </div>
        <p className="text-xs font-medium text-slate-500">A private draft is hidden from the intern. Publishing starts the existing assignment workflow and review requirements.</p>
      </form>
    </section>
    <section className={DESK_UI.card+" p-4 sm:p-5"}>
      <h3 className="text-lg font-black text-[#0F2744]">Current student missions ({missions.length})</h3>
      <div className="mt-3 space-y-2">
        {missions.length?missions.map(m=><Link key={m.id} href={"/manager/assignments/"+encodeURIComponent(m.id)} className="block rounded-xl border border-slate-200 bg-[#F8FAFC] p-3 hover:border-[#BFDBFE]">
          <p className="text-sm font-black text-[#0F2744]">{m.title}</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">{m.status.replaceAll("_"," ")} · {m.dueOn?readableDate(m.dueOn):"Date not set"}</p>
          <p className="mt-2 inline-flex items-center gap-1 text-xs font-black text-[#2563EB]">Open assignment <ArrowRight size={14}/></p>
        </Link>):<Empty title="No campus missions yet" detail="Create a private draft or publish an actual internship assignment to start research."/ >}
      </div>
      <h4 className="mt-5 text-sm font-black text-[#0F2744]">What Ava should coach</h4>
      <ul className="mt-2 list-disc space-y-2 pl-5 text-xs font-medium leading-5 text-slate-600">{CAMPUS_COACHING_PROMPTS.map(prompt=><li key={prompt}>{prompt}</li>)}</ul>
      <div className="mt-4 flex flex-wrap gap-2">
        <Link className={SECONDARY} href="/manager/check-ins">Review weekly check-ins</Link>
        <Link className={SECONDARY} href="/manager/milestones">Program milestones</Link>
        <Link className={SECONDARY} href="/manager/assignments">All assignments</Link>
      </div>
    </section>
  </div>;
}

export default function ManagerCampusGrowthHome({
  cards, opportunities, leads, links, missions, results,
  sourceHealth, sourceIssues, notice, error,
  initialCampus="",initialTab="overview",missionRequestIds={},
}:{
  cards:CampusCard[];opportunities:CampusOpportunity[];leads:CampusLead[];
  links:CampusLink[];missions:CampusMission[];results:CampusResult[];
  sourceHealth:CampusSourceHealth;sourceIssues:string[];
  notice:string;error:boolean;initialCampus?:string;initialTab?:string;
  missionRequestIds?:Record<string,string>;
}){
  const [campusId,setCampusId]=useState(initialCampus);
  const [tab,setTab]=useState<Tab>(TABS.some(t=>t.key===initialTab)?initialTab as Tab:"overview");
  const card=cards.find(c=>c.internId===campusId)||cards[0]||null;
  const by= <T extends {internId:string}>(values:T[])=>values.filter(v=>v.internId===card?.internId);
  const myOpportunities=by(opportunities);
  const myLeads=by(leads);
  const myLinks=by(links);
  const myMissions=by(missions);
  const myResults=by(results);
  const pending=opportunities.filter(o=>["ava_review","university_approval","jason_review"].includes(o.approval)).length;
  const campuses=new Set(cards.map(c=>c.universityId||c.campusName)).size;
  const totals = {
    scans:cards.reduce((sum,c)=>sum+c.scans,0),
    visits:cards.reduce((sum,c)=>sum+c.visits,0),
    missions:cards.reduce((sum,c)=>sum+c.missionCount,0),
  };
  function selectCampus(id:string) {setCampusId(id);setTab("overview");}
  function openTab(value:Tab) {setTab(value);}

  return <div className="min-w-0 space-y-5 pb-28 lg:pb-8">
    <DeskPageHero icon={<GraduationCap size={22}/>} title="Campus Growth"
      subtitle="Plan, approve, execute and measure campus outreach with your assigned SitGuru interns."
      quote="Local opportunities. Real work. Measurable growth." banner="manager"/>
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <Link href="/manager/market-density" className={SECONDARY}><MapPinned size={16}/> Market Density</Link>
        <Link href="/manager/toolkit/brand" className={SECONDARY}><Sparkles size={16}/> Shared Brand Kit</Link>
        <Link href="/manager/help/campus-growth-manager" className={SECONDARY}><BookOpenCheck size={16}/> Step-by-step help</Link>
      </div>
    </div>
    {notice?<p role={error?"alert":"status"} className={"rounded-xl border p-4 text-sm font-bold "+(error?"border-rose-200 bg-rose-50 text-rose-900":"border-emerald-200 bg-emerald-50 text-emerald-900")}>{notice}</p>:null}
    {sourceIssues.length?<p role="alert" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-[#FFF7ED] p-4 text-sm font-semibold text-amber-950">
      <AlertCircle size={20} className="mt-0.5 shrink-0"/> Some source tables could not be loaded: {sourceIssues.join(", ")}. Related metrics display “—” instead of pretending there were zero results. Check the connection before making campaign decisions.
    </p>:null}
    <section aria-label="Campus Growth summary" className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
      <Stat label="University markets" value={campuses} detail={cards.length+" assigned intern campus workspaces"}/>
      <Stat label="Opportunities researched" value={sourceHealth.opportunities?opportunities.length:null}/>
      <Stat label="Approvals pending" value={sourceHealth.opportunities?pending:null} tone="amber"/>
      <Stat label="Campus missions" value={sourceHealth.missions?totals.missions:null}/>
      <Stat label="Tracked link visits" value={sourceHealth.visits?totals.visits:null}/>
      <Stat label="QR scan events" value={sourceHealth.visits?totals.scans:null} tone="green"/>
    </section>

    <section className={DESK_UI.card+" p-4 sm:p-5"}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h2 className="text-lg font-black text-[#0F2744]">Your assigned campus workspaces</h2>
          <p className="mt-1 text-sm font-medium text-slate-600">Select a university and intern to focus the entire page. Each school keeps its own rules, leads, assignments and tracking.</p>
        </div>
        <Link href="/manager/team" className="inline-flex min-h-11 items-center gap-2 text-sm font-black text-[#2563EB]">Manage intern team <ArrowRight size={17}/></Link>
      </div>
      {cards.length?(
        <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3" role="group" aria-label="Select campus and intern">
          {cards.map(c=>{
            const active=c.internId===card?.internId;
            return <button key={c.internId} type="button" aria-pressed={active} onClick={()=>selectCampus(c.internId)}
              className={"min-w-0 rounded-2xl border p-3 text-left transition "+(active?"border-[#2563EB] bg-[#EFF6FF] shadow-[inset_3px_0_0_#2563EB]":"border-slate-200 bg-white hover:bg-[#F8FAFC]")}>
              <p className="truncate text-sm font-black text-[#0F2744]">{c.campusName}</p>
              <p className="mt-2 text-xs font-semibold text-slate-600"><InternName name={c.internName} src={c.avatarUrl}/></p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] font-black text-[#2563EB]">
                <span>{c.opportunities} ideas</span><span>·</span><span>{c.missionCount} missions</span><span>·</span><span>{c.status}</span>
              </div>
            </button>;
          })}
        </div>
      ):<Empty title="No assigned campus workspaces" detail="An approved intern with a university and manager assignment will appear here. The page does not create duplicate students or sample campaigns."/ >}
    </section>

    {card?<>
      <section className={DESK_UI.card+" min-w-0 overflow-hidden p-3 sm:p-4"}>
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 px-1 pb-3">
          <div className="min-w-0"><h2 className="truncate text-base font-black text-[#0F2744]">{card.campusName}</h2>
            <p className="mt-0.5 text-xs font-semibold text-slate-600">{card.internName}{card.semester?" · "+card.semester:""} · {card.status}</p></div>
          <Link href="/manager/messages" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-[#EFF6FF] px-3 text-xs font-black text-[#2563EB]"><MessageCircle size={16}/> Message team</Link>
        </div>
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Campus Growth work areas">
          {TABS.map(item=>{
            const Icon=item.icon;
            return <button role="tab" aria-selected={tab===item.key} type="button" key={item.key}
              onClick={()=>setTab(item.key)}
              className={"inline-flex min-h-11 items-center gap-2 rounded-xl px-3 text-xs font-black sm:text-sm "+(tab===item.key?"bg-[#2563EB] !text-white":"bg-[#F1F5F9] text-[#0F2744] hover:bg-[#EFF6FF]")}>
              <Icon size={16} aria-hidden="true"/>{item.label}
            </button>;
          })}
        </div>
      </section>
      <section role="tabpanel" aria-label={TABS.find(t=>t.key===tab)?.label}>
        {tab==="overview"?<CampusOverview card={card} health={sourceHealth} opportunities={myOpportunities} missions={myMissions} leads={myLeads} openTab={openTab}/>:null}
        {tab==="opportunities"?<OpportunitiesTab card={card} opportunities={myOpportunities}/>:null}
        {tab==="leads"?<LeadsTab card={card} leads={myLeads}/>:null}
        {tab==="tracking"?<TrackingTab card={card} links={myLinks} results={myResults} health={sourceHealth}/>:null}
        {tab==="missions"?<MissionsTab card={card} missions={myMissions} requestId={missionRequestIds[card.internId]||""}/>:null}
      </section>
    </>:null}
    <section className={DESK_UI.card+" p-4 sm:p-5"}>
      <div className="flex flex-wrap items-center gap-2"><ListChecks size={20} className="text-[#2563EB]"/><h2 className="text-lg font-black text-[#0F2744]">Campus Growth operating playbook</h2></div>
      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{CAMPUS_GROWTH_PRINCIPLE}</p>
      <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {PLAYBOOK.map(step=><li key={step.key} className="rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
          <h3 className="text-sm font-black text-[#0F2744]">{step.name}</h3>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-600">{step.description}</p>
        </li>)}
      </ol>
      <div className="mt-4 flex flex-wrap gap-3 text-sm font-black">
        <Link href="/manager/help/campus-growth-manager" className="text-[#2563EB]">Full how-to guide</Link>
        <Link href="/manager/insights" className="text-[#2563EB]">Growth Insights</Link>
        <Link href="/manager/campaigns-content" className="text-[#2563EB]">Review creative</Link>
        <Link href="/manager/check-ins" className="text-[#2563EB]">Intern check-ins</Link>
      </div>
    </section>
    <p className="text-xs font-medium leading-5 text-slate-500">University opportunities require local permission. Campus QR and link events are not automatically confirmed user signups. Reported registrations and applications are entered by the team and should be independently reconciled in SitGuru Growth Insights.</p>
  </div>;
}
