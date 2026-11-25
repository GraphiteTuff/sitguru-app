import Link from "next/link";

type Mode = "admin" | "manager" | "intern";
const routes = {
  admin: { partners: "/admin/growth/partners", content: "/admin/growth/content", results: "/admin/growth/analytics", work: "/admin/growth/oversight" },
  manager: { partners: "/manager/partners", content: "/manager/campaigns-content", results: "/manager/referrals", work: "/manager/assignments" },
  intern: { partners: "/intern/growth/partners", content: "/intern/content", results: "/intern/growth/referrals", work: "/intern/assignments" },
};
const pilots = [
  { name: "Dr. Gracyn Baldwin", focus: "Business & wellness", tasks: "Website badge, clinic flyers, reception QR display, monthly placement photo, educational media." },
  { name: "Coach T (Tanikwa Matthews)", focus: "Media & creator", tasks: "Linktree placement, social promotion, podcast mentions, interview and Read & Listen content." },
];
export default function GrowthPlaybookPanel({ mode }: { mode: Mode }) {
  const r = routes[mode];
  const links = [{ label: "Partner workspace", href: r.partners }, { label: "Assignments & review", href: r.work }, { label: "Content Studio", href: r.content }, { label: "Growth results", href: r.results }, ...(mode === "admin" ? [] : [{ label: "Campus Growth", href: "/" + mode + "/campus-growth" }, { label: "Community Studio", href: "/" + mode + "/community-studio" }]), ...(mode === "manager" ? [{ label: "Outreach", href: "/manager/outreach" }] : [])];
  return <section aria-labelledby="growth-playbook-title" className="space-y-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
    <header className="rounded-2xl bg-[#10583F] p-5 !text-white">
      <p className="text-xs font-bold uppercase tracking-widest !text-white">SitGuru growth & internship playbook</p>
      <h2 id="growth-playbook-title" className="mt-2 text-2xl font-black !text-white">Two pillars. One growth mission.</h2>
      <p className="mt-2 text-sm !text-white">Recruit and activate Gurus, attract and retain Pet Parents, and recruit and empower Ambassadors across both pillars.</p>
    </header>
    <div className="grid gap-3 sm:grid-cols-2">
      <article className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4"><h3 className="text-lg font-black text-emerald-950">50% Community Growth</h3><p className="mt-2 text-sm text-slate-700">Campus growth, local outreach, partnerships, sponsorships, events, media relationships and referrals.</p></article>
      <article className="rounded-2xl border border-orange-200 bg-orange-50 p-4"><h3 className="text-lg font-black text-slate-950">50% Social Media Growth</h3><p className="mt-2 text-sm text-slate-700">Existing content creation, campaigns, trend research, publishing, engagement and analytics.</p></article>
    </div>
    <p className="text-sm text-slate-700">Overall project planning target, not a weekly quota. Assign one primary pillar per task and log hours and conversions once. Final portfolio combines both pillars, approved evidence, results, recommendations and handover.</p>
    <h3 className="text-lg font-black text-slate-950">Founding partner preparation</h3>
    <p className="text-sm text-slate-700">Planning guidance only — not live agreement or payment records. Ava leads; Lola prepares deliverables now. Super Admin approves terms and spending. Written acceptance is required before activation.</p>
    <div className="grid gap-3 sm:grid-cols-2">{pilots.map(p => <article key={p.name} className="rounded-2xl border border-slate-200 p-4"><p className="text-xs font-bold text-emerald-800">{p.focus}</p><h4 className="mt-1 text-lg font-black text-slate-950">{p.name}</h4><p className="mt-2 text-sm font-bold text-slate-700">Proposed: $15/month × 6 months = $90</p><p className="mt-2 text-sm text-slate-700">{p.tasks}</p></article>)}</div>
    <p className="text-sm text-slate-700">Combined proposed sponsorship: $180, excluding printing, shipping and staff time. Monthly evidence review, month-three midpoint review and month-six renewal decision; no automatic renewal.</p>
    <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700"><h3 className="font-black text-slate-950">Weekly execution</h3><p className="mt-2">Research and draft outreach → manager review → admin budget approval → written acceptance → approved kit and placement → monthly evidence and results. Continue existing social assignments throughout.</p><p className="mt-2">Ryan: 75 + 75 planned hours. Lalita: 150 + 150 planned hours. Lola: equal split of approved project hours. Ava confirms individual academic requirements.</p></div>
    <nav aria-label="Growth work tools" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{links.map(link => <Link key={link.href} href={link.href} className="flex min-h-12 items-center justify-center rounded-xl bg-[#10583F] px-4 py-3 text-center text-sm font-bold !text-white hover:bg-emerald-900">{link.label} →</Link>)}</nav>
  </section>;
}
