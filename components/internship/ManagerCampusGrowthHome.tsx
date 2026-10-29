import Link from "next/link";
import { GraduationCap } from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { InternName } from "@/components/portal/PersonFace";
import { DESK_UI } from "@/lib/portal/desk-ui";
import {
  CAMPUS_COACHING_PROMPTS,
  CAMPUS_PHASES,
  campusApprovalView,
} from "@/lib/internship/campus-growth";
import { createCampusMission, reviewCampusOpportunity, saveCampusPolicy } from "@/lib/internship/campus-growth-actions";
import type { CampusCard, CampusLead, CampusMission, CampusOpportunity } from "@/lib/internship/campus-growth-data";

export default function ManagerCampusGrowthHome({
  cards,
  opportunities,
  leads,
  missions,
  notice,
  error,
}: {
  cards: CampusCard[];
  opportunities: CampusOpportunity[];
  leads: CampusLead[];
  missions: CampusMission[];
  notice: string;
  error: boolean;
}) {
  const totals = {
    campuses: cards.length,
    campaigns: cards.reduce((sum, row) => sum + row.activeCampaigns, 0),
    leads: cards.reduce((sum, row) => sum + row.leads, 0),
    scans: cards.reduce((sum, row) => sum + row.scans, 0),
    visits: cards.reduce((sum, row) => sum + row.visits, 0),
    petParents: cards.reduce((sum, row) => sum + row.petParents, 0),
    gurus: cards.reduce((sum, row) => sum + row.guruApplications, 0),
    upcoming: cards.reduce((sum, row) => sum + row.upcomingEvents, 0),
  };
  const reviews = opportunities.filter((row) => row.approval === "ava_review" || row.approval === "jason_review" || row.approval === "university_approval");

  return (
    <div className="space-y-4 pb-28 xl:pb-6">
      <DeskPageHero icon={<GraduationCap size={22} />} title="Campus Growth" subtitle="Coach intern research, approve tactics, and measure what each campus actually teaches SitGuru." banner="manager" quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."} />
      {notice ? <p className={`rounded-2xl px-4 py-3 text-sm font-bold ${error ? "bg-rose-50 text-rose-800" : "bg-[#ECFDF5] text-[#047857]"}`}>{notice}</p> : null}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Active Campuses", totals.campuses],
          ["Active Campus Campaigns", totals.campaigns],
          ["Campus Leads", totals.leads],
          ["QR Scans", totals.scans],
          ["Tracked Visits", totals.visits],
          ["Pet Parent Registrations", totals.petParents],
          ["Future Guru Applications", totals.gurus],
          ["Upcoming Campus Opportunities", totals.upcoming],
        ].map(([label, value]) => (
          <article key={String(label)} className={`${DESK_UI.card} p-4`}>
            <p className="text-3xl font-black text-[#0F2744]">{value}</p>
            <p className="text-sm font-semibold text-slate-500">{label}</p>
          </article>
        ))}
      </section>

      {cards.length ? (
        <section className="grid gap-3 xl:grid-cols-2">
          {cards.map((card) => (
            <article key={card.internId} id={card.internId} className={`${DESK_UI.card} p-4`}>
              <p className="text-xs font-black uppercase tracking-wide text-[#2563EB]">{card.status}</p>
              <h2 className="mt-1 text-xl font-black text-[#0F2744]">{card.campusName}</h2>
              <p className="text-sm font-semibold text-slate-600">
                <InternName name={card.internName} src={card.avatarUrl} /> · Social Media & Community Growth Intern
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Campus Opportunities", card.opportunities],
                  ["Active Campaigns", card.activeCampaigns],
                  ["Upcoming Events", card.upcomingEvents],
                  ["Tracked Visits", card.visits],
                  ["QR Scans", card.scans],
                  ["Pet Parent Registrations", card.petParents],
                  ["Future Guru Applications", card.guruApplications],
                  ["Leads", card.leads],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-xl bg-[#F8FAFC] px-3 py-2">
                    <dt className="text-xs font-semibold text-slate-500">{label}</dt>
                    <dd className="font-black text-[#0F2744]">{value}</dd>
                  </div>
                ))}
              </dl>
              <div className="mt-3 flex flex-wrap gap-2 text-sm font-bold">
                <a href={`#mission-${card.internId}`} className="text-[#2563EB]">Create Campus Mission</a>
                <a href={`#reviews`} className="text-[#2563EB]">Review Opportunities</a>
                <Link href="/manager/results" className="text-[#2563EB]">View Results</Link>
                <a href="#leads" className="text-[#2563EB]">View Leads</a>
                <Link href="/manager/messages" className="text-[#2563EB]">Message Intern</Link>
              </div>
              <form action={saveCampusPolicy} className="mt-3 grid gap-2">
                <input type="hidden" name="returnTo" value="/manager/campus-growth" />
                <input type="hidden" name="internId" value={card.internId} />
                <label className="text-xs font-bold text-slate-500">Campus rules for this university only
                  <textarea name="policyNotes" defaultValue={card.policyNotes} rows={2} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm" placeholder="Tabling, flyers, trademarks, and solicitation rules. Do not copy another campus." />
                </label>
                <button className="w-fit rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Save campus notes</button>
              </form>
            </article>
          ))}
        </section>
      ) : (
        <section className={`${DESK_UI.card} p-6`}>
          <h2 className="text-lg font-black text-[#0F2744]">No campus campaigns yet.</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">When an intern is assigned to you, their university becomes a campus card here.</p>
        </section>
      )}

      <section className={`${DESK_UI.card} p-4`} id="reviews">
        <h2 className="text-lg font-black text-[#0F2744]">Needs review</h2>
        {reviews.length ? reviews.map((row) => {
          const view = campusApprovalView(row.approval);
          return (
            <form key={row.id} action={reviewCampusOpportunity} className="mt-3 grid gap-2 rounded-2xl bg-[#F8FAFC] p-3">
              <input type="hidden" name="returnTo" value="/manager/campus-growth" />
              <input type="hidden" name="opportunityId" value={row.id} />
              <p className="font-black text-[#0F2744]">{row.title}</p>
              <p className="text-sm font-semibold text-slate-600">{row.type} · {row.happensOn || "Date not set"}</p>
              <p className="text-sm text-slate-600">{row.description}</p>
              {row.rulesNotes ? <p className="text-sm font-semibold text-amber-900">Rules note: {row.rulesNotes}</p> : null}
              <span className={`w-fit rounded-full px-2 py-1 text-xs font-bold ${view.tone}`}>{view.label}</span>
              <label className="text-xs font-bold text-slate-500">Decision
                <select name="approval" defaultValue={row.approval} className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm">
                  <option value="approved">Approved</option>
                  <option value="ava_review">Ava Review Required</option>
                  <option value="university_approval">University Approval Required</option>
                  <option value="jason_review">Jason Review Required</option>
                  <option value="not_permitted">Not Permitted</option>
                  <option value="needs_research">Needs Research</option>
                </select>
              </label>
              <textarea name="reviewNote" rows={2} placeholder="What should the intern do next?" className="rounded-xl border px-3 py-2 text-sm" />
              <button className="w-fit rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-bold !text-white">Save review</button>
            </form>
          );
        }) : <p className="mt-2 text-sm font-semibold text-slate-500">No campus ideas are waiting.</p>}
      </section>

      <section className={`${DESK_UI.card} p-4`} id="leads">
        <h2 className="text-lg font-black text-[#0F2744]">Campus leads</h2>
        {leads.length ? (
          <ul className="mt-3 space-y-2">
            {leads.map((lead) => (
              <li key={lead.id} className="rounded-xl bg-[#F8FAFC] px-3 py-2 text-sm">
                <p className="font-black text-[#0F2744]">{lead.name}</p>
                <p className="font-semibold text-slate-600">{lead.type} · {lead.organization || "No organization"} · {lead.status}</p>
              </li>
            ))}
          </ul>
        ) : <p className="mt-2 text-sm font-semibold text-slate-500">No campus leads yet.</p>}
      </section>

      {cards.map((card) => (
        <section key={card.internId} id={`mission-${card.internId}`} className={`${DESK_UI.card} p-4`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            Campus mission for <InternName name={card.internName} src={card.avatarUrl} />
          </h2>
          <p className="text-sm font-semibold text-slate-500">{card.campusName}. This uses the existing assignment, Planner, SharePoint, and Teams path.</p>
          <form action={createCampusMission} className="mt-3 grid gap-2">
            <input type="hidden" name="internId" value={card.internId} />
            <input name="title" required placeholder="Mission title" className="min-h-11 rounded-xl border px-3 text-sm" />
            <input type="date" name="dueOn" required className="min-h-11 rounded-xl border px-3 text-sm" />
            <textarea name="description" required minLength={3} rows={3} placeholder="What should this campus learn or test?" className="rounded-xl border px-3 py-2 text-sm" />
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="text-xs font-bold text-slate-500">Teams lane
                <select name="lane" className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm">
                  <option value="strategy">Growth and Strategy</option>
                  <option value="creative">Content and Social</option>
                  <option value="coaching">Intern Projects</option>
                  <option value="outreach">Partnerships and Community</option>
                  <option value="results">Analytics and Results</option>
                </select>
              </label>
              <label className="text-xs font-bold text-slate-500">Creative freedom
                <select name="freedom" defaultValue="Explore" className="mt-1 min-h-11 w-full rounded-xl border px-3 text-sm">
                  <option>Explore</option>
                  <option>Guided</option>
                  <option>Directed</option>
                </select>
              </label>
            </div>
            <fieldset className="flex flex-wrap gap-2 text-xs font-bold text-slate-600">
              {CAMPUS_PHASES.map((phase) => (
                <label key={phase} className="rounded-full bg-[#F8FAFC] px-3 py-2"><input type="checkbox" name="phase" value={phase} className="mr-1" />{phase}</label>
              ))}
            </fieldset>
            <div className="flex flex-wrap gap-2">
              <button name="intent" value="draft" className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold">Save draft</button>
              <button name="intent" value="create" className="rounded-full bg-[#2563EB] px-4 py-2 text-sm font-bold !text-white">Publish mission</button>
            </div>
          </form>
          <ul className="mt-3 space-y-1 text-sm font-semibold text-slate-600">
            {missions.filter((row) => row.internId === card.internId).map((row) => (
              <li key={row.id}><Link href={`/manager/assignments/${row.id}`} className="text-[#2563EB]">{row.title}</Link> · {row.status === "draft" ? "Draft, hidden from intern" : row.status}</li>
            ))}
          </ul>
        </section>
      ))}

      <section className={`${DESK_UI.card} p-4`}>
        <h2 className="text-lg font-black text-[#0F2744]">Coaching prompts</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-600">
          {CAMPUS_COACHING_PROMPTS.map((prompt) => <li key={prompt}>{prompt}</li>)}
        </ul>
        <div className="mt-3 flex flex-wrap gap-3 text-sm font-bold text-[#2563EB]">
          <Link href="/manager/assignments">Open assignments</Link>
          <Link href="/manager/growth">Open Growth and Strategy</Link>
          <Link href="/manager/resources">Open project files</Link>
          <Link href="/intern/help/campus-growth-manager">Campus Growth help</Link>
        </div>
      </section>
    </div>
  );
}
