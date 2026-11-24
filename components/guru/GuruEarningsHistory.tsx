"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  Search,
} from "lucide-react";

export type GuruEarningsHistoryItem = {
  id: string;
  date: string;
  rawDate: string;
  service: string;
  petParent: string;
  petName: string;
  gross: number;
  fee: number;
  net: number;
  bookingStatus: string;
  payoutStatus: string;
};

type PayoutCategory = "paid" | "pending" | "unconfirmed";
type HistoryFilter = "all" | PayoutCategory;

export function getPayoutCategory(value: string): PayoutCategory {
  const status = value.trim().toLowerCase().replace(/[\s-]+/g, "_");
  if (
    ["paid", "paid_out", "sent", "transferred", "succeeded", "complete", "completed", "settled"].includes(status)
  ) return "paid";
  if (
    ["pending", "processing", "in_transit", "in_progress", "queued", "initiated", "on_hold"].includes(status)
  ) return "pending";
  return "unconfirmed";
}

function formatMoney(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

function statusBadge(payoutStatus: string) {
  const category = getPayoutCategory(payoutStatus);
  if (category === "paid") {
    return { text: "Payout confirmed", style: "bg-emerald-50 text-emerald-900 ring-emerald-200", Icon: CheckCircle2 };
  }
  if (category === "pending") {
    return { text: "Payout in progress", style: "bg-amber-50 text-amber-900 ring-amber-200", Icon: Clock3 };
  }
  return { text: "Payout not confirmed", style: "bg-slate-100 text-slate-700 ring-slate-200", Icon: CircleHelp };
}

function csvCell(value: string | number) {
  const raw = String(value ?? "").replace(/[\r\n\t]+/g, " ");
  // Prevent spreadsheet formula injection if names or service labels are user-supplied.
  const isPlainNumber = /^-?\d+(?:\.\d+)?$/.test(raw.trim());
  const safe = !isPlainNumber && /^\s*[=+\-@]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}

export default function GuruEarningsHistory({
  rows,
}: {
  rows: GuruEarningsHistoryItem[];
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [showAll, setShowAll] = useState(false);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (filter !== "all" && getPayoutCategory(row.payoutStatus) !== filter) return false;
      if (!search) return true;
      return [row.id, row.petParent, row.petName, row.service, row.bookingStatus, row.payoutStatus]
        .some((value) => value.toLowerCase().includes(search));
    });
  }, [rows, query, filter]);

  const visible = showAll ? filtered : filtered.slice(0, 10);

  function exportFilteredCsv() {
    if (filtered.length === 0) return;
    const headings = ["Booking ID", "Care date", "Pet Parent", "Pet", "Service", "Gross", "Support fee", "Estimated net", "Booking status", "Payout status"];
    const lines = [headings, ...filtered.map((row) => [
      row.id, row.date, row.petParent, row.petName, row.service,
      row.gross.toFixed(2), row.fee.toFixed(2), row.net.toFixed(2),
      row.bookingStatus, row.payoutStatus || "Not confirmed",
    ])];
    const csv = "\uFEFF" + lines.map((line) => line.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "sitguru-guru-earnings.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <section id="guru-earnings-history" aria-labelledby="guru-earnings-history-title"
      className="scroll-mt-28 rounded-[1.7rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">BOOKING-BY-BOOKING RECORDS</p>
          <h2 id="guru-earnings-history-title" className="mt-1 text-2xl font-black tracking-tight text-emerald-950 sm:text-3xl">Earnings history</h2>
          <p className="mt-2 max-w-2xl text-sm font-semibold leading-6 text-slate-600">
            Search completed-care records, review payout status, or export the filtered results.
          </p>
        </div>
        <Link href="/guru/dashboard/bookings" className="inline-flex min-h-[52px] shrink-0 items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 hover:bg-emerald-50">
          My Bookings <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_190px_auto]">
        <label className="relative block">
          <span className="sr-only">Search earnings history</span>
          <Search className="pointer-events-none absolute left-4 top-4 h-5 w-5 text-emerald-700" aria-hidden="true" />
          <input type="search" value={query} onChange={(event) => { setQuery(event.target.value); setShowAll(false); }}
            placeholder="Search pet, parent, service or booking"
            className="h-[56px] w-full rounded-2xl border border-slate-300 bg-white pl-12 pr-4 text-base font-semibold text-slate-950 outline-none placeholder:font-medium placeholder:text-slate-500 focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200" />
        </label>
        <label className="relative block">
          <span className="sr-only">Filter earnings by payout status</span>
          <select value={filter} onChange={(event) => { setFilter(event.target.value as HistoryFilter); setShowAll(false); }}
            className="h-[56px] w-full appearance-none rounded-2xl border border-slate-300 bg-white pl-4 pr-10 text-sm font-black text-slate-950 outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-200">
            <option value="all">All payout statuses</option>
            <option value="paid">Payout confirmed</option>
            <option value="pending">In progress</option>
            <option value="unconfirmed">Not confirmed</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-4 h-5 w-5 text-emerald-800" aria-hidden="true" />
        </label>
        <button type="button" onClick={exportFilteredCsv} disabled={filtered.length === 0}
          className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-black text-white transition hover:bg-emerald-800 focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-50">
          <ArrowDownToLine className="h-5 w-5" aria-hidden="true" /> Export CSV
        </button>
      </div>

      <p className="mt-3 text-xs font-semibold text-slate-600" role="status" aria-live="polite">
        Showing {visible.length} of {filtered.length} matching records
        {rows.length ? " · from the latest " + rows.length + " eligible booking records" : ""}
      </p>

      {filtered.length ? (
        <>
          <div className="mt-4 hidden overflow-x-auto rounded-2xl border border-slate-200 lg:block">
            <table className="min-w-full text-left">
              <thead className="bg-[#F0FAF4] text-xs uppercase tracking-wide text-emerald-950">
                <tr>
                  <th scope="col" className="px-4 py-3 font-black">Pet Parent &amp; pet</th>
                  <th scope="col" className="px-4 py-3 font-black">Service</th>
                  <th scope="col" className="px-4 py-3 font-black">Date</th>
                  <th scope="col" className="px-4 py-3 text-right font-black">Gross</th>
                  <th scope="col" className="px-4 py-3 text-right font-black">Fee</th>
                  <th scope="col" className="px-4 py-3 text-right font-black">Est. net</th>
                  <th scope="col" className="px-4 py-3 font-black">Payout status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visible.map((row) => {
                  const badge = statusBadge(row.payoutStatus);
                  return (
                    <tr key={row.id} className="align-top text-sm">
                      <td className="px-4 py-4">
                        <p className="font-black text-slate-950">{row.petParent}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-600">{row.petName}</p>
                        <Link href={"/guru/dashboard/bookings/" + encodeURIComponent(row.id)} className="mt-2 inline-block min-h-8 text-xs font-black text-emerald-800 underline underline-offset-4 hover:text-emerald-950">View booking</Link>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-800">{row.service}</td>
                      <td className="whitespace-nowrap px-4 py-4 font-semibold text-slate-700">{row.date}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-slate-800">{formatMoney(row.gross)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-semibold text-slate-800">{formatMoney(row.fee)}</td>
                      <td className="whitespace-nowrap px-4 py-4 text-right font-black text-emerald-900">{formatMoney(row.net)}</td>
                      <td className="px-4 py-4">
                        <span className={"inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-xs font-black ring-1 " + badge.style}>
                          <badge.Icon className="h-4 w-4" aria-hidden="true" />{badge.text}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 grid gap-3 lg:hidden">
            {visible.map((row) => {
              const badge = statusBadge(row.payoutStatus);
              return (
                <article key={row.id} className="rounded-[1.3rem] border border-emerald-100 bg-[#FBFEFC] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-base font-black text-slate-950">{row.petName} <span className="font-semibold text-slate-500">· {row.service}</span></p>
                      <p className="mt-1 text-sm font-semibold text-slate-600">{row.petParent} · {row.date}</p>
                    </div>
                    <p className="text-lg font-black text-emerald-900">{formatMoney(row.net)}</p>
                  </div>
                  <span className={"mt-3 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-black ring-1 " + badge.style}>
                    <badge.Icon className="h-4 w-4" aria-hidden="true" /> {badge.text}
                  </span>
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white p-3 text-sm ring-1 ring-slate-100">
                    <p className="font-semibold text-slate-600">Gross <strong className="block text-slate-950">{formatMoney(row.gross)}</strong></p>
                    <p className="font-semibold text-slate-600">Support fee <strong className="block text-slate-950">{formatMoney(row.fee)}</strong></p>
                  </div>
                  <Link href={"/guru/dashboard/bookings/" + encodeURIComponent(row.id)}
                    className="mt-3 inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white text-sm font-black text-emerald-900 hover:bg-emerald-50">
                    View booking details <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              );
            })}
          </div>
          {!showAll && filtered.length > 10 ? (
            <button type="button" onClick={() => setShowAll(true)}
              className="mt-4 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white px-5 text-sm font-black text-emerald-900 hover:bg-emerald-50">
              Show all {filtered.length} matching records <ChevronDown className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
          {showAll && filtered.length > 10 ? (
            <button type="button" onClick={() => setShowAll(false)}
              className="mt-4 inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 text-sm font-black text-emerald-900 hover:bg-emerald-50">
              Show fewer
            </button>
          ) : null}
        </>
      ) : (
        <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50 p-6 text-center">
          <p className="text-lg font-black text-emerald-950">{rows.length ? "No matching earnings" : "No completed-care earnings yet"}</p>
          <p className="mt-2 text-sm font-semibold text-slate-700">
            {rows.length ? "Try a different search or payout-status filter." : "Your completed paid care records will appear here when available."}
          </p>
          {rows.length ? (
            <button type="button" onClick={() => { setQuery(""); setFilter("all"); setShowAll(false); }}
              className="mt-4 min-h-[52px] rounded-2xl border-2 border-emerald-200 bg-white px-5 text-sm font-black text-emerald-900">
              Clear filters
            </button>
          ) : (
            <Link href="/guru/dashboard/bookings" className="mt-4 inline-flex min-h-[52px] items-center rounded-2xl bg-emerald-800 px-5 text-sm font-black text-white">View my bookings</Link>
          )}
        </div>
      )}
      <p className="mt-4 text-xs font-semibold leading-5 text-slate-600">
        Estimated net amounts come from booking records. A Pet Parent payment does not confirm that a Guru payout has been sent.
        Only a recorded payout status is marked as confirmed. Export includes the records currently matching your filters.
      </p>
    </section>
  );
}
