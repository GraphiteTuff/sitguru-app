import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  CreditCard,
  HelpCircle,
  ListChecks,
  Megaphone,
  MessageCircle,
  PawPrint,
  Sparkles,
} from "lucide-react";
import {
  buildManagerDeskReviewQueue,
  type ManagerDeskBundle,
} from "@/lib/admin/growth/manager-desk-model";
import { MANAGER_PORTAL_BRAND } from "@/lib/admin/growth/manager-portal";
import { DESK_STAT, DESK_UI, deskInitials } from "@/lib/portal/desk-ui";
import { formatHours } from "@/lib/staff-time/money";

function paceToneClass(tone: string) {
  if (tone === "ahead") return "bg-[#DCFCE7] text-[#166534]";
  if (tone === "on_pace" || tone === "on_track") return "bg-[#DCFCE7] text-[#166534]";
  if (tone === "behind") return "bg-[#FFEDD5] text-[#9A3412]";
  return "bg-slate-100 text-slate-700";
}

function initiativeTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("review") || value.includes("blocked")) {
    return { pill: "bg-[#FFEDD5] text-[#9A3412]", label: "Needs Review" };
  }
  if (value.includes("plan") || value.includes("draft")) {
    return { pill: "bg-[#DBEAFE] text-[#1D4ED8]", label: "Planned" };
  }
  return { pill: "bg-[#DCFCE7] text-[#166534]", label: "Active" };
}

const QUEUE_ICONS = [ClipboardCheck, Clock3, ListChecks, HelpCircle] as const;
const QUEUE_COLORS = [
  "bg-[#FFEDD5] text-[#EA580C]",
  "bg-[#DBEAFE] text-[#2563EB]",
  "bg-[#FFEDD5] text-[#EA580C]",
  "bg-[#DBEAFE] text-[#2563EB]",
] as const;

export default function ManagerDeskHome({ desk }: { desk: ManagerDeskBundle }) {
  const queue = buildManagerDeskReviewQueue(desk.reviews, desk.questions);
  const attentionCount = desk.extras.needsAttention.reduce((sum, item) => sum + item.count, 0);
  const reviewCount = desk.reviews.length;
  const planned = desk.extras.myTime?.week.expectedMax ?? null;
  const weekHours = desk.extras.myTime?.week.hours ?? 0;
  const weekPct =
    planned && planned > 0 ? Math.min(100, Math.round((weekHours / planned) * 100)) : null;
  const initiatives = desk.initiatives;
  const onTrack = initiatives.filter((item) => {
    const status = item.status.toLowerCase();
    return !status.includes("review") && !status.includes("plan") && !status.includes("draft");
  }).length;
  const needsReview = initiatives.filter((item) =>
    item.status.toLowerCase().includes("review"),
  ).length;

  return (
    <div className="space-y-5 pb-28 lg:pb-8">
      <section className="overflow-hidden rounded-2xl border border-sky-100/80 bg-gradient-to-r from-[#EFF6FF] via-white to-[#F0FDFA] shadow-[0_8px_24px_rgba(15,39,68,0.04)]">
        <div className="grid gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:items-center">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 text-sm font-black text-[#0F2744]">
              <PawPrint size={18} className="text-[#0D5C3A]" />
              {MANAGER_PORTAL_BRAND.deskTitle}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-[#0F2744] sm:text-4xl">
              Welcome back, {desk.firstName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
              Here&apos;s what&apos;s happening with your interns, growth initiatives, and
              community work.
            </p>
          </div>
          <div className="relative min-h-[140px] overflow-hidden rounded-2xl sm:min-h-[160px]">
            <Image
              src="/images/homepage/sitguru-dog-walking-hero.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1280px) 100vw, 40vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#0F2744]/55 via-[#0F2744]/15 to-transparent" />
            <div className="relative flex h-full min-h-[140px] flex-col justify-end p-4 sm:min-h-[160px]">
              <p className="max-w-xs text-lg font-black leading-snug !text-white sm:text-xl">
                {MANAGER_PORTAL_BRAND.heroLine}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.amber.wrap}`}>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.amber.iconWrap}`}
            >
              <AlertTriangle size={18} />
            </span>
            <div>
              <p className={`text-3xl font-black leading-none ${DESK_STAT.amber.value}`}>
                {attentionCount}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Needs Attention</p>
            </div>
          </div>
          <Link
            href={desk.extras.needsAttention[0]?.href || "/intern/manage"}
            className={`mt-3 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}
          >
            View details <ChevronRight size={14} />
          </Link>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.sky.wrap}`}>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.sky.iconWrap}`}
            >
              <ClipboardCheck size={18} />
            </span>
            <div>
              <p className={`text-3xl font-black leading-none ${DESK_STAT.sky.value}`}>
                {reviewCount}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Intern Reviews</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {reviewCount ? "Awaiting your feedback" : "You are caught up"}
          </p>
          <Link
            href="/intern/manage?tab=reviews"
            className={`mt-2 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}
          >
            View reviews <ChevronRight size={14} />
          </Link>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.green.wrap}`}>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.green.iconWrap}`}
            >
              <Clock3 size={18} />
            </span>
            <div>
              <p className={`text-2xl font-black leading-none ${DESK_STAT.green.value}`}>
                {desk.myTimeSnap ? formatHours(weekHours) : "—"}
                {planned ? (
                  <span className="text-sm font-bold text-slate-500">
                    {" "}
                    / {formatHours(planned)} hrs
                  </span>
                ) : null}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">My Time This Week</p>
            </div>
          </div>
          {weekPct != null ? (
            <div className="mt-3 flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/80">
                <div
                  className="h-full rounded-full bg-[#22C55E]"
                  style={{ width: `${weekPct}%` }}
                />
              </div>
              <span className="text-xs font-bold text-[#166534]">{weekPct}%</span>
            </div>
          ) : null}
          <Link
            href="/manager/my-time"
            className={`mt-2 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}
          >
            Open My Time <ChevronRight size={14} />
          </Link>
        </article>

        <article className={`rounded-2xl border p-4 shadow-sm ${DESK_STAT.violet.wrap}`}>
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.violet.iconWrap}`}
            >
              <CreditCard size={18} />
            </span>
            <div>
              <p className={`text-lg font-black leading-snug ${DESK_STAT.violet.value}`}>
                {desk.myTimeSnap?.periodLabel || "No period yet"}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Current Payment Period</p>
            </div>
          </div>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-[#166534]">
            <span className="h-2 w-2 rounded-full bg-[#22C55E]" />
            {desk.myTimeSnap?.statusLabel || "—"}
          </p>
          <Link
            href="/manager/payments"
            className={`mt-2 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}
          >
            View payment <ChevronRight size={14} />
          </Link>
        </article>

        <article
          className={`rounded-2xl border p-4 shadow-sm sm:col-span-2 xl:col-span-1 ${DESK_STAT.teal.wrap}`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full ${DESK_STAT.teal.iconWrap}`}
            >
              <Megaphone size={18} />
            </span>
            <div>
              <p className={`text-3xl font-black leading-none ${DESK_STAT.teal.value}`}>
                {initiatives.length}
              </p>
              <p className="mt-1 text-xs font-bold text-[#0F2744]">Active Growth Initiatives</p>
            </div>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-600">
            {onTrack} on track · {needsReview} needs review
          </p>
          <Link
            href="/manager/campaigns"
            className={`mt-2 inline-flex items-center gap-1 text-sm font-bold ${DESK_UI.link}`}
          >
            View workspace <ChevronRight size={14} />
          </Link>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <ListChecks size={18} className="text-[#2563EB]" />
              Review Queue
              {attentionCount > 0 ? (
                <span className="rounded-full bg-[#F05A4A] px-2 py-0.5 text-[10px] font-black !text-white">
                  {attentionCount}
                </span>
              ) : null}
            </h2>
            <Link
              href="/intern/manage?tab=reviews"
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              View all <ChevronRight size={12} />
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {queue.map((item, index) => {
              const Icon = QUEUE_ICONS[index % QUEUE_ICONS.length];
              const color = QUEUE_COLORS[index % QUEUE_COLORS.length];
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className="flex min-h-14 items-center gap-3 rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-2 hover:bg-white"
                  >
                    <span
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${color}`}
                    >
                      <Icon size={16} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-[#0F2744]">{item.label}</span>
                      <span className="text-xs font-medium text-slate-500">{item.detail}</span>
                    </span>
                    <ChevronRight size={16} className="shrink-0 text-slate-400" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-[#0F2744]">Intern Progress</h2>
            <Link
              href="/intern/manage"
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              Open desk <ChevronRight size={12} />
            </Link>
          </div>
          <div className="mt-4 space-y-3">
            {desk.cards.slice(0, 4).map((card) => {
              const required = Number(card.summary?.requiredHours || 0);
              const approved = Number(card.summary?.approvedHours || 0);
              const pct =
                required > 0 ? Math.min(100, Math.round((approved / required) * 100)) : 0;
              return (
                <div
                  key={card.id}
                  className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-3"
                >
                  <div className="flex items-start gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#DBEAFE] text-sm font-black text-[#1D4ED8]">
                      {deskInitials(card.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-[#0F2744]">{card.name}</p>
                          <p className="text-xs font-medium text-slate-500">{card.school}</p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${paceToneClass(card.paceTone)}`}
                        >
                          <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                          {card.paceLabel}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-semibold text-slate-700">
                        {card.approvedLabel} / {card.requiredLabel}
                        {required ? ` · ${pct}%` : ""}
                      </p>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                        <div
                          className="h-full rounded-full bg-[#3B82F6]"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {!desk.cards.length ? (
              <p className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No assigned interns yet.
              </p>
            ) : null}
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <BarChart3 size={18} className="text-[#0D9488]" />
              Growth Workspace
            </h2>
            <Link
              href="/manager/campaigns"
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              Open <ChevronRight size={12} />
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {initiatives.slice(0, 5).map((item) => {
              const tone = initiativeTone(item.status);
              return (
                <li
                  key={item.id}
                  className="flex min-h-12 items-center justify-between gap-3 rounded-2xl border border-slate-100 px-3"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-[#0F2744]">
                      {item.name}
                    </span>
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${tone.pill}`}
                  >
                    {tone.label}
                  </span>
                </li>
              );
            })}
            {!initiatives.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No growth initiatives yet. Create one from Growth.
              </li>
            ) : null}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
              <MessageCircle size={18} className="text-[#2563EB]" />
              Messages
              {desk.messages.filter((m) => m.unread).length ? (
                <span className="rounded-full bg-[#F05A4A] px-2 py-0.5 text-[10px] font-black !text-white">
                  {desk.messages.filter((m) => m.unread).length}
                </span>
              ) : null}
            </h2>
            <Link
              href="/manager/messages"
              className={`inline-flex items-center gap-1 text-xs font-bold ${DESK_UI.link}`}
            >
              Open inbox <ChevronRight size={12} />
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {desk.messages.map((message) => (
              <li key={message.id}>
                <Link
                  href="/manager/messages"
                  className="flex gap-3 rounded-2xl border border-slate-100 px-3 py-3 hover:bg-[#F8FAFC]"
                >
                  <span className="relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-[#DBEAFE] ring-2 ring-white">
                    {message.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={message.avatarUrl} className="h-full w-full object-cover" />
                    ) : (
                      <span className="m-auto text-sm font-black text-[#1D4ED8]">
                        {deskInitials(message.author || "S")}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-bold text-[#0F2744]">
                        {message.author}
                      </span>
                      {message.unread ? (
                        <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs font-medium text-slate-500">
                      {message.preview || "Open conversation"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {!desk.messages.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                No team messages yet.
              </li>
            ) : null}
          </ul>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="text-lg font-black text-[#0F2744]">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ["/intern/manage?tab=reviews", "Review Check-ins", "bg-[#EFF6FF] text-[#1D4ED8]"],
              ["/intern/manage?tab=reviews", "Approve Hours", "bg-[#F0FDF4] text-[#166534]"],
              ["/intern/manage", "Assign Work", "bg-[#F5F3FF] text-[#6D28D9]"],
              ["/manager/campaigns", "View Workspace", "bg-[#F0FDFA] text-[#0F766E]"],
              ["/admin/help/manager", "Open Help", "bg-[#FFF7ED] text-[#C2410C]"],
            ].map(([href, label, tone]) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className={`inline-flex min-h-12 items-center justify-center rounded-2xl px-3 text-sm font-bold ${tone}`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="relative mt-4 h-24 overflow-hidden rounded-2xl bg-[#FFF7ED]">
            <Image
              src="/images/rogue-avatar.png"
              alt=""
              fill
              className="object-cover object-top"
              sizes="320px"
            />
          </div>
        </article>

        <article className={`${DESK_UI.card} p-4 sm:p-5`}>
          <h2 className="flex items-center gap-2 text-lg font-black text-[#0F2744]">
            <Sparkles size={18} className="text-[#EA580C]" />
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-2">
            {desk.reviews.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-[#F8FAFC] px-3 py-3 text-sm font-medium text-slate-700"
              >
                <span className="font-bold text-[#0F2744]">{item.internName}</span> · {item.title}
                <span className="mt-1 block text-xs text-slate-500">
                  {item.weekLabel} · {item.statusLabel}
                </span>
              </li>
            ))}
            {!desk.reviews.length && desk.extras.needsAttention.length
              ? desk.extras.needsAttention.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-2xl border border-amber-100 bg-[#FFF4ED] px-3 py-3 text-sm font-semibold text-[#9A3412]"
                  >
                    {item.label}
                  </li>
                ))
              : null}
            {!desk.reviews.length && !desk.extras.needsAttention.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-medium text-slate-500">
                <span className="inline-flex items-center gap-2 font-bold text-[#166534]">
                  <CheckCircle2 size={16} /> All clear
                </span>
                <span className="mt-1 block">New intern and growth activity will show here.</span>
              </li>
            ) : null}
          </ul>
        </article>
      </section>
    </div>
  );
}
