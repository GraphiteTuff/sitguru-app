import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  BookOpenCheck,
  FileText,
  Handshake,
  MessageCircle,
  MessageCircleQuestion,
  PawPrint,
  ShieldAlert,
  Sparkles,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  AdminWorkplaceActions,
  AdminWorkplaceDenied,
  AdminWorkplaceHealth,
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getInsightsDashboardData,
  type InsightsRecentItem,
} from "@/lib/admin/insights/dashboard";

export const dynamic = "force-dynamic";

const routes = {
  dashboard: "/admin",
  chat: "/admin/insights/chat",
  analytics: "/admin/analytics",
  customerIntelligence: "/admin/petparents",
  petAnalytics: "/admin/pet-analytics",
  messages: "/admin/messages",
  support: "/admin/support",
  moderation: "/admin/moderation",
  help: "/help",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(
    Number.isFinite(value) ? value : 0,
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function RecentList({
  title,
  subtitle,
  href,
  items,
  emptyTitle,
  emptyDetail,
}: {
  title: string;
  subtitle: string;
  href: string;
  items: InsightsRecentItem[];
  emptyTitle: string;
  emptyDetail: string;
}) {
  return (
    <GrowthCard className="min-w-0">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">{title}</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">{subtitle}</p>
        </div>
        <Link href={href} className="text-sm font-black text-emerald-800">
          Open →
        </Link>
      </div>
      <div className="mt-4 grid min-w-0 gap-3">
        {items.length ? (
          items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="line-clamp-2 font-black text-slate-950">
                    {item.title}
                  </p>
                  <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                    {item.subtitle}
                  </p>
                </div>
                <StatusPill value={item.status} />
              </div>
              <p className="mt-3 text-xs font-bold text-slate-500">
                {formatDate(item.date)}
              </p>
            </Link>
          ))
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <p className="font-black text-slate-950">{emptyTitle}</p>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              {emptyDetail}
            </p>
          </div>
        )}
      </div>
    </GrowthCard>
  );
}

export default async function AdminInsightsHubPage() {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return (
      <AdminWorkplaceDenied
        title="Admin access required."
        detail="Sign in with an authorized SitGuru admin account to open Insights."
      />
    );
  }

  const data = await getInsightsDashboardData();
  const healthy = data.sourceHealth.filter((source) => source.ok).length;
  const hasWork =
    data.metrics.openLeakVectors > 0 || data.metrics.frictionFlags > 0;

  const tiles = [
    {
      label: "Communications",
      value: number(data.metrics.communications),
      helper: "Weighted question tally",
      tone: "emerald" as const,
      icon: <MessageCircleQuestion size={18} />,
    },
    {
      label: "Friction flags",
      value: number(data.metrics.frictionFlags),
      helper: "Conversion risk signals",
      tone: "amber" as const,
      icon: <AlertTriangle size={18} />,
    },
    {
      label: "Leak vectors",
      value: number(data.metrics.openLeakVectors),
      helper: "Unconverted · 2×+",
      tone: "rose" as const,
      icon: <AlertTriangle size={18} />,
    },
    {
      label: "Converted",
      value: number(data.metrics.convertedArticles),
      helper: "Promoted to Help Center",
      tone: "sky" as const,
      icon: <BookOpenCheck size={18} />,
    },
    {
      label: "Chat ledger",
      value: number(data.metrics.insightRows),
      helper: "Omnichannel questions",
      tone: "violet" as const,
      icon: <MessageCircle size={18} />,
    },
    {
      label: "Help articles",
      value: number(data.metrics.helpArticles),
      helper: "Published answers",
      tone: "emerald" as const,
      icon: <BookOpenCheck size={18} />,
    },
    {
      label: "Support cases",
      value: number(data.metrics.supportCases),
      helper: "support@sitguru.com",
      tone: "slate" as const,
      icon: <Handshake size={18} />,
    },
    {
      label: "Top category",
      value:
        data.topCategory === "—" ? "—" : number(data.topCategoryCount),
      helper: data.topCategory,
      tone: "sky" as const,
      icon: <Sparkles size={18} />,
    },
  ];

  const actions = [
    {
      href: routes.chat,
      label: "Chat ledger",
      detail: `${number(data.metrics.insightRows)} questions to review`,
      icon: MessageCircleQuestion,
      primary: hasWork,
    },
    {
      href: routes.help,
      label: "Help Center",
      detail: `${number(data.metrics.helpArticles)} published articles`,
      icon: BookOpenCheck,
    },
    {
      href: routes.messages,
      label: "Messages",
      detail: `${number(data.metrics.messages)} marketplace threads`,
      icon: MessageCircle,
    },
    {
      href: routes.support,
      label: "Support",
      detail: `${number(data.metrics.supportCases)} intake cases`,
      icon: Handshake,
    },
    {
      href: routes.moderation,
      label: "Moderation",
      detail: "Trust and community flags",
      icon: ShieldAlert,
    },
    {
      href: routes.analytics,
      label: "Analytics",
      detail: "Growth, bookings, and campaigns",
      icon: Activity,
    },
    {
      href: routes.customerIntelligence,
      label: "Pet Parents",
      detail: "Cohorts, retention, bookings",
      icon: Users,
    },
    {
      href: routes.petAnalytics,
      label: "Pet analytics",
      detail: "Species mix and care demand",
      icon: PawPrint,
    },
  ];

  return (
    <GrowthPageFrame
      kicker="Insights Workplace"
      title="Turn chat friction into Help Center answers."
      detail="Detect repeat questions, convert them into published answers, then reuse those replies in messages and support."
      action={
        <Link
          href={routes.chat}
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <MessageCircleQuestion size={17} />
          Open chat ledger
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href={routes.dashboard}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          Admin HQ
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
        <StatusPill value={data.isLive ? "Live" : "Preview"} />
      </div>

      <section className="grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
          />
        ))}
      </section>

      <AdminWorkplaceActions actions={actions} />

      <section className="grid min-w-0 gap-4 xl:grid-cols-3">
        <RecentList
          title="Top friction"
          subtitle="Highest-tally friction or demand questions."
          href={routes.chat}
          items={data.topFriction}
          emptyTitle="No friction signals yet"
          emptyDetail="Homepage, walk, and support questions will land here."
        />
        <RecentList
          title="Conversion leak queue"
          subtitle="Unconverted questions seen 2× or more."
          href={routes.chat}
          items={data.leakQueue}
          emptyTitle="Leak queue clear"
          emptyDetail="No open high-frequency leak vectors right now."
        />
        <RecentList
          title="Recently converted"
          subtitle="Insights promoted into Help Center articles."
          href={routes.help}
          items={data.recentConverted}
          emptyTitle="No conversions yet"
          emptyDetail="Use Convert on the Chat Ledger to publish answers."
        />
      </section>

      <GrowthCard className="min-w-0">
        <div className="min-w-0">
          <h2 className="text-lg font-black text-slate-950">
            Insights operating notes
          </h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            Detect friction, publish the answer, then reuse it in support.
          </p>
        </div>
        <div className="mt-4 grid min-w-0 gap-3 md:grid-cols-3">
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">Friction first</p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Convert flagged questions before vanity FAQ volume.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">
              Convert with consent tone
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              Help articles stay clear and calm — no booking or earnings promises.
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-950">
              Close the loop
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">
              After publishing, update support macros so teams reuse the same answer.
            </p>
          </div>
        </div>
      </GrowthCard>

      <AdminWorkplaceHealth
        sources={data.sourceHealth}
        helper={`${healthy} of ${data.sourceHealth.length} live · ${data.isLive ? "live sources" : "preview sources"}`}
        links={
          <>
            <Link
              href={routes.chat}
              className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-900"
            >
              <FileText size={13} className="mr-1 inline" />
              Ledger
            </Link>
            <Link
              href={routes.help}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Help
            </Link>
            <Link
              href={routes.support}
              className="rounded-2xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800"
            >
              Support
            </Link>
          </>
        }
      />
    </GrowthPageFrame>
  );
}
