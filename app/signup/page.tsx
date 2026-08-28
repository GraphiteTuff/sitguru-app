"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Apple,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  HeartHandshake,
  Loader2,
  Link2,
  Mail,
  Megaphone,
  PawPrint,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { authorizedRolesFromSignupIntent } from "@/lib/dashboard/role-switch";

const BRAND_GREEN = "#0D5C3A";

const fieldClassName =
  "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const fieldWithIconClassName =
  "w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-4 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100";

const primaryButtonClassName =
  "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0D5C3A] px-5 py-4 text-sm font-black !text-white shadow-lg shadow-emerald-900/20 transition hover:bg-[#0a4a2e] disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500 disabled:shadow-none";

type AccountIntent = "pet_parent" | "guru" | "ambassador" | "both";
type SignupProfileRole = "customer" | "guru" | "ambassador" | "both";
type SignupMode = "email" | "phone";

type SignupTracking = {
  program: string;
  source: string;
  platform: string;
  medium: string;
  campaign: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
};

const accountOptions: {
  key: AccountIntent;
  title: string;
  description: string;
  badge: string;
  panelTitle: string;
  panelCopy: string;
}[] = [
  {
    key: "pet_parent",
    title: "Pet Parent",
    description: "Book trusted local Gurus for walks, sitting, and drop-ins.",
    badge: "Book care",
    panelTitle: "Find care for your pets",
    panelCopy:
      "Create a Pet Parent account, add your pets, and book trusted local Gurus when you need help.",
  },
  {
    key: "guru",
    title: "Future Guru",
    description: "Apply to offer trusted pet care in your community.",
    badge: "Earn with care",
    panelTitle: "Start earning as a Guru",
    panelCopy:
      "Create your Future Guru account now. Finish services, pricing, and availability from your dashboard before you go bookable.",
  },
  {
    key: "ambassador",
    title: "Ambassador",
    description: "Share SitGuru and grow referrals nearby.",
    badge: "Promote SitGuru",
    panelTitle: "Grow with SitGuru",
    panelCopy:
      "Create your Ambassador account, keep referral tracking connected, and continue onboarding from your dashboard.",
  },
];

function RoleIcon({ intent }: { intent: AccountIntent }) {
  if (intent === "guru") return <PawPrint className="h-4 w-4" />;
  if (intent === "ambassador") return <Megaphone className="h-4 w-4" />;
  return <HeartHandshake className="h-4 w-4" />;
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 10);

  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;

  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function phoneDigits(value: string) {
  return value.replace(/\D/g, "").slice(0, 10);
}

function toE164UsPhone(value: string) {
  const digits = phoneDigits(value);
  if (digits.length !== 10) return "";
  return `+1${digits}`;
}

function sanitizeNameInput(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function getNameParts(value: string) {
  const cleanName = sanitizeNameInput(value);
  const parts = cleanName.split(" ").filter(Boolean);
  const firstName = parts[0] || "";
  const lastName = parts.slice(1).join(" ");

  return { cleanName, firstName, lastName, parts };
}

function isLikelyPlaceholderName(value: string) {
  const cleanName = sanitizeNameInput(value).toLowerCase();
  const compactName = cleanName.replace(/[^a-z]/g, "");

  if (!cleanName) return true;

  const blockedValues = new Set([
    "asdf",
    "asdasd",
    "asdfasdf",
    "qwerty",
    "qwerty qwerty",
    "test",
    "test test",
    "testing",
    "tester",
    "fake",
    "fake name",
    "none",
    "no name",
    "na",
    "n/a",
    "unknown",
    "sample",
    "demo",
    "user",
    "new user",
  ]);

  if (blockedValues.has(cleanName)) return true;
  if (/^(.)\1{3,}$/.test(compactName)) return true;
  if (/^(ab|abc|asdf|qwer|test|fake)+$/.test(compactName)) return true;

  return false;
}

function isValidFullName(value: string) {
  const { cleanName, parts } = getNameParts(value);

  if (isLikelyPlaceholderName(cleanName)) return false;
  if (parts.length < 2) return false;

  return parts.every((part) => {
    const lettersOnly = part.replace(/[^a-zA-Z]/g, "");
    return lettersOnly.length >= 2;
  });
}

function isValidEmailAddress(value: string) {
  const cleanEmail = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return false;

  const [localPart, domain = ""] = cleanEmail.split("@");
  const normalizedLocal = localPart.replace(/[^a-z0-9]/g, "");
  const normalizedDomain = domain.toLowerCase();

  const blockedLocals = new Set([
    "test",
    "testing",
    "tester",
    "fake",
    "sample",
    "demo",
    "asdf",
    "qwerty",
    "user",
  ]);

  const blockedDomains = new Set([
    "example.com",
    "example.org",
    "example.net",
    "test.com",
    "mailinator.com",
    "tempmail.com",
    "temporary-mail.net",
    "10minutemail.com",
    "guerrillamail.com",
  ]);

  if (blockedLocals.has(normalizedLocal)) return false;
  if (blockedDomains.has(normalizedDomain)) return false;
  if (/^(.)\1{4,}$/.test(normalizedLocal)) return false;

  return true;
}

function isValidZipCode(value: string) {
  return /^\d{5}$/.test(value.trim());
}

function normalizeReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 64);
}

function isValidReferralCodeFormat(value: string) {
  if (!value) return true;
  return /^[A-Z0-9_-]{2,64}$/.test(value);
}

function getCookieValue(name: string) {
  if (typeof document === "undefined") return "";

  const prefix = `${encodeURIComponent(name)}=`;
  const cookie = document.cookie
    .split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(prefix));

  if (!cookie) return "";

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return cookie.slice(prefix.length);
  }
}

function normalizeTrackingValue(value: string | null | undefined) {
  return (value || "").trim().slice(0, 160);
}

function buildAuthCallbackUrl({
  origin,
  nextPath,
  intent,
  referralCode,
  tracking,
}: {
  origin: string;
  nextPath: string;
  intent: AccountIntent;
  referralCode: string;
  tracking: SignupTracking;
}) {
  const params = new URLSearchParams({
    next: nextPath,
    intent,
  });

  if (referralCode) {
    params.set("referral_code", referralCode);
    params.set("ambassador_referral_code", referralCode);
    params.set("ambassador_code", referralCode);
    params.set("ref", referralCode);
  }

  if (tracking.program) params.set("program", tracking.program);
  if (tracking.source) params.set("source", tracking.source);
  if (tracking.platform) params.set("platform", tracking.platform);
  if (tracking.medium) params.set("medium", tracking.medium);
  if (tracking.campaign) params.set("campaign", tracking.campaign);
  if (tracking.utmSource) params.set("utm_source", tracking.utmSource);
  if (tracking.utmMedium) params.set("utm_medium", tracking.utmMedium);
  if (tracking.utmCampaign) params.set("utm_campaign", tracking.utmCampaign);
  if (tracking.utmContent) params.set("utm_content", tracking.utmContent);

  return `${origin}/auth/callback?${params.toString()}`;
}

function getRedirectPath(intent: AccountIntent) {
  if (intent === "guru" || intent === "both") return "/guru/dashboard/profile";
  if (intent === "ambassador") return "/ambassador/dashboard";
  return "/customer/dashboard";
}

function getSafeSignupNextPath(nextValue: string | null, intent: AccountIntent) {
  if (!nextValue) return null;

  try {
    const decoded = decodeURIComponent(nextValue).trim();
    if (!decoded.startsWith("/")) return null;
    if (decoded.startsWith("//")) return null;
    if (decoded.includes("://")) return null;
    if (decoded.startsWith("/admin")) return null;
    if (decoded.startsWith("/auth/")) return null;
    if (decoded.startsWith("/signup")) return null;

    const isCommunityReturn =
      decoded.startsWith("/community/") || decoded === "/community";

    if (isCommunityReturn) {
      return decoded;
    }

    if (intent === "pet_parent" || intent === "both") {
      if (
        decoded.startsWith("/customer/") ||
        decoded.startsWith("/search") ||
        decoded.startsWith("/find-care")
      ) {
        return decoded;
      }
    }

    if (intent === "guru" || intent === "both") {
      if (decoded.startsWith("/guru/")) return decoded;
    }

    if (intent === "ambassador") {
      if (decoded.startsWith("/ambassador/")) return decoded;
    }

    return null;
  } catch {
    return null;
  }
}

function getIntentLabel(intent: AccountIntent) {
  if (intent === "guru") return "Future Guru";
  if (intent === "both") return "Pet Parent + Future Guru";
  if (intent === "ambassador") return "Ambassador";
  return "Pet Parent";
}

function getProfileRoleFromIntent(intent: AccountIntent): SignupProfileRole {
  if (intent === "guru") return "guru";
  if (intent === "ambassador") return "ambassador";
  if (intent === "both") return "both";
  return "customer";
}

function shouldCreateGuruProfile(intent: AccountIntent) {
  return intent === "guru" || intent === "both";
}

async function provisionSignupAccount(payload: {
  userId: string;
  intent: AccountIntent;
  fullName: string;
  email?: string;
  phone?: string;
  zipCode: string;
  serviceArea: string;
  referralCode?: string;
  referralSource?: string;
  referralPlatform?: string;
  referralMedium?: string;
  referralCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  source: string;
}) {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    console.warn("Signup session lookup failed before provisioning:", sessionError);
  }

  const headers = new Headers({
    "Content-Type": "application/json",
  });

  if (session?.access_token) {
    headers.set("Authorization", `Bearer ${session.access_token}`);
  }

  const response = await fetch("/api/auth/provision-signup", {
    method: "POST",
    headers,
    body: JSON.stringify({
      ...payload,
      referralCode: payload.referralCode || null,
      // Backward compatibility while the provisioning route is upgraded.
      ambassadorReferralCode: payload.referralCode || null,
    }),
  });

  const result = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        message?: string;
        workspaceReady?: boolean;
        referralCode?: string | null;
      }
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Your account was created, but SitGuru could not finish setting up your workspace. Please sign in again or contact SitGuru support.",
    );
  }

  if (payload.intent === "ambassador" && result.workspaceReady !== true) {
    throw new Error(
      "Your account was created, but the Ambassador workspace could not be verified. Please sign in again or contact SitGuru support.",
    );
  }

  return result;
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startingIntent = useMemo<AccountIntent>(() => {
    const role =
      searchParams.get("role")?.toLowerCase() ||
      searchParams.get("type")?.toLowerCase() ||
      "";

    if (role === "guru" || role === "future_guru") return "guru";
    if (role === "ambassador" || role === "partner") return "ambassador";
    if (role === "both") return "both";

    return "pet_parent";
  }, [searchParams]);

  const trackingFromUrl = useMemo<SignupTracking>(() => {
    const medium =
      searchParams.get("medium") ||
      searchParams.get("referral_medium") ||
      searchParams.get("via") ||
      searchParams.get("utm_medium");

    return {
      program: normalizeTrackingValue(searchParams.get("program")),
      source: normalizeTrackingValue(
        searchParams.get("source") || searchParams.get("referral_source"),
      ),
      platform: normalizeTrackingValue(searchParams.get("platform")),
      medium: normalizeTrackingValue(medium),
      campaign: normalizeTrackingValue(
        searchParams.get("campaign") || searchParams.get("referral_campaign"),
      ),
      utmSource: normalizeTrackingValue(searchParams.get("utm_source")),
      utmMedium: normalizeTrackingValue(
        searchParams.get("utm_medium") || medium,
      ),
      utmCampaign: normalizeTrackingValue(searchParams.get("utm_campaign")),
      utmContent: normalizeTrackingValue(searchParams.get("utm_content")),
    };
  }, [searchParams]);

  const [signupTracking, setSignupTracking] =
    useState<SignupTracking>(trackingFromUrl);

  const [intent, setIntent] = useState<AccountIntent>(startingIntent);
  const [mode, setMode] = useState<SignupMode>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [referralCode, setReferralCode] = useState(
    normalizeReferralCode(
      searchParams.get("referral_code") ||
        searchParams.get("ambassador_referral_code") ||
        searchParams.get("ambassador_code") ||
        searchParams.get("ref") ||
        searchParams.get("code") ||
        "",
    ),
  );
  const [password, setPassword] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [smsRemindersOptIn, setSmsRemindersOptIn] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showReferralField, setShowReferralField] = useState(
    Boolean(
      normalizeReferralCode(
        searchParams.get("referral_code") ||
          searchParams.get("ambassador_referral_code") ||
          searchParams.get("ambassador_code") ||
          searchParams.get("ref") ||
          searchParams.get("code") ||
          "",
      ),
    ),
  );

  useEffect(() => {
    const urlReferralCode = normalizeReferralCode(
      searchParams.get("referral_code") ||
        searchParams.get("ambassador_referral_code") ||
        searchParams.get("ambassador_code") ||
        searchParams.get("ref") ||
        searchParams.get("code") ||
        "",
    );

    const cookieReferralCode = normalizeReferralCode(
      getCookieValue("sitguru_referral_code") ||
        getCookieValue("sitguru_ambassador_code"),
    );

    const storedReferralCode =
      typeof window !== "undefined"
        ? normalizeReferralCode(
            window.localStorage.getItem("sitguru_referral_code") ||
              window.localStorage.getItem("sitguru_ambassador_code") ||
              "",
          )
        : "";

    const resolvedReferralCode =
      urlReferralCode || cookieReferralCode || storedReferralCode;

    if (resolvedReferralCode) {
      setReferralCode((current) => current || resolvedReferralCode);

      try {
        window.localStorage.setItem(
          "sitguru_referral_code",
          resolvedReferralCode,
        );
      } catch {
        // Local storage may be unavailable in private browsing.
      }
    }

    setSignupTracking((current) => ({
      program:
        current.program ||
        normalizeTrackingValue(getCookieValue("sitguru_referral_program")),
      source:
        current.source ||
        normalizeTrackingValue(getCookieValue("sitguru_referral_source")),
      platform:
        current.platform ||
        normalizeTrackingValue(getCookieValue("sitguru_referral_platform")),
      medium:
        current.medium ||
        normalizeTrackingValue(getCookieValue("sitguru_referral_medium")),
      campaign:
        current.campaign ||
        normalizeTrackingValue(getCookieValue("sitguru_referral_campaign")),
      utmSource:
        current.utmSource ||
        normalizeTrackingValue(getCookieValue("sitguru_utm_source")),
      utmMedium:
        current.utmMedium ||
        normalizeTrackingValue(
          getCookieValue("sitguru_utm_medium") ||
            getCookieValue("sitguru_referral_medium"),
        ),
      utmCampaign:
        current.utmCampaign ||
        normalizeTrackingValue(getCookieValue("sitguru_utm_campaign")),
      utmContent:
        current.utmContent ||
        normalizeTrackingValue(getCookieValue("sitguru_utm_content")),
    }));
  }, [searchParams]);

  useEffect(() => {
    if (!referralCode || typeof window === "undefined") return;

    try {
      window.localStorage.setItem("sitguru_referral_code", referralCode);
    } catch {
      // Local storage may be unavailable in private browsing.
    }
  }, [referralCode]);

  const redirectPath =
    getSafeSignupNextPath(
      searchParams.get("next") || searchParams.get("redirect"),
      intent,
    ) || getRedirectPath(intent);
  const intentLabel = getIntentLabel(intent);
  const selectedAccount =
    accountOptions.find((option) => option.key === intent) || accountOptions[0];
  const communitySignup =
    redirectPath.startsWith("/community/") || redirectPath === "/community";
  const communityPanelTitle = communitySignup
    ? intent === "guru"
      ? "Create your Pet Guru account in minutes."
      : intent === "ambassador"
        ? "Create your Ambassador account in minutes."
        : "Create your free Pet Parent account in minutes."
    : selectedAccount.panelTitle;
  const communityPanelCopy = communitySignup
    ? intent === "guru"
      ? "Show up at community events, connect with local pet parents, and grow your Guru presence. After you join, we'll take you right back to your event."
      : intent === "ambassador"
        ? "RSVP at local events, grow the SitGuru community, and earn while you connect. After you join, we'll take you right back to your event."
        : "RSVP to community events, meet local Gurus, and keep pet care in one place. After you join, we'll take you right back to your event."
    : selectedAccount.panelCopy;
  const needsServiceArea =
    intent === "guru" || intent === "both" || intent === "ambassador";
  const emailSignupSource = signupTracking.source || "sitguru_signup_page";
  const phoneSignupSource = signupTracking.source || "sitguru_phone_signup";
  const loginHref = communitySignup
    ? `/login?role=${
        intent === "guru"
          ? "guru"
          : intent === "ambassador"
            ? "ambassador"
            : "pet_parent"
      }&next=${encodeURIComponent(redirectPath)}`
    : `/login?role=${
        intent === "guru"
          ? "guru"
          : intent === "ambassador"
            ? "ambassador"
            : "pet_parent"
      }`;

  useEffect(() => {
    if (referralCode && !showReferralField) {
      setShowReferralField(true);
    }
  }, [referralCode, showReferralField]);

  function resetAlerts() {
    setError("");
    setMessage("");
  }

  function handleIntentChange(nextIntent: AccountIntent) {
    resetAlerts();
    setIntent(nextIntent);
    setPhoneCodeSent(false);

    try {
      const params = new URLSearchParams(searchParams.toString());
      const roleParam =
        nextIntent === "guru"
          ? "guru"
          : nextIntent === "ambassador"
            ? "ambassador"
            : nextIntent === "both"
              ? "pet_parent"
              : "pet_parent";
      params.set("role", roleParam);
      params.set("intent", nextIntent);
      router.replace(`/signup?${params.toString()}`, { scroll: false });
    } catch {
      // URL sync is best-effort for One-Tap role continuity.
    }
  }

  function handleModeChange(nextMode: SignupMode) {
    resetAlerts();
    setMode(nextMode);
    setPhoneCodeSent(false);
  }

  async function handleGoogleSignup() {
    try {
      resetAlerts();
      setGoogleLoading(true);

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.sitguru.com";

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildAuthCallbackUrl({
            origin,
            nextPath: redirectPath,
            intent,
            referralCode: normalizeReferralCode(
              referralCode,
            ),
            tracking: signupTracking,
          }),
          queryParams: {
            prompt: "select_account",
          },
        },
      });

      if (oauthError) throw oauthError;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Google signup could not start. Please try again.",
      );
      setGoogleLoading(false);
    }
  }

  async function handleEmailSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    try {
      resetAlerts();

      const { cleanName, firstName, lastName } = getNameParts(fullName);
      const cleanEmail = email.trim().toLowerCase();
      const normalizedOptionalPhone = phone.trim()
        ? toE164UsPhone(phone)
        : "";
      const cleanZipCode = zipCode.trim();
      const profileRole = getProfileRoleFromIntent(intent);
      const cleanReferralCode = normalizeReferralCode(
        referralCode,
      );

      if (!isValidReferralCodeFormat(cleanReferralCode)) {
        setError(
          "Please enter a valid referral code using 2–64 letters, numbers, hyphens, or underscores.",
        );
        return;
      }
      if (!isValidFullName(cleanName)) {
        setError("Please enter your real first and last name.");
        return;
      }

      if (!isValidEmailAddress(cleanEmail)) {
        setError("Please enter a valid personal email address.");
        return;
      }

      if (phone.trim() && !normalizedOptionalPhone) {
        setError("Please enter a valid 10-digit mobile number or leave it blank.");
        return;
      }

      if (!isValidZipCode(cleanZipCode)) {
        setError("Please enter a valid 5-digit ZIP code.");
        return;
      }

      if (password.length < 6) {
        setError("Please use a password with at least 6 characters.");
        return;
      }

      if (!acceptedTerms) {
        setError("Please accept the SitGuru terms before creating your account.");
        return;
      }

      setLoading(true);

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.sitguru.com";

      const { data, error: signupError } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          emailRedirectTo: buildAuthCallbackUrl({
            origin,
            nextPath: redirectPath,
            intent,
            referralCode: cleanReferralCode,
            tracking: signupTracking,
          }),
          data: {
            full_name: cleanName,
            first_name: firstName,
            last_name: lastName,
            role: profileRole,
            account_type: profileRole,
            signup_role: profileRole,
            account_intent: intent,
            authorizedRoles: authorizedRolesFromSignupIntent(intent),
            authorized_roles: authorizedRolesFromSignupIntent(intent),
            signup_source: emailSignupSource,
            signup_status: "pending_email_verification",
            phone: normalizedOptionalPhone || null,
            transactional_sms_opt_in:
              Boolean(normalizedOptionalPhone) && smsRemindersOptIn,
            sms_opt_in:
              Boolean(normalizedOptionalPhone) && smsRemindersOptIn,
            sms_consent:
              Boolean(normalizedOptionalPhone) && smsRemindersOptIn,
            sms_consent_at:
              normalizedOptionalPhone && smsRemindersOptIn
                ? new Date().toISOString()
                : null,
            phone_notifications_enabled:
              Boolean(normalizedOptionalPhone) && smsRemindersOptIn,
            zip_code: cleanZipCode,
            service_area: serviceArea.trim() || cleanZipCode,
            referral_code: cleanReferralCode || null,
            ambassador_referral_code: cleanReferralCode || null,
            referral_attribution_status: cleanReferralCode
              ? "pending_validation"
              : null,
            ambassador_program: signupTracking.program || null,
            referral_program: signupTracking.program || null,
            referral_source: signupTracking.source || null,
            referral_platform: signupTracking.platform || null,
            referral_medium: signupTracking.medium || null,
            referral_campaign: signupTracking.campaign || null,
            utm_source: signupTracking.utmSource || null,
            utm_medium:
              signupTracking.utmMedium || signupTracking.medium || null,
            utm_campaign: signupTracking.utmCampaign || null,
            utm_content: signupTracking.utmContent || null,
          },
        },
      });

      if (signupError) throw signupError;

      const userId = data.user?.id;

      if (userId) {
        await provisionSignupAccount({
          userId,
          intent,
          fullName: cleanName,
          email: cleanEmail,
          phone: normalizedOptionalPhone || undefined,
          zipCode: cleanZipCode,
          serviceArea: serviceArea.trim() || cleanZipCode,
          referralCode: cleanReferralCode || undefined,
          referralSource: signupTracking.source || undefined,
          referralPlatform: signupTracking.platform || undefined,
          referralMedium:
            signupTracking.medium || signupTracking.utmMedium || undefined,
          referralCampaign:
            signupTracking.campaign ||
            signupTracking.utmCampaign ||
            undefined,
          utmSource: signupTracking.utmSource || undefined,
          utmMedium:
            signupTracking.utmMedium || signupTracking.medium || undefined,
          utmCampaign: signupTracking.utmCampaign || undefined,
          utmContent: signupTracking.utmContent || undefined,
          source: emailSignupSource,
        });
      }
      setMessage(
        intent === "ambassador"
          ? "Your Ambassador account and workspace were created. Please check your email to confirm your SitGuru account and continue onboarding."
          : shouldCreateGuruProfile(intent)
            ? "Account created. Please check your email, then continue to your Guru profile setup."
            : "Account created. Please check your email to confirm your SitGuru account.",
      );
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Something went wrong creating your account.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSendPhoneCode() {
    try {
      resetAlerts();

      const { cleanName, firstName, lastName } = getNameParts(fullName);
      const cleanZipCode = zipCode.trim();
      const normalizedPhone = toE164UsPhone(phone);
      const cleanOptionalEmail = email.trim().toLowerCase();
      const profileRole = getProfileRoleFromIntent(intent);
      const cleanReferralCode = normalizeReferralCode(
        referralCode,
      );

      if (!isValidReferralCodeFormat(cleanReferralCode)) {
        setError(
          "Please enter a valid referral code using 2–64 letters, numbers, hyphens, or underscores.",
        );
        return;
      }
      if (!isValidFullName(cleanName)) {
        setError("Please enter your real first and last name before requesting a phone code.");
        return;
      }

      if (!normalizedPhone) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      if (cleanOptionalEmail && !isValidEmailAddress(cleanOptionalEmail)) {
        setError("Please enter a valid email address or leave it blank.");
        return;
      }

      if (!isValidZipCode(cleanZipCode)) {
        setError("Please enter a valid 5-digit ZIP code.");
        return;
      }

      if (!acceptedTerms) {
        setError("Please accept the SitGuru terms before requesting a phone code.");
        return;
      }

      setPhoneLoading(true);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          data: {
            full_name: cleanName,
            first_name: firstName,
            last_name: lastName,
            role: profileRole,
            account_type: profileRole,
            signup_role: profileRole,
            account_intent: intent,
            authorizedRoles: authorizedRolesFromSignupIntent(intent),
            authorized_roles: authorizedRolesFromSignupIntent(intent),
            signup_source: phoneSignupSource,
            signup_status: "pending_phone_verification",
            email: cleanOptionalEmail || null,
            transactional_sms_opt_in: true,
            sms_opt_in: true,
            sms_consent: true,
            sms_consent_at: new Date().toISOString(),
            phone_notifications_enabled: true,
            zip_code: cleanZipCode,
            service_area: serviceArea.trim() || cleanZipCode,
            referral_code: cleanReferralCode || null,
            ambassador_referral_code: cleanReferralCode || null,
            referral_attribution_status: cleanReferralCode
              ? "pending_validation"
              : null,
            ambassador_program: signupTracking.program || null,
            referral_program: signupTracking.program || null,
            referral_source: signupTracking.source || null,
            referral_platform: signupTracking.platform || null,
            referral_medium: signupTracking.medium || null,
            referral_campaign: signupTracking.campaign || null,
            utm_source: signupTracking.utmSource || null,
            utm_medium:
              signupTracking.utmMedium || signupTracking.medium || null,
            utm_campaign: signupTracking.utmCampaign || null,
            utm_content: signupTracking.utmContent || null,
          },
        },
      });

      if (otpError) throw otpError;

      setPhoneCodeSent(true);
      setMessage("We sent a 6-digit code to your phone.");
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not send the phone code. Please try again.",
      );
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyPhoneCode() {
    try {
      resetAlerts();

      const { cleanName, firstName, lastName } = getNameParts(fullName);
      const cleanZipCode = zipCode.trim();
      const normalizedPhone = toE164UsPhone(phone);
      const cleanOptionalEmail = email.trim().toLowerCase();
      const profileRole = getProfileRoleFromIntent(intent);
      const cleanReferralCode = normalizeReferralCode(
        referralCode,
      );

      if (!isValidReferralCodeFormat(cleanReferralCode)) {
        setError(
          "Please enter a valid referral code using 2–64 letters, numbers, hyphens, or underscores.",
        );
        return;
      }
      if (!isValidFullName(cleanName)) {
        setError("Please enter your real first and last name.");
        return;
      }

      if (!normalizedPhone) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      if (cleanOptionalEmail && !isValidEmailAddress(cleanOptionalEmail)) {
        setError("Please enter a valid email address or leave it blank.");
        return;
      }

      if (!isValidZipCode(cleanZipCode)) {
        setError("Please enter a valid 5-digit ZIP code.");
        return;
      }

      if (phoneCode.trim().length < 6) {
        setError("Please enter the 6-digit code.");
        return;
      }

      if (!acceptedTerms) {
        setError("Please accept the SitGuru terms before continuing.");
        return;
      }

      setPhoneLoading(true);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: phoneCode.trim(),
        type: "sms",
      });

      if (verifyError) throw verifyError;

      await supabase.auth.updateUser({
        data: {
          full_name: cleanName,
          first_name: firstName,
          last_name: lastName,
          role: profileRole,
          account_type: profileRole,
          signup_role: profileRole,
          account_intent: intent,
          authorizedRoles: authorizedRolesFromSignupIntent(intent),
          authorized_roles: authorizedRolesFromSignupIntent(intent),
          signup_source: phoneSignupSource,
          signup_status: "phone_verified",
          email: cleanOptionalEmail || null,
          transactional_sms_opt_in: true,
          sms_opt_in: true,
          sms_consent: true,
          sms_consent_at: new Date().toISOString(),
          phone_notifications_enabled: true,
          zip_code: cleanZipCode,
          service_area: serviceArea.trim() || cleanZipCode,
          referral_code: cleanReferralCode || null,
          ambassador_referral_code: cleanReferralCode || null,
          referral_attribution_status: cleanReferralCode
            ? "pending_validation"
            : null,
          ambassador_program: signupTracking.program || null,
          referral_program: signupTracking.program || null,
          referral_source: signupTracking.source || null,
          referral_platform: signupTracking.platform || null,
          referral_medium: signupTracking.medium || null,
          referral_campaign: signupTracking.campaign || null,
          utm_source: signupTracking.utmSource || null,
          utm_medium:
            signupTracking.utmMedium || signupTracking.medium || null,
          utm_campaign: signupTracking.utmCampaign || null,
          utm_content: signupTracking.utmContent || null,
        },
      });

      const userId = data.user?.id;

      if (userId) {
        await provisionSignupAccount({
          userId,
          intent,
          fullName: cleanName,
          email: cleanOptionalEmail || undefined,
          phone: normalizedPhone,
          zipCode: cleanZipCode,
          serviceArea: serviceArea.trim() || cleanZipCode,
          referralCode: cleanReferralCode || undefined,
          referralSource: signupTracking.source || undefined,
          referralPlatform: signupTracking.platform || undefined,
          referralMedium:
            signupTracking.medium || signupTracking.utmMedium || undefined,
          referralCampaign:
            signupTracking.campaign ||
            signupTracking.utmCampaign ||
            undefined,
          utmSource: signupTracking.utmSource || undefined,
          utmMedium:
            signupTracking.utmMedium || signupTracking.medium || undefined,
          utmCampaign: signupTracking.utmCampaign || undefined,
          utmContent: signupTracking.utmContent || undefined,
          source: phoneSignupSource,
        });
      }
      router.push(redirectPath);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "We could not verify that code. Please try again.",
      );
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleAppleSignup() {
    try {
      resetAlerts();
      setAppleLoading(true);

      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : "https://www.sitguru.com";

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "apple",
        options: {
          redirectTo: buildAuthCallbackUrl({
            origin,
            nextPath: redirectPath,
            intent,
            referralCode: normalizeReferralCode(referralCode),
            tracking: signupTracking,
          }),
        },
      });

      if (oauthError) throw oauthError;
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Apple signup could not start. Please try again.",
      );
      setAppleLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#effaf3_56%,#ffffff_100%)] px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto mb-5 flex w-full max-w-6xl items-center justify-between gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-black text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-emerald-50 sm:text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          Home
        </Link>

        <Link
          href={loginHref}
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-50 sm:text-sm"
        >
          Already have an account?
        </Link>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-5 lg:min-h-[78vh] lg:grid-cols-[0.92fr_1.08fr] lg:items-start">
        <section className="hidden overflow-hidden rounded-[2rem] border border-emerald-100 bg-white/90 shadow-[0_20px_55px_rgba(15,23,42,0.07)] lg:block">
          <div
            className="public-dark-section space-y-5 px-7 py-8 text-white"
            data-brand-green
            style={{ backgroundColor: BRAND_GREEN }}
          >
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-xs font-black uppercase tracking-[0.16em] !text-white">
              <Sparkles className="h-4 w-4" />
              {communitySignup
                ? "Join free — then finish saying I'm Going"
                : "SitGuru signup"}
            </div>

            <Image
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              width={180}
              height={48}
              className="h-10 w-auto object-contain brightness-0 invert"
              priority
            />

            <h1 className="text-4xl font-black leading-[1.05] tracking-[-0.045em] !text-white xl:text-5xl">
              {communityPanelTitle}
            </h1>

            <p className="max-w-md text-base font-semibold leading-7 text-emerald-50">
              {communityPanelCopy}
            </p>
          </div>

          <div className="space-y-4 p-7">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-800">
              Choose your path
            </p>

            <div className="grid gap-3">
              {accountOptions.map((option) => {
                const selected = intent === option.key;

                return (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => handleIntentChange(option.key)}
                    className={`rounded-2xl border px-4 py-4 text-left transition ${
                      selected
                        ? "border-emerald-500 bg-emerald-50 shadow-sm ring-2 ring-emerald-100"
                        : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-0.5 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          selected
                            ? "bg-[#0D5C3A] text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        <RoleIcon intent={option.key} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="mb-1 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">
                          {option.badge}
                        </span>
                        <span className="mt-1 block text-base font-black text-slate-950">
                          {option.title}
                        </span>
                        <span className="mt-1 block text-sm font-semibold leading-6 text-slate-600">
                          {option.description}
                        </span>
                      </span>
                      {selected ? (
                        <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-emerald-700" />
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-3 pt-2 sm:grid-cols-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-emerald-700" />
                <p className="text-xs font-black leading-5 text-slate-800">
                  Trusted local care
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-3">
                <CheckCircle2 className="mb-2 h-4 w-4 text-emerald-700" />
                <p className="text-xs font-black leading-5 text-slate-800">
                  Finish profile later
                </p>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 px-3 py-3">
                <PawPrint className="mb-2 h-4 w-4 text-emerald-700" />
                <p className="text-xs font-black leading-5 text-slate-800">
                  One SitGuru account
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-emerald-100 bg-white p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2 text-xs font-black text-emerald-800">
                <RoleIcon intent={intent} />
                {intentLabel} signup
              </div>
              <h2 className="mt-4 text-3xl font-black leading-[1.02] tracking-[-0.045em] text-slate-950 sm:text-4xl">
                Create your account
              </h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                Join SitGuru in a few steps. We&apos;ll guide you through any missing
                profile details from your dashboard.
              </p>
            </div>

            <Image
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              width={120}
              height={36}
              className="hidden h-9 w-auto object-contain sm:block"
              priority
            />
          </div>

          <div className="mt-6 grid gap-2 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-2 sm:grid-cols-3 lg:hidden">
            {accountOptions.map((option) => {
              const selected = intent === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => handleIntentChange(option.key)}
                  className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-3 py-3 text-xs font-black transition ${
                    selected
                      ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                      : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
                  }`}
                >
                  <RoleIcon intent={option.key} />
                  {option.title}
                </button>
              );
            })}
          </div>

          <div className="mt-5 grid gap-2 rounded-[1.35rem] border border-emerald-100 bg-emerald-50 p-2 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => handleModeChange("email")}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                mode === "email"
                  ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
              }`}
            >
              <Mail className="h-4 w-4" />
              Email
            </button>
            <button
              type="button"
              onClick={() => handleModeChange("phone")}
              className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                mode === "phone"
                  ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                  : "text-slate-600 hover:bg-white/70 hover:text-slate-950"
              }`}
            >
              <Phone className="h-4 w-4" />
              Phone
            </button>
          </div>

          {message ? (
            <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
              {message}
            </div>
          ) : null}

          {error ? (
            <div className="mt-5 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          ) : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={googleLoading}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {googleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={handleAppleSignup}
              disabled={appleLoading}
              className="inline-flex min-h-12 items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-900 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {appleLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Apple className="h-5 w-5" />
              )}
              Continue with Apple
            </button>
          </div>

          <div className="my-5 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            Or use {mode === "email" ? "email" : "phone"}
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {mode === "email" ? (
            <form onSubmit={handleEmailSignup} className="space-y-4">
              <label className="block space-y-2">
                <span className="block text-sm font-black text-slate-900">
                  Full name <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={fieldWithIconClassName}
                    placeholder="First and last name"
                    autoComplete="name"
                  />
                </div>
              </label>

              <label className="block space-y-2">
                <span className="block text-sm font-black text-slate-900">
                  Email <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={fieldWithIconClassName}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    Mobile phone{" "}
                    <span className="font-semibold text-slate-400">(optional)</span>
                  </span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                    <input
                      value={phone}
                      onChange={(event) =>
                        setPhone(formatPhoneNumber(event.target.value))
                      }
                      className={fieldWithIconClassName}
                      placeholder="(267) 555-1234"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    ZIP code <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={zipCode}
                    onChange={(event) =>
                      setZipCode(event.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    className={fieldClassName}
                    placeholder="18951"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </label>
              </div>

              {phoneDigits(phone).length > 0 ? (
                <label className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                  <input
                    type="checkbox"
                    checked={smsRemindersOptIn}
                    onChange={(event) =>
                      setSmsRemindersOptIn(event.target.checked)
                    }
                    className="mt-1 h-4 w-4 rounded border-emerald-300 text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>
                    Send me transactional SMS about account setup, bookings, and
                    safety. Message and data rates may apply. Reply STOP to opt
                    out.
                  </span>
                </label>
              ) : null}

              {needsServiceArea ? (
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    Service / community area{" "}
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={serviceArea}
                    onChange={(event) => setServiceArea(event.target.value)}
                    className={fieldClassName}
                    placeholder={
                      intent === "ambassador"
                        ? "Quakertown, Bucks County, or nearby towns"
                        : "Areas or ZIP codes you serve"
                    }
                  />
                </label>
              ) : null}

              <label className="block space-y-2">
                <span className="block text-sm font-black text-slate-900">
                  Password <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    type={showPassword ? "text" : "password"}
                    className={`${fieldClassName} pr-12`}
                    placeholder="At least 6 characters"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute right-3 top-1/2 inline-flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-emerald-700 transition hover:bg-emerald-50"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </label>

              {!showReferralField ? (
                <button
                  type="button"
                  onClick={() => setShowReferralField(true)}
                  className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 transition hover:text-emerald-950 hover:underline"
                >
                  <Link2 className="h-4 w-4" />
                  Have a referral code?
                </button>
              ) : (
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    Referral code{" "}
                    <span className="font-semibold text-slate-400">(optional)</span>
                  </span>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                    <input
                      value={referralCode}
                      onChange={(event) =>
                        setReferralCode(normalizeReferralCode(event.target.value))
                      }
                      className={`${fieldWithIconClassName} uppercase`}
                      placeholder="YOUR REFERRAL CODE"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={64}
                    />
                  </div>
                  {referralCode ? (
                    <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold leading-5 text-emerald-800">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        Referral code saved. SitGuru will verify it when your
                        account is created.
                      </span>
                    </div>
                  ) : null}
                </label>
              )}

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  I agree to SitGuru&apos;s{" "}
                  <Link href="/terms" className="font-black text-emerald-800 underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-black text-emerald-800 underline"
                  >
                    Privacy Policy
                  </Link>
                  . I understand my profile may need more details before it is
                  complete.
                </span>
              </label>

              <button type="submit" disabled={loading} className={primaryButtonClassName}>
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                Create account
                <ArrowRight className="h-5 w-5" />
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <label className="block space-y-2">
                <span className="block text-sm font-black text-slate-900">
                  Full name <span className="text-red-500">*</span>
                </span>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    className={fieldWithIconClassName}
                    placeholder="First and last name"
                    autoComplete="name"
                  />
                </div>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    Phone <span className="text-red-500">*</span>
                  </span>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                    <input
                      value={phone}
                      onChange={(event) =>
                        setPhone(formatPhoneNumber(event.target.value))
                      }
                      className={fieldWithIconClassName}
                      placeholder="(267) 555-1234"
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    ZIP code <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={zipCode}
                    onChange={(event) =>
                      setZipCode(event.target.value.replace(/\D/g, "").slice(0, 5))
                    }
                    className={fieldClassName}
                    placeholder="18951"
                    inputMode="numeric"
                    autoComplete="postal-code"
                  />
                </label>
              </div>

              <label className="block space-y-2">
                <span className="block text-sm font-black text-slate-900">
                  Email{" "}
                  <span className="font-semibold text-slate-400">(optional)</span>
                </span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className={fieldWithIconClassName}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              {needsServiceArea ? (
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    Service / community area{" "}
                    <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={serviceArea}
                    onChange={(event) => setServiceArea(event.target.value)}
                    className={fieldClassName}
                    placeholder={
                      intent === "ambassador"
                        ? "Quakertown, Bucks County, or nearby towns"
                        : "Areas or ZIP codes you serve"
                    }
                  />
                </label>
              ) : null}

              {!showReferralField ? (
                <button
                  type="button"
                  onClick={() => setShowReferralField(true)}
                  className="inline-flex items-center gap-2 text-sm font-black text-emerald-800 transition hover:text-emerald-950 hover:underline"
                >
                  <Link2 className="h-4 w-4" />
                  Have a referral code?
                </button>
              ) : (
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    Referral code{" "}
                    <span className="font-semibold text-slate-400">(optional)</span>
                  </span>
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-emerald-700" />
                    <input
                      value={referralCode}
                      onChange={(event) =>
                        setReferralCode(normalizeReferralCode(event.target.value))
                      }
                      className={`${fieldWithIconClassName} uppercase`}
                      placeholder="YOUR REFERRAL CODE"
                      autoComplete="off"
                      spellCheck={false}
                      maxLength={64}
                    />
                  </div>
                </label>
              )}

              {phoneCodeSent ? (
                <label className="block space-y-2">
                  <span className="block text-sm font-black text-slate-900">
                    6-digit code <span className="text-red-500">*</span>
                  </span>
                  <input
                    value={phoneCode}
                    onChange={(event) =>
                      setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                    }
                    className={fieldClassName}
                    placeholder="123456"
                    inputMode="numeric"
                  />
                </label>
              ) : null}

              <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold leading-6 text-slate-700">
                <input
                  type="checkbox"
                  checked={acceptedTerms}
                  onChange={(event) => setAcceptedTerms(event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  I agree to SitGuru&apos;s{" "}
                  <Link href="/terms" className="font-black text-emerald-800 underline">
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/privacy"
                    className="font-black text-emerald-800 underline"
                  >
                    Privacy Policy
                  </Link>
                  . By requesting a phone code, I also agree to receive
                  transactional SMS for verification, bookings, and safety.
                  Message and data rates may apply. Reply STOP to opt out.
                </span>
              </label>

              {!phoneCodeSent ? (
                <button
                  type="button"
                  onClick={handleSendPhoneCode}
                  disabled={phoneLoading}
                  className={primaryButtonClassName}
                >
                  {phoneLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  Send phone code
                  <ArrowRight className="h-5 w-5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleVerifyPhoneCode}
                  disabled={phoneLoading}
                  className={primaryButtonClassName}
                >
                  {phoneLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  Verify and continue
                  <ArrowRight className="h-5 w-5" />
                </button>
              )}
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-sm font-black text-slate-950">
              Already part of SitGuru?
            </p>
            <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">
              Log in with the same email or phone and switch between Pet Parent,
              Guru, and Ambassador dashboards from one account.
            </p>
            <Link
              href={loginHref}
              className="mt-3 inline-flex text-sm font-black text-emerald-800 transition hover:text-emerald-950 hover:underline"
            >
              Go to login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}


export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[linear-gradient(180deg,#f8fffb_0%,#effaf3_56%,#ffffff_100%)] px-4 py-16 text-slate-950">
          <div className="mx-auto max-w-xl rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-lg">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-700" />
            <p className="text-sm font-semibold text-slate-600">
              Loading SitGuru signup...
            </p>
          </div>
        </main>
      }
    >
      <SignupPageContent />
    </Suspense>
  );
}
