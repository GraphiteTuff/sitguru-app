import Link from "next/link";
import AskScoutButton from "@/components/guru/AskScoutButton";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  GraduationCap,
  HelpCircle,
  MapPin,
  Megaphone,
  MessageCircle,
  PawPrint,
  ShieldCheck,
  Star,
  UserRound,
} from "lucide-react";

export type GuruVisitCard = {
  id: string;
  petName: string;
  petPhotoUrl?: string;
  service: string;
  when: string;
  place: string;
  detailHref: string;
  reportHref: string;
};

type GuruWorkspaceHomeProps = {
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
  activePawReports: number;
  activePawReportHref: string | null;
  payoutNeedsAttention: boolean;
};

function Portrait({
  src,
  name,
  large = false,
}: {
  src?: string;
  name: string;
  large?: boolean;
}) {
  const initials = (name || "Guru").trim().slice(0, 1).toUpperCase();
  return (
    <span
      className={
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden border border-emerald-100 bg-emerald-50 font-black text-emerald-800 " +
        (large ? "h-24 w-24 rounded-3xl sm:h-28 sm:w-28" : "h-24 w-24 rounded-2xl")
      }
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={name + " profile photo"} className="h-full w-full object-cover object-center" loading="lazy" />
      ) : (
        <>
          <PawPrint className={large ? "h-10 w-10" : "h-9 w-9"} aria-hidden="true" />
          <span className="sr-only">Photo unavailable for {name || initials}</span>
        </>
      )}
    </span>
  );
}

function QuickAction({
  href,
  title,
  helper,
  icon: Icon,
}: {
  href: string;
  title: string;
  helper: string;
  icon: typeof CalendarDays;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-[128px] min-w-0 flex-col justify-center gap-2 rounded-[1.3rem] border border-emerald-100 bg-white p-3.5 shadow-[0_10px_32px_rgba(15,23,42,0.05)] transition hover:border-emerald-300 hover:bg-[#FAFFFC] hover:shadow-md focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-400 sm:min-h-[112px] sm:p-4"
    >
      <span className="flex flex-col items-start gap-2.5 sm:flex-row sm:items-center">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#E8F8EF] text-[#0D5C3A]">
          <Icon className="h-6 w-6" aria-hidden="true" />
        </span>
        <span className="min-w-0 text-[15px] font-black leading-tight text-slate-950 sm:text-base">{title}</span>
      </span>
      <span className="text-xs font-semibold leading-5 text-slate-600">{helper}</span>
    </Link>
  );
}

function StatChip({
  href,
  label,
  value,
}: {
  href: string;
  label: string;
  value: string;
}) {
  return (
    <Link
      href={href}
      className="flex min-h-[72px] items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm transition hover:border-emerald-300 focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-400"
    >
      <span className="min-w-0">
        <span className="block text-xs font-bold text-slate-600">{label}</span>
        <span className="mt-0.5 block text-2xl font-black leading-none text-slate-950">{value}</span>
      </span>
      <ChevronRight className="h-5 w-5 shrink-0 text-emerald-700" aria-hidden="true" />
    </Link>
  );
}

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
  activePawReports,
  activePawReportHref,
  payoutNeedsAttention,
}: GuruWorkspaceHomeProps) {
  const name = firstName && firstName.toLowerCase() !== "there" ? firstName : "Guru";
  const isProfileReady = profilePercent >= 100;

  const action =
    activePawReports > 0 && activePawReportHref
      ? {
          eyebrow: "CARE IN PROGRESS",
          title: "Continue PawReport Live",
          detail: activePawReports === 1 ? "Your active care visit is ready to update." : String(activePawReports) + " care visits are currently in progress.",
          label: "Continue PawReport",
          href: activePawReportHref,
          icon: PawPrint,
        }
      : requests.length > 0
        ? {
            eyebrow: "NEW CARE REQUEST",
            title: "A Pet Parent needs you",
            detail: requests.length === 1 ? "You have 1 new request to review." : "You have " + requests.length + " new requests to review.",
            label: "Review Care Request",
            href: requests[0].detailHref,
            icon: CalendarDays,
          }
        : upcoming.length > 0
          ? {
              eyebrow: "NEXT UP",
              title: "Get ready for your next visit",
              detail: upcoming[0].petName + " · " + upcoming[0].service + " · " + upcoming[0].when,
              label: "View Booking Details",
              href: upcoming[0].detailHref,
              icon: Clock3,
            }
          : payoutNeedsAttention
            ? {
                eyebrow: "PAYOUT SETUP",
                title: "Finish setting up your payouts",
                detail: "Your payout account needs attention before paid bookings can be completed smoothly.",
                label: "Review Payout Setup",
                href: "/guru/dashboard/earnings",
                icon: CircleDollarSign,
              }
            : !isProfileReady || !acceptingBookings
              ? {
                  eyebrow: "GROW YOUR BUSINESS",
                  title: acceptingBookings ? "Make your Guru profile shine" : "Get ready to accept bookings",
                  detail: acceptingBookings ? "A complete profile helps Pet Parents get to know you." : "Check your profile, service area and readiness steps.",
                  label: "Complete My Profile",
                  href: "/guru/dashboard/profile",
                  icon: UserRound,
                }
              : {
                  eyebrow: "READY FOR YOUR NEXT BOOKING",
                  title: "Keep your calendar up to date",
                  detail: "Stay discoverable to nearby Pet Parents and make your next booking easier.",
                  label: "Manage Availability",
                  href: "/guru/dashboard/availability",
                  icon: CalendarDays,
                };
  const PrimaryIcon = action.icon;

  return (
    <div className="min-w-0 space-y-4">
      <section
        data-brand-green="true"
        className="overflow-hidden rounded-[1.9rem] border border-emerald-800/15 bg-[linear-gradient(125deg,#06462F_0%,#08734A_62%,#0C8756_100%)] p-5 shadow-[0_16px_38px_rgba(8,90,57,0.13)] sm:p-7"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <span className="shrink-0 rounded-[1.7rem] border-2 border-white/40 bg-white p-1 shadow-lg">
              <Portrait src={photoUrl} name={name} large />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.18em] !text-[#F7E7B0]">YOUR SITGURU GURU HOME</p>
              <h1 className="mt-1 text-[clamp(1.65rem,4.5vw,2.7rem)] font-black leading-tight tracking-tight !text-white">
                Welcome Back, {name}!
              </h1>
              <p className="mt-1 text-sm font-semibold leading-6 !text-[#EAF7EF]">
                Your pet care business at a glance.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/15 px-4 text-sm font-bold !text-white">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
              {acceptingBookings ? "Accepting bookings" : "Setup in progress"}
            </span>
            {location ? (
              <span className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 text-xs font-bold !text-[#EAF7EF]">
                <MapPin className="h-4 w-4 shrink-0" aria-hidden />{location}
              </span>
            ) : null}
          </div>
        </div>
      </section>

      <nav aria-label="Jump to Guru workspaces" className="grid grid-cols-2 gap-3">
        <Link href="#guru-connect-care" className="flex min-h-[76px] items-center justify-between gap-2 rounded-[1.3rem] border-2 border-emerald-200 bg-white px-3 py-3 font-black text-emerald-950 shadow-sm transition hover:border-emerald-600 hover:bg-emerald-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-emerald-400 sm:px-5">
          <span className="flex min-w-0 items-center gap-2"><PawPrint className="h-6 w-6 shrink-0 text-emerald-700" aria-hidden="true" /><span className="text-sm leading-tight sm:text-base">Connect &amp; Care</span></span>
          <ChevronRight className="hidden h-5 w-5 shrink-0 text-emerald-700 sm:block" aria-hidden="true" />
        </Link>
        <Link href="#guru-promote-grow" className="flex min-h-[76px] items-center justify-between gap-2 rounded-[1.3rem] border-2 border-orange-200 bg-white px-3 py-3 font-black text-emerald-950 shadow-sm transition hover:border-orange-500 hover:bg-orange-50 focus-visible:outline focus-visible:outline-4 focus-visible:outline-orange-400 sm:px-5">
          <span className="flex min-w-0 items-center gap-2"><Megaphone className="h-6 w-6 shrink-0 text-[#A74400]" aria-hidden="true" /><span className="text-sm leading-tight sm:text-base">Promote &amp; Grow</span></span>
          <ChevronRight className="hidden h-5 w-5 shrink-0 text-[#A74400] sm:block" aria-hidden="true" />
        </Link>
      </nav>

      <section aria-labelledby="guru-priority-heading" className="rounded-[1.9rem] border border-emerald-100 bg-white p-4 shadow-[0_16px_42px_rgba(15,23,42,0.07)] sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p id="guru-priority-heading" className="text-xs font-black uppercase tracking-[0.16em] text-[#0D5C3A]">WHAT NEEDS YOUR ATTENTION</p>
          <span className="rounded-full bg-orange-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-orange-800">{action.eyebrow}</span>
        </div>
        <div className="mt-3 flex items-start gap-3 sm:gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-800 sm:h-16 sm:w-16">
            <PrimaryIcon className="h-8 w-8" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-[clamp(1.35rem,3vw,2rem)] font-black leading-tight tracking-tight !text-slate-950">{action.title}</h2>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{action.detail}</p>
          </div>
        </div>
        <Link href={action.href} className="mt-5 inline-flex min-h-[60px] w-full items-center justify-center gap-2 rounded-[1.15rem] bg-[#C54D00] px-5 py-3 text-center text-base font-black !text-white shadow-lg shadow-orange-600/15 transition hover:bg-[#A74400] active:scale-[0.99] focus-visible:outline focus-visible:outline-4 focus-visible:outline-orange-300 sm:max-w-[370px]">
          {action.label}<ArrowRight className="h-5 w-5 shrink-0" aria-hidden="true" />
        </Link>
      </section>

      <section id="guru-connect-care" aria-label="Connect and Care" className="space-y-4 scroll-mt-28">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#0D5C3A]">CONNECT &amp; CARE</p>
          <h2 className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">Manage your day</h2>
        </div>
        <nav aria-label="Guru daily actions" className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          <QuickAction href="/guru/dashboard/bookings" title="Bookings" helper="Requests and upcoming care" icon={CalendarDays} />
          <QuickAction href="/guru/dashboard/availability" title="My Schedule" helper="Availability and time off" icon={Clock3} />
          <QuickAction href="/guru/dashboard/messages" title="Messages" helper={messageCount === 1 ? "1 Pet Parent conversation" : String(messageCount) + " conversations"} icon={MessageCircle} />
          <QuickAction href="/guru/dashboard/earnings" title="Earnings" helper="Payments and payouts" icon={CircleDollarSign} />
          <QuickAction href="/guru/dashboard/profile" title="My Profile" helper="Photos, bio and services" icon={UserRound} />
          <QuickAction href="/guru/dashboard/promote" title="Share Profile" helper="Reach nearby Pet Parents" icon={Megaphone} />
        </nav>

      <section aria-label="Guru activity summary" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatChip href="/guru/dashboard/bookings" label="New requests" value={String(requests.length)} />
        <StatChip href="/guru/dashboard/messages" label="Unread messages" value={unreadCount === null ? "—" : String(unreadCount)} />
        <StatChip href="/guru/dashboard/bookings" label="Upcoming visits" value={String(upcoming.length)} />
        <StatChip href="/guru/dashboard/profile" label="Profile complete" value={String(profilePercent) + "%"} />
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="min-w-0 rounded-[1.9rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">NEW OPPORTUNITIES</p>
              <h2 className="mt-1 text-xl font-black !text-slate-950 sm:text-2xl">Booking requests</h2>
            </div>
            <Link href="/guru/dashboard/bookings" className="inline-flex min-h-12 items-center gap-1 rounded-full px-3 text-sm font-black text-[#0D5C3A] hover:bg-emerald-50">View all <ChevronRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          {requests.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-6">
              <p className="text-sm font-semibold leading-6 text-emerald-950">No new booking requests right now. Keep your calendar and public profile up to date.</p>
              <Link href="/guru/dashboard/promote" className="mt-3 inline-flex min-h-12 items-center gap-2 text-sm font-black text-[#0D5C3A]">Promote my profile <ArrowRight className="h-4 w-4" aria-hidden /></Link>
            </div>
          ) : (
            <ul className="mt-4 space-y-3">
              {requests.slice(0, 3).map((visit) => (
                <li key={visit.id} className="rounded-2xl border border-emerald-100 bg-[#F9FEFB] p-3.5">
                  <div className="flex items-center gap-3">
                    <Portrait src={visit.petPhotoUrl} name={visit.petName} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black leading-tight text-slate-950">{visit.petName}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{visit.service}</p>
                      <p className="mt-1 text-xs font-semibold leading-5 text-slate-500">{visit.when}{visit.place ? " · " + visit.place : ""}</p>
                    </div>
                  </div>
                  <Link href={visit.detailHref} className="mt-3 inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#0D5C3A] bg-white px-4 text-base font-black text-[#0D5C3A] hover:bg-emerald-50">Review Request <ChevronRight className="h-5 w-5" aria-hidden /></Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="min-w-0 rounded-[1.9rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">YOUR CARE CALENDAR</p>
              <h2 className="mt-1 text-xl font-black !text-slate-950 sm:text-2xl">Upcoming care</h2>
            </div>
            <Link href="/guru/dashboard/availability" className="inline-flex min-h-12 items-center gap-1 rounded-full px-3 text-sm font-black text-[#0D5C3A] hover:bg-emerald-50">Calendar <ChevronRight className="h-4 w-4" aria-hidden /></Link>
          </div>
          {upcoming.length === 0 ? (
            <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-6 text-sm font-semibold leading-6 text-emerald-950">No upcoming visits right now. Your availability helps Pet Parents find a time that works.</div>
          ) : (
            <ul className="mt-4 space-y-3">
              {upcoming.slice(0, 3).map((visit) => (
                <li key={visit.id} className="rounded-2xl border border-emerald-100 bg-[#F9FEFB] p-3.5">
                  <div className="flex items-center gap-3">
                    <Portrait src={visit.petPhotoUrl} name={visit.petName} />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-black text-slate-950">{visit.petName}</h3>
                      <p className="mt-1 text-sm font-semibold text-slate-700">{visit.service}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{visit.when}</p>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 min-[360px]:grid-cols-2">
                    <Link href={visit.detailHref} className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-emerald-700 bg-white px-2 text-center text-sm font-black text-emerald-900 hover:bg-emerald-50">View Booking</Link>
                    <Link href={visit.reportHref} className="inline-flex min-h-[56px] items-center justify-center gap-1 rounded-2xl bg-[#0D5C3A] px-2 text-center text-sm font-black !text-white hover:bg-emerald-800"><PawPrint className="h-4 w-4" aria-hidden /> PawReport</Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      </section>

      <section id="guru-promote-grow" aria-label="Promote and Grow" className="space-y-4 scroll-mt-28">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.15em] text-[#0D5C3A]">PROMOTE &amp; GROW</p>
          <h2 className="mt-1 text-xl font-black text-emerald-950 sm:text-2xl">Build your Guru business</h2>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-[1.9rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">GROW YOUR BUSINESS</p>
          <h2 className="mt-1 text-xl font-black !text-slate-950">Get more Pet Parent bookings</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Your public Guru profile is your SitGuru business card. Share it with nearby Pet Parents.</p>
          <div className="mt-4 flex items-center gap-3 rounded-2xl bg-emerald-50 p-3">
            <Portrait src={photoUrl} name={name} />
            <div className="min-w-0">
              <p className="font-black text-slate-950">{name}</p>
              <p className="text-sm font-semibold text-slate-600">{services.slice(0, 2).join(" · ") || "Pet Care Guru"}</p>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            <Link href="/guru/dashboard/promote" className="inline-flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-4 text-center text-sm font-black !text-white hover:bg-emerald-800"><Megaphone className="h-5 w-5" aria-hidden /> Promote My Profile</Link>
            <Link href={publicHref} className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border-2 border-emerald-700 bg-white px-4 text-center text-sm font-black text-emerald-900 hover:bg-emerald-50">View As Pet Parent</Link>
          </div>
        </section>
        <section className="rounded-[1.9rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs font-black uppercase tracking-[0.12em] text-emerald-700">HERE WHEN YOU NEED US</p>
          <h2 className="mt-1 text-xl font-black !text-slate-950">Your Guru companion</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Scout can guide you through your Guru tools, promotions, and profile setup. Scout cannot accept bookings or message clients for you.</p>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <AskScoutButton />
            <Link href="/guru/success-center" className="inline-flex min-h-[56px] items-center gap-2 rounded-2xl border-2 border-emerald-200 px-4 text-sm font-black text-emerald-900 hover:bg-emerald-50"><HelpCircle className="h-5 w-5" aria-hidden /> Guru Success Center</Link>
          </div>
        </section>
      </div>

      <details className="group rounded-[1.6rem] border border-emerald-100 bg-white p-4 shadow-sm sm:p-5">
        <summary className="flex min-h-[52px] cursor-pointer list-none items-center justify-between gap-3 text-base font-black text-slate-950 [&::-webkit-details-marker]:hidden">
          More Guru tools
          <ChevronRight className="h-5 w-5 shrink-0 text-emerald-800 transition-transform group-open:rotate-90" aria-hidden />
        </summary>
        <nav aria-label="More Guru tools" className="mt-3 grid gap-2 border-t border-emerald-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { label: "Pricing & Services", href: "/guru/dashboard/pricing", icon: CircleDollarSign },
            { label: "Reviews", href: "/guru/dashboard/reviews", icon: Star },
            { label: "Referrals", href: "/guru/dashboard/referrals", icon: Megaphone },
            { label: "Guru Academy", href: "/guru/dashboard/university", icon: GraduationCap },
            { label: "Trust & Safety", href: "/guru/dashboard/background-check", icon: ShieldCheck },
            { label: "Edit My Profile", href: "/guru/dashboard/profile", icon: UserRound },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} className="inline-flex min-h-[56px] items-center gap-3 rounded-2xl bg-emerald-50 px-4 text-sm font-black text-emerald-900 hover:bg-emerald-100">
                <Icon className="h-5 w-5" aria-hidden />{item.label}
              </Link>
            );
          })}
        </nav>
      </details>
      </section>
    </div>
  );
}
