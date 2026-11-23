"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,BarChart3,CheckCircle2,ClipboardCopy,Download,
  HeartHandshake,MapPin,PawPrint,QrCode,Search,ShieldCheck,Users,RefreshCw} from "lucide-react";
import {GURU_MATCH_SERVICES,type GuruMatch,type MatchFilters} from "@/lib/guru-match/matching";
import type {CampaignView,CampaignMetrics,GuruMatchDashboard,ShareChannel} from "@/lib/guru-match/service";

type Role="manager"|"admin"|"intern";
const STATES=["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"];
const SOURCES:[ShareChannel,string][]=[
  ["facebook","Facebook"],["instagram","Instagram"],["tiktok","TikTok"],
  ["x","X"],["other","Other"],
];
const blank:CampaignMetrics={linkOpens:0,qrOpens:0,profileClicks:0,inquiryClicks:0,copyIntents:0,sharesReported:0};
const control="min-h-11 w-full rounded-xl border border-[#DCE5EE] bg-[#F8FAFC] px-3 text-sm font-bold text-[#0F2744] outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30";
const secondary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 text-sm font-black text-[#0F2744] hover:bg-[#DBEAFE]";
const primary="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8] disabled:opacity-55";
function metric(value:number){return value.toLocaleString("en-US");}
async function api<T>(method:"GET"|"POST"|"PATCH",path:string,body?:unknown):Promise<T>{
  const response=await fetch(path,{method,credentials:"same-origin",cache:"no-store",
    headers:body?{"Content-Type":"application/json"}:undefined,
    body:body?JSON.stringify(body):undefined});
  const result=await response.json() as {error?:string};
  if(!response.ok)throw new Error(result.error||"SitGuru outreach could not load.");
  return result as T;
}
function Kpi({label,count,subtitle,tone,icon:Icon}:{
  label:string;count:number;subtitle:string;tone:string;icon:typeof Users;
}){
  return <div className={`rounded-2xl border p-4 shadow-sm ${tone}`}>
    <div className="flex items-center justify-between gap-2">
      <p className="text-xs font-black uppercase tracking-wide text-[#0F2744]">{label}</p>
      <Icon size={19} aria-hidden="true"/>
    </div>
    <p className="mt-3 text-3xl font-black tabular-nums text-[#0F2744]">{metric(count)}</p>
    <p className="mt-1 text-xs font-semibold text-slate-600">{subtitle}</p>
  </div>;
}
export default function GuruMatchBoard({role}:{role:Role}){
  const [filters,setFilters]=useState<MatchFilters>({
    city:"Quakertown",state:"PA",service:"dog_walking",pet:"dog",radius:10,
  });
  const [channel,setChannel]=useState<ShareChannel>("facebook");
  const [payload,setPayload]=useState<GuruMatchDashboard|null>(null);
  const [busy,setBusy]=useState(false);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [selectedId,setSelectedId]=useState<string>("");
  const [currentCode,setCurrentCode]=useState("");
  const [searched,setSearched]=useState(false);
  const [directoryQuery,setDirectoryQuery]=useState("");
  const [directoryStatus,setDirectoryStatus]=useState<"all"|"ready"|"setup">("all");
  const load=useCallback(async(search:boolean)=>{
    setLoading(true);setError("");
    try{
      const qs=new URLSearchParams();
      if(search){
        qs.set("city",filters.city);qs.set("state",filters.state);
        qs.set("service",filters.service);qs.set("pet",filters.pet);
        qs.set("radius",String(filters.radius));
      }
      const result=await api<GuruMatchDashboard>("GET","/api/guru-match?"+qs.toString());
      setPayload(result);
      setSearched(search);
      setSelectedId(prev=>result.matches.some(g=>g.id===prev)?prev:"");
    }catch(e){setError(e instanceof Error?e.message:"The outreach dashboard could not load.");}
    finally{setLoading(false);}
  },[filters]);
  useEffect(()=>{void (async()=>{
    try{const result=await api<GuruMatchDashboard>("GET","/api/guru-match");
      setPayload(result);
    }catch(e){setError(e instanceof Error?e.message:"Outreach data unavailable.");}
    finally{setLoading(false);}
  })();},[]);
  const updateFilter=(name:keyof MatchFilters,value:string|number)=>{
    setFilters(old=>({...old,[name]:value}));
    setSelectedId("");setSearched(false);
  };
  const selected=payload?.matches.find(g=>g.id===selectedId);
  const cards=payload?.campaigns||[];
  const directory=payload?.directory||[];
  const directoryItems=directory.filter(g=>{
    const q=directoryQuery.toLowerCase().trim();
    return (directoryStatus==="all"||(directoryStatus==="ready"?g.canPromote:!g.canPromote)) &&
      (!q||`${g.name} ${g.city} ${g.state} ${g.serviceKeys.join(" ")}`.toLowerCase().includes(q));
  });
  const active=cards.find(c=>c.code===currentCode)||cards[0];
  const postTotals=payload?.totals||blank;
  const canApprove=role!=="intern";
  const generate=async()=>{
    if(!selected)return;
    setBusy(true);setError("");setNotice("");
    try{
      const response=await api<{share:{code:string;status:string}}>("POST","/api/guru-match",{
        action:"create",guruId:selected.id,city:filters.city,state:filters.state,
        service:filters.service,pet:filters.pet,radius:filters.radius,channel,
      });
      setCurrentCode(response.share.code);
      setNotice(response.share.status==="approved"
        ?"An approved, trackable Guru card is ready to share."
        :"Draft sent for Manager review. Sharing is locked until approval.");
      await load(true);
    }catch(e){setError(e instanceof Error?e.message:"Could not create your Guru card.");}
    finally{setBusy(false);}
  };
  const act=async(c:CampaignView,action:"approve"|"reject"|"copy"|"shared")=>{
    setBusy(true);setError("");setNotice("");
    try{
      if(action==="copy"){
        await navigator.clipboard.writeText(c.reply_text);
        await api("POST","/api/guru-match",{action:"copy",id:c.id});
        setNotice("Approved reply copied. Post only in groups that permit relevant recommendations.");
      }else{
        await api(action==="approve"||action==="reject"?"PATCH":"POST",
          "/api/guru-match",{action,id:c.id});
        setNotice(action==="approve"?"Promotion approved."
          :action==="reject"?"Promotion rejected.":"Share manually reported; external publishing is not assumed.");
      }
      await load(searched);
    }catch(e){setError(e instanceof Error?e.message:"Could not complete this action.");}
    finally{setBusy(false);}
  };
  const currentStatus=active?.status;
  return <main className="mx-auto w-full max-w-7xl min-w-0 space-y-5 px-3 py-5 text-[#0F2744] sm:px-5 lg:px-7">
    <header className="on-dark-surface overflow-hidden rounded-[1.6rem] p-5 shadow-[0_12px_30px_rgba(15,39,68,.14)] sm:p-7"
      style={{background:"linear-gradient(112deg,#0F2744 0%,#164B61 48%,#0D5C3A 100%)",color:"#fff"}}>
      <p className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] !text-emerald-100">
        <PawPrint size={17}/> SitGuru · Community Studio
      </p>
      <h1 className="mt-3 text-3xl font-black tracking-tight !text-white sm:text-4xl">Guru Match &amp; Share</h1>
      <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 !text-emerald-50">
        Promote eligible local Gurus with branded QR cards and track every recorded link opening, scan and profile click.
      </p>
      <nav className="mt-5 flex flex-wrap gap-2 text-xs font-black" aria-label="Community Studio workspaces">
        <Link href={role==="admin"?"/admin/sales-marketing/content":`/${role}/community-studio`}
          className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 !text-white">Community Studio</Link>
        <Link href={role==="admin"?"/admin/growth/social-intelligence":role==="manager"?"/manager/metrics?view=social-intelligence":"/intern/social-intelligence"}
          className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 !text-white">Social Intelligence</Link>
        {role!=="intern"&&<Link href={role==="admin"?"/admin/growth/content":"/manager/campaigns-content"}
          className="rounded-xl border border-white/25 bg-white/15 px-3 py-2 !text-white">Content approvals</Link>}
      </nav>
    </header>
    <section aria-label="Outreach activity in past 90 days" className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
      <Kpi label="Link opens" count={postTotals.linkOpens} subtitle="Page visits, not unique people" tone="border-[#E0E7FF] bg-[#F0F4FF]" icon={Users}/>
      <Kpi label="QR scans" count={postTotals.qrOpens} subtitle="QR landing opens" tone="border-[#DDD6FE] bg-[#F5F3FF]" icon={QrCode}/>
      <Kpi label="Profile clicks" count={postTotals.profileClicks} subtitle="Click-through to a Guru" tone="border-[#BAE6FD] bg-[#F0F9FF]" icon={BarChart3}/>
      <Kpi label="Inquiries started" count={postTotals.inquiryClicks} subtitle="Booking-intent link clicks" tone="border-[#FDE68A] bg-[#FFFBEB]" icon={HeartHandshake}/>
      <Kpi label="Share reports" count={postTotals.sharesReported} subtitle="Staff-confirmed manual share" tone="border-[#BBF7D0] bg-[#F0FDF4]" icon={CheckCircle2}/>
      <Kpi label="Copy intents" count={postTotals.copyIntents} subtitle="Approved reply copies" tone="border-[#FED7AA] bg-[#FFF7ED]" icon={ClipboardCopy}/>
    </section>
    {error&&<div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">{error}</div>}
    {notice&&<div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-800">{notice}</div>}
    <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-label="Local Guru search">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black text-[#0F2744]">Find eligible Gurus</h2>
        <button type="button" onClick={()=>void load(searched)} className={secondary} disabled={loading}>
          <RefreshCw size={16}/> Refresh
        </button>
      </div>
      <p className="mt-1 text-xs font-semibold text-slate-600">City and state plus the Guru&apos;s actual service coverage and offered service are required. Unsupported locations will not produce unverified matches.</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <label className="text-xs font-black text-[#0F2744]">City
          <input className={control+" mt-1"} value={filters.city}
            maxLength={80} onChange={e=>updateFilter("city",e.target.value)}/>
        </label>
        <label className="text-xs font-black text-[#0F2744]">State
          <select className={control+" mt-1"} value={filters.state}
            onChange={e=>updateFilter("state",e.target.value)}>
            {STATES.map(state=><option key={state} value={state}>{state}</option>)}
          </select>
        </label>
        <label className="text-xs font-black text-[#0F2744]">Service needed
          <select className={control+" mt-1"} value={filters.service}
            onChange={e=>updateFilter("service",e.target.value as MatchFilters["service"])}>
            {GURU_MATCH_SERVICES.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </label>
        <label className="text-xs font-black text-[#0F2744]">Pet type
          <select className={control+" mt-1"} value={filters.pet}
            onChange={e=>updateFilter("pet",e.target.value as MatchFilters["pet"])}>
            <option value="any">Any / verify with Guru</option>
            <option value="dog">Dogs (verified dog service)</option>
            <option value="cat">Cats (verified cat care)</option>
          </select>
        </label>
        <label className="text-xs font-black text-[#0F2744]">Maximum distance
          <select className={control+" mt-1"} value={filters.radius}
            onChange={e=>updateFilter("radius",Number(e.target.value))}>
            {[5,10,15,25,50].map(n=><option key={n} value={n}>{n} miles</option>)}
          </select>
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <label className="min-w-44 flex-1 text-xs font-black">Social channel
          <select className={control+" mt-1"} value={channel}
            onChange={e=>setChannel(e.target.value as ShareChannel)}>
            {SOURCES.map(([id,label])=><option value={id} key={id}>{label}</option>)}
          </select>
        </label>
        <button type="button" className={primary} onClick={()=>void load(true)} disabled={loading||!filters.city.trim()}>
          <Search size={16}/> {loading?"Searching...":"Find local matches"}
        </button>
      </div>
      {searched&&payload&&<p className="mt-4 text-sm font-semibold text-slate-600">
        {payload.matches.length} eligible match{payload.matches.length===1?"":"es"}. {payload.matchesNotice}
      </p>}
      {searched&&payload?.matches.length===0&&<div className="mt-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        No verified matches for these conditions. Offer a general SitGuru search link instead; do not advertise an unmatched Guru.
      </div>}
      {searched&&!!payload?.matches.length&&<div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {payload.matches.map((g:GuruMatch)=><button key={g.id} type="button" onClick={()=>setSelectedId(g.id)}
          className={`flex min-w-0 items-start gap-3 rounded-2xl border p-3 text-left transition hover:bg-[#EFF6FF] ${selectedId===g.id?"border-[#2563EB] bg-[#EFF6FF]":"border-slate-200 bg-white"}`}>
          {g.photoUrl?<img src={g.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover"/>
            :<span className="flex h-16 w-16 items-center justify-center rounded-xl bg-emerald-50 text-[#0D5C3A]"><PawPrint size={28}/></span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-black text-[#0F2744]">{g.name}</span>
            <span className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-500"><MapPin size={12}/>{g.city}, {g.state}</span>
            <span className="mt-1 block text-xs font-bold text-[#0D5C3A]">{g.serviceLabel}</span>
            <span className="mt-1 block text-xs text-slate-500">{g.distanceMiles!==null?`${g.distanceMiles} mi · `:""}{g.reason}</span>
            {g.experienceYears!==null&&<span className="mt-1 block text-xs text-slate-600">{g.experienceYears} years experience</span>}
          </span>
        </button>)}
      </div>}
      {selected&&<div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4">
        <p className="text-sm font-bold text-[#0D5C3A]">Selected: {selected.name} · {selected.city}, {selected.state} · {selected.serviceLabel}</p>
        <button type="button" onClick={()=>void generate()} disabled={busy} className={primary}>
          <PawPrint size={16}/> {busy?"Saving...":"Generate tracked Guru card"}
        </button>
      </div>}
    </section>
    <section aria-label="Registered Guru directory" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-[#0F2744]">Bookable Gurus</h2>
          <p className="mt-1 text-xs font-semibold text-slate-600">Browse every bookable Guru. Local service, radius and pet compatibility determine who can be shared for a request.</p>
        </div>
        <p className="text-sm font-bold text-[#0F2744]">{directory.length} bookable Gurus</p>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input aria-label="Search bookable Gurus" placeholder="Search Guru, city, state or service"
          className={control+" sm:max-w-lg"} value={directoryQuery} onChange={e=>setDirectoryQuery(e.target.value)}/>
        <select aria-label="Filter Guru directory status" className={control+" sm:max-w-60"} value={directoryStatus}
          onChange={e=>setDirectoryStatus(e.target.value as "all"|"ready"|"setup")}>
          <option value="all">All bookable Gurus</option>
          <option value="ready">Ready to match</option>
          <option value="setup">Needs review or setup</option>
        </select>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-600">Showing {directoryItems.length} of {directory.length} bookable Gurus.</p>
      <div className="mt-3 grid max-h-[560px] gap-3 overflow-y-auto sm:grid-cols-2 xl:grid-cols-3">
        {directoryItems.map(g=><article key={g.id} className="flex min-w-0 items-start gap-3 rounded-xl border border-slate-200 p-3">
          {g.photoUrl?<img src={g.photoUrl} alt="" className="h-14 w-14 shrink-0 rounded-xl object-cover"/>:
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-[#0D5C3A]"><PawPrint size={22}/></span>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-black text-[#0F2744]">{g.name}</p>
            <p className="text-xs text-slate-600">{g.city||"Location missing"}{g.state?", "+g.state:""}</p>
            <p className={`mt-1 text-xs font-bold ${g.canPromote?"text-emerald-700":"text-amber-700"}`}>
              {g.canPromote?"Ready for local matching":g.reason}
            </p>
            <p className="mt-1 text-xs text-slate-500">{g.serviceKeys.length?g.serviceKeys.map(k=>GURU_MATCH_SERVICES.find(s=>s.key===k)?.label||k).join(" · "):"No selected services"}</p>
            {g.slug&&g.canPromote&&<a href={`/guru/${g.slug}`} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block text-xs font-bold text-blue-700 underline">View public profile</a>}
          </div>
        </article>)}
      </div>
    </section>
    <section aria-label="Saved outreach cards" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-black">Review, share and measure</h2>
        <span className="text-xs font-semibold text-slate-500">Last 100 cards · activity in last 90 days</span>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          {!cards.length&&<div className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-600">
            No Guru promotions yet. Search for a local Guru and generate the first tracked card.
          </div>}
          {cards.map(c=><article key={c.id} className={`min-w-0 rounded-2xl border bg-white p-4 shadow-sm ${active?.id===c.id?"border-[#2563EB]":"border-slate-200"}`}>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-base font-black text-[#0F2744]">{c.guru.name} · {c.city}, {c.state}</p>
                <p className="mt-1 text-xs font-semibold capitalize text-slate-500">{c.channel} · {c.service_key.replaceAll("_"," ")} · {c.pet_type==="any"?"Pet type to confirm":c.pet_type}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-black ${c.status==="approved"?"bg-[#DCFCE7] text-[#166534]":c.status==="pending_review"?"bg-[#FFF3CD] text-[#92400E]":"bg-[#E2E8F0] text-slate-700"}`}>{c.status.replaceAll("_"," ")}</span>
            </div>
            <div className="mt-3 grid grid-cols-4 gap-2 text-center">
              {([["Opens",c.metrics.linkOpens+c.metrics.qrOpens],["Profiles",c.metrics.profileClicks],["Inquiries",c.metrics.inquiryClicks],["Shares",c.metrics.sharesReported]] as [string,number][]).map(([k,v])=>
                <div key={k} className="min-w-0 rounded-lg bg-[#F8FAFC] p-2"><p className="text-lg font-black tabular-nums">{metric(v)}</p><p className="text-[11px] text-slate-600">{k}</p></div>)}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className={secondary} onClick={()=>setCurrentCode(c.code)}>View card</button>
              {c.status==="pending_review"&&canApprove&&<>
                <button type="button" disabled={busy} className={primary} onClick={()=>void act(c,"approve")}>Approve</button>
                <button type="button" disabled={busy} className={secondary} onClick={()=>void act(c,"reject")}>Reject</button>
              </>}
              {c.status==="approved"&&<>
                <button type="button" className={secondary} disabled={busy}
                  onClick={()=>void act(c,"copy")}><ClipboardCopy size={14}/> Copy reply</button>
                <button type="button" className={secondary} disabled={busy}
                  onClick={()=>void act(c,"shared")}>Mark shared</button>
              </>}
            </div>
          </article>)}
        </div>
        {active&&<aside className="min-w-0 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-[#0F2744] to-[#0D5C3A] p-5">
            <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest !text-emerald-100"><PawPrint size={15}/> Guru share card</p>
            <h3 className="mt-1 text-xl font-black !text-white">{active.guru.name}</h3>
            <p className="mt-2 text-sm font-semibold !text-emerald-50">{active.city}, {active.state} · {active.channel}</p>
          </div>
          <div className="space-y-4 p-4 sm:p-5">
            {currentStatus==="approved"?<>
              <img src={active.cardUrl} alt={`SitGuru promotional card for ${active.guru.name}, including a scannable QR code`}
                className="w-full rounded-xl border border-slate-200" loading="lazy"/>
              <div className="flex flex-wrap gap-2">
                <a href={active.cardUrl} download="sitguru-guru-share.png" className={secondary}><Download size={15}/> Download PNG</a>
                <a href={active.shareUrl} target="_blank" rel="noopener noreferrer" className={secondary}><ArrowUpRight size={15}/> Preview tracked link</a>
              </div>
              <div className="break-all rounded-xl bg-[#EFF6FF] p-3 text-xs font-semibold text-[#1D4ED8]">{active.shareUrl}</div>
              <div className="rounded-xl border border-[#D1EADD] bg-[#F0FDF4] p-4">
                <p className="text-xs font-black uppercase tracking-wide text-[#0D5C3A]">Suggested reply · approved</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#0F2744]">{active.reply_text}</p>
                <button type="button" disabled={busy} className={primary+" mt-3"}
                  onClick={()=>void act(active,"copy")}><ClipboardCopy size={15}/> Copy for a relevant social reply</button>
              </div>
            </>:<div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="flex items-center gap-2 text-sm font-black text-amber-900"><ShieldCheck size={18}/> Awaiting approval</p>
              <p className="mt-2 text-xs text-amber-900">The QR image and public share link stay disabled until a Manager approves this card. Interns cannot self-approve.</p>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-700">{active.reply_text.replace(/https:\/\/www\.sitguru\.com\/s\/g\/\S+/g,"[tracking link available after approval]")}</p>
            </div>}
            <p className="text-xs leading-5 text-slate-500">Counts are recorded actions, not unique visitors. QR opens are recorded when the destination loads. Inquiries are clicks on a booking-intent link, not confirmed requests or paid bookings. Social posting is manual; SitGuru does not publish in groups without permission.</p>
          </div>
        </aside>}
      </div>
    </section>
    <p className="pb-5 text-xs font-medium text-slate-500">SitGuru Community Studio · Manager and Admin analytics read the same live event records. Guru availability must be verified on the Guru profile.</p>
  </main>;
}
