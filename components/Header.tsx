// components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

type HeaderUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: "customer" | "guru" | "admin" | string | null;
};

type HeaderProps = {
  user?: HeaderUser | null;
};

type ProfileRow = {
  id?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  name?: string | null;
  display_name?: string | null;
  email?: string | null;
  role?: string | null;
  account_type?: string | null;
  avatar_url?: string | null;
  profile_photo_url?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type NavLink = {
  label: string;
  href: string;
};

const publicNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Find Care", href: "/search" },
  { label: "My Pets", href: "/pets" },
  { label: "Become a Guru", href: "/become-a-guru" },
];

const customerNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "Find a Guru", href: "/search" },
  { label: "Bookings", href: "/customer/dashboard/bookings" },
  { label: "Messages", href: "/messages" },
  { label: "My Pets", href: "/customer/pets" },
  { label: "My Profile", href: "/customer/dashboard/profile" },
  { label: "PawPerks", href: "/customer/dashboard/pawperks" },
];

const guruNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/guru/dashboard" },
  { label: "Bookings", href: "/guru/dashboard/bookings" },
  { label: "Messages", href: "/guru/dashboard/messages" },
  { label: "My Profile", href: "/guru/dashboard/profile" },
  { label: "Availability", href: "/guru/dashboard/availability" },
  { label: "Earnings", href: "/guru/dashboard/earnings" },
];

const adminNavLinks: NavLink[] = [
  { label: "Admin", href: "/admin" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Customers", href: "/admin/customers" },
  { label: "Gurus", href: "/admin/gurus" },
  { label: "Referrals", href: "/admin/referrals" },
];

function normalizeStoredRole(value?: string | null) {
  const role = String(value || "").trim().toLowerCase();

  if (role.includes("admin")) return "admin";

  if (
    role.includes("guru") ||
    role.includes("sitter") ||
    role.includes("provider") ||
    role.includes("walker") ||
    role.includes("caretaker")
  ) {
    return "guru";
  }

  return "customer";
}

function getHeaderMode(
  pathname: string | null,
  isLoggedIn: boolean,
  storedRole: string,
) {
  const path = pathname || "";

  if (!isLoggedIn) return "public";

  if (path.startsWith("/admin")) {
    return "admin";
  }

  if (path.startsWith("/guru/dashboard")) {
    return "guru";
  }

  if (
    path.startsWith("/customer") ||
    path.startsWith("/search") ||
    path.startsWith("/find-care") ||
    path.startsWith("/book/") ||
    path.startsWith("/bookings") ||
    path.startsWith("/pets") ||
    path.startsWith("/messages") ||
    path.startsWith("/referrals") ||
    path.startsWith("/pawperks") ||
    path.startsWith("/guru/")
  ) {
    return "customer";
  }

  if (storedRole === "admin") return "admin";
  if (storedRole === "guru") return "guru";

  return "customer";
}

function getProfileName(profile: ProfileRow | null, email?: string | null) {
  const firstLast = `${profile?.first_name || ""} ${
    profile?.last_name || ""
  }`.trim();

  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.name ||
    firstLast ||
    email ||
    "My Account"
  );
}

function getProfileAvatar(profile: ProfileRow | null) {
  return (
    profile?.profile_photo_url ||
    profile?.photo_url ||
    profile?.avatar_url ||
    profile?.image_url ||
    ""
  );
}

function getInitials(name?: string | null, email?: string | null) {
  const value = (name || email || "Customer").replace(/@.*/, "");
  const parts = value.split(/[\s._-]+/).filter(Boolean);

  const first = parts[0]?.charAt(0) || "C";
  const second = parts[1]?.charAt(0) || "";

  return `${first}${second}`.toUpperCase();
}

function pathMatches(pathname: string | null, targetPath: string) {
  const path = pathname || "";

  return path === targetPath || path.startsWith(`${targetPath}/`);
}

function getActiveAliases(href: string) {
  if (href === "/customer/dashboard") {
    return ["/customer/dashboard"];
  }

  if (href === "/search") {
    return ["/search", "/find-care", "/customer/find-guru"];
  }

  if (href === "/customer/dashboard/bookings") {
    return [
      "/customer/dashboard/bookings",
      "/customer/bookings",
      "/bookings",
      "/bookings/new",
    ];
  }

  if (href === "/messages" || href === "/customer/dashboard/messages") {
    return ["/messages", "/customer/messages", "/customer/dashboard/messages"];
  }

  if (href === "/customer/pets" || href === "/customer/dashboard/pets") {
    return ["/customer/pets", "/customer/dashboard/pets", "/pets"];
  }

  if (href === "/customer/dashboard/profile") {
    return ["/customer/dashboard/profile", "/customer/profile", "/profile"];
  }

  if (
    href === "/customer/dashboard/pawperks" ||
    href === "/customer/dashboard/referrals"
  ) {
    return [
      "/customer/dashboard/pawperks",
      "/customer/dashboard/referrals",
      "/referrals",
      "/pawperks",
    ];
  }

  if (href === "/guru/dashboard") {
    return ["/guru/dashboard"];
  }

  if (href === "/admin") {
    return ["/admin"];
  }

  return [href];
}

export default function Header({ user = null }: HeaderProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [loadedUser, setLoadedUser] = useState<HeaderUser | null>(user);
  const [loadingUser, setLoadingUser] = useState(!user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  const avatarMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadActiveUser() {
      try {
        setLoadingUser(true);

        const {
          data: { user: activeUser },
        } = await supabase.auth.getUser();

        if (!mounted) return;

        if (!activeUser) {
          setLoadedUser(null);
          return;
        }

        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", activeUser.id)
          .maybeSingle();

        if (!mounted) return;

        const profile = (profileData || null) as ProfileRow | null;
        const rawRole = profile?.role || profile?.account_type || "customer";

        setLoadedUser({
          id: activeUser.id,
          email: activeUser.email || profile?.email || "",
          name: getProfileName(profile, activeUser.email),
          avatarUrl: getProfileAvatar(profile),
          role: normalizeStoredRole(rawRole),
        });
      } catch (error) {
        console.error("Header user load failed:", error);

        if (mounted) {
          setLoadedUser(null);
        }
      } finally {
        if (mounted) {
          setLoadingUser(false);
        }
      }
    }

    if (user) {
      setLoadedUser(user);
      setLoadingUser(false);
      return;
    }

    loadActiveUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadActiveUser();
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        avatarMenuRef.current &&
        !avatarMenuRef.current.contains(event.target as Node)
      ) {
        setAvatarOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setAvatarOpen(false);
        setMobileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setAvatarOpen(false);
  }, [pathname]);

  const activeUser = loadedUser;
  const isLoggedIn = Boolean(activeUser);
  const storedRole = normalizeStoredRole(activeUser?.role);
  const headerMode = getHeaderMode(pathname, isLoggedIn, storedRole);

  const isCustomer = headerMode === "customer";
  const isGuru = headerMode === "guru";
  const isAdmin = headerMode === "admin";

  const navLinks = useMemo(() => {
    if (isCustomer) return customerNavLinks;
    if (isGuru) return guruNavLinks;
    if (isAdmin) return adminNavLinks;
    return publicNavLinks;
  }, [isAdmin, isCustomer, isGuru]);

  const dashboardHref = isGuru
    ? "/guru/dashboard"
    : isAdmin
      ? "/admin"
      : "/customer/dashboard";

  const bookingsHref = isGuru
    ? "/guru/dashboard/bookings"
    : "/customer/dashboard/bookings";

  const messagesHref = isGuru
    ? "/guru/dashboard/messages"
    : isAdmin
      ? "/admin/messages"
      : "/messages";

  const resourcesHref = isGuru
    ? "/guru/dashboard/resources"
    : "/customer/dashboard/pawperks";

  const displayRole = isGuru
    ? "SitGuru Guru"
    : isAdmin
      ? "SitGuru Admin"
      : "SitGuru Pet Parent";

  const logoHref = "/";

  const userName = isAdmin ? "Admin HQ" : activeUser?.name || "My Account";
  const userEmail = isAdmin ? "admin@sitguru.com" : activeUser?.email || "";
  const userAvatarUrl = activeUser?.avatarUrl || "";
  const userInitials = getInitials(userName, userEmail);

  const accountMenuLinks: NavLink[] = isGuru
    ? [
        { label: "Dashboard", href: "/guru/dashboard" },
        { label: "Update Profile", href: "/guru/dashboard/profile" },
        { label: "Bookings", href: "/guru/dashboard/bookings" },
        { label: "Messages", href: "/guru/dashboard/messages" },
        { label: "Availability", href: "/guru/dashboard/availability" },
        { label: "Earnings", href: "/guru/dashboard/earnings" },
        { label: "Guru Resources", href: "/guru/dashboard/resources" },
      ]
    : isAdmin
      ? [
          { label: "Dashboard", href: "/admin" },
          { label: "Update Profile", href: "/admin/profile" },
          { label: "Messages", href: "/admin/messages" },
          { label: "Customers", href: "/admin/customers" },
          { label: "Gurus", href: "/admin/gurus" },
          { label: "Referrals", href: "/admin/referrals" },
        ]
      : [
          { label: "Dashboard", href: "/customer/dashboard" },
          { label: "Update Profile", href: "/customer/dashboard/profile" },
          { label: "My Care", href: "/customer/dashboard/bookings" },
          { label: "My Pets", href: "/customer/pets" },
          { label: "Messages", href: "/messages" },
          { label: "PawPerks", href: "/customer/dashboard/pawperks" },
        ];

  const isActive = (href: string) => {
    const path = pathname || "";

    if (href === "/") {
      return path === "/";
    }

    if (href === "/customer/dashboard") {
      return path === "/customer/dashboard";
    }

    if (href === "/guru/dashboard") {
      return path === "/guru/dashboard";
    }

    if (href === "/admin") {
      return path === "/admin";
    }

    const aliases = getActiveAliases(href);

    return aliases.some((alias) => pathMatches(path, alias));
  };

  async function handleLogout() {
    setAvatarOpen(false);
    setMobileOpen(false);

    try {
      await supabase.auth.signOut();
    } catch {
      try {
        await fetch("/auth/signout", {
          method: "POST",
        });
      } catch {
        // Keep logout moving even if that endpoint is not present.
      }
    }

    router.push("/");
    router.refresh();
  }

  function renderAvatar(sizeClass = "h-11 w-11") {
    if (isAdmin) {
      return (
        <span
          className={`relative flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white shadow-sm ring-1 ring-emerald-100`}
        >
          <Image
            src="/images/sitguru-admin-avatar.jpg"
            alt="SitGuru Admin Avatar"
            fill
            priority
            sizes="96px"
            className="object-cover"
          />
        </span>
      );
    }

    return (
      <span
        className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-black text-emerald-700 shadow-sm ring-1 ring-emerald-100`}
      >
        {userAvatarUrl ? (
          <Image
            src={userAvatarUrl}
            alt={`${userName} profile photo`}
            width={64}
            height={64}
            className="h-full w-full object-cover"
            unoptimized
          />
        ) : (
          userInitials || <UserRound className="h-5 w-5" />
        )}
      </span>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex h-[92px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link
          href={logoHref}
          className="inline-flex h-14 w-[165px] shrink-0 items-center justify-start rounded-2xl transition hover:opacity-90 sm:w-[185px] lg:h-16 lg:w-[205px]"
          aria-label="Go to SitGuru homepage"
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
          {navLinks.map((link) => {
            const active = isActive(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative pb-5 text-[15px] font-black transition xl:text-base ${
                  active
                    ? "text-slate-950"
                    : "text-slate-900 hover:text-emerald-700"
                }`}
              >
                {link.label}

                {active ? (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-emerald-500" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {loadingUser ? (
            <div className="h-12 w-48 animate-pulse rounded-full bg-slate-100" />
          ) : isLoggedIn ? (
            <>
              {isGuru ? (
                <Link
                  href={resourcesHref}
                  className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-slate-50 xl:inline-flex"
                >
                  <BookOpen className="h-4 w-4 text-sky-500" />
                  Guru Resources
                </Link>
              ) : null}

              {isCustomer ? (
                <Link
                  href={bookingsHref}
                  className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:bg-slate-50 xl:inline-flex"
                >
                  <CalendarDays className="h-4 w-4 text-emerald-600" />
                  My Care
                </Link>
              ) : null}

              <div ref={avatarMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setAvatarOpen((current) => !current)}
                  className="flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1.5 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-100 focus:outline-none focus:ring-4 focus:ring-emerald-100"
                  aria-haspopup="menu"
                  aria-expanded={avatarOpen}
                  aria-label="Open account menu"
                >
                  {renderAvatar()}

                  <span className="hidden max-w-[120px] truncate text-sm font-black text-slate-950 xl:block">
                    {userName}
                  </span>

                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
                    {avatarOpen ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </span>
                </button>

                {avatarOpen ? (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+0.75rem)] z-[999] w-80 overflow-hidden rounded-[1.6rem] border border-slate-200 bg-white text-left shadow-[0_22px_55px_rgba(15,23,42,0.18)]"
                  >
                    <div className="bg-[linear-gradient(135deg,#ecfdf5_0%,#eff6ff_100%)] p-5">
                      <div className="flex items-center gap-4">
                        {renderAvatar("h-16 w-16")}

                        <div className="min-w-0">
                          <p className="truncate text-xl font-black leading-tight text-slate-950">
                            {userName}
                          </p>

                          {userEmail ? (
                            <p className="mt-1 truncate text-sm font-semibold text-slate-500">
                              {userEmail}
                            </p>
                          ) : null}

                          <p className="mt-1 text-base font-black text-emerald-700">
                            {displayRole}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-1 p-3">
                      {accountMenuLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setAvatarOpen(false)}
                          className="rounded-2xl px-4 py-3 text-base font-black text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {item.label}
                        </Link>
                      ))}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 text-left text-base font-black text-white transition hover:bg-emerald-700"
                      >
                        <LogOut className="h-5 w-5" />
                        Log Out
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <NotificationBell />
            </>
          ) : (
            <>
              <Link
                href="/guru/login"
                className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-emerald-50"
              >
                Guru Login
              </Link>

              <Link
                href="/customer/login"
                className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-extrabold text-slate-800 shadow-sm transition hover:bg-emerald-50"
              >
                Customer Login
              </Link>

              <Link
                href="/signup"
                className="rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-extrabold text-white shadow-md transition hover:bg-emerald-700"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 lg:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-[1440px] gap-2">
            {isLoggedIn ? (
              <div className="mb-2 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {renderAvatar("h-12 w-12")}

                    <div className="min-w-0">
                      <p className="truncate text-base font-black text-slate-950">
                        {userName}
                      </p>

                      <p className="text-sm font-bold text-emerald-700">
                        {displayRole}
                      </p>
                    </div>
                  </div>

                  <NotificationBell />
                </div>
              </div>
            ) : null}

            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-bold transition ${
                  isActive(item.href)
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"
                }`}
              >
                {item.label}
              </Link>
            ))}

            {isLoggedIn ? (
              <>
                {accountMenuLinks.map((item) => (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}

                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-black text-white transition hover:bg-emerald-700"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </>
            ) : (
              <div className="mt-2 grid gap-2">
                <Link
                  href="/guru/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                >
                  Guru Login
                </Link>

                <Link
                  href="/customer/login"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-slate-800"
                >
                  Customer Login
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-xl bg-emerald-600 px-4 py-3 text-sm font-black text-white"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}