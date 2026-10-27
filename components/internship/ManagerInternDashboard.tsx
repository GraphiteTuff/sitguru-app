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
import {
  internGhostBtnClass,
  internPressClass,
  internPrimaryBtnClass,
} from "@/lib/internship/intern-ui";
import { internPortalHeroClass } from "@/lib/internship/portal";
import {
  isSitGuruWorkEmail,
  sitguruTeamsHref,
} from "@/lib/admin/growth/teams-access";

const TABS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "reviews", label: "Reviews" },
  { id: "interns", label: "Interns" },
  { id: "calendar", label: "Calendar" },
  { id: "more", label: "More" },
] as const;

type TabId = (typeof TABS)[number]["id"];

const CARD_SHELL =
  "overflow-hidden rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-5";

function StatusText({ label }: { label: string }) {
  const tone = label.toLowerCase();
  const classes =
    tone.includes("ready") ||
    tone.includes("approved") ||
    tone.includes("on track") ||
    tone.includes("active")
      ? "bg-emerald-50 text-emerald-900 ring-emerald-200"
      : tone.includes("review") ||
          tone.includes("waiting") ||
          tone.includes("pending") ||
          tone.includes("submitted")
        ? "bg-amber-50 text-amber-950 ring-amber-200"
        : tone.includes("block") ||
            tone.includes("overdue") ||
            tone.includes("behind") ||
            tone.includes("change")
          ? "bg-rose-50 text-rose-900 ring-rose-200"
          : tone.includes("question") || tone.includes("ask")
            ? "bg-sky-50 text-sky-900 ring-sky-200"
            : "bg-white text-slate-800 ring-amber-100";

  return (
    <span
      className={`inline-flex min-h-8 items-center rounded-full px-2.5 py-1 text-[11px] font-black uppercase tracking-[0.12em] ring-1 ${classes}`}
    >
      {label}
    </span>
  );
}

function InternCard({ card }: { card: ManagerInternCard }) {
  return (
    <article className={CARD_SHELL}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-800">
            Assigned intern
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-slate-950">
            {card.name}
          </h2>
          <p className="text-sm font-semibold text-slate-600">{card.school}</p>
        </div>
        <span className="rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] !text-white">
          {card.weekLabel}
        </span>
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
          <div
            key={label}
            className="rounded-2xl border border-amber-100/80 bg-[#FAF6EE] px-3 py-2"
          >
            <dt className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-800">
              {label}
            </dt>
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
    <article className={CARD_SHELL}>
      <div className="flex flex-wrap items-center gap-2">
        <StatusText label={item.statusLabel} />
        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-amber-950 ring-1 ring-amber-200">
          {item.internName}
        </span>
      </div>
      <h3 className="mt-2 text-lg font-black text-slate-950">{item.title}</h3>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        {item.targetType} · {item.weekLabel}
        {item.hours ? ` · ${item.hours} hours` : ""}
        {item.reportSection ? ` · ${item.reportSection.replaceAll("_", " ")}` : ""}
      </p>
      {item.submittedAt ? (
        <p className="mt-1 text-xs font-semibold text-slate-500">
          Submitted {item.submittedAt.slice(0, 10)}
        </p>
      ) : null}
      {item.evidence ? (
        <a
          href={item.evidence}
          className="mt-2 inline-flex min-h-11 items-center text-sm font-black text-emerald-800"
        >
          Open evidence
        </a>
      ) : null}
      {locked ? (
        <p className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-950">
          Needs CEO review. Jason takes this one.
        </p>
      ) : (
        <form action={reviewPortalSubmission} className="mt-3 space-y-2">
          <input type="hidden" name="internId" value={item.internId} />
          <input type="hidden" name="targetType" value={item.targetType} />
          <input type="hidden" name="targetId" value={item.id} />
          <label className="block">
            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
              Note
            </span>
            <textarea
              name="comment"
              rows={2}
              className="mt-1 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/60 px-3 py-3 text-base font-semibold"
            />
          </label>
          <div className="grid gap-2 sm:grid-cols-2">
            {item.ceo ? (
              <button
                name="reviewAction"
                value="ceo_approve"
                className={internPrimaryBtnClass}
              >
                CEO approve
              </button>
            ) : (
              <button
                name="reviewAction"
                value="approve"
                className={internPrimaryBtnClass}
              >
                Approve
              </button>
            )}
            <button
              name="reviewAction"
              value={item.ceo ? "ceo_request_changes" : "request_changes"}
              className={`min-h-12 rounded-2xl border border-amber-300 bg-amber-50 px-3 text-sm font-black text-amber-950 ${internPressClass}`}
            >
              Request changes
            </button>
            {!item.ceo ? (
              <button
                name="reviewAction"
                value="escalate"
                className={internGhostBtnClass}
              >
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
  actorEmail = null,
}: {
  cards: ManagerInternCard[];
  reviews: ManagerReviewItem[];
  questions: ManagerQuestion[];
  interns: InternshipIntern[];
  notices?: { id: string; internId: string; title: string; body: string; createdAt: string }[];
  canEdit: boolean;
  canCeo: boolean;
  notice?: { kind: "ok" | "error"; message: string } | null;
  /** Viewer email — Teams deep links only for @sitguru.com work mailboxes. */
  actorEmail?: string | null;
}) {
  const [tab, setTab] = useState<TabId>("dashboard");
  const openQuestions = questions.filter((question) => question.status === "open");
  const canOpenTeams = isSitGuruWorkEmail(actorEmail);

  return (
    <div className="space-y-4 pb-24 sm:pb-8">
      {notice ? (
        <p
          className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${
            notice.kind === "ok"
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-rose-200 bg-rose-50 text-rose-800"
          }`}
        >
          {notice.message}
        </p>
      ) : null}
      {notices.map((item) => (
        <section
          key={item.id}
          className="overflow-hidden rounded-[2rem] border border-sky-200 bg-sky-50 p-4 shadow-sm"
        >
          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-800">
            {item.title}
          </p>
          <p className="mt-2 text-sm font-semibold text-slate-800">{item.body}</p>
          <form action={dismissStaffNotice} className="mt-3">
            <input type="hidden" name="id" value={item.id} />
            <button className={internPrimaryBtnClass}>Got it</button>
          </form>
        </section>
      ))}

      <header className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
        <div
          className={`grid gap-4 px-5 py-6 sm:px-6 sm:py-7 ${internPortalHeroClass("emerald")}`}
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-900 shadow-sm">
              Intern Team Desk
            </span>
            <span className="rounded-full bg-emerald-700 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] !text-white">
              Intern team
            </span>
            <span className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-slate-700 shadow-sm">
              {cards.length} assigned
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-[-0.045em] text-slate-950 sm:text-4xl">
              My intern team
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-800">
              You see the interns assigned to you. Routine work stays here. Your
              supervisor sees what you escalate.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/manager" className={`${internPrimaryBtnClass} rounded-full`}>
              Manager Portal
            </Link>
            <Link href="/intern" className={`${internGhostBtnClass} rounded-full`}>
              Intern portal
            </Link>
          </div>
        </div>
      </header>

      <div className="hidden flex-wrap gap-2 sm:flex">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={
              tab === item.id
                ? `min-h-11 rounded-full bg-[#2563EB] px-4 text-sm font-black !text-white ${internPressClass}`
                : `min-h-11 rounded-full border border-amber-200 bg-amber-50 px-4 text-sm font-black text-amber-950 ${internPressClass}`
            }
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
            <p className="rounded-[2rem] border border-amber-100 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              No active interns are assigned yet.
            </p>
          ) : null}
        </div>
      ) : null}

      {tab === "reviews" ? (
        <section className="space-y-3">
          <h2 className="text-xl font-black text-slate-950">Needs manager review</h2>
          {reviews
            .filter((item) => !item.ceo)
            .map((item) => (
              <ReviewCard
                key={`${item.targetType}-${item.id}`}
                item={item}
                canCeo={canCeo}
              />
            ))}
          {!reviews.some((item) => !item.ceo) ? (
            <p className="rounded-[2rem] border border-amber-100 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              Nothing is waiting on you.
            </p>
          ) : null}
          <h2 className="pt-2 text-xl font-black text-slate-950">Needs CEO review</h2>
          {reviews
            .filter((item) => item.ceo)
            .map((item) => (
              <ReviewCard key={`ceo-${item.id}`} item={item} canCeo={canCeo} />
            ))}
          {!reviews.some((item) => item.ceo) ? (
            <p className="rounded-[2rem] border border-amber-100 bg-white p-5 text-sm font-semibold text-slate-600 shadow-sm">
              No escalations.
            </p>
          ) : null}
        </section>
      ) : null}

      {tab === "calendar" ? (
        <section className={CARD_SHELL}>
          <h2 className="text-xl font-black text-slate-950">Internship calendar</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            Milestones live here. Meetings stay in Teams and Outlook.
          </p>
          <ul className="mt-4 space-y-2">
            {cards.map((card) => (
              <li
                key={card.id}
                className="rounded-2xl border border-amber-100/80 bg-[#FAF6EE] px-3 py-3"
              >
                <p className="font-black text-slate-950">{card.name}</p>
                <p className="text-sm font-semibold text-slate-600">
                  Next deadline: {card.nextDeadline}
                </p>
                <p className="text-sm font-semibold text-slate-600">{card.milestone}</p>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            {canOpenTeams ? (
              <a
                href={sitguruTeamsHref()}
                target="_blank"
                rel="noreferrer"
                className={internPrimaryBtnClass}
              >
                Marketing & Community Growth · Open in Teams
              </a>
            ) : (
              <p className="w-full text-sm font-semibold text-slate-600">
                Teams (teams.cloud.microsoft) opens only for SitGuru work accounts
                (@sitguru.com), such as jason@sitguru.com or ava@sitguru.com.
              </p>
            )}
            <Link href="/admin/internship/timeline" className={internGhostBtnClass}>
              Open milestone timeline
            </Link>
          </div>
        </section>
      ) : null}

      {tab === "more" ? (
        <div className="space-y-4">
          <section className="space-y-3">
            <h2 className="text-xl font-black text-slate-950">Questions / blockers</h2>
            {openQuestions.map((question) => (
              <article key={question.id} className={CARD_SHELL}>
                <p className="text-xs font-black uppercase tracking-[0.12em] text-sky-800">
                  {question.internName} ·{" "}
                  {question.urgency === "high" ? "Blocking" : "Question"} ·{" "}
                  {question.status}
                </p>
                <h3 className="mt-1 font-black text-slate-950">
                  {question.targetTitle || "Internship question"}
                </h3>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {question.question}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {question.askedAt.slice(0, 10)}
                </p>
                {question.answer ? (
                  <p className="mt-2 rounded-2xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-900">
                    {question.answer}
                  </p>
                ) : null}
                {question.status === "open" ? (
                  <form action={answerInternQuestion} className="mt-3 space-y-2">
                    <input type="hidden" name="internId" value={question.internId} />
                    <input type="hidden" name="id" value={question.id} />
                    <textarea
                      name="answer"
                      required
                      rows={2}
                      placeholder="Answer, or point them to the right guide"
                      className="w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/60 px-3 py-3 text-base font-semibold"
                    />
                    <button className={internPrimaryBtnClass}>Save answer</button>
                  </form>
                ) : null}
              </article>
            ))}
            {!openQuestions.length ? (
              <p className="text-sm font-semibold text-slate-600">No open questions.</p>
            ) : null}
          </section>

          {canEdit ? (
            <section className={CARD_SHELL}>
              <h2 className="text-xl font-black text-slate-950">
                University requirements
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Changes are audited. Approved hour entries stay as they were.
              </p>
              {interns.map((intern) => (
                <form
                  key={intern.id}
                  action={saveRequirementConfig}
                  className="mt-4 grid gap-3 border-t border-amber-100 pt-4 sm:grid-cols-2"
                >
                  <input type="hidden" name="internId" value={intern.id} />
                  <p className="font-black text-slate-950 sm:col-span-2">
                    {intern.fullName}
                  </p>
                  <label className="block text-sm font-semibold">
                    Credits
                    <input
                      name="credits"
                      defaultValue={intern.credits ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Required hours
                    <input
                      name="requiredHours"
                      defaultValue={intern.requiredHours ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Weekly plan
                    <input
                      name="plannedWeeklyHours"
                      defaultValue={intern.plannedWeeklyHours ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Weeks
                    <input
                      name="internshipWeeks"
                      defaultValue={intern.internshipWeeks ?? ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Start
                    <input
                      type="date"
                      name="startDate"
                      defaultValue={intern.academicStartDate || ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    End
                    <input
                      type="date"
                      name="endDate"
                      defaultValue={intern.academicEndDate || ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Term
                    <input
                      name="semester"
                      defaultValue={intern.semester}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Academic year
                    <input
                      name="academicYear"
                      defaultValue={intern.academicYear || ""}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Requirement
                    <select
                      name="requirementStatus"
                      defaultValue={intern.requirementStatus || "pending"}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="amended">Amended</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    School verification
                    <select
                      name="verificationStatus"
                      defaultValue={intern.universityVerificationStatus || "pending"}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                    </select>
                  </label>
                  <label className="block text-sm font-semibold">
                    Day-to-day manager
                    <input
                      name="managerName"
                      defaultValue={intern.dayToDayManagerName || "Ava"}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Supervisor
                    <input
                      name="supervisorName"
                      defaultValue={intern.siteSupervisorName || "Jason"}
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold sm:col-span-2">
                    University notes
                    <textarea
                      name="universityNotes"
                      defaultValue={intern.universityNotes || ""}
                      rows={2}
                      className="mt-1 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 py-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Exception week
                    <input
                      name="exceptionWeek"
                      inputMode="numeric"
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold">
                    Exception hours
                    <input
                      name="exceptionHours"
                      inputMode="decimal"
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <label className="block text-sm font-semibold sm:col-span-2">
                    Reason
                    <input
                      name="reason"
                      required
                      placeholder="Why this requirement changed"
                      className="mt-1 min-h-12 w-full rounded-xl border border-amber-100 bg-[#FAF6EE]/40 px-3 text-base"
                    />
                  </label>
                  <button
                    className={`${internPrimaryBtnClass} sm:col-span-2`}
                  >
                    Save requirements
                  </button>
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
            <p className="text-sm font-semibold text-slate-600">
              Requirement changes stay with Jason.
            </p>
          )}
        </div>
      ) : null}

    </div>
  );
}
