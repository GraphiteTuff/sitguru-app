"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart3,
  CalendarCheck2,
  Filter,
  FolderOpen,
  GraduationCap,
  MoreHorizontal,
  Plus,
  Search,
  Users,
} from "lucide-react";
import PersonFace, { InternName } from "@/components/portal/PersonFace";
import { dismissStaffNotice } from "@/lib/internship/assignment-actions";
import {
  answerInternQuestion,
  approveWeekZero,
  reviewPortalSubmission,
  saveRequirementConfig,
} from "@/lib/internship/portal-actions";
import { saveMessagingPermission } from "@/lib/messaging/staff-actions";
import { reviewInternWeek } from "@/lib/timekeeper/actions";
import { DESK_UI } from "@/lib/portal/desk-ui";

export type DeskInternRow = {
  id: string;
  userId: string;
  name: string;
  avatarUrl: string;
  role: string;
  focus: string;
  hoursLabel: string;
  status: string;
  attention: boolean;
  onboarding: string;
  onboardingItems: { title: string; status: string }[];
  credits: number | null;
  requiredHours: number | null;
  plannedWeeklyHours: number | null;
  internshipWeeks: number | null;
  academicStartDate: string;
  academicEndDate: string;
  semester: string;
  academicYear: string;
  requirementStatus: string;
  universityVerificationStatus: string;
  dayToDayManagerName: string;
  siteSupervisorName: string;
  universityNotes: string;
};

export type DeskReview = {
  id: string;
  internId: string;
  internName: string;
  avatarUrl: string;
  targetType: string;
  title: string;
  weekLabel: string;
  submittedAt: string;
  hours: string;
  statusLabel: string;
  evidence: string;
  ceo: boolean;
};

export type DeskQuestion = {
  id: string;
  internId: string;
  internName: string;
  avatarUrl: string;
  question: string;
  status: string;
  urgency: string;
  targetTitle: string;
  askedAt: string;
  answer: string;
};

export type DeskWeek = {
  internId: string;
  weekNumber: string;
  internName: string;
  avatarUrl: string;
};

const TABS = [
  { id: "interns", label: "Interns" },
  { id: "reviews", label: "Reviews" },
  { id: "questions", label: "Questions" },
  { id: "onboarding", label: "Onboarding" },
  { id: "requirements", label: "Requirements" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const fieldClass =
  "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744]";

function whenLabel(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 10);
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.round(hours / 24);
  if (days < 14) return `${days} day${days === 1 ? "" : "s"} ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function tabFromQuery(value: string): TabId {
  if (value === "settings") return "requirements";
  if (value === "reviews" || value === "questions" || value === "onboarding" || value === "requirements") {
    return value;
  }
  return "interns";
}

export default function InternTeamDesk({
  todayLabel,
  managerNote,
  supervisorNote,
  canEdit,
  canCeo,
  notice,
  activeInterns,
  openReviews,
  openQuestions,
  completionLabel,
  completionDetail,
  interns,
  reviews,
  questions,
  weeks,
  notices,
  activity,
}: {
  todayLabel: string;
  managerNote: string;
  supervisorNote: boolean;
  canEdit: boolean;
  canCeo: boolean;
  notice: { kind: "ok" | "error"; message: string } | null;
  activeInterns: number;
  openReviews: number;
  openQuestions: number;
  completionLabel: string;
  completionDetail: string;
  interns: DeskInternRow[];
  reviews: DeskReview[];
  questions: DeskQuestion[];
  weeks: DeskWeek[];
  notices: { id: string; title: string; body: string }[];
  activity: { id: string; name: string; avatarUrl: string; text: string; when: string }[];
}) {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TabId>(tabFromQuery(searchParams.get("tab") || ""));
  const [query, setQuery] = useState("");
  const [attentionOnly, setAttentionOnly] = useState(false);
  const visibleTabs = TABS.filter((item) => item.id !== "requirements" || canEdit);
  const visibleInterns = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return interns.filter((intern) => {
      if (attentionOnly && !intern.attention) return false;
      if (!needle) return true;
      return `${intern.name} ${intern.role} ${intern.focus}`.toLowerCase().includes(needle);
    });
  }, [attentionOnly, interns, query]);
  const pending = reviews.slice(0, 4);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">
            <Link href="/manager" className="hover:text-[#2563EB]">Manager Portal</Link>
            <span className="px-1.5">›</span>
            Intern Team Desk
          </p>
          <h1 className="mt-2 flex items-center gap-2 text-3xl font-black tracking-tight text-[#0F2744]">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#DBEAFE] text-[#2563EB]">
              <Users size={18} />
            </span>
            Intern Team Desk
          </h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Coach the interns assigned to you, review their work, and keep university progress moving.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex min-h-10 items-center rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-[#0F2744]">
            {todayLabel}
          </span>
          <Link
            href="/manager/assignments?create=true"
            className="inline-flex min-h-10 items-center gap-1 rounded-xl bg-[#2563EB] px-4 text-sm font-bold !text-white"
          >
            <Plus size={16} /> Assign Task
          </Link>
        </div>
      </div>

      {managerNote ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          {managerNote}{" "}
          <Link href="/intern/manage" className="font-black text-[#1D4ED8]">Show every intern</Link>
        </p>
      ) : supervisorNote ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-950">
          Every intern desk is open. Formal approvals that need a supervisor stay on this page.
        </p>
      ) : null}
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${notice.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-800"}`}>
          {notice.message}
        </p>
      ) : null}
      {notices.map((item) => (
        <form key={item.id} action={dismissStaffNotice} className={`${DESK_UI.card} flex flex-wrap items-center justify-between gap-3 p-4`}>
          <input type="hidden" name="id" value={item.id} />
          <div>
            <p className="text-sm font-black text-[#0F2744]">{item.title}</p>
            <p className="text-sm font-medium text-slate-600">{item.body}</p>
          </div>
          <button className="min-h-10 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">Got it</button>
        </form>
      ))}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-4">
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Stat label="Active Interns" value={String(activeInterns)} detail="Assigned to this desk" tone="bg-[#EFF6FF]" />
            <Stat label="Open Reviews" value={String(openReviews)} detail="Submitted work waiting" tone="bg-[#F0FDF4]" />
            <Stat label="Open Questions" value={String(openQuestions)} detail="From the intern team" tone="bg-[#F5F3FF]" />
            <Stat label="Hours Progress" value={completionLabel} detail={completionDetail} tone="bg-[#FFFBEB]" />
          </section>

          <section className={`${DESK_UI.card} overflow-hidden`}>
            <div className="flex flex-wrap gap-1 border-b border-slate-100 px-3 pt-3">
              {visibleTabs.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={
                    tab === item.id
                      ? "rounded-t-xl bg-[#EEF2FF] px-3 py-2 text-sm font-bold text-[#2563EB]"
                      : "rounded-t-xl px-3 py-2 text-sm font-semibold text-slate-500"
                  }
                >
                  {item.label}
                </button>
              ))}
            </div>

            {tab === "interns" ? (
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <h2 className="text-lg font-black text-[#0F2744]">Interns ({visibleInterns.length})</h2>
                    <p className="text-sm font-medium text-slate-500">Assigned interns, their current focus, and hours.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <label className="relative block">
                      <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search interns..."
                        className="min-h-10 w-52 rounded-full bg-[#F1F5F9] pl-8 pr-3 text-sm font-medium outline-none"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => setAttentionOnly((value) => !value)}
                      className={`inline-flex min-h-10 items-center gap-1 rounded-full border px-3 text-sm font-bold ${attentionOnly ? "border-[#2563EB] bg-[#EFF6FF] text-[#1D4ED8]" : "border-slate-200 bg-white text-[#0F2744]"}`}
                    >
                      <Filter size={14} /> Filter
                    </button>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[760px] w-full text-left text-sm">
                    <thead className="text-xs font-semibold text-slate-500">
                      <tr>
                        {["Name", "Role", "Current Focus", "Hours", "Status", "Actions"].map((label) => (
                          <th key={label} className="px-4 py-3 font-semibold">{label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visibleInterns.map((intern) => (
                        <tr key={intern.id} id={`intern-${intern.id}`} className="border-t border-slate-100">
                          <td className="px-4 py-3 font-bold text-[#0F2744]">
                            <InternName name={intern.name} src={intern.avatarUrl} />
                          </td>
                          <td className="px-4 py-3 text-slate-600">{intern.role}</td>
                          <td className="px-4 py-3 text-slate-700">{intern.focus}</td>
                          <td className="px-4 py-3 font-semibold text-slate-700">{intern.hoursLabel}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${intern.attention ? "bg-[#FFEDD5] text-[#C2410C]" : "bg-[#DCFCE7] text-[#166534]"}`}>
                              <span className={`h-1.5 w-1.5 rounded-full ${intern.attention ? "bg-[#F97316]" : "bg-[#22C55E]"}`} />
                              {intern.status}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1">
                              <Link href={`/intern?view=${intern.id}`} className="rounded-full px-2 py-1 text-xs font-bold text-[#2563EB]">Portal</Link>
                              <Link href={`/intern/time?view=${intern.id}`} className="rounded-full px-2 py-1 text-xs font-bold text-[#2563EB]">Hours</Link>
                              <Link href={`#intern-${intern.id}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400" aria-label={`Intern row for ${intern.name}`}>
                                <MoreHorizontal size={16} />
                              </Link>
                            </span>
                          </td>
                        </tr>
                      ))}
                      {!visibleInterns.length ? (
                        <tr>
                          <td colSpan={6} className="px-4 py-8 text-sm font-medium text-slate-500">
                            No interns are assigned to this desk yet.
                          </td>
                        </tr>
                      ) : null}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            {tab === "reviews" ? (
              <div className="space-y-3 p-4">
                <h2 className="text-lg font-black text-[#0F2744]">Needs manager review</h2>
                {reviews.filter((item) => !item.ceo).map((item) => (
                  <ReviewCard key={item.id} item={item} canCeo={canCeo} />
                ))}
                {!reviews.some((item) => !item.ceo) ? <Empty>Nothing is waiting on the manager.</Empty> : null}
                <h2 className="pt-2 text-lg font-black text-[#0F2744]">Needs CEO review</h2>
                {reviews.filter((item) => item.ceo).map((item) => (
                  <ReviewCard key={`ceo-${item.id}`} item={item} canCeo={canCeo} />
                ))}
                {!reviews.some((item) => item.ceo) ? <Empty>No supervisor escalations.</Empty> : null}
              </div>
            ) : null}

            {tab === "questions" ? (
              <div className="space-y-3 p-4">
                {questions.filter((item) => item.status === "open").map((question) => (
                  <article key={question.id} className="rounded-2xl border border-slate-100 bg-[#F8FAFC] p-4">
                    <InternName name={question.internName} src={question.avatarUrl} className="font-bold text-[#0F2744]" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">{question.question}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">{question.targetTitle || "Internship question"} · {whenLabel(question.askedAt)}</p>
                    <form action={answerInternQuestion} className="mt-3 space-y-2">
                      <input type="hidden" name="internId" value={question.internId} />
                      <input type="hidden" name="id" value={question.id} />
                      <textarea name="answer" required rows={2} placeholder="Answer, or point them to the right guide" className={fieldClass} />
                      <button className="min-h-10 rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">Save answer</button>
                    </form>
                  </article>
                ))}
                {!questions.some((item) => item.status === "open") ? <Empty>No open questions.</Empty> : null}
              </div>
            ) : null}

            {tab === "onboarding" ? (
              <div className="space-y-3 p-4">
                <article className="rounded-2xl bg-[#F8FAFC] p-4">
                  <h2 className="font-black text-[#0F2744]">Creative freedom</h2>
                  <p className="mt-1 text-sm font-medium text-slate-600">Most meaningful intern work should be Explore or Guided. Planner holds the assignment. You coach the thinking.</p>
                </article>
                {interns.map((intern) => (
                  <article key={intern.id} className="rounded-2xl border border-slate-100 p-4">
                    <InternName name={intern.name} src={intern.avatarUrl} size="sm" className="font-black text-[#0F2744]" />
                    <p className="mt-2 text-sm font-medium text-slate-600">{intern.onboarding}</p>
                    {intern.onboardingItems.map((item) => (
                      <p key={item.title} className="mt-1 text-xs font-semibold text-slate-500">{item.title}: {item.status}</p>
                    ))}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Link href={`/intern?view=${intern.id}`} className="inline-flex min-h-10 items-center rounded-full bg-[#2563EB] px-3 text-xs font-bold !text-white">Open portal</Link>
                      <Link href={`/intern/time?view=${intern.id}`} className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-3 text-xs font-bold text-[#0F2744]">Open time</Link>
                    </div>
                    {intern.userId ? (
                      <form action={saveMessagingPermission} className="mt-3 grid gap-2 sm:grid-cols-3">
                        <input type="hidden" name="userId" value={intern.userId} />
                        <select name="level" className={fieldClass}>
                          <option value="none">No community messaging</option>
                          <option value="view">View only</option>
                          <option value="reply_assigned">Reply to assigned</option>
                          <option value="initiate_approved">Start approved chats</option>
                          <option value="full">Full authorized messaging</option>
                        </select>
                        <select name="review" className={fieldClass}>
                          <option value="all">All messages need review</option>
                          <option value="selected">Selected messages need review</option>
                          <option value="independent">Independent within guardrails</option>
                        </select>
                        <button className="min-h-11 rounded-full bg-[#2563EB] text-sm font-bold !text-white">Save messaging</button>
                      </form>
                    ) : null}
                  </article>
                ))}
                {weeks.map((week) => (
                  <form key={`${week.internId}-${week.weekNumber}`} action={reviewInternWeek} className="grid gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 p-3 sm:grid-cols-[1fr_auto_auto]">
                    <input type="hidden" name="internId" value={week.internId} />
                    <input type="hidden" name="weekNumber" value={week.weekNumber} />
                    <p className="text-sm font-bold text-[#0F2744]">
                      <InternName name={week.internName} src={week.avatarUrl} /> · Week {week.weekNumber} is ready for review
                    </p>
                    <button name="action" value="recommend" className="min-h-10 rounded-full bg-[#16A34A] px-3 text-sm font-bold !text-white">Recommend approval</button>
                    <button name="action" value="return" className="min-h-10 rounded-full border border-amber-300 bg-white px-3 text-sm font-bold text-amber-950">Return</button>
                  </form>
                ))}
                {!interns.length ? <Empty>Onboarding appears when an intern is assigned.</Empty> : null}
              </div>
            ) : null}

            {tab === "requirements" && canEdit ? (
              <div className="space-y-4 p-4">
                <p className="text-sm font-medium text-slate-600">Requirement changes are audited. Approved hour entries stay as they were.</p>
                {interns.map((intern) => (
                  <form key={intern.id} action={saveRequirementConfig} className="grid gap-3 rounded-2xl border border-slate-100 p-4 sm:grid-cols-2">
                    <input type="hidden" name="internId" value={intern.id} />
                    <p className="sm:col-span-2"><InternName name={intern.name} src={intern.avatarUrl} className="font-black text-[#0F2744]" /></p>
                    <label className="text-sm font-semibold">Credits<input name="credits" defaultValue={intern.credits ?? ""} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Required hours<input name="requiredHours" defaultValue={intern.requiredHours ?? ""} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Weekly plan<input name="plannedWeeklyHours" defaultValue={intern.plannedWeeklyHours ?? ""} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Weeks<input name="internshipWeeks" defaultValue={intern.internshipWeeks ?? ""} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Start<input type="date" name="startDate" defaultValue={intern.academicStartDate} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">End<input type="date" name="endDate" defaultValue={intern.academicEndDate} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Term<input name="semester" defaultValue={intern.semester} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Academic year<input name="academicYear" defaultValue={intern.academicYear} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Requirement
                      <select name="requirementStatus" defaultValue={intern.requirementStatus || "pending"} className={fieldClass}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="amended">Amended</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold">School verification
                      <select name="verificationStatus" defaultValue={intern.universityVerificationStatus || "pending"} className={fieldClass}>
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                      </select>
                    </label>
                    <label className="text-sm font-semibold">Day-to-day manager<input name="managerName" defaultValue={intern.dayToDayManagerName || "Ava"} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Supervisor<input name="supervisorName" defaultValue={intern.siteSupervisorName || "Jason"} className={fieldClass} /></label>
                    <label className="text-sm font-semibold sm:col-span-2">University notes<textarea name="universityNotes" defaultValue={intern.universityNotes} rows={2} className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Exception week<input name="exceptionWeek" inputMode="numeric" className={fieldClass} /></label>
                    <label className="text-sm font-semibold">Exception hours<input name="exceptionHours" inputMode="decimal" className={fieldClass} /></label>
                    <label className="text-sm font-semibold sm:col-span-2">Reason<input name="reason" required placeholder="Why this requirement changed" className={fieldClass} /></label>
                    <button className="min-h-11 rounded-full bg-[#2563EB] text-sm font-bold !text-white sm:col-span-2">Save requirements</button>
                  </form>
                ))}
                {interns.map((intern) => (
                  <form key={`${intern.id}-zero`} action={approveWeekZero}>
                    <input type="hidden" name="internId" value={intern.id} />
                    <button className="text-sm font-bold text-[#2563EB]">Approve Start Here for {intern.name}</button>
                  </form>
                ))}
              </div>
            ) : null}
          </section>
        </div>

        <aside className="space-y-4">
          <article className={`${DESK_UI.card} p-4`}>
            <h2 className="text-sm font-black text-[#0F2744]">Quick Actions</h2>
            <div className="mt-3 grid gap-2">
              <Link href="/manager/assignments?create=true" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#2563EB] text-sm font-bold !text-white">
                <Plus size={16} /> Assign New Task
              </Link>
              <Link href="/manager/check-ins" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0F2744]">
                <CalendarCheck2 size={16} /> Schedule Check-in
              </Link>
              <Link href="/manager/reports" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0F2744]">
                <BarChart3 size={16} /> View Reports
              </Link>
              <Link href="/manager/training" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0F2744]">
                <GraduationCap size={16} /> Training
              </Link>
              <Link href="/manager/resources" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 text-sm font-bold text-[#0F2744]">
                <FolderOpen size={16} /> Resources
              </Link>
            </div>
          </article>

          <article className={`${DESK_UI.card} p-4`}>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-[#0F2744]">Pending Approvals ({reviews.length})</h2>
              <button type="button" onClick={() => setTab("reviews")} className="text-xs font-bold text-[#2563EB]">View all</button>
            </div>
            <ul className="mt-3 space-y-3">
              {pending.map((item) => (
                <li key={item.id} className="rounded-2xl border border-slate-100 p-3">
                  <div className="flex items-start gap-2">
                    <PersonFace name={item.internName} src={item.avatarUrl} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-black text-[#0F2744]">{item.title}</p>
                      <p className="text-xs font-medium text-slate-500">{item.internName} · {whenLabel(item.submittedAt) || item.weekLabel}</p>
                    </div>
                  </div>
                  <ApprovalActions item={item} canCeo={canCeo} />
                </li>
              ))}
              {!pending.length ? <Empty>Nothing is waiting for approval.</Empty> : null}
            </ul>
          </article>

          <article className={`${DESK_UI.card} p-4`}>
            <h2 className="text-sm font-black text-[#0F2744]">Recent Activity</h2>
            <ul className="mt-3 space-y-3">
              {activity.map((item) => (
                <li key={item.id} className="flex items-start gap-2">
                  <PersonFace name={item.name} src={item.avatarUrl} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#0F2744]">{item.text}</p>
                    <p className="text-xs font-medium text-slate-400">{item.when}</p>
                  </div>
                </li>
              ))}
              {!activity.length ? <Empty>Intern activity will show up here.</Empty> : null}
            </ul>
          </article>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) {
  return (
    <article className={`rounded-2xl p-4 ${tone}`}>
      <p className="text-3xl font-black text-[#0F2744]">{value}</p>
      <p className="mt-1 text-sm font-black text-[#0F2744]">{label}</p>
      <p className="mt-1 text-xs font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function Empty({ children }: { children: string }) {
  return <p className="text-sm font-medium text-slate-500">{children}</p>;
}

function ApprovalActions({ item, canCeo }: { item: DeskReview; canCeo: boolean }) {
  if (item.ceo && !canCeo) {
    return <p className="mt-2 text-xs font-semibold text-amber-800">Needs CEO review.</p>;
  }
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      <form action={reviewPortalSubmission}>
        <input type="hidden" name="internId" value={item.internId} />
        <input type="hidden" name="targetType" value={item.targetType} />
        <input type="hidden" name="targetId" value={item.id} />
        <button name="reviewAction" value={item.ceo ? "ceo_approve" : "approve"} className="min-h-9 rounded-lg bg-[#16A34A] px-3 text-xs font-bold !text-white">
          {item.ceo ? "CEO approve" : "Approve"}
        </button>
      </form>
      <form action={reviewPortalSubmission} className="flex min-w-0 flex-1 gap-2">
        <input type="hidden" name="internId" value={item.internId} />
        <input type="hidden" name="targetType" value={item.targetType} />
        <input type="hidden" name="targetId" value={item.id} />
        <input name="comment" required placeholder="What to change" className="min-h-9 min-w-0 flex-1 rounded-lg border border-slate-200 px-2 text-xs" />
        <button name="reviewAction" value={item.ceo ? "ceo_request_changes" : "request_changes"} className="min-h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-bold text-[#0F2744]">
          Request Changes
        </button>
      </form>
    </div>
  );
}

function ReviewCard({ item, canCeo }: { item: DeskReview; canCeo: boolean }) {
  const locked = item.ceo && !canCeo;
  return (
    <article className="rounded-2xl border border-slate-100 p-4">
      <InternName name={item.internName} src={item.avatarUrl} className="font-bold text-[#0F2744]" />
      <h3 className="mt-2 font-black text-[#0F2744]">{item.title}</h3>
      <p className="text-sm font-medium text-slate-600">
        {item.statusLabel} · {item.targetType} · {item.weekLabel}
        {item.hours ? ` · ${item.hours} hours` : ""}
      </p>
      {item.evidence ? (
        <a href={item.evidence} className="mt-1 inline-flex text-sm font-bold text-[#2563EB]">Open evidence</a>
      ) : null}
      {locked ? (
        <p className="mt-2 text-sm font-semibold text-amber-800">Needs CEO review. Jason takes this one.</p>
      ) : (
        <form action={reviewPortalSubmission} className="mt-3 space-y-2">
          <input type="hidden" name="internId" value={item.internId} />
          <input type="hidden" name="targetType" value={item.targetType} />
          <input type="hidden" name="targetId" value={item.id} />
          <textarea name="comment" rows={2} placeholder="Note for the intern" className={fieldClass} />
          <div className="flex flex-wrap gap-2">
            <button name="reviewAction" value={item.ceo ? "ceo_approve" : "approve"} className="min-h-10 rounded-full bg-[#16A34A] px-4 text-sm font-bold !text-white">
              {item.ceo ? "CEO approve" : "Approve"}
            </button>
            <button name="reviewAction" value={item.ceo ? "ceo_request_changes" : "request_changes"} className="min-h-10 rounded-full border border-slate-200 px-4 text-sm font-bold text-[#0F2744]">
              Request changes
            </button>
            {!item.ceo ? (
              <button name="reviewAction" value="escalate" className="min-h-10 rounded-full border border-slate-200 px-4 text-sm font-bold text-[#0F2744]">
                Escalate to supervisor
              </button>
            ) : null}
          </div>
        </form>
      )}
    </article>
  );
}
