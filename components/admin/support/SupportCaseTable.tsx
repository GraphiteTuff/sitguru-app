import Link from "next/link";
import {
  convertSupportCaseToDispute,
  updateSupportCaseStatus,
} from "@/lib/admin/support/actions";
import type { SupportAdminOption } from "@/lib/admin/support/data";
import type { SupportCase } from "@/lib/admin/support/types";
import {
  formatDateTime,
  moneyExact,
} from "@/lib/admin/support/utils";
import {
  EmailCheckbox,
  PriorityBadge,
  StatusBadge,
  UserTypeBadge,
} from "@/components/admin/support/SupportBadges";

const fieldClass =
  "w-full rounded-2xl border border-white/10 bg-slate-950 px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50";

type SupportCaseTableProps = {
  cases: SupportCase[];
  assignees: SupportAdminOption[];
  highlightCaseId?: string;
};

function isHighlighted(item: SupportCase, caseId?: string) {
  if (!caseId) return false;
  const needle = caseId.toLowerCase();
  return item.id === caseId || item.intakeNumber.toLowerCase() === needle;
}

export default function SupportCaseTable({
  cases,
  assignees,
  highlightCaseId,
}: SupportCaseTableProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-white/5 text-slate-400">
            <tr>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Ticket ID
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                User Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Subject
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Priority
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Assignee
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Last Updated
              </th>
              <th className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.18em]">
                Actions
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/10 bg-slate-950/40">
            {cases.length ? (
              cases.map((item) => {
                const highlighted = isHighlighted(item, highlightCaseId);

                return (
                  <tr
                    key={item.id}
                    id={`case-${item.intakeNumber}`}
                    className={`align-top transition hover:bg-white/5 ${
                      highlighted
                        ? "bg-emerald-400/10 ring-1 ring-inset ring-emerald-400/30"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-4">
                      <p className="font-black text-white">{item.intakeNumber}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {item.senderName}
                      </p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {item.senderEmail || "No email"}
                      </p>
                      {item.financialAmount > 0 ? (
                        <p className="mt-2 text-xs font-bold text-emerald-300">
                          {item.financialActionLabel}:{" "}
                          {moneyExact(item.financialAmount)}
                        </p>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <UserTypeBadge userType={item.userType} />
                      <p className="mt-2 text-xs text-slate-400">
                        {item.caseTypeLabel}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <p className="max-w-sm font-semibold text-white">
                        {item.subject}
                      </p>
                      <p className="mt-1 max-w-sm line-clamp-3 text-sm leading-6 text-slate-400">
                        {item.messageBody || "No message body entered."}
                      </p>
                      {item.relatedBookingId ? (
                        <Link
                          href={`/admin/bookings?booking=${item.relatedBookingId}`}
                          className="mt-2 inline-flex text-xs font-bold text-sky-200 hover:text-sky-100"
                        >
                          Related booking →
                        </Link>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <PriorityBadge priority={item.priority} />
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge status={item.status} />
                      {item.linkedDisputeId ? (
                        <Link
                          href="/admin/disputes"
                          className="mt-2 block text-xs font-bold text-violet-200 hover:text-violet-100"
                        >
                          Linked dispute →
                        </Link>
                      ) : null}
                    </td>

                    <td className="px-4 py-4">
                      <p className="text-sm font-semibold text-slate-200">
                        {item.assignedTo || "Unassigned"}
                      </p>
                    </td>

                    <td className="px-4 py-4 text-slate-400">
                      <p className="text-sm font-semibold text-slate-300">
                        {formatDateTime(item.updatedAt || item.createdAt)}
                      </p>
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex min-w-[280px] flex-col gap-3">
                        <form
                          action={updateSupportCaseStatus}
                          className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-3"
                        >
                          <input type="hidden" name="caseId" value={item.id} />
                          <input
                            type="hidden"
                            name="senderName"
                            value={item.senderName}
                          />
                          <input
                            type="hidden"
                            name="senderEmail"
                            value={item.senderEmail}
                          />
                          <input
                            type="hidden"
                            name="intakeNumber"
                            value={item.intakeNumber}
                          />
                          <input
                            type="hidden"
                            name="subject"
                            value={item.subject}
                          />

                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                            Update status
                          </p>

                          <select
                            name="status"
                            defaultValue={item.status}
                            className={fieldClass}
                          >
                            <option value="new">Open — New</option>
                            <option value="in_review">Open — In Review</option>
                            <option value="waiting_response">
                              Pending — Waiting Response
                            </option>
                            <option value="closed">Resolved — Closed</option>
                          </select>

                          <select
                            name="assignedTo"
                            defaultValue={item.assignedTo}
                            className={fieldClass}
                          >
                            <option value="">Unassigned</option>
                            {item.assignedTo &&
                            !assignees.some(
                              (admin) => admin.label === item.assignedTo
                            ) ? (
                              <option value={item.assignedTo}>
                                {item.assignedTo}
                              </option>
                            ) : null}
                            {assignees.map((admin) => (
                              <option
                                key={admin.id || admin.email}
                                value={admin.label}
                              >
                                {admin.label}
                              </option>
                            ))}
                          </select>

                          <textarea
                            name="replyBody"
                            placeholder="Draft email reply to sender…"
                            className={`min-h-20 ${fieldClass}`}
                          />

                          <input
                            name="notes"
                            placeholder="Internal note (optional)"
                            defaultValue={item.notes}
                            className={fieldClass}
                          />

                          <EmailCheckbox label="Send draft reply / status email" />

                          <button
                            type="submit"
                            className="w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-black text-white transition hover:bg-white/10"
                          >
                            Save & reply
                          </button>
                        </form>

                        {!item.linkedDisputeId ? (
                          <form
                            action={convertSupportCaseToDispute}
                            className="space-y-2"
                          >
                            <input type="hidden" name="caseId" value={item.id} />
                            <input
                              type="hidden"
                              name="intakeNumber"
                              value={item.intakeNumber}
                            />
                            <input
                              type="hidden"
                              name="senderName"
                              value={item.senderName}
                            />
                            <input
                              type="hidden"
                              name="senderEmail"
                              value={item.senderEmail}
                            />
                            <input
                              type="hidden"
                              name="subject"
                              value={item.subject}
                            />
                            <input
                              type="hidden"
                              name="messageBody"
                              value={item.messageBody}
                            />
                            <input
                              type="hidden"
                              name="relatedBookingId"
                              value={item.relatedBookingId}
                            />
                            <input
                              type="hidden"
                              name="caseType"
                              value={item.caseType}
                            />
                            <input
                              type="hidden"
                              name="priority"
                              value={item.priority}
                            />
                            <input
                              type="hidden"
                              name="financialAction"
                              value={item.financialAction}
                            />
                            <input
                              type="hidden"
                              name="financialAmount"
                              value={item.financialAmount}
                            />
                            <input
                              type="hidden"
                              name="financialNote"
                              value={item.financialNote}
                            />

                            <EmailCheckbox
                              defaultChecked
                              label="Email sender about dispute escalation"
                            />

                            <button
                              type="submit"
                              className="w-full rounded-2xl bg-rose-500 px-3 py-2 text-xs font-black text-white transition hover:bg-rose-400"
                            >
                              Convert to Dispute
                            </button>
                          </form>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-10 text-center text-slate-400"
                >
                  No support cases match the current filters. Adjust filters or
                  add a support email above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
