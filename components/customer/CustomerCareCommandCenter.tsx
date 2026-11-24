"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BedDouble,
  ArrowRight,
  Camera,
  CalendarDays,
  CreditCard,
  Gift,
  GraduationCap,
  HelpCircle,
  Heart,
  Home,
  MapPin,
  MessageCircle,
  PawPrint,
  Search,
  ShieldCheck,
  Star,
  RotateCcw,
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
  isLive?: boolean;
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
  avatarUrl: string;
  avatarInitials: string;
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
  avatarUrl,
  avatarInitials,
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
  const [selectedPetId, setSelectedPetId] = useState(pets[0]?.id || "");
  const [place, setPlace] = useState(careZip);
  const [placeEdited, setPlaceEdited] = useState(false);
  const [timing, setTiming] = useState<CareTiming>("flexible");
  const [pickedDates, setPickedDates] = useState<string[]>([]);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const [unread, setUnread] = useState<number | null>(null);
  const requestedZip = useRef("");
  const onZipReadyRef = useRef(onZipReady);
  onZipReadyRef.current = onZipReady;
  const greetingName = firstName && firstName.toLowerCase() !== "there" ? firstName : "";
  const petNames = pets.slice(0, 2).map((pet) => pet.name).filter(Boolean).join(" & ");

  useEffect(() => {
    if (!pets.length) { if (selectedPetId) setSelectedPetId(""); return; }
    if (!pets.some((pet) => pet.id === selectedPetId)) setSelectedPetId(pets[0].id);
  }, [pets, selectedPetId]);

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
    return { service, petId: selectedPetId, location: place, timing, dates: pickedDates, rangeStart, rangeEnd };
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
    <div className="space-y-5">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-[0_12px_40px_rgba(0,71,43,0.06)]" aria-labelledby="parent-home-welcome">
        <div className="flex items-center justify-between gap-3 bg-gradient-to-r from-[#f4fff5] via-white to-[#ebf9f0] px-4 py-5 sm:px-7 sm:py-7">
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">Your SitGuru Pet Parent Home</p>
            <h1 id="parent-home-welcome" className="mt-1 text-[clamp(1.75rem,4.6vw,2.8rem)] font-black leading-[1.13] tracking-tight text-[#102339]">
              {"Welcome Back" + (greetingName ? ", " + greetingName : "") + "!"} <span aria-hidden="true" className="text-orange-500">🐾</span>
            </h1>
            <p className="mt-2 text-sm font-semibold text-slate-600 sm:text-base">Your pets, your care, all in one place.</p>
          </div>
          <Link
            href="/customer/dashboard/profile"
            aria-label="Open your Pet Parent profile"
            className="inline-flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-100 text-xl font-black text-emerald-800 shadow-md sm:h-20 sm:w-20"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (avatarInitials || "SG")}
          </Link>
        </div>

        <form onSubmit={findCare} className="relative isolate overflow-hidden bg-gradient-to-br from-[#004c34] via-[#00673e] to-[#007c47] p-4 text-white sm:p-7" aria-label="Find pet care">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-lime-400/15 blur-2xl" aria-hidden="true" />
          <div className="relative flex min-w-0 items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.15em] text-lime-200">Fast, personalized pet care</p>
              <h2 className="mt-2 max-w-2xl text-[clamp(1.65rem,3.2vw,2.4rem)] font-black leading-tight tracking-tight text-white">
                Find the perfect Guru for your pet
              </h2>
              <p className="mt-2 text-sm font-medium text-emerald-50 sm:text-base">Choose what you need and we&apos;ll find matching local Gurus.</p>
            </div>
            <PawPrint aria-hidden="true" className="hidden h-16 w-16 shrink-0 text-lime-300/70 sm:block" />
          </div>
          <div className="relative mt-6 grid grid-cols-1 gap-3 min-[360px]:grid-cols-2">
            <label className="flex min-w-0 flex-col rounded-[1.35rem] border border-white/70 bg-white px-4 py-3 text-[#102339] shadow-sm">
              <span className="flex items-center gap-2 text-sm font-black"><PawPrint aria-hidden="true" className="h-5 w-5 text-orange-500" /> Your Pet</span>
              <select value={selectedPetId} onChange={(event) => setSelectedPetId(event.target.value)} className="mt-1 min-h-[46px] w-full min-w-0 appearance-auto bg-transparent text-base font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Choose your pet">
                {!pets.length ? <option value="">Choose after adding a pet</option> : null}
                {pets.map((pet) => <option key={pet.id} value={pet.id}>{pet.name}</option>)}
              </select>
            </label>
            <label className="flex min-w-0 flex-col rounded-[1.35rem] border border-white/70 bg-white px-4 py-3 text-[#102339] shadow-sm">
              <span className="flex items-center gap-2 text-sm font-black"><Heart aria-hidden="true" className="h-5 w-5 text-orange-500" /> Service</span>
              <select value={service} onChange={(event) => setService(event.target.value)} className="mt-1 min-h-[46px] w-full min-w-0 appearance-auto bg-transparent text-base font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500" aria-label="Choose care service">
                {QUICK_SERVICES.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
                {EXTRA_SERVICES.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            </label>
            <div className="min-w-0 rounded-[1.35rem] border border-white/70 bg-white px-4 py-3 text-[#102339] shadow-sm">
              <label htmlFor="pet-parent-search-dates" className="flex items-center gap-2 text-sm font-black"><CalendarDays aria-hidden="true" className="h-5 w-5 text-orange-500" /> Dates</label>
              <select id="pet-parent-search-dates" value={timing} onChange={(event) => setTiming(event.target.value as CareTiming)} className="mt-1 min-h-[46px] w-full min-w-0 bg-transparent text-base font-semibold text-slate-700 outline-none focus-visible:ring-2 focus-visible:ring-emerald-500">
                {TIMING.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
              </select>
            </div>
            <label className="flex min-w-0 flex-col rounded-[1.35rem] border border-white/70 bg-white px-4 py-3 text-[#102339] shadow-sm">
              <span className="flex items-center gap-2 text-sm font-black"><MapPin aria-hidden="true" className="h-5 w-5 text-orange-500" /> Location</span>
              <input
                value={place}
                onChange={(event) => { setPlaceEdited(true); setPlace(event.target.value); }}
                placeholder="ZIP code or city"
                aria-label="Search care ZIP code or city"
                inputMode="text"
                autoComplete="postal-code"
                className="mt-1 min-h-[46px] w-full min-w-0 bg-transparent text-base font-semibold text-slate-700 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500"
              />
            </label>
          </div>
          {timing === "dates" ? (
            <div className="relative mt-3 rounded-[1.35rem] bg-white px-4 py-4 text-slate-900" aria-label="Choose care dates">
              <p className="text-sm font-black text-emerald-900">{rangeService ? "Select check-in and check-out dates" : "Select one or multiple dates"}</p>
              <DatePlanner
                range={rangeService}
                dates={pickedDates}
                rangeStart={rangeStart}
                rangeEnd={rangeEnd}
                onDatesChange={setPickedDates}
                onRangeChange={(start, end) => { setRangeStart(start); setRangeEnd(end); }}
              />
            </div>
          ) : null}
          {locationHint ? <p className="relative mt-3 text-xs font-bold text-emerald-50">Searching Gurus serving {locationHint}</p> : typedZip.length > 0 && typedZip.length < 5 ? <p className="relative mt-3 text-xs font-bold text-lime-200">Enter a 5-digit ZIP code for accurate local matching.</p> : null}
          {!pets.length ? <Link href="/customer/dashboard#new-pet-passport" className="relative mt-3 inline-flex min-h-11 items-center text-sm font-bold text-lime-200 underline underline-offset-4">Add your first pet to personalize matching</Link> : null}
          <button id="find-a-guru" type="submit" className="relative mt-5 inline-flex min-h-[60px] w-full items-center justify-center gap-3 rounded-[1.4rem] bg-gradient-to-r from-orange-500 to-[#ff7200] px-5 py-3 text-lg font-black text-white shadow-[0_10px_22px_rgba(40,30,0,0.16)] transition hover:from-orange-600 hover:to-orange-500 focus-visible:outline focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-lime-300 sm:text-xl">
            <Search aria-hidden="true" className="h-6 w-6" /> Find My Guru <ArrowRight aria-hidden="true" className="h-6 w-6" />
          </button>
          <p className="relative mt-3 text-center text-xs font-medium text-emerald-50">Browse real Guru profiles, service areas and available booking details.</p>
        </form>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <section className="overflow-hidden rounded-[1.7rem] border border-emerald-100 bg-white shadow-sm" aria-labelledby="what-matters-heading">
          <div className="flex flex-wrap items-center justify-between gap-2 bg-gradient-to-r from-[#004c34] to-[#006c42] px-5 py-4 text-white">
            <h2 id="what-matters-heading" className="flex items-center gap-2 text-xl font-black text-white">
              <CalendarDays aria-hidden="true" className="h-6 w-6 text-lime-300" /> What matters now
            </h2>
            {visit ? <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-black text-emerald-900">{visit.isLive ? "Care is live" : "Next care appointment"}</span> : null}
          </div>
          {paymentAlert ? (
            <div className="p-5">
              <p className="text-sm font-black uppercase tracking-wide text-amber-700">Payment needs attention</p>
              <p className="mt-2 text-xl font-black text-[#102339]">{paymentAlert.service}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{paymentAlert.when} · {paymentAlert.amount}</p>
              <Link href={paymentAlert.href} className="mt-4 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-4 text-base font-black text-white hover:bg-orange-600">Review payment <ArrowRight aria-hidden="true" className="h-5 w-5" /></Link>
            </div>
          ) : visit ? (
            <div className="p-4 sm:p-5">
              <div className="flex min-w-0 items-start gap-4">
                <Face src={visit.petPhoto} name={visit.petName} className="h-20 w-20 rounded-[1.25rem] sm:h-24 sm:w-24" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black uppercase tracking-wider text-emerald-700">{visit.isLive ? "Care in progress" : "Upcoming visit"}</p>
                  <h3 className="mt-1 text-xl font-black text-[#102339]">{visit.petName} · {visit.service}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-600">{visit.when}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">{visit.place}</p>
                  <div className="mt-2 flex items-center gap-2 text-sm font-bold text-emerald-900">
                    <Face src={visit.guruPhoto} name={visit.guruName} className="h-8 w-8 rounded-full" />
                    {"Guru: " + visit.guruName}
                  </div>
                </div>
              </div>
              <div className="mt-5 grid gap-2 min-[390px]:grid-cols-2 xl:grid-cols-3">
                <Link href="/customer/dashboard/messages" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-900"><MessageCircle className="h-5 w-5" aria-hidden="true" /> Message Guru</Link>
                <Link href={visit.detailHref} className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-emerald-100 px-3 text-sm font-black text-emerald-900"><CalendarDays className="h-5 w-5" aria-hidden="true" /> View Booking</Link>
                <Link href={visit.reportHref} className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#006c42] px-3 text-sm font-black text-white min-[390px]:col-span-2 xl:col-span-1"><PawPrint className="h-5 w-5" aria-hidden="true" /> {visit.isLive ? "Live PawReport" : "View PawReport"}</Link>
              </div>
            </div>
          ) : (
            <div className="p-5">
              <div className="flex items-center gap-4">
                <PawPrint className="h-12 w-12 shrink-0 text-emerald-700" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-black text-[#102339]">Ready when you are</h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">No upcoming care yet. Your next great Guru is just a few taps away.</p>
                </div>
              </div>
              <button type="button" onClick={() => document.getElementById("find-a-guru")?.focus()} className="mt-4 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-700 px-4 text-base font-black text-white">Find Care <ArrowRight className="h-5 w-5" aria-hidden="true" /></button>
            </div>
          )}
        </section>

        <section className="grid grid-cols-2 gap-3" aria-label="Pet Parent quick actions">
          <Link href="/customer/dashboard#multi-pet-center" className="flex min-h-[138px] flex-col justify-between rounded-[1.4rem] border border-emerald-100 bg-gradient-to-br from-[#effff3] to-[#dbf5e2] p-4 shadow-sm transition hover:shadow-md">
            <PawPrint className="h-9 w-9 text-emerald-700" aria-hidden="true" />
            <span className="text-lg font-black text-[#102339]">My Pets</span>
            <span className="text-xs font-semibold text-slate-600">{pets.length ? pets.length + (pets.length === 1 ? " Pet Passport" : " Pet Passports") : "Add your first pet"}</span>
          </Link>
          <Link href={repeatCare?.href || "/customer/dashboard/bookings"} className="flex min-h-[138px] flex-col justify-between rounded-[1.4rem] border border-orange-100 bg-gradient-to-br from-[#fff9ed] to-[#fff0d2] p-4 shadow-sm transition hover:shadow-md">
            <RotateCcw className="h-9 w-9 text-orange-600" aria-hidden="true" />
            <span className="text-lg font-black text-[#102339]">Book Again</span>
            <span className="text-xs font-semibold text-slate-600">{repeatCare ? "Rebook with " + repeatCare.name : "See your previous care"}</span>
          </Link>
          <Link href="/pack#submit" className="flex min-h-[138px] flex-col justify-between rounded-[1.4rem] border border-orange-100 bg-gradient-to-br from-[#fff6ee] to-[#ffe5d4] p-4 shadow-sm transition hover:shadow-md">
            <Camera className="h-9 w-9 text-orange-600" aria-hidden="true" />
            <span className="text-lg font-black text-[#102339]">Pet Moments</span>
            <span className="text-xs font-semibold text-slate-600">Share a photo or video</span>
          </Link>
          <Link href={visit?.reportHref || "/customer/dashboard/bookings"} className="flex min-h-[138px] flex-col justify-between rounded-[1.4rem] border border-emerald-100 bg-gradient-to-br from-[#f0fff6] to-[#e1f7eb] p-4 shadow-sm transition hover:shadow-md">
            <CalendarDays className="h-9 w-9 text-emerald-700" aria-hidden="true" />
            <span className="text-lg font-black text-[#102339]">PawReport Live</span>
            <span className="text-xs font-semibold text-slate-600">{visit ? "Care photos & visit updates" : "Your booking history"}</span>
          </Link>
        </section>
      </div>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Your account at a glance">
        <Stat href="/customer/dashboard/bookings" tint="bg-emerald-50" label="Upcoming care" value={String(upcomingCount)} detail={upcomingCount ? "View visits" : "No bookings yet"} />
        <Stat href="/customer/dashboard/messages" tint="bg-sky-50" label="Messages" value={unread === null ? "—" : String(unread)} detail={messageDetail} />
        <Stat href="/customer/dashboard#multi-pet-center" tint="bg-violet-50" label="Your pets" value={String(pets.length)} detail={petNames || "Manage passports"} />
        <Stat href="/customer/dashboard/pawperks" tint="bg-amber-50" label="PawPerks" value={pawPerksLabel} detail="Rewards & credits" />
      </section>

      <section className="rounded-[1.7rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-6" aria-labelledby="gurus-near-you">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-emerald-700">Your local care community</p>
            <h2 id="gurus-near-you" className="mt-1 text-2xl font-black text-[#102339]">Meet Gurus near you</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{locationHint ? "Find Gurus serving " + locationHint : "Find local caregivers with the services your pet needs."}</p>
          </div>
          <Link href={buildDashboardSearchHref(selection())} className="inline-flex min-h-[48px] items-center gap-2 rounded-full border border-emerald-200 px-5 text-sm font-black text-emerald-800">View all Gurus <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>
        {loadingGurus ? <p className="mt-5 text-sm font-semibold text-slate-500" role="status">Finding Gurus near your selected area…</p> : null}
        {!loadingGurus && gurus.length === 0 ? (
          <div className="mt-5 rounded-2xl bg-emerald-50 p-5 text-sm font-semibold leading-6 text-emerald-900">{guruMessage || "No bookable Gurus currently match this area. Try another ZIP."}</div>
        ) : (
          <ul className="mt-5 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {gurus.map((guru) => (
              <li key={guru.id} className="flex min-w-0 flex-col rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-[0_8px_25px_rgba(15,23,42,.06)]">
                <div className="flex items-start gap-3">
                  <Face src={guru.photo} name={guru.name} className="h-20 w-20 rounded-[1.2rem] sm:h-24 sm:w-24" />
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-black text-[#102339]">{guru.name}</p>
                    <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-600">{guru.services}</p>
                    {guru.verified ? <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700"><ShieldCheck aria-hidden="true" className="h-4 w-4" /> Verified Guru</span> : null}
                  </div>
                </div>
                <p className="mt-3 text-sm font-bold text-slate-700">
                  {guru.rating !== null ? <><Star className="mr-1 inline h-4 w-4 fill-amber-400 text-amber-400" aria-hidden="true" />{guru.rating.toFixed(1) + " (" + guru.reviews + " reviews)"}</> : "New on SitGuru"}
                  <span className="ml-2 text-slate-500">{guru.distance}</span>
                </p>
                {guru.rateLabel ? <p className="mt-2 text-lg font-black text-emerald-800">{guru.rateLabel}</p> : <p className="mt-2 text-sm font-semibold text-slate-500">See Guru profile for rates</p>}
                <div className="mt-auto grid grid-cols-2 gap-2 pt-4">
                  <Link href={guru.profileHref} onClick={() => void trackEvent({ eventName: "pet_parent_guru_profile_opened", eventType: "profile", role: "customer", source: "customer_dashboard", guruId: guru.id })} className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-emerald-700 px-2 text-sm font-black text-emerald-800">View Profile</Link>
                  <Link href={withBookingSelections(guru.bookHref, selection())} onClick={() => void trackEvent({ eventName: "pet_parent_booking_started", eventType: "booking", role: "customer", source: "customer_dashboard", guruId: guru.id, metadata: { service, timing } })} className="inline-flex min-h-[56px] items-center justify-center rounded-2xl bg-gradient-to-r from-orange-500 to-[#ff7400] px-2 text-sm font-black text-white hover:bg-orange-600">Book Guru</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
      <nav className="fixed inset-x-0 bottom-0 z-[45] border-t border-emerald-100 bg-white/95 px-1 pb-[max(0.35rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-12px_28px_rgba(15,23,42,0.08)] backdrop-blur lg:hidden" aria-label="Pet Parent quick navigation">
        <div className="mx-auto grid max-w-lg grid-cols-5 gap-0.5">
          {[
            { href: "/customer/dashboard", label: "Home", Icon: Home },
            { href: "/search", label: "Find Care", Icon: Search },
            { href: "/customer/dashboard/bookings", label: "Bookings", Icon: CalendarDays },
            { href: "/customer/dashboard/messages", label: "Messages", Icon: MessageCircle },
            { href: "/customer/dashboard#multi-pet-center", label: "My Pets", Icon: PawPrint },
          ].map(({ href, label, Icon }) => (
            <Link key={label} href={href} aria-current={label === "Home" ? "page" : undefined} className={label === "Home" ? "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl bg-emerald-100 text-emerald-900" : "flex min-h-[58px] flex-col items-center justify-center gap-1 rounded-xl text-slate-700"}>
              <Icon aria-hidden="true" className="h-6 w-6" />
              <span className="text-[11px] font-black">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
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
              ? iso === rangeStart || iso === rangeEnd || Boolean(rangeStart && rangeEnd && iso > rangeStart && iso < rangeEnd)
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
