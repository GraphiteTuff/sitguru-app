"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Check, Clipboard, Download, ExternalLink, QrCode, X } from "lucide-react";
import type { CampusLink } from "@/lib/internship/campus-growth-data";
import { campusDestinationForTarget, campusTrackingPath } from "@/lib/internship/campus-growth";

const PUBLIC_ORIGIN="https://www.sitguru.com";
function targetLabel(target:string) {
  if(target==="future_guru")return "Become a SitGuru Guru";
  if(target==="pet_parent")return "Explore pet care as a Pet Parent";
  if(target==="petperks")return "Explore SitGuru PetPerks";
  if(target==="event")return "Explore pet community events";
  if(target==="partnership")return "Explore SitGuru partnerships";
  if(target==="social")return "Join the SitGuru community";
  return "Explore SitGuru";
}
export default function CampusLinkShareCard({link,showAtEvent=false,visitsAvailable=true}:{
  link:CampusLink;showAtEvent?:boolean;visitsAvailable?:boolean;
}){
  const [open,setOpen]=useState(showAtEvent);
  const [qrData,setQrData]=useState("");
  const [copied,setCopied]=useState(false);
  const [qrError,setQrError]=useState("");
  const href=PUBLIC_ORIGIN+campusTrackingPath(link.code);
  const scanUrl=href+"?scan=1";
  const filename="sitguru-"+link.code+".png";
  useEffect(()=>{
    if(!open)return;
    let active=true;
    setQrError("");
    void QRCode.toDataURL(scanUrl,{
      width:360,
      margin:2,
      errorCorrectionLevel:"M",
      color:{dark:"#0F2744",light:"#FFFFFF"},
    }).then(data=>{if(active)setQrData(data);}).catch(()=>{
      if(active)setQrError("QR graphic unavailable; the campaign link can still be copied.");
    });
    return ()=>{active=false;};
  },[open,scanUrl]);
  async function copy(){
    try {
      await navigator.clipboard.writeText(href);
      setCopied(true);
    }catch{
      setCopied(false);
      setQrError("Clipboard permission is unavailable. Select the visible URL to copy it.");
    }
  }
  return (
    <article className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="text-sm font-black text-[#0F2744]">{link.campaign||"Campus outreach campaign"}</h4>
          <p className="mt-1 text-xs font-semibold text-slate-600">{link.channel} · {targetLabel(link.target)}</p>
          <p className="mt-1 text-xs font-medium text-slate-500">Campaign destination: {campusDestinationForTarget(link.target)}</p>
        </div>
        <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[11px] font-black text-[#1D4ED8]">
          {visitsAvailable?link.visits:"—"} visits · {visitsAvailable?link.scans:"—"} QR events
        </span>
      </div>
      <p className="mt-3 break-all rounded-xl bg-[#F8FAFC] p-3 text-xs font-semibold leading-5 text-[#2563EB]">{href}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={()=>void copy()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black text-[#2563EB] hover:bg-[#EFF6FF]">
          {copied?<Check size={16} aria-hidden="true"/>:<Clipboard size={16} aria-hidden="true"/>} {copied?"Copied":"Copy link"}
        </button>
        <button type="button" onClick={()=>setOpen(!open)} aria-expanded={open} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#EFF6FF] px-3 text-xs font-black text-[#1D4ED8] hover:bg-[#DBEAFE]">
          {open?<X size={16} aria-hidden="true"/>:<QrCode size={16} aria-hidden="true"/>} {open?"Hide QR":"View/download QR"}
        </button>
        <a href={href} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-1 px-2 text-xs font-black text-[#2563EB]">Test landing page <ExternalLink size={15} aria-hidden="true"/></a>
      </div>
      {open?(
        <div className="mt-4 rounded-2xl border border-[#BFDBFE] bg-[#EFF6FF] p-4">
          <p className="text-xs font-black text-[#0F2744]">Share at approved campus events</p>
          <p className="mt-1 text-xs font-medium leading-5 text-slate-600">A QR scan opens the correct SitGuru landing page. Scans, including tests, are counted as tracking events—not confirmed registrations or bookings.</p>
          {qrData?(
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrData} alt={"QR code for "+link.campaign+" linking to SitGuru "+targetLabel(link.target)} width={208} height={208} className="h-52 w-52 rounded-lg border border-slate-200 bg-white p-2"/>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-black text-[#0F2744]">{targetLabel(link.target)}</p>
                <a href={qrData} download={filename} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-xs font-black !text-white hover:bg-[#1D4ED8]"><Download size={17} aria-hidden="true"/> Download QR graphic</a>
                <p className="mt-2 text-[11px] font-medium text-slate-600">Use only with approved SitGuru branding and university permission.</p>
              </div>
            </div>
          ):<p className="mt-3 text-sm font-semibold text-slate-600">{qrError||"Creating QR preview…"}</p>}
        </div>
      ):null}
      {qrError && !open?<p role="status" className="mt-2 text-xs font-semibold text-amber-900">{qrError}</p>:null}
    </article>
  );
}
