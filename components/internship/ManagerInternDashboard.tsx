"use client";

import { useState } from "react";
import Link from "next/link";
import { dismissStaffNotice } from "@/lib/internship/assignment-actions";
import {
  answerInternQuestion,
  approveWeekZero,
  reviewPortalSubmission,
  saveRequirementConfig,
} from "@/lib/internship/portal-actions";
import AskAvaForm from "@/components/internship/AskAvaForm";
import type { ManagerInternCard, ManagerQuestion, ManagerReviewItem } from "@/lib/internship/manager-dashboard";
import type { InternshipIntern } from "@/lib/internship/types";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "reviews", label: "Reviews" },
  { id: "interns", label: "Interns" },
  { id: "calendar", label: "Calendar" },
  { id: "more", label: "More" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function StatusText({ label }: { label: string }) {
  return (
    <span className="inline-flex min-h-8 items-center rounded-full bg-white px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-slate-800 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function InternCard({ card }: { card: ManagerInternCard }) {
  return (
    <article className="rounded-[1.6rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-xl font-black text-slate-950">{card.name}</h2>
          <p className="text-sm font-semibold text-slate-600">{card.school}</p>
        </div>
        <p className="text-sm font-black text-emerald-900">{card.weekLabel}</p>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {card.statuses.map((status) => (
          <StatusText key={status} label={status} />
        ))}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
        {[
          ["Required", card.requiredLabel],
          ["Expected", card.expectedLabel],
          ["Submitted", card.submittedLabel],
          ["Approved", card.approvedLabel],
          ["Remaining", card.remainingLabel],
          ["Pace", card.paceLabel],
          ["Phase", card.phase],
          ["Milestone", card.milestone],
          ["Awaiting review", String(card.awaitingReview)],
          ["Questions", String(card.questions)],
          ["Next deadline", card.nextDeadline],
          ["Last submission", card.lastSubmission],
        ].map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-[#FAF6EE] px-3 py-2">
            <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">{label}</dt>
            <dd className="mt-1 font-bold text-slate-950">{value}</dd>
          </div>
        ))}
      </dl>
    </article>
  );
}

function ReviewCard({
  item,
  canCeo,
}: {
  item: ManagerReviewItem;
  canCeo: boolean;
}) {
  const locked = item.ceo && !canCeo;
  return (
    <article className="rounded-[1.6rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <StatusText label={item.statusLabel} />
        <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-500">{item.internName}</span>
      </div>
      <h3 className="mt-2 text-lg font-black text-slate-950">{item.title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        {item.targetType} · {item.weekLabel}
        {item.hours ? ` · ${item.hours} hours` : ""}
        {item.reportSection ? ` · ${item.reportSection.replaceAll("_", " ")}` : ""}
      </p>
      {item.submittedAt ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">Submitted {item.submittedAt.slice(0, 10)}</p>
      ) : null}
      {item.evidence ? (
        <a href={item.evidence} className="mt-2 inline-flex min-h-11 items-center text-sm font-black text-emerald-800">
          Open evidence
        </a>
      ) : null}
      {locked ? (
        <p className="mt-3 text-sm font-semibold text-amber-900">Needs CEO review. Jason takes this one.</p>
      ) : (
        <form action={reviewPortalSubmission} className="mt-3 space-y-2">
          <input type="hidden" name="internId" value={item.internId} />
          <input type="hidden" name="targetType" value={item.targetType} />
          <input type="hidden" name="targetId" value={item.id} />
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Note</span>
            <textarea name="comment" rows={2} className="mt-1 w-full rounded-xl border border-emerald-100 px-3 py-3 text-base font-semibold" />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {item.ceo ? (
              <button name="reviewAction" value="ceo_approve" className="min-h-12 rounded-2xl bg-[#166534] px-3 text-sm font-black !text-white">
                CEO approve
              </button>
            ) : (
              <button name="reviewAction" value="approve" className="min-h-12 rounded-2xl bg-[#166534] px-3 text-sm font-black !text-white">
                Approve
              </button>
            )}
            <button name="reviewAction" value={item.ceo ? "ceo_request_changes" : "request_changes"} className="min-h-12 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-sm font-black text-amber-950">
              Request changes
            </button>
            {!item.ceo ? (
              <button name="reviewAction" value="escalate" className="min-h-12 rounded-2xl border border-slate-200 px-3 text-sm font-black text-slate-800">
                Escalate to supervisor
              </button>
            ) : null}
          </div>
        </form>
      )}
      <div className="mt-3">
        <AskAvaForm
          internId={item.internId}
          targetType={item.targetType}
          targetId={item.id}
          targetTitle={item.title}
          returnTo="/intern/manage?tab=reviews"
          label="Ask intern"
          placeholder="What should the intern clarify?"
        />
      </div>
    </article>
  );
}

export default function ManagerInternDashboard({
  cards,
  reviews,
  questions,
  interns,
  canEdit,
  canCeo,
  notices = [],
  notice,
}: {
  cards: ManagerInternCard[];
  reviews: ManagerReviewItem[];
  questions: ManagerQuestion[];
  interns: InternshipIntern[];
  notices?: { id: string; internId: string; title: string; body: string; createdAt: string }[];
  canEdit: boolean;
  canCeo: boolean;
  notice?: { kind: "ok" | "error"; message: string } | null;
}) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const openQuestions = questions.filter((question) => question.status === "open");

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${notice.kind === "ok" ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-800"}`}>
          {notice.message}
        </p>
      ) : null}
      {notices.map((item) => (
        <section key={item.id} className="rounded-[1.6rem] border border-sky-200 bg-sky-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-800">{item.title}</p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{item.body}</p>
          <form action={dismissStaffNotice} className="mt-3">
            <input type="hidden" name="id" value={item.id} />
            <button className="min-h-11 rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white">Got it</button>
          </form>
        </section>
      ))}
      <header className="rounded-[1.8rem] bg-[#FAF6EE] p-1">
        <div className="public-dark-section rounded-[1.6rem] px-4 py-5 sm:px-6" data-brand-green style={{ background: "#0D5C3A" }}>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-white/80">Intern team</p>
          <h1 className="mt-1 text-3xl font-black !text-white">My intern team</h1>
          <p className="mt-2 max-w-2xl text-sm font-semibold !text-white/90">
            You see the interns assigned to you. Routine work stays here. Your supervisor sees what you escalate.
          </p>
        </div>
      </header>

      <div className="hidden gap-2 sm:flex">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-11 flex-1 rounded-2xl px-3 text-sm font-black ${tab === item.id ? "bg-[#166534] !text-white" : "bg-white text-slate-700 ring-1 ring-slate-200"}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" || tab === "interns" ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {cards.map((card) => (
            <InternCard key={card.id} card={card} />
          ))}
          {!cards.length ? (
            <p className="rounded-[1.4rem] bg-white p-4 text-sm font-semibold text-slate-600">No active interns are assigned yet.</p>
          ) : null}
        </div>
      ) : null}

      {tab === "reviews" ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-950">Needs manager review</h2>
          {reviews.filter((item) => !item.ceo).map((item) => (
            <ReviewCard key={`${item.targetType}-${item.id}`} item={item} canCeo={canCeo} />
          ))}
          {!reviews.some((item) => !item.ceo) ? (
            <p className="rounded-[1.4rem] bg-white p-4 text-sm font-semibold text-slate-600">Nothing is waiting on you.</p>
          ) : null}
          <h2 className="pt-2 text-xl font-black text-slate-950">Needs CEO review</h2>
          {reviews.filter((item) => item.ceo).map((item) => (
            <ReviewCard key={`ceo-${item.id}`} item={item} canCeo={canCeo} />
          ))}
          {!reviews.some((item) => item.ceo) ? (
            <p className="rounded-[1.4rem] bg-white p-4 text-sm font-semibold text-slate-600">No escalations.</p>
          ) : null}
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className="space-y-3 rounded-[1.6rem] border border-emerald-100 bg-white p-4">
          <h2 className="text-xl font-black text-slate-950">Internship calendar</h2>
          <p className="text-sm font-semibold text-slate-600">
            Milestones live here. Meetings stay in Teams and Outlook.
          </p>
          <ul className="space-y-2">
            {cards.map((card) => (
              <li key={card.id} className="rounded-2xl bg-[#FAF6EE] px-3 py-3">
                <p className="font-black text-slate-950">{card.name}</p>
                <p className="text-sm font-semibold text-slate-600">Next deadline: {card.nextDeadline}</p>
                <p className="text-sm font-semibold text-slate-600">{card.milestone}</p>
              </li>
            ))}
          </ul>
          <a href="https://teams.microsoft.com" className="inline-flex min-h-12 items-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white">
            Weekly Growth Meeting · Open in Microsoft Teams
          </a>
          <Link href="/admin/internship/timeline" className="inline-flex min-h-12 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
            Open milestone timeline
          </Link>
        </section>
      ) : null}

      {tab === "more" ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-950">Questions / blockers</h2>
            {openQuestions.map((question) => (
              <article key={question.id} className="rounded-[1.6rem] border border-sky-100 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-800">
                  {question.internName} · {question.urgency === "high" ? "Blocking" : "Question"} · {question.status}
                </p>
                <h3 className="mt-1 font-black text-slate-950">{question.targetTitle || "Internship question"}</h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">{question.question}</p>
                <p className="mt-1 text-xs font-semibold text-slate-500">{question.askedAt.slice(0, 10)}</p>
                {question.answer ? <p className="mt-2 text-sm font-semibold text-emerald-900">{question.answer}</p> : null}
                {question.status === "open" ? (
                  <form action={answerInternQuestion} className="mt-3 space-y-2">
                    <input type="hidden" name="internId" value={question.internId} />
                    <input type="hidden" name="id" value={question.id} />
                    <textarea name="answer" required rows={2} placeholder="Answer, or point them to the right guide" className="w-full rounded-xl border border-emerald-100 px-3 py-3 text-base font-semibold" />
                    <button className="min-h-12 rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white">Save answer</button>
                  </form>
                ) : null}
              </article>
            ))}
            {!openQuestions.length ? <p className="text-sm font-semibold text-slate-600">No open questions.</p> : null}
          </section>

          {canEdit ? (
            <section className="rounded-[1.6rem] border border-emerald-100 bg-white p-4">
              <h2 className="text-xl font-black text-slate-950">University requirements</h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Changes are audited. Approved hour entries stay as they were.
              </p>
              {interns.map((intern) => (
                <form key={intern.id} action={saveRequirementConfig} className="mt-4 grid gap-3 border-t border-emerald-50 pt-4 sm:grid-cols-2">
                  <input type="hidden" name="internId" value={intern.id} />
                  <p className="font-black text-slate-950 sm:col-span-2">{intern.fullName}</p>
                  <label className="block text-sm font-semibold">Credits
                    <input name="credits" defaultValue={intern.credits ?? ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Required hours
                    <input name="requiredHours" defaultValue={intern.requiredHours ?? ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Weekly plan
                    <input name="plannedWeeklyHours" defaultValue={intern.plannedWeeklyHours ?? ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Weeks
                    <input name="internshipWeeks" defaultValue={intern.internshipWeeks ?? ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Start
                    <input type="date" name="startDate" defaultValue={intern.academicStartDate || ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">End
                    <input type="date" name="endDate" defaultValue={intern.academicEndDate || ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Term
                    <input name="semester" defaultValue={intern.semester} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Academic year
                    <input name="academicYear" defaultValue={intern.academicYear || ""} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Requirement
                    <select name="requirementStatus" defaultValue={intern.requirementStatus || "pending"} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="amended">Amended</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">School verification
                    <select name="verificationStatus" defaultValue={intern.universityVerificationStatus || "pending"} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">Day-to-day manager
                    <input name="managerName" defaultValue={intern.dayToDayManagerName || "Ava"} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Supervisor
                    <input name="supervisorName" defaultValue={intern.siteSupervisorName || "Jason"} className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold sm:col-span-2">University notes
                    <textarea name="universityNotes" defaultValue={intern.universityNotes || ""} rows={2} className="mt-1 w-full rounded-xl border px-3 py-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Exception week
                    <input name="exceptionWeek" inputMode="numeric" className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold">Exception hours
                    <input name="exceptionHours" inputMode="decimal" className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <label className="block text-sm font-semibold sm:col-span-2">Reason
                    <input name="reason" required placeholder="Why this requirement changed" className="mt-1 min-h-12 w-full rounded-xl border px-3 text-base" />
                  </label>
                  <button className="min-h-12 rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white sm:col-span-2">Save requirements</button>
                </form>
              ))}
              {interns.map((intern) => (
                <form key={`${intern.id}-zero`} action={approveWeekZero} className="mt-3">
                  <input type="hidden" name="internId" value={intern.id} />
                  <button className="min-h-11 text-sm font-black text-emerald-800 underline">
                    Approve Start Here for {intern.preferredName || intern.fullName}
                  </button>
                </form>
              ))}
            </section>
          ) : (
            <p className="text-sm font-semibold text-slate-600">Requirement changes stay with Jason.</p>
          )}
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-emerald-100 bg-white/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur sm:hidden">
        <div className="grid grid-cols-5 gap-1">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`min-h-12 rounded-2xl text-[11px] font-black ${tab === item.id ? "bg-emerald-50 text-emerald-900" : "text-slate-500"}`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
