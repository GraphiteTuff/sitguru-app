// components/Header.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  LogOut,
  Menu,
  Repeat2,
  UserRound,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import NotificationBell from "@/components/NotificationBell";

type HeaderMode = "public" | "customer" | "guru" | "ambassador" | "admin";

type HeaderUser = {
  id?: string | null;
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
  role?: "customer" | "guru" | "ambassador" | "admin" | "both" | string | null;
  hasCustomerAccess?: boolean;
  hasGuruAccess?: boolean;
  hasAmbassadorAccess?: boolean;
  hasAdminAccess?: boolean;
  guruStatus?: string | null;
  ambassadorStatus?: string | null;
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
  is_pet_parent?: boolean | null;
  is_customer?: boolean | null;
  is_guru?: boolean | null;
  is_guru_interested?: boolean | null;
  is_ambassador?: boolean | null;
};

type GuruRow = {
  id?: string | null;
  user_id?: string | null;
  status?: string | null;
  approval_status?: string | null;
  onboarding_status?: string | null;
  is_active?: boolean | null;
  is_public?: boolean | null;
};

type AmbassadorRow = {
  id?: string | null;
  user_id?: string | null;
  status?: string | null;
  onboarding_status?: string | null;
  referral_status?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
};

type UserRoleRow = {
  role?: string | null;
};

type NavLink = {
  label: string;
  href: string;
};

type RoleSwitchLink = {
  label: string;
  href: string;
  mode: HeaderMode;
};

const PUBLIC_GURU_SEARCH_HREF = "/search";

const publicNavLinks: NavLink[] = [
  { label: "Home", href: "/" },
  { label: "Find Care", href: PUBLIC_GURU_SEARCH_HREF },
  { label: "Become a Guru", href: "/become-a-guru" },
  { label: "Programs", href: "/programs" },
  { label: "Ambassadors", href: "/ambassadors" },
  { label: "Help", href: "/help" },
  { label: "My Pets", href: "/pets" },
];

const customerNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/customer/dashboard" },
  { label: "Find a Guru", href: PUBLIC_GURU_SEARCH_HREF },
  { label: "Bookings", href: "/customer/dashboard/bookings" },
  { label: "Messages", href: "/messages" },
  { label: "My Pets", href: "/customer/pets" },
  { label: "My Profile", href: "/customer/dashboard/profile" },
  { label: "PawPerks", href: "/customer/dashboard/pawperks" },
];

const guruNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/guru/dashboard" },
  { label: "Pricing", href: "/guru/dashboard/pricing" },
  { label: "Bookings", href: "/guru/dashboard/bookings" },
  { label: "Referrals", href: "/guru/dashboard/referrals" },
  { label: "Messages", href: "/guru/dashboard/messages" },
  { label: "My Profile", href: "/guru/dashboard/profile" },
  { label: "Availability", href: "/guru/dashboard/availability" },
  { label: "Earnings", href: "/guru/dashboard/earnings" },
];

const ambassadorNavLinks: NavLink[] = [
  { label: "Dashboard", href: "/ambassador/dashboard" },
  { label: "Referrals", href: "/ambassador/dashboard/referrals" },
  { label: "Earnings", href: "/ambassador/dashboard/earnings" },
  { label: "Support", href: "mailto:support@sitguru.com" },
  { label: "Training", href: "/ambassador/dashboard/training" },
  { label: "Onboarding", href: "/ambassador/dashboard/onboarding-packet" },
];

const adminNavLinks: NavLink[] = [
  { label: "Admin", href: "/admin" },
  { label: "Messages", href: "/admin/messages" },
  { label: "Pet Parents", href: "/admin/customers" },
  { label: "Gurus", href: "/admin/gurus" },
  { label: "Ambassadors", href: "/admin/ambassadors" },
  { label: "Referrals", href: "/admin/referrals" },
];

function normalizeRole(value?: string | null) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isAdminRole(value?: string | null) {
  const role = normalizeRole(value);
  return (
    role.includes("admin") ||
    role.includes("super") ||
    role.includes("owner") ||
    role.includes("founder") ||
    role.includes("ceo")
  );
}

function isGuruRole(value?: string | null) {
  const role = normalizeRole(value);
  return (
    role.includes("guru") ||
    role.includes("sitter") ||
    role.includes("provider") ||
    role.includes("walker") ||
    role.includes("caretaker") ||
    role.includes("pet_care") ||
    role.includes("pet-care")
  );
}

function isAmbassadorRole(value?: string | null) {
  const role = normalizeRole(value);
  return (
    role.includes("ambassador") ||
    role.includes("sitguru_rep") ||
    role.includes("sitguru rep") ||
    role.includes("representative") ||
    role.includes("community_hire") ||
    role.includes("student_hire") ||
    role.includes("military_hire")
  );
}

function isCustomerRole(value?: string | null) {
  const role = normalizeRole(value);
  return (
    role.includes("customer") ||
    role.includes("pet_parent") ||
    role.includes("pet-parent") ||
    role.includes("pet parent") ||
    role.includes("parent")
  );
}

function isBothRole(value?: string | null) {
  const role = normalizeRole(value);
  return (
    role === "both" ||
    role.includes("both") ||
    role.includes("customer_guru") ||
    role.includes("customer-guru") ||
    role.includes("pet_parent_and_guru") ||
    role.includes("pet-parent-and-guru")
  );
}

function normalizeStoredRole(value?: string | null) {
  const role = normalizeRole(value);
  if (isAdminRole(role)) return "admin";
  if (isAmbassadorRole(role)) return "ambassador";
  if (isBothRole(role)) return "both";
  if (isGuruRole(role)) return "guru";
  if (isCustomerRole(role)) return "customer";
  return "customer";
}

function getHeaderMode({
  pathname,
  isLoggedIn,
  storedRole,
}: {
  pathname: string | null;
  isLoggedIn: boolean;
  storedRole: string;
}): HeaderMode {
  const path = pathname || "";
  if (!isLoggedIn) return "public";
  if (path.startsWith("/admin")) return "admin";
  if (path.startsWith("/ambassador")) return "ambassador";
  if (
    path.startsWith("/guru") ||
    path.startsWith("/guru-dashboard") ||
    path.startsWith("/guru-success-center")
  ) {
    return "guru";
  }
  if (
    path.startsWith("/customer") ||
    path.startsWith("/pets") ||
    path.startsWith("/bookings") ||
    path.startsWith("/messages") ||
    path.startsWith("/profile") ||
    path.startsWith("/rewards") ||
    path.startsWith("/referrals") ||
    path.startsWith("/pawperks")
  ) {
    return "customer";
  }
  if (storedRole === "admin") return "admin";
  if (storedRole === "ambassador") return "ambassador";
  if (storedRole === "guru") return "guru";
  return "customer";
}

function getProfileName(profile: ProfileRow | null, email?: string | null) {
  const firstLast =
    `${profile?.first_name || ""} ${profile?.last_name || ""}`.trim();
  return (
    profile?.display_name ||
    profile?.full_name ||
    profile?.name ||
    firstLast ||
    email ||
    "My Account"
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

function normalizeAvatarUrl(value?: string | null) {
  if (!value) return "";
  const cleanValue = value.trim();
  if (!cleanValue) return "";
  if (isOAuthProviderAvatarUrl(cleanValue)) return "";
  return cleanValue;
}

function getProfileAvatar(profile: ProfileRow | null) {
  return (
    normalizeAvatarUrl(profile?.profile_photo_url) ||
    normalizeAvatarUrl(profile?.photo_url) ||
    normalizeAvatarUrl(profile?.image_url) ||
    normalizeAvatarUrl(profile?.avatar_url) ||
    ""
  );
}

function getInitials(name?: string | null, email?: string | null) {
  const value = (name || email || "Pet Parent").replace(/@.*/, "");
  const parts = value.split(/[\s._-]+/).filter(Boolean);
  const first = parts[0]?.charAt(0) || "P";
  const second = parts[1]?.charAt(0) || "";
  return `${first}${second}`.toUpperCase();
}

function pathMatches(pathname: string | null, targetPath: string) {
  const path = pathname || "";
  return path === targetPath || path.startsWith(`${targetPath}/`);
}

function getActiveAliases(href: string) {
  if (href === "/customer/dashboard") return ["/customer/dashboard"];
  if (href === "/pet-parents") return ["/pet-parents"];
  if (href === "/become-a-guru") return ["/become-a-guru", "/pet-gurus"];
  if (href === PUBLIC_GURU_SEARCH_HREF) {
    return [PUBLIC_GURU_SEARCH_HREF, "/find-care", "/customer/find-guru"];
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
  if (href === "/guru/dashboard") return ["/guru/dashboard"];
  if (href === "/guru/dashboard/pricing")
    return ["/guru/dashboard/pricing", "/guru/pricing"];
  if (href === "/guru/dashboard/referrals")
    return ["/guru/dashboard/referrals", "/guru/referrals"];
  if (href === "/guru/dashboard/messages")
    return ["/guru/dashboard/messages", "/guru/messages"];
  if (href === "/guru/dashboard/bookings")
    return ["/guru/dashboard/bookings", "/guru/bookings"];
  if (href === "/guru/dashboard/profile")
    return ["/guru/dashboard/profile", "/guru/profile"];
  if (href === "/guru/dashboard/availability")
    return ["/guru/dashboard/availability", "/guru/availability"];
  if (href === "/guru/dashboard/earnings")
    return ["/guru/dashboard/earnings", "/guru/earnings"];
  if (href === "/guru/success-center")
    return ["/guru/success-center", "/guru/dashboard/resources"];
  if (href === "/ambassador/dashboard") return ["/ambassador/dashboard"];
  if (href === "mailto:support@sitguru.com")
    return ["mailto:support@sitguru.com"];
  if (href === "/ambassador/training")
    return ["/ambassador/training", "/ambassador/dashboard/training"];
  if (href === "/ambassador/dashboard/onboarding-packet") {
    return ["/ambassador/dashboard/onboarding-packet"];
  }
  if (href === "/admin") return ["/admin"];
  return [href];
}

function clearSitGuruAuthStorage() {
  if (typeof window === "undefined") return;
  const keysToRemove = [
    "sitguru_pending_role",
    "sitguru_selected_role",
    "sitguru_signup_role",
    "sitguru_onboarding_role",
    "sitguru_auth_redirect",
    "sitguru_pending_phone",
    "sitguru_phone_login_started",
  ];
  keysToRemove.forEach((key) => {
    window.localStorage.removeItem(key);
    window.sessionStorage.removeItem(key);
  });
}

function getGuruStatus(guru: GuruRow | null) {
  return (
    guru?.approval_status ||
    guru?.onboarding_status ||
    guru?.status ||
    (guru?.is_active ? "approved" : null)
  );
}

function getAmbassadorStatus(ambassador: AmbassadorRow | null) {
  return (
    ambassador?.onboarding_status ||
    ambassador?.referral_status ||
    ambassador?.status ||
    null
  );
}

function buildRoleSwitchLinks({
  headerMode,
  hasCustomerAccess,
  hasGuruAccess,
  hasAmbassadorAccess,
  hasAdminAccess,
  guruStatus,
}: {
  headerMode: HeaderMode;
  hasCustomerAccess: boolean;
  hasGuruAccess: boolean;
  hasAmbassadorAccess: boolean;
  hasAdminAccess: boolean;
  guruStatus?: string | null;
}): RoleSwitchLink[] {
  const links: RoleSwitchLink[] = [];
  if (hasCustomerAccess && headerMode !== "customer") {
    links.push({
      label: "Switch to Pet Parent",
      href: "/customer/dashboard",
      mode: "customer",
    });
  }
  if (hasGuruAccess && headerMode !== "guru") {
    const status = normalizeRole(guruStatus);
    links.push({
      label:
        status.includes("pending") ||
        status.includes("review") ||
        status.includes("started") ||
        status.includes("setup")
          ? "Switch to Guru Setup"
          : "Switch to Guru",
      href: "/guru/dashboard",
      mode: "guru",
    });
  }
  if (hasAmbassadorAccess && headerMode !== "ambassador") {
    links.push({
      label: "Switch to Ambassador",
      href: "/ambassador/dashboard",
      mode: "ambassador",
    });
  }
  if (hasAdminAccess && headerMode !== "admin") {
    links.push({ label: "Admin Dashboard", href: "/admin", mode: "admin" });
  }
  return links;
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
          error: userError,
        } = await supabase.auth.getUser();

        if (!mounted) return;
        if (userError || !activeUser) {
          setLoadedUser(null);
          return;
        }

        const activeEmail = activeUser.email || activeUser.phone || "";
        const cleanEmail = activeEmail.toLowerCase();

        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", activeUser.id)
          .maybeSingle();

        const { data: roleRows, error: roleError } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", activeUser.id);

        const { data: guruData, error: guruError } = await supabase
          .from("gurus")
          .select(
            "id,user_id,status,approval_status,onboarding_status,is_active,is_public",
          )
          .eq("user_id", activeUser.id)
          .maybeSingle();

        const ambassadorQuery = cleanEmail
          ? supabase
              .from("ambassadors")
              .select(
                "id,user_id,status,onboarding_status,referral_status,dashboard_enabled,login_enabled",
              )
              .or(
                `user_id.eq.${activeUser.id},login_email.eq.${cleanEmail},contact_email.eq.${cleanEmail},email.eq.${cleanEmail}`,
              )
              .eq("dashboard_enabled", true)
              .eq("login_enabled", true)
              .neq("status", "archived")
              .maybeSingle()
          : supabase
              .from("ambassadors")
              .select(
                "id,user_id,status,onboarding_status,referral_status,dashboard_enabled,login_enabled",
              )
              .eq("user_id", activeUser.id)
              .eq("dashboard_enabled", true)
              .eq("login_enabled", true)
              .neq("status", "archived")
              .maybeSingle();

        const { data: ambassadorData, error: ambassadorError } =
          await ambassadorQuery;
        if (!mounted) return;

        const profile = !profileError
          ? ((profileData || null) as ProfileRow | null)
          : null;
        const roles = !roleError
          ? (((roleRows || []) as UserRoleRow[])
              .map((row) => row.role)
              .filter(Boolean) as string[])
          : [];
        const guru = !guruError ? ((guruData || null) as GuruRow | null) : null;
        const ambassador = !ambassadorError
          ? ((ambassadorData || null) as AmbassadorRow | null)
          : null;

        const metadataRole =
          typeof activeUser.user_metadata?.role === "string"
            ? activeUser.user_metadata.role
            : typeof activeUser.app_metadata?.role === "string"
              ? activeUser.app_metadata.role
              : null;
        const metadataAccountType =
          typeof activeUser.user_metadata?.account_type === "string"
            ? activeUser.user_metadata.account_type
            : typeof activeUser.app_metadata?.account_type === "string"
              ? activeUser.app_metadata.account_type
              : null;

        const allRoleSignals = [
          profile?.role,
          profile?.account_type,
          metadataRole,
          metadataAccountType,
          ...roles,
        ].filter(Boolean) as string[];
        const hasAdminAccess = allRoleSignals.some(isAdminRole);
        const hasGuruAccess =
          Boolean(guru?.id) ||
          Boolean(profile?.is_guru) ||
          Boolean(profile?.is_guru_interested) ||
          allRoleSignals.some(isGuruRole) ||
          allRoleSignals.some(isBothRole);
        const hasAmbassadorAccess =
          Boolean(ambassador?.id) ||
          Boolean(profile?.is_ambassador) ||
          allRoleSignals.some(isAmbassadorRole);
        const hasCustomerAccess =
          Boolean(profile?.is_pet_parent) ||
          Boolean(profile?.is_customer) ||
          allRoleSignals.some(isCustomerRole) ||
          allRoleSignals.some(isBothRole) ||
          (!hasAdminAccess && !hasAmbassadorAccess);

        const rawRole = hasAdminAccess
          ? "admin"
          : hasGuruAccess && hasCustomerAccess
            ? "both"
            : hasAmbassadorAccess
              ? "ambassador"
              : hasGuruAccess
                ? "guru"
                : "customer";

        setLoadedUser({
          id: activeUser.id,
          email: activeEmail,
          name: getProfileName(profile, activeEmail),
          avatarUrl: getProfileAvatar(profile),
          role: rawRole,
          hasCustomerAccess,
          hasGuruAccess,
          hasAmbassadorAccess,
          hasAdminAccess,
          guruStatus: getGuruStatus(guru),
          ambassadorStatus: getAmbassadorStatus(ambassador),
        });
      } catch (error) {
        console.error("Header user load failed:", error);
        if (mounted) setLoadedUser(null);
      } finally {
        if (mounted) setLoadingUser(false);
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
      window.setTimeout(() => loadActiveUser(), 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [user, pathname]);

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
  const headerMode = getHeaderMode({ pathname, isLoggedIn, storedRole });

  const isCustomer = headerMode === "customer";
  const isGuru = headerMode === "guru";
  const isAmbassador = headerMode === "ambassador";
  const isAdmin = headerMode === "admin";

  const hasCustomerAccess = Boolean(activeUser?.hasCustomerAccess);
  const hasGuruAccess = Boolean(activeUser?.hasGuruAccess);
  const hasAmbassadorAccess = Boolean(activeUser?.hasAmbassadorAccess);
  const hasAdminAccess = Boolean(activeUser?.hasAdminAccess);

  const roleSwitchLinks = buildRoleSwitchLinks({
    headerMode,
    hasCustomerAccess,
    hasGuruAccess,
    hasAmbassadorAccess,
    hasAdminAccess,
    guruStatus: activeUser?.guruStatus,
  });
  const navLinks = useMemo(() => {
    if (isAdmin) return adminNavLinks;
    if (isAmbassador) return ambassadorNavLinks;
    if (isGuru) return guruNavLinks;
    if (isCustomer) return customerNavLinks;
    return publicNavLinks;
  }, [isAdmin, isAmbassador, isCustomer, isGuru]);

  const bookingsHref = isGuru
    ? "/guru/dashboard/bookings"
    : "/customer/dashboard/bookings";
  const resourcesHref = isGuru
    ? "/guru/success-center"
    : "/customer/dashboard/pawperks";

  const displayRole = isGuru
    ? "SitGuru Guru"
    : isAdmin
      ? "SitGuru Admin"
      : isAmbassador
        ? "SitGuru Ambassador"
        : "SitGuru Pet Parent";

  const logoHref = "/";
  const userName = activeUser?.name || (isAdmin ? "Admin HQ" : "My Account");
  const userEmail = activeUser?.email || "";
  const userAvatarUrl = normalizeAvatarUrl(activeUser?.avatarUrl);
  const userInitials = getInitials(userName, userEmail);

  const accountMenuLinks: NavLink[] = isGuru
    ? [
        { label: "Dashboard", href: "/guru/dashboard" },
        { label: "Pricing Workspace", href: "/guru/dashboard/pricing" },
        { label: "Update Guru Profile", href: "/guru/dashboard/profile" },
        { label: "Bookings", href: "/guru/dashboard/bookings" },
        { label: "Referrals", href: "/guru/dashboard/referrals" },
        { label: "Messages", href: "/guru/dashboard/messages" },
        { label: "Availability", href: "/guru/dashboard/availability" },
        { label: "Earnings", href: "/guru/dashboard/earnings" },
        { label: "Guru Success Center", href: "/guru/success-center" },
      ]
    : isAmbassador
      ? [
          { label: "Dashboard", href: "/ambassador/dashboard" },
          { label: "Referrals", href: "/ambassador/dashboard/referrals" },
          { label: "Earnings", href: "/ambassador/dashboard/earnings" },
          { label: "Support", href: "mailto:support@sitguru.com" },
          { label: "Training", href: "/ambassador/dashboard/training" },
          {
            label: "Onboarding",
            href: "/ambassador/dashboard/onboarding-packet",
          },
        ]
      : isAdmin
        ? [
            { label: "Dashboard", href: "/admin" },
            { label: "Update Profile", href: "/admin/profile" },
            { label: "Messages", href: "/admin/messages" },
            { label: "Pet Parents", href: "/admin/customers" },
            { label: "Gurus", href: "/admin/gurus" },
            { label: "Ambassadors", href: "/admin/ambassadors" },
            { label: "Referrals", href: "/admin/referrals" },
          ]
        : [
            { label: "Dashboard", href: "/customer/dashboard" },
            {
              label: "Update Pet Parent Profile",
              href: "/customer/dashboard/profile",
            },
            { label: "My Care", href: "/customer/dashboard/bookings" },
            { label: "My Pets", href: "/customer/pets" },
            { label: "Messages", href: "/messages" },
            { label: "PawPerks", href: "/customer/dashboard/pawperks" },
          ];

  const isActive = (href: string) => {
    const path = pathname || "";
    if (href === "/") return path === "/";
    if (href === "/customer/dashboard") return path === "/customer/dashboard";
    if (href === "/guru/dashboard") return path === "/guru/dashboard";
    if (href === "/ambassador/dashboard")
      return path === "/ambassador/dashboard";
    if (href === "/admin") return path === "/admin";
    const aliases = getActiveAliases(href);
    return aliases.some((alias) => pathMatches(path, alias));
  };

  async function handleLogout() {
    setLoadedUser(null);
    setAvatarOpen(false);
    setMobileOpen(false);
    clearSitGuruAuthStorage();
    try {
      const { error } = await supabase.auth.signOut();
      if (error) console.error("Supabase logout failed:", error.message);
    } catch (error) {
      console.error("Logout failed:", error);
    }
    try {
      await fetch("/auth/signout", { method: "POST" });
    } catch {
      // Optional endpoint. Continue even if it does not exist.
    }
    router.replace("/");
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
        className={`flex ${sizeClass} shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-white text-sm font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100`}
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
    <header className="sg-site-header sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 shadow-[0_6px_22px_rgba(15,23,42,0.04)] backdrop-blur">
      <div className="mx-auto flex h-[84px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
        <Link
          href={logoHref}
          className="inline-flex h-14 w-[200px] shrink-0 items-center justify-start rounded-2xl transition hover:opacity-90 sm:w-[230px] lg:h-16 lg:w-[260px]"
          aria-label="Go to SitGuru homepage"
        >
          <Image
            src="/images/sitguru-logo-cropped.png"
            alt="SitGuru"
            width={260}
            height={90}
            priority
            className="h-auto max-h-12 w-auto object-contain lg:max-h-14"
          />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-3 xl:flex 2xl:gap-5">
          {navLinks.map((link) => {
            const active = isActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative pb-5 text-[13px] font-semibold tracking-[-0.015em] transition 2xl:text-[15px] ${active ? "text-slate-950" : "text-slate-700 hover:text-emerald-700"}`}
              >
                {link.label}
                {active ? (
                  <span className="absolute bottom-0 left-0 h-[3px] w-full rounded-full bg-emerald-500" />
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="hidden items-center gap-3 xl:flex">
          {loadingUser ? (
            <div className="h-11 w-48 animate-pulse rounded-full bg-slate-100" />
          ) : isLoggedIn ? (
            <>
              {roleSwitchLinks.length ? (
                <details className="group relative hidden xl:block">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-100 [&::-webkit-details-marker]:hidden">
                    <Repeat2 className="h-4 w-4" />
                    Switch Dashboard
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
                  </summary>

                  <div className="absolute right-0 top-full z-50 mt-3 w-72 overflow-hidden rounded-3xl border border-slate-200 bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)]">
                    <p className="px-3 py-2 text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                      Switch Dashboard
                    </p>

                    <div className="grid gap-1">
                      {roleSwitchLinks.map((link) => (
                        <Link
                          key={`desktop-switch-${link.href}`}
                          href={link.href}
                          className="flex items-center justify-between gap-3 rounded-2xl px-3 py-3 text-sm font-black text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-800"
                        >
                          <span className="inline-flex items-center gap-2">
                            <Repeat2 className="h-4 w-4 text-emerald-700" />
                            {link.label}
                          </span>
                          <ArrowRight className="h-4 w-4 text-slate-400" />
                        </Link>
                      ))}
                    </div>
                  </div>
                </details>
              ) : null}

              {isGuru ? (
                <Link
                  href={resourcesHref}
                  className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold tracking-[-0.01em] text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 xl:inline-flex"
                >
                  <BookOpen className="h-4 w-4 text-sky-500" />
                  Guru Success Center
                </Link>
              ) : null}

              {isCustomer ? (
                <Link
                  href={bookingsHref}
                  className="hidden items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold tracking-[-0.01em] text-slate-950 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 xl:inline-flex"
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
                  <span className="hidden max-w-[120px] truncate text-sm font-semibold tracking-[-0.01em] text-slate-950 xl:block">
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
                          <p className="truncate text-xl font-semibold leading-tight tracking-[-0.025em] text-slate-950">
                            {userName}
                          </p>
                          {userEmail ? (
                            <p className="mt-1 truncate text-sm font-medium text-slate-500">
                              {userEmail}
                            </p>
                          ) : null}
                          <p className="mt-1 text-base font-semibold tracking-[-0.01em] text-emerald-700">
                            {displayRole}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-1 p-3">
                      {roleSwitchLinks.length ? (
                        <div className="mb-1 rounded-2xl border border-emerald-100 bg-emerald-50 p-2">
                          <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                            Switch Portal
                          </p>
                          {roleSwitchLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              role="menuitem"
                              onClick={() => setAvatarOpen(false)}
                              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-emerald-900 transition hover:bg-white"
                            >
                              <Repeat2 className="h-4 w-4" />
                              {link.label}
                            </Link>
                          ))}
                        </div>
                      ) : null}

                      {accountMenuLinks.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          role="menuitem"
                          onClick={() => setAvatarOpen(false)}
                          className="rounded-2xl px-4 py-3 text-[15px] font-semibold tracking-[-0.01em] text-slate-800 transition hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          {item.label}
                        </Link>
                      ))}

                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="mt-2 flex items-center gap-3 rounded-2xl bg-emerald-600 px-4 py-4 text-left text-[15px] font-semibold tracking-[-0.01em] text-white transition hover:bg-emerald-700"
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
                href="/login?mode=phone"
                className="rounded-full border border-emerald-200 bg-white px-5 py-3 text-center text-sm font-semibold tracking-[-0.01em] text-slate-800 shadow-sm transition hover:bg-emerald-50"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="rounded-full bg-emerald-600 px-5 py-3 text-center text-sm font-semibold tracking-[-0.01em] text-white shadow-md transition hover:bg-emerald-700"
              >
                Sign Up Free
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((value) => !value)}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700 transition hover:bg-emerald-100 xl:hidden"
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {mobileOpen ? (
        <div className="border-t border-slate-200 bg-white px-4 py-4 xl:hidden">
          <div className="mx-auto grid max-w-[1440px] gap-2">
            {isLoggedIn ? (
              <div className="mb-2 rounded-2xl bg-emerald-50 p-4 ring-1 ring-emerald-100">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    {renderAvatar("h-12 w-12")}
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold tracking-[-0.01em] text-slate-950">
                        {userName}
                      </p>
                      <p className="text-sm font-semibold tracking-[-0.01em] text-emerald-700">
                        {displayRole}
                      </p>
                    </div>
                  </div>
                  <NotificationBell />
                </div>
              </div>
            ) : null}

            {roleSwitchLinks.length ? (
              <div className="mb-1 rounded-2xl border border-emerald-100 bg-emerald-50 p-2">
                <p className="px-2 pb-1 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700">
                  Switch Portal
                </p>
                {roleSwitchLinks.map((link) => (
                  <Link
                    key={`mobile-switch-${link.href}`}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold tracking-[-0.01em] text-emerald-800 transition hover:bg-white"
                  >
                    <Repeat2 className="h-4 w-4" />
                    {link.label}
                  </Link>
                ))}
              </div>
            ) : null}

            {navLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`rounded-xl px-4 py-3 text-sm font-semibold tracking-[-0.01em] transition ${isActive(item.href) ? "bg-emerald-50 text-emerald-700" : "text-slate-700 hover:bg-slate-50 hover:text-slate-950"}`}
              >
                {item.label}
              </Link>
            ))}

            {!isLoggedIn ? (
              <div className="my-2 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                  Join SitGuru free
                </p>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">
                  Find trusted local pet care, become a Pet Guru, or explore
                  Student, Community, and Military programs.
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <Link
                    href="/signup"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl bg-emerald-600 px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-emerald-700"
                  >
                    Sign Up Free
                  </Link>
                  <Link
                    href={PUBLIC_GURU_SEARCH_HREF}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-center text-sm font-bold text-emerald-800 transition hover:bg-emerald-50"
                  >
                    Search Gurus
                  </Link>
                </div>
              </div>
            ) : null}

            {isLoggedIn ? (
              <>
                {accountMenuLinks.map((item) => (
                  <Link
                    key={`mobile-${item.href}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold tracking-[-0.01em] text-slate-700 transition hover:bg-slate-50 hover:text-slate-950"
                  >
                    {item.label}
                  </Link>
                ))}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="mt-2 flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-left text-sm font-semibold tracking-[-0.01em] text-white transition hover:bg-emerald-700"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </button>
              </>
            ) : (
              <div className="mt-4 grid gap-2 rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-3 shadow-sm">
                <Link
                  href="/login?mode=phone"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black tracking-[-0.01em] text-emerald-900 shadow-sm transition hover:bg-emerald-50"
                >
                  Log In
                </Link>

                <Link
                  href="/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-12 items-center justify-center rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-black tracking-[-0.01em] text-white shadow-md transition hover:bg-emerald-700"
                >
                  Sign Up Free
                </Link>
              </div>
            )}
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        .sg-site-header {
          font-family:
            Inter,
            ui-sans-serif,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }
        .sg-site-header *,
        .sg-site-header a,
        .sg-site-header button,
        .sg-site-header span,
        .sg-site-header p {
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
        .sg-site-header a:hover {
          text-decoration: none;
        }
      `}</style>
    </header>
  );
}
