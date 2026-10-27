import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BarChart3,
  CheckCircle2,
  Megaphone,
  MousePointerClick,
  PawPrint,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  submitFridayReportAction,
  updateGrowthCampaignStatusAction,
  updateGrowthContentStatusAction,
  saveGrowthMediaAction,
} from "@/lib/admin/growth/actions";
import { contentStatusActions, contentStatusLabel } from "@/lib/internship/content-flow";
import {
  GROWTH_CAMPAIGN_STATUSES,
  GROWTH_CREATE_KINDS,
} from "@/lib/admin/growth/constants";
import {
  getGrowthCampaign,
  getGrowthHomeStats,
  listGrowthCampaigns,
  listGrowthContent,
  listGrowthMedia,
  listPromotableEvents,
  listPromotableGurus,
  listPromotablePartners,
} from "@/lib/admin/growth/data";
import {
  listGrowthEventResults,
  listGrowthIntelligence,
} from "@/lib/admin/growth/outcomes";
import {
  growthHref,
  type GrowthWorkplaceAccess,
} from "@/lib/admin/growth/workplace";
import CopyLinkButton from "@/components/admin/growth/CopyLinkButton";
import GrowthWorkForm from "@/components/admin/growth/GrowthWorkForm";
import GrowthEventResultsForm from "@/components/admin/growth/GrowthEventResultsForm";
import GrowthIntelligenceForm from "@/components/admin/growth/GrowthIntelligenceForm";
import PromoteList from "@/components/admin/growth/PromoteList";
import {
  GrowthCard,
  GrowthPageFrame,
  GrowthPrimaryLink,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";

export async function GrowthCreateScreen({
  workplace,
  searchParams,
}: {
  workplace: GrowthWorkplaceAccess;
  searchParams?: {
    type?: string;
    title?: string;
    market?: string;
    dest?: string;
    href?: string;
  };
}) {
  const query = searchParams || {};
  const type = query.type || "post";
  const base = workplace.basePath;

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title="Tracking link"
      detail="Create a measurable destination for a campaign or promotion. Write captions and run production in Canva / CapCut / Meta / TikTok via Planner. Routine posts do not require Founder approval — escalate only paid ads, major spend, sensitive messaging, or CEO-level decisions."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {GROWTH_CREATE_KINDS.map((kind) => (
          <Link
            key={kind.value}
            href={growthHref(base, `/create?type=${kind.value}`)}
            className={`rounded-2xl border p-4 ${
              type === kind.value
                ? "border-emerald-700 bg-emerald-50"
                : "border-emerald-100 bg-white"
            }`}
          >
            <p className="font-black text-slate-950">{kind.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-600">{kind.detail}</p>
          </Link>
        ))}
      </div>

      <GrowthCard>
        <GrowthWorkForm
          basePath={base}
          defaultKind={type}
          defaultTitle={query.title || ""}
          defaultMarket={query.market || ""}
          defaultDestination={query.dest || ""}
          sourceHref={query.href || ""}
        />
      </GrowthCard>
    </GrowthPageFrame>
  );
}

export async function GrowthContentScreen({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const items = await listGrowthContent();
  const base = workplace.basePath;

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title="Content inventory"
      detail="SitGuru stores captions and tracking destinations for measurement. Production workflow (Ideas → In Progress → Ava Review → Jason Approval when required → Scheduled → Results & Learning) lives in Microsoft Planner — not a second task board here."
      action={<GrowthPrimaryLink href={growthHref(base, "/create")}>Tracking link</GrowthPrimaryLink>}
    >
      <div className="space-y-3">
        {items.map((item) => (
          <GrowthCard key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
              <StatusPill value={contentStatusLabel(item.status)} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {item.platform} · {item.audience}
              {item.plannedDate ? ` · ${item.plannedDate}` : ""}
            </p>
            {item.caption ? (
              <p className="mt-3 text-sm font-semibold leading-6 text-slate-700">
                {item.caption}
              </p>
            ) : null}
            <form action={updateGrowthContentStatusAction} className="mt-4 grid gap-2 sm:grid-cols-2">
              <input type="hidden" name="id" value={item.id} />
              {contentStatusActions({
                status: item.status,
                actor: workplace.actor.kind === "intern"
                  ? "intern"
                  : workplace.actor.isSuperUser
                    ? "supervisor"
                    : "manager",
              }).map((action) => (
                <button
                  key={action.status}
                  name="status"
                  value={action.status}
                  className="min-h-12 rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-950"
                >
                  {action.label}
                </button>
              ))}
            </form>
            {item.status === "Approved" || item.status === "Ready" || item.status === "Ready to Publish" ? (
              <p className="mt-2 text-xs font-semibold text-slate-500">
                Approved posts can be marked ready, then published. Results stay a separate step.
              </p>
            ) : null}
          </GrowthCard>
        ))}
        {items.length === 0 ? (
          <GrowthCard>
            <p className="font-semibold text-slate-600">
              Nothing on the calendar yet. Create a post from Home.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}

export async function GrowthCampaignsScreen({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const campaigns = await listGrowthCampaigns();
  const base = workplace.basePath;

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title="Campaign outcomes"
      detail="Track destinations, status, and acquisition impact. Creative production, checklists, and review stages stay in Planner. Don’t count a result SitGuru can’t verify."
      action={<GrowthPrimaryLink href={growthHref(base, "/create")}>Tracking link</GrowthPrimaryLink>}
    >
      <div className="space-y-3">
        {campaigns.map((campaign) => (
          <GrowthCard key={campaign.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={growthHref(base, `/campaigns/${campaign.id}`)}
                    className="text-lg font-black text-slate-950"
                  >
                    {campaign.name}
                  </Link>
                  <StatusPill value={campaign.status} />
                </div>
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  {campaign.channelLabel}
                  {campaign.market ? ` · ${campaign.market}` : ""}
                </p>
                <p className="mt-2 break-all text-xs font-semibold text-emerald-800">
                  {campaign.trackingUrl}
                </p>
              </div>
              <CopyLinkButton value={campaign.trackingUrl} />
            </div>
          </GrowthCard>
        ))}
        {campaigns.length === 0 ? (
          <GrowthCard>
            <p className="font-semibold text-slate-600">
              No campaigns yet. Create a Guru or Pet Parent post to get a link.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}

export async function GrowthCampaignDetailScreen({
  workplace,
  id,
}: {
  workplace: GrowthWorkplaceAccess;
  id: string;
}) {
  const campaign = await getGrowthCampaign(id);
  if (!campaign) notFound();

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title={campaign.name}
      detail="Copy this link into Instagram, Facebook, TikTok, or a Facebook group. SitGuru records the click."
    >
      <GrowthCard>
        <div className="flex flex-wrap items-center gap-2">
          <StatusPill value={campaign.status} />
          <span className="text-sm font-semibold text-slate-600">
            {campaign.channelLabel}
            {campaign.market ? ` · ${campaign.market}` : ""}
          </span>
        </div>
        <p className="mt-4 break-all text-sm font-black text-emerald-900">
          {campaign.trackingUrl}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <CopyLinkButton value={campaign.trackingUrl} />
          <Link
            href={campaign.destination}
            className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900"
          >
            Open destination
          </Link>
        </div>
        {campaign.notes ? (
          <p className="mt-4 text-sm font-semibold leading-6 text-slate-600">
            {campaign.notes}
          </p>
        ) : null}
      </GrowthCard>

      <GrowthCard>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
          Status
        </p>
        <form action={updateGrowthCampaignStatusAction} className="mt-3 flex flex-wrap gap-2">
          <input type="hidden" name="id" value={campaign.id} />
          {GROWTH_CAMPAIGN_STATUSES.map((status) => (
            <button
              key={status}
              name="status"
              value={status}
              className="min-h-11 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-black capitalize text-emerald-950"
            >
              {status}
            </button>
          ))}
        </form>
      </GrowthCard>
    </GrowthPageFrame>
  );
}

export async function GrowthPromoteScreen({
  workplace,
  kind,
}: {
  workplace: GrowthWorkplaceAccess;
  kind: "guru" | "event" | "partner";
}) {
  const [items, eventResults] = await Promise.all([
    kind === "guru"
      ? listPromotableGurus()
      : kind === "event"
        ? listPromotableEvents()
        : listPromotablePartners(),
    kind === "event" ? listGrowthEventResults(8) : Promise.resolve([]),
  ]);

  const copy =
    kind === "guru"
      ? {
          title: "Gurus",
          detail:
            "Public profiles only. Spotlight tracking links for measurement — creative production stays in Canva/Planner.",
          empty: "No public Gurus are ready to promote yet.",
        }
      : kind === "event"
        ? {
            title: "Community & Events",
            detail:
              workplace.kind === "intern"
                ? "Event preparation lives in Planner. Managers record acquisition results in SitGuru."
                : "Planner covers tent prep. SitGuru records leads, QR scans, registrations, follow-ups, and lessons — phone-friendly for event day.",
            empty: "No published events yet. Add one in Community Events, then come back here.",
          }
        : {
            title: "Partners",
            detail: "Approved local businesses only. Marketing copy and tracking links — no payouts.",
            empty: "No active partners to spotlight yet.",
          };

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title={copy.title}
      detail={copy.detail}
      action={
        kind === "event" && workplace.kind !== "intern" ? (
          <GrowthPrimaryLink href="#record-results">
            Record results
          </GrowthPrimaryLink>
        ) : undefined
      }
    >
      <PromoteList
        items={items}
        kind={kind}
        empty={copy.empty}
        basePath={workplace.basePath}
        showEventDayActions={kind === "event" && workplace.kind !== "intern"}
      />

      {kind === "event" && workplace.kind !== "intern" ? (
        <>
          <GrowthCard id="record-results">
            <h2 className="text-lg font-black text-slate-950">
              Record event results
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              Optional CRM lead entry remains available for contact follow-up.
              This form stores the business outcome for Results & Learning.
            </p>
            <div className="mt-4">
              <GrowthEventResultsForm />
            </div>
            <Link
              href="/admin/sales-marketing/lead-entry"
              className="mt-4 inline-flex min-h-11 items-center text-sm font-black text-emerald-800"
            >
              Open lead entry (CRM) →
            </Link>
          </GrowthCard>

          <GrowthCard>
            <h2 className="text-lg font-black text-slate-950">
              Recent event outcomes
            </h2>
            <div className="mt-3 space-y-3">
              {eventResults.map((result) => (
                <article
                  key={result.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="break-words font-black text-slate-950">
                    {result.eventName}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {result.totalLeads} leads · {result.totalRegistrations} regs ·{" "}
                    {result.conversionRate} · leads {result.leadsMetricSource}
                  </p>
                  {result.lessonsLearned ? (
                    <p className="mt-2 text-sm font-semibold text-slate-700">
                      {result.lessonsLearned}
                    </p>
                  ) : null}
                  {result.recommendedNextAction ? (
                    <p className="mt-1 text-sm font-semibold text-emerald-900">
                      Next: {result.recommendedNextAction}
                    </p>
                  ) : null}
                </article>
              ))}
              {eventResults.length === 0 ? (
                <p className="text-sm font-semibold text-slate-500">
                  No event results recorded yet.
                </p>
              ) : null}
            </div>
          </GrowthCard>
        </>
      ) : null}
    </GrowthPageFrame>
  );
}

export async function GrowthIntelligenceScreen({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const entries = await listGrowthIntelligence(20);
  const base = workplace.basePath;

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title="Growth Intelligence"
      detail="Surveys, polls, and market tests: capture findings and recommendations. Drafting and distribution stay in Teams + Planner. Discuss results in the Analytics and Results channel."
      action={
        <GrowthPrimaryLink href={growthHref(base, "/analytics")}>
          Analytics
        </GrowthPrimaryLink>
      }
    >
      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">
          Record insight
        </h2>
        <div className="mt-4">
          <GrowthIntelligenceForm />
        </div>
      </GrowthCard>

      <div className="space-y-3">
        {entries.map((entry) => (
          <GrowthCard key={entry.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="break-words text-lg font-black text-slate-950">
                {entry.title}
              </h2>
              <StatusPill value={entry.studyType} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {entry.audience || "Audience TBD"}
              {entry.responseCount ? ` · ${entry.responseCount} responses` : ""}
              {entry.testedOn ? ` · ${entry.testedOn}` : ""}
            </p>
            {entry.keyFinding ? (
              <p className="mt-3 text-sm font-semibold text-slate-700">
                <span className="font-black text-slate-950">Finding:</span>{" "}
                {entry.keyFinding}
              </p>
            ) : null}
            {entry.recommendation ? (
              <p className="mt-2 text-sm font-semibold text-emerald-900">
                <span className="font-black">Recommend:</span>{" "}
                {entry.recommendation}
              </p>
            ) : null}
            {entry.actionTaken ? (
              <p className="mt-2 text-sm font-semibold text-slate-600">
                <span className="font-black text-slate-950">Action:</span>{" "}
                {entry.actionTaken}
              </p>
            ) : null}
          </GrowthCard>
        ))}
        {entries.length === 0 ? (
          <GrowthCard>
            <p className="font-semibold text-slate-600">
              No intelligence entries yet. Capture the first Test → Learn →
              Recommend chain above.
            </p>
          </GrowthCard>
        ) : null}
      </div>
    </GrowthPageFrame>
  );
}

export async function GrowthMediaScreen({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const items = await listGrowthMedia();

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title="Media"
      detail="Drop Canva or CapCut links here. SitGuru does not publish to Instagram — you still post in Meta and TikTok."
    >
      <GrowthCard>
        <form action={saveGrowthMediaAction} className="grid gap-3 sm:grid-cols-2">
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Title
            </span>
            <input
              name="title"
              required
              placeholder="Kyra Reel cover"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Canva / CapCut / Drive link
            </span>
            <input
              name="source"
              required
              placeholder="https://www.canva.com/..."
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Type
            </span>
            <select
              name="proofType"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            >
              <option>Reel</option>
              <option>Story</option>
              <option>Graphic</option>
              <option>Photo</option>
              <option>Link</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Use for
            </span>
            <input
              name="campaignUse"
              placeholder="Guru spotlight"
              className="mt-2 min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-sm font-semibold"
            />
          </label>
          <button
            type="submit"
            className="min-h-12 rounded-2xl px-4 text-sm font-black text-white sm:col-span-2"
            style={{ background: "#0D5C3A" }}
          >
            Save asset
          </button>
        </form>
      </GrowthCard>

      <div className="space-y-3">
        {items.map((item) => (
          <GrowthCard key={item.id}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
              <StatusPill value={item.status} />
            </div>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {item.proofType}
              {item.campaignUse ? ` · ${item.campaignUse}` : ""}
            </p>
            {item.source ? (
              <a
                href={item.source}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex min-h-11 items-center text-sm font-black text-emerald-800"
              >
                Open link →
              </a>
            ) : null}
          </GrowthCard>
        ))}
      </div>
    </GrowthPageFrame>
  );
}

export async function GrowthAnalyticsScreen({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const [stats, campaigns] = await Promise.all([
    getGrowthHomeStats(),
    listGrowthCampaigns(),
  ]);

  const kpis = [
    { label: "Pet Parents", value: String(stats.petParents), helper: "New this week", tone: "emerald" as const, icon: <PawPrint size={18} />, trend: stats.trends.petParents },
    { label: "Gurus", value: String(stats.gurus), helper: "New this week", tone: "sky" as const, icon: <Users size={18} />, trend: stats.trends.gurus },
    { label: "Ambassadors", value: String(stats.ambassadors), helper: "New this week", tone: "violet" as const, icon: <Users size={18} />, trend: stats.trends.ambassadors },
    { label: "Referrals", value: String(stats.referrals), helper: "Links used", tone: "amber" as const, icon: <MousePointerClick size={18} />, trend: stats.trends.referrals },
    { label: "Social visits", value: String(stats.visits), helper: "Clicks + views", tone: "sky" as const, icon: <Megaphone size={18} />, trend: stats.trends.visits },
    { label: "Registrations", value: String(stats.signups), helper: "Attributed", tone: "emerald" as const, icon: <CheckCircle2 size={18} />, trend: stats.trends.signups },
    { label: "Conversion", value: String(stats.conversion), helper: "Signups ÷ visits", tone: "slate" as const, icon: <BarChart3 size={18} />, trend: stats.trends.conversion },
  ];

  return (
    <GrowthPageFrame
      variant={workplace.kind === "admin" ? "green" : "desk"}
      kicker={workplace.kind === "intern" ? "Intern portal · Growth workplace" : undefined}
      title="Analytics / Results"
      detail={
        workplace.kind === "intern"
          ? "Activity is not a result. Report signups and attributed visits separately from followers. Jason verifies KPI claims. Discuss interpretation in Teams — store metrics here."
          : "Business scoreboard: signups, not followers. County density stays on the Market Growth map. Discuss findings in the Teams Analytics and Results channel."
      }
    >
      <section className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 xl:grid-cols-4">
        {kpis.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
            trend={tile.trend}
            className="min-w-0 break-words [&_p.text-3xl]:text-2xl sm:[&_p.text-3xl]:text-3xl"
          />
        ))}
      </section>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Campaigns</h2>
        <div className="mt-3 space-y-2">
          {campaigns.slice(0, 8).map((campaign) => (
            <div
              key={campaign.id}
              className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-3"
            >
              <div>
                <p className="font-black text-slate-950">{campaign.name}</p>
                <p className="text-xs font-semibold text-slate-500">
                  {campaign.channelLabel}
                </p>
              </div>
              <StatusPill value={campaign.status} />
            </div>
          ))}
        </div>
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Weekly check-in</h2>
        {workplace.kind === "intern" ? (
          <>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              One check-in covers this week. It is the same form as your intern portal, including what you learned and the report section you advanced.
            </p>
            <Link
              href="/intern?tab=home#checkin"
              className="mt-4 inline-flex min-h-12 items-center rounded-2xl px-4 text-sm font-black text-white"
              style={{ background: "#0D5C3A" }}
            >
              Open weekly check-in
            </Link>
          </>
        ) : (
          <>
        <p className="mt-1 text-sm font-semibold text-slate-600">
          Ava and Jason can still note the marketing week here. Interns use the portal check-in instead of a second report.
        </p>
        <form action={submitFridayReportAction} className="mt-4 space-y-3">
          <input
            name="weekLabel"
            defaultValue="This week"
            className="min-h-12 w-full rounded-2xl border border-emerald-100 px-4 text-base font-semibold"
          />
          <textarea
            name="posts"
            required
            rows={3}
            placeholder="Posts / Reels / Stories this week"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-base font-semibold"
          />
          <textarea
            name="best"
            rows={2}
            placeholder="Best campaign"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-base font-semibold"
          />
          <textarea
            name="worst"
            rows={2}
            placeholder="Worst campaign / blocker"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-base font-semibold"
          />
          <textarea
            name="next"
            required
            rows={3}
            placeholder="Next week — 3 bullets"
            className="w-full rounded-2xl border border-emerald-100 px-4 py-3 text-base font-semibold"
          />
          <button
            type="submit"
            className="min-h-12 w-full rounded-2xl text-sm font-black text-white sm:w-auto sm:px-6"
            style={{ background: "#0D5C3A" }}
          >
            Save team note
          </button>
        </form>
          </>
        )}
      </GrowthCard>
    </GrowthPageFrame>
  );
}
