import Link from "next/link";
import AskScoutButton from "@/components/guru/AskScoutButton";
import {
  CalendarDays,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  HelpCircle,
  Home,
  Megaphone,
  MessageCircle,
  PawPrint,
  Star,
  UserRound,
} from "lucide-react";

export type GuruVisitCard = {
  id: string;
  petName: string;
  service: string;
  when: string;
  place: string;
  detailHref: string;
  reportHref: string;
};

const RAIL = [
  { href: "/guru/dashboard", label: "Home", icon: Home },
  { href: "/guru/dashboard/bookings", label: "Bookings", icon: CalendarDays },
  { href: "/guru/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/guru/dashboard/availability", label: "Availability", icon: Clock3 },
  { href: "/guru/dashboard/profile", label: "My profile", icon: UserRound },
  { href: "/guru/dashboard/promote", label: "Promote", icon: Megaphone },
  { href: "/guru/dashboard/bookings", label: "PawReports", icon: PawPrint },
  { href: "/guru/dashboard/reviews", label: "Reviews", icon: Star },
  { href: "/guru/dashboard/earnings", label: "Earnings", icon: CircleDollarSign },
  { href: "/guru/dashboard/university", label: "Guru Academy", icon: GraduationCap },
  { href: "/guru/success-center", label: "Help & Support", icon: HelpCircle },
] as const;

export default function GuruWorkspaceHome({
  firstName,
  photoUrl,
  location,
  acceptingBookings,
  requests,
  upcoming,
  messageCount,
  unreadCount,
  profilePercent,
  services,
  publicHref,
}: {
  firstName: string;
  photoUrl: string;
  location: string;
  acceptingBookings: boolean;
  requests: GuruVisitCard[];
  upcoming: GuruVisitCard[];
  messageCount: number;
  unreadCount: number | null;
  profilePercent: number;
  services: string[];
  publicHref: string;
}) {
  const hour = Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      hour: "numeric",
      hourCycle: "h23",
    }).format(new Date()),
  );
  const hello = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const name = firstName && firstName.toLowerCase() !== "there" ? firstName : "there";

  return (
    <div className="grid gap-4 lg:grid-cols-[13.5rem_minmax(0,1fr)]">
      <aside className="hidden lg:block">
        <nav aria-label="Guru workspace" className="sticky top-24 space-y-1 rounded-3xl border border-emerald-100 bg-white p-3 shadow-sm">
          {RAIL.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-bold text-slate-600 hover:bg-emerald-50 hover:text-[#0D5C3A]">
                <Icon className="h-4 w-4" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="min-w-0 space-y-4">
        <section className="overflow-hidden rounded-[2rem] border border-emerald-100 bg-[linear-gradient(90deg,#f3fbf6,#ffffff_55%,#e7f6ee)] p-5 shadow-sm sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Face src={photoUrl} name={name} className="h-16 w-16 rounded-full sm:h-20 sm:w-20" />
              <div>
                <h1 className="text-3xl font-black tracking-tight text-slate-950">{hello}, {name}!</h1>
                <p className="mt-1 text-sm font-semibold text-slate-600">Connect with Pet Parents. Grow your care business.</p>
                <p className="mt-2 text-sm font-bold text-[#0D5C3A]">
                  {acceptingBookings ? "Accepting bookings" : "Setup in progress"}
                  {location ? ` · ${location}` : ""}
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          <Stat href="/guru/dashboard/bookings" label="New requests" value={String(requests.length)} detail="Need a response" />
          <Stat href="/guru/dashboard/messages" label="Unread messages" value={unreadCount === null ? "—" : String(unreadCount)} detail={messageCount === 1 ? "1 open thread" : `${messageCount} open threads`} />
          <Stat href="/guru/dashboard/bookings" label="Upcoming visits" value={String(upcoming.length)} detail="On your calendar" />
          <Stat href="/guru/dashboard/profile" label="Profile ready" value={`${profilePercent}%`} detail="Visible to Pet Parents" />
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(16rem,0.8fr)]">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-black text-slate-950">Pet Parents need you</h2>
              <Link href="/guru/dashboard/bookings" className="text-sm font-bold text-[#0D5C3A]">View all</Link>
            </div>
            {requests.length === 0 ? (
              <p className="mt-4 rounded-2xl bg-emerald-50 px-4 py-5 text-sm font-semibold text-slate-600">No new requests right now. Your public profile is how Pet Parents find you.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {requests.slice(0, 4).map((visit) => (
                  <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                    <div className="flex items-center gap-3">
                      <Face src="" name={visit.petName} className="h-14 w-14 rounded-2xl" />
                      <div>
                        <p className="font-black text-slate-950">{visit.petName}</p>
                        <p className="text-sm font-semibold text-slate-500">{visit.service}</p>
                        <p className="text-xs font-semibold text-slate-400">{visit.when}{visit.place ? ` · ${visit.place}` : ""}</p>
                      </div>
                    </div>
                    <Link href={visit.detailHref} className="inline-flex min-h-10 items-center rounded-full border border-emerald-200 px-3 text-sm font-bold text-[#0D5C3A]">Review request</Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-black text-slate-950">Promote your care</h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">Share your public profile so nearby Pet Parents can book you.</p>
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
              <Face src={photoUrl} name={name} className="h-16 w-16 rounded-2xl" />
              <p className="text-sm font-bold text-slate-700">Your SitGuru profile is the flyer. Bookings stay on SitGuru.</p>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              <Link href="/guru/dashboard/promote" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">Promote my profile</Link>
              <Link href={publicHref} className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 px-4 text-sm font-bold text-[#0D5C3A]">View public profile</Link>
            </div>
          </section>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-slate-950">Upcoming care</h2>
              <Link href="/guru/dashboard/availability" className="text-sm font-bold text-[#0D5C3A]">Availability</Link>
            </div>
            {upcoming.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-slate-500">No upcoming visits yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {upcoming.slice(0, 3).map((visit) => (
                  <li key={visit.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-100 p-3">
                    <div>
                      <p className="font-black text-slate-950">{visit.petName}</p>
                      <p className="text-sm text-slate-500">{visit.service} · {visit.when}</p>
                    </div>
                    <div className="flex gap-2">
                      <Link href={visit.detailHref} className="text-sm font-bold text-[#0D5C3A]">View details</Link>
                      <Link href={visit.reportHref} className="text-sm font-bold text-slate-500">PawReport</Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="text-lg font-black text-slate-950">Your public profile</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {services.length ? services.slice(0, 6).map((service) => (
                <span key={service} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-[#0D5C3A]">{service}</span>
              )) : (
                <span className="text-sm font-semibold text-slate-500">Add services so Pet Parents know what you offer.</span>
              )}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href={publicHref} className="inline-flex min-h-11 items-center rounded-full border border-emerald-200 px-4 text-sm font-bold text-[#0D5C3A]">View as Pet Parent</Link>
              <Link href="/guru/dashboard/profile" className="inline-flex min-h-11 items-center rounded-full bg-[#0D5C3A] px-4 text-sm font-bold !text-white">Edit profile</Link>
              <Link href="/guru/dashboard/reviews" className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-4 text-sm font-bold text-slate-700">Reviews</Link>
            </div>
          </section>
        </div>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-slate-950">Scout</h2>
              <p className="text-sm font-semibold text-slate-500">Your Guru business companion. Scout does not accept bookings or send messages for you.</p>
            </div>
            <AskScoutButton />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/?chat=rogue#ai-companions" className="rounded-2xl border border-slate-100 px-3 py-3 text-sm font-bold text-slate-700">Rogue · Pet Parent guidance</Link>
            <Link href="/ambassadors?chat=taco" className="rounded-2xl border border-slate-100 px-3 py-3 text-sm font-bold text-slate-700">Taco · Community growth</Link>
            <Link href="/events?chat=delilah" className="rounded-2xl border border-slate-100 px-3 py-3 text-sm font-bold text-slate-700">Delilah · Pet events</Link>
            <Link href="/guru/success-center" className="rounded-2xl border border-slate-100 px-3 py-3 text-sm font-bold text-slate-700">Help & Support</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

function Face({ src, name, className }: { src: string; name: string; className: string }) {
  const initial = (name || "G").trim().slice(0, 1).toUpperCase();
  return (
    <span className={`relative inline-flex shrink-0 items-center justify-center overflow-hidden bg-white text-lg font-black text-[#0D5C3A] ring-1 ring-emerald-100 ${className}`}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="absolute inset-0 h-full w-full object-cover object-center" />
      ) : (
        <PawPrint className="h-6 w-6" aria-hidden />
      )}
      {!src ? <span className="sr-only">{initial}</span> : null}
    </span>
  );
}

function Stat({ href, label, value, detail }: { href: string; label: string; value: string; detail: string }) {
  return (
    <Link href={href} className="rounded-3xl bg-white p-4 shadow-sm ring-1 ring-emerald-100">
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-black text-slate-950">{value}</p>
      <p className="mt-1 text-xs font-bold text-[#0D5C3A]">{detail}</p>
    </Link>
  );
}
