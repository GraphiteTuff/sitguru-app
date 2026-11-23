"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import type {EventShareDashboard,EventShareChannel,EventShareView} from "@/lib/event-match/service";
type Role="manager"|"intern"|"admin";
const channels:[EventShareChannel,string][]=[["facebook","Facebook / Groups"],["instagram","Instagram"],["tiktok","TikTok"],["x","X"],["other","Other"]];
const field="mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm text-slate-900";
const secondary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-bold text-blue-900 disabled:opacity-50";
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-sm font-bold text-white disabled:opacity-50";
type Filter={q:string;city:string;state:string};
const empty:EventShareDashboard={events:[],campaigns:[],totals:{linkOpens:0,qrOpens:0,eventClicks:0,copyIntents:0,sharesReported:0},period:"90d"};
async function call<T>(method:"GET"|"POST"|"PATCH",url:string,body?:unknown):Promise<T>{
 const response=await fetch(url,{method,cache:"no-store",credentials:"same-origin",headers:body?{"Content-Type":"application/json"}:undefined,body:body?JSON.stringify(body):undefined});
 const value=await response.json() as {error?:string};if(!response.ok)throw new Error(value.error||"Request failed");return value as T;
}
export default function EventMatchBoard({role}:{role:Role}){
 const [data,setData]=useState<EventShareDashboard>(empty),[filters,setFilters]=useState<Filter>({q:"",city:"",state:""});
 const [activeFilters,setActiveFilters]=useState<Filter>({q:"",city:"",state:""}),[selected,setSelected]=useState(""),[channel,setChannel]=useState<EventShareChannel>("facebook");
 const [group,setGroup]=useState(""),[busy,setBusy]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const load=useCallback(async (f:Filter)=>{
  setBusy(true);setError("");
  try{const params=new URLSearchParams();Object.entries(f).forEach(([k,v])=>{if(v.trim())params.set(k,v.trim());});
   const result=await call<EventShareDashboard>("GET","/api/event-match?"+params.toString());setData(result);
  }catch(e){setError(e instanceof Error?e.message:"Unable to load upcoming events.");}finally{setBusy(false);}
 },[]);
 useEffect(()=>{void load({q:"",city:"",state:""});},[load]);
 const chosen=data.events.find(e=>e.id===selected);
 async function create(){
  if(!chosen)return;setBusy(true);setError("");setNotice("");
  try{const result=await call<{share:{status:string}}>("POST","/api/event-match",{action:"create",eventId:chosen.id,channel,targetGroup:group});
   setNotice(result.share.status==="approved"?"Approved campaign ready to share.":"Draft submitted for manager approval.");await load(activeFilters);
  }catch(e){setError(e instanceof Error?e.message:"Unable to generate promotion.");}finally{setBusy(false);}
 }
 async function act(c:EventShareView,action:"approve"|"reject"|"copy"|"shared"){
  setBusy(true);setError("");setNotice("");
  try{
   if(action==="copy")await navigator.clipboard.writeText(c.reply_text);
   await call(action==="approve"||action==="reject"?"PATCH":"POST","/api/event-match",{id:c.id,action});
   setNotice(action==="copy"?"Caption and tracked link copied.":action==="shared"?"Manual share recorded.":action==="approve"?"Promotion approved.":"Promotion rejected.");
   await load(activeFilters);
  }catch(e){setError(e instanceof Error?e.message:"Action failed.");}finally{setBusy(false);}
 }
 return <main className="mx-auto w-full max-w-7xl space-y-5 px-3 py-5 text-[#0F2744] sm:px-6">
  <header className="rounded-3xl bg-gradient-to-r from-[#0F2744] to-[#0D5C3A] p-6 text-white">
   <p className="text-xs font-black uppercase tracking-widest !text-emerald-100">SitGuru · Community Studio</p>
   <h1 className="mt-2 text-3xl font-black !text-white">Event Match &amp; Share</h1>
   <p className="mt-2 text-sm !text-white">Promote local pet events with approved trackable social posts, branded graphics, and QR codes.</p>
   <nav className="mt-4 flex flex-wrap gap-3 text-sm font-bold">
    <Link href={role==="admin"?"/admin/growth":"/"+role+"/community-studio"} className="rounded-lg bg-white/15 px-3 py-2 !text-white">Community Studio</Link>
    <Link href={role==="admin"?"/admin/growth/guru-match":"/"+role+"/community-studio/guru-match"} className="rounded-lg bg-white/15 px-3 py-2 !text-white">Guru Match &amp; Share</Link>
   </nav>
  </header>
  <section className="grid grid-cols-2 gap-3 lg:grid-cols-5" aria-label="Last 90 days">
   {([["Link opens",data.totals.linkOpens],["QR scans",data.totals.qrOpens],["Event clicks",data.totals.eventClicks],["Copy intents",data.totals.copyIntents],["Reported shares",data.totals.sharesReported]] as const).map(([label,count])=>
    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4" key={label}><p className="text-xs font-bold">{label}</p><p className="mt-2 text-3xl font-black tabular-nums">{count.toLocaleString()}</p></div>)}
  </section>
  {error?<p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-900">{error}</p>:null}
  {notice?<p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">{notice}</p>:null}
  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
   <div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-xl font-black">Find upcoming pet events</h2><p className="text-sm text-slate-600">Live published and discovered listings. Ended events automatically stop qualifying for promotion.</p></div>
    <button type="button" disabled={busy} onClick={()=>void load(activeFilters)} className={secondary}>Refresh events</button>
   </div>
   <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
    <label className="text-xs font-bold">City / county<input className={field} value={filters.city} onChange={e=>setFilters(p=>({...p,city:e.target.value}))} placeholder="e.g., Bucks County"/></label>
    <label className="text-xs font-bold">State<input className={field} value={filters.state} maxLength={2} onChange={e=>setFilters(p=>({...p,state:e.target.value.toUpperCase()}))} placeholder="PA"/></label>
    <label className="text-xs font-bold">Search events<input className={field} value={filters.q} onChange={e=>setFilters(p=>({...p,q:e.target.value}))} placeholder="Title or venue"/></label>
    <button className={primary+" self-end"} type="button" disabled={busy} onClick={()=>{setActiveFilters(filters);void load(filters);}}>Find events</button>
   </div>
   <p className="mt-4 text-xs font-bold text-slate-600">{data.events.length} current matching events</p>
   <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {data.events.map(e=><button key={e.id} type="button" onClick={()=>setSelected(e.id)}
      className={"flex min-w-0 gap-3 rounded-2xl border bg-white p-3 text-left hover:shadow-md "+(selected===e.id?"border-blue-600 ring-2 ring-blue-100":"border-slate-200")}>
     {e.image?<img src={e.image} alt="" className="h-24 w-24 shrink-0 rounded-xl object-cover"/>:<div className="h-24 w-24 shrink-0 rounded-xl bg-emerald-50"/>}
     <div className="min-w-0"><p className="line-clamp-2 font-black">{e.title}</p><p className="mt-1 text-xs text-slate-600">{new Date(e.startAt).toLocaleString()}</p><p className="mt-1 text-xs font-bold text-emerald-700">{[e.city,e.state].filter(Boolean).join(", ")}</p><p className="mt-1 text-xs text-slate-500">{e.source==="discovered"?"Discovered event":"SitGuru partner event"}</p></div>
    </button>)}
   </div>
  </section>
  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
   <h2 className="text-xl font-black">Generate an event promotion</h2>
   {chosen?<p className="mt-2 text-sm font-bold text-emerald-700">Selected: {chosen.title} · {chosen.city}, {chosen.state}</p>:<p className="mt-2 text-sm text-slate-600">Choose an event above.</p>}
   <div className="mt-4 grid gap-3 sm:grid-cols-2">
    <label className="text-xs font-bold">Social platform<select className={field} value={channel} onChange={e=>setChannel(e.target.value as EventShareChannel)}>{channels.map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
    <label className="text-xs font-bold">Target social group (optional)<input className={field} value={group} maxLength={120} onChange={e=>setGroup(e.target.value)} placeholder="Local pet parents"/></label>
   </div>
   <button type="button" className={primary+" mt-4"} disabled={!chosen||busy} onClick={()=>void create()}>Generate tracked event promotion</button>
   <p className="mt-2 text-xs text-slate-500">Intern drafts require manager approval. No external social post is published automatically.</p>
  </section>
  <section className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
   <h2 className="text-xl font-black">Outreach campaigns &amp; engagement</h2>
   <p className="mt-1 text-sm text-slate-600">Historical campaigns remain visible after events expire. Expired event links become unavailable for new visits.</p>
   <div className="mt-4 space-y-3">{data.campaigns.length===0?<p className="text-sm text-slate-600">No campaigns created yet.</p>:data.campaigns.map(c=>
    <article key={c.id} className="rounded-xl border border-slate-200 p-4">
     <div className="flex flex-wrap justify-between gap-2"><div><h3 className="font-black">{c.event_title}</h3><p className="text-xs text-slate-600">{c.channel} · {c.target_group||"General outreach"} · {new Date(c.created_at).toLocaleDateString()}</p></div><span className="text-xs font-black uppercase text-emerald-700">{c.status.replace("_"," ")}</span></div>
     <div className="mt-3 flex flex-wrap gap-3 text-xs font-bold text-slate-600"><span>Opens: {c.metrics.linkOpens}</span><span>QR: {c.metrics.qrOpens}</span><span>Event clicks: {c.metrics.eventClicks}</span><span>Shares: {c.metrics.sharesReported}</span></div>
     {c.status==="approved"&&c.event?<div className="mt-3 flex flex-wrap gap-2">
      <button className={secondary} disabled={busy} onClick={()=>void act(c,"copy")}>Copy caption &amp; link</button>
      <a className={secondary} href={c.shareUrl} target="_blank" rel="noopener noreferrer">Open tracked link</a>
      <a className={secondary} href={c.cardUrl} download={"sitguru-event-"+c.code+".png"}>Download graphic</a>
      <a className={secondary} href={c.qrUrl} download={"sitguru-event-qr-"+c.code+".png"}>Download QR</a>
      <button className={secondary} disabled={busy} onClick={()=>void act(c,"shared")}>I shared this</button>
     </div>:null}
     {c.status==="pending_review"&&role!=="intern"?<div className="mt-3 flex gap-2">
      <button className={primary} disabled={busy} onClick={()=>void act(c,"approve")}>Approve</button>
      <button className={secondary} disabled={busy} onClick={()=>void act(c,"reject")}>Reject</button>
     </div>:null}
    </article>)}</div>
  </section>
 </main>;
}
