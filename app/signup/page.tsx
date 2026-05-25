"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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
import { FormEvent, ReactNode, Suspense, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type AccountIntent = "pet_parent" | "guru" | "both";
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
    key: "both",
    title: "Both",
    description: "Book care as a Pet Parent and apply to become a Guru.",
    badge: "Full access",
  },
];

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

function normalizeIntent(value?: string | null): AccountIntent {
  const normalized = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/-/g, "_");

  if (["guru", "future_guru", "become_a_guru"].includes(normalized)) {
    return "guru";
  }

  if (["both", "dual", "pet_parent_guru", "customer_guru"].includes(normalized)) {
    return "both";
  }

  return "pet_parent";
}

function getRedirectPath(intent: AccountIntent, requestedNext?: string | null) {
  if (requestedNext && requestedNext.startsWith("/")) return requestedNext;
  if (intent === "guru") return "/become-a-guru";
  return "/customer/dashboard";
}

function getIntentLabel(intent: AccountIntent) {
  if (intent === "guru") return "Future Guru";
  if (intent === "both") return "Pet Parent + Future Guru";
  return "Pet Parent";
}

function getProfileRole(intent: AccountIntent) {
  return intent === "guru" ? "guru" : "customer";
}

function getLoginHref(intent: AccountIntent) {
  return intent === "guru" ? "/guru/login" : "/customer/login";
}

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildCallbackUrl({
  intent,
  redirectPath,
}: {
  intent: AccountIntent;
  redirectPath: string;
}) {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://www.sitguru.com";

  const params = new URLSearchParams({
    next: redirectPath,
    intent,
  });

  return `${origin}/auth/callback?${params.toString()}`;
}

function SignupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const startingIntent = useMemo<AccountIntent>(() => {
    return normalizeIntent(
      searchParams.get("role") ||
        searchParams.get("intent") ||
        searchParams.get("account") ||
        searchParams.get("type"),
    );
  }, [searchParams]);

  const requestedNext = searchParams.get("next");

  const [mode, setMode] = useState<SignupMode>("email");
  const [intent, setIntent] = useState<AccountIntent>(startingIntent);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [phone, setPhone] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [phoneCodeSent, setPhoneCodeSent] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const redirectPath = getRedirectPath(intent, requestedNext);
  const loginHref = getLoginHref(intent);

  function resetAlerts() {
    setError("");
    setMessage("");
  }

  function handleIntentChange(nextIntent: AccountIntent) {
    setIntent(nextIntent);
    resetAlerts();
  }

  async function createProfile(userId: string, profileEmail?: string | null) {
    const { firstName, lastName } = splitName(fullName);

    await supabase.from("profiles").upsert({
      id: userId,
      full_name: fullName.trim() || null,
      first_name: firstName || null,
      last_name: lastName || null,
      email: profileEmail || email.trim() || null,
      role: getProfileRole(intent),
    });
  }

  async function handleGoogleSignup() {
    try {
      resetAlerts();
      setGoogleLoading(true);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: buildCallbackUrl({ intent, redirectPath }),
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

      if (!fullName.trim()) {
        setError("Please enter your full name.");
        return;
      }

      if (!email.trim()) {
        setError("Please enter your email address.");
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

      const { data, error: signupError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: buildCallbackUrl({ intent, redirectPath }),
          data: {
            full_name: fullName.trim(),
            role: getProfileRole(intent),
            account_intent: intent,
            signup_source: "sitguru_signup_page",
            zip_code: zipCode.trim(),
          },
        },
      });

      if (signupError) throw signupError;

      if (data.user?.id) {
        await createProfile(data.user.id, data.user.email || email.trim());
      }

      setMessage(
        "Account started. Please check your email to confirm your SitGuru account.",
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

      const normalizedPhone = toE164UsPhone(phone);

      if (!normalizedPhone) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      setPhoneLoading(true);

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: normalizedPhone,
        options: {
          data: {
            full_name: fullName.trim(),
            role: getProfileRole(intent),
            account_intent: intent,
            signup_source: "sitguru_phone_signup",
            zip_code: zipCode.trim(),
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
          : "We could not send the phone code. Please use email or Google signup for now.",
      );
    } finally {
      setPhoneLoading(false);
    }
  }

  async function handleVerifyPhoneCode() {
    try {
      resetAlerts();

      const normalizedPhone = toE164UsPhone(phone);

      if (!normalizedPhone) {
        setError("Please enter a valid 10-digit phone number.");
        return;
      }

      if (phoneCode.trim().length !== 6) {
        setError("Please enter the 6-digit code.");
        return;
      }

      setPhoneLoading(true);

      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        phone: normalizedPhone,
        token: phoneCode.trim(),
        type: "sms",
      });

      if (verifyError) throw verifyError;

      if (data.user?.id) {
        await createProfile(data.user.id, data.user.email || null);
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
    <main className="min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,#ffffff_0%,#f7fffb_46%,#eafff5_100%)] text-slate-950">
      <div className="mx-auto flex min-h-screen w-full max-w-[1500px] flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            <ChevronLeft className="h-4 w-4" />
            Home
          </Link>

          <Link href="/" aria-label="SitGuru homepage" className="shrink-0">
            <img
              src="/images/sitguru-logo-cropped.png"
              alt="SitGuru"
              className="h-10 w-auto sm:h-12"
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          </Link>

          <Link
            href={loginHref}
            className="inline-flex min-h-[44px] items-center rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50"
          >
            Log in
          </Link>
        </header>

        <section className="grid flex-1 items-center gap-6 py-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-8 lg:py-10">
          <aside className="hidden overflow-hidden rounded-[2.25rem] border border-emerald-100 bg-white p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)] lg:block">
            <div className="relative min-h-[680px] overflow-hidden rounded-[1.8rem] bg-[linear-gradient(135deg,#ecfdf5_0%,#ffffff_45%,#dff8ee_100%)] p-8">
              <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-emerald-200/70 blur-3xl" />
              <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-sky-200/60 blur-3xl" />

              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.12em] text-emerald-800 shadow-sm">
                  <Sparkles className="h-4 w-4" />
                  Trusted Pet Care. Simplified.
                </div>

                <h1 className="mt-6 max-w-xl text-6xl font-black leading-[0.95] tracking-[-0.055em] text-slate-950">
                  Join SitGuru free.
                </h1>

                <p className="mt-5 max-w-xl text-lg font-semibold leading-8 text-slate-700">
                  Pet Parents can find trusted local care. Future Gurus can apply to offer care. Choose the access that fits you today.
                </p>

                <div className="mt-8 grid gap-4">
                  {[
                    "Free account for Pet Parents",
                    "Clear path for Future Gurus",
                    "Google, email, and phone signup options",
                    "Secure booking and support-focused workflows",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-white/80 p-4 shadow-sm">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
                      <p className="text-sm font-bold leading-6 text-slate-800">{item}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 rounded-[1.6rem] bg-[linear-gradient(135deg,#064e3b,#059669)] p-5 text-white shadow-2xl shadow-emerald-900/20">
                <div className="flex items-start gap-4">
                  <div className="rounded-2xl bg-white/15 p-3">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-lg font-black">Built for trust from the first click.</p>
                    <p className="mt-2 text-sm font-semibold leading-6 text-emerald-50">
                      SitGuru keeps signup simple while helping protect Pet Parents, Gurus, bookings, and payments as the community grows.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <section className="mx-auto w-full max-w-[640px] rounded-[2rem] border border-slate-200 bg-white/95 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-7 lg:max-w-none lg:rounded-[2.25rem] lg:p-8">
            <div className="mx-auto max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700 sm:h-14 sm:w-14">
                  <PawPrint className="h-7 w-7" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">Sign Up Free</p>
                  <h2 className="text-3xl font-black leading-tight tracking-[-0.04em] text-slate-950 sm:text-4xl">
                    Join SitGuru free
                  </h2>
                </div>
              </div>

              <p className="mt-3 text-base font-semibold leading-7 text-slate-600">
                Choose Pet Parent, Guru, or both. Simple signup. Trusted community.
              </p>

              <div className="mt-5 grid gap-2 sm:grid-cols-3">
                {accountOptions.map((option) => {
                  const active = intent === option.key;

                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleIntentChange(option.key)}
                      className={[
                        "min-h-[112px] rounded-3xl border p-4 text-left transition",
                        active
                          ? "border-emerald-500 bg-emerald-50 shadow-[0_18px_45px_rgba(16,185,129,0.14)]"
                          : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/50",
                      ].join(" ")}
                    >
                      <div className="mb-3 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.1em] text-emerald-800 shadow-sm">
                        {option.badge}
                      </div>
                      <p className="text-base font-black text-slate-950">{option.title}</p>
                      <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{option.description}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-5 grid gap-3">
                <button
                  type="button"
                  onClick={handleGoogleSignup}
                  disabled={googleLoading}
                  className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <span className="text-2xl font-black text-red-500">G</span>}
                  Continue with Google
                </button>

                <button
                  type="button"
                  disabled
                  className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-base font-bold text-slate-400"
                >
                  <Apple className="h-5 w-5" />
                  Continue with Apple — Coming Soon
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setMode("phone");
                    resetAlerts();
                  }}
                  className="inline-flex min-h-[56px] w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-base font-black text-slate-800 shadow-sm transition hover:bg-slate-50"
                >
                  <Phone className="h-5 w-5" />
                  Continue with phone
                </button>
              </div>

              <div className="my-6 flex items-center gap-4">
                <div className="h-px flex-1 bg-slate-200" />
                <span className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">or</span>
                <div className="h-px flex-1 bg-slate-200" />
              </div>

              <div className="mb-5 grid grid-cols-2 gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("email");
                    resetAlerts();
                  }}
                  className={[
                    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                    mode === "email" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:bg-white/70",
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
                    "inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-black transition",
                    mode === "phone" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500 hover:bg-white/70",
                  ].join(" ")}
                >
                  <Phone className="h-4 w-4" />
                  Phone
                </button>
              </div>

              {mode === "email" ? (
                <form onSubmit={handleEmailSignup} className="space-y-4">
                  <SignupTextInput
                    id="full-name"
                    label="Full name"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Full name"
                    autoComplete="name"
                    icon={<UserRound className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
                  />

                  <SignupTextInput
                    id="email"
                    label="Email"
                    type="email"
                    value={email}
                    onChange={setEmail}
                    placeholder="Email"
                    autoComplete="email"
                    icon={<Mail className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
                  />

                  <SignupPlainInput
                    id="zip-code"
                    label="ZIP code optional"
                    value={zipCode}
                    onChange={(value) => setZipCode(value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="ZIP code optional"
                    autoComplete="postal-code"
                  />

                  <div>
                    <label htmlFor="password" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="min-h-[56px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-12 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="Create a password"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 transition hover:text-slate-800"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
                      I agree to SitGuru&apos;s Terms, Privacy Policy, and account communications related to booking, safety, and support.
                    </span>
                  </label>

                  <SignupAlerts error={error} message={message} />

                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating account...
                      </>
                    ) : (
                      <>
                        Start Free Signup
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="space-y-4">
                  <SignupPlainInput
                    id="phone-name"
                    label="Full name optional"
                    value={fullName}
                    onChange={setFullName}
                    placeholder="Full name optional"
                    autoComplete="name"
                  />

                  <SignupTextInput
                    id="phone"
                    label="Mobile phone"
                    value={phone}
                    onChange={(value) => setPhone(formatPhoneNumber(value))}
                    placeholder="(555) 123-4567"
                    autoComplete="tel"
                    icon={<Phone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />}
                    inputMode="tel"
                    maxLength={14}
                  />

                  <SignupPlainInput
                    id="phone-zip"
                    label="ZIP code optional"
                    value={zipCode}
                    onChange={(value) => setZipCode(value.replace(/\D/g, "").slice(0, 5))}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="ZIP code optional"
                    autoComplete="postal-code"
                  />

                  {phoneCodeSent ? (
                    <div>
                      <label htmlFor="phone-code" className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
                        6-digit code
                      </label>
                      <input
                        id="phone-code"
                        value={phoneCode}
                        onChange={(event) => setPhoneCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                        inputMode="numeric"
                        maxLength={6}
                        className="min-h-[56px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-xl font-black tracking-[0.3em] text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
                        placeholder="000000"
                      />
                    </div>
                  ) : null}

                  <SignupAlerts error={error} message={message} />

                  {!phoneCodeSent ? (
                    <button
                      type="button"
                      onClick={handleSendPhoneCode}
                      disabled={phoneLoading}
                      className="inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="inline-flex min-h-[58px] w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
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
                        className="inline-flex min-h-[58px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Resend
                      </button>
                    </div>
                  )}

                  <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-900">
                    Phone login depends on Supabase/Twilio SMS configuration. Email and Google signup are available now.
                  </p>
                </div>
              )}

              <div className="mt-6 flex flex-col items-center justify-between gap-3 border-t border-slate-100 pt-5 text-sm font-bold text-slate-600 sm:flex-row">
                <p>
                  Already have an account?{" "}
                  <Link href={loginHref} className="font-black text-emerald-700 hover:text-emerald-900">
                    Log in
                  </Link>
                </p>

                <div className="flex gap-4">
                  <Link href="/customer/login" className="font-black text-emerald-700 hover:text-emerald-900">
                    Pet Parent
                  </Link>
                  <Link href="/guru/login" className="font-black text-emerald-700 hover:text-emerald-900">
                    Guru
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </section>

        <footer className="pb-4 text-center text-xs font-semibold text-slate-500">
          SitGuru.com is a Graff Enterprises Company · Trusted Pet Care. Simplified.
        </footer>
      </div>
    </main>
  );
}

function SignupTextInput({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  icon,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  icon: ReactNode;
  inputMode?: "text" | "numeric" | "tel" | "email";
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
        {label}
      </label>
      <div className="relative">
        {icon}
        <input
          id={id}
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          inputMode={inputMode}
          maxLength={maxLength}
          className="min-h-[56px] w-full rounded-2xl border border-slate-200 bg-white px-12 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      </div>
    </div>
  );
}

function SignupPlainInput({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  inputMode,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete?: string;
  inputMode?: "text" | "numeric" | "tel";
  maxLength?: number;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-2 block text-xs font-black uppercase tracking-[0.12em] text-slate-700">
        {label}
      </label>
      <input
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        inputMode={inputMode}
        maxLength={maxLength}
        className="min-h-[56px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base font-bold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10"
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </div>
  );
}

function SignupAlerts({ error, message }: { error: string; message: string }) {
  return (
    <>
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
    </>
  );
}

function SignupPageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f7fffb] px-4">
      <div className="rounded-[2rem] border border-emerald-100 bg-white p-8 text-center shadow-xl">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-700" />
        <p className="mt-4 text-sm font-black text-slate-700">Loading SitGuru signup...</p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={<SignupPageLoading />}>
      <SignupPageContent />
    </Suspense>
  );
}
