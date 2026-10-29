"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ClipboardList, X } from "lucide-react";
import { saveManagerAssignment } from "@/lib/internship/manager-assignment-actions";
import {
  ASSIGNMENT_CATEGORIES,
  ASSIGNMENT_FREEDOM,
  ASSIGNMENT_PRIORITIES,
  ASSIGNMENT_REVIEWS,
  validateManagerAssignment,
  type AssignmentDraft,
} from "@/lib/internship/manager-assignment";
import { routeAssignmentCategory } from "@/lib/admin/growth/work-routing";

export type AssignmentInternOption = {
  id: string;
  name: string;
  school: string;
  program: string;
  avatarUrl: string;
};

export type AssignmentMilestoneOption = { id: string; title: string; internId: string };

export type AssignmentFormValue = AssignmentDraft & { taskId: string };

const FREEDOM_HELP: Record<string, string> = {
  Explore: "Broad creative freedom inside the assignment goal.",
  Guided: "Creative freedom while following SitGuru guidelines.",
  Directed: "Specific execution requirements from the manager.",
};

function blank(clientRequestId: string): AssignmentFormValue {
  return {
    taskId: "",
    internId: "",
    title: "",
    category: "Content",
    milestoneId: "",
    dueOn: "",
    priority: "Normal",
    description: "",
    deliverables: [""],
    review: "Manager Review Required",
    freedom: "Guided",
    resources: [""],
    notes: "",
    clientRequestId,
  };
}

export default function CreateAssignmentDialog({
  interns,
  milestones,
  open,
  focusIntern = false,
  initial,
  onClose,
}: {
  interns: AssignmentInternOption[];
  milestones: AssignmentMilestoneOption[];
  open: boolean;
  focusIntern?: boolean;
  initial?: AssignmentFormValue | null;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<AssignmentFormValue>(() => initial || blank(crypto.randomUUID()));
  const [baseline, setBaseline] = useState("");
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const next = initial || blank(crypto.randomUUID());
    setForm(next);
    setBaseline(JSON.stringify(next));
    setErrors({});
    setConfirmDiscard(false);
    const node = panelRef.current?.querySelector<HTMLElement>(focusIntern ? "select[name='internId']" : "input[name='title']");
    node?.focus();
  }, [open, initial, focusIntern]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        requestClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  if (!open) return null;

  const dirty = JSON.stringify(form) !== baseline;
  const milestoneChoices = milestones.filter((item) => item.internId === form.internId);
  const publishCheck = validateManagerAssignment(form, "create");

  function patch(partial: Partial<AssignmentFormValue>) {
    setForm((current) => ({ ...current, ...partial }));
  }

  function requestClose() {
    if (dirty) setConfirmDiscard(true);
    else onClose();
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    const intent = (event.nativeEvent as SubmitEvent).submitter?.getAttribute("value") === "draft" ? "draft" : "create";
    const checked = validateManagerAssignment(form, intent);
    if (!checked.ok) {
      event.preventDefault();
      setErrors(checked.errors);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/45 p-0 sm:items-center sm:p-4">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[100dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.5rem] bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[1.5rem]"
      >
        <form action={saveManagerAssignment} onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
          <input type="hidden" name="taskId" value={form.taskId} />
          <input type="hidden" name="clientRequestId" value={form.clientRequestId} />
          <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
                <ClipboardList size={18} />
              </span>
              <div>
                <h2 id={titleId} className="text-xl font-black text-[#0F2744] sm:text-2xl">
                  {form.taskId ? "Edit Assignment" : "Create Assignment"}
                </h2>
                <p className="mt-1 text-sm font-medium text-slate-600">Add a new assignment for one or more of your interns.</p>
              </div>
            </div>
            <button type="button" onClick={requestClose} aria-label="Close" className="inline-flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100">
              <X size={18} />
            </button>
          </div>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
            {!interns.length ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
                You don&apos;t have any active interns assigned yet. Open the Intern Team Desk when an intern is assigned to you.
              </p>
            ) : null}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#0F2744]">
                Assign to Intern *
                <select
                  name="internId"
                  required
                  value={form.internId}
                  onChange={(event) => patch({ internId: event.target.value, milestoneId: "" })}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                >
                  <option value="">Choose an intern</option>
                  {interns.map((intern) => (
                    <option key={intern.id} value={intern.id}>
                      {intern.name}{intern.school ? ` — ${intern.school}` : ""}{intern.program ? ` — ${intern.program}` : ""}
                    </option>
                  ))}
                </select>
                {errors.internId ? <span className="mt-1 block text-xs font-semibold text-rose-700">{errors.internId}</span> : null}
              </label>
              <label className="text-sm font-bold text-[#0F2744]">
                Assignment Title *
                <input
                  name="title"
                  value={form.title}
                  maxLength={140}
                  onChange={(event) => patch({ title: event.target.value })}
                  className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                />
                {errors.title ? <span className="mt-1 block text-xs font-semibold text-rose-700">{errors.title}</span> : null}
              </label>
              <label className="text-sm font-bold text-[#0F2744]">
                Category *
                <select name="category" value={form.category} onChange={(event) => patch({ category: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  {ASSIGNMENT_CATEGORIES.map((item) => <option key={item}>{item}</option>)}
                </select>
                <span className="mt-1 block text-xs font-semibold text-[#2563EB]">
                  Teams → {routeAssignmentCategory(form.category).channelLabel}
                </span>
              </label>
              <label className="text-sm font-bold text-[#0F2744]">
                Associated Milestone
                <select name="milestoneId" value={form.milestoneId} onChange={(event) => patch({ milestoneId: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  <option value="">None</option>
                  {milestoneChoices.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-[#0F2744]">
                Due Date *
                <input type="date" name="dueOn" value={form.dueOn} onChange={(event) => patch({ dueOn: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold" />
                {errors.dueOn ? <span className="mt-1 block text-xs font-semibold text-rose-700">{errors.dueOn}</span> : null}
              </label>
              <label className="text-sm font-bold text-[#0F2744]">
                Priority
                <select name="priority" value={form.priority} onChange={(event) => patch({ priority: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  {ASSIGNMENT_PRIORITIES.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
            </div>

            <label className="block text-sm font-bold text-[#0F2744]">
              Description *
              <textarea name="description" value={form.description} maxLength={2000} rows={4} onChange={(event) => patch({ description: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
              <span className="mt-1 block text-right text-xs font-medium text-slate-500">{form.description.length}/2000</span>
              {errors.description ? <span className="block text-xs font-semibold text-rose-700">{errors.description}</span> : null}
            </label>

            <fieldset>
              <legend className="text-sm font-bold text-[#0F2744]">Deliverables *</legend>
              <div className="mt-2 space-y-2">
                {form.deliverables.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      name="deliverable"
                      value={value}
                      onChange={(event) => {
                        const next = [...form.deliverables];
                        next[index] = event.target.value;
                        patch({ deliverables: next });
                      }}
                      className="min-h-11 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                    />
                    <button type="button" onClick={() => patch({ deliverables: form.deliverables.filter((_, item) => item !== index) })} className="text-sm font-bold text-slate-500">
                      Remove
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => patch({ deliverables: [...form.deliverables, ""] })} className="mt-2 text-sm font-bold text-[#2563EB]">
                + Add Deliverable
              </button>
              {errors.deliverables ? <span className="mt-1 block text-xs font-semibold text-rose-700">{errors.deliverables}</span> : null}
            </fieldset>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-bold text-[#0F2744]">
                Review Requirement
                <select name="review" value={form.review} onChange={(event) => patch({ review: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  {ASSIGNMENT_REVIEWS.map((item) => <option key={item}>{item}</option>)}
                </select>
              </label>
              <label className="text-sm font-bold text-[#0F2744]">
                Creative Freedom
                <select name="freedom" value={form.freedom} onChange={(event) => patch({ freedom: event.target.value })} className="mt-1 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold">
                  {ASSIGNMENT_FREEDOM.map((item) => <option key={item}>{item}</option>)}
                </select>
                <span className="mt-1 block text-xs font-medium text-slate-500">{FREEDOM_HELP[form.freedom]}</span>
              </label>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <fieldset>
                <legend className="text-sm font-bold text-[#0F2744]">Resources / Links</legend>
                <div className="mt-2 space-y-2">
                  {form.resources.map((value, index) => (
                    <input
                      key={index}
                      name="resource"
                      value={value}
                      placeholder="https://"
                      onChange={(event) => {
                        const next = [...form.resources];
                        next[index] = event.target.value;
                        patch({ resources: next });
                      }}
                      className="min-h-11 w-full rounded-xl border border-slate-200 px-3 text-sm font-semibold"
                    />
                  ))}
                </div>
                <button type="button" onClick={() => patch({ resources: [...form.resources, ""] })} className="mt-2 text-sm font-bold text-[#2563EB]">
                  + Add another link
                </button>
                {errors.resources ? <span className="mt-1 block text-xs font-semibold text-rose-700">{errors.resources}</span> : null}
              </fieldset>
              <label className="text-sm font-bold text-[#0F2744]">
                Attachments
                <span className="mt-1 flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-[#F8FAFC] px-3 py-4 text-center text-xs font-semibold text-slate-600">
                  Drag and drop files here or click to browse
                  <span className="mt-1 block font-medium">PDF, DOCX, PNG, or JPG. 10MB max.</span>
                  <input name="file" type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" className="mt-2 max-w-full text-xs" />
                </span>
              </label>
            </div>

            <label className="block text-sm font-bold text-[#0F2744]">
              Additional Notes / Instructions
              <textarea name="notes" value={form.notes} maxLength={2000} rows={3} onChange={(event) => patch({ notes: event.target.value })} className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold" />
            </label>
          </div>

          <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
            <button type="button" onClick={requestClose} className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-700">
              Cancel
            </button>
            <div className="flex flex-wrap gap-2">
              <button name="intent" value="draft" className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-bold text-[#0F2744]">
                Save as Draft
              </button>
              <button name="intent" value="create" disabled={!publishCheck.ok || !interns.length} className="min-h-11 rounded-full bg-[#16A34A] px-4 text-sm font-bold !text-white disabled:cursor-not-allowed disabled:opacity-50">
                {form.taskId ? "Save assignment" : "Create Assignment"}
              </button>
            </div>
          </div>
        </form>
        {confirmDiscard ? (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 p-6">
            <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-lg">
              <p className="text-lg font-black text-[#0F2744]">Discard this assignment?</p>
              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmDiscard(false)} className="min-h-11 rounded-full border border-slate-200 px-4 text-sm font-bold">Keep Editing</button>
                <button type="button" onClick={onClose} className="min-h-11 rounded-full bg-[#0F2744] px-4 text-sm font-bold !text-white">Discard</button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
