import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ExportStatusActions from "./ExportStatusActions";

type ExportRecord = {
  id: string;
  title: string;
  package_type: string;
  report_type: string;
  period_label: string;
  period_start: string | null;
  period_end: string | null;
  export_format: string;
  export_status: string;
  created_by: string | null;
  created_by_user_id: string | null;
  sent_to_email: string | null;
  sent_to_phone: string | null;
  file_url: string | null;
  storage_path: string | null;
  notes: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

type PageProps = {
  params: Promise<{
    exportId: string;
  }>;
};

function formatDateTime(value: string | null | undefined) {
  if (!value) return "Not available";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "Not set";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) return "Not set";

  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function labelize(value: string | null | undefined) {
  if (!value) return "Not set";

  return value
    .split(/[-_]/g)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function statusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "ready" || normalized === "sent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-800";
  }

  if (normalized === "processing") {
    return "border-blue-200 bg-blue-50 text-blue-800";
  }

  if (normalized === "failed") {
    return "border-rose-200 bg-rose-50 text-rose-800";
  }

  return "border-amber-200 bg-amber-50 text-amber-800";
}

function getMetadataArray(metadata: Record<string, unknown>) {
  return Object.entries(metadata || {}).map(([key, value]) => ({
    key,
    value,
  }));
}

function renderMetadataValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value, null, 2);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

function DetailCard({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: string;
  tone?: "slate" | "green" | "blue" | "amber";
}) {
  const tones = {
    slate: "border-slate-100 bg-slate-50 text-slate-700",
    green: "border-emerald-100 bg-emerald-50 text-emerald-800",
    blue: "border-blue-100 bg-blue-50 text-blue-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
  };

  return (
    <div className={`rounded-[1.25rem] border p-4 ${tones[tone]}`}>
      <p className="text-[11px] font-black uppercase tracking-[0.16em] opacity-70">
        {label}
      </p>
      <p className="mt-2 text-base font-black leading-6">{value}</p>
    </div>
  );
}

function EmptyState({ exportId }: { exportId: string }) {
  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm">
        <Link
          href="/admin/financials/exports"
          className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800"
        >
          ← Back to Export Center
        </Link>

        <h1 className="mt-6 text-4xl font-black tracking-tight text-slate-950">
          Export record not found
        </h1>

        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          No financial export history record was found for this ID:
        </p>

        <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-sm font-bold text-white">
          {exportId}
        </pre>
      </div>
    </main>
  );
}

export default async function AdminFinancialExportDetailPage({
  params,
}: PageProps) {
  const { exportId } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("financial_export_history")
    .select("*")
    .eq("id", exportId)
    .maybeSingle();

  if (error || !data) {
    return <EmptyState exportId={exportId} />;
  }

  const record = data as ExportRecord;
  const metadataRows = getMetadataArray(record.metadata || {});
  const includedReports = Array.isArray(record.metadata?.included)
    ? (record.metadata.included as unknown[])
    : [];

  return (
    <main className="min-h-screen bg-[#f7fbf8] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1400px] space-y-6">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div>
              <Link
                href="/admin/financials/exports"
                className="inline-flex rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
              >
                ← Back to Export Center
              </Link>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-[0.16em] ${statusClasses(
                    record.export_status,
                  )}`}
                >
                  {labelize(record.export_status)}
                </span>

                <span className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-blue-800">
                  {labelize(record.export_format)}
                </span>

                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-[0.16em] text-slate-700">
                  Export Detail
                </span>
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 lg:text-5xl">
                {record.title}
              </h1>

              <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600">
                Review this saved financial export record, update its workflow
                status, confirm CPA readiness, and track supporting export
                metadata.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[440px]">
              <DetailCard
                label="Created"
                value={formatDateTime(record.created_at)}
                tone="green"
              />
              <DetailCard
                label="Updated"
                value={formatDateTime(record.updated_at)}
                tone="blue"
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1fr_0.75fr]">
          <div className="space-y-6">
            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Export Summary
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Package Information
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <DetailCard
                  label="Package Type"
                  value={labelize(record.package_type)}
                  tone="green"
                />
                <DetailCard
                  label="Report Type"
                  value={labelize(record.report_type)}
                  tone="blue"
                />
                <DetailCard
                  label="Period"
                  value={record.period_label || "Not set"}
                  tone="amber"
                />
                <DetailCard
                  label="Period Start"
                  value={formatDate(record.period_start)}
                />
                <DetailCard
                  label="Period End"
                  value={formatDate(record.period_end)}
                />
                <DetailCard
                  label="Created By"
                  value={record.created_by || "Admin User"}
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Notes
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Export Notes
              </h2>

              <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                <p className="text-sm font-semibold leading-7 text-slate-700">
                  {record.notes || "No notes have been added to this export."}
                </p>
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                Included Records
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
                Included Files / Reports
              </h2>

              {includedReports.length > 0 ? (
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  {includedReports.map((item, index) => (
                    <div
                      key={`${String(item)}-${index}`}
                      className="rounded-[1.25rem] border border-emerald-100 bg-emerald-50 p-4"
                    >
                      <p className="text-sm font-black text-emerald-900">
                        ✓ {String(item)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
                  <p className="text-sm font-semibold leading-7 text-slate-600">
                    This export does not list individual included files yet.
                  </p>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <ExportStatusActions
              exportId={record.id}
              currentStatus={record.export_status}
            />

            <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
                CPA Readiness
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Review Checklist
              </h2>

              <div className="mt-5 space-y-3">
                {[
                  "Confirm reporting period is correct.",
                  "Review package status before sending.",
                  "Confirm included reports or files.",
                  "Check notes for CPA instructions.",
                  "Attach generated files when export storage is added.",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex gap-3 rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-black text-white">
                      {index + 1}
                    </span>
                    <p className="text-sm font-bold leading-6 text-slate-700">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[2rem] border border-blue-100 bg-blue-50 p-5 shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-blue-700">
                Delivery
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Export Delivery
              </h2>

              <div className="mt-5 space-y-3">
                <DetailCard
                  label="Sent To Email"
                  value={record.sent_to_email || "Not sent"}
                  tone="blue"
                />
                <DetailCard
                  label="Sent To Phone"
                  value={record.sent_to_phone || "Not sent"}
                  tone="blue"
                />
                <DetailCard
                  label="File URL"
                  value={record.file_url || "Not attached yet"}
                  tone="blue"
                />
                <DetailCard
                  label="Storage Path"
                  value={record.storage_path || "Not attached yet"}
                  tone="blue"
                />
              </div>
            </section>

            <section className="rounded-[2rem] border border-emerald-100 bg-emerald-800 p-5 text-white shadow-sm sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.28em] text-emerald-100">
                Next Build Step
              </p>

              <h2 className="mt-2 text-2xl font-black">
                File generation comes next
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-emerald-50">
                This viewer is now ready for generated PDF, Excel, CSV, ZIP,
                invoice, and purchase order files. The next upgrade will attach
                storage paths and downloadable files to each export record.
              </p>

              <Link
                href="/admin/financials/exports"
                className="mt-5 inline-flex rounded-full bg-white px-5 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
              >
                Back to Export Center →
              </Link>
            </section>
          </aside>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-700">
            Metadata
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-950">
            Export Metadata
          </h2>

          {metadataRows.length > 0 ? (
            <div className="mt-6 grid gap-4 lg:grid-cols-2">
              {metadataRows.map((row) => (
                <div
                  key={row.key}
                  className="rounded-[1.25rem] border border-slate-100 bg-slate-50 p-4"
                >
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
                    {labelize(row.key)}
                  </p>
                  <pre className="mt-2 whitespace-pre-wrap break-words text-sm font-bold leading-6 text-slate-700">
                    {renderMetadataValue(row.value)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-[1.5rem] border border-slate-100 bg-slate-50 p-5">
              <p className="text-sm font-semibold leading-7 text-slate-600">
                No metadata is stored for this export record yet.
              </p>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-slate-100 bg-slate-950 p-5 text-white shadow-sm sm:p-6 lg:p-8">
          <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-300">
            Audit Reference
          </p>

          <h2 className="mt-2 text-3xl font-black tracking-tight">
            Raw Export Record
          </h2>

          <pre className="mt-6 max-h-[520px] overflow-auto rounded-[1.5rem] border border-white/10 bg-black/30 p-5 text-xs font-bold leading-6 text-slate-100">
            {JSON.stringify(record, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}