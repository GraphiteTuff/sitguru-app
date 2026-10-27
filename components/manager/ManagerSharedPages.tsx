import Link from "next/link";
import {
  BarChart3,
  BookOpen,
  Briefcase,
  CalendarDays,
  CheckCircle2,
  FolderOpen,
  GraduationCap,
  LineChart,
  Link2,
  MessageCircle,
  Settings,
  Sparkles,
  Wrench,
} from "lucide-react";
import ManagerSectionScaffold from "@/components/manager/ManagerSectionScaffold";
import { MANAGER_ROUTES } from "@/lib/admin/growth/manager-routes";
import { DESK_UI } from "@/lib/portal/desk-ui";

export function ManagerSimpleToolsPage({
  kind,
}: {
  kind: "results" | "calendar" | "metrics" | "toolkit" | "training" | "resources" | "settings";
}) {
  const config = {
    results: {
      title: "Live Results",
      subtitle: "Track live SitGuru growth from content, campaigns, and community work.",
      icon: <LineChart size={22} />,
      overlay: "Same people. Happier pets. Bigger impact.",
      links: [
        [MANAGER_ROUTES.metrics, "Open Metrics"],
        [MANAGER_ROUTES.reports, "Open Reports"],
        [MANAGER_ROUTES.campaigns, "Campaigns"],
      ] as const,
      cards: [
        ["Due", "Check-ins to review", "Review now"],
        ["Reach", "12,450", "+28% this month"],
        ["Posts", "28", "+12% created/scheduled"],
        ["Signups", "67", "+19% attributed"],
      ] as const,
    },
    calendar: {
      title: "Calendar",
      subtitle: "Stay organized with intern deadlines, check-ins, meetings, and milestones.",
      icon: <CalendarDays size={22} />,
      overlay: "Support. Develop. Create Opportunities.",
      links: [
        [MANAGER_ROUTES.assignments, "Assignments"],
        [MANAGER_ROUTES.checkIns, "Check-Ins"],
        [MANAGER_ROUTES.milestones, "Milestones"],
      ] as const,
      cards: [
        ["Events This Week", "8", "Team + intern work"],
        ["Due This Week", "3", "Needs attention"],
        ["Meetings", "2", "1:1 and team"],
        ["Milestones", "1", "Coming up"],
      ] as const,
    },
    metrics: {
      title: "Metrics",
      subtitle: "Track impact across channels and help grow the SitGuru community.",
      icon: <BarChart3 size={22} />,
      overlay: "Real progress. Real community.",
      links: [
        [MANAGER_ROUTES.results, "Live Results"],
        [MANAGER_ROUTES.reports, "Reports"],
        [MANAGER_ROUTES.growth, "Growth Home"],
      ] as const,
      cards: [
        ["Website Visits", "2,856", "+24%"],
        ["Social Engagements", "428", "+37%"],
        ["New Signups", "67", "+19%"],
        ["Event Views", "23", "+52%"],
      ] as const,
    },
    toolkit: {
      title: "Manager Toolkit",
      subtitle: "Quick tools for Ava — brand, tracking, market snapshot, and team resources.",
      icon: <Wrench size={22} />,
      overlay: "Lead with clarity. Grow with care.",
      links: [
        [MANAGER_ROUTES.resources, "Resources"],
        [MANAGER_ROUTES.training, "Training"],
        [MANAGER_ROUTES.help, "Help"],
      ] as const,
      cards: [
        ["Brand kit", "Logo, green, drafts", "Open"],
        ["Tracking links", "Copy, then post", "Open"],
        ["Market snapshot", "Totals, no names", "Open"],
        ["Events to share", "Public pet events", "Open"],
      ] as const,
    },
    training: {
      title: "Training",
      subtitle: "Guides for managing interns, reviews, hours, and growth workflows.",
      icon: <GraduationCap size={22} />,
      overlay: "Learn. Lead. Make an impact.",
      links: [
        [MANAGER_ROUTES.toolkit, "Toolkit"],
        [MANAGER_ROUTES.resources, "Resources"],
        [MANAGER_ROUTES.help, "Help Center"],
      ] as const,
      cards: [
        ["Managing interns", "Review queue basics", "Open"],
        ["Check-ins", "How to coach weekly", "Open"],
        ["Hours approvals", "Pace and feedback", "Open"],
        ["Growth reporting", "Read Live Results", "Open"],
      ] as const,
    },
    resources: {
      title: "Resources",
      subtitle: "Files, templates, SharePoint folders, and OneNote sections for the growth team.",
      icon: <FolderOpen size={22} />,
      overlay: "Everything you need in one place.",
      links: [
        [MANAGER_ROUTES.toolkit, "Toolkit"],
        [MANAGER_ROUTES.growth, "Growth Home"],
        ["/manager/campaigns", "Campaigns"],
      ] as const,
      cards: [
        ["Brand Resources", "Logos & palette", "Open"],
        ["Templates", "Posts & briefs", "Open"],
        ["Tracking", "UTM & links", "Open"],
        ["Team folders", "SharePoint / OneNote", "Open"],
      ] as const,
    },
    settings: {
      title: "Settings",
      subtitle: "Manager portal preferences and onboarding checklist — no buried pages.",
      icon: <Settings size={22} />,
      overlay: "People grow. Pets bring us together.",
      links: [
        ["/manager/onboarding", "Onboarding"],
        [MANAGER_ROUTES.myTime, "My Time"],
        [MANAGER_ROUTES.help, "Help"],
      ] as const,
      cards: [
        ["Profile", "Name & title", "Open"],
        ["Notifications", "Message alerts", "Open"],
        ["Payments", "Pay periods", "Open"],
        ["Help", "Manager guides", "Open"],
      ] as const,
    },
  }[kind];

  return (
    <ManagerSectionScaffold
      title={config.title}
      subtitle={config.subtitle}
      overlay={config.overlay}
      icon={config.icon}
      stats={
        kind === "results" || kind === "calendar" || kind === "metrics"
          ? config.cards.map((card, index) => ({
              label: card[0],
              value: card[1],
              detail: card[2],
              tone: (["green", "violet", "amber", "sky"] as const)[index % 4],
              icon:
                index === 0 ? (
                  <CheckCircle2 size={18} />
                ) : index === 1 ? (
                  <LineChart size={18} />
                ) : index === 2 ? (
                  <Sparkles size={18} />
                ) : (
                  <CalendarDays size={18} />
                ),
            }))
          : undefined
      }
    >
      {kind === "toolkit" || kind === "training" || kind === "resources" || kind === "settings" ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {config.cards.map(([title, detail]) => (
            <article key={title} className={`${DESK_UI.card} p-4`}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                {kind === "toolkit" ? (
                  <Briefcase size={18} />
                ) : kind === "training" ? (
                  <BookOpen size={18} />
                ) : kind === "settings" ? (
                  <Settings size={18} />
                ) : (
                  <Link2 size={18} />
                )}
              </span>
              <p className="mt-3 text-sm font-black text-[#0F2744]">{title}</p>
              <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
            </article>
          ))}
        </section>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {config.links.map(([href, label]) => (
          <Link
            key={href}
            href={href}
            className="inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            {label}
          </Link>
        ))}
        {kind === "results" || kind === "metrics" ? (
          <Link
            href={MANAGER_ROUTES.messages}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#EFF6FF] px-4 text-sm font-bold text-[#1D4ED8]"
          >
            <MessageCircle size={16} /> Message Team
          </Link>
        ) : null}
      </div>
    </ManagerSectionScaffold>
  );
}
