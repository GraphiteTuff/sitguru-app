"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

const categoryOptions = [
  {
    label: "Booking Revenue",
    type: "income",
    section: "Revenue",
  },
  {
    label: "Service Revenue",
    type: "income",
    section: "Revenue",
  },
  {
    label: "Stripe Deposit",
    type: "income",
    section: "Revenue",
  },
  {
    label: "Referral Income",
    type: "income",
    section: "Revenue",
  },
  {
    label: "Other Income",
    type: "income",
    section: "Revenue",
  },
  {
    label: "Owner Contribution",
    type: "owner_equity",
    section: "Owner Equity",
  },
  {
    label: "Guru Payouts",
    type: "expense",
    section: "Cost of Services",
  },
  {
    label: "Ambassador Commissions",
    type: "expense",
    section: "Sales & Marketing",
  },
  {
    label: "Software / SaaS",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Marketing / Advertising",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Payment Processing Fees",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Bank Fees",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Insurance",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Office / Supplies",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Legal / Professional",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Taxes",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Refunds",
    type: "expense",
    section: "Refunds",
  },
  {
    label: "Other Expense",
    type: "expense",
    section: "Operating Expenses",
  },
  {
    label: "Transfer Between Accounts",
    type: "transfer",
    section: "Transfers",
  },
  {
    label: "Owner Draw",
    type: "owner_equity",
    section: "Owner Equity",
  },
  {
    label: "Credit Card Payment",
    type: "liability",
    section: "Liabilities",
  },
  {
    label: "Loan Payment",
    type: "liability",
    section: "Liabilities",
  },
  {
    label: "Ignore / Personal",
    type: "ignore",
    section: "Excluded",
  },
  {
    label: "Uncategorized",
    type: "uncategorized",
    section: "Needs Review",
  },
];

type PlaidTransactionCategoryControlsProps = {
  transactionId: string;
  currentCategory?: string | null;
  currentCategoryType?: string | null;
  currentReportSection?: string | null;
  currentNotes?: string | null;
  isExcludedFromReports?: boolean | null;
  reviewStatus?: string | null;
  manuallyCategorized?: boolean | null;
};

function getStatusLabel({
  manuallyCategorized,
  reviewStatus,
}: {
  manuallyCategorized?: boolean | null;
  reviewStatus?: string | null;
}) {
  if (manuallyCategorized) return "MANUAL_CATEGORIZED";
  if (reviewStatus === "auto_categorized") return "AUTO_CATEGORIZED";
  return "NEEDS_REVIEW";
}

function getStatusClass({
  manuallyCategorized,
  reviewStatus,
}: {
  manuallyCategorized?: boolean | null;
  reviewStatus?: string | null;
}) {
  if (manuallyCategorized) {
    return "bg-blue-100 text-blue-800";
  }

  if (reviewStatus === "auto_categorized") {
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-amber-100 text-amber-800";
}

function getCategoryPillClass(categoryType?: string | null) {
  if (categoryType === "income") {
    return "bg-emerald-50 text-emerald-800 ring-emerald-200";
  }

  if (categoryType === "expense") {
    return "bg-red-50 text-red-800 ring-red-200";
  }

  if (categoryType === "transfer") {
    return "bg-sky-50 text-sky-800 ring-sky-200";
  }

  if (categoryType === "owner_equity") {
    return "bg-purple-50 text-purple-800 ring-purple-200";
  }

  if (categoryType === "liability") {
    return "bg-orange-50 text-orange-800 ring-orange-200";
  }

  if (categoryType === "ignore") {
    return "bg-slate-100 text-slate-700 ring-slate-200";
  }

  return "bg-amber-50 text-amber-800 ring-amber-200";
}

export default function PlaidTransactionCategoryControls({
  transactionId,
  currentCategory,
  currentCategoryType,
  currentReportSection,
  currentNotes,
  isExcludedFromReports,
  reviewStatus,
  manuallyCategorized,
}: PlaidTransactionCategoryControlsProps) {
  const router = useRouter();

  const startingCategory = currentCategory || "Uncategorized";

  const selectedOption = useMemo(
    () =>
      categoryOptions.find((option) => option.label === startingCategory) ||
      categoryOptions[categoryOptions.length - 1],
    [startingCategory],
  );

  const [category, setCategory] = useState(selectedOption.label);
  const [categoryType, setCategoryType] = useState(
    currentCategoryType || selectedOption.type,
  );
  const [reportSection, setReportSection] = useState(
    currentReportSection || selectedOption.section,
  );
  const [notes, setNotes] = useState(currentNotes || "");
  const [excluded, setExcluded] = useState(Boolean(isExcludedFromReports));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isEditing, setIsEditing] = useState(reviewStatus === "needs_review");

  const statusLabel = getStatusLabel({
    manuallyCategorized,
    reviewStatus,
  });

  const statusClass = getStatusClass({
    manuallyCategorized,
    reviewStatus,
  });

  function handleCategoryChange(value: string) {
    const nextOption =
      categoryOptions.find((option) => option.label === value) ||
      categoryOptions[categoryOptions.length - 1];

    setCategory(nextOption.label);
    setCategoryType(nextOption.type);
    setReportSection(nextOption.section);
  }

  async function saveCategory() {
    setSaving(true);
    setMessage("");

    try {
      const response = await fetch("/api/plaid/categorize-transaction", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({
          transaction_id: transactionId,
          sitguru_category: category,
          sitguru_category_type: categoryType,
          sitguru_report_section: reportSection,
          sitguru_notes: notes,
          is_excluded_from_reports: excluded,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setMessage(payload?.error || "Unable to save category.");
        return;
      }

      setMessage("Saved");
      setIsEditing(false);
      router.refresh();
    } catch {
      setMessage("Unable to save category.");
    } finally {
      setSaving(false);
    }
  }

  if (!isEditing) {
    return (
      <div className="min-w-[260px] rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wide ring-1 ${getCategoryPillClass(
              currentCategoryType,
            )}`}
          >
            {currentCategory || "Uncategorized"}
          </span>

          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-slate-50 p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Type
            </p>
            <p className="mt-1 text-xs font-black capitalize text-slate-800">
              {(currentCategoryType || categoryType).replaceAll("_", " ")}
            </p>
          </div>

          <div className="rounded-xl bg-slate-50 p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Report
            </p>
            <p className="mt-1 text-xs font-black text-slate-800">
              {currentReportSection || reportSection}
            </p>
          </div>
        </div>

        {currentNotes ? (
          <p className="mt-3 rounded-xl bg-slate-50 p-2 text-xs font-bold leading-5 text-slate-600">
            {currentNotes}
          </p>
        ) : null}

        {isExcludedFromReports ? (
          <p className="mt-3 rounded-full bg-slate-200 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-700">
            Excluded from reports
          </p>
        ) : null}

        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="mt-3 w-full rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black text-emerald-800 transition hover:bg-emerald-100"
        >
          Edit Category
        </button>

        {message ? (
          <p
            className={
              message === "Saved"
                ? "mt-2 text-xs font-black text-emerald-700"
                : "mt-2 text-xs font-black text-red-700"
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-w-[280px] rounded-2xl border border-slate-200 bg-slate-50 p-3">
      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <label className="text-[10px] font-black uppercase tracking-[0.14em] text-slate-500">
            SitGuru Category
          </label>

          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wide text-slate-500 ring-1 ring-slate-200 transition hover:text-slate-800"
          >
            Close
          </button>
        </div>

        <select
          value={category}
          onChange={(event) => handleCategoryChange(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-800 outline-none transition focus:border-emerald-400"
        >
          {categoryOptions.map((option) => (
            <option key={option.label} value={option.label}>
              {option.label}
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-white p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Type
            </p>
            <p className="mt-1 text-xs font-black capitalize text-slate-800">
              {categoryType.replaceAll("_", " ")}
            </p>
          </div>

          <div className="rounded-xl bg-white p-2">
            <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">
              Report
            </p>
            <p className="mt-1 text-xs font-black text-slate-800">
              {reportSection}
            </p>
          </div>
        </div>

        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional note"
          rows={2}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400"
        />

        <label className="flex items-center gap-2 text-xs font-black text-slate-700">
          <input
            type="checkbox"
            checked={excluded}
            onChange={(event) => setExcluded(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-700"
          />
          Exclude from reports
        </label>

        <button
          type="button"
          onClick={saveCategory}
          disabled={saving}
          className="rounded-full bg-emerald-700 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save Category"}
        </button>

        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide ${statusClass}`}
          >
            {statusLabel}
          </span>
        </div>

        {message ? (
          <p
            className={
              message === "Saved"
                ? "text-xs font-black text-emerald-700"
                : "text-xs font-black text-red-700"
            }
          >
            {message}
          </p>
        ) : null}
      </div>
    </div>
  );
}