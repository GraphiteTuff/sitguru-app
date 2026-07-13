"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, FormEvent, useMemo, useState } from "react";
import {
  AlertCircle,
  Apple,
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  Eye,
  EyeOff,
  Loader2,
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

const accountOptions: {
  key: AccountIntent;
  title: string;
  description: string;
  badge: string;
}[] = [
  {
    key: "pet_parent",
    title: "Pet Parent",
    description: "Find trusted local Gurus for walks, sitting, drop-ins, and more.",
    badge: "Book care",
  },
  {
    key: "guru",
    title: "Future Guru",
    description: "Apply to offer trusted pet care in your local community.",
    badge: "Earn with care",
  },
  {
    key: "ambassador",
    title: "Ambassador",
    description: "Share SitGuru and grow referrals in your community.",
    badge: "Promote SitGuru",
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

function normalizeAmbassadorReferralCode(value: string) {
  return value.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "");
}

function getRedirectPath(intent: AccountIntent) {
  if (intent === "guru" || intent === "both") return "/guru/dashboard/profile";
  if (intent === "ambassador") return "/ambassador/dashboard";
  return "/customer/dashboard";
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

function getRoleFromIntent(intent: AccountIntent): SignupProfileRole {
  return getProfileRoleFromIntent(intent);
}

function getUserRolesFromIntent(intent: AccountIntent) {
  if (intent === "both") return ["customer", "guru"] as const;
  return [getProfileRoleFromIntent(intent)] as const;
}

function shouldCreateGuruProfile(intent: AccountIntent) {
  return intent === "guru" || intent === "both";
}

function shouldCreatePetParentProfile(intent: AccountIntent) {
  return intent === "pet_parent" || intent === "both";
}

function buildReferralCode(userId: string, fullName: string) {
  const nameCode = fullName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  const uniqueUserCode = userId.replace(/-/g, "").toUpperCase();

  return `${nameCode || "SITGURU"}-${uniqueUserCode}`;
}

async function ensureUserRole(userId: string, role: string) {
  await supabase.from("user_roles").upsert(
    {
      user_id: userId,
      role,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,role" },
  );
}

async function ensureReferralCode(userId: string, fullName: string, role: string) {
  const code = buildReferralCode(userId, fullName);

  await supabase.from("pawperks_account_referral_codes").upsert(
    {
      account_id: userId,
      code,
      program: role === "guru" ? "guru" : role === "ambassador" ? "ambassador" : "pet_parent",
      status: "active",
      metadata: { source: "signup", role },
    },
    { onConflict: "account_id" },
  );

  return code;
}

function buildStarterGuruName(fullName: string, fallback = "New SitGuru") {
  const cleanName = fullName.trim();

  return cleanName || fallback;
}

function buildStarterGuruSlug(userId: string, fullName: string) {
  const baseSlug = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return baseSlug || `guru-${userId.slice(0, 8)}`;
}

async function ensureStarterGuruProfile({
  userId,
  fullName,
  email,
  phone,
  zipCode,
  serviceArea,
  profileRole,
  source,
}: {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  serviceArea?: string;
  profileRole: SignupProfileRole;
  source: string;
}) {
  const now = new Date().toISOString();
  const displayName = buildStarterGuruName(fullName);
  const { firstName, lastName } = getNameParts(displayName);
  const slug = buildStarterGuruSlug(userId, displayName);

  const { error: profileError } = await supabase.from("profiles").upsert({
    id: userId,
    full_name: displayName,
    first_name: firstName || null,
    last_name: lastName || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    role: profileRole,
    account_type: profileRole,
    source,
    zip_code: zipCode?.trim() || null,
    service_area: serviceArea?.trim() || null,
    admin_status: "pending_setup",
    profile_quality_status: "needs_setup",
    is_public_visible: false,
    is_bookable: false,
    is_archived: false,
    is_test_account: false,
    missing_requirements: ["basic profile completion"],
    updated_at: now,
  });

  if (profileError) {
    throw new Error(`Profile setup failed: ${profileError.message}`);
  }

  const { data: existingGuru, error: existingGuruError } = await supabase
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingGuruError) {
    throw new Error(`Guru profile lookup failed: ${existingGuruError.message}`);
  }

  const starterGuruPayload = {
    user_id: userId,
    display_name: displayName,
    full_name: displayName,
    slug,
    zip_code: zipCode?.trim() || null,
    service_area: serviceArea?.trim() || null,
    is_public: false,
    booking_status: "not_listed",
    application_status: "pending",
    admin_status: "pending_setup",
    profile_quality_status: "needs_setup",
    is_public_visible: false,
    is_bookable: false,
    is_archived: false,
    is_test_account: false,
    missing_requirements: [
      "services offered",
      "rates/pricing",
      "availability",
      "bio/about",
      "profile photo",
      "admin approved",
    ],
    onboarding_completed: false,
    profile_completed: false,
    updated_at: now,
  };

  if (existingGuru?.id) {
    const { error: guruUpdateError } = await supabase
      .from("gurus")
      .update(starterGuruPayload)
      .eq("user_id", userId);

    if (guruUpdateError) {
      throw new Error(`Guru profile update failed: ${guruUpdateError.message}`);
    }

    return;
  }

  const { error: guruInsertError } = await supabase.from("gurus").insert({
    ...starterGuruPayload,
    created_at: now,
  });

  if (guruInsertError) {
    throw new Error(`Guru profile creation failed: ${guruInsertError.message}`);
  }
}

async function safelyAddUserRoles(userId: string, intent: AccountIntent) {
  const roles = getUserRolesFromIntent(intent);

  await Promise.all(
    roles.map(async (role) => {
      try {
        const { error } = await supabase.from("user_roles").upsert(
          {
            user_id: userId,
            role,
          },
          {
            onConflict: "user_id,role",
          },
        );

        if (error && error.code !== "23505") {
          console.warn("Signup user_roles sync skipped:", error.message);
        }
      } catch (error) {
        console.warn("Signup user_roles sync skipped:", error);
      }
    }),
  );
}

async function ensureStarterAmbassadorProfile({
  userId,
  fullName,
  email,
  phone,
  zipCode,
  serviceArea,
  source,
}: {
  userId: string;
  fullName: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  serviceArea?: string;
  source: string;
}) {
  const now = new Date().toISOString();
  const displayName = buildStarterGuruName(fullName, "SitGuru Ambassador");
  const { firstName, lastName } = getNameParts(displayName);
  const referralCode = await ensureReferralCode(userId, displayName, "ambassador");

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: displayName,
    first_name: firstName || null,
    last_name: lastName || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    role: "ambassador",
    source,
    zip_code: zipCode?.trim() || null,
    service_area: serviceArea?.trim() || null,
    referral_code: referralCode,
    updated_at: now,
  });

  await supabase.from("ambassadors").upsert(
    {
      user_id: userId,
      full_name: displayName,
      email: email?.trim() || null,
      contact_email: email?.trim() || null,
      phone: phone?.trim() || null,
      referral_code: referralCode,
      status: "pending",
      referral_status: "pending",
      admin_status: "application_received",
      profile_quality_status: "application_received",
      is_public_visible: false,
      is_bookable: false,
      is_archived: false,
      is_test_account: false,
      missing_requirements: ["admin approved", "training completion"],
      onboarding_status: "started",
      training_status: "not_started",
      dashboard_enabled: false,
      login_enabled: true,
      dashboard_slug: buildStarterGuruSlug(userId, displayName),
      base_zip_code: zipCode?.trim() || null,
      service_area: serviceArea?.trim() || null,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
}


async function provisionSignupAccount(payload: {
  userId: string;
  intent: AccountIntent;
  fullName: string;
  email?: string;
  phone?: string;
  zipCode: string;
  serviceArea: string;
  ambassadorReferralCode?: string;
  source: string;
}) {
  const response = await fetch("/api/auth/provision-signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const result = (await response.json().catch(() => null)) as
    | { ok?: boolean; error?: string; message?: string }
    | null;

  if (!response.ok || !result?.ok) {
    throw new Error(
      result?.error ||
        result?.message ||
        "Your account was created, but SitGuru could not finish setting up your workspace. Please sign in again or contact SitGuru support.",
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

  const [intent, setIntent] = useState<AccountIntent>(startingIntent);
  const [mode, setMode] = useState<SignupMode>("email");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [ambassadorReferralCode, setAmbassadorReferralCode] = useState(
    searchParams.get("ambassador_referral_code") ||
      searchParams.get("ref") ||
      searchParams.get("code") ||
      "",
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

  const redirectPath = getRedirectPath(intent);
  const intentLabel = getIntentLabel(intent);
  const needsServiceArea = intent === "guru" || intent === "both" || intent === "ambassador";

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
          redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
            redirectPath,
          )}&intent=${intent}&ambassador_referral_code=${encodeURIComponent(
            normalizeAmbassadorReferralCode(ambassadorReferralCode),
          )}`,
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
      const cleanZipCode = zipCode.trim();
      const profileRole = getProfileRoleFromIntent(intent);
      const cleanAmbassadorReferralCode = normalizeAmbassadorReferralCode(
        ambassadorReferralCode,
      );

      if (!isValidFullName(cleanName)) {
        setError("Please enter your real first and last name.");
        return;
      }

      if (!isValidEmailAddress(cleanEmail)) {
        setError("Please enter a valid personal email address.");
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
          emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(
            redirectPath,
          )}&intent=${intent}`,
          data: {
            full_name: cleanName,
            first_name: firstName,
            last_name: lastName,
            role: profileRole,
            account_type: profileRole,
            signup_role: profileRole,
            account_intent: intent,
            signup_source: "sitguru_signup_page",
            signup_status: "pending_email_verification",
            zip_code: cleanZipCode,
            service_area: serviceArea.trim() || cleanZipCode,
            ambassador_referral_code: cleanAmbassadorReferralCode || null,
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
          zipCode: cleanZipCode,
          serviceArea: serviceArea.trim() || cleanZipCode,
          ambassadorReferralCode: cleanAmbassadorReferralCode || undefined,
          source: "sitguru_signup_page",
        });
      }
      setMessage(
        shouldCreateGuruProfile(intent)
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
      const profileRole = getProfileRoleFromIntent(intent);
      const cleanAmbassadorReferralCode = normalizeAmbassadorReferralCode(
        ambassadorReferralCode,
      );

      if (!isValidFullName(cleanName)) {
        setError("Please enter your real first and last name before requesting a phone code.");
        return;
      }

      if (!normalizedPhone) {
        setError("Please enter a valid 10-digit phone number.");
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
            signup_source: "sitguru_phone_signup",
            signup_status: "pending_phone_verification",
            zip_code: cleanZipCode,
            service_area: serviceArea.trim() || cleanZipCode,
            ambassador_referral_code: cleanAmbassadorReferralCode || null,
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
      const profileRole = getProfileRoleFromIntent(intent);
      const cleanAmbassadorReferralCode = normalizeAmbassadorReferralCode(
        ambassadorReferralCode,
      );

      if (!isValidFullName(cleanName)) {
        setError("Please enter your real first and last name.");
        return;
      }

      if (!normalizedPhone) {
        setError("Please enter a valid 10-digit phone number.");
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
          signup_status: "phone_verified",
          zip_code: cleanZipCode,
          service_area: serviceArea.trim() || cleanZipCode,
          ambassador_referral_code: cleanAmbassadorReferralCode || null,
        },
      });

      const userId = data.user?.id;

      if (userId) {
        await provisionSignupAccount({
          userId,
          intent,
          fullName: cleanName,
          phone: normalizedPhone,
          zipCode: cleanZipCode,
          serviceArea: serviceArea.trim() || cleanZipCode,
          ambassadorReferralCode: cleanAmbassadorReferralCode || undefined,
          source: "sitguru_phone_signup",
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

  return (
    <main className="min-h-screen bg-[#f7f3ec] text-[#1f1f1f]">
      <section className="relative overflow-hidden border-b border-[#eadfcd] bg-gradient-to-br from-[#fdf8ef] via-[#f7f3ec] to-[#eaf4ec]">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#0f7f60]/10 blur-3xl" />
        <div className="absolute -right-20 bottom-0 h-80 w-80 rounded-full bg-[#f0b35b]/20 blur-3xl" />

        <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-[#d8ccb8] bg-white/80 px-4 py-2 text-sm font-semibold text-[#2f2a22] shadow-sm transition hover:border-[#0f7f60]/40 hover:text-[#0f7f60]"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to SitGuru
            </Link>

            <Link
              href="/login"
              className="text-sm font-semibold text-[#0f7f60] transition hover:text-[#0b6049]"
            >
              Already have an account?
            </Link>
          </div>

          <div className="grid flex-1 items-center gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#0f7f60]/20 bg-white/70 px-4 py-2 text-sm font-semibold text-[#0f7f60] shadow-sm">
                <Sparkles className="h-4 w-4" />
                Join the trusted local pet care network
              </div>

              <h1 className="text-4xl font-black leading-tight tracking-tight text-[#1f1f1f] sm:text-5xl lg:text-6xl">
                Create your SitGuru account in minutes.
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-[#5f5648]">
                Sign up as a Pet Parent, Future Guru, or Ambassador. You can finish
                profile details from your dashboard after your account is created.
              </p>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {accountOptions.map((option) => {
                  const selected = intent === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleIntentChange(option.key)}
                      className={`rounded-3xl border p-4 text-left shadow-sm transition ${
                        selected
                          ? "border-[#0f7f60] bg-white shadow-md ring-2 ring-[#0f7f60]/15"
                          : "border-[#e0d5c2] bg-white/70 hover:border-[#0f7f60]/40"
                      }`}
                    >
                      <div className="mb-3 inline-flex items-center rounded-full bg-[#0f7f60]/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-[#0f7f60]">
                        {option.badge}
                      </div>
                      <h2 className="text-lg font-black text-[#221f1a]">
                        {option.title}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-[#6a6256]">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-4 text-sm text-[#5f5648] sm:grid-cols-3">
                <div className="rounded-2xl border border-[#eadfcd] bg-white/70 p-4">
                  <CheckCircle2 className="mb-2 h-5 w-5 text-[#0f7f60]" />
                  Simple signup first
                </div>
                <div className="rounded-2xl border border-[#eadfcd] bg-white/70 p-4">
                  <ShieldCheck className="mb-2 h-5 w-5 text-[#0f7f60]" />
                  Complete profile later
                </div>
                <div className="rounded-2xl border border-[#eadfcd] bg-white/70 p-4">
                  <PawPrint className="mb-2 h-5 w-5 text-[#0f7f60]" />
                  Local pet care focus
                </div>
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl rounded-[2rem] border border-[#eadfcd] bg-white p-5 shadow-2xl shadow-[#876b3d]/10 sm:p-7">
              <div className="mb-6">
                <p className="text-sm font-black uppercase tracking-[0.22em] text-[#0f7f60]">
                  {intentLabel} signup
                </p>
                <h2 className="mt-2 text-3xl font-black text-[#1f1f1f]">
                  Start your account
                </h2>
                <p className="mt-2 text-sm leading-6 text-[#6a6256]">
                  Create the account now. SitGuru will guide you through any missing
                  profile details from your dashboard.
                </p>
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl bg-[#f7f3ec] p-1">
                <button
                  type="button"
                  onClick={() => handleModeChange("email")}
                  className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                    mode === "email"
                      ? "bg-white text-[#0f7f60] shadow-sm"
                      : "text-[#6a6256] hover:text-[#0f7f60]"
                  }`}
                >
                  Email
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("phone")}
                  className={`rounded-xl px-4 py-3 text-sm font-black transition ${
                    mode === "phone"
                      ? "bg-white text-[#0f7f60] shadow-sm"
                      : "text-[#6a6256] hover:text-[#0f7f60]"
                  }`}
                >
                  Phone
                </button>
              </div>

              {message ? (
                <div className="mb-4 rounded-2xl border border-[#0f7f60]/20 bg-[#eaf4ec] px-4 py-3 text-sm font-semibold text-[#0f7f60]">
                  {message}
                </div>
              ) : null}

              {error ? (
                <div className="mb-4 flex gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}

              {mode === "email" ? (
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      Full name <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a7d6b]" />
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-12 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="First and last name"
                        autoComplete="name"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      Email <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a7d6b]" />
                      <input
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-12 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="you@example.com"
                        autoComplete="email"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      ZIP code <span className="text-red-500">*</span>
                    </span>
                    <input
                      value={zipCode}
                      onChange={(event) =>
                        setZipCode(event.target.value.replace(/\D/g, "").slice(0, 5))
                      }
                      className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                      placeholder="18951"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </label>

                  {needsServiceArea ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                        Service/community area{" "}
                        <span className="text-red-500">*</span>
                      </span>
                      <input
                        value={serviceArea}
                        onChange={(event) => setServiceArea(event.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder={
                          intent === "ambassador"
                            ? "Quakertown, Bucks County, or nearby towns"
                            : "Areas or ZIP codes you serve"
                        }
                      />
                    </label>
                  ) : null}

                  {intent === "ambassador" ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                        Ambassador referral code{" "}
                        <span className="text-[#8a7d6b]">(optional)</span>
                      </span>
                      <input
                        value={ambassadorReferralCode}
                        onChange={(event) =>
                          setAmbassadorReferralCode(
                            normalizeAmbassadorReferralCode(event.target.value),
                          )
                        }
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base uppercase outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="AMBASSADOR-CODE"
                      />
                    </label>
                  ) : null}

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      Password <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <input
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        type={showPassword ? "text" : "password"}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 pr-12 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="At least 6 characters"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-[#6a6256] hover:bg-[#f7f3ec]"
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

                  <label className="flex items-start gap-3 rounded-2xl border border-[#eadfcd] bg-[#fdf8ef] p-4 text-sm leading-6 text-[#5f5648]">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#d8ccb8] text-[#0f7f60] focus:ring-[#0f7f60]"
                    />
                    <span>
                      I agree to SitGuru&apos;s terms, privacy policy, and understand
                      my profile may need additional information before it is complete.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f7f60] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#0f7f60]/20 transition hover:bg-[#0b6049] disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                    Create account
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      Full name <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a7d6b]" />
                      <input
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-12 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="First and last name"
                        autoComplete="name"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      Phone <span className="text-red-500">*</span>
                    </span>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#8a7d6b]" />
                      <input
                        value={phone}
                        onChange={(event) => setPhone(formatPhoneNumber(event.target.value))}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-12 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="(267) 555-1234"
                        inputMode="tel"
                        autoComplete="tel"
                      />
                    </div>
                  </label>

                  <label className="block">
                    <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                      ZIP code <span className="text-red-500">*</span>
                    </span>
                    <input
                      value={zipCode}
                      onChange={(event) =>
                        setZipCode(event.target.value.replace(/\D/g, "").slice(0, 5))
                      }
                      className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                      placeholder="18951"
                      inputMode="numeric"
                      autoComplete="postal-code"
                    />
                  </label>

                  {needsServiceArea ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                        Service/community area{" "}
                        <span className="text-red-500">*</span>
                      </span>
                      <input
                        value={serviceArea}
                        onChange={(event) => setServiceArea(event.target.value)}
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder={
                          intent === "ambassador"
                            ? "Quakertown, Bucks County, or nearby towns"
                            : "Areas or ZIP codes you serve"
                        }
                      />
                    </label>
                  ) : null}

                  {intent === "ambassador" ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                        Ambassador referral code{" "}
                        <span className="text-[#8a7d6b]">(optional)</span>
                      </span>
                      <input
                        value={ambassadorReferralCode}
                        onChange={(event) =>
                          setAmbassadorReferralCode(
                            normalizeAmbassadorReferralCode(event.target.value),
                          )
                        }
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base uppercase outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="AMBASSADOR-CODE"
                      />
                    </label>
                  ) : null}

                  {phoneCodeSent ? (
                    <label className="block">
                      <span className="mb-1.5 block text-sm font-black text-[#2f2a22]">
                        6-digit code <span className="text-red-500">*</span>
                      </span>
                      <input
                        value={phoneCode}
                        onChange={(event) =>
                          setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                        }
                        className="w-full rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#0f7f60] focus:ring-4 focus:ring-[#0f7f60]/10"
                        placeholder="123456"
                        inputMode="numeric"
                      />
                    </label>
                  ) : null}

                  <label className="flex items-start gap-3 rounded-2xl border border-[#eadfcd] bg-[#fdf8ef] p-4 text-sm leading-6 text-[#5f5648]">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#d8ccb8] text-[#0f7f60] focus:ring-[#0f7f60]"
                    />
                    <span>
                      I agree to SitGuru&apos;s terms, privacy policy, and understand
                      my profile may need additional information before it is complete.
                    </span>
                  </label>

                  {!phoneCodeSent ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f7f60] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#0f7f60]/20 transition hover:bg-[#0b6049] disabled:cursor-not-allowed disabled:opacity-70"
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#0f7f60] px-5 py-4 text-base font-black text-white shadow-lg shadow-[#0f7f60]/20 transition hover:bg-[#0b6049] disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {phoneLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                      Verify and continue
                      <ArrowRight className="h-5 w-5" />
                    </button>
                  )}
                </div>
              )}

              <div className="my-6 flex items-center gap-3 text-xs font-black uppercase tracking-[0.18em] text-[#8a7d6b]">
                <span className="h-px flex-1 bg-[#eadfcd]" />
                Or continue with
                <span className="h-px flex-1 bg-[#eadfcd]" />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-sm font-black text-[#2f2a22] transition hover:border-[#0f7f60]/40 hover:text-[#0f7f60] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <GoogleIcon />}
                  Google
                </button>
                <button
                  type="button"
                  onClick={handleAppleSignup}
                  disabled={appleLoading}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl border border-[#d8ccb8] bg-white px-4 py-3 text-sm font-black text-[#2f2a22] transition hover:border-[#0f7f60]/40 hover:text-[#0f7f60] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {appleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Apple className="h-5 w-5" />}
                  Apple
                </button>
              </div>

              <p className="mt-5 text-center text-xs leading-5 text-[#7b7164]">
                Phone is required before a profile is marked complete. Profile photo,
                service area, and ZIP code are verified from your dashboard.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f7f3ec] px-4 py-16 text-[#1f1f1f]">
          <div className="mx-auto max-w-xl rounded-3xl border border-[#eadfcd] bg-white p-8 text-center shadow-lg">
            <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-[#0f7f60]" />
            <p className="text-sm font-semibold text-[#6a6256]">
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