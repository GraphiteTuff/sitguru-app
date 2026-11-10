'use client';
import { useEffect, useState } from 'react';
type Permission = {id:string;title:string;story:string;mediaUrl:string;mediaMime:string;requesterName:string;publicConsent:boolean;socialConsent:boolean;status:string;updatedAt:string};
export default function ParentPermissions() {
  const [items,setItems] = useState<Permission[]>([]);
  const [error,setError] = useState('');
  const [loading,setLoading] = useState(true);
  const [busy,setBusy] = useState('');
  const [social,setSocial] = useState<Record<string,boolean>>({});
  async function load() {
    try { const response = await fetch('/api/community-studio/permissions',{cache:'no-store'}); const payload = await response.json(); if(!response.ok) throw new Error(payload.error); setItems(payload.items); }
    catch(problem) { setError(problem instanceof Error ? problem.message : 'Requests could not load.'); }
    finally {setLoading(false);}
  }
  useEffect(()=>{void load();},[]);
  async function decide(item:Permission,decision:string) {
    setBusy(item.id);setError('');
    try {
      const response = await fetch('/api/community-studio/permissions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:item.id,updatedAt:item.updatedAt,decision,publicConsent:decision==='approve',socialConsent:social[item.id]===true})});
      const payload = await response.json();if(!response.ok) throw new Error(payload.error);await load();
    }catch(problem){setError(problem instanceof Error ? problem.message : 'Permission could not be saved.');}finally{setBusy('');}
  }
  return <div className="mx-auto max-w-3xl space-y-5 px-5 py-10"><h1 className="text-3xl font-extrabold text-emerald-950">Your pet. Your permission.</h1><p className="text-sm leading-7 text-slate-600">Review the exact story and media your Guru wants to share. Website display and social media reuse are separate choices. Approval still requires Ava’s editorial review. You can withdraw permission here.</p>{error && <p role="alert" className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</p>}{loading && <p role="status">Loading your requests…</p>}{items.map(item=><article key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5"><p className="text-xs font-bold text-emerald-800">From {item.requesterName} · {item.status.replaceAll('_',' ')}</p><h2 className="mt-2 text-xl font-extrabold">{item.title}</h2>{item.mediaUrl && (item.mediaMime.startsWith('video/')?<video src={item.mediaUrl} controls playsInline className="mt-3 max-h-96 w-full rounded-xl bg-black"/>:<img src={item.mediaUrl} alt={item.title} className="mt-3 max-h-96 w-full rounded-xl object-contain"/>)}<p className="mt-4 whitespace-pre-wrap text-sm leading-7">{item.story}</p>{item.socialConsent && <label className="mt-4 flex items-start gap-3 rounded-xl bg-slate-50 p-4 text-sm"><input type="checkbox" className="size-5" checked={social[item.id]||false} onChange={event=>setSocial({...social,[item.id]:event.target.checked})}/>Optional: also allow SitGuru to reuse this story/media on its social channels.</label>}<fieldset disabled={busy===item.id} className="mt-4 flex flex-wrap gap-2 disabled:opacity-50">{item.status!=='approved' && <><button onClick={()=>void decide(item,'approve')} className="min-h-12 rounded-xl bg-emerald-800 px-4 font-bold text-white">Allow display on SitGuru</button><button onClick={()=>void decide(item,'decline')} className="min-h-12 rounded-xl border border-slate-300 px-4 font-bold">Decline</button></>}{item.status==='approved' && <button onClick={()=>void decide(item,'revoke')} className="min-h-12 rounded-xl border border-rose-300 px-4 font-bold text-rose-800">Withdraw permission</button>}</fieldset></article>)}{!loading&&!items.length&&!error&&<p className="rounded-xl bg-emerald-50 p-6">No pet permission requests are waiting for your account.</p>}</div>;
}
