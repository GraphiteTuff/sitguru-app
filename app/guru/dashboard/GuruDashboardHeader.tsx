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
  Repeat2,
  UserCircle,
  UserPlus,
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
  | "referrals"
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
    label: "Referrals",
    href: "/guru/dashboard/referrals",
    tab: "referrals",
    icon: UserPlus,
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
  { label: "Referrals", href: "/guru/dashboard/referrals" },
  { label: "Messages", href: "/guru/dashboard/messages" },
  { label: "Availability", href: "/guru/dashboard/availability" },
  { label: "Earnings", href: "/guru/dashboard/earnings" },
  { label: "Guru Success Center", href: "/guru/success-center" },
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
    "Guru",
  );
}

function getPhotoFromProfile(profile?: GuruProfileForHeader | null) {
  return firstText(
    profile?.profile_photo_url,
    profile?.photo_url,
    profile?.avatar_url,
    profile?.image_url,
  );
}

function isOAuthProviderAvatarUrl(value: string) {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();

    return (
      hostname.includes("googleusercontent.com") ||
      hostname.includes("ggpht.com") ||
      hostname.includes("google.com") ||
      hostname.includes("googleapis.com") ||
      hostname.includes("facebook.com") ||
      hostname.includes("fbcdn.net") ||
      hostname.includes("apple.com")
    );
  } catch {
    return false;
  }
}

function normalizePhotoUrl(value?: string | null) {
  const cleanValue = asText(value);

  if (!cleanValue) return "";
  if (isOAuthProviderAvatarUrl(cleanValue)) return "";

  return cleanValue;
}

function isPathActive(pathname: string, href: string) {
  if (href === "/guru/dashboard") {
    return pathname === "/guru/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function getTabFromPathname(pathname: string): ActiveGuruTab {
  if (pathname.startsWith("/guru/dashboard/bookings")) return "bookings";
  if (pathname.startsWith("/guru/dashboard/referrals")) return "referrals";
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
    photoUrl: normalizePhotoUrl(
      firstText(imageUrl, getPhotoFromProfile(guruProfile)),
    ),
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
        normalizePhotoUrl(firstText(imageUrl, getPhotoFromProfile(guruProfile))) ||
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
      let profilePhoto = normalizePhotoUrl(imageUrl);

      const { data: guruData } = await supabase
        .from("gurus")
        .select(
          "display_name,full_name,name,email,photo_url,profile_photo_url,avatar_url,image_url",
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
          guru.email,
        );

        profileEmail = firstText(guru.email, profileEmail);

        profilePhoto = normalizePhotoUrl(
          firstText(
            profilePhoto,
            guru.profile_photo_url,
            guru.photo_url,
            guru.avatar_url,
            guru.image_url,
          ),
        );
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select(
          "display_name,full_name,name,email,photo_url,profile_photo_url,avatar_url,image_url",
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
          profile.email,
        );

        profileEmail = firstText(profileEmail, profile.email);

        profilePhoto = normalizePhotoUrl(
          firstText(
            profilePhoto,
            profile.profile_photo_url,
            profile.photo_url,
            profile.avatar_url,
            profile.image_url,
          ),
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
    [guruName, guruEmail],
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
        className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-semibold shadow-sm ring-1 ring-emerald-100`}
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
    <header className="sg-guru-header sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex h-[84px] w-full max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link
          href="/guru/dashboard"
          className="inline-flex h-14 w-[155px] shrink-0 items-center justify-start rounded-2xl transition hover:opacity-90 sm:w-[175px] lg:h-16 lg:w-[195px]"
          aria-label="SitGuru Guru Dashboard"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={190}
            height={70}
            priority
            className="h-auto max-h-11 w-auto object-contain lg:max-h-12"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-4 lg:flex xl:gap-5">
          {navItems.map((item) => {
            const isActive =
              resolvedActiveTab === item.tab ||
              isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className="sg-guru-nav-link relative inline-flex h-[84px] items-center text-[14px] font-semibold tracking-[-0.015em] transition-colors hover:text-emerald-700 xl:text-[15px]"
                style={{ color: isActive ? "#020617" : "#334155" }}
              >
                <span style={{ color: isActive ? "#020617" : "#334155" }}>
                  {item.label}
                </span>

                <span
                  className={[
                    "absolute left-0 right-0 rounded-full bg-emerald-500 transition-all duration-200",
                    isActive ? "opacity-100" : "opacity-0",
                  ].join(" ")}
                  style={{
                    bottom: "14px",
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
            href="/customer/dashboard/profile"
            className="sg-guru-switch-link inline-flex h-11 min-w-[190px] items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold tracking-[-0.01em] shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100"
            style={{ color: "#065f46" }}
          >
            <Repeat2
              className="h-4 w-4 shrink-0"
              style={{ color: "#047857" }}
            />
            <span
              className="whitespace-nowrap text-sm font-semibold leading-none"
              style={{ color: "#065f46" }}
            >
              Switch to Pet Parent
            </span>
          </Link>

          <Link
            href="/guru/success-center"
            className="sg-guru-success-link inline-flex h-11 min-w-[205px] items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold tracking-[-0.01em] shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50"
            style={{ color: "#0f172a" }}
          >
            <BookOpen
              className="h-4 w-4 shrink-0"
              style={{ color: "#0ea5e9" }}
            />
            <span
              className="whitespace-nowrap text-sm font-semibold leading-none"
              style={{ color: "#0f172a" }}
            >
              Guru Success Center
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
              {renderGuruAvatar("h-10 w-10")}

              <span
                className="hidden max-w-[120px] truncate text-sm font-semibold tracking-[-0.01em] xl:block"
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
                        className="truncate text-xl font-semibold leading-tight tracking-[-0.025em]"
                        style={{ color: "#0f172a" }}
                      >
                        {guruName}
                      </p>

                      {guruEmail ? (
                        <p
                          className="mt-1 truncate text-sm font-medium"
                          style={{ color: "#475569" }}
                        >
                          {guruEmail}
                        </p>
                      ) : null}

                      <p
                        className="mt-1 text-base font-semibold tracking-[-0.01em]"
                        style={{ color: "#047857" }}
                      >
                        {tierLabel || "SitGuru Guru"}
                      </p>

                      {profileCompletionLabel ? (
                        <p
                          className="mt-1 text-xs font-medium"
                          style={{ color: "#475569" }}
                        >
                          {profileCompletionLabel}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="grid gap-1 bg-white p-3">
                  <Link
                    href="/customer/dashboard/profile"
                    role="menuitem"
                    onClick={() => setAccountMenuOpen(false)}
                    className="mb-1 flex items-center gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[15px] font-semibold tracking-[-0.01em] transition hover:bg-emerald-100"
                    style={{ color: "#065f46" }}
                  >
                    <Repeat2 className="h-4 w-4" />
                    Switch to Pet Parent
                  </Link>

                  {guruAccountMenuLinks.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      role="menuitem"
                      onClick={() => setAccountMenuOpen(false)}
                      style={{ color: "#0f172a" }}
                      className="block rounded-2xl bg-white px-4 py-3 text-[15px] font-semibold tracking-[-0.01em] opacity-100 transition hover:bg-emerald-50"
                    >
                      {item.label}
                    </Link>
                  ))}

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleSignOut}
                    className="mt-2 flex w-full items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 text-left text-[15px] font-semibold tracking-[-0.01em] text-white transition hover:bg-emerald-700"
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
            className="relative flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-900 shadow-sm transition hover:bg-slate-50"
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
            className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold tracking-[-0.01em] text-white shadow-sm"
            aria-haspopup="menu"
            aria-expanded={accountMenuOpen}
          >
            {accountMenuOpen ? "Close" : "Menu"}
          </button>
        </div>
      </div>

      <div className="border-t border-slate-100 bg-white lg:hidden">
        <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          <Link
            href="/customer/dashboard/profile"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold tracking-[-0.01em] hover:bg-emerald-100"
            style={{ color: "#065f46" }}
          >
            <Repeat2 className="h-4 w-4" />
            Switch to Pet Parent
          </Link>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              resolvedActiveTab === item.tab ||
              isPathActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold tracking-[-0.01em] transition",
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
            href="/guru/success-center"
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold tracking-[-0.01em] hover:bg-slate-50"
            style={{ color: "#334155" }}
          >
            <BookOpen className="h-4 w-4" />
            Guru Success Center
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
                    className="truncate text-base font-semibold tracking-[-0.01em]"
                    style={{ color: "#0f172a" }}
                  >
                    {guruName}
                  </p>

                  {guruEmail ? (
                    <p
                      className="truncate text-xs font-medium"
                      style={{ color: "#475569" }}
                    >
                      {guruEmail}
                    </p>
                  ) : null}

                  <p
                    className="text-sm font-semibold tracking-[-0.01em]"
                    style={{ color: "#047857" }}
                  >
                    {tierLabel || "SitGuru Guru"}
                  </p>

                  {profileCompletionLabel ? (
                    <p
                      className="mt-1 text-xs font-medium"
                      style={{ color: "#475569" }}
                    >
                      {profileCompletionLabel}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>

            <Link
              href="/customer/dashboard/profile"
              onClick={() => setAccountMenuOpen(false)}
              className="mb-1 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold tracking-[-0.01em] transition hover:bg-emerald-100"
              style={{ color: "#065f46" }}
            >
              <Repeat2 className="h-4 w-4" />
              Switch to Pet Parent
            </Link>

            {guruAccountMenuLinks.map((item) => (
              <Link
                key={`mobile-${item.href}`}
                href={item.href}
                onClick={() => setAccountMenuOpen(false)}
                style={{ color: "#0f172a" }}
                className="rounded-xl px-4 py-3 text-sm font-semibold tracking-[-0.01em] opacity-100 transition hover:bg-slate-50"
              >
                {item.label}
              </Link>
            ))}

            <button
              type="button"
              onClick={handleSignOut}
              className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-semibold tracking-[-0.01em] text-white transition hover:bg-emerald-700"
            >
              <LogOut className="h-4 w-4" />
              Log Out
            </button>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .sg-guru-header {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        .sg-guru-header *,
        .sg-guru-header a,
        .sg-guru-header button,
        .sg-guru-header span,
        .sg-guru-header p {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
          text-rendering: geometricPrecision;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .sg-guru-nav-link {
          letter-spacing: -0.015em;
        }

        .sg-guru-nav-link:hover span {
          color: #047857 !important;
        }

        .sg-guru-success-link:hover span,
        .sg-guru-switch-link:hover span {
          color: #047857 !important;
        }
      `}</style>
    </header>
  );
}