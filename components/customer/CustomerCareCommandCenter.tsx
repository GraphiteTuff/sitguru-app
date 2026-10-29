"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CreditCard,
  Gift,
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

const QUICK_SERVICES = [
  "Dog Walking",
  "Drop-In Visits",
  "Pet Sitting",
  "Boarding",
  "Training Support",
] as const;

const RAIL = [
  { href: "/customer/dashboard", label: "Dashboard", icon: Home, exact: true },
  { href: "/search", label: "Find a Guru", icon: Search },
  { href: "/customer/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/customer/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/customer/dashboard#multi-pet-center", label: "My Pets", icon: PawPrint },
  { href: "/customer/dashboard/pawperks", label: "PawPerks", icon: Gift },
  { href: "/customer/dashboard/payments", label: "Payments", icon: CreditCard },
  { href: "/customer/dashboard/profile", label: "Profile", icon: UserRound },
  { href: "/help", label: "Help", icon: HelpCircle },
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
};

export type CommandGuru = {
  id: string;
  name: string;
  photo: string;
  services: string;
  rating: number | null;
  reviews: number;
  distance: string;
  profileHref: string;
  bookHref: string;
};

export type CommandUpdate = {
  label: string;
  detail: string;
  href: string;
};

type CommandCenterProps = {
  firstName: string;
  upcomingCount: number;
  pawPerksLabel: string;
  visit: CommandVisit | null;
  pets: CommandPet[];
  gurus: CommandGuru[];
  updates: CommandUpdate[];
  careZip: string;
  careLocationLabel: string;
  guruMessage: string;
  loadingGurus: boolean;
  onZipReady: (zip: string) => void;
};

function firstToken(value: string, fallback: string) {
  const token = value.trim().split(/\s+/)[0];
  return token || fallback;
}

function readPlace(value: string) {
  const zip = value.match(/\b(\d{5})(?:-\d{4})?\b/);
  const city = value.replace(/\b\d{5}(?:-\d{4})?\b/g, " ").replace(/\s+/g, " ").trim();
  return { zip: zip?.[1] || "", city };
}

function Face({
  src,
  name,
  className,
}: {
  src: string;
  name: string;
  className: string;
}) {
  const initial = firstToken(name, "?").slice(0, 1).toUpperCase();
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-white ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      ) : (
        <span className="text-sm font-black text-[#0D5C3A]">{initial}</span>
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
          const active = "exact" in item && item.exact
            ? pathname === item.href
            : pathname === item.href;
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
  updates,
  careZip,
  careLocationLabel,
  guruMessage,
  loadingGurus,
  onZipReady,
}: CommandCenterProps) {
  const router = useRouter();
  const [service, setService] = useState<string>(QUICK_SERVICES[0]);
  const [place, setPlace] = useState(careZip);
  const [date, setDate] = useState("");
  const [unread, setUnread] = useState<number | null>(null);
  const requestedZip = useRef("");
  const onZipReadyRef = useRef(onZipReady);
  onZipReadyRef.current = onZipReady;
  const greeting = firstName && firstName.toLowerCase() !== "there" ? firstName : "";
  const welcomePets = pets.filter((pet) => pet.photo).slice(0, 2);

  useEffect(() => {
    if (!place && careZip) setPlace(careZip);
  }, [careZip, place]);

  useEffect(() => {
    const parsed = readPlace(place);
    if (parsed.zip.length !== 5 || parsed.zip === careZip) return;
    const timer = window.setTimeout(() => {
      if (requestedZip.current === parsed.zip) return;
      requestedZip.current = parsed.zip;
      onZipReadyRef.current(parsed.zip);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [place, careZip]);

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;
      const { data: conversations, error } = await supabase
        .from("conversations")
        .select("id,last_message_at")
        .or(`customer_id.eq.${userId},guru_id.eq.${userId}`)
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

  function findCare(event: FormEvent) {
    event.preventDefault();
    const parsed = readPlace(place);
    const params = new URLSearchParams();
    if (service) params.set("service", service);
    if (parsed.zip) params.set("zip", parsed.zip);
    else if (parsed.city) params.set("city", parsed.city);
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) params.set("date", date);
    router.push(`/search?${params.toString()}`);
  }

  function withCare(href: string) {
    try {
      const url = new URL(href, "https://www.sitguru.com");
      const parsed = readPlace(place);
      if (service) url.searchParams.set("service", service);
      if (parsed.zip) url.searchParams.set("zip", parsed.zip);
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) url.searchParams.set("date", date);
      return `${url.pathname}${url.search}`;
    } catch {
      return href;
    }
  }

  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {greeting ? `Welcome home, ${greeting}!` : "Welcome home!"}
            </h1>
            <p className="mt-1 text-sm font-medium text-slate-500">
              Everything your pets need, in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {welcomePets.map((pet) => (
              <Face key={pet.id} src={pet.photo} name={pet.name} className="h-16 w-16 rounded-2xl ring-1 ring-emerald-100" />
            ))}
            <a href="#book-care" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#0D5C3A] px-5 text-sm font-bold !text-white">
              <PawPrint className="h-4 w-4" aria-hidden />
              Find a Guru
            </a>
          </div>
        </div>

        <form id="book-care" onSubmit={findCare} className="grid gap-3 border-t border-emerald-50 p-4 sm:p-5 lg:grid-cols-[1.2fr_1fr_0.8fr_auto]">
          <fieldset className="min-w-0">
            <legend className="text-xs font-black uppercase tracking-[0.14em] text-slate-500">1. Choose a service</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_SERVICES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setService(option)}
                  className={service === option
                    ? "min-h-10 rounded-2xl bg-[#0D5C3A] px-3 text-sm font-bold !text-white"
                    : "min-h-10 rounded-2xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-600"}
                >
                  {option === "Training Support" ? "Training" : option}
                </button>
              ))}
            </div>
            <label className="mt-2 block text-xs font-semibold text-slate-500">
              More services
              <select
                value={(SEARCH_SERVICE_OPTIONS as readonly string[]).includes(service) ? service : SEARCH_SERVICE_OPTIONS[0]}
                onChange={(event) => setService(event.target.value)}
                className="mt-1 min-h-11 w-full rounded-2xl border border-slate-200 px-3 text-sm font-semibold text-slate-800"
              >
                {SEARCH_SERVICE_OPTIONS.map((option) => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </label>
          </fieldset>
          <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            2. Location
            <span className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 px-3 normal-case tracking-normal">
              <MapPin className="h-4 w-4 text-[#0D5C3A]" aria-hidden />
              <input
                value={place}
                onChange={(event) => setPlace(event.target.value)}
                placeholder="Address or ZIP code"
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </span>
            {careLocationLabel ? <span className="mt-1 block text-[11px] font-semibold normal-case tracking-normal text-slate-400">{careLocationLabel}</span> : null}
          </label>
          <label className="block text-xs font-black uppercase tracking-[0.14em] text-slate-500">
            3. Date
            <span className="mt-2 flex min-h-12 items-center gap-2 rounded-2xl border border-slate-200 px-3">
              <CalendarDays className="h-4 w-4 text-[#0D5C3A]" aria-hidden />
              <input
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none"
              />
            </span>
          </label>
          <button type="submit" className="inline-flex min-h-12 w-full items-center justify-center gap-2 self-end rounded-2xl bg-[#0D5C3A] px-4 text-sm font-bold !text-white lg:w-auto" aria-label="Find available Gurus">
            <Search className="h-5 w-5" />
            Find Gurus
          </button>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Stat href="/customer/dashboard/bookings" tint="bg-emerald-50" label="Upcoming bookings" value={String(upcomingCount)} detail="View all bookings" />
        <Stat href="/customer/dashboard/messages" tint="bg-sky-50" label="Messages" value={unread === null ? "—" : String(unread)} detail="View messages" />
        <Stat href="/customer/dashboard#multi-pet-center" tint="bg-violet-50" label="My pets" value={String(pets.length)} detail="Manage pets" />
        <Stat href="/customer/dashboard/pawperks" tint="bg-amber-50" label="PawPerks" value={pawPerksLabel} detail="Explore rewards" />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Upcoming pet care</h2>
            <Link href="/customer/dashboard/bookings" className="text-sm font-bold text-[#0D5C3A]">View all</Link>
          </div>
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
                <Face src={visit.guruPhoto} name={visit.guruName} className="h-8 w-8 rounded-full ring-1 ring-slate-100" />
                {visit.guruName}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={visit.detailHref} className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">View booking</Link>
                <Link href="/messages?role=customer&returnTo=/customer/dashboard" className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 px-4 text-sm font-bold text-[#0D5C3A]">Message Guru</Link>
              </div>
            </article>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-emerald-200 bg-emerald-50/50 p-6 text-center">
              <p className="font-black text-slate-950">No visit scheduled yet</p>
              <p className="mt-1 text-sm text-slate-500">Choose a service above to find a Guru.</p>
            </div>
          )}
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">My pets</h2>
            <Link href="/customer/dashboard#multi-pet-center" className="text-sm font-bold text-[#0D5C3A]">View all</Link>
          </div>
          {pets.length ? (
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {pets.slice(0, 3).map((pet) => (
                <li key={pet.id} className="rounded-3xl border border-slate-100 p-3 text-center">
                  <Face src={pet.photo} name={pet.name} className="mx-auto h-16 w-16 rounded-full" />
                  <p className="mt-2 font-black text-slate-950">{pet.name}</p>
                  <p className="text-xs font-semibold text-slate-500">{pet.detail}</p>
                </li>
              ))}
              <li>
                <Link href="/customer/dashboard#new-pet-passport" className="flex h-full min-h-32 flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 text-sm font-bold text-[#0D5C3A]">
                  <Plus className="mb-1 h-5 w-5" />
                  Add pet
                </Link>
              </li>
            </ul>
          ) : (
            <Link href="/customer/dashboard#new-pet-passport" className="mt-4 flex min-h-32 flex-col items-center justify-center rounded-3xl border border-dashed border-emerald-200 text-sm font-bold text-[#0D5C3A]">
              <Plus className="mb-1 h-5 w-5" />
              Add your first pet
            </Link>
          )}
        </section>
      </div>

      <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-black text-slate-950">Recommended Gurus near you</h2>
          <Link href={careZip ? `/search?zip=${careZip}` : "/search"} className="text-sm font-bold text-[#0D5C3A]">View all</Link>
        </div>
        {loadingGurus ? <p className="mt-4 text-sm font-semibold text-slate-500">Looking for Gurus near you.</p> : null}
        {!loadingGurus && gurus.length === 0 ? (
          <p className="mt-4 text-sm font-semibold text-slate-500">{guruMessage || "Add a ZIP code to see Gurus who cover your area."}</p>
        ) : (
          <ul className="mt-4 grid gap-3 md:grid-cols-3">
            {gurus.map((guru) => (
              <li key={guru.id} className="rounded-3xl border border-slate-100 p-4">
                <div className="flex items-center gap-3">
                  <Face src={guru.photo} name={guru.name} className="h-12 w-12 rounded-full ring-1 ring-slate-100" />
                  <div>
                    <p className="font-black text-slate-950">{guru.name}</p>
                    <p className="text-xs font-semibold text-slate-500">{guru.services}</p>
                  </div>
                </div>
                <p className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-600">
                  {guru.rating !== null ? (
                    <>
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" aria-hidden />
                      {guru.rating.toFixed(1)} ({guru.reviews})
                    </>
                  ) : (
                    "New on SitGuru"
                  )}
                  <span className="text-slate-400">· {guru.distance}</span>
                </p>
                <div className="mt-3 flex gap-2">
                  <Link href={guru.profileHref} className="text-sm font-bold text-[#0D5C3A]">View profile</Link>
                  <Link href={withCare(guru.bookHref)} className="text-sm font-bold text-slate-500">Book</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">PawReport Live</h2>
            {visit ? <Link href={visit.reportHref} className="text-sm font-bold text-[#0D5C3A]">View all</Link> : null}
          </div>
          <ul className="mt-4 space-y-3">
            {updates.length ? updates.map((update) => (
              <li key={`${update.label}-${update.detail}`}>
                <Link href={update.href} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                  <Face src={pets[0]?.photo || ""} name={pets[0]?.name || "Pet"} className="h-10 w-10 rounded-full" />
                  <span>
                    <span className="block text-sm font-black text-slate-950">{update.label}</span>
                    <span className="block text-xs font-semibold text-slate-500">{update.detail}</span>
                  </span>
                </Link>
              </li>
            )) : (
              <li className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">Care updates show up here during a visit.</li>
            )}
          </ul>
        </section>
        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="text-lg font-black text-slate-950">Quick links</h2>
          <ul className="mt-3 space-y-2 text-sm font-bold text-slate-700">
            <li><Link href="/customer/dashboard/payments" className="flex min-h-11 items-center">Payments</Link></li>
            <li><Link href="/customer/dashboard/profile/saved-gurus" className="flex min-h-11 items-center">Saved Gurus</Link></li>
            <li><Link href="/customer/dashboard/pawperks" className="flex min-h-11 items-center">Invite friends</Link></li>
            <li><Link href="/help" className="flex min-h-11 items-center">Support</Link></li>
          </ul>
        </section>
      </div>
    </div>
  );
}

function Stat({
  href,
  tint,
  label,
  value,
  detail,
}: {
  href: string;
  tint: string;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Link href={href} className={`rounded-3xl p-4 shadow-sm ring-1 ring-black/5 ${tint}`}>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-2 text-xs font-bold text-[#0D5C3A]">{detail}</p>
    </Link>
  );
}
