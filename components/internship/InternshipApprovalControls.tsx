"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  approveInternshipEmployer,
  recordUniversityApproval,
} from "@/lib/internship/approval-actions";
import { UNIVERSITY_EVIDENCE_TYPES } from "@/lib/internship/approval-workflow";
import { PawActionButton } from "@/components/pawpulse/PawActionButton";

export type InternshipApprovalCard = {
  recordId: string;
  name: string;
  university: string;
  position: string;
  cohort: string;
  dates: string;
  credits: string;
  hours: string;
  schedule: string;
  manager: string;
  supervisor: string;
  employer: string;
  employerPending: boolean;
  universityStatus: string;
  onboarding: string;
  activation: string;
  nextAction: string;
};

const field = "mt-1 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-900";
const menuLink = "block rounded-xl px-3 py-2 text-left text-sm font-bold text-slate-700 hover:bg-emerald-50";

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm text-slate-600">
      <span className="font-black text-slate-900">{label}: </span>
      {value}
    </p>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="fixed inset-0 z-[120] flex items-end justify-center bg-slate-950/45 p-3 sm:items-center">
      <div role="dialog" aria-modal="true" aria-labelledby="approval-title" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-[1.5rem] bg-white p-5 shadow-xl">
        <h2 id="approval-title" className="text-xl font-black text-slate-950">{title}</h2>
        <div className="mt-3 space-y-2">{children}</div>
        <button type="button" className="mt-4 text-sm font-bold text-slate-500" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
}

export function InternshipApprovalMenu({
  card,
  canAdminister,
}: {
  card: InternshipApprovalCard;
  canAdminister: boolean;
}) {
  const [open, setOpen] = useState<"approve" | "university" | null>(null);
  return (
    <details className="relative">
      <summary className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-lg border border-slate-200 text-slate-600">
        <span className="sr-only">More actions for {card.name}</span>
        <span aria-hidden>⋯</span>
      </summary>
      <div className="absolute right-0 z-20 mt-1 w-56 rounded-2xl border border-slate-200 bg-white p-1 shadow-lg">
        <Link className={menuLink} href={`/admin/internship/interns/${card.recordId}#profile`}>View Intern Record</Link>
        {canAdminister && card.employerPending ? (
          <button type="button" className={`${menuLink} w-full`} onClick={() => setOpen("approve")}>Approve Internship</button>
        ) : null}
        {canAdminister ? (
          <button type="button" className={`${menuLink} w-full`} onClick={() => setOpen("university")}>Record University Approval</button>
        ) : null}
        <Link className={menuLink} href={`/admin/internship/interns/${card.recordId}#onboarding`}>Manage Onboarding</Link>
        <Link className={menuLink} href={`/admin/internship/interns#plan-${card.recordId}`}>Edit Academic Plan</Link>
        <Link className={menuLink} href="/admin/internship/time">View Hours and Progress</Link>
      </div>
      {open === "approve" ? <ApproveDialog card={card} onClose={() => setOpen(null)} /> : null}
      {open === "university" ? <UniversityDialog card={card} onClose={() => setOpen(null)} /> : null}
    </details>
  );
}

export function InternshipApprovalButtons({ card }: { card: InternshipApprovalCard }) {
  const [open, setOpen] = useState<"approve" | "university" | null>(null);
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {card.employerPending ? (
        <button type="button" className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white" onClick={() => setOpen("approve")}>
          Approve Internship
        </button>
      ) : null}
      <button type="button" className="inline-flex min-h-11 items-center rounded-2xl border border-slate-200 px-4 text-sm font-black text-slate-800" onClick={() => setOpen("university")}>
        Record University Approval
      </button>
      {open === "approve" ? <ApproveDialog card={card} onClose={() => setOpen(null)} /> : null}
      {open === "university" ? <UniversityDialog card={card} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}

function ApproveDialog({ card, onClose }: { card: InternshipApprovalCard; onClose: () => void }) {
  const router = useRouter();
  return (
    <Modal title={`Approve ${card.name}`} onClose={onClose}>
      <Fact label="Intern" value={`${card.name} · ${card.university}`} />
      <Fact label="Position" value={card.position} />
      <Fact label="Cohort" value={`${card.cohort} · ${card.dates}`} />
      <Fact label="Credits and hours" value={`${card.credits} · ${card.hours} · ${card.schedule}`} />
      <Fact label="Manager" value={card.manager} />
      <Fact label="Supervisor" value={card.supervisor} />
      <Fact label="Employer decision" value={card.employer} />
      <Fact label="University" value={card.universityStatus} />
      <Fact label="Onboarding" value={card.onboarding} />
      <p className="text-sm font-semibold text-slate-600">
        This records employer acceptance only. It does not verify the university, finish onboarding, or make the internship active.
      </p>
      <PawActionButton
        actionId={`approve-${card.recordId}`}
        pendingLabel={`Approving ${card.name.split(" ")[0]}'s internship…`}
        className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white disabled:opacity-70"
        onAction={async () => {
          const body = new FormData();
          body.set("internId", card.recordId);
          const result = await approveInternshipEmployer(body);
          if (result.ok) {
            onClose();
            router.refresh();
          }
          return result;
        }}
      >
        Approve Internship
      </PawActionButton>
    </Modal>
  );
}

function UniversityDialog({ card, onClose }: { card: InternshipApprovalCard; onClose: () => void }) {
  const router = useRouter();
  const [evidence, setEvidence] = useState("student_confirmation");
  const official = evidence !== "student_confirmation" && evidence !== "rejected";
  return (
    <Modal title="Record University Approval" onClose={onClose}>
      <Fact label="Intern" value={`${card.name} · ${card.university}`} />
      <p className="text-sm font-semibold text-slate-600">
        A student email is student-reported evidence. It is not formal verification unless official evidence is checked and confirmed.
      </p>
      <form
        id={`university-fields-${card.recordId}`}
        className="space-y-3"
        onSubmit={(event) => event.preventDefault()}
      >
        <label className="block text-sm font-bold text-slate-800">
          Evidence
          <select className={field} value={evidence} onChange={(event) => setEvidence(event.target.value)}>
            {UNIVERSITY_EVIDENCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {type.replaceAll("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Course
          <input name="course" className={field} defaultValue="" placeholder="MKT 490" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Term
          <input name="term" className={field} placeholder="Spring 2027" />
        </label>
        <div className="grid grid-cols-2 gap-2">
          <label className="block text-sm font-bold text-slate-800">
            Credits
            <input name="credits" className={field} inputMode="decimal" />
          </label>
          <label className="block text-sm font-bold text-slate-800">
            Required hours
            <input name="hours" className={field} inputMode="numeric" />
          </label>
        </div>
        <label className="block text-sm font-bold text-slate-800">
          Date reported or verified
          <input name="reportedOn" type="date" required className={field} />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Evidence reference
          <input name="reference" className={field} placeholder="Email from the student or advisor" />
        </label>
        <label className="block text-sm font-bold text-slate-800">
          Notes
          <textarea name="notes" className={`${field} min-h-20 py-2`} />
        </label>
        {official ? (
          <label className="flex items-start gap-2 text-sm font-semibold text-slate-700">
            <input name="confirmVerified" type="checkbox" className="mt-1" />
            I verified this with the institution. Count it as a formal university approval.
          </label>
        ) : null}
        <PawActionButton
          actionId={`university-${card.recordId}`}
          pendingLabel="Saving university evidence…"
          className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white disabled:opacity-70"
          onAction={async () => {
            const form = document.getElementById(`university-fields-${card.recordId}`) as HTMLFormElement | null;
            if (!form) return { ok: false, message: "The university form could not be read. Please try again." };
            const body = new FormData(form);
            body.set("internId", card.recordId);
            body.set("evidenceType", evidence);
            const result = await recordUniversityApproval(body);
            if (result.ok) {
              onClose();
              router.refresh();
            }
            return result;
          }}
        >
          Save university record
        </PawActionButton>
      </form>
    </Modal>
  );
}
