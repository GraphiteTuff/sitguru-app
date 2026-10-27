import Link from "next/link";

const SYSTEMS = [
  ["SitGuru Messaging", "Day-to-day team chat and community conversations. Internal notes stay with the team."],
  ["Microsoft Teams", "Meetings, video, and screen sharing. Routine chat stays in SitGuru."],
  ["Microsoft Planner", "Assignments, owners, priorities, deadlines, and Results & Learning."],
  ["SharePoint", "Official shared files, assets, research, and event materials."],
  ["Growth Workspace", "Campaigns, events, experiments, and what the business learned."],
  ["Intern Portal", "The academic record: hours, evidence, weekly reports, and the final project."],
  ["Manager's Desk", "The assigned intern team: coaching, reviews, and pace."],
  ["Timekeeper", "Official hours after they are submitted, reviewed, and approved."],
] as const;

const DECISIONS = [
  ["You decide", "Routine content, intern assignments, surveys, event plans, and experiments inside approved resources."],
  ["Tell the founder", "A material change in direction, a new resource need, reputational risk, or a partnership worth executive awareness."],
  ["Founder approval", "Paid spend, contracts, binding partnerships, personnel decisions, legal or policy statements, and formal university approvals."],
] as const;

const FIRST_MONTH = [
  ["Days 1–3", "Learn SitGuru, the systems, and the intern program."],
  ["Days 4–10", "Growth discovery: journey, social, events, Ambassadors, and market questions."],
  ["Days 11–14", "Choose what to test. Put the executable work in Planner."],
  ["Weeks 3–4", "Run one meaningful test and adjust from the result."],
] as const;

const WORKSTREAMS = [
  ["/admin/growth/content", "Social & Content"],
  ["/admin/growth/events", "Events"],
  ["/admin/growth/partners", "Partnerships"],
  ["/intern/manage", "Intern leadership"],
  ["/admin/growth/campaigns", "Campaigns"],
  ["/admin/growth/analytics", "Learning"],
] as const;

export default function GrowthOperatingGuide() {
  return (
    <section className="grid gap-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {WORKSTREAMS.map(([href, label]) => (
          <Link key={href} href={href} className="flex min-h-14 items-center justify-center rounded-2xl border border-emerald-100 bg-white px-3 text-center text-sm font-black text-emerald-950">
            {label}
          </Link>
        ))}
      </div>
      <div className="grid gap-3 lg:grid-cols-3">
        {DECISIONS.map(([title, detail]) => (
          <article key={title} className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
            <h2 className="font-black text-slate-950">{title}</h2>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
          </article>
        ))}
      </div>
      <article className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
        <h2 className="font-black text-slate-950">Where the work belongs</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SYSTEMS.map(([name, detail]) => (
            <li key={name} className="rounded-2xl bg-[#FAF6EE] px-3 py-3">
              <p className="font-black text-slate-950">{name}</p>
              <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{detail}</p>
            </li>
          ))}
        </ul>
      </article>
      <article className="rounded-[1.4rem] border border-emerald-100 bg-white p-4">
        <h2 className="font-black text-slate-950">First 30 days</h2>
        <p className="mt-1 text-sm font-semibold text-slate-600">This is a guide, not a second task list. Executable work goes in Planner.</p>
        <ol className="mt-3 grid gap-2 sm:grid-cols-2">
          {FIRST_MONTH.map(([when, detail]) => (
            <li key={when} className="rounded-2xl bg-emerald-50 px-3 py-3">
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">{when}</p>
              <p className="mt-1 text-sm font-semibold text-slate-800">{detail}</p>
            </li>
          ))}
        </ol>
      </article>
    </section>
  );
}
