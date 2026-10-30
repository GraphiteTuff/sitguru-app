"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BedDouble,
  CalendarDays,
  CreditCard,
  Gift,
  GraduationCap,
  HelpCircle,
  Home,
  MapPin,
  MessageCircle,
  PawPrint,
  Plus,
  Search,
  Star,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { SEARCH_SERVICE_OPTIONS } from "@/lib/search/service-options";
import { trackEvent } from "@/lib/analytics/track";
import {
  buildDashboardSearchHref,
  type CareTiming,
  serviceUsesDateRange,
  withBookingSelections,
} from "@/lib/customer/dashboard-search";

const EXTRA_SERVICES = SEARCH_SERVICE_OPTIONS.filter(
  (service) => !["Dog Walking", "Drop-In Visits", "Pet Sitting", "Boarding", "Training Support"].includes(service),
);

const QUICK_SERVICES = [
  { id: "Dog Walking", label: "Dog Walking", icon: PawPrint },
  { id: "Drop-In Visits", label: "Drop-In Visits", icon: Home },
  { id: "Pet Sitting", label: "Pet Sitting", icon: PawPrint },
  { id: "Boarding", label: "Boarding", icon: BedDouble },
  { id: "Training Support", label: "Training", icon: GraduationCap },
] as const;

const TIMING = [
  { id: "today", label: "Today" },
  { id: "tomorrow", label: "Tomorrow" },
  { id: "dates", label: "Choose dates" },
  { id: "flexible", label: "Flexible" },
] as const;

const RAIL = [
  { href: "/customer/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/search", label: "Find a Guru", icon: Search },
  { href: "/customer/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/messages?role=customer&returnTo=/customer/dashboard", label: "Messages", icon: MessageCircle },
  { href: "/customer/dashboard#multi-pet-center", label: "My Pets", icon: PawPrint },
  { href: "/customer/dashboard/pawperks", label: "PawPerks", icon: Gift },
  { href: "/customer/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/customer/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/help", label: "Help & Support", icon: HelpCircle },
] as const;

const HERO_IMAGE = "/images/hero/sitguru-dog-walking-hero.jpg";

export type CommandPet = {
  id: string;
  name: string;
  detail: string;
  photo: string;
};

export type CommandVisit = {
  service: string;
  petName: string;
  petPhoto: string;
  guruName: string;
  guruPhoto: string;
  when: string;
  place: string;
  detailHref: string;
  reportHref: string;
  payHref: string;
};

export type CommandGuru = {
  id: string;
  name: string;
  photo: string;
  services: string;
  rating: number | null;
  reviews: number;
  distance: string;
  verified: boolean;
  rateLabel: string;
  profileHref: string;
  bookHref: string;
};

export type CommandRepeat = {
  name: string;
  service: string;
  href: string;
};

type CommandCenterProps = {
  firstName: string;
  upcomingCount: number;
  pawPerksLabel: string;
  visit: CommandVisit | null;
  pets: CommandPet[];
  gurus: CommandGuru[];
  careZip: string;
  careLocationLabel: string;
  guruMessage: string;
  loadingGurus: boolean;
  repeatCare: CommandRepeat | null;
  paymentAlert: { service: string; when: string; amount: string; href: string } | null;
  onZipReady: (zip: string) => void;
};

function firstToken(value: string, fallback: string) {
  const token = value.trim().split(/\s+/)[0];
  return token || fallback;
}

function Face({ src, name, className }: { src: string; name: string; className: string }) {
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-emerald-50 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full bg-white object-cover object-center" />
      ) : (
        <PawPrint className="h-5 w-5 text-[#0D5C3A]" aria-hidden />
      )}
    </span>
  );
}

export function CustomerDashboardRail() {
  const pathname = usePathname() || "";

  return (
    <aside className="hidden lg:block">
      <nav aria-label="Pet Parent" className="sticky top-24 space-y-1 rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
        {RAIL.map((item) => {
          const Icon = item.icon;
          const active = "exact" in item && item.exact ? pathname === "/customer/dashboard" : pathname === item.href;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold ${
                active ? "bg-emerald-50 text-[#0D5C3A]" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default function CustomerCareCommandCenter({
  firstName,
  upcomingCount,
  pawPerksLabel,
  visit,
  pets,
  gurus,
  careZip,
  careLocationLabel,
  guruMessage,
  loadingGurus,
  repeatCare,
  paymentAlert,
  onZipReady,
}: CommandCenterProps) {
  const router = useRouter();
  const [service, setService] = useState<string>(QUICK_SERVICES[0].id);
  const [place, setPlace] = useState(careZip);
  const [placeEdited, setPlaceEdited] = useState(false);
  const [timing, setTiming] = useState<CareTiming>("flexible");
  const [pickedDates, setPickedDates] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [showMoreServices, setShowMoreServices] = useState(false);
  const [unread, setUnread] = useState<number | null>(null);
  const requestedZip = useRef("");
  const onZipReadyRef = useRef(onZipReady);
  onZipReadyRef.current = onZipReady;
  const greetingName = firstName && firstName.toLowerCase() !== "there" ? firstName : "";
  const petNames = pets.slice(0, 2).map((pet) => pet.name).filter(Boolean).join(" & ");

  useEffect(() => {
    if (placeEdited || place) return;
    if (careZip) setPlace(careZip);
  }, [careZip, place, placeEdited]);

  useEffect(() => {
    const zip = place.match(/\b(\d{5})\b/)?.[1] || "";
    if (zip.length !== 5 || zip === careZip) return;
    const timer = window.setTimeout(() => {
      if (requestedZip.current === zip) return;
      requestedZip.current = zip;
      onZipReadyRef.current(zip);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [place, careZip]);

  useEffect(() => {
    void trackEvent({
      eventName: "pet_parent_dashboard_viewed",
      eventType: "dashboard",
      role: "customer",
      source: "customer_dashboard",
    });
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id,last_message_at,customer_id")
        .eq("customer_id", userId)
        .limit(40);
      if (!active || error || !conversations?.length) {
        if (active && !error) setUnread(0);
        return;
      }
      const ids = conversations.map((row) => String(row.id));
      const { data: participants } = await supabase
        .from("conversation_participants")
        .select("conversation_id,last_read_at")
        .eq("user_id", userId)
        .in("conversation_id", ids);
      const readAt = new Map(
        (participants || []).map((row) => [String(row.conversation_id), String(row.last_read_at || "")]),
      );
      const count = conversations.filter((row) => {
        const activity = String(row.last_message_at || "");
        if (!activity) return false;
        const seen = readAt.get(String(row.id)) || "";
        return !seen || new Date(activity).getTime() > new Date(seen).getTime();
      }).length;
      if (active) setUnread(count);
    })();
    return () => {
      active = false;
    };
  }, []);

  function selection() {
    return { service, location: place, timing, dates: pickedDates, rangeStart, rangeEnd };
  }

  const typedZip = place.match(/\b(\d{5})\b/)?.[1] || "";
  const locationHint = typedZip && typedZip === careZip ? careLocationLabel : "";
  const rangeService = serviceUsesDateRange(service);

  function findCare(event: FormEvent) {
    event.preventDefault();
    const href = buildDashboardSearchHref(selection());
    void trackEvent({
      eventName: "pet_parent_search_started",
      eventType: "search",
      role: "customer",
      source: "customer_dashboard",
      metadata: { service, timing },
    });
    router.push(href);
  }

  const messageDetail = unread === null ? "Opening inbox" : unread === 1 ? "Unread message" : unread === 0 ? "No unread messages" : "Unread messages";

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-emerald-100 bg-[linear-gradient(90deg,#f3fbf6_0%,#ffffff_58%,#e7f6ee_100%)] shadow-sm">
        <div className="flex items-start justify-between gap-4 p-5 sm:p-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {greetingName ? `Hi, ${greetingName}!` : "Hi there!"} <span aria-hidden="true">👋</span>
            </h1>
            <p className="mt-1 text-sm font-semibold text-slate-600">Ready to book trusted pet care?</p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={HERO_IMAGE} alt="" className="hidden h-24 w-36 rounded-2xl object-cover object-center sm:block lg:h-32 lg:w-52" />
        </div>
        <form onSubmit={findCare} className="mx-4 mb-4 rounded-3xl border border-emerald-100 bg-white p-4 shadow-sm sm:mx-6 sm:mb-6 sm:p-5">
          <h2 className="text-lg font-black text-slate-950">What kind of care does your pet need?</h2>
          <div className="mt-3 flex flex-wrap gap-2" role="radiogroup" aria-label="Care service">
            {QUICK_SERVICES.map((option) => {
              const Icon = option.icon;
              const selected = service === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => {
                    setService(option.id);
                    void trackEvent({
                      eventName: "pet_parent_service_selected",
                      eventType: "search",
                      role: "customer",
                      source: "customer_dashboard",
                      metadata: { service: option.id },
                    });
                  }}
                  className={selected
                    ? "inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
                    : "inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700"}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                  {option.label}
                </button>
              );
            })}
            {EXTRA_SERVICES.length ? (
              <button type="button" onClick={() => setShowMoreServices((open) => !open)} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-600">
                {showMoreServices ? "Fewer services" : "More services"}
              </button>
            ) : null}
            {showMoreServices ? EXTRA_SERVICES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={service === option}
                onClick={() => setService(option)}
                className={service === option
                  ? "inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
                  : "inline-flex min-h-11 items-center rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-700"}
              >
                {option}
              </button>
            )) : null}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(16rem,1.2fr)_auto] lg:items-end">
            <label className="block text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
              Location
              <span className="mt-1 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 px-3 normal-case tracking-normal">
                <MapPin className="h-4 w-4 shrink-0 text-[#0D5C3A]" aria-hidden />
                <input
                  value={place}
                  onChange={(event) => {
                    setPlaceEdited(true);
                    setPlace(event.target.value);
                  }}
                  placeholder="ZIP code"
                  aria-label="Search ZIP code"
                  className="w-full bg-transparent text-base font-semibold text-slate-800 outline-none"
                />
              </span>
              <span className="mt-1 block min-h-4 text-[11px] font-semibold normal-case tracking-normal text-slate-400">
                {locationHint || (typedZip.length > 0 && typedZip.length < 5 ? "Enter a 5-digit ZIP" : "Search area only. Your saved address stays the same.")}
              </span>
            </label>
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">Dates</p>
              <div className="mt-1 flex flex-wrap gap-2" role="radiogroup" aria-label="When you need care">
                {TIMING.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    role="radio"
                    aria-checked={timing === option.id}
                    onClick={() => setTiming(option.id)}
                    className={timing === option.id
                      ? "min-h-10 rounded-full bg-emerald-50 px-3 text-sm font-bold text-[#0D5C3A] ring-1 ring-emerald-200"
                      : "min-h-10 rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-600"}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {timing === "dates" ? (
                <DatePlanner
                  range={rangeService}
                  dates={pickedDates}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onDatesChange={setPickedDates}
                  onRangeChange={(start, end) => {
                    setRangeStart(start);
                    setRangeEnd(end);
                  }}
                />
              ) : (
                <p className="mt-2 text-xs font-semibold text-slate-500">
                  {timing === "flexible" ? "Browse Gurus without a specific date." : "Uses one date. Choose dates for several visits or an overnight stay."}
                </p>
              )}
            </div>
            <button id="find-a-guru" type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 text-sm font-bold !text-white lg:w-auto">
              <Search className="h-4 w-4" aria-hidden />
              Find a Guru
            </button>
          </div>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat href="/customer/dashboard/bookings" tint="bg-emerald-50" label="Upcoming care" value={String(upcomingCount)} detail={upcomingCount === 0 ? "No bookings yet" : "View bookings"} />
        <Stat href="/messages?role=customer&returnTo=/customer/dashboard" tint="bg-sky-50" label="Messages" value={unread === null ? "—" : String(unread)} detail={messageDetail} />
        <Stat href="/customer/dashboard#multi-pet-center" tint="bg-violet-50" label="Your pets" value={String(pets.length)} detail={petNames || "Manage pets"} />
        <Stat href="/customer/dashboard/pawperks" tint="bg-amber-50" label="PawPerks rewards" value={pawPerksLabel} detail="Available credit" />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Your upcoming care</h2>
            <Link href="/customer/dashboard/bookings" className="text-sm font-bold text-[#0D5C3A]">View all</Link>
          </div>
          {paymentAlert ? (
            <Link href={paymentAlert.href} className="mt-4 block rounded-2xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-amber-800">Payment needed</p>
              <p className="mt-1 font-black text-slate-950">{paymentAlert.service}</p>
              <p className="text-sm font-semibold text-slate-600">{paymentAlert.when} · {paymentAlert.amount}</p>
              <span className="mt-2 inline-flex text-sm font-bold text-amber-800">Complete payment</span>
            </Link>
          ) : null}
          {visit ? (
            <article className="mt-4 rounded-3xl border border-slate-100 p-4">
              <div className="flex gap-3">
                <Face src={visit.petPhoto} name={visit.petName} className="h-16 w-16 rounded-2xl" />
                <div className="min-w-0">
                  <p className="font-black text-slate-950">{visit.service}</p>
                  <p className="text-sm font-semibold text-slate-500">{visit.when}</p>
                  <p className="mt-1 text-sm text-slate-500">{visit.petName}</p>
                  <p className="text-sm text-slate-500">{visit.place}</p>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-600">
                <Face src={visit.guruPhoto} name={visit.guruName} className="h-8 w-8 rounded-full" />
                {visit.guruName}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={visit.detailHref} className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">View booking</Link>
                <Link href="/messages?role=customer&returnTo=/customer/dashboard" className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 px-4 text-sm font-bold text-[#0D5C3A]">Message Guru</Link>
                {visit.payHref ? <Link href={visit.payHref} className="inline-flex min-h-11 items-center rounded-full border border-amber-200 px-4 text-sm font-bold text-amber-800">Complete payment</Link> : null}
              </div>
            </article>
          ) : (
            <div className="mt-4 rounded-3xl bg-emerald-50/70 px-4 py-6 text-center">
              <CalendarDays className="mx-auto h-10 w-10 text-[#0D5C3A]" aria-hidden />
              <p className="mt-3 font-black text-slate-950">You don&apos;t have any upcoming bookings.</p>
              <p className="mt-1 text-sm text-slate-600">Find a trusted Guru for walks, visits, sitting, and more.</p>
              <button type="button" onClick={() => document.getElementById("find-a-guru")?.focus()} className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">
                <Search className="h-4 w-4" aria-hidden />
                Find a Guru
              </button>
            </div>
          )}
          {repeatCare ? (
            <Link href={repeatCare.href} className="mt-3 flex min-h-12 items-center justify-between rounded-2xl border border-emerald-100 bg-emerald-50 px-4 text-sm font-bold text-[#0D5C3A]">
              Book again with {repeatCare.name}
              <span className="font-semibold text-slate-500">{repeatCare.service}</span>
            </Link>
          ) : null}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Your furry family</h2>
            <Link href="/customer/dashboard#multi-pet-center" className="text-sm font-bold text-[#0D5C3A]">Manage pets</Link>
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {pets.slice(0, 2).map((pet) => (
              <li key={pet.id} className="rounded-3xl border border-slate-100 p-3 text-center">
                <Face src={pet.photo} name={pet.name} className="mx-auto h-28 w-28 rounded-full sm:h-32 sm:w-32" />
                <p className="mt-2 font-black text-slate-950">{pet.name}</p>
                <p className="text-xs font-semibold text-slate-500">{pet.detail}</p>
                <Link href="/customer/dashboard#multi-pet-center" className="mt-2 inline-flex text-sm font-bold text-[#0D5C3A]">View profile</Link>
              </li>
            ))}
            <li>
              <Link href="/customer/dashboard#new-pet-passport" className="flex h-full min-h-40 flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-300 text-center text-sm font-bold text-[#0D5C3A]">
                <Plus className="mb-1 h-6 w-6" aria-hidden />
                Add a Pet
                <span className="mt-1 px-3 text-xs font-semibold text-slate-500">Tell us about your furry family member.</span>
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">Meet Gurus near you</h2>
            <p className="text-sm font-semibold text-slate-500">
              {locationHint ? `Find local pet caregivers in ${locationHint}.` : "Find local pet caregivers who are a great fit for your pets."}
            </p>
          </div>
          <Link href={buildDashboardSearchHref(selection())} className="text-sm font-bold text-[#0D5C3A]">View all Gurus</Link>
        </div>
        {loadingGurus ? <p className="mt-4 text-sm font-semibold text-slate-500">Looking for Gurus near you.</p> : null}
        {!loadingGurus && gurus.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-500">{guruMessage || "No bookable Gurus cover this ZIP yet. Try another area."}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {gurus.map((guru) => (
              <li key={guru.id} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-start gap-4">
                  <Face src={guru.photo} name={guru.name} className="h-32 w-32 rounded-3xl sm:h-36 sm:w-36" />
                  <div className="min-w-0">
                    <p className="font-black text-slate-950">{guru.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{guru.services}</p>
                    {guru.verified ? <p className="text-xs font-bold text-[#0D5C3A]">Verified</p> : null}
                  </div>
                </div>
                <p className="mt-3 flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-600">
                  {guru.rating !== null ? (
                    <>
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                      {guru.rating.toFixed(1)} ({guru.reviews} reviews)
                    </>
                  ) : (
                    "New on SitGuru"
                  )}
                  <span className="text-slate-400">· {guru.distance}</span>
                  {guru.rateLabel ? <span className="text-slate-400">· {guru.rateLabel}</span> : null}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={guru.profileHref}
                    onClick={() => void trackEvent({ eventName: "pet_parent_guru_profile_opened", eventType: "profile", role: "customer", source: "customer_dashboard", guruId: guru.id })}
                    className="inline-flex min-h-10 items-center rounded-full border border-slate-200 px-3 text-sm font-bold text-slate-700"
                  >
                    View profile
                  </Link>
                  <Link
                    href={withBookingSelections(guru.bookHref, selection())}
                    onClick={() => void trackEvent({ eventName: "pet_parent_booking_started", eventType: "booking", role: "customer", source: "customer_dashboard", guruId: guru.id, metadata: { service, timing } })}
                    className="inline-flex min-h-10 items-center rounded-full bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
                  >
                    Book now
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function DatePlanner({
  range,
  dates,
  rangeStart,
  rangeEnd,
  onDatesChange,
  onRangeChange,
}: {
  range: boolean;
  dates: string[];
  rangeStart: string;
  rangeEnd: string;
  onDatesChange: (dates: string[]) => void;
  onRangeChange: (start: string, end: string) => void;
}) {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const dayCount = new Date(year, month + 1, 0).getDate();
  const cells: Array<string | null> = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= dayCount; day += 1) {
    cells.push(`${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`);
  }
  const label = cursor.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const summary = range
    ? [rangeStart, rangeEnd].filter(Boolean).join(" to ") || "Choose check-in and check-out"
    : dates.length
      ? `${dates.length} date${dates.length === 1 ? "" : "s"} selected`
      : "Choose one or more dates";

  function pick(iso: string) {
    if (range) {
      if (!rangeStart || (rangeStart && rangeEnd)) {
        onRangeChange(iso, "");
        return;
      }
      if (iso < rangeStart) onRangeChange(iso, rangeStart);
      else onRangeChange(rangeStart, iso);
      return;
    }
    onDatesChange(dates.includes(iso) ? dates.filter((date) => date !== iso) : [...dates, iso].sort());
  }

  return (
    <div className="relative mt-2">
      <p className="mb-2 text-xs font-semibold text-slate-500">{summary}</p>
      <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => setCursor(new Date(year, month - 1, 1))} className="min-h-10 rounded-full px-3 text-sm font-bold text-slate-600" aria-label="Previous month">Prev</button>
          <p className="text-sm font-black text-slate-950">{label}</p>
          <button type="button" onClick={() => setCursor(new Date(year, month + 1, 1))} className="min-h-10 rounded-full px-3 text-sm font-bold text-slate-600" aria-label="Next month">Next</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
          {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {cells.map((iso, index) => {
            if (!iso) return <span key={`empty-${index}`} />;
            const selected = range
              ? iso === rangeStart || iso === rangeEnd || (rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd)
              : dates.includes(iso);
            return (
              <button
                key={iso}
                type="button"
                onClick={() => pick(iso)}
                aria-pressed={selected}
                className={selected
                  ? "min-h-10 rounded-xl bg-[#0D5C3A] text-sm font-bold !text-white"
                  : "min-h-10 rounded-xl text-sm font-semibold text-slate-700 hover:bg-emerald-50"}
              >
                {Number(iso.slice(-2))}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Stat({ href, tint, label, value, detail }: { href: string; tint: string; label: string; value: string; detail: string }) {
  return (
    <Link href={href} className={`rounded-3xl p-4 shadow-sm ring-1 ring-black/5 ${tint}`}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-bold text-[#0D5C3A]">{detail}</p>
    </Link>
  );
}
