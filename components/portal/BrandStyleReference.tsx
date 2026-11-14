"use client";

import { useState } from "react";
import { Check, Copy, Type } from "lucide-react";
import { SITGURU_BRAND_GREEN, SITGURU_BRAND_GREEN_DARK, SITGURU_BRAND_GREEN_LIGHT } from "@/lib/internship/intern-ui";

const COLORS = [
  { name: "SitGuru Green", code: SITGURU_BRAND_GREEN, purpose: "Primary brand green", light: false },
  { name: "Deep Green", code: SITGURU_BRAND_GREEN_DARK, purpose: "Dark brand backgrounds", light: false },
  { name: "Light Green", code: SITGURU_BRAND_GREEN_LIGHT, purpose: "Soft brand highlights", light: true },
  { name: "Desk Navy", code: "#0F2744", purpose: "Manager Desk headings", light: false },
  { name: "Action Blue", code: "#2563EB", purpose: "Primary portal buttons and links", light: false },
  { name: "Desk Teal", code: "#0D5C3A", purpose: "Growth and success accents", light: false },
] as const;

/** Shared across Intern / Manager / Admin Brand Kits, with no oversized logo banner. */
export default function BrandStyleReference() {
  const [copied, setCopied] = useState("");

  async function copyColor(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
    } catch {
      setCopied("");
    }
  }

  return (
    <section aria-labelledby="team-brand-guide" className="min-w-0 rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,39,68,0.05)] sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.12em] text-[#0D5C3A]">Shared brand reference</p>
          <h2 id="team-brand-guide" className="mt-1 text-xl font-black tracking-tight text-[#0F2744]">SitGuru colors & typography</h2>
          <p className="mt-1 max-w-3xl text-sm font-medium leading-6 text-slate-600">
            Use these colors consistently in approved creative. Manager, Intern and Admin toolkits share this reference.
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {COLORS.map((color) => (
          <div key={color.code} className="min-w-0 rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
            <div className="flex min-w-0 items-center gap-3">
              <span
                aria-hidden="true"
                style={{ backgroundColor: color.code }}
                className={"h-12 w-12 shrink-0 rounded-xl shadow-sm " + (color.light ? "border border-slate-200" : "")}
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-black text-[#0F2744]">{color.name}</p>
                <p className="text-xs font-medium text-slate-500">{color.purpose}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyColor(color.code)}
                aria-label={"Copy " + color.name + " hex code " + color.code}
                className="inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-black text-[#1D4ED8] hover:bg-[#EFF6FF]"
              >
                {copied === color.code ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                <span className="font-mono tabular-nums">{color.code}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 border-t border-slate-100 pt-4 lg:grid-cols-[1.2fr_1fr]">
        <div className="rounded-xl bg-[#EFF6FF] p-4">
          <p className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#1D4ED8]"><Type size={17} aria-hidden="true" /> Primary font</p>
          <p className="mt-2 text-xl font-extrabold tracking-tight text-[#0F2744]">Plus Jakarta Sans</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Headings, body text, forms, buttons and social layouts. SitGuru's web interface uses this family with sans-serif fallbacks.</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">Recommended styles: 700–800 for headings, 600–700 for buttons, 400–600 for body.</p>
        </div>
        <div className="rounded-xl bg-[#F4F7FB] p-4">
          <p className="text-xs font-black uppercase tracking-wider text-[#0D5C3A]">Secondary type treatment</p>
          <p className="mt-2 text-base font-black tracking-tight text-[#0F2744]">Clean, legible and consistent</p>
          <p className="mt-1 text-xs font-semibold text-slate-600">Keep information in Plus Jakarta Sans. Handwritten desk quote accents use a system cursive fallback (Segoe Script / Brush Script MT) and are decorative, not required campaign fonts.</p>
          <p className="mt-2 text-xs font-semibold text-slate-600">On dark green and navy, use white text. Never use dark text on the primary green background.</p>
        </div>
      </div>
    </section>
  );
}
