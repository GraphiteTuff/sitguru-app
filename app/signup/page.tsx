"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  Apple,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
  Link2,
  Mail,
  PawPrint,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

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

const identityTabs: {
  key: Exclude<AccountIntent, "both">;
  label: string;
  short: string;
}[] = [
  {
    key: "pet_parent",
    label: "Pet Parent",
    short: "Book trusted local care",
  },
  {
    key: "guru",
    label: "Pet Guru",
    short: "Offer pet care services",
  },
  {
    key: "ambassador",
    label: "Ambassador",
    short: "Grow the SitGuru community",
  },
];

const valueSegments: {
  title: string;
  description: string;
}[] = [
  {
    title: "Pet Parent",
    description:
      "Book walks, sitting, drop-ins, and more from trusted local Gurus.",
  },
  {
    title: "Guru",
    description:
      "Offer pet care in your neighborhood and earn with flexible schedules.",
  },
  {
    title: "Ambassador",
    description:
      "Share SitGuru, grow referrals, and help your community find better care.",
  },
];

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

function getIntentLabel(intent: AccountIntent) {
  if (intent === "guru") return "Pet Guru";
  if (intent === "both") return "Pet Parent + Pet Guru";
  if (intent === "ambassador") return "Ambassador";
  return "Pet Parent";
}

function getIntentAccountType(intent: AccountIntent) {
  if (intent === "guru" || intent === "both") return "guru";
  if (intent === "ambassador") return "ambassador";
  return "pet_parent";
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
  const [showPassword, setShowPassword] = useState(false);
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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

  const redirectPath = getRedirectPath(intent);
  const intentLabel = getIntentLabel(intent);
  const needsServiceArea =
    intent === "guru" || intent === "both" || intent === "ambassador";
  const emailSignupSource = signupTracking.source || "sitguru_signup_page";
  const phoneSignupSource = signupTracking.source || "sitguru_phone_signup";

  function resetAlerts() {
    setError("");
    setMessage("");
  }

  function handleIntentChange(nextIntent: AccountIntent) {
    resetAlerts();
    setIntent(nextIntent);
    setPhoneCodeSent(false);
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
            signup_source: emailSignupSource,
            signup_status: "pending_email_verification",
            phone: normalizedOptionalPhone || null,
            transactional_sms_opt_in: false,
            sms_opt_in: false,
            sms_consent: false,
            sms_consent_at: null,
            phone_notifications_enabled: false,
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
    setAppleLoading(true);
    setError(
      "Apple signup is almost ready. Please use email, phone, or Google for now.",
    );
    setAppleLoading(false);
  }

  const accountType = getIntentAccountType(intent);
  const inputClassName =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

  return (
    <main className="bg-gradient-to-tr from-slate-50 via-emerald-50/20 to-white text-zinc-900 min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200/80 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
          >
            <ChevronLeft className="h-4 w-4" />
            Back to SitGuru
          </Link>

          <Link
            href="/login"
            className="text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
          >
            Already have an account?
          </Link>
        </div>

        <div className="grid flex-1 items-center gap-8 md:grid-cols-12">
          {/* Left column — value proposition (~45%) */}
          <section className="md:col-span-5">
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-6 sm:p-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 font-semibold tracking-wide border border-emerald-100 px-3 py-1.5 text-xs uppercase">
                <Sparkles className="h-3.5 w-3.5" />
                SitGuru
              </div>

              <h1 className="mt-5 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                One platform for your entire pet circle.
              </h1>

              <p className="mt-3 text-sm leading-6 text-zinc-600 sm:text-base">
                Book care, offer services, or grow the community — all from one
                clean SitGuru account.
              </p>

              <div className="mt-6 space-y-3">
                {valueSegments.map((segment) => (
                  <div
                    key={segment.title}
                    className="rounded-xl border border-slate-200/80 bg-slate-50/60 px-4 py-3"
                  >
                    <p className="text-sm font-semibold text-zinc-900">
                      {segment.title}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-zinc-600">
                      {segment.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid gap-3 text-sm text-zinc-600 sm:grid-cols-3">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Fast signup</span>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Secure access</span>
                </div>
                <div className="flex items-start gap-2">
                  <PawPrint className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>Local care</span>
                </div>
              </div>
            </div>
          </section>

          {/* Right column — registration panel (~55%) */}
          <section className="md:col-span-7">
            <div className="bg-white border border-slate-200/80 shadow-sm rounded-2xl p-5 sm:p-7">
              <div className="mb-6">
                <p className="inline-flex items-center rounded-full bg-emerald-50 text-emerald-700 font-semibold tracking-wide border border-emerald-100 px-3 py-1 text-xs uppercase">
                  {intentLabel}
                </p>
                <h2 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900">
                  Create your account.
                </h2>
                <p className="mt-2 text-sm leading-6 text-zinc-600">
                  Choose how you want to join SitGuru, then finish the essentials
                  below. You can complete your profile from your dashboard.
                </p>
              </div>

              {/* Identity switcher — tab-style like Phone/Email toggle */}
              <div
                role="tablist"
                aria-label="Account type"
                className="mb-5 grid grid-cols-3 gap-1 rounded-xl border border-slate-200/80 bg-slate-50 p-1"
              >
                {identityTabs.map((tab) => {
                  const selected =
                    intent === tab.key ||
                    (tab.key === "pet_parent" && intent === "both");

                  return (
                    <button
                      key={tab.key}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      onClick={() => handleIntentChange(tab.key)}
                      className={`rounded-lg px-2 py-2.5 text-center transition-colors sm:px-3 ${
                        selected
                          ? "bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100 font-semibold"
                          : "text-zinc-500 hover:bg-white/70 hover:text-zinc-800 font-medium"
                      }`}
                    >
                      <span className="block text-xs sm:text-sm">{tab.label}</span>
                      <span className="mt-0.5 hidden text-[11px] font-normal text-zinc-400 sm:block">
                        {tab.short}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-slate-200/80 bg-slate-50 p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("email")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    mode === "email"
                      ? "bg-white font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                      : "font-medium text-zinc-500 hover:bg-white/70 hover:text-zinc-800"
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("phone")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                    mode === "phone"
                      ? "bg-white font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-100"
                      : "font-medium text-zinc-500 hover:bg-white/70 hover:text-zinc-800"
                  }`}
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </button>
              </div>

              {message ? (
                <div className="mb-4 rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="mb-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {mode === "email" ? (
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <input type="hidden" name="account_type" value={accountType} />
                  <input
                    type="hidden"
                    name="program"
                    value={signupTracking.program}
                  />
                  <input
                    type="hidden"
                    name="referral_program"
                    value={signupTracking.program}
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Full Name
                    </span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="e.g., Jane Doe"
                        autoComplete="name"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Use your real first and last name for a trusted profile.
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Email Address
                    </span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="name@domain.com"
                        autoComplete="email"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      We&apos;ll send a confirmation link to verify your account.
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Secure Password
                    </span>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className={`${inputClassName} pr-11`}
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-zinc-500 hover:bg-slate-50 hover:text-zinc-800"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Choose a strong password you don&apos;t reuse elsewhere.
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      ZIP code
                    </span>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(event) =>
                        setZipCode(
                          event.target.value.replace(/\D/g, "").slice(0, 5),
                        )
                      }
                      className={inputClassName}
                      placeholder="18951"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Helps match you with local Gurus and community coverage.
                    </p>
                  </label>

                  {needsServiceArea ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                        Service / community area
                      </span>
                      <input
                        type="text"
                        value={serviceArea}
                        onChange={(event) => setServiceArea(event.target.value)}
                        className={inputClassName}
                        placeholder={
                          intent === "ambassador"
                            ? "Quakertown, Bucks County, or nearby towns"
                            : "Areas or ZIP codes you serve"
                        }
                      />
                      <p className="mt-1.5 text-xs text-zinc-500">
                        Tell us where you plan to serve or promote SitGuru.
                      </p>
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Referral Code{" "}
                      <span className="font-normal text-zinc-400">(Optional)</span>
                    </span>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(event) =>
                          setReferralCode(
                            normalizeReferralCode(event.target.value),
                          )
                        }
                        className={`${inputClassName} pl-10 uppercase`}
                        placeholder="e.g., SITGURU-FRIEND"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={64}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Enter a code from a friend, Guru, Ambassador, or SitGuru
                      campaign
                      {signupTracking.program
                        ? ` · program: ${signupTracking.program}`
                        : ""}
                      .
                    </p>
                    {referralCode ? (
                      <div className="mt-2 flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-semibold leading-5 text-emerald-700">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>
                          Referral code detected. SitGuru will verify and connect
                          it when your account is created.
                        </span>
                      </div>
                    ) : null}
                  </label>

                  <label className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) =>
                        setAcceptedTerms(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-zinc-500 leading-5">
                      I agree to SitGuru&apos;s{" "}
                      <Link
                        href="/terms"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        Terms of Service
                      </Link>{" "}
                      and{" "}
                      <Link
                        href="/privacy"
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        Privacy Policy
                      </Link>
                      , and consent to receiving transactional alerts.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading || !acceptedTerms}
                    className="inline-flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : null}
                    Create account
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <input type="hidden" name="account_type" value={accountType} />
                  <input
                    type="hidden"
                    name="program"
                    value={signupTracking.program}
                  />

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Full Name
                    </span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="e.g., Jane Doe"
                        autoComplete="name"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Use your real first and last name before requesting a code.
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Phone
                    </span>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={phone}
                        onChange={(event) =>
                          setPhone(formatPhoneNumber(event.target.value))
                        }
                        className={`${inputClassName} pl-10`}
                        placeholder="(267) 555-1234"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      We&apos;ll text a 6-digit code to verify your number.
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Email Address{" "}
                      <span className="font-normal text-zinc-400">(Optional)</span>
                    </span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className={`${inputClassName} pl-10`}
                        placeholder="name@domain.com"
                        autoComplete="email"
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Optional backup contact. Phone remains your primary sign-in.
                    </p>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      ZIP code
                    </span>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(event) =>
                        setZipCode(
                          event.target.value.replace(/\D/g, "").slice(0, 5),
                        )
                      }
                      className={inputClassName}
                      placeholder="18951"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Helps match you with local Gurus and community coverage.
                    </p>
                  </label>

                  {needsServiceArea ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                        Service / community area
                      </span>
                      <input
                        type="text"
                        value={serviceArea}
                        onChange={(event) => setServiceArea(event.target.value)}
                        className={inputClassName}
                        placeholder={
                          intent === "ambassador"
                            ? "Quakertown, Bucks County, or nearby towns"
                            : "Areas or ZIP codes you serve"
                        }
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                      Referral Code{" "}
                      <span className="font-normal text-zinc-400">(Optional)</span>
                    </span>
                    <div className="relative">
                      <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                      <input
                        type="text"
                        value={referralCode}
                        onChange={(event) =>
                          setReferralCode(
                            normalizeReferralCode(event.target.value),
                          )
                        }
                        className={`${inputClassName} pl-10 uppercase`}
                        placeholder="e.g., SITGURU-FRIEND"
                        autoComplete="off"
                        spellCheck={false}
                        maxLength={64}
                      />
                    </div>
                    <p className="mt-1.5 text-xs text-zinc-500">
                      Optional code for referral attribution and program tracking.
                    </p>
                  </label>

                  {phoneCodeSent ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-semibold text-zinc-800">
                        6-digit code
                      </span>
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(event) =>
                          setPhoneCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        className={inputClassName}
                        placeholder="123456"
                        inputMode="numeric"
                      />
                    </label>
                  ) : null}

                  <label className="flex items-start gap-3 pt-1">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) =>
                        setAcceptedTerms(event.target.checked)
                      }
                      className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-xs text-zinc-500 leading-5">
                      I agree to SitGuru&apos;s Terms of Service and Privacy
                      Policy, and consent to receiving transactional alerts.
                      Message and data rates may apply. Reply STOP to opt out.
                    </span>
                  </label>

                  {!phoneCodeSent ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneLoading || !acceptedTerms}
                      className="inline-flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {phoneLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : null}
                      Send phone code
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleVerifyPhoneCode}
                      disabled={phoneLoading || !acceptedTerms}
                      className="inline-flex w-full items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-colors px-5 py-3.5 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {phoneLoading ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : null}
                      Verify and continue
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )}

              <div className="my-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
                <span className="h-px flex-1 bg-slate-200" />
                Or continue with
                <span className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {googleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <GoogleIcon />
                  )}
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleAppleSignup}
                  disabled={appleLoading}
                  className="inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-medium text-zinc-800 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {appleLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Apple className="h-5 w-5" />
                  )}
                  Apple
                </button>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-zinc-500">
                Profile details, services, pricing, and payouts can be completed
                from your dashboard after signup.
              </p>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="bg-gradient-to-tr from-slate-50 via-emerald-50/20 to-white text-zinc-900 min-h-screen px-4 py-16">
          <div className="mx-auto max-w-xl bg-white border border-slate-200/80 shadow-sm rounded-2xl p-8 text-center">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium text-zinc-500">
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