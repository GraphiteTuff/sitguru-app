import Link from "next/link";
import {
  addSupportIntakeCase,
} from "@/lib/admin/support/actions";
import {
  CASE_TYPE_LABELS,
  FINANCIAL_ACTION_LABELS,
} from "@/lib/admin/support/types";
import { EmailCheckbox } from "@/components/admin/support/SupportBadges";
import type { SupportAdminOption } from "@/lib/admin/support/data";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-semibold text-white outline-none placeholder:text-slate-600 focus:border-emerald-300/50";

type SupportIntakeFormProps = {
  assignees: SupportAdminOption[];
};

export default function SupportIntakeForm({ assignees }: SupportIntakeFormProps) {
  return (
    <div className="rounded-[32px] border border-white/10 bg-white/5 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.22)]">
      <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-300">
        Add Support Email
      </p>
      <h2 className="mt-3 text-3xl font-black tracking-tight text-white">
        Manually enter support@sitguru.com emails.
      </h2>
      <p className="mt-2 text-sm leading-6 text-slate-400">
        Copy the email details into this form. Assign an admin, set user type,
        and optionally send a confirmation to the sender.
      </p>

      <form action={addSupportIntakeCase} className="mt-6 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sender Name
            </label>
            <input
              name="senderName"
              placeholder="Customer, Guru, or Ambassador name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sender Email
            </label>
            <input
              name="senderEmail"
              type="email"
              placeholder="sender@email.com"
              className={fieldClass}
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Sender Phone
            </label>
            <input
              name="senderPhone"
              placeholder="Optional phone"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Related Booking ID
            </label>
            <input
              name="relatedBookingId"
              placeholder="Optional booking UUID"
              className={fieldClass}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Subject
          </label>
          <input
            name="subject"
            placeholder="Email subject"
            className={fieldClass}
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Email / Message Body
          </label>
          <textarea
            name="messageBody"
            placeholder="Paste the support email message here..."
            className={`min-h-32 ${fieldClass}`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              User Type
            </label>
            <select name="userType" defaultValue="parent" className={fieldClass}>
              <option value="parent">Pet Parent</option>
              <option value="guru">Pet Guru</option>
              <option value="ambassador">Ambassador</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Case Type
            </label>
            <select
              name="caseType"
              defaultValue="general_support"
              className={fieldClass}
            >
              {Object.entries(CASE_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Priority
            </label>
            <select name="priority" defaultValue="normal" className={fieldClass}>
              <option value="low">Low</option>
              <option value="normal">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Assign To
            </label>
            <select name="assignedTo" defaultValue="" className={fieldClass}>
              <option value="">Unassigned</option>
              {assignees.map((admin) => (
                <option key={admin.id || admin.email} value={admin.label}>
                  {admin.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            Internal Notes
          </label>
          <input name="notes" placeholder="Optional" className={fieldClass} />
        </div>

        <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-emerald-200">
            Financial Tracking
          </p>
          <p className="mt-2 text-sm leading-6 text-emerald-50/90">
            Add a credit, debit, or refund amount now so it follows the case into
            disputes and financial reports.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.55fr]">
            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Financial Action
              </label>
              <select
                name="financialAction"
                defaultValue="none"
                className={fieldClass}
              >
                {Object.entries(FINANCIAL_ACTION_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Amount
              </label>
              <input
                name="financialAmount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className={fieldClass}
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Financial Note
            </label>
            <input
              name="financialNote"
              placeholder="Example: Approved customer refund due to poor service"
              className={fieldClass}
            />
          </div>
        </div>

        <EmailCheckbox defaultChecked />

        <button
          type="submit"
          className="rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400"
        >
          Create Support Case
        </button>
      </form>

      <p className="mt-4 text-xs leading-5 text-slate-500">
        Need disputes instead?{" "}
        <Link href="/admin/disputes" className="font-bold text-emerald-300">
          Open disputes queue →
        </Link>
      </p>
    </div>
  );
}
