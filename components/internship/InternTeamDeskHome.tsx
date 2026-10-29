import Link from "next/link";
import Image from "next/image";
import {
  BookOpen,
  CalendarCheck2,
  ClipboardList,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  MessageCircle,
  Minus,
  Users,
} from "lucide-react";
import InternHelpSearchBar from "@/components/internship/InternHelpSearchBar";
import InternHeroBanner from "@/components/internship/InternHeroBanner";
import { internHelpPath } from "@/lib/internship/intern-growth";
import { DESK_UI, INTERN_BANNER } from "@/lib/portal/desk-ui";

export type DeskActivity = { id: string; title: string; detail: string; href: string };
export type DeskIntern = { id: string; name: string; detail: string };

const WORKSPACES = [
  {
    href: "/intern",
    title: "Intern",
    detail: "Student portal for hours, check-ins, and assignments.",
    icon: GraduationCap,
    wrap: "border-emerald-100 bg-[#F0FDF4]",
  },
  {
    href: "/intern/manage",
    title: "Intern Team Desk",
    detail: "Manager view for coaching, review, and academic progress.",
    icon: Users,
    wrap: "border-teal-200 bg-[#F0FDFA] ring-2 ring-[#14B8A6]",
  },
  {
    href: "/manager",
    title: "Manager Portal",
    detail: "The manager's own workplace for campaigns, messages, and time.",
    icon: LayoutDashboard,
    wrap: "border-violet-100 bg-[#F5F3FF]",
  },
] as const;

export default function InternTeamDeskHome({
  firstName,
  activeInterns,
  pendingReviews,
  weeklyCheckIns,
  onboardingItems,
  questionsWaiting,
  interns,
  activity,
}: {
  firstName: string;
  activeInterns: number;
  pendingReviews: number;
  weeklyCheckIns: number;
  onboardingItems: number;
  questionsWaiting: number;
  interns: DeskIntern[];
  activity: DeskActivity[];
}) {
  return (
    <div className="space-y-4">
      <InternHeroBanner
        title="Intern Team Desk"
        subtitle={`Welcome back, ${firstName}. Your manager view of the intern team. Coach interns, review their work, monitor onboarding, and track academic progress — all in one place.`}
        icon={<Users size={22} />}
        scriptLines={["Helping interns", "grow with confidence."]}
        overlay="Helping interns grow with confidence."
      />

      <section className="grid gap-3 md:grid-cols-3">
        {WORKSPACES.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href + item.title} href={item.href} className={`rounded-2xl border p-4 ${item.wrap}`}>
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#0F2744] shadow-sm">
                <Icon size={18} />
              </span>
              <p className="mt-3 font-black text-[#0F2744]">{item.title}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{item.detail}</p>
            </Link>
          );
        })}
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ["Active Interns", activeInterns, "Currently assigned to you", "bg-[#F0FDF4]", "/intern/manage#assigned"],
          ["Pending Reviews", pendingReviews, "Submitted weeks awaiting review", "bg-[#EFF6FF]", "#desk-reviews"],
          ["Weekly Check-Ins", weeklyCheckIns, "This week", "bg-[#F5F3FF]", "#desk-reviews"],
          ["Onboarding Items", onboardingItems, "Needs attention", "bg-[#FFF7ED]", "#onboarding"],
          ["Questions Waiting", questionsWaiting, "From your interns", "bg-[#FFF1F2]", "#desk-reviews"],
        ].map(([label, value, detail, wrap, href]) => (
          <Link key={String(label)} href={String(href)} className={`rounded-2xl p-4 ${wrap}`}>
            <p className="text-3xl font-black text-[#0F2744]">{value}</p>
            <p className="mt-1 text-sm font-black text-[#0F2744]">{label}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">{detail}</p>
          </Link>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <article id="assigned" className={`${DESK_UI.card} p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <Users size={18} className="text-[#2563EB]" /> Assigned Interns
            </h2>
            <Link href="#onboarding" className="text-sm font-bold text-[#2563EB]">View onboarding →</Link>
          </div>
          {interns.length ? (
            <ul className="mt-4 space-y-2">
              {interns.map((intern) => (
                <li key={intern.id} className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#F8FAFC] px-3 py-3">
                  <div>
                    <p className="font-black text-[#0F2744]">{intern.name}</p>
                    <p className="text-sm font-medium text-slate-600">{intern.detail}</p>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/intern?view=${intern.id}`} className="inline-flex min-h-10 items-center rounded-full bg-[#2563EB] px-3 text-xs font-bold !text-white">Portal</Link>
                    <Link href={`/intern/time?view=${intern.id}`} className="inline-flex min-h-10 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-bold text-[#0F2744]">Hours</Link>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 text-center">
              <Image src={INTERN_BANNER} alt="" width={640} height={360} className="mx-auto h-36 w-auto rounded-2xl object-cover" />
              <p className="mt-4 text-lg font-black text-[#0F2744]">No active interns assigned yet.</p>
              <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
                Once interns are assigned to you, you&apos;ll review their weekly check-ins, submitted hours, assignments, and onboarding status from here.
              </p>
              <Link href={internHelpPath("student-guide")} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 text-sm font-bold text-[#0F2744]">
                <Users size={16} /> Learn more about the intern program
              </Link>
            </div>
          )}
        </article>

        <div className="space-y-4">
          <article className={`${DESK_UI.card} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-lg font-black text-[#0F2744]">Recent Activity</h2>
              <Link href="#desk-reviews" className="text-sm font-bold text-[#2563EB]">View all →</Link>
            </div>
            {activity.length ? (
              <ul className="mt-3 space-y-2">
                {activity.map((item) => (
                  <li key={item.id}>
                    <Link href={item.href} className="block rounded-2xl bg-[#F8FAFC] px-3 py-3">
                      <p className="font-black text-[#0F2744]">{item.title}</p>
                      <p className="text-sm font-medium text-slate-600">{item.detail}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-8 text-center">
                <p className="font-black text-[#0F2744]">No intern activity yet.</p>
                <p className="mt-1 text-sm font-medium text-slate-600">Activity will appear here once interns are assigned to you.</p>
              </div>
            )}
          </article>

          <article className={`${DESK_UI.card} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
                <HelpCircle size={18} className="text-[#2563EB]" /> Help
              </h2>
              <Minus size={16} className="text-slate-400" />
            </div>
            <div className="mt-3">
              <InternHelpSearchBar variant="header" />
            </div>
            <p className="mt-3 text-sm font-black text-[#0F2744]">Popular Topics for Intern Team Desk</p>
            <ul className="mt-2 space-y-1">
              {[
                ["Reviewing weekly check-ins", internHelpPath("weekly-checkin")],
                ["Approving intern hours", internHelpPath("report-hours")],
                ["Onboarding statuses", "#onboarding"],
                ["Messaging interns", "/manager/messages"],
                ["Understanding milestones", "/manager/milestones"],
              ].map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="flex items-center justify-between rounded-xl px-2 py-2 text-sm font-semibold text-[#2563EB] hover:bg-[#EFF6FF]">
                    {label} <span aria-hidden>›</span>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/manager/help" className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">
              <BookOpen size={16} /> Open Help Center →
            </Link>
          </article>
        </div>
      </section>

      <section className={`${DESK_UI.card} p-5`}>
        <h2 className="text-lg font-black text-[#0F2744]">What each workspace opens</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {WORKSPACES.map((item) => (
            <Link key={`explain-${item.title}`} href={item.href} className={`rounded-2xl border p-4 ${item.wrap}`}>
              <p className="font-black text-[#0F2744]">{item.title}</p>
              <p className="mt-1 text-sm font-medium text-slate-600">{item.detail}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className={`${DESK_UI.card} p-5`}>
        <h2 className="text-lg font-black text-[#0F2744]">Ready when interns join</h2>
        <p className="mt-1 text-sm font-medium text-slate-600">Here&apos;s what you&apos;ll be able to do from this workspace:</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {(
            [
              ["Review submitted weeks", "Check-in responses, hours, and reflections", "#desk-reviews", ClipboardList],
              ["Coach assignments and feedback", "Provide guidance and support", "/manager/assignments?create=true", MessageCircle],
              ["Monitor onboarding status", "Track progress and completion", "#onboarding", Users],
              ["Track hours and milestones", "See progress toward program goals", "/manager/milestones", CalendarCheck2],
              ["Answer intern questions", "Support interns as they learn and grow", "#desk-reviews", HelpCircle],
            ] as const
          ).map(([title, detail, href, Icon]) => (
            <Link key={title} href={href} className="rounded-2xl bg-[#F8FAFC] p-3">
              <Icon size={18} className="text-[#2563EB]" />
              <p className="mt-2 text-sm font-black text-[#0F2744]">{title}</p>
              <p className="mt-1 text-xs font-medium text-slate-600">{detail}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
