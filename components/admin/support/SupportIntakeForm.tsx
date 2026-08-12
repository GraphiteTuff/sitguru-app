import Link from "next/link";
import { addSupportIntakeCase } from "@/lib/admin/support/actions";
import {
  CASE_TYPE_LABELS,
  FINANCIAL_ACTION_LABELS,
} from "@/lib/admin/support/types";
import { EmailCheckbox } from "@/components/admin/support/SupportBadges";
import type { SupportAdminOption } from "@/lib/admin/support/data";

const fieldClass =
  "mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100";

type SupportIntakeFormProps = {
  assignees: SupportAdminOption[];
};

export default function SupportIntakeForm({ assignees }: SupportIntakeFormProps) {
  return (
    <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-700">
        Add support email
      </p>
      <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950">
        Manually log support@sitguru.com mail
      </h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">
        Paste the email details, assign an admin, set user type, and optionally
        send a confirmation to the sender.
      </p>

      <form action={addSupportIntakeCase} className="mt-5 grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Sender Name
            </label>
            <input
              name="senderName"
              placeholder="Customer, Guru, or Ambassador name"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Sender Phone
            </label>
            <input
              name="senderPhone"
              placeholder="Optional phone"
              className={fieldClass}
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Email / Message Body
          </label>
          <textarea
            name="messageBody"
            placeholder="Paste the support email message here..."
            className={`min-h-32 ${fieldClass} h-auto py-3`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              User Type
            </label>
            <select name="userType" defaultValue="parent" className={fieldClass}>
              <option value="parent">Pet Parent</option>
              <option value="guru">Pet Guru</option>
              <option value="ambassador">Ambassador</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
              Priority
            </label>
            <select name="priority" defaultValue="normal" className={fieldClass}>
              <option value="low">Low</option>
              <option value="normal">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            Internal Notes
          </label>
          <input name="notes" placeholder="Optional" className={fieldClass} />
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-700">
            Financial tracking
          </p>
          <p className="mt-2 text-sm font-semibold leading-6 text-emerald-950/80">
            Add a credit, debit, or refund amount so it follows the case into
            disputes and financial reports.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_0.55fr]">
            <div>
              <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
              <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
            <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
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
          className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-emerald-700 px-5 py-3 text-sm font-black text-white transition hover:bg-emerald-800"
        >
          Create Support Case
        </button>
      </form>

      <p className="mt-4 text-xs font-semibold leading-5 text-slate-500">
        Need disputes instead?{" "}
        <Link href="/admin/disputes" className="font-black text-emerald-700">
          Open disputes queue →
        </Link>
      </p>
    </div>
  );
}
