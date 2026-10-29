import Link from "next/link";
import { GraduationCap } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { DESK_UI } from "@/lib/portal/desk-ui";
import {
  CAMPUS_CHANNELS,
  CAMPUS_GROWTH_PRINCIPLE,
  CAMPUS_LEAD_TYPES,
  CAMPUS_OPPORTUNITY_TYPES,
  CAMPUS_TARGETS,
  campusApprovalView,
  campusExecutionAllowed,
  campusTrackingPath,
} from "@/lib/internship/campus-growth";
import { saveCampusLead, saveCampusLink, saveCampusOpportunity, saveCampusResult } from "@/lib/internship/campus-growth-actions";
import type { CampusCard, CampusLead, CampusLink, CampusMission, CampusOpportunity } from "@/lib/internship/campus-growth-data";

export default function InternCampusGrowthHome({
  card,
  opportunities,
  leads,
  links,
  missions,
  eventMode = false,
  notice,
  error,
}: {
  card: CampusCard | null;
  opportunities: CampusOpportunity[];
  leads: CampusLead[];
  links: CampusLink[];
  missions: CampusMission[];
  eventMode?: boolean;
  notice: string;
  error: boolean;
}) {
  if (!card) {
    return (
      <div className={`${DESK_UI.card} p-6`}>
        <h1 className="text-2xl font-black text-[#0F2744]">Campus Growth</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">Your internship record needs a university before this workspace can open.</p>
      </div>
    );
  }
  const pending = opportunities.filter((row) => !campusExecutionAllowed(row.approval));

  return (
    <div className="space-y-4 pb-28 xl:pb-6">
      <DeskPageHero
        icon={<GraduationCap size={22} />}
        title="Campus Growth"
        subtitle="Help SitGuru learn how to grow responsibly in your campus and local community."
        banner="intern"
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />
      <p className="text-sm font-semibold text-slate-600">{card.campusName} · {card.internName} · Social Media & Community Growth Intern{card.semester ? ` · ${card.semester}` : ""}</p>
      <p className="rounded-2xl bg-[#F8FAFC] px-4 py-3 text-sm font-semibold leading-6 text-[#0F2744]">{CAMPUS_GROWTH_PRINCIPLE}</p>
      {notice ? <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${error ? "bg-rose-50 text-rose-800" : "bg-[#ECFDF5] text-[#047857]"}`}>{notice}</p> : null}

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          ["Opportunities", card.opportunities],
          ["Mission", card.activeCampaigns],
          ["QR scans", card.scans],
          ["Visits", card.visits],
          ["Leads", card.leads],
          ["Pet Parents", card.petParents],
          ["Guru applications", card.guruApplications],
          ["Waiting on review", pending.length],
        ].map(([label, value]) => (
          <article key={String(label)} className={`${DESK_UI.card} p-3`}>
            <p className="text-2xl font-black text-[#0F2744]">{value}</p>
            <p className="text-xs font-semibold text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      {eventMode ? (
        <section className="grid gap-3">
          <h2 className="text-lg font-black text-[#0F2744]">Event toolkit</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {links.length ? links.map((link) => (
              <a key={link.id} href={`${campusTrackingPath(link.code)}?scan=1`} className="rounded-3xl bg-[#0F2744] p-5 text-white">
                <p className="text-xs font-black uppercase tracking-wide !text-white/80">{link.target.replaceAll("_", " ")} · {link.channel}</p>
                <p className="mt-2 text-2xl font-black !text-white">{link.campaign}</p>
                <p className="mt-3 break-all text-sm font-semibold !text-white">{campusTrackingPath(link.code)}?scan=1</p>
              </a>
            )) : <p className="text-sm font-semibold text-slate-500">Create a tracking link before the event. Opening it counts a visit. It does not pay Ambassador rewards.</p>}
          </div>
          <Link href="/intern/messages" className="rounded-2xl bg-[#EFF6FF] px-4 py-4 text-center text-sm font-black text-[#1D4ED8]">Request Ava help</Link>
        </section>
      ) : null}

      {!opportunities.length ? (
        <section className={`${DESK_UI.card} p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Your Campus Growth workspace is ready.</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">Start by exploring one opportunity that could help SitGuru connect with your campus or surrounding community.</p>
          <a href="#add-opportunity" className="mt-3 inline-flex rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Explore Campus Opportunity</a>
        </section>
      ) : null}

      <section className="grid gap-3 lg:grid-cols-2">
        <form id="add-opportunity" action={saveCampusOpportunity} className={`${DESK_UI.card} grid gap-2 p-4`}>
          <h2 className="font-black text-[#0F2744]">Add campus opportunity</h2>
          <input type="hidden" name="returnTo" value={eventMode ? "/intern/campus-growth/event" : "/intern/campus-growth"} />
          <input type="hidden" name="internId" value={card.internId} />
          <input type="hidden" name="campus" value={card.campusName} />
          <input name="title" required placeholder="Opportunity title" className="min-h-11 rounded-xl border px-3 text-sm" />
          <select name="type" className="min-h-11 rounded-xl border px-3 text-sm">{CAMPUS_OPPORTUNITY_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          <textarea name="description" rows={2} placeholder="What is the opportunity?" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="sourceUrl" placeholder="Source link" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input name="contactName" placeholder="Contact name" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input name="contactOrganization" placeholder="Organization" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input type="date" name="happensOn" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input name="location" placeholder="Location" className="min-h-11 rounded-xl border px-3 text-sm" />
          <textarea name="rulesNotes" rows={2} placeholder="University rules you still need to confirm" className="rounded-xl border px-3 py-2 text-sm" />
          <button className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Submit idea to Ava</button>
        </form>
        <form action={saveCampusLead} className={`${DESK_UI.card} grid content-start gap-2 p-4`}>
          <h2 className="font-black text-[#0F2744]">Add lead</h2>
          <input type="hidden" name="returnTo" value={eventMode ? "/intern/campus-growth/event" : "/intern/campus-growth"} />
          <input type="hidden" name="internId" value={card.internId} />
          <input name="name" required placeholder="Name" className="min-h-11 rounded-xl border px-3 text-sm" />
          <select name="type" className="min-h-11 rounded-xl border px-3 text-sm">{CAMPUS_LEAD_TYPES.map((type) => <option key={type}>{type}</option>)}</select>
          <input name="organization" placeholder="Organization" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input name="contact" placeholder="Contact" className="min-h-11 rounded-xl border px-3 text-sm" />
          <textarea name="notes" rows={2} placeholder="What did you talk about?" className="rounded-xl border px-3 py-2 text-sm" />
          <button className="rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold !text-white">Save lead</button>
        </form>
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <form action={saveCampusLink} className={`${DESK_UI.card} grid gap-2 p-4`}>
          <h2 className="font-black text-[#0F2744]">Tracking link</h2>
          <p className="text-xs font-semibold text-slate-500">Business attribution only. This does not enroll you as an Ambassador or pay PetPerks rewards.</p>
          <input type="hidden" name="returnTo" value="/intern/campus-growth" />
          <input type="hidden" name="internId" value={card.internId} />
          <input type="hidden" name="campus" value={card.campusName} />
          <input name="campaign" placeholder="Campaign name" className="min-h-11 rounded-xl border px-3 text-sm" />
          <select name="target" className="min-h-11 rounded-xl border px-3 text-sm">{CAMPUS_TARGETS.map((target) => <option key={target} value={target}>{target.replaceAll("_", " ")}</option>)}</select>
          <select name="channel" className="min-h-11 rounded-xl border px-3 text-sm">{CAMPUS_CHANNELS.map((channel) => <option key={channel}>{channel}</option>)}</select>
          <button className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Create tracking link</button>
          <ul className="space-y-2 text-sm font-semibold">
            {links.map((link) => (
              <li key={link.id} className="break-all rounded-xl bg-[#F8FAFC] px-3 py-2">{link.campaign} · {campusTrackingPath(link.code)}?scan=1</li>
            ))}
          </ul>
        </form>
        <form action={saveCampusResult} className={`${DESK_UI.card} grid gap-2 p-4`}>
          <h2 className="font-black text-[#0F2744]">Record results</h2>
          <input type="hidden" name="returnTo" value="/intern/campus-growth" />
          <input type="hidden" name="internId" value={card.internId} />
          <input name="petParents" inputMode="numeric" placeholder="Pet Parent registrations" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input name="guruApplications" inputMode="numeric" placeholder="Future Guru applications" className="min-h-11 rounded-xl border px-3 text-sm" />
          <input name="bookings" inputMode="numeric" placeholder="Bookings, if known" className="min-h-11 rounded-xl border px-3 text-sm" />
          <textarea name="lesson" rows={2} placeholder="What did you learn?" className="rounded-xl border px-3 py-2 text-sm" />
          <textarea name="recommendation" rows={2} placeholder="What should SitGuru repeat, change, or stop?" className="rounded-xl border px-3 py-2 text-sm" />
          <button className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Save results</button>
        </form>
      </section>

      <section className={`${DESK_UI.card} p-4`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-black text-[#0F2744]">Opportunities and rules</h2>
          <Link href="/intern/campus-growth/event" className="text-sm font-bold text-[#2563EB]">Event mode</Link>
        </div>
        {card.policyNotes ? <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">Campus rules: {card.policyNotes}</p> : <p className="mt-2 text-sm font-semibold text-slate-500">University rules are not confirmed yet. Do not treat another campus as permission for this one.</p>}
        <ul className="mt-3 space-y-2">
          {opportunities.map((row) => {
            const view = campusApprovalView(row.approval);
            return (
              <li key={row.id} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm">
                <p className="font-black text-[#0F2744]">{row.title}</p>
                <p className="font-semibold text-slate-600">{row.type} · {row.status}</p>
                <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-bold ${view.tone}`}>{view.label}</span>
                {campusExecutionAllowed(row.approval) ? <p className="mt-1 font-semibold text-[#166534]">You may proceed with this approved tactic.</p> : <p className="mt-1 font-semibold text-slate-500">Wait for review before you execute this.</p>}
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${DESK_UI.card} p-4`}>
        <h2 className="font-black text-[#0F2744]">Campus missions</h2>
        {missions.length ? missions.map((row) => (
          <p key={row.id} className="mt-2 text-sm font-semibold text-slate-700"><Link href="/intern/assignments" className="font-black text-[#2563EB]">{row.title}</Link> · due {row.dueOn || "not set"}</p>
        )) : <p className="mt-2 text-sm font-semibold text-slate-500">Published missions from your manager show up with your assignments. Drafts stay private.</p>}
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#2563EB]">
          <Link href="/intern/assignments">Open my mission</Link>
          <Link href="/intern/messages">Ask Ava</Link>
          <Link href="/intern/help/campus-growth">How Campus Growth works</Link>
        </div>
        {leads.length ? <p className="mt-3 text-sm font-semibold text-slate-600">{leads.length} lead{leads.length === 1 ? "" : "s"} saved. Your manager coordinates follow-up.</p> : null}
      </section>
    </div>
  );
}
