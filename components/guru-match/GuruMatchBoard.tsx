"use client";
import {useCallback,useEffect,useState} from "react";
import Link from "next/link";
import {ArrowUpRight,BarChart3,CheckCircle2,ClipboardCopy,Download,
  HeartHandshake,MapPin,PawPrint,QrCode,Search,ShieldCheck,Users,RefreshCw,ChevronDown,ChevronUp,Share2} from "lucide-react";
import {GURU_MATCH_SERVICES,type GuruMatch,type GuruDirectoryEntry,type MatchFilters} from "@/lib/guru-match/matching";
import type {CampaignView,CampaignMetrics,GuruMatchDashboard,ShareChannel,GuruSocialGroup} from "@/lib/guru-match/service";

type Role="manager"|"admin"|"intern";
type PreparedShare={id:string;code:string;status:string;replyText:string;shareUrl:string;cardUrl:string;qrUrl:string};
type PreparedMiniCard={guruId:string;service:string;channel:ShareChannel;share:PreparedShare};
const MINI_PAGE_SIZE=12;
const HISTORY_PAGE_SIZE=8;
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
function GuruAvatar({name,photoUrl,size="lg"}:{name:string;photoUrl:string|null;size?:"lg"|"sm"}){
  const [failed,setFailed]=useState(false);
  useEffect(()=>setFailed(false),[photoUrl]);
  const dimension=size==="lg"?"h-16 w-16":"h-14 w-14";
  const initials=name.split(/\s+/).filter(Boolean).slice(0,2).map(part=>part[0].toUpperCase()).join("")||"SG";
  return <span className={`flex ${dimension} shrink-0 items-center justify-center overflow-hidden rounded-xl bg-emerald-50 text-sm font-black text-[#0D5C3A]`}
    aria-label={photoUrl&&!failed?`${name} profile photo`:`${name} initials avatar`}>
    {photoUrl&&!failed?<img src={photoUrl} alt="" onError={()=>setFailed(true)}
      className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer"/>:
      <span aria-hidden="true">{initials}</span>}
  </span>;
}
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
  const [directoryState,setDirectoryState]=useState("all");
  const [directorySort,setDirectorySort]=useState<"state-asc"|"state-desc"|"name">("state-asc");
  const [quickChannel,setQuickChannel]=useState<ShareChannel>("facebook");
  const [selectedGroupId,setSelectedGroupId]=useState("");
  const [addGroupOpen,setAddGroupOpen]=useState(false);
  const [groupForm,setGroupForm]=useState({name:"",city:"",state:"PA",channel:"facebook" as ShareChannel,groupUrl:""});
  const [directoryPage,setDirectoryPage]=useState(0);
  const [historyPage,setHistoryPage]=useState(0);
  const [expandedGuru,setExpandedGuru]=useState<string>("");
  const [preparedMini,setPreparedMini]=useState<PreparedMiniCard|null>(null);
  const [miniChannel,setMiniChannel]=useState<ShareChannel>("facebook");
  const [miniService,setMiniService]=useState<string>("");
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
  const readyToShare=directory.filter(g=>g.canPromote).length;
  const groups=payload?.groups||[];
  const selectedGroup=groups.find(g=>g.id===selectedGroupId);
  const availableStates=[...new Set([...directory.map(g=>g.state),...groups.map(g=>g.state)].filter(Boolean))].sort();
  const availableGroups=groups.filter(g=>directoryState==="all"||g.state===directoryState);
  const directoryItems=directory.filter(g=>{
    const q=directoryQuery.toLowerCase().trim();
    return (directoryStatus==="all"||(directoryStatus==="ready"?g.canPromote:!g.canPromote)) &&
      (directoryState==="all"||g.state===directoryState) &&
      (!q||`${g.name} ${g.city} ${g.state} ${g.serviceKeys.join(" ")}`.toLowerCase().includes(q));
  }).sort((a,b)=>directorySort==="name"?a.name.localeCompare(b.name):
    directorySort==="state-desc"?(b.state.localeCompare(a.state)||a.name.localeCompare(b.name)):
    (a.state.localeCompare(b.state)||a.name.localeCompare(b.name)));
  const active=cards.find(c=>c.code===currentCode);
  const pageCount=Math.max(1,Math.ceil(directoryItems.length/MINI_PAGE_SIZE));
  const shownDirectory=directoryItems.slice(directoryPage*MINI_PAGE_SIZE,(directoryPage+1)*MINI_PAGE_SIZE);
  const historyCount=Math.max(1,Math.ceil(cards.length/HISTORY_PAGE_SIZE));
  const shownHistory=cards.slice(historyPage*HISTORY_PAGE_SIZE,(historyPage+1)*HISTORY_PAGE_SIZE);
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
  // Card templates become available from approved Guru records without manual creation.
  // Materialize a tracked campaign only when staff opens a card, and reuse it thereafter.
  const prepareMini=async(g:GuruDirectoryEntry,nextChannel:ShareChannel,nextService:string)=>{
    if(!g.canPromote || !nextService)return;
    setBusy(true);setError("");setPreparedMini(null);
    try{
      const result=await api<{share:PreparedShare}>("POST","/api/guru-match",{
        action:"prepare",guruId:g.id,channel:nextChannel,service:nextService,
      });
      if(result.share.status!=="approved")throw new Error("This Guru card is awaiting approval.");
      setPreparedMini({guruId:g.id,service:nextService,channel:nextChannel,share:result.share});
    }catch(e){setError(e instanceof Error?e.message:"Unable to prepare the Guru card.");}
    finally{setBusy(false);}
  };
  const toggleGuru=(g:GuruDirectoryEntry)=>{
    if(expandedGuru===g.id){setExpandedGuru("");setPreparedMini(null);return;}
    setExpandedGuru(g.id);setMiniChannel("facebook");
    const service=g.serviceKeys[0]||"";
    setMiniService(service);setPreparedMini(null);
    if(g.canPromote && service)void prepareMini(g,"facebook",service);
  };
  const copyMini=async()=>{
    if(!preparedMini)return;
    try{
      await navigator.clipboard.writeText(preparedMini.share.replyText);
      await api("POST","/api/guru-match",{action:"copy",id:preparedMini.share.id});
      setNotice("Tracked reply copied. Publish only where relevant social replies are allowed.");
    }catch(e){setError(e instanceof Error?e.message:"Could not copy share reply.");}
  };
  const markMiniShared=async()=>{
    if(!preparedMini)return;
    try{
      await api("POST","/api/guru-match",{action:"shared",id:preparedMini.share.id});
      setNotice("Manual social share recorded for this Guru and channel.");
      await load(searched);
    }catch(e){setError(e instanceof Error?e.message:"Unable to log the share.");}
  };
  const nativeMiniShare=async()=>{
    if(!preparedMini)return;
    const share=preparedMini.share;
    try{
      if(navigator.share)await navigator.share({title:"Meet a SitGuru Guru",text:share.replyText,url:share.shareUrl});
      else await copyMini();
    }catch{/* Sharing can be canceled by staff. */}
  };
  const changeMiniChannel=(g:GuruDirectoryEntry,nextChannel:ShareChannel)=>{
    setMiniChannel(nextChannel);void prepareMini(g,nextChannel,miniService);
  };
  const changeMiniService=(g:GuruDirectoryEntry,nextService:string)=>{
    setMiniService(nextService);void prepareMini(g,miniChannel,nextService);
  };

  /** Direct-action share: the initial tap opens a social composer once the tracked
   * link is ready. For platforms without web composers, it reveals the PNG and reply. */
  const quickShare=async(g:GuruDirectoryEntry)=>{
    if(!g.canPromote||busy)return;
    const group=selectedGroup;
    const service=g.serviceKeys[0];
    if(!service){setError("This Guru needs an enabled service to share.");return;}
    const nextChannel=group?.channel||quickChannel;
    const socialComposer=Boolean(group)||nextChannel==="facebook"||nextChannel==="x";
    const popup=socialComposer?window.open("about:blank","_blank"):null;
    if(popup)popup.opener=null;
    setExpandedGuru(g.id);
    setMiniChannel(nextChannel);
    setMiniService(service);
    setPreparedMini(null);
    setBusy(true);setError("");setNotice("");
    try{
      const result=await api<{share:PreparedShare}>("POST","/api/guru-match",{
        action:"prepare",guruId:g.id,channel:nextChannel,service,groupId:group?.id,
      });
      const share=result.share;
      if(share.status!=="approved")throw new Error("This Guru needs approval before sharing.");
      setPreparedMini({guruId:g.id,service,channel:nextChannel,share});
      if(group){
        let copied=false;
        try{
          await navigator.clipboard.writeText(share.replyText);
          await api("POST","/api/guru-match",{action:"copy",id:share.id});
          copied=true;
        }catch{/* Some browsers revoke clipboard permission after async preparation. */}
        if(popup)popup.location.href=group.group_url;
        setNotice(copied
          ?"Opened "+group.name+". The local message is copied; paste it and attach the card image if the group permits posts."
          :"Opened "+group.name+". Use Copy reply in the expanded card, then paste it into the group's post composer.");
      } else if(nextChannel==="facebook"||nextChannel==="x"){
        const target=nextChannel==="facebook"
          ?"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(share.shareUrl)
          :"https://twitter.com/intent/tweet?text="+encodeURIComponent(share.replyText);
        if(popup)popup.location.href=target;
        else setNotice("Your tracked card is ready. Tap the social button on the expanded row to open the composer.");
      } else if(nextChannel==="other"&&navigator.share){
        try{await navigator.share({title:"Meet a SitGuru Guru",text:share.replyText,url:share.shareUrl});}
        catch{setNotice("Your tracked link and image are ready in the expanded card.");}
      } else {
        setNotice("Your tracked card is ready. Download the image to post in the selected social app.");
      }
    }catch(e){
      if(popup&&!popup.closed)popup.close();
      setError(e instanceof Error?e.message:"Unable to prepare a tracked Guru card.");
    }finally{setBusy(false);}
  };

  const saveLocalGroup=async()=>{
    if(!groupForm.name.trim()||!groupForm.city.trim()||!groupForm.groupUrl.trim()){
      setError("Group name, city, state and link are required.");return;
    }
    setBusy(true);setError("");
    try{
      const result=await api<{id:string}>("POST","/api/guru-match",{
        action:"add_group",...groupForm,
      });
      setAddGroupOpen(false);
      setSelectedGroupId(result.id);
      setDirectoryState(groupForm.state.toUpperCase());
      setQuickChannel(groupForm.channel);
      setDirectoryPage(0);
      setGroupForm({name:"",city:"",state:"PA",channel:"facebook",groupUrl:""});
      setNotice("Local social group saved for Manager and Intern sharing.");
      await load(searched);
    }catch(e){setError(e instanceof Error?e.message:"Could not save the local group.");}
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
          <GuruAvatar name={g.name} photoUrl={g.photoUrl}/>
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
          <h2 className="text-xl font-black text-[#0F2744]">Find &amp; share a Guru</h2>
          <p className="mt-1 text-xs font-semibold text-slate-600">Search or sort by state, then use the Share button beside an eligible Guru. Expand a card only if you want the QR or image.</p>
        </div>
        <p className="text-sm font-bold text-[#0F2744]">{directory.length} listed · {readyToShare} ready to share</p>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <input aria-label="Search Gurus" placeholder="Search name, city, or service"
          className={control} value={directoryQuery} onChange={e=>{setDirectoryQuery(e.target.value);setDirectoryPage(0);}}/>
        <select aria-label="Filter Gurus by state" className={control} value={directoryState}
          onChange={e=>{setDirectoryState(e.target.value);setDirectoryPage(0);setExpandedGuru("");}}>
          <option value="all">All states</option>
          {availableStates.map(state=><option key={state} value={state}>{state}</option>)}
        </select>
        <select aria-label="Sort Gurus" className={control} value={directorySort}
          onChange={e=>{setDirectorySort(e.target.value as "state-asc"|"state-desc"|"name");setDirectoryPage(0);}}>
          <option value="state-asc">State A–Z</option>
          <option value="state-desc">State Z–A</option>
          <option value="name">Name A–Z</option>
        </select>
        <select aria-label="Filter Guru readiness" className={control} value={directoryStatus}
          onChange={e=>{setDirectoryStatus(e.target.value as "all"|"ready"|"setup");setDirectoryPage(0);}}>
          <option value="all">All listed</option>
          <option value="ready">Ready to share</option>
          <option value="setup">Needs setup</option>
        </select>
      </div>
      <div className="mt-3 rounded-xl border border-blue-100 bg-[#F4F8FF] p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-black text-[#0F2744]">
            Share directly to a local social group
            <select value={selectedGroupId} aria-label="Choose a local social group" className={control}
              onChange={e=>{
                const group=groups.find(v=>v.id===e.target.value);
                setSelectedGroupId(e.target.value);setExpandedGuru("");setPreparedMini(null);
                if(group){setDirectoryState(group.state);setDirectoryPage(0);setQuickChannel(group.channel);}
              }}>
              <option value="">No group selected — share by channel</option>
              {availableGroups.map(group=>
                <option key={group.id} value={group.id}>
                  {group.city}, {group.state} · {group.name} ({group.channel})
                </option>)}
            </select>
          </label>
          {selectedGroup&&<a href={selectedGroup.group_url} target="_blank" rel="noopener noreferrer"
            className={secondary}>Open group</a>}
          {canApprove&&<button type="button" onClick={()=>setAddGroupOpen(open=>!open)}
            className={secondary}>{addGroupOpen?"Cancel":"Add a group"}</button>}
        </div>
        {selectedGroup?<p className="mt-2 text-xs font-semibold text-[#0F2744]">
          Sharing to <strong>{selectedGroup.name}</strong> in {selectedGroup.city}, {selectedGroup.state}.
          Tap Share on an eligible Guru to open the group and prepare its tracked reply.
        </p>:<p className="mt-2 text-xs text-slate-600">
          Select a saved city/state group to share directly. Only Manager-approved group links are listed.
          {!groups.length&&" No groups have been saved yet; a Manager or Admin can add the first one."}
        </p>}
        {addGroupOpen&&canApprove&&<div className="mt-3 grid gap-2 rounded-lg border border-blue-100 bg-white p-3 sm:grid-cols-2">
          <label className="text-xs font-bold">Group name
            <input className={control+" mt-1"} value={groupForm.name} maxLength={110}
              placeholder="e.g., Quakertown Local Pet Owners"
              onChange={e=>setGroupForm(old=>({...old,name:e.target.value}))}/>
          </label>
          <label className="text-xs font-bold">City
            <input className={control+" mt-1"} value={groupForm.city} maxLength={90}
              placeholder="City" onChange={e=>setGroupForm(old=>({...old,city:e.target.value}))}/>
          </label>
          <label className="text-xs font-bold">State
            <select className={control+" mt-1"} value={groupForm.state}
              onChange={e=>setGroupForm(old=>({...old,state:e.target.value}))}>
              {STATES.map(state=><option key={state} value={state}>{state}</option>)}
            </select>
          </label>
          <label className="text-xs font-bold">Platform
            <select className={control+" mt-1"} value={groupForm.channel}
              onChange={e=>setGroupForm(old=>({...old,channel:e.target.value as ShareChannel}))}>
              <option value="facebook">Facebook group</option>
              <option value="x">X Community</option>
              <option value="other">Other social community</option>
            </select>
          </label>
          <label className="text-xs font-bold sm:col-span-2">Direct group URL
            <input className={control+" mt-1"} type="url" value={groupForm.groupUrl}
              placeholder="https://www.facebook.com/groups/..."
              onChange={e=>setGroupForm(old=>({...old,groupUrl:e.target.value}))}/>
          </label>
          <div className="sm:col-span-2">
            <button type="button" className={primary} disabled={busy} onClick={()=>void saveLocalGroup()}>
              Save this group for staff
            </button>
          </div>
        </div>}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-black text-[#0F2744]">Share via</span>
        <select aria-label="Default social sharing channel" value={quickChannel}
          className={control+" !w-auto min-w-36"} onChange={e=>setQuickChannel(e.target.value as ShareChannel)}>
          {SOURCES.map(([key,label])=><option key={key} value={key}>{label}</option>)}
        </select>
        <span className="text-xs font-semibold text-slate-600">Choose a channel once, then Share. Saved groups automatically use their platform.</span>
      </div>
      <p className="mt-2 text-xs font-semibold text-slate-600">Showing {directoryItems.length} of {directory.length} publicly listed Gurus. {readyToShare} currently ready to promote.</p>
      <div className="mt-3 space-y-2" data-mini-guru-card-library>
        {shownDirectory.map(g=>{
          const expanded=expandedGuru===g.id;
          const ready=preparedMini?.guruId===g.id && preparedMini?.service===miniService &&
            preparedMini?.channel===miniChannel ? preparedMini.share : null;
          return <article key={g.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex w-full items-center gap-1 pr-2 sm:pr-4">
              <button type="button" aria-expanded={expanded} aria-controls={"guru-card-"+g.id}
              onClick={()=>toggleGuru(g)}
              className="flex min-h-16 flex-1 min-w-0 items-center gap-3 px-3 py-2 text-left hover:bg-[#F8FAFC] sm:px-4">
              <GuruAvatar name={g.name} photoUrl={g.photoUrl} size="sm"/>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-black text-[#0F2744]">{g.name}</span>
                <span className="block truncate text-xs font-semibold text-slate-500">
                  {g.city||"Location missing"}{g.state?", "+g.state:""} · {g.serviceKeys.length?g.serviceKeys.map(k=>GURU_MATCH_SERVICES.find(v=>v.key===k)?.label||k).slice(0,3).join(" · "):"Services not configured"}
                </span>
                <span className={g.canPromote?"mt-1 block text-xs font-bold text-emerald-700":"mt-1 block text-xs font-bold text-amber-700"}>
                  {g.canPromote?"Approved Guru · Card ready":g.reason}
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-[#EFF6FF] p-2 text-blue-700" aria-hidden>
                {expanded?<ChevronUp size={19}/>:<ChevronDown size={19}/>}
              </span>
              </button>
              {g.canPromote&&g.serviceKeys.length>0&&
                <button type="button" className={primary+" !min-h-10 shrink-0 !px-3 sm:!px-4"}
                  disabled={busy} onClick={()=>void quickShare(g)}>
                  <Share2 size={15}/> {selectedGroup?"Open group & copy":"Share"}
                </button>}
            </div>
            {expanded&&<div id={"guru-card-"+g.id} className="space-y-3 border-t border-slate-100 bg-[#FAFCFF] p-3 sm:p-4">
              {g.canPromote && g.serviceKeys.length>0 ? <>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="min-w-36 flex-1 text-xs font-black text-[#0F2744]">Guru service
                    <select className={control+" mt-1"} value={miniService}
                      onChange={e=>changeMiniService(g,e.target.value)}>
                      {g.serviceKeys.map(key=><option key={key} value={key}>{GURU_MATCH_SERVICES.find(v=>v.key===key)?.label||key}</option>)}
                    </select>
                  </label>
                  <label className="min-w-36 flex-1 text-xs font-black text-[#0F2744]">Social channel
                    <select className={control+" mt-1"} value={miniChannel}
                      onChange={e=>changeMiniChannel(g,e.target.value as ShareChannel)}>
                      {SOURCES.map(([id,label])=><option key={id} value={id}>{label}</option>)}
                    </select>
                  </label>
                </div>
                {busy&&!ready&&<p role="status" className="text-sm font-semibold text-blue-700">Preparing this Guru's approved, trackable share card…</p>}
                {ready&&<div className="grid items-start gap-4 lg:grid-cols-2">
                  <div className="min-w-0 space-y-2">
                    <img src={ready.cardUrl} alt={"Branded SitGuru card for "+g.name+" with profile details and QR code"}
                      className="block w-full max-w-[560px] rounded-xl border border-slate-200" loading="lazy"/>
                    <div className="flex flex-wrap gap-2">
                      <a className={secondary} href={ready.cardUrl} download={"sitguru-"+g.slug+"-card.png"}>
                        <Download size={16}/> Download image
                      </a>
                      <a className={secondary} href={ready.shareUrl} target="_blank" rel="noopener noreferrer">
                        <ArrowUpRight size={16}/> Test tracked link
                      </a>
                    </div>
                  </div>
                  <div className="min-w-0 space-y-3">
                    <p className="text-xs font-black uppercase tracking-wide text-[#0D5C3A]">Share this approved Guru card</p>
                    <div className="flex flex-wrap gap-2">
                      <a className={secondary}
                        href={"https://www.facebook.com/sharer/sharer.php?u="+encodeURIComponent(ready.shareUrl)}
                        target="_blank" rel="noopener noreferrer">Facebook</a>
                      <a className={secondary}
                        href={"https://twitter.com/intent/tweet?text="+encodeURIComponent(ready.replyText)}
                        target="_blank" rel="noopener noreferrer">X</a>
                      <button type="button" className={secondary} onClick={()=>void nativeMiniShare()}><Share2 size={16}/> Share</button>
                      <button type="button" className={secondary} onClick={()=>void copyMini()}><ClipboardCopy size={16}/> Copy reply</button>
                    </div>
                    <p className="text-xs leading-5 text-slate-500">
                      For Instagram and TikTok, download the PNG and use their native posting tools.
                      Copy the tracked link into the caption or permitted reply. Posting is not automatic.
                    </p>
                    <div className="break-all rounded-lg bg-[#EFF6FF] p-3 text-xs font-semibold text-[#1D4ED8]">{ready.shareUrl}</div>
                    <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3 text-sm text-[#0F2744]">
                      {ready.replyText}
                    </div>
                    <button type="button" className={primary} onClick={()=>void markMiniShared()} disabled={busy}>
                      Mark social post as shared
                    </button>
                  </div>
                </div>}
                {!ready&&!busy&&<p className="text-xs text-slate-600">
                  The approved Guru card becomes available automatically when opened. Use Refresh if it does not load.
                  <button type="button" className="ml-2 font-black text-blue-700 underline"
                    onClick={()=>void prepareMini(g,miniChannel,miniService)}>Retry</button>
                </p>}
              </> : <p className="text-sm font-semibold text-amber-800">
                {g.canPromote?"This Guru must enable a service before a card can be shared.":g.reason}
              </p>}
              {!!g.slug&&<Link href={"/guru/"+g.slug} target="_blank"
                className="inline-flex text-xs font-black text-blue-700 underline">View Guru profile</Link>}
            </div>}
          </article>;
        })}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold text-slate-600">
        <span>Page {Math.min(directoryPage+1,pageCount)} of {pageCount} · {directoryItems.length} profiles</span>
        <div className="flex gap-2">
          <button type="button" className={secondary} disabled={directoryPage===0}
            onClick={()=>{setDirectoryPage(n=>Math.max(0,n-1));setExpandedGuru("");}}>Previous</button>
          <button type="button" className={secondary} disabled={directoryPage+1>=pageCount}
            onClick={()=>{setDirectoryPage(n=>n+1);setExpandedGuru("");}}>Next</button>
        </div>
      </div>
    </section>
    <details className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
      aria-label="Previous Guru outreach and approval history">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-base font-black text-[#0F2744]">
        <span>Past outreach &amp; approvals <span className="text-xs font-semibold text-slate-500">({cards.length} recent)</span></span>
        <ChevronDown size={20} className="text-slate-500"/>
      </summary>
      <p className="mt-2 text-xs text-slate-500">Historical campaigns are kept for reporting, not displayed as full-size cards. Show at most {HISTORY_PAGE_SIZE} at once.</p>
      <div className="mt-3 space-y-2">
        {!cards.length&&<p className="p-3 text-sm text-slate-600">No previous promotions yet.</p>}
        {shownHistory.map(c=><article key={c.id} className="min-w-0 overflow-hidden rounded-xl border border-slate-200">
          <div className="flex flex-wrap items-center gap-2 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black text-[#0F2744]">{c.guru.name} · {c.city}, {c.state}</p>
              <p className="text-xs text-slate-500">{c.channel} · {c.service_key.replaceAll("_"," ")} · {c.metrics.linkOpens+c.metrics.qrOpens} opens · {c.metrics.profileClicks} profiles · {c.metrics.sharesReported} reported shares</p>
            </div>
            <span className={c.status==="approved"?"rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-800":"rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-800"}>
              {c.status.replaceAll("_"," ")}
            </span>
            {c.status==="pending_review"&&canApprove&&<>
              <button type="button" disabled={busy} className={primary} onClick={()=>void act(c,"approve")}>Approve</button>
              <button type="button" disabled={busy} className={secondary} onClick={()=>void act(c,"reject")}>Reject</button>
            </>}
            <button type="button" className={secondary}
              onClick={()=>setCurrentCode(currentCode===c.code?"":c.code)}>
              {active?.id===c.id?"Collapse":"Details"}
            </button>
          </div>
          {active?.id===c.id&&<div className="space-y-3 border-t border-slate-100 bg-[#FAFCFF] p-3 sm:p-4">
            {currentStatus==="approved"?<>
              <img src={c.cardUrl} alt={"Tracked Guru share card for "+c.guru.name}
                className="block w-full max-w-[600px] rounded-xl border border-slate-200" loading="lazy"/>
              <div className="flex flex-wrap gap-2">
                <a href={c.cardUrl} download="sitguru-guru-share.png" className={secondary}><Download size={15}/> Download PNG</a>
                <a href={c.shareUrl} target="_blank" rel="noopener noreferrer" className={secondary}><ArrowUpRight size={15}/> Tracked link</a>
                <button type="button" className={secondary} disabled={busy} onClick={()=>void act(c,"copy")}>
                  <ClipboardCopy size={15}/> Copy reply
                </button>
                <button type="button" className={primary} disabled={busy} onClick={()=>void act(c,"shared")}>Mark shared</button>
              </div>
              <p className="break-all rounded-lg bg-[#EFF6FF] p-2 text-xs text-blue-700">{c.shareUrl}</p>
            </>:<p className="text-sm text-amber-900">
              {c.status==="pending_review"?"This custom outreach card requires Manager approval before sharing.":"This card is not currently approved for sharing."}
            </p>}
            <p className="whitespace-pre-wrap text-sm text-[#0F2744]">
              {currentStatus==="approved"?c.reply_text:c.reply_text.replace(/https:\/\/www\.sitguru\.com\/s\/g\/\S+/g,"[tracking link available after approval]")}
            </p>
          </div>}
        </article>)}
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-slate-500">Page {historyPage+1} of {historyCount}</span>
        <div className="flex gap-2">
          <button type="button" className={secondary} disabled={historyPage===0}
            onClick={()=>{setHistoryPage(n=>Math.max(0,n-1));setCurrentCode("");}}>Previous</button>
          <button type="button" className={secondary} disabled={historyPage+1>=historyCount}
            onClick={()=>{setHistoryPage(n=>n+1);setCurrentCode("");}}>Next</button>
        </div>
      </div>
    </details>
    <p className="pb-5 text-xs font-medium text-slate-500">SitGuru Community Studio · Manager and Admin analytics read the same live event records. Guru availability must be verified on the Guru profile.</p>
  </main>;
}
