import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  FolderOpen,
  Link2,
  Palette,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { sitguruTeamsHref } from "@/lib/admin/growth/teams-access";
import { DESK_UI } from "@/lib/portal/desk-ui";

export default function ResourcesBoard({ audience }: { audience: "manager" | "intern" }) {
  const manager = audience === "manager";
  const base = manager ? "/manager" : "/intern";
  const teams = sitguruTeamsHref();
  const sections: Array<{
    title: string;
    subtitle: string;
    tone: string;
    viewAll: string;
    items: Array<{ label: string; href: string }>;
  }> = [
    {
      title: "Brand Resources",
      subtitle: "Logos, colors, fonts, and brand guidelines.",
      tone: "text-[#BE123C]",
      viewAll: `${base}/toolkit`,
      items: [
        ["SitGuru Logo", `${base}/toolkit`],
        ["Logo Variations", `${base}/toolkit`],
        ["Color Palette (Green)", `${base}/toolkit`],
        ["Brand Guidelines", `${base}/toolkit`],
        ["Social Media Style Guide", `${base}/training`],
        ["Example Posts", manager ? "/manager/content" : "/intern/work"],
      ].map(([label, href]) => ({ label, href })),
    },
    {
      title: "Templates & Assets",
      subtitle: "Done-for-you templates to make posting easy.",
      tone: "text-[#1D4ED8]",
      viewAll: manager ? "/manager/content" : "/intern/work",
      items: [
        "Instagram Post Templates",
        "TikTok Video Templates",
        "Facebook Post Templates",
        "Event Flyers & Graphics",
        "Email Templates",
        "Canva Templates",
      ].map((label) => ({ label, href: manager ? "/manager/content" : "/intern/work" })),
    },
    {
      title: "Tracking & Campaign Resources",
      subtitle: "Use tracking links to measure signups and impact.",
      tone: "text-[#047857]",
      viewAll: `${base}/metrics`,
      items: [
        ["Create a Tracking Link", `${base}/metrics`],
        ["Active Tracking Links", `${base}/metrics`],
        ["Campaign Post Examples", manager ? "/manager/campaigns" : "/intern/growth"],
        ["UTM Guide", `${base}/metrics`],
        ["QR Code Templates", `${base}/toolkit`],
        ["Campaign Checklist", manager ? "/manager/campaigns" : "/intern/growth"],
      ].map(([label, href]) => ({ label, href })),
    },
    {
      title: "Events Resources",
      subtitle: "Public pet events to share with the community.",
      tone: "text-[#C2410C]",
      viewAll: manager ? "/manager/events" : "/intern/calendar",
      items: [
        "Upcoming Events",
        "Event Graphics",
        "Sample Event Posts",
        "QR Code Signage",
        "On-Site Talking Points",
        "Event Follow-Up Template",
      ].map((label) => ({ label, href: manager ? "/manager/events" : "/intern/calendar" })),
    },
    {
      title: "Market Snapshot",
      subtitle: "Market totals and growth insights. No names.",
      tone: "text-[#6D28D9]",
      viewAll: `${base}/results`,
      items: [
        ["Market Overview", `${base}/results`],
        ["Regional Breakdown", `${base}/metrics`],
        ["Pet Parent Growth Trends", `${base}/results`],
        ["Event Participation Trends", manager ? "/manager/events" : "/intern/calendar"],
        ["Top Content Performing", `${base}/results`],
        ["Monthly Report", manager ? "/manager/analytics" : "/intern/growth"],
      ].map(([label, href]) => ({ label, href })),
    },
    {
      title: "Helpful Links",
      subtitle: "Key tools and platforms you will use.",
      tone: "text-[#0369A1]",
      viewAll: manager ? "/manager/help" : "/intern/help",
      items: [
        { label: "SitGuru Website", href: "https://www.sitguru.com" },
        { label: "SitGuru Social Media", href: "https://www.instagram.com/SitGuruOfficial" },
        { label: "Canva", href: "https://www.canva.com" },
        { label: "Microsoft Teams", href: teams },
        { label: "Microsoft Planner", href: teams },
      ],
    },
  ];

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<FolderOpen size={22} />}
        title="Resources"
        subtitle="Everything you need in one place. Find files, links, templates, guides, and inspiration."
        banner={manager ? "manager" : "intern"}
        quote={"Learn. Create.\nMake an impact.\nHappier pets.\nBrighter communities."}
      />

      <section>
        <h2 className="text-lg font-black text-[#0F2744]">Quick Resources</h2>
        <p className="text-sm font-medium text-slate-500">Tap a card to open it.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {(
            [
              { href: `${base}/toolkit`, title: "Brand Kit", detail: "Logos, colors, fonts, and guidelines", tone: "bg-[#FFF1F2] text-[#BE123C]", icon: Palette },
              { href: manager ? "/manager/content" : "/intern/work", title: "Templates", detail: "Post templates, graphics, captions", tone: "bg-[#EFF6FF] text-[#1D4ED8]", icon: Sparkles },
              { href: `${base}/metrics`, title: "Tracking Links", detail: "Copy the link, then post", tone: "bg-[#ECFDF5] text-[#047857]", icon: Link2 },
              { href: manager ? "/manager/events" : "/intern/calendar", title: "Events to Share", detail: "Public pet events and graphics", tone: "bg-[#FFF7ED] text-[#C2410C]", icon: CalendarDays },
              { href: `${base}/results`, title: "Market Snapshot", detail: "Your market totals, no names", tone: "bg-[#F5F3FF] text-[#6D28D9]", icon: BarChart3 },
            ] satisfies Array<{ href: string; title: string; detail: string; tone: string; icon: LucideIcon }>
          ).map((item) => (
            <Link key={item.title} href={item.href} className={`flex items-center gap-3 rounded-2xl p-4 ${item.tone}`}>
              <item.icon size={20} />
              <span>
                <span className="block text-sm font-black">{item.title} →</span>
                <span className="block text-xs font-medium opacity-80">{item.detail}</span>
              </span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {sections.map((section) => (
          <article key={section.title} className={`${DESK_UI.card} p-4`}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <h2 className={`text-base font-black ${section.tone}`}>{section.title}</h2>
                <p className="text-xs font-medium text-slate-500">{section.subtitle}</p>
              </div>
              <Link href={section.viewAll} className="shrink-0 text-xs font-bold text-[#2563EB]">View All →</Link>
            </div>
            <ul className="mt-3 divide-y divide-slate-100">
              {section.items.map((item) => {
                const external = item.href.startsWith("http");
                return (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      target={external ? "_blank" : undefined}
                      rel={external ? "noreferrer" : undefined}
                      className="flex items-center justify-between py-2 text-sm font-semibold text-[#0F2744] hover:text-[#2563EB]"
                    >
                      {item.label}
                      <span className="text-slate-300">→</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-base font-black text-[#0F2744]">Documents & Forms</h2>
          <p className="text-xs font-medium text-slate-500">Open the desk page that holds the real record. Files stay in SharePoint.</p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["Check-In Instructions", `${base}/check-ins`],
              ["Hours Logging Guide", manager ? "/manager/my-time" : "/intern/time"],
              ["Social Media Guidelines", `${base}/training`],
              ["University Documentation", manager ? "/manager/team" : "/intern/help"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0F2744]">
                  {label} <span>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </article>
        <article className={`${DESK_UI.card} p-4`}>
          <h2 className="text-base font-black text-[#0F2744]">Recommended Resources</h2>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              ["Social Media Best Practices", `${base}/training`],
              ["Pet Industry Trends", `${base}/results`],
              ["Community Engagement Tips", manager ? "/manager/events" : "/intern/calendar"],
              ["Learning & Course Recommendations", `${base}/training`],
            ].map(([label, href]) => (
              <li key={label}>
                <Link href={href} className="flex items-center justify-between rounded-xl bg-[#F8FAFC] px-3 py-3 text-sm font-bold text-[#0F2744]">
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
