import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  Megaphone,
  Palette,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DESK_BANNER, DESK_UI } from "@/lib/portal/desk-ui";
import type { ToolkitSearchHit, ToolkitSection } from "@/lib/manager/toolkit-catalog";

const ICONS: Record<ToolkitSection["id"], LucideIcon> = {
  brand: Palette,
  campaigns: Megaphone,
  growth: TrendingUp,
  events: CalendarDays,
  interns: Users,
  company: FolderOpen,
};

export type ToolkitLiveTotals = {
  petParents: number;
  gurus: number;
  ambassadors: number;
  visits: number;
  signups: number;
  conversion: string;
};

function FeatureLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: string;
}) {
  const className = "font-bold text-[#2563EB] underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#2563EB]";
  if (external) {
    return (
      <a className={className} href={href} target="_blank" rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

export default function ManagerToolkitHome({
  sections,
  query,
  hits,
  assetError,
  stats,
  statsError,
}: {
  sections: ToolkitSection[];
  query: string;
  hits: ToolkitSearchHit[] | null;
  assetError: string;
  stats: ToolkitLiveTotals | null;
  statsError: string;
}) {
  return (
    <div className="space-y-5 pb-28 lg:pb-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1.4fr_0.8fr]">
          <div className="p-4 sm:p-5">
            <h1 className="text-2xl font-black tracking-tight text-[#0F2744] sm:text-3xl">Manager Toolkit</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
              Your workspace for creating, promoting, tracking, and growing the SitGuru community.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/manager/toolkit/brand#upload" className="inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">
                Upload Asset
              </Link>
              <Link href="/manager/create" className="inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">
                Create Campaign
              </Link>
              <Link href="/manager/resources" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-[#0F2744]">
                View Resources
              </Link>
            </div>
          </div>
          <div className="relative min-h-28">
            <img src={DESK_BANNER} alt="" className="h-full min-h-28 w-full object-cover object-center" />
          </div>
        </div>
      </section>

      <form action="/manager/toolkit" method="get" role="search">
        <label className="block">
          <span className="sr-only">Search the toolkit</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search brand assets, campaigns, resources, events, and tools..."
            className={DESK_UI.search}
          />
        </label>
      </form>

      {assetError ? (
        <p role="alert" className="rounded-2xl border border-rose-100 bg-white px-4 py-3 text-sm font-bold text-rose-700">
          {assetError}
        </p>
      ) : null}

      {hits ? (
        <section className={`${DESK_UI.card} p-4`} aria-live="polite">
          <h2 className="text-base font-black text-[#0F2744]">
            {hits.length ? `${hits.length} results` : "No matching tools or brand assets"}
          </h2>
          {hits.length ? (
            <ul className="mt-3 divide-y divide-slate-100">
              {hits.map((hit) => (
                <li key={`${hit.title}-${hit.href}`} className="py-2">
                  <FeatureLink href={hit.href} external={hit.external}>{hit.title}</FeatureLink>
                  <p className="text-xs font-medium text-slate-500">{hit.detail}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm font-medium text-slate-600">Try a brand file name, campaign, event, or tool.</p>
          )}
        </section>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sections.map((section) => {
          const Icon = ICONS[section.id];
          return (
            <article key={section.id} className={`${DESK_UI.card} flex flex-col p-4`}>
              <div className="flex items-start gap-3">
                <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                  <Icon size={20} aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-black text-[#0F2744]">{section.title}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">{section.subtitle}</p>
                </div>
              </div>
              {section.id === "growth" ? (
                <div className="mt-3 rounded-xl bg-[#F8FAFC] p-3 text-sm font-semibold text-slate-700">
                  {statsError ? (
                    <p role="alert">{statsError}</p>
                  ) : stats ? (
                    <ul className="grid grid-cols-2 gap-2">
                      <li>Pet Parents: {stats.petParents}</li>
                      <li>Gurus: {stats.gurus}</li>
                      <li>Ambassadors: {stats.ambassadors}</li>
                      <li>Visits: {stats.visits}</li>
                      <li>Signups: {stats.signups}</li>
                      <li>Conversion: {stats.conversion}</li>
                    </ul>
                  ) : (
                    <p>Live totals open on Live Results.</p>
                  )}
                  <p className="mt-2 text-xs font-medium text-slate-500">Counts come from SitGuru. Competitor research is kept separately.</p>
                </div>
              ) : null}
              <ul className="mt-4 space-y-2">
                {section.features.map((feature) => (
                  <li key={feature.label}>
                    {feature.href ? (
                      <FeatureLink href={feature.href} external={feature.external}>{feature.label}</FeatureLink>
                    ) : (
                      <p className="font-bold text-[#0F2744]">{feature.label}</p>
                    )}
                    <p className="text-xs font-medium text-slate-500">{feature.unavailable || feature.detail}</p>
                  </li>
                ))}
              </ul>
              <Link href={section.href} className="mt-4 inline-flex min-h-11 items-center text-sm font-bold text-[#2563EB]">
                Open {section.title}
              </Link>
            </article>
          );
        })}
      </section>
    </div>
  );
}
