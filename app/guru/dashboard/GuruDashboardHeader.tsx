import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  BookOpen,
  CalendarDays,
  LayoutDashboard,
  MessageCircle,
  UserCircle,
  Wallet,
} from "lucide-react";

type GuruProfileForHeader = {
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  photo_url?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type ActiveGuruTab =
  | "dashboard"
  | "bookings"
  | "messages"
  | "profile"
  | "availability"
  | "earnings";

type GuruDashboardHeaderProps = {
  guruProfile?: GuruProfileForHeader | null;
  activeTab: ActiveGuruTab;
};

const navItems = [
  {
    label: "Dashboard",
    href: "/guru/dashboard",
    tab: "dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Bookings",
    href: "/guru/dashboard/bookings",
    tab: "bookings",
    icon: CalendarDays,
  },
  {
    label: "Messages",
    href: "/guru/dashboard/messages",
    tab: "messages",
    icon: MessageCircle,
  },
  {
    label: "My Profile",
    href: "/guru/dashboard/profile",
    tab: "profile",
    icon: UserCircle,
  },
  {
    label: "Availability",
    href: "/guru/dashboard/availability",
    tab: "availability",
    icon: CalendarDays,
  },
  {
    label: "Earnings",
    href: "/guru/dashboard/earnings",
    tab: "earnings",
    icon: Wallet,
  },
] as const;

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getGuruName(guruProfile?: GuruProfileForHeader | null) {
  return (
    asText(guruProfile?.display_name) ||
    asText(guruProfile?.full_name) ||
    asText(guruProfile?.name) ||
    "Guru"
  );
}

function getGuruPhoto(guruProfile?: GuruProfileForHeader | null) {
  return (
    asText(guruProfile?.profile_photo_url) ||
    asText(guruProfile?.photo_url) ||
    asText(guruProfile?.avatar_url) ||
    asText(guruProfile?.image_url) ||
    ""
  );
}

export default function GuruDashboardHeader({
  guruProfile,
  activeTab,
}: GuruDashboardHeaderProps) {
  const guruName = getGuruName(guruProfile);
  const guruPhoto = getGuruPhoto(guruProfile);

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white shadow-sm">
      <div className="mx-auto flex min-h-[88px] w-full max-w-[1720px] items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link
          href="/guru/dashboard"
          className="flex shrink-0 items-center"
          aria-label="SitGuru Guru Dashboard"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={164}
            height={64}
            priority
            className="h-auto w-[132px] object-contain sm:w-[156px]"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-2 xl:flex">
          {navItems.map((item) => {
            const isActive = activeTab === item.tab;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "group relative inline-flex min-h-[88px] items-center px-4 text-[16px] font-black tracking-[-0.01em] transition",
                  isActive
                    ? "!text-slate-950"
                    : "!text-slate-700 hover:!text-emerald-700",
                ].join(" ")}
              >
                {item.label}

                <span
                  className={[
                    "absolute inset-x-4 bottom-0 h-1 rounded-full bg-emerald-500 transition",
                    isActive
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-50",
                  ].join(" ")}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/guru/dashboard/resources"
            className="inline-flex min-h-[54px] items-center justify-center gap-3 rounded-full border border-slate-200 bg-white px-6 py-3 text-[16px] font-black !text-slate-900 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
          >
            <BookOpen className="h-5 w-5 !text-sky-500" />
            Guru Resources
          </Link>

          <Link
            href="/guru/dashboard/profile"
            className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-emerald-50 shadow-md ring-2 ring-emerald-200"
            aria-label={`${guruName} profile`}
          >
            {guruPhoto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={guruPhoto}
                alt={guruName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xl font-black !text-emerald-700">
                {guruName.charAt(0).toUpperCase()}
              </span>
            )}

            <span className="absolute right-0 top-0 h-4 w-4 rounded-full border-2 border-white bg-emerald-500" />
          </Link>

          <Link
            href="/guru/dashboard/messages"
            className="relative flex h-14 w-14 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-6 w-6 !text-slate-800" />
            <span className="absolute right-2 top-2 h-3 w-3 rounded-full border-2 border-white bg-emerald-500" />
          </Link>
        </div>

        <div className="flex items-center gap-2 xl:hidden">
          <Link
            href="/guru/dashboard"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black !text-slate-900 shadow-sm"
          >
            Dashboard
          </Link>

          <Link
            href="/guru/dashboard/earnings"
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-black !text-white shadow-sm"
          >
            Earnings
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white xl:hidden">
        <div className="mx-auto flex max-w-[1720px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.tab;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition",
                  isActive
                    ? "border-emerald-300 bg-emerald-50 !text-emerald-800"
                    : "border-slate-200 bg-white !text-slate-700 hover:bg-slate-50",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/guru/dashboard/resources"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black !text-slate-700 hover:bg-slate-50"
          >
            <BookOpen className="h-4 w-4" />
            Resources
          </Link>
        </div>
      </div>
    </header>
  );
}