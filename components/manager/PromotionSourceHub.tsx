import Link from "next/link";
import LiveSocialAutoRefresh from "@/components/portal/LiveSocialAutoRefresh";
import { internDraftHref, promoCampaignHref } from "@/lib/growth-center-v2/promotion-links";
import type { PromotionOpportunity } from "@/lib/growth-center-v2/promotion-sources";

const HEADINGS = [
  { kind: "reads", title: "Reads & Listens", empty: "No published editorial picks available yet." },
  { kind: "events", title: "Upcoming events", empty: "No upcoming published events." },
  { kind: "community", title: "Community Studio", empty: "No published stories with verified social reuse permission." },
  { kind: "surveys", title: "Polls & Surveys", empty: "No currently open polls for this manager." },
  { kind: "brand", title: "Approved Brand Kit", empty: "No eligible approved graphics or videos." },
] as const;

export default function PromotionSourceHub({
  items,
  mode = "manager",
}: { items: PromotionOpportunity[]; mode?: "manager" | "intern" }) {
  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-24">
      <LiveSocialAutoRefresh intervalMs={90_000} />
      <header className="rounded-[28px] bg-[#0F2744] p-5 text-white sm:p-7">
        <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-200">SitGuru Social & Community Growth</p>
        <h1 className="mt-2 text-2xl font-black text-white sm:text-3xl">Promotion Hub</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-200">
          Turn approved SitGuru content into Facebook, Instagram, and TikTok campaigns.
          Select a source, create a tracking link, then route the creative through the existing Content Studio approval workflow.
          No content is automatically posted and no ads are purchased here.
        </p>
        <nav className="mt-4 flex flex-wrap gap-2" aria-label="Promotion workspaces">
          {(mode === "intern" ? [
            ["Create social draft", "/intern/content"],
            ["Intern Brand Kit", "/intern/toolkit"],
            ["Intern Metrics", "/intern/metrics"],
            ["Intern Live Results", "/intern/results"],
          ] : [
            ["Content Studio", "/manager/campaigns-content"],
            ["Brand Kit", "/manager/toolkit/brand"],
            ["Growth & Conversions", "/manager/conversions"],
            ["Live Results", "/manager/results"],
            ["Business Growth Report", "/manager/reports"],
          ]).map(([label, href]) => (
            <Link key={href} href={href} className="inline-flex min-h-10 items-center rounded-xl border border-white/30 px-3 text-xs font-bold text-white hover:bg-white/10">{label}</Link>
          ))}
        </nav>
      </header>

      <section className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
        <h2 className="text-base font-black text-[#0F2744]">One content workflow for Ava and the interns</h2>
        <p className="mt-1 text-sm leading-6 text-slate-700">
          Interns create and submit drafts with approved Brand Kit material. Ava reviews and approves.
          The team publishes through authorized provider workflows, records the resulting live link,
          and compares platform results with SitGuru visits, registrations, and bookings.
          TikTok sandbox tests are not public posts or verified production follower totals.
        </p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm" aria-label="Channel publishing and advertising readiness">
        <h2 className="text-base font-black text-[#0F2744]">Publishing & advertising connections</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {[
            {
              name: "Facebook",
              state: "API follower analytics connected",
              next: "Publishing and Meta Ads management require their own approved permissions and account grants.",
              href: "https://business.facebook.com/",
            },
            {
              name: "Instagram",
              state: "API follower analytics connected",
              next: "Instagram content publishing requires distinct professional-account permissions and a working media workflow.",
              href: "https://business.facebook.com/",
            },
            {
              name: "TikTok",
              state: "Sandbox analytics connected",
              next: "TikTok inbox uploads and public direct posts require separately approved posting scopes. Production app review remains necessary.",
              href: "https://developers.tiktok.com/",
            },
          ].map(channel => (
            <div key={channel.name} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <h3 className="font-black text-[#0F2744]">{channel.name}</h3>
              <p className="mt-1 text-xs font-bold text-emerald-800">{channel.state}</p>
              <p className="mt-2 text-xs leading-5 text-slate-600">{channel.next}</p>
              <a href={channel.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex text-xs font-black text-blue-700">Open provider settings</a>
            </div>
          ))}
        </div>
        <p className="mt-3 text-xs font-semibold text-slate-600">
          Content creation, scheduled approvals, campaign tracking, automatic follower snapshots, provider publishing and paid ads are separate capabilities.
          No automatic posting or ad spending is activated by opening this hub.
        </p>
      </section>

      {HEADINGS.map(group => {
        const sources = items.filter(item => item.kind === group.kind);
        return (
          <section key={group.kind} aria-label={group.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-xl font-black text-[#0F2744]">{group.title}</h2>
              <span className="text-xs font-bold text-slate-500">{sources.length} eligible sources</span>
            </div>
            {sources.length ? (
              <div className="mt-4 grid gap-3 lg:grid-cols-2">
                {sources.map(item => (
                  <article key={item.kind + "-" + item.id} className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-sky-700">{item.label}</p>
                    <h3 className="mt-1 break-words text-lg font-black text-[#0F2744]">{item.title}</h3>
                    {item.summary ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{item.summary}</p> : null}
                    <p className="mt-2 text-xs leading-5 text-slate-600">{item.reviewNote}</p>
                    <div className="mt-auto flex flex-wrap gap-2 pt-4">
                      {item.publicUrl ? (
                        <Link href={item.publicUrl} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-800">View public page</Link>
                      ) : (
                        <Link href={mode === "intern" ? "/intern/toolkit?tool=brand" : item.destination} className="inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-xs font-bold text-slate-800">View approved asset</Link>
                      )}
                      {mode === "intern" ? (
                        <Link href={internDraftHref(item)} className="inline-flex min-h-10 items-center rounded-lg bg-[#2563EB] px-3 text-xs font-black text-white">Create social draft</Link>
                      ) : item.kind !== "brand" ? (
                        <Link href={promoCampaignHref(item)} className="inline-flex min-h-10 items-center rounded-lg bg-[#2563EB] px-3 text-xs font-black text-white">Create tracked campaign</Link>
                      ) : (
                        <Link href="/manager/campaigns-content" className="inline-flex min-h-10 items-center rounded-lg bg-[#2563EB] px-3 text-xs font-black text-white">Use in Content Studio</Link>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">{group.empty}</p>
            )}
          </section>
        );
      })}
    </div>
  );
}