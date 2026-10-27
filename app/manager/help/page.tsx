import Link from "next/link";
import {
  CalendarDays,
  CircleHelp,
  GraduationCap,
  Link2,
  MessageCircle,
  Share2,
  Timer,
  type LucideIcon,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import { DESK_UI } from "@/lib/portal/desk-ui";

export const dynamic = "force-dynamic";

const TOPICS = [
  {
    title: "Getting Started",
    detail: "Manager desk, team overview, and the first week.",
    tone: "bg-[#FFF1F2] text-[#BE123C]",
    items: [
      ["Open Manager Desk", "/manager"],
      ["My Team", "/manager/team"],
      ["Roles and expectations", "/manager/training"],
      ["First week checklist", "/manager/onboarding"],
    ],
  },
  {
    title: "Manager Desk",
    detail: "Check-ins, hour review, milestones, and assignments.",
    tone: "bg-[#EFF6FF] text-[#1D4ED8]",
    items: [
      ["Weekly check-in guide", "/manager/check-ins"],
      ["How to review hours", "/manager/my-time"],
      ["View assignments", "/manager/assignments"],
      ["Track milestones", "/manager/milestones"],
    ],
  },
  {
    title: "Tracking & Analytics",
    detail: "Use tracking links, read results, and understand impact.",
    tone: "bg-[#FFF7ED] text-[#C2410C]",
    items: [
      ["Create a tracking link", "/manager/metrics"],
      ["Where to view a link", "/manager/metrics"],
      ["View your results", "/manager/results"],
      ["Reports", "/manager/analytics"],
    ],
  },
  {
    title: "Social Media",
    detail: "Create, post, and grow SitGuru’s community.",
    tone: "bg-[#F5F3FF] text-[#6D28D9]",
    items: [
      ["Content workspace", "/manager/content"],
      ["Campaigns", "/manager/campaigns"],
      ["Brand and toolkit", "/manager/toolkit"],
      ["Example posts", "/manager/resources"],
    ],
  },
  {
    title: "Events & Community",
    detail: "Find events, share them, and support on-site or online.",
    tone: "bg-[#ECFDF5] text-[#047857]",
    items: [
      ["How to share events", "/manager/events"],
      ["Calendar", "/manager/calendar"],
      ["Event resources", "/manager/resources"],
    ],
  },
  {
    title: "Team & Messages",
    detail: "Talk with interns and keep notes in the desk.",
    tone: "bg-[#FDF2F8] text-[#BE185D]",
    items: [
      ["Messaging", "/manager/messages"],
      ["Ask in Teams", sitguruTeamsHref()],
      ["My Payments", "/manager/payments"],
    ],
  },
] as const;

export default async function ManagerHelpPage() {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const teams = sitguruTeamsHref();

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<CircleHelp size={22} />}
        title="Help"
        subtitle="Find answers, step-by-step guides, and everything you need on the Manager Desk."
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />

      <section>
        <h2 className="text-lg font-black text-[#0F2744]">Quick Help</h2>
        <p className="text-sm font-medium text-slate-500">Get to the most common tasks quickly.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {(
            [
              { href: "/manager/check-ins", title: "How to Check In", detail: "Review weekly check-ins", icon: Timer },
              { href: "/manager/my-time", title: "How to Log Hours", detail: "Track time for the pay period", icon: Timer },
              { href: "/manager/metrics", title: "How to Use Tracking Links", detail: "Copy, post, and measure signups", icon: Link2 },
              { href: "/manager/content", title: "How to Post on Social Media", detail: "Best practices and guidelines", icon: Share2 },
              { href: "/manager/events", title: "How to Share Events", detail: "Find and promote events", icon: CalendarDays },
              { href: "/manager/training", title: "Training", detail: "Modules, badges, and guides", icon: GraduationCap },
            ] satisfies Array<{ href: string; title: string; detail: string; icon: LucideIcon }>
          ).map((item) => (
            <Link key={item.title} href={item.href} className={`${DESK_UI.card} flex items-center gap-3 p-4`}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                <item.icon size={18} />
              </span>
              <span>
                <span className="block text-sm font-black text-[#0F2744]">{item.title} →</span>
                <span className="block text-xs font-medium text-slate-500">{item.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-[#0F2744]">Help Topics</h2>
            <p className="text-sm font-medium text-slate-500">Every topic opens a Manager Desk page. Nothing here sends you to Admin.</p>
          </div>
        </div>
        <div className="mt-3 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {TOPICS.map((topic) => (
            <article key={topic.title} className={`${DESK_UI.card} p-4`}>
              <h3 className="text-base font-black text-[#0F2744]">{topic.title}</h3>
              <p className="text-xs font-medium text-slate-500">{topic.detail}</p>
              <ul className="mt-3 space-y-1">
                {topic.items.map(([label, href]) => {
                  const external = href.startsWith("http");
                  return (
                    <li key={label}>
                      <Link
                        href={href}
                        target={external ? "_blank" : undefined}
                        rel={external ? "noreferrer" : undefined}
                        className="block rounded-xl px-2 py-2 text-sm font-semibold text-slate-700 hover:bg-[#F8FAFC]"
                      >
                        · {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 lg:col-span-1`}>
          <h2 className="text-lg font-black text-[#0F2744]">Frequently Asked Questions</h2>
          <ul className="mt-3 divide-y divide-slate-100 text-sm font-semibold text-[#0F2744]">
            {[
              ["How do I review a weekly check-in?", "/manager/check-ins"],
              ["How do I log my hours?", "/manager/my-time"],
              ["Where do I find a tracking link?", "/manager/metrics"],
              ["What type of content should we post?", "/manager/content"],
              ["How do I share an event?", "/manager/events"],
            ].map(([q, href]) => (
              <li key={q}>
                <Link href={href} className="flex items-center justify-between py-3">
                  {q} <span>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-lg font-black text-[#0F2744]">Need More Help?</h2>
          <div className="mt-3 grid gap-2">
            <a href={teams} className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-sm font-bold text-[#6D28D9]">Ask a Question in Teams →</a>
            <Link href="/manager/messages" className="rounded-2xl bg-[#ECFDF5] px-3 py-3 text-sm font-bold text-[#047857]">Message the team →</Link>
            <Link href="/manager" className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-sm font-bold text-[#1D4ED8]">Back to Manager Desk →</Link>
          </div>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="inline-flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <MessageCircle size={18} /> Helpful Pages
          </h2>
          <ul className="mt-3 space-y-2 text-sm font-bold text-[#0F2744]">
            {[
              ["Training modules", "/manager/training"],
              ["Resources", "/manager/resources"],
              ["Live Results", "/manager/results"],
              ["Payments", "/manager/payments"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-3">
                  {label} <span>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
      </section>
    </div>
  );
}
