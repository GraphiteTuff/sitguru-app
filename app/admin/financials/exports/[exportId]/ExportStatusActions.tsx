"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ExportStatus = "ready" | "processing" | "sent" | "needs_review" | "failed";

type ExportStatusActionsProps = {
  exportId: string;
  currentStatus: string;
};

const statusActions: {
  label: string;
  value: ExportStatus;
  description: string;
  primary?: boolean;
}[] = [
  {
    label: "Needs Review",
    value: "needs_review",
    description: "Mark this export as requiring owner or CPA review.",
  },
  {
    label: "Processing",
    value: "processing",
    description: "Mark this export as being prepared or checked.",
  },
  {
    label: "Ready",
    value: "ready",
    description: "Mark this export as ready to send or download.",
    primary: true,
  },
  {
    label: "Sent",
    value: "sent",
    description: "Mark this export as sent to CPA, bookkeeper, or manager.",
  },
  {
    label: "Failed",
    value: "failed",
    description: "Mark this export as failed or needing correction.",
  },
];

function normalizeStatus(value: string): ExportStatus {
  const normalized = value.trim().toLowerCase();

  if (normalized === "ready") return "ready";
  if (normalized === "processing") return "processing";
  if (normalized === "sent") return "sent";
  if (normalized === "failed") return "failed";
  if (normalized === "needs_review" || normalized === "needs review") {
    return "needs_review";
  }

  return "needs_review";
}

function buttonClasses({
  active,
  primary,
  value,
}: {
  active: boolean;
  primary?: boolean;
  value: ExportStatus;
}) {
  if (active && value === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  if (active && value === "needs_review") {
    return "border-amber-200 bg-amber-500 text-white shadow-lg shadow-amber-500/15";
  }

  if (active && value === "processing") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (active && (value === "ready" || value === "sent")) {
    return "border-emerald-200 bg-emerald-700 text-white shadow-lg shadow-emerald-700/15";
  }

  if (primary) {
    return "border-emerald-100 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-white";
  }

  return "border-slate-100 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-900";
}

export default function ExportStatusActions({
  exportId,
  currentStatus,
}: ExportStatusActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<ExportStatus>(
    normalizeStatus(currentStatus),
  );
  const [note, setNote] = useState("");
  const [loadingStatus, setLoadingStatus] = useState<ExportStatus | null>(null);
  const [message, setMessage] = useState(
    "Update this export as it moves through owner review, CPA readiness, and delivery.",
  );
  const [tone, setTone] = useState<"green" | "amber" | "rose">("green");

  async function updateStatus(nextStatus: ExportStatus) {
    setLoadingStatus(nextStatus);
    setTone("amber");
    setMessage("Updating export status...");

    try {
      const response = await fetch("/api/admin/financials/export-history", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          exportId,
          status: nextStatus,
          notes: note.trim() || undefined,
        }),
      });

      const json = (await response.json()) as {
        ok: boolean;
        message?: string;
      };

      if (!response.ok || !json.ok) {
        setTone("rose");
        setMessage(json.message || "Unable to update export status.");
        return;
      }

      setStatus(nextStatus);
      setTone("green");
      setMessage(`Export status updated to ${nextStatus.replaceAll("_", " ")}.`);
      setNote("");
      router.refresh();
    } catch (error) {
      setTone("rose");
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to update export status.",
      );
    } finally {
      setLoadingStatus(null);
    }
  }

  const toneClasses = {
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
  }[tone];

  return (
    <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
      <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
        Status Actions
      </p>

      <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
        Move Export Through Workflow
      </h2>

      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        Use these actions to track whether this package needs review, is being
        prepared, is ready, has been sent, or needs correction.
      </p>

      <div className={`mt-5 rounded-[1.25rem] border p-4 ${toneClasses}`}>
        <p className="text-xs font-black uppercase tracking-[0.18em]">
          Workflow Status
        </p>
        <p className="mt-2 text-sm font-bold leading-6">{message}</p>
      </div>

      <div className="mt-5">
        <label
          htmlFor="export-status-note"
          className="text-xs font-black uppercase tracking-[0.18em] text-slate-500"
        >
          Status Note
        </label>

        <textarea
          id="export-status-note"
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Optional note for CPA, bookkeeper, owner, or management..."
          className="mt-2 min-h-[120px] w-full rounded-[1.25rem] border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
        />
      </div>

      <div className="mt-5 grid gap-3">
        {statusActions.map((action) => {
          const active = status === action.value;
          const loading = loadingStatus === action.value;

          return (
            <button
              key={action.value}
              type="button"
              disabled={Boolean(loadingStatus)}
              onClick={() => {
                void updateStatus(action.value);
              }}
              className={`rounded-[1.25rem] border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-60 ${buttonClasses(
                {
                  active,
                  primary: action.primary,
                  value: action.value,
                },
              )}`}
            >
              <span className="block text-sm font-black">
                {loading ? "Updating..." : action.label}
              </span>
              <span className="mt-1 block text-xs font-bold leading-5 opacity-80">
                {active ? "Current status. " : ""}
                {action.description}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
