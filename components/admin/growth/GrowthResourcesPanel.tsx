import Link from "next/link";
import { ExternalLink, Lock } from "lucide-react";
import GrowthOneNoteShortcuts from "@/components/admin/growth/GrowthOneNoteShortcuts";
import GrowthSharePointShortcuts from "@/components/admin/growth/GrowthSharePointShortcuts";
import {
  isSitGuruWorkEmail,
  sitguruGrowthTeamsChannelLinks,
  sitguruTeamsHref,
  SITGURU_GROWTH_TEAMS_TEAM,
  SITGURU_TEAMS_CLOUD_HOME,
} from "@/lib/admin/growth/teams-access";
import {
  getGrowthResourceLinks,
  type GrowthResourceLink,
} from "@/lib/admin/growth/operating-model";

export default function GrowthResourcesPanel({
  intern = false,
  email = null,
  links,
}: {
  intern?: boolean;
  /** Viewer email — Teams shortcuts only for @sitguru.com. */
  email?: string | null;
  links?: GrowthResourceLink[];
}) {
  const showTeams = isSitGuruWorkEmail(email);
  const items = (
    links || getGrowthResourceLinks({ intern, email, includeChannels: false })
  ).filter((item) => item.id !== "teams" && !item.id.startsWith("teams-"));
  const channels = showTeams ? sitguruGrowthTeamsChannelLinks() : [];

  return (
    <div className="space-y-5 pt-4">
      <p className="text-sm font-semibold text-slate-600">
        Teams communicates. Planner manages work. SitGuru records outcomes,
        reports, and internship evidence — it does not replace channel folders.
      </p>

      {showTeams ? (
        <div className="space-y-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-100 bg-[#F0FDFA] px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-black text-[#0F2744]">
                  {SITGURU_GROWTH_TEAMS_TEAM.name}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  {SITGURU_TEAMS_CLOUD_HOME.replace("https://", "")} · discuss here,
                  files in SharePoint, results in SitGuru
                </p>
              </div>
              <a
                href={sitguruTeamsHref()}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center gap-2 rounded-2xl bg-[#0D5C3A] px-4 text-sm font-bold !text-white"
              >
                Open Teams
                <ExternalLink size={14} />
              </a>
            </div>

            <ul className="grid gap-2 sm:grid-cols-2">
              {channels.map((channel) => (
                <li
                  key={channel.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex flex-wrap items-center gap-2 text-sm font-black text-[#0F2744]">
                      {channel.label}
                      {channel.private ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
                          <Lock size={10} /> Private
                        </span>
                      ) : null}
                    </p>
                    <a
                      href={channel.href}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-sm font-bold text-[#2563EB]"
                    >
                      Open →
                    </a>
                  </div>
                  <p className="mt-1 text-xs font-medium leading-5 text-slate-500">
                    {channel.detail}
                  </p>
                </li>
              ))}
            </ul>
          </div>

          <GrowthSharePointShortcuts email={email} includeLeadership compact />
          <GrowthOneNoteShortcuts email={email} compact />
        </div>
      ) : (
        <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
          Microsoft Teams / SharePoint / OneNote open for SitGuru work accounts
          only — Ava, Jason, and Danette (@sitguru.com).
        </p>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const className =
            "flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 text-sm font-black text-emerald-950";
          const body = (
            <>
              <span className="min-w-0">
                <span className="block break-words">{item.label}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                  {item.detail}
                </span>
              </span>
              {item.external ? (
                <ExternalLink size={16} className="shrink-0 text-emerald-700" />
              ) : null}
            </>
          );
          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {body}
              </a>
            );
          }
          return (
            <Link key={item.id} href={item.href} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
