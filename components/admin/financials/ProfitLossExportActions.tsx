"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import type { ReactNode } from "react";

type ExportFormat = "csv" | "excel" | "word" | "pdf";
type PresetRange = "month" | "quarter" | "ytd" | "annual" | "custom";

const EXPORT_FORMATS: { label: string; value: ExportFormat; helper: string }[] = [
  { label: "CSV", value: "csv", helper: "Quick import" },
  { label: "Excel", value: "excel", helper: "CPA workbook" },
  { label: "Word", value: "word", helper: "Report doc" },
  { label: "PDF / Print", value: "pdf", helper: "Printable view" },
];

const RANGE_OPTIONS: { label: string; value: PresetRange }[] = [
  { label: "Month", value: "month" },
  { label: "Quarter", value: "quarter" },
  { label: "YTD", value: "ytd" },
  { label: "Annual", value: "annual" },
  { label: "Custom", value: "custom" },
];

function toInputDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function getPresetDates(range: PresetRange) {
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now);

  if (range === "month") {
    start.setMonth(now.getMonth() - 1);
  }

  if (range === "quarter") {
    start.setMonth(now.getMonth() - 3);
  }

  if (range === "annual") {
    start.setFullYear(now.getFullYear() - 1);
  }

  if (range === "ytd") {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  return {
    startDate: toInputDate(start),
    endDate: toInputDate(end),
  };
}

function buildExportHref(format: ExportFormat, startDate: string, endDate: string) {
  const params = new URLSearchParams({ format });

  if (startDate) params.set("startDate", startDate);
  if (endDate) params.set("endDate", endDate);

  return `/api/admin/financials/profit-loss/export?${params.toString()}`;
}

function NavPill({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center justify-center rounded-full border border-slate-100 bg-white px-3.5 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
    >
      {label}
    </Link>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <span className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-500">
      {children}
    </span>
  );
}

export function ProfitLossExportActions() {
  const [range, setRange] = useState<PresetRange>("month");
  const presetDates = useMemo(() => getPresetDates(range), [range]);
  const [customStartDate, setCustomStartDate] = useState(presetDates.startDate);
  const [customEndDate, setCustomEndDate] = useState(presetDates.endDate);
  const [emailOpen, setEmailOpen] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("SitGuru Profit & Loss Statement");
  const [message, setMessage] = useState(
    "Attached is the SitGuru Profit & Loss statement for CPA/bookkeeping review.",
  );
  const [emailFormat, setEmailFormat] = useState<ExportFormat>("excel");
  const [status, setStatus] = useState("");
  const [statusTone, setStatusTone] = useState<"success" | "error" | "info">("info");
  const [isPending, startTransition] = useTransition();

  const activeStartDate = range === "custom" ? customStartDate : presetDates.startDate;
  const activeEndDate = range === "custom" ? customEndDate : presetDates.endDate;

  async function sendEmailAttachment() {
    setStatus("");
    setStatusTone("info");

    if (!recipient.trim()) {
      setStatusTone("error");
      setStatus("Add a recipient email before sending.");
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/financials/profit-loss/export", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: recipient.trim(),
            format: emailFormat,
            subject: subject.trim() || "SitGuru Profit & Loss Statement",
            message: message.trim(),
            startDate: activeStartDate,
            endDate: activeEndDate,
          }),
        });

        const json = await response.json().catch(() => null);

        if (!response.ok || json?.ok === false) {
          setStatusTone("error");
          setStatus(
            json?.message ||
              "Email attachment could not be sent. Check the export route and email provider setup.",
          );
          return;
        }

        setStatusTone("success");
        setStatus(
          json?.message ||
            "Profit & Loss attachment sent, and the export action was logged.",
        );
      } catch (error) {
        setStatusTone("error");
        setStatus(
          error instanceof Error
            ? error.message
            : "Email attachment could not be sent.",
        );
      }
    });
  }

  const statusClass =
    statusTone === "success"
      ? "border-emerald-100 bg-emerald-50 text-emerald-800"
      : statusTone === "error"
        ? "border-rose-100 bg-rose-50 text-rose-800"
        : "border-blue-100 bg-blue-50 text-blue-800";

  return (
    <div className="w-full rounded-[1.75rem] border border-emerald-100 bg-[#fbfefd] p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
            Export Center
          </p>
          <p className="mt-1 text-sm font-bold leading-6 text-slate-600">
            Download, print, or email this P&amp;L with the selected date range.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:justify-end">
          <NavPill href="/admin/financials" label="Financials" />
          <NavPill href="/admin/financials/commissions" label="Commissions" />
          <NavPill href="/admin/financials/payouts" label="Payouts" />
        </div>
      </div>

      <div className="mt-4 rounded-[1.35rem] border border-slate-100 bg-white p-3 sm:p-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_260px] xl:items-end">
          <div>
            <FieldLabel>Export Range</FieldLabel>
            <div className="mt-2 flex flex-wrap gap-2">
              {RANGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setRange(option.value)}
                  className={`rounded-full border px-3 py-2 text-xs font-black transition ${
                    range === option.value
                      ? "border-emerald-700 bg-emerald-700 text-white shadow-sm"
                      : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <FieldLabel>Start</FieldLabel>
              <input
                type="date"
                value={activeStartDate}
                onChange={(event) => {
                  setRange("custom");
                  setCustomStartDate(event.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>

            <label className="block">
              <FieldLabel>End</FieldLabel>
              <input
                type="date"
                value={activeEndDate}
                onChange={(event) => {
                  setRange("custom");
                  setCustomEndDate(event.target.value);
                }}
                className="mt-1 w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {EXPORT_FORMATS.map((format) => (
          <Link
            key={format.value}
            href={buildExportHref(format.value, activeStartDate, activeEndDate)}
            className="group rounded-[1.1rem] border border-emerald-100 bg-emerald-700 px-3.5 py-3 text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800"
          >
            <span className="block text-sm font-black">{format.label}</span>
            <span className="mt-0.5 block text-[11px] font-bold text-emerald-50/90">
              {format.helper}
            </span>
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-hidden rounded-[1.35rem] border border-slate-100 bg-white">
        <button
          type="button"
          onClick={() => setEmailOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-black text-slate-950 transition hover:bg-emerald-50/60"
        >
          <span>Email statement as attachment</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            {emailOpen ? "−" : "+"}
          </span>
        </button>

        {emailOpen ? (
          <div className="border-t border-slate-100 p-4">
            <div className="grid gap-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
                <input
                  type="email"
                  value={recipient}
                  onChange={(event) => setRecipient(event.target.value)}
                  placeholder="CPA or bookkeeper email"
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />

                <select
                  value={emailFormat}
                  onChange={(event) =>
                    setEmailFormat(event.target.value as ExportFormat)
                  }
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                >
                  {EXPORT_FORMATS.map((format) => (
                    <option key={format.value} value={format.value}>
                      {format.label}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="text"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                placeholder="Email subject"
                className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={3}
                placeholder="Optional note"
                className="rounded-xl border border-slate-100 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none placeholder:text-slate-400 transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              />

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-semibold leading-5 text-slate-500">
                  Sends {emailFormat.toUpperCase()} for {activeStartDate} through {activeEndDate}.
                </p>

                <button
                  type="button"
                  onClick={sendEmailAttachment}
                  disabled={isPending}
                  className="rounded-xl bg-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-700/10 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending ? "Sending..." : "Send Attachment"}
                </button>
              </div>

              {status ? (
                <div className={`rounded-xl border p-3 text-sm font-bold leading-6 ${statusClass}`}>
                  {status}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default ProfitLossExportActions;
