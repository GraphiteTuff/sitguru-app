import Link from "next/link";
import type { Metadata } from "next";
import { getHomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Meet Dr. Gracyn Baldwin | SitGuru Partner Spotlight",
  description: "Meet Dr. Gracyn Baldwin and Annabel's Touch Chiropractic, a SitGuru pet wellness partner offering mobile chiropractic care.",
};
export default async function DrBaldwinSpotlightPage() {
  const item = await getHomepagePartnerSpotlight();
  if (!item) return <main className="mx-auto max-w-3xl px-5 py-20"><h1 className="text-3xl font-black">Partner spotlight coming soon</h1><p className="mt-4 text-slate-600">Our team is preparing the feature.</p><Link className="mt-5 inline-block text-emerald-800 underline" href="/partners">Explore SitGuru partners</Link></main>;
  return <main className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
    <Link href="/" className="text-sm font-bold text-emerald-700">← SitGuru homepage</Link>
    <p className="mt-8 text-xs font-black uppercase tracking-[0.2em] text-emerald-800">{item.eyebrow}</p>
    <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl">{item.title}</h1>
    <p className="mt-2 text-xl font-semibold text-slate-700">{item.subtitle}</p>
    <div className="mt-8 overflow-hidden rounded-3xl bg-emerald-50"><img src={item.image_url} alt={item.image_alt} className="max-h-[560px] w-full object-cover" /></div>
    <p className="mt-8 whitespace-pre-line text-base leading-8 text-slate-700 sm:text-lg">{item.description}</p>
    <div className="mt-8 rounded-2xl border border-emerald-100 bg-emerald-50 p-5"><h2 className="text-lg font-black text-emerald-900">Plan a first visit</h2><p className="mt-2 text-sm text-slate-700">Veterinary approval and proof of a current rabies vaccination are required before animal chiropractic visits. Discuss your pet’s needs with their veterinarian.</p><a href={item.secondary_href} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-5 text-sm font-bold text-white">{item.secondary_label} ↗</a></div>
  </main>;
}
