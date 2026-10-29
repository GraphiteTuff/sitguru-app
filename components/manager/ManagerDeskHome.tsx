import type { ReactNode } from "react";
import Link from "next/link";
import {
  BarChart3,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileText,
  Flag,
  HelpCircle,
  MessageCircle,
  PawPrint,
  Plus,
  Users,
} from "lucide-react";
import GrowthOneNoteShortcuts from "@/components/admin/growth/GrowthOneNoteShortcuts";
import GrowthSharePointShortcuts from "@/components/admin/growth/GrowthSharePointShortcuts";
import DeskPageHero from "@/components/manager/DeskPageHero";
import { InternName } from "@/components/portal/PersonFace";
import ManagerDeskRoster from "@/components/manager/ManagerDeskRoster";
import {
  buildManagerDeskReviewQueue,
  type ManagerDeskBundle,
} from "@/lib/admin/growth/manager-desk-model";
import {
  isSitGuruWorkEmail,
  sitguruTeamsHref,
  SITGURU_GROWTH_TEAMS_TEAM,
} from "@/lib/admin/growth/teams-access";
import type { ManagerInternCard } from "@/lib/internship/manager-dashboard";
import { DESK_UI, deskInitials } from "@/lib/portal/desk-ui";
import { formatHours } from "@/lib/staff-time/money";

function attention(card: ManagerInternCard) {
  return (
    card.paceTone === "behind" ||
    card.statuses.some((status) => /attention|behind/i.test(status))
  );
}

function trackLabel(card: ManagerInternCard) {
  if (attention(card)) return "Needs Attention";
  if (card.paceTone === "done") return "Complete";
  if (card.paceTone === "pending") return "Pending";
  return "On Track";
}

function ago(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return value || "Recently";
  const minutes = Math.max(1, Math.round((Date.now() - time) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

function weekAxis(now = new Date()) {
  return Array.from({ length: 4 }, (_, index) => {
    const start = new Date(now);
    const mondayOffset = (start.getDay() + 6) % 7;
    start.setDate(start.getDate() - mondayOffset - (3 - index) * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const sameMonth = start.getMonth() === end.getMonth();
    const startLabel = start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const endLabel = sameMonth
      ? String(end.getDate())
      : end.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return `${startLabel}–${endLabel}`;
  });
}

export default function ManagerDeskHome({ desk }: { desk: ManagerDeskBundle }) {
  const queue = buildManagerDeskReviewQueue(desk.reviews, desk.questions);
  const cards = desk.cards;
  const avatarByName = new Map(cards.map((card) => [card.name, card.avatarUrl || ""]));
  const active = cards.filter((card) => (card.roster || "active") === "active");
  const logged = cards.reduce((sum, card) => sum + (card.summary.loggedThisWeek || 0), 0);
  const planned = cards.reduce((sum, card) => sum + (card.summary.plannedWeeklyHours || 0), 0);
  const weekPct = planned > 0 ? Math.min(100, Math.round((logged / planned) * 100)) : 0;
  const reviewTotal = queue.reduce((sum, item) => sum + item.count, 0);
  const deadlines = cards.filter((card) => card.nextDeadline && card.nextDeadline !== "No date yet");
  const assignmentReviews = desk.reviews.filter(
    (item) => item.targetType === "task" || item.targetType === "content",
  );
  const deadlineCount = assignmentReviews.length + deadlines.length;
  const pendingHours = desk.reviews
    .filter((item) => item.targetType === "hours")
    .reduce((sum, item) => sum + (Number(item.hours) || 0), 0);
  const approvedWeek = Math.max(0, logged - pendingHours);
  const chartMax = Math.max(8, approvedWeek, pendingHours, 1);
  const weeks = weekAxis();

  const queueRows = [
    ...queue.map((item) => item),
    {
      id: "milestones",
      label: "Milestone review",
      count: deadlines.length,
      href: "/manager/milestones",
      detail: deadlines.length ? `${deadlines.length} milestone${deadlines.length === 1 ? "" : "s"}` : "Clear",
    },
  ];

  const assignments = [
    ...assignmentReviews.map((item) => ({
      id: item.id,
      title: item.title,
      intern: item.internName,
      due: item.weekLabel || "Soon",
      status: /approv|complete/i.test(item.statusLabel) ? "Complete" : "In Review",
    })),
    ...deadlines.slice(0, 4).map((card) => ({
      id: `due-${card.id}`,
      title: card.currentAssignment || card.milestone || "Milestone",
      intern: card.name,
      due: card.nextDeadline,
      status: attention(card) ? "Needs Attention" : "In Progress",
    })),
  ].slice(0, 4);

  const activity = [
    ...desk.reviews.slice(0, 4).map((item) => ({
      id: item.id,
      name: item.internName,
      text: `${item.internName} · ${item.title}`,
      when: ago(item.submittedAt),
    })),
    ...desk.messages.slice(0, 2).map((message) => ({
      id: message.id,
      name: message.author,
      text: message.preview || message.author,
      when: message.unread ? "New" : "Earlier",
    })),
  ].slice(0, 5);

  return (
    <div className="space-y-4 pb-28 lg:pb-8">
      <DeskPageHero
        icon={<PawPrint size={22} />}
        title="Manager's Desk"
        subtitle="Support, review, and grow your interns."
        quote={"Support.\nDevelop.\nCreate Opportunities.\nBigger Impact.®"}
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          tone="sky"
          icon={<Users size={18} />}
          value={String(active.length)}
          label="Active Interns"
          href="/manager/team"
          link="View team →"
        />
        <article className="rounded-2xl border border-emerald-100 bg-[#F0FDF4] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#DCFCE7] text-[#15803D]">
              <Clock3 size={18} />
            </span>
            <div>
              <p className="text-2xl font-black leading-none text-[#166534]">
                {formatHours(logged)}
                <span className="text-base font-bold text-slate-500"> / {formatHours(planned || 0)}</span>
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Team Hours This Week</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-[#22C55E]" style={{ width: `${weekPct}%` }} />
            </div>
            <span className="text-xs font-bold text-[#166534]">{weekPct}%</span>
          </div>
        </article>
        <article className="rounded-2xl border border-violet-100 bg-[#F5F3FF] p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED]">
              <ClipboardList size={18} />
            </span>
            <div>
              <p className="text-3xl font-black leading-none text-[#6D28D9]">{reviewTotal}</p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Items to Review</p>
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold text-slate-600">
            {queue[0]?.count || 0} Check-ins · {queue[2]?.count || 0} Assignments · {queue[1]?.count || 0} Hour Submission
          </p>
        </article>
        <Stat
          tone="peach"
          icon={<CalendarDays size={18} />}
          value={String(deadlineCount)}
          label="Upcoming Deadlines"
          detail={`${assignmentReviews.length} Assignment · ${deadlines.length} Milestone`}
          href="/manager/calendar"
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <Head title="Interns Overview" href="/manager/team" />
          <ul className="mt-4 space-y-3">
            {cards.slice(0, 5).map((card) => {
              const required = Number(card.summary.requiredHours || 0);
              const approved = Number(card.summary.approvedHours || 0);
              const pct = card.summary.progressPercent ?? (required ? Math.round((approved / required) * 100) : 0);
              const hot = attention(card);
              return (
                <li key={card.id} className="flex gap-3">
                  <Face name={card.name} src={card.avatarUrl} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-bold text-[#0F2744]">{card.name}</p>
                        <p className="text-xs font-medium text-slate-500">{card.role || card.school}</p>
                      </div>
                      <span className={`rounded-full px-2 py-1 text-[10px] font-bold ${hot ? "bg-[#FFEDD5] text-[#C2410C]" : "bg-[#DCFCE7] text-[#166534]"}`}>
                        {trackLabel(card)}
                      </span>
                    </div>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      {formatHours(approved)} / {formatHours(required || 0)} hours
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100">
                        <div className={`h-full rounded-full ${hot ? "bg-[#FB923C]" : "bg-[#22C55E]"}`} style={{ width: `${Math.min(100, pct)}%` }} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-500">{Math.round(pct)}%</span>
                    </div>
                  </div>
                </li>
              );
            })}
            {!cards.length ? <Empty>No assigned interns yet.</Empty> : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <Head title="Review Queue" href="/manager/check-ins" icon={<ClipboardList size={18} className="text-[#2563EB]" />} />
          <ul className="mt-4 space-y-2">
            {queueRows.map((item, index) => {
              const icons = [CalendarCheck2, FileText, Clock3, HelpCircle, Flag];
              const tones = [
                "bg-[#FFEDD5] text-[#EA580C]",
                "bg-[#DBEAFE] text-[#2563EB]",
                "bg-[#DCFCE7] text-[#15803D]",
                "bg-[#FFEDD5] text-[#EA580C]",
                "bg-[#EDE9FE] text-[#7C3AED]",
              ];
              const Icon = icons[index] || ClipboardList;
              const latest = desk.reviews.find((review) =>
                item.id === "weekly"
                  ? review.targetType === "weekly"
                  : item.id === "hours"
                    ? review.targetType === "hours"
                    : item.id === "assignments"
                      ? review.targetType === "task" || review.targetType === "content"
                      : false,
              );
              return (
                <li key={item.id}>
                  <Link href={item.href} className="flex items-center gap-3 rounded-2xl px-1 py-2 hover:bg-[#F8FAFC]">
                    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${tones[index]}`}>
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#0F2744]">
                        {item.id === "weekly"
                          ? "Weekly Check-ins to review"
                          : item.id === "assignments"
                            ? "Assignment submissions"
                            : item.id === "hours"
                              ? "Hours to approve"
                              : item.id === "questions"
                                ? "Intern questions"
                                : item.label}
                      </span>
                      <span className="text-xs font-medium text-slate-500">{item.detail}</span>
                    </span>
                    <span className="text-xs font-semibold text-slate-400">{latest ? ago(latest.submittedAt) : ""}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <BarChart3 size={18} className="text-[#2563EB]" /> Team Progress
            </h2>
            <span className="rounded-full bg-[#EFF6FF] px-2.5 py-1 text-[10px] font-bold text-[#1D4ED8]">This Week</span>
          </div>
          <div className="mt-3 flex gap-4 text-[11px] font-semibold text-slate-500">
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-[#3B82F6]" /> Approved Hours</span>
            <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-sm bg-[#BFDBFE]" /> Pending Review</span>
          </div>
          <div className="mt-4 flex h-36 items-end gap-3">
            {weeks.map((label, index) => {
              const current = index === weeks.length - 1;
              const approvedH = current ? Math.round((approvedWeek / chartMax) * 100) : 0;
              const pendingH = current ? Math.round((pendingHours / chartMax) * 100) : 0;
              return (
                <div key={label} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex h-28 w-full items-end justify-center">
                    <div className="flex w-8 flex-col justify-end overflow-hidden rounded-t-md">
                      <div className="bg-[#BFDBFE]" style={{ height: `${pendingH}%`, minHeight: pendingH ? 4 : 0 }} />
                      <div className="bg-[#3B82F6]" style={{ height: `${approvedH}%`, minHeight: approvedH ? 4 : 0 }} />
                    </div>
                  </div>
                  <span className="text-center text-[10px] font-semibold leading-3 text-slate-500">{label}</span>
                </div>
              );
            })}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
            <p className="font-bold text-[#1D4ED8]">{formatHours(approvedWeek)} <span className="font-semibold text-slate-500">Approved Hours</span></p>
            <p className="text-right font-bold text-[#7C3AED]">{formatHours(pendingHours)} <span className="font-semibold text-slate-500">Pending Review</span></p>
          </div>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <Head title="Assignments & Deadlines" href="/manager/assignments" icon={<ClipboardList size={18} className="text-[#2563EB]" />} />
          <ul className="mt-4 space-y-3">
            {assignments.map((row) => (
              <li key={row.id} className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                  <Flag size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-bold text-[#0F2744]">{row.title}</span>
                  <span className="mt-1 inline-flex">
                    <InternName name={row.intern} src={avatarByName.get(row.intern)} className="text-xs font-medium text-slate-500" />
                  </span>
                </span>
                <span className="text-xs font-bold text-[#DC2626]">{row.due}</span>
                <span className="rounded-full bg-[#FFEDD5] px-2 py-1 text-[10px] font-bold text-[#C2410C]">{row.status}</span>
              </li>
            ))}
            {!assignments.length ? <Empty>No deadlines on the desk yet.</Empty> : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Action href="/manager/check-ins" label="Review Check-ins" tone="bg-[#EFF6FF] text-[#1D4ED8]" icon={<FileText size={18} />} />
            <Action href="/manager/check-ins" label="Approve Hours" tone="bg-[#F0FDF4] text-[#166534]" icon={<Clock3 size={18} />} />
            <Action href="/manager/assignments" label="Create Assignment" tone="bg-[#FFF7ED] text-[#C2410C]" icon={<Plus size={18} />} />
            <Action href="/manager/messages" label="Message Team" tone="bg-[#F5F3FF] text-[#6D28D9]" icon={<MessageCircle size={18} />} />
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <Head title="Recent Activity" href="/manager/team" icon={<PawPrint size={18} className="text-[#EA580C]" />} />
          <ul className="mt-4 space-y-3">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3">
                <Face name={item.name} src={avatarByName.get(item.name)} />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-[#0F2744]">{item.text}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-slate-400">{item.when}</span>
              </li>
            ))}
            {!activity.length ? <Empty>New intern and growth activity will show here.</Empty> : null}
          </ul>
        </article>
      </section>

      <ManagerDeskRoster
        rows={cards.map((card) => {
          const required = Number(card.summary.requiredHours || 0);
          const approved = Number(card.summary.approvedHours || 0);
          const pct = Math.round(card.summary.progressPercent ?? (required ? (approved / required) * 100 : 0));
          return {
            id: card.id,
            name: card.name,
            role: card.role || card.school,
            avatarUrl: card.avatarUrl,
            hoursThisWeek: `${formatHours(card.summary.loggedThisWeek || 0)} hrs`,
            totalHours: `${formatHours(approved)} / ${formatHours(required || 0)}`,
            progress: Math.max(0, Math.min(100, pct)),
            status: trackLabel(card),
            attention: attention(card),
            assignment: card.currentAssignment || card.milestone || "—",
            deadline: card.nextDeadline === "No date yet" ? "—" : card.nextDeadline,
            roster: card.roster || "active",
          };
        })}
      />

      {isSitGuruWorkEmail(desk.email) ? (
        <section className={`${DESK_UI.card} space-y-4 p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Work systems</h2>
          <p className="text-sm font-medium text-slate-600">
            Teams for discussion, SharePoint for official files, OneNote for working knowledge.
          </p>
          <a href={sitguruTeamsHref()} target="_blank" rel="noreferrer" className={`text-sm font-bold ${DESK_UI.link}`}>
            Open Teams · {SITGURU_GROWTH_TEAMS_TEAM.shortName}
          </a>
          <GrowthSharePointShortcuts email={desk.email} includeLeadership compact />
          <GrowthOneNoteShortcuts email={desk.email} compact />
        </section>
      ) : null}
    </div>
  );
}

function Stat({
  tone,
  icon,
  value,
  label,
  detail,
  href,
  link,
}: {
  tone: "sky" | "peach";
  icon: ReactNode;
  value: string;
  label: string;
  detail?: string;
  href: string;
  link?: string;
}) {
  const wrap = tone === "sky" ? "border-sky-100 bg-[#EFF6FF]" : "border-orange-100 bg-[#FFF7ED]";
  const bubble = tone === "sky" ? "bg-[#DBEAFE] text-[#2563EB]" : "bg-[#FFEDD5] text-[#EA580C]";
  const number = tone === "sky" ? "text-[#1D4ED8]" : "text-[#C2410C]";
  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${wrap}`}>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${bubble}`}>{icon}</span>
        <div>
          <p className={`text-3xl font-black leading-none ${number}`}>{value}</p>
          <p className="mt-1 text-xs font-bold text-[#0F2744]">{label}</p>
        </div>
      </div>
      {detail ? <p className="mt-3 text-xs font-semibold text-slate-600">{detail}</p> : null}
      {link ? (
        <Link href={href} className={`mt-2 inline-flex text-sm font-bold ${DESK_UI.link}`}>
          {link}
        </Link>
      ) : null}
    </article>
  );
}

function Head({ title, href, icon }: { title: string; href: string; icon?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
        {icon}
        {title}
      </h2>
      <Link href={href} className={`text-xs font-bold ${DESK_UI.link}`}>
        View All →
      </Link>
    </div>
  );
}

function Action({ href, label, tone, icon }: { href: string; label: string; tone: string; icon: ReactNode }) {
  return (
    <Link href={href} className={`flex min-h-20 flex-col items-center justify-center gap-2 rounded-2xl text-sm font-bold ${tone}`}>
      {icon}
      {label}
    </Link>
  );
}

function Face({ name, src }: { name: string; src?: string }) {
  return (
    <span className="relative inline-flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-xs font-black text-[#1D4ED8] ring-1 ring-slate-200">
      <span className="absolute inset-0 bg-white" />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1]">{deskInitials(name)}</span>
      )}
    </span>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">{children}</li>;
}
