import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  CreditCard,
  Megaphone,
  MessageCircle,
  PawPrint,
  Sparkles,
} from "lucide-react";
import {
  buildManagerDeskReviewQueue,
  type ManagerDeskBundle,
} from "@/lib/admin/growth/manager-desk-data";
import { MANAGER_PORTAL_BRAND } from "@/lib/admin/growth/manager-portal";
import { formatHours } from "@/lib/staff-time/money";

function paceToneClass(tone: string) {
  if (tone === "ahead" || tone === "on_track") return "bg-emerald-50 text-emerald-900";
  if (tone === "behind") return "bg-amber-50 text-amber-950";
  return "bg-slate-100 text-slate-700";
}

function initiativeTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("review") || value.includes("blocked")) {
    return { dot: "bg-amber-500", label: "Needs Review" };
  }
  if (value.includes("plan") || value.includes("draft")) {
    return { dot: "bg-sky-500", label: "Planned" };
  }
  return { dot: "bg-emerald-500", label: "Active" };
}

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
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.18em] text-emerald-800">
            <PawPrint size={14} />
            {MANAGER_PORTAL_BRAND.deskTitle}
          </p>
          <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Welcome back, {desk.firstName}.
          </h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Here&apos;s what&apos;s happening with your interns, growth initiatives, and
            community work.
          </p>
          <p className="mt-3 text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
            {desk.title} · {MANAGER_PORTAL_BRAND.title}
          </p>
        </div>
        <div className="public-dark-section relative min-h-[160px] overflow-hidden rounded-[1.75rem] bg-[#0D5C3A] shadow-[0_18px_50px_rgba(13,92,58,0.18)]">
          <Image
            src="/images/homepage/sitguru-dog-walking-hero.jpg"
            alt=""
            fill
            className="object-cover opacity-90"
            sizes="(max-width: 1280px) 100vw, 40vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0D5C3A]/85 via-[#0D5C3A]/35 to-transparent" />
          <div className="relative flex h-full min-h-[160px] flex-col justify-end p-5">
            <p className="max-w-xs text-lg font-black leading-snug !text-white sm:text-xl">
              {MANAGER_PORTAL_BRAND.heroLine}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[1.5rem] border border-amber-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">Needs Attention</p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{attentionCount}</p>
          <Link
            href={desk.extras.needsAttention[0]?.href || "/intern/manage"}
            className="mt-2 inline-flex text-sm font-black text-amber-900"
          >
            View details
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-sky-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-sky-800">
            <ClipboardCheck size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">Intern Reviews</p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{reviewCount}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {reviewCount ? "Awaiting your feedback" : "You are caught up"}
          </p>
        </article>

        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-800">
            <Clock3 size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">My Time This Week</p>
          </div>
          <p className="mt-3 text-xl font-black text-slate-950">
            {desk.myTimeSnap
              ? `${formatHours(weekHours)} hrs${planned ? ` of ${formatHours(planned)} planned` : ""}`
              : "Not started"}
          </p>
          {weekPct != null ? (
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-emerald-50">
              <div
                className="h-full rounded-full bg-[#0D5C3A]"
                style={{ width: `${weekPct}%` }}
              />
            </div>
          ) : null}
          <Link href="/manager/my-time" className="mt-2 inline-flex text-sm font-black text-emerald-900">
            Open My Time
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-violet-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-violet-800">
            <CreditCard size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">
              Current Payment Period
            </p>
          </div>
          <p className="mt-3 text-lg font-black text-slate-950">
            {desk.myTimeSnap?.periodLabel || "No period yet"}
          </p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {desk.myTimeSnap?.statusLabel || "—"}
          </p>
          <Link
            href="/manager/payments"
            className="mt-2 inline-flex text-sm font-black text-violet-900"
          >
            View payment details
          </Link>
        </article>

        <article className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm sm:col-span-2 xl:col-span-1">
          <div className="flex items-center gap-2 text-emerald-800">
            <Megaphone size={16} />
            <p className="text-[10px] font-black uppercase tracking-[0.14em]">
              Active Growth Initiatives
            </p>
          </div>
          <p className="mt-3 text-3xl font-black text-slate-950">{initiatives.length}</p>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {onTrack} on track · {needsReview} needs review
          </p>
          <Link
            href="/manager/campaigns"
            className="mt-2 inline-flex text-sm font-black text-emerald-900"
          >
            View workspace
          </Link>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-3">
        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Review Queue</h2>
          <ul className="mt-4 space-y-2">
            {queue.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className="flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span>
                    <span className="block text-sm font-black text-slate-950">{item.label}</span>
                    <span className="text-xs font-semibold text-slate-500">{item.detail}</span>
                  </span>
                  <span className="rounded-full bg-white px-2.5 py-1 text-sm font-black text-emerald-900 ring-1 ring-emerald-100">
                    {item.count}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-slate-950">Intern Progress</h2>
            <Link href="/intern/manage" className="text-xs font-black text-emerald-800">
              Open desk
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
                  className="rounded-2xl border border-emerald-50 bg-[#F7FAF8] p-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-black text-slate-950">{card.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{card.school}</p>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${paceToneClass(card.paceTone)}`}
                    >
                      {card.paceLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-sm font-semibold text-slate-700">
                    {card.approvedLabel} / {card.requiredLabel}
                    {required ? ` · ${pct}%` : ""}
                  </p>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                    <div
                      className="h-full rounded-full bg-[#0D5C3A]"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs font-semibold text-slate-500">
                    {card.weekLabel} · {card.milestone}
                  </p>
                </div>
              );
            })}
            {!desk.cards.length ? (
              <p className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                No assigned interns yet.
              </p>
            ) : null}
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-black text-slate-950">Growth Workspace</h2>
            <Link href="/manager/campaigns" className="text-xs font-black text-emerald-800">
              Open
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
                    <span className="block truncate text-sm font-black text-slate-950">
                      {item.name}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">{tone.label}</span>
                  </span>
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                </li>
              );
            })}
            {!initiatives.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                No growth initiatives yet. Create one from Growth.
              </li>
            ) : null}
          </ul>
        </article>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)_minmax(0,0.9fr)]">
        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <MessageCircle size={18} className="text-emerald-800" />
              Messages
            </h2>
            <Link href="/manager/messages" className="text-xs font-black text-emerald-800">
              Open inbox
            </Link>
          </div>
          <ul className="mt-4 space-y-2">
            {desk.messages.map((message) => (
              <li key={message.id}>
                <Link
                  href="/manager/messages"
                  className="flex gap-3 rounded-2xl border border-slate-100 px-3 py-3 hover:bg-slate-50"
                >
                  <span className="relative inline-flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                    {message.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" src={message.avatarUrl} className="h-full w-full object-cover" />
                    ) : (
                      <span className="m-auto text-sm font-black text-emerald-900">
                        {(message.author || "S").slice(0, 1)}
                      </span>
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-black text-slate-950">
                        {message.author}
                      </span>
                      {message.unread ? (
                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                      ) : null}
                    </span>
                    <span className="mt-0.5 line-clamp-2 text-xs font-semibold text-slate-500">
                      {message.preview || "Open conversation"}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
            {!desk.messages.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                No team messages yet.
              </li>
            ) : null}
          </ul>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Quick Actions</h2>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[
              ["/intern/manage?tab=reviews", "Review Check-ins"],
              ["/intern/manage?tab=reviews", "Approve Hours"],
              ["/intern/manage", "Assign Work"],
              ["/manager/campaigns", "View Workspace"],
              ["/admin/help/manager", "Open Help"],
            ].map(([href, label]) => (
              <Link
                key={`${href}-${label}`}
                href={href}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 px-3 text-sm font-black text-emerald-950"
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="relative mt-4 h-24 overflow-hidden rounded-[1.25rem]">
            <Image
              src="/images/rogue-avatar.png"
              alt=""
              fill
              className="object-cover object-top"
              sizes="320px"
            />
          </div>
        </article>

        <article className="rounded-[1.75rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="flex items-center gap-2 text-lg font-black text-slate-950">
            <Sparkles size={18} className="text-emerald-800" />
            Recent Activity
          </h2>
          <ul className="mt-4 space-y-2">
            {desk.reviews.slice(0, 5).map((item) => (
              <li
                key={item.id}
                className="rounded-2xl border border-slate-100 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700"
              >
                <span className="font-black text-slate-950">{item.internName}</span> · {item.title}
                <span className="mt-1 block text-xs text-slate-500">
                  {item.weekLabel} · {item.statusLabel}
                </span>
              </li>
            ))}
            {!desk.reviews.length && desk.extras.needsAttention.length
              ? desk.extras.needsAttention.map((item) => (
                  <li
                    key={item.label}
                    className="rounded-2xl border border-amber-100 bg-amber-50 px-3 py-3 text-sm font-semibold text-amber-950"
                  >
                    {item.label}
                  </li>
                ))
              : null}
            {!desk.reviews.length && !desk.extras.needsAttention.length ? (
              <li className="rounded-2xl bg-slate-50 px-3 py-4 text-sm font-semibold text-slate-500">
                <span className="inline-flex items-center gap-2 font-black text-emerald-900">
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
