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
    return lettersOnly.length >= 2 && /^[a-zA-Z][a-zA-Z'’.-]*$/.test(part);
  });
}

function isValidEmailAddress(value: string) {
  const cleanEmail = value.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) return false;

  const domain = cleanEmail.split("@")[1] || "";
  const blockedDomains = [
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "tempmail.com",
    "tempmail.net",
    "temp-mail.org",
    "yopmail.com",
  ];

  return !blockedDomains.includes(domain);
}

function isValidZipCode(value: string) {
  return /^\d{5}$/.test(value.trim());
}

function normalizeAmbassadorReferralCode(value: string) {
  return value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 32);
}

function getDefaultNextPath(intent: AccountIntent) {
  if (intent === "guru") return "/guru/dashboard/profile?step=1";
  if (intent === "both") return "/guru/dashboard/profile?step=1";
  if (intent === "ambassador") return "/ambassador/dashboard";

  return "/customer/dashboard";
}

function normalizeNextPath(value: string) {
  const cleanValue = value.trim();

  if (!cleanValue) return "";
  if (cleanValue.startsWith("/")) return cleanValue;

  return "";
}

function getRedirectPath(intent: AccountIntent, nextPath: string) {
  return normalizeNextPath(nextPath) || getDefaultNextPath(intent);
}

function getIntentLabel(intent: AccountIntent) {
  if (intent === "guru") return "Future Guru";
  if (intent === "both") return "Pet Parent + Future Guru";
  if (intent === "ambassador") return "Ambassador";
  return "Pet Parent";
}

function getRoleFromIntent(intent: AccountIntent) {
  if (intent === "guru") return "guru";
  if (intent === "ambassador") return "ambassador";
  if (intent === "both") return "both";
  return "customer";
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
  const displayName = buildStarterGuruName(fullName);
  const { firstName, lastName } = getNameParts(displayName);
  const slug = buildStarterGuruSlug(userId, displayName);

  await supabase.from("profiles").upsert({
    id: userId,
    full_name: displayName,
    first_name: firstName || null,
    last_name: lastName || null,
    email: email?.trim() || null,
    phone: phone?.trim() || null,
    role: "guru",
    source,
    zip_code: zipCode?.trim() || null,
    service_area: serviceArea?.trim() || null,
    updated_at: now,
  });

  const { data: existingGuru } = await supabase
    .from("gurus")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  const starterGuruPayload = {
    user_id: userId,
    display_name: displayName,
    full_name: displayName,
    slug,
    zip_code: zipCode?.trim() || null,
    service_area: serviceArea?.trim() || null,
    is_public: false,
    onboarding_completed: false,
    profile_completed: false,
    updated_at: now,
  };

  if (existingGuru?.id) {
    await supabase
      .from("gurus")
      .update(starterGuruPayload)
      .eq("user_id", userId);
    return;
  }

  await supabase.from("gurus").insert({
    ...starterGuruPayload,
    created_at: now,
  });
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
      status: "active",
      referral_status: "active",
      onboarding_status: "started",
      training_status: "not_started",
      dashboard_enabled: true,
      login_enabled: true,
      dashboard_slug: buildStarterGuruSlug(userId, displayName),
      base_zip_code: zipCode?.trim() || null,
      service_area: serviceArea?.trim() || null,
      updated_at: now,
    },
    { onConflict: "user_id" },
  );
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

  const startingMode = useMemo<SignupMode>(() => {
    const requestedMode = searchParams.get("mode")?.toLowerCase();

    if (
      requestedMode === "phone" ||
      requestedMode === "sms" ||
      requestedMode === "mobile"
    ) {
      return "phone";
    }

    return "email";
  }, [searchParams]);

  const nextPath = useMemo(() => searchParams.get("next") || "", [searchParams]);

  const startingAmbassadorReferralCode = useMemo(() => {
    return normalizeAmbassadorReferralCode(
      searchParams.get("ambassador") ||
        searchParams.get("ambassador_code") ||
        searchParams.get("ref") ||
        searchParams.get("referral") ||
        "",
    );
  }, [searchParams]);

  const [mode, setMode] = useState<SignupMode>(startingMode);
  const [intent, setIntent] = useState<AccountIntent>(startingIntent);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [password, setPassword] = useState("");
  const [ambassadorReferralCode, setAmbassadorReferralCode] = useState(
    startingAmbassadorReferralCode,
  );
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const redirectPath = getRedirectPath(intent, nextPath);

  function resetAlerts() {
    setError("");
    setMessage("");
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
            role: getRoleFromIntent(intent),
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
        await ensureReferralCode(userId, cleanName, getRoleFromIntent(intent));
        await ensureUserRole(userId, getRoleFromIntent(intent));
        if (shouldCreatePetParentProfile(intent)) await ensureUserRole(userId, "customer");
        if (shouldCreateGuruProfile(intent)) await ensureUserRole(userId, "guru");
        if (intent === "ambassador") await ensureUserRole(userId, "ambassador");

        if (shouldCreateGuruProfile(intent)) {
          await ensureStarterGuruProfile({
            userId,
            fullName: cleanName,
            email: cleanEmail,
            zipCode: cleanZipCode,
            serviceArea: serviceArea.trim() || cleanZipCode,
            source: "sitguru_guru_signup_page",
          });
        } else if (intent === "ambassador") {
          await ensureStarterAmbassadorProfile({
            userId,
            fullName: cleanName,
            email: cleanEmail,
            zipCode: cleanZipCode,
            serviceArea: serviceArea.trim() || cleanZipCode,
            source: "sitguru_ambassador_signup_page",
          });
        } else {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: cleanName,
            first_name: firstName || null,
            last_name: lastName || null,
            email: cleanEmail,
            role: getRoleFromIntent(intent),
            source: "sitguru_signup_page",
            zip_code: cleanZipCode,
            service_area: serviceArea.trim() || cleanZipCode,
            referral_code: buildReferralCode(userId, cleanName),
            updated_at: new Date().toISOString(),
          });
        }
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
            role: getRoleFromIntent(intent),
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
          ambassador_referral_code: cleanAmbassadorReferralCode || null,
        },
      });

      const userId = data.user?.id;

      if (userId) {
        if (shouldCreateGuruProfile(intent)) {
          await ensureStarterGuruProfile({
            userId,
            fullName: cleanName,
            phone: normalizedPhone,
            zipCode: cleanZipCode,
            source: "sitguru_guru_phone_signup",
          });
        } else {
          await supabase.from("profiles").upsert({
            id: userId,
            full_name: cleanName,
            first_name: firstName || null,
            last_name: lastName || null,
            phone: normalizedPhone,
            role: getRoleFromIntent(intent),
            source: "sitguru_phone_signup",
            zip_code: cleanZipCode,
            updated_at: new Date().toISOString(),
          });
        }
      }

      router.push(redirectPath);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "That phone code was not accepted. Please try again.",
      );
    } finally {
      setPhoneLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Back home
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-2 text-lg font-black text-slate-950"
            aria-label="SitGuru homepage"
          >
            <img
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              className="h-10 w-auto"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-8 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:py-12">
          <div className="relative overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-emerald-100 blur-3xl" />
            <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-sky-100 blur-3xl" />

            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                <Sparkles className="h-4 w-4" />
                Trusted Pet Care. Simplified.
              </div>

              <h1 className="mt-6 max-w-2xl text-4xl font-black leading-[0.96] tracking-[-0.05em] text-slate-950 sm:text-5xl lg:text-6xl">
                Create your free SitGuru account.
              </h1>

              <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-slate-700 sm:text-lg">
                Join as a Pet Parent to find trusted local care, apply as a
                Future Guru, or choose both if you want full SitGuru access.
              </p>

              <div className="mt-7 grid gap-3">
                {[
                  "Free signup for Pet Parents",
                  "Mobile-friendly phone, Google, or email signup",
                  "Trusted local Gurus and safety-first workflows",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                    <p className="text-sm font-bold leading-6 text-slate-800">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 rounded-[1.75rem] bg-[linear-gradient(135deg,#064e3b,#059669)] p-5 text-white shadow-2xl shadow-emerald-900/20">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black">
                      Built for trust from the first click.
                    </p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
                      SitGuru helps Pet Parents and Gurus connect with clear
                      profiles, safer booking steps, and support-focused care
                      workflows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-slate-200 bg-white p-5 shadow-[0_24px_80px_rgba(15,23,42,0.08)] sm:p-7 lg:p-8">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                  <PawPrint className="h-7 w-7" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                    Sign Up Free
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-slate-950">
                    Start in less than a minute.
                  </h2>
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {accountOptions.map((option) => {
                  const active = intent === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        setIntent(option.key);
                        resetAlerts();
                      }}
                      className={[
                        "rounded-3xl border p-4 text-left transition",
                        active
                          ? "border-emerald-500 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.14)]"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50",
                      ].join(" ")}
                    >
                      <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[11px] font-black uppercase tracking-[0.1em] text-emerald-800 shadow-sm">
                        {option.badge}
                      </div>
                      <p className="text-base font-black text-slate-950">
                        {option.title}
                      </p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    resetAlerts();
                  }}
                  className={[
                    "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                    mode === "email"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:bg-white/70",
                  ].join(" ")}
                >
                  <Mail className="h-4 w-4" />
                  Email
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("phone");
                    resetAlerts();
                  }}
                  className={[
                    "inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                    mode === "phone"
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-500 hover:bg-white/70",
                  ].join(" ")}
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-800 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
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
                  disabled
                  className="inline-flex min-h-[52px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-base font-black text-slate-400"
                >
                  <Apple className="h-5 w-5" />
                  Continue with Apple — Coming Soon
                </button>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                  or use {mode}
                </span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              {mode === "email" ? (
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <div>
                    <label
                      htmlFor="full-name"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      Full name
                    </label>
                    <div className="relative">
                      <UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="full-name"
                        value={fullName}
                        onChange={(event) => setFullName(event.target.value)}
                        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Your full name"
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="you@example.com"
                        autoComplete="email"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="zip-code"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      ZIP code
                    </label>
                    <input
                      id="zip-code"
                      value={zipCode}
                      onChange={(event) =>
                        setZipCode(
                          event.target.value.replace(/\D/g, "").slice(0, 5),
                        )
                      }
                      inputMode="numeric"
                      maxLength={5}
                      className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="18951"
                      autoComplete="postal-code"
                      required
                    />
                  </div>


                  {(intent === "guru" || intent === "ambassador") ? (
                    <div>
                      <label
                        htmlFor="service-area"
                        className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                      >
                        {intent === "ambassador" ? "Community area" : "Service area"} <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="service-area"
                        value={serviceArea}
                        onChange={(event) => setServiceArea(event.target.value)}
                        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder={intent === "ambassador" ? "Example: Quakertown schools and local events" : "Example: Quakertown, Perkasie, Doylestown"}
                        required
                      />
                    </div>
                  ) : null}

                  <div>
                    <label
                      htmlFor="ambassador-referral-code"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                                            Ambassador referral code
                    </label>
                    <input
                      id="ambassador-referral-code"
                      value={ambassadorReferralCode}
                      onChange={(event) =>
                        setAmbassadorReferralCode(
                          normalizeAmbassadorReferralCode(event.target.value),
                        )
                      }
                      inputMode="text"
                      maxLength={32}
                      className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold uppercase text-slate-950 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Example: KAMERINCOX"
                      autoComplete="off"
                    />
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      Optional — enter this if an Ambassador, Pet Parent, Guru,
                      or SitGuru referral partner referred you.
                    </p>
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-12 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Create a secure password"
                        autoComplete="new-password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm font-semibold leading-6 text-slate-700">
                      I agree to SitGuru&apos;s Terms, Privacy Policy, and
                      account communications related to booking, safety, and
                      support.
                    </span>
                  </label>

                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="flex gap-2 text-sm font-bold leading-6 text-rose-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {error}
                      </p>
                    </div>
                  ) : null}

                  {message ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="flex gap-2 text-sm font-bold leading-6 text-emerald-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        {message}
                      </p>
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Create {getIntentLabel(intent)} Account
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="phone-name"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      Full name
                    </label>
                    <input
                      id="phone-name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Your full name"
                      autoComplete="name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      Mobile phone
                    </label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                      <input
                        id="phone"
                        value={phone}
                        onChange={(event) =>
                          setPhone(formatPhoneNumber(event.target.value))
                        }
                        inputMode="tel"
                        maxLength={14}
                        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="(555) 123-4567"
                        autoComplete="tel"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="phone-zip"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      ZIP code
                    </label>
                    <input
                      id="phone-zip"
                      value={zipCode}
                      onChange={(event) =>
                        setZipCode(
                          event.target.value.replace(/\D/g, "").slice(0, 5),
                        )
                      }
                      inputMode="numeric"
                      maxLength={5}
                      className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="18951"
                      autoComplete="postal-code"
                      required
                    />
                  </div>


                  <div>
                    <label
                      htmlFor="phone-ambassador-referral-code"
                      className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                    >
                      Ambassador referral code
                    </label>
                    <input
                      id="phone-ambassador-referral-code"
                      value={ambassadorReferralCode}
                      onChange={(event) =>
                        setAmbassadorReferralCode(
                          normalizeAmbassadorReferralCode(event.target.value),
                        )
                      }
                      inputMode="text"
                      maxLength={32}
                      className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold uppercase text-slate-950 outline-none transition placeholder:normal-case placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                      placeholder="Example: KAMERINCOX"
                      autoComplete="off"
                    />
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      Optional — enter this if an Ambassador, Pet Parent, Guru,
                      or SitGuru referral partner referred you.
                    </p>
                  </div>

                  {phoneCodeSent ? (
                    <div>
                      <label
                        htmlFor="phone-code"
                        className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700"
                      >
                        6-digit code
                      </label>
                      <input
                        id="phone-code"
                        value={phoneCode}
                        onChange={(event) =>
                          setPhoneCode(
                            event.target.value.replace(/\D/g, "").slice(0, 6),
                          )
                        }
                        inputMode="numeric"
                        maxLength={6}
                        className="min-h-[54px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xl font-black tracking-[0.3em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="000000"
                      />
                    </div>
                  ) : null}

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => setAcceptedTerms(event.target.checked)}
                      className="mt-1 h-5 w-5 rounded border-slate-300 accent-emerald-600"
                    />
                    <span className="text-sm font-semibold leading-6 text-slate-700">
                      I agree to SitGuru&apos;s Terms, Privacy Policy, and
                      account communications related to booking, safety, and
                      support.
                    </span>
                  </label>

                  {error ? (
                    <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
                      <p className="flex gap-2 text-sm font-bold leading-6 text-rose-800">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        {error}
                      </p>
                    </div>
                  ) : null}

                  {message ? (
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="flex gap-2 text-sm font-bold leading-6 text-emerald-800">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                        {message}
                      </p>
                    </div>
                  ) : null}

                  {!phoneCodeSent ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneLoading}
                      className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {phoneLoading ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Sending code...
                        </>
                      ) : (
                        <>
                          Send Phone Code
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </button>
                  ) : (
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <button
                        type="button"
                        onClick={handleVerifyPhoneCode}
                        disabled={phoneLoading}
                        className="inline-flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {phoneLoading ? (
                          <>
                            <Loader2 className="h-5 w-5 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          <>
                            Verify & Continue
                            <ArrowRight className="h-5 w-5" />
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendPhoneCode}
                        disabled={phoneLoading}
                        className="inline-flex min-h-[56px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Resend
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm font-bold text-slate-600 sm:flex-row">
                <p>
                  Already have a SitGuru account?{" "}
                  <Link
                    href={`/login?role=${intent}&next=${encodeURIComponent(
                      redirectPath,
                    )}`}
                    className="font-black text-emerald-700 hover:text-emerald-900"
                  >
                    Log in
                  </Link>
                </p>

                <div className="flex flex-col items-center gap-2 sm:items-end">
                  <Link
                    href="/ambassador/login"
                    className="inline-flex min-h-11 items-center justify-center rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2 text-sm font-black text-emerald-800 transition hover:border-emerald-300 hover:bg-white"
                  >
                    Ambassador Login
                  </Link>

                  <Link
                    href="/"
                    className="font-black text-emerald-700 hover:text-emerald-900"
                  >
                    Back to SitGuru
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <footer className="pb-4 text-center text-xs font-semibold text-slate-500">
          © 2026 SitGuru. All rights reserved.
        </footer>
      </div>
    </main>
  );
}

function SignupPageFallback() {
  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_45%,#ecfdf5_100%)] px-4 py-10 text-slate-950">
      <div className="mx-auto max-w-xl rounded-[2rem] border border-slate-200 bg-white p-8 text-center shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
          <PawPrint className="h-7 w-7" />
        </div>
        <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
          Loading SitGuru signup...
        </h1>
        <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
          Getting your signup options ready.
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageFallback />}>
      <SignupPageContent />
    </Suspense>
  );
}
