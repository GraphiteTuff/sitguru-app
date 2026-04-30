// app/guru/dashboard/GuruDashboardHeader.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  UserCircle,
  Wallet,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type GuruProfileForHeader = {
  display_name?: string | null;
  full_name?: string | null;
  name?: string | null;
  email?: string | null;
  photo_url?: string | null;
  profile_photo_url?: string | null;
  avatar_url?: string | null;
  image_url?: string | null;
};

type LoadedHeaderProfile = {
  name: string;
  email: string;
  photoUrl: string;
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

  /**
   * Preferred prop going forward.
   */
  activeTab?: ActiveGuruTab;

  /**
   * Backward-compatible prop because some dashboard pages already pass active.
   */
  active?: ActiveGuruTab;

  /**
   * Backward-compatible props because app/guru/dashboard/page.tsx is currently
   * passing these into the header.
   */
  displayName?: string | null;
  imageUrl?: string | null;
  tierLabel?: string | null;
  profileCompletion?: number | null;
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

const guruAccountMenuLinks = [
  { label: "Dashboard", href: "/guru/dashboard" },
  { label: "Update Profile", href: "/guru/dashboard/profile" },
  { label: "Bookings", href: "/guru/dashboard/bookings" },
  { label: "Messages", href: "/guru/dashboard/messages" },
  { label: "Availability", href: "/guru/dashboard/availability" },
  { label: "Earnings", href: "/guru/dashboard/earnings" },
  { label: "Guru Resources", href: "/guru/dashboard/resources" },
];

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = asText(value);

    if (text) {
      return text;
    }
  }

  return "";
}

function getInitials(name: string, email?: string) {
  const value = (name || email || "Guru").replace(/@.*/, "");
  const parts = value.split(/[\s._-]+/).filter(Boolean);

  const first = parts[0]?.charAt(0) || "G";
  const second = parts[1]?.charAt(0) || "";

  return `${first}${second}`.toUpperCase();
}

function getNameFromProfile(profile?: GuruProfileForHeader | null) {
  return firstText(
    profile?.display_name,
    profile?.full_name,
    profile?.name,
    profile?.email,
    "Guru"
  );
}

function getPhotoFromProfile(profile?: GuruProfileForHeader | null) {
  return firstText(
    profile?.profile_photo_url,
    profile?.photo_url,
    profile?.avatar_url,
    profile?.image_url
  );
}

function isPathActive(pathname: string, href: string) {
  if (href === "/guru/dashboard") {
    return pathname === "/guru/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getTabFromPathname(pathname: string): ActiveGuruTab {
  if (pathname.startsWith("/guru/dashboard/bookings")) return "bookings";
  if (pathname.startsWith("/guru/dashboard/messages")) return "messages";
  if (pathname.startsWith("/guru/dashboard/profile")) return "profile";
  if (pathname.startsWith("/guru/dashboard/availability")) return "availability";
  if (pathname.startsWith("/guru/dashboard/earnings")) return "earnings";

  return "dashboard";
}

export default function GuruDashboardHeader({
  guruProfile,
  activeTab,
  active,
  displayName,
  imageUrl,
  tierLabel,
  profileCompletion,
}: GuruDashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();

  const resolvedActiveTab = activeTab || active || getTabFromPathname(pathname);

  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [photoFailed, setPhotoFailed] = useState(false);
  const [loadedProfile, setLoadedProfile] = useState<LoadedHeaderProfile>({
    name: firstText(displayName, getNameFromProfile(guruProfile), "Guru"),
    email: asText(guruProfile?.email),
    photoUrl: firstText(imageUrl, getPhotoFromProfile(guruProfile)),
  });

  const accountMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setLoadedProfile((current) => ({
      name:
        firstText(displayName, getNameFromProfile(guruProfile)) ||
        current.name ||
        "Guru",
      email: asText(guruProfile?.email) || current.email,
      photoUrl:
        firstText(imageUrl, getPhotoFromProfile(guruProfile)) ||
        current.photoUrl,
    }));
  }, [displayName, imageUrl, guruProfile]);

  useEffect(() => {
    let mounted = true;

    async function loadGuruHeaderProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted || !user) return;

      let profileName = firstText(displayName);
      let profileEmail = user.email || "";
      let profilePhoto = firstText(imageUrl);

      const { data: guruData } = await supabase
        .from("gurus")
        .select(
          "display_name,full_name,name,email,photo_url,profile_photo_url,avatar_url,image_url"
        )
        .eq("user_id", user.id)
        .maybeSingle();

      if (guruData) {
        const guru = guruData as GuruProfileForHeader;

        profileName = firstText(
          profileName,
          guru.display_name,
          guru.full_name,
          guru.name,
          guru.email
        );

        profileEmail = firstText(guru.email, profileEmail);

        profilePhoto = firstText(
          profilePhoto,
          guru.profile_photo_url,
          guru.photo_url,
          guru.avatar_url,
          guru.image_url
        );
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "display_name,full_name,name,email,photo_url,profile_photo_url,avatar_url,image_url"
        )
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        const profile = profileData as GuruProfileForHeader;

        profileName = firstText(
          profileName,
          profile.display_name,
          profile.full_name,
          profile.name,
          profile.email
        );

        profileEmail = firstText(profileEmail, profile.email);

        profilePhoto = firstText(
          profilePhoto,
          profile.profile_photo_url,
          profile.photo_url,
          profile.avatar_url,
          profile.image_url
        );
      }

      if (!mounted) return;

      setLoadedProfile({
        name: profileName || profileEmail || "Guru",
        email: profileEmail,
        photoUrl: profilePhoto,
      });
    }

    loadGuruHeaderProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadGuruHeaderProfile();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [displayName, imageUrl]);

  useEffect(() => {
    setPhotoFailed(false);
  }, [loadedProfile.photoUrl]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        accountMenuRef.current &&
        !accountMenuRef.current.contains(event.target as Node)
      ) {
        setAccountMenuOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAccountMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const guruName = loadedProfile.name || "Guru";
  const guruEmail = loadedProfile.email || "";
  const guruPhoto = loadedProfile.photoUrl || "";
  const guruInitials = useMemo(
    () => getInitials(guruName, guruEmail),
    [guruName, guruEmail]
  );

  const profileCompletionLabel =
    typeof profileCompletion === "number"
      ? `${Math.max(0, Math.min(100, Math.round(profileCompletion)))}% complete`
      : "";

  async function handleSignOut() {
    setAccountMenuOpen(false);
    await supabase.auth.signOut();
    router.replace("/guru/login");
    router.refresh();
  }

  function renderGuruAvatar(sizeClass = "h-12 w-12") {
    return (
      <span
        className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-black shadow-sm ring-1 ring-emerald-100`}
        style={{ color: "#047857" }}
      >
        {guruPhoto && !photoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={guruPhoto}
            alt={`${guruName} profile photo`}
            onError={() => setPhotoFailed(true)}
            className="h-full w-full object-cover"
          />
        ) : (
          guruInitials
        )}
      </span>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex h-[92px] w-full max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link
          href="/guru/dashboard"
          className="inline-flex h-14 w-[165px] shrink-0 items-center justify-start rounded-2xl transition hover:opacity-90 sm:w-[185px] lg:h-16 lg:w-[205px]"
          aria-label="SitGuru Guru Dashboard"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={190}
            height={70}
            priority
            className="h-auto max-h-12 w-auto object-contain lg:max-h-14"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-6">
          {navItems.map((item) => {
            const isActive =
              resolvedActiveTab === item.tab || isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative inline-flex h-[92px] items-center text-[15px] font-black tracking-[-0.01em] transition-colors hover:text-emerald-700 xl:text-base"
                style={{ color: isActive ? "#020617" : "#0f172a" }}
              >
                <span style={{ color: isActive ? "#020617" : "#0f172a" }}>
                  {item.label}
                </span>

                <span
                  className={[
                    "absolute left-0 right-0 rounded-full bg-emerald-500 transition-all",
                    isActive ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                  style={{
                    bottom: "16px",
                    height: "3px",
                    width: isActive ? "100%" : "0%",
                  }}
                />
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Link
            href="/guru/dashboard/resources"
            className="inline-flex h-12 min-w-[185px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
            style={{ color: "#0f172a" }}
          >
            <BookOpen
              className="h-4 w-4 shrink-0"
              style={{ color: "#0ea5e9" }}
            />
            <span
              className="whitespace-nowrap text-sm font-black leading-none"
              style={{ color: "#0f172a" }}
            >
              Guru Resources
            </span>
          </Link>

          <div ref={accountMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setAccountMenuOpen((value) => !value)}
              className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
              aria-haspopup="menu"
              aria-expanded={accountMenuOpen}
              aria-label="Open Guru account menu"
            >
              {renderGuruAvatar("h-11 w-11")}

              <span
                className="hidden max-w-[120px] truncate text-sm font-black xl:block"
                style={{ color: "#0f172a" }}
              >
                {guruName}
              </span>

              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                {accountMenuOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
              </span>
            </button>

            {accountMenuOpen ? (
              <div
                role="menu"
                className="absolute right-0 top-[calc(100%+0.75rem)] z-[999] w-80 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white text-left shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
                style={{ color: "#0f172a" }}
              >
                <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_100%)] p-5">
                  <div className="flex items-center gap-4">
                    {renderGuruAvatar("h-16 w-16")}

                    <div className="min-w-0">
                      <p
                        className="truncate text-xl font-black leading-tight"
                        style={{ color: "#0f172a" }}
                      >
                        {guruName}
                      </p>

                      {guruEmail ? (
                        <p
                          className="mt-1 truncate text-sm font-semibold"
                          style={{ color: "#475569" }}
                        >
                          {guruEmail}
                        </p>
                      ) : null}

                      <p
                        className="mt-1 text-base font-black"
                        style={{ color: "#047857" }}
                      >
                        {tierLabel || "SitGuru Guru"}
                      </p>

                      {profileCompletionLabel ? (
                        <p
                          className="mt-1 text-xs font-bold"
                          style={{ color: "#475569" }}
                        >
                          {profileCompletionLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-1 bg-white p-3">
                  {guruAccountMenuLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      style={{ color: "#0f172a" }}
                      className="block rounded-2xl bg-white px-4 py-3 text-base font-black opacity-100 transition hover:bg-emerald-50"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 text-left text-base font-black text-white transition hover:bg-emerald-700"
                  >
                    <LogOut className="h-5 w-5" />
                    Log Out
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <Link
            href="/guru/dashboard/messages"
            className="relative flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5" style={{ color: "#0f172a" }} />
            <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </Link>
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setAccountMenuOpen((value) => !value)}
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-black text-white shadow-sm"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
          >
            {accountMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white lg:hidden">
        <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              resolvedActiveTab === item.tab || isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition",
                  isActive
                    ? "border-emerald-300 bg-emerald-50"
                    : "border-slate-200 bg-white hover:bg-slate-50",
                ].join(" ")}
                style={{ color: isActive ? "#065f46" : "#334155" }}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}

          <Link
            href="/guru/dashboard/resources"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-black hover:bg-slate-50"
            style={{ color: "#334155" }}
          >
            <BookOpen className="h-4 w-4" />
            Resources
          </Link>
        </div>
      </div>

      {accountMenuOpen ? (
        <div
          className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden"
          style={{ color: "#0f172a" }}
        >
          <div className="mx-auto grid max-w-[1500px] gap-2">
            <div className="mb-2 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
              <div className="flex items-center gap-3">
                {renderGuruAvatar("h-12 w-12")}

                <div className="min-w-0">
                  <p
                    className="truncate text-base font-black"
                    style={{ color: "#0f172a" }}
                  >
                    {guruName}
                  </p>

                  {guruEmail ? (
                    <p
                      className="truncate text-xs font-semibold"
                      style={{ color: "#475569" }}
                    >
                      {guruEmail}
                    </p>
                  ) : null}

                  <p
                    className="text-sm font-bold"
                    style={{ color: "#047857" }}
                  >
                    {tierLabel || "SitGuru Guru"}
                  </p>

                  {profileCompletionLabel ? (
                    <p
                      className="mt-1 text-xs font-bold"
                      style={{ color: "#475569" }}
                    >
                      {profileCompletionLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            {guruAccountMenuLinks.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                onClick={() => setAccountMenuOpen(false)}
                style={{ color: "#0f172a" }}
                className="rounded-xl px-4 py-3 text-sm font-bold opacity-100 transition hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-emerald-700"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      ) : null}
    </header>
  );
}