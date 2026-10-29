"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, MapPin, MessageCircle, PawPrint, Search } from "lucide-react";

export type BookingCardModel = {
  id: string;
  service: string;
  petName: string;
  petPhoto: string;
  guruName: string;
  guruPhoto: string;
  when: string;
  place: string;
  statusLabel: string;
  bucket: "upcoming" | "pending" | "past" | "cancelled";
  detailHref: string;
  reportHref: string;
};

const TABS = [
  { id: "upcoming", label: "Upcoming" },
  { id: "pending", label: "Pending" },
  { id: "past", label: "Past" },
  { id: "cancelled", label: "Cancelled" },
] as const;

export default function CustomerBookingsBoard({ cards }: { cards: BookingCardModel[] }) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("upcoming");
  const [query, setQuery] = useState("");
  const counts = useMemo(() => ({
    upcoming: cards.filter((card) => card.bucket === "upcoming").length,
    pending: cards.filter((card) => card.bucket === "pending").length,
    past: cards.filter((card) => card.bucket === "past").length,
    cancelled: cards.filter((card) => card.bucket === "cancelled").length,
  }), [cards]);
  const visible = cards.filter((card) => {
    if (card.bucket !== tab) return false;
    const haystack = `${card.service} ${card.petName} ${card.guruName} ${card.place}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });
  const next = cards.find((card) => card.bucket === "upcoming") || cards.find((card) => card.bucket === "pending") || null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950">My Bookings</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Manage upcoming care, requests, and past visits.</p>
        </div>
        <Link href="/search" className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">
          + Book pet care
        </Link>
      </div>

      <section className="grid gap-3 sm:grid-cols-3">
        <Stat label="Upcoming" value={counts.upcoming} detail="Scheduled visits" />
        <Stat label="Awaiting confirmation" value={counts.pending} detail="Pending request" />
        <Stat label="Completed" value={counts.past} detail="Past visits" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_280px]">
        <section className="rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm sm:p-4">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={tab === item.id ? "min-h-10 rounded-full bg-[#0D5C3A] px-3 text-sm font-bold !text-white" : "min-h-10 rounded-full px-3 text-sm font-bold text-slate-500"}
              >
                {item.label}
              </button>
            ))}
            <label className="relative ml-auto block min-w-[12rem] flex-1">
              <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search bookings"
                className="min-h-10 w-full rounded-full bg-[#F1F5F9] pl-8 pr-3 text-sm font-medium outline-none"
              />
            </label>
          </div>
          <ul className="mt-3 space-y-3">
            {visible.map((card) => (
              <li key={card.id} className="rounded-2xl border border-slate-100 p-3">
                <div className="flex gap-3">
                  <Face name={card.petName} src={card.petPhoto} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-slate-950">{card.service}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${card.bucket === "cancelled" ? "bg-rose-50 text-rose-700" : card.bucket === "pending" ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-[#0D5C3A]"}`}>
                        {card.statusLabel}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-slate-500">{card.petName} · {card.when}</p>
                    {card.place ? <p className="mt-1 flex items-center gap-1 text-xs font-medium text-slate-500"><MapPin size={12} /> {card.place}</p> : null}
                    <div className="mt-2 flex items-center gap-2">
                      <Face name={card.guruName} src={card.guruPhoto} small />
                      <p className="text-sm font-semibold text-slate-700">{card.guruName}</p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={card.detailHref} className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-700">View details</Link>
                  <Link href={`/messages?role=customer&returnTo=${encodeURIComponent("/customer/dashboard/bookings")}`} className="inline-flex min-h-10 items-center gap-1 rounded-full bg-[#0D5C3A] px-3 text-sm font-bold !text-white">
                    <MessageCircle size={14} /> Message Guru
                  </Link>
                  <Link href={card.reportHref} className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 px-3 text-sm font-bold text-[#0D5C3A]">PawReport</Link>
                </div>
              </li>
            ))}
            {!visible.length ? (
              <li className="px-2 py-8 text-center text-sm font-medium text-slate-500">
                {cards.length ? "Nothing in this list." : "No bookings yet. When you request care, it will show up here."}
              </li>
            ) : null}
          </ul>
        </section>

        <aside className="space-y-4">
          <article className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
            <h2 className="flex items-center gap-2 font-black text-slate-950"><CalendarDays size={16} /> Next visit</h2>
            {next ? (
              <div className="mt-3">
                <p className="font-black text-slate-950">{next.service}</p>
                <p className="text-sm font-medium text-slate-500">{next.when}</p>
                <p className="text-sm font-semibold text-slate-700">{next.guruName} · {next.petName}</p>
                <Link href={next.detailHref} className="mt-3 inline-flex min-h-10 items-center rounded-full bg-[#0D5C3A] px-3 text-sm font-bold !text-white">View booking</Link>
              </div>
            ) : (
              <p className="mt-3 text-sm font-medium text-slate-500">No upcoming visit.</p>
            )}
          </article>
          <article className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
            <h2 className="font-black text-slate-950">Quick links</h2>
            <ul className="mt-2 space-y-1 text-sm font-semibold text-[#0D5C3A]">
              <li><Link href="/customer/dashboard/payments">Payments</Link></li>
              <li><Link href="/customer/dashboard/profile">My profile</Link></li>
              <li><Link href="/help">Help</Link></li>
            </ul>
          </article>
          <article className="rounded-3xl bg-[#F0FDF4] p-4">
            <PawPrint className="text-[#0D5C3A]" />
            <p className="mt-2 font-black text-slate-950">Need help?</p>
            <p className="text-sm font-medium text-slate-600">Message SitGuru from your inbox if a visit needs attention.</p>
            <Link href="/messages?role=customer&returnTo=/customer/dashboard/bookings" className="mt-3 inline-flex text-sm font-bold text-[#0D5C3A]">Open messages</Link>
          </article>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, value, detail }: { label: string; value: number; detail: string }) {
  return (
    <article className="rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-3xl font-black text-slate-950">{value}</p>
      <p className="text-sm font-black text-slate-800">{label}</p>
      <p className="text-xs font-medium text-slate-500">{detail}</p>
    </article>
  );
}

function Face({ name, src, small }: { name: string; src: string; small?: boolean }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-emerald-100 ${small ? "h-8 w-8 rounded-full" : "h-16 w-16"}`}>
      <span className="absolute inset-0 bg-white" />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="relative z-[1] h-full w-full object-cover object-center" />
      ) : (
        <span className="relative z-[1] text-sm font-black text-[#0D5C3A]">{name.slice(0, 1) || "S"}</span>
      )}
    </span>
  );
}
