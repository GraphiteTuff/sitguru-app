"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, ShieldCheck, PlugZap, RefreshCw, ArrowUpRight } from "lucide-react";
import type { AccountConnection } from "@/lib/internship/ava-lola-connections";

const statusColors={
 ready:"bg-emerald-50 text-emerald-800 border-emerald-200",
 action:"bg-amber-50 text-amber-900 border-amber-200",
 blocked:"bg-rose-50 text-rose-800 border-rose-200",
 external:"bg-slate-100 text-slate-700 border-slate-200",
} as const;
const statusLabel={ready:"Connected",action:"Needs action",blocked:"Blocked",external:"External check"} as const;

export default function AvaLolaConnectionHealth({initial}:{initial:AccountConnection[]}) {
  const [accounts,setAccounts]=useState(initial);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [changes,setChanges]=useState<string[]>([]);
  const [checkedAt,setCheckedAt]=useState("");
  async function run(reconcile:boolean) {
    setBusy(true);setError("");setChanges([]);
    try{
      const response=await fetch("/api/admin/internship/connection-health",reconcile?{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({confirm:"RECONCILE_VERIFIED_AVA_LOLA"}),
      }:{cache:"no-store"});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||"Account check failed.");
      setAccounts(data.accounts||[]);
      setChanges(Array.isArray(data.changes)?data.changes:[]);
      setCheckedAt(data.checkedAt||"");
    }catch(err){setError(err instanceof Error?err.message:"Unable to verify account connections.");}
    finally{setBusy(false)}
  }
  const ready=accounts.reduce((n,a)=>n+a.checks.filter(c=>c.status==="ready").length,0);
  const total=accounts.reduce((n,a)=>n+a.checks.filter(c=>c.status!=="external").length,0);
  return (
    <div className="space-y-5">
      <section className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.12em] text-[#0D5C3A]">Super Admin · live connection audit</p>
            <h1 className="mt-1 text-2xl font-black tracking-tight text-[#0F2744] sm:text-3xl">Ava & Lola — Account Readiness</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-slate-600">
              Checks actual SitGuru authentication, staff/intern records, assignments, onboarding and stored roles.
              It cannot certify a Microsoft or social-network login without that provider's authorization.
            </p>
          </div>
          <div className="rounded-2xl bg-[#EFF6FF] px-4 py-3 text-center">
            <p className="text-xs font-black uppercase tracking-wider text-[#1D4ED8]">Verified checks</p>
            <p className="mt-1 text-2xl font-black text-[#0F2744]">{ready}/{total}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" disabled={busy} onClick={()=>void run(false)} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#0F2744] hover:bg-[#EFF6FF] disabled:opacity-60">
            <RefreshCw size={17} aria-hidden="true" className={busy?"animate-spin":""} /> Recheck live connections
          </button>
          <button type="button" disabled={busy} onClick={()=>void run(true)} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8] disabled:opacity-60">
            <PlugZap size={17} aria-hidden="true" /> {busy?"Checking…":"Reconcile verified connections"}
          </button>
        </div>
        <p className="mt-2 text-xs font-medium text-slate-500">Reconcile is idempotent. It only repairs existing verified manager/intern relationships; it cannot approve university onboarding, create missing logins, alter Guru/Ambassador eligibility, or override another manager.</p>
        {checkedAt?<p role="status" className="mt-2 text-xs font-semibold text-[#0D5C3A]">Last checked {new Date(checkedAt).toLocaleString()}</p>:null}
        {error?<p role="alert" className="mt-3 rounded-xl bg-rose-50 p-3 text-sm font-bold text-rose-800">{error}</p>:null}
        {changes.length?<div role="status" className="mt-3 rounded-xl bg-emerald-50 p-3"><p className="font-black text-emerald-900">Account reconciliation completed</p><ul className="mt-1 list-inside list-disc text-xs font-medium text-emerald-800">{changes.map((change,i)=><li key={i}>{change}</li>)}</ul></div>:null}
      </section>
      <div className="grid gap-4 xl:grid-cols-2">
        {accounts.map(account=>(
          <section key={account.kind} className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm sm:p-5" aria-labelledby={account.kind+"-title"}>
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <ShieldCheck size={22} className="text-[#2563EB]" aria-hidden="true"/>
              <h2 id={account.kind+"-title"} className="min-w-0 text-lg font-black text-[#0F2744]">{account.title}</h2>
            </div>
            <ul className="mt-3 space-y-3">
              {account.checks.map(check=>(
                <li key={check.label} className="rounded-xl border border-slate-100 bg-[#F8FAFC] p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="flex items-center gap-1.5 text-sm font-black text-[#0F2744]">
                      {check.status==="ready"?<CheckCircle2 size={17} className="text-emerald-600" aria-hidden="true" />:<AlertTriangle size={17} className="text-amber-600" aria-hidden="true" />}
                      {check.label}
                    </p>
                    <span className={"rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-wider "+statusColors[check.status]}>{statusLabel[check.status]}</span>
                  </div>
                  <p className="mt-2 text-xs font-medium leading-5 text-slate-600">{check.detail}</p>
                  {check.href?<Link href={check.href} className="mt-2 inline-flex min-h-9 items-center gap-1 text-xs font-black text-[#2563EB] hover:underline">Open related workspace <ArrowUpRight size={14} aria-hidden="true" /></Link>:null}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <p className="px-1 text-xs font-medium text-slate-500">For each account to be fully connected, every internal check must be Connected, and external services need their own authorized account-level validation. This screen does not impersonate Ava or Lola.</p>
    </div>
  );
}
