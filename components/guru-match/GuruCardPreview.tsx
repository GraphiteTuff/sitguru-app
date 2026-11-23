"use client";
import { useEffect, useState } from "react";
import { ArrowUpRight, Download, RefreshCw } from "lucide-react";

const action = "inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-2 text-sm font-black text-[#0F2744] hover:bg-[#DBEAFE] disabled:cursor-not-allowed disabled:opacity-50";

/** The actual 1200 x 630 PNG must load before staff can download or share it. */
export default function GuruCardPreview({url,guruName,filename}:{
  url:string; guruName:string; filename:string;
}){
  const [state,setState]=useState<"loading"|"ready"|"error">("loading");
  const [attempt,setAttempt]=useState(0);
  const [downloading,setDownloading]=useState(false);
  const [message,setMessage]=useState("");
  // Same-origin paths work in web, tablet, and mobile-app webviews.
  const href=url.startsWith("https://www.sitguru.com/")
    ? url.slice("https://www.sitguru.com".length):url;
  const previewUrl=href+(href.includes("?")?"&":"?")+"preview="+attempt;
  useEffect(()=>{setState("loading");setMessage("");},[href,attempt]);

  async function download(){
    if(state!=="ready"||downloading)return;
    setDownloading(true);setMessage("");
    try{
      const response=await fetch(href,{cache:"no-store",credentials:"same-origin"});
      if(!response.ok||!response.headers.get("content-type")?.includes("image/png"))
        throw new Error("The PNG is unavailable. Retry the card preview.");
      const blob=await response.blob();
      if(blob.size<1000)throw new Error("The downloaded card is incomplete.");
      const objectUrl=URL.createObjectURL(blob);
      const anchor=document.createElement("a");
      anchor.href=objectUrl;anchor.download=filename;
      document.body.appendChild(anchor);anchor.click();anchor.remove();
      window.setTimeout(()=>URL.revokeObjectURL(objectUrl),1000);
    }catch(e){setMessage(e instanceof Error?e.message:"The PNG could not be downloaded.");}
    finally{setDownloading(false);}
  }

  return <div className="min-w-0 space-y-2">
    <div className="w-full max-w-[600px] overflow-hidden rounded-xl border border-slate-200 bg-white">
      {state==="loading"&&<p role="status" className="p-3 text-sm font-semibold text-slate-600">Preparing your SitGuru social poster…</p>}
      {state==="error"&&<div className="space-y-2 p-4" role="alert">
        <p className="text-sm font-bold text-rose-700">The card image did not load. It is not ready to send.</p>
        <button type="button" className={action} onClick={()=>setAttempt(n=>n+1)}><RefreshCw size={16}/> Retry preview</button>
      </div>}
      <img src={previewUrl} alt={"SitGuru share card for "+guruName+" with services and QR code"}
        className={"block w-full "+(state==="error"?"hidden":"")}
        loading="eager" decoding="async" onLoad={()=>setState("ready")} onError={()=>setState("error")}/>
    </div>
    {state==="ready"&&<p role="status" className="text-xs font-bold text-emerald-700">
      Social-ready portrait · 1080 × 1350 PNG · QR code included
    </p>}
    <div className="flex flex-wrap gap-2">
      <button type="button" className={action} disabled={state!=="ready"||downloading}
        onClick={()=>void download()}><Download size={16}/>{downloading?"Downloading…":"Download image"}</button>
      {state==="ready"&&<a className={action} href={href} target="_blank" rel="noopener noreferrer">
        <ArrowUpRight size={16}/> View full card</a>}
    </div>
    {message&&<p role="alert" className="text-xs font-bold text-rose-700">{message}</p>}
  </div>;
}
