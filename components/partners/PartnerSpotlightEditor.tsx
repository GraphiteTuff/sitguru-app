"use client";
import { useActionState } from "react";
import { saveHomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight-actions";
import type { HomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight";

const input = "mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 focus:border-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-100";
const fields: { key: keyof HomepagePartnerSpotlight; label: string }[] = [
  { key: "eyebrow", label: "Eyebrow" },
  { key: "title", label: "Headline" },
  { key: "subtitle", label: "Business / subtitle" },
  { key: "primary_label", label: "Primary button" },
  { key: "primary_href", label: "Primary button link" },
  { key: "secondary_label", label: "Secondary button" },
  { key: "secondary_href", label: "Secondary button link" },
  { key: "image_alt", label: "Image description" },
];
export default function PartnerSpotlightEditor({ spotlight }: { spotlight: HomepagePartnerSpotlight | null }) {
  const [state, action, pending] = useActionState(saveHomepagePartnerSpotlight, { ok: false, message: "", error: "" });
  if (!spotlight) return <p role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">Spotlight record unavailable. Contact Super Admin.</p>;
  return <section className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm sm:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs font-black uppercase tracking-widest text-emerald-800">Homepage feature manager</p><h2 className="mt-1 text-xl font-black text-slate-950">Partner Spotlight · Dr. Gracyn Baldwin</h2><p className="mt-1 text-sm text-slate-600">Edit once here. Published changes appear on the homepage without a new deployment.</p></div><a href="/" target="_blank" rel="noopener noreferrer" className="rounded-xl border border-emerald-700 px-4 py-2 text-sm font-bold text-emerald-900">View homepage ↗</a></div>
    <form action={action} className="mt-5 space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">{fields.map(f => <label key={f.key} className="block text-sm font-semibold text-slate-700">{f.label}<input className={input} name={f.key} defaultValue={String(spotlight[f.key] || "")} maxLength={f.key.endsWith("href") ? 1000 : 220} /></label>)}</div>
      <label className="block text-sm font-semibold text-slate-700">Spotlight story<textarea name="description" rows={6} maxLength={3500} required className={input} defaultValue={spotlight.description} /></label>
      <div className="grid gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:grid-cols-2">
        <div><label className="block text-sm font-semibold text-slate-700">Replace featured photo (JPG, PNG, WebP; max 6 MB)<input type="file" name="image" accept="image/jpeg,image/png,image/webp" className="mt-2 block w-full text-sm" /></label><p className="mt-2 text-xs text-slate-600">Use the authentic Dr. Baldwin photo forwarded by Ava/Lola. Existing image remains until replaced.</p></div>
        <div>{spotlight.image_url ? <img src={spotlight.image_url} alt={spotlight.image_alt || "Current spotlight"} className="max-h-48 w-full rounded-xl bg-white object-contain" /> : <span className="text-sm text-slate-500">No image yet</span>}</div>
      </div>
      <label className="flex min-h-12 items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-bold text-emerald-900"><input type="checkbox" name="is_published" defaultChecked={spotlight.is_published} className="size-5 accent-emerald-700" />Publish this feature on SitGuru homepage</label>
      <div className="flex flex-wrap items-center gap-4"><button type="submit" disabled={pending} className="min-h-12 rounded-xl bg-[#0D5C3A] px-6 text-sm font-bold text-white disabled:opacity-50">{pending ? "Saving…" : "Save homepage spotlight"}</button><span role="status" className={state.error ? "text-sm font-semibold text-rose-700" : "text-sm font-semibold text-emerald-800"}>{state.error || state.message}</span></div>
    </form>
  </section>;
}
