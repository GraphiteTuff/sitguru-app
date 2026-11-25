import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  GraduationCap,
  HelpCircle,
  Megaphone,
  Palette,
  Play,
  Share2,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import { DESK_UI } from "@/lib/portal/desk-ui";

const MODULES = [
  { n: 1, title: "Welcome to SitGuru", detail: "Mission, portal overview, roles, and how we make an impact.", tone: "bg-[#DCFCE7] text-[#166534]" },
  { n: 2, title: "Brand & Visual Guidelines", detail: "Logo, colors, voice, templates, and content examples.", tone: "bg-[#FFE4E6] text-[#BE123C]" },
  { n: 3, title: "Social Media Content Creation", detail: "Platforms, best practices, content ideas, and scheduling.", tone: "bg-[#EDE9FE] text-[#6D28D9]" },
  { n: 4, title: "Events & Community Engagement", detail: "Event promotion, on-site support, and follow-up.", tone: "bg-[#FFEDD5] text-[#C2410C]" },
  { n: 5, title: "Tracking Links & Analytics", detail: "Create tracking links, measure results, and write reports.", tone: "bg-[#DBEAFE] text-[#1D4ED8]" },
  { n: 6, title: "Ambassador & Referral Program", detail: "How to share, track referrals, and grow SitGuru.", tone: "bg-[#FCE7F3] text-[#BE185D]" },
  { n: 7, title: "Reporting & Communication", detail: "Weekly check-ins, updates, and what to include.", tone: "bg-[#FEF3C7] text-[#B45309]" },
  { n: 8, title: "Tools & Resources", detail: "Canva, Teams, Planner, and the rest of the desk.", tone: "bg-[#E0F2FE] text-[#0369A1]" },
] as const;

export default function TrainingBoard({ audience }: { audience: "manager" | "intern" }) {
  const manager = audience === "manager";
  const base = manager ? "/manager" : "/intern";
  const opens = manager
    ? ["/manager/onboarding", "/manager/toolkit", "/manager/content", "/manager/events", "/manager/metrics", "/manager/partners", "/manager/check-ins", "/manager/resources"]
    : ["/intern", "/intern/toolkit", "/intern/work", "/intern/calendar", "/intern/metrics", "/intern/growth", "/intern/check-ins", "/intern/resources"];
  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<GraduationCap size={22} />}
        title="Training"
        subtitle={
          manager
            ? "Learn, lead, and get everything you need to coach the growth team."
            : "Learn, build skills, and get everything you need to succeed at SitGuru."
        }
        banner={manager ? "manager" : "intern"}
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {(
          [
            { href: opens[0], title: "Get Started", detail: "New onboarding and first week checklist", tone: "bg-[#ECFDF5] text-[#047857]", icon: Play },
            { href: opens[2], title: "Social Media", detail: "Create, post, and grow our community", tone: "bg-[#EEF2FF] text-[#3730A3]", icon: Megaphone },
            { href: opens[4], title: "Tracking & Analytics", detail: "Use tracking links, read results, and report impact", tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: BarChart3 },
            { href: opens[3], title: "Community & Events", detail: "Support events and share with the network", tone: "bg-[#FFF7ED] text-[#C2410C]", icon: CalendarDays },
            { href: opens[5], title: "Ambassador & Referral", detail: "Help grow the network and track referrals", tone: "bg-[#FDF2F8] text-[#BE185D]", icon: Share2 },
          ] satisfies Array<{ href: string; title: string; detail: string; tone: string; icon: LucideIcon }>
        ).map((item) => (
          <Link key={item.title} href={item.href} className={`flex items-center gap-3 rounded-2xl p-3 ${item.tone}`}>
            <item.icon size={22} />
            <span>
              <span className="block text-sm font-black">{item.title}</span>
              <span className="block text-xs font-medium opacity-80">{item.detail}</span>
            </span>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-black text-[#0F2744]">Training Modules</h2>
              <p className="text-sm font-medium text-slate-500">Each module opens its resources in the SitGuru workspace.</p>
            </div>
            <Link href={`${base}/resources`} className="text-xs font-bold text-[#2563EB]">View All →</Link>
          </div>
          <ol className="mt-4 space-y-3">
            {MODULES.map((item, index) => (
              <li key={item.n} className="grid items-center gap-3 sm:grid-cols-[auto_minmax(0,1fr)_auto]">
                <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black ${item.tone}`}>{item.n}</span>
                <span>
                  <span className="block text-sm font-bold text-[#0F2744]">{item.title}</span>
                  <span className="block text-xs font-medium text-slate-500">{item.detail}</span>
                </span>
                <Link href={opens[index]} className="inline-flex min-h-9 items-center justify-center rounded-xl bg-[#2563EB] px-4 text-xs font-bold !text-white">
                  Open
                </Link>
              </li>
            ))}
          </ol>
        </article>

        <div className="space-y-4">
          <article className={`${DESK_UI.card} p-4 sm:p-5`}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-[#0F2744]">Quick Training Links</h2>
              <Link href={`${base}/toolkit`} className="text-xs font-bold text-[#2563EB]">View All →</Link>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {(
                [
                  { href: opens[2], title: "Watch Tutorials", detail: "Short how-to videos", tone: "bg-[#EFF6FF] text-[#1D4ED8]", icon: Play },
                  { href: `${base}/resources`, title: "Download Templates", detail: "Post templates, graphics, captions", tone: "bg-[#ECFDF5] text-[#047857]", icon: Sparkles },
                  { href: `${base}/toolkit`, title: "Brand Kit", detail: "Logo, colors, and guidelines", tone: "bg-[#FFF1F2] text-[#BE123C]", icon: Palette },
                  { href: opens[4], title: "Tracking Links Guide", detail: "Create and use tracking links", tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: BarChart3 },
                  { href: opens[3], title: "Event Promotion Guide", detail: "How to share and promote events", tone: "bg-[#FFF7ED] text-[#C2410C]", icon: CalendarDays },
                  { href: manager ? "/manager/help" : "/intern/help", title: "Help", detail: "Search how to check in, log hours, and get help", tone: "bg-[#FDF2F8] text-[#BE185D]", icon: HelpCircle },
                ] satisfies Array<{ href: string; title: string; detail: string; tone: string; icon: LucideIcon }>
              ).map((item) => (
                <Link key={item.title} href={item.href} className={`rounded-2xl p-3 ${item.tone}`}>
                  <item.icon size={16} />
                  <span className="mt-2 block text-sm font-black">{item.title}</span>
                  <span className="mt-1 block text-xs font-medium opacity-80">{item.detail}</span>
                </Link>
              ))}
            </div>
          </article>

        </div>
      </section>

      <section>
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Need Help?</h2>
          <div className="mt-3 grid gap-2">
            <Link href={manager ? "/manager/help" : "/intern/help"} className="rounded-2xl bg-[#EFF6FF] px-3 py-3 text-sm font-bold text-[#1D4ED8]">Open Help Center →</Link>
            <a href={sitguruTeamsHref()} className="rounded-2xl bg-[#F5F3FF] px-3 py-3 text-sm font-bold text-[#6D28D9]">Ask a Question in Teams →</a>
            <Link href={`${base}/messages`} className="rounded-2xl bg-[#ECFDF5] px-3 py-3 text-sm font-bold text-[#047857]">
              {manager ? "Message the team →" : "Contact Your Manager →"}
            </Link>
          </div>
        </article>
      </section>
    </div>
  );
}
