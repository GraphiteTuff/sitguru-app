"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  MessageSquareText,
  Phone,
  ShieldCheck,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

type LoginMethod = "email" | "phone";

const APPROVED_ADMIN_EMAILS = new Set([
  "jason@sitguru.com",
  "nette@sitguru.com",
]);

function decodeMessage(value: string | null) {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function getDigitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function normalizeUsPhoneNumber(value: string) {
  const digitsOnly = getDigitsOnly(value);

  if (!digitsOnly) return "";

  if (digitsOnly.length === 10) {
    return `+1${digitsOnly}`;
  }

  if (digitsOnly.length === 11 && digitsOnly.startsWith("1")) {
    return `+${digitsOnly}`;
  }

  return digitsOnly ? `+${digitsOnly}` : "";
}

function formatPhoneForDisplay(value: string) {
  const digitsOnly = getDigitsOnly(value);

  const normalizedDigits =
    digitsOnly.length === 11 && digitsOnly.startsWith("1")
      ? digitsOnly.slice(1)
      : digitsOnly.slice(0, 10);

  if (!normalizedDigits) return "";

  if (normalizedDigits.length <= 3) {
    return `(${normalizedDigits}`;
  }

  if (normalizedDigits.length <= 6) {
    return `(${normalizedDigits.slice(0, 3)}) ${normalizedDigits.slice(3)}`;
  }

  return `(${normalizedDigits.slice(0, 3)}) ${normalizedDigits.slice(
    3,
    6,
  )}-${normalizedDigits.slice(6)}`;
}

function isProbablyValidE164Phone(value: string) {
  return /^\+[1-9]\d{9,14}$/.test(value);
}

function isApprovedAdminEmail(value: string | null | undefined) {
  return APPROVED_ADMIN_EMAILS.has(String(value || "").trim().toLowerCase());
}

export default function AdminLoginPage() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<LoginMethod>("email");
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [displaySentPhone, setDisplaySentPhone] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  const approvedAdminList = useMemo(
    () => Array.from(APPROVED_ADMIN_EMAILS).join(" or "),
    [],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setErrorMessage(decodeMessage(params.get("error")));
    setStatusMessage(decodeMessage(params.get("status")));
  }, []);

  function clearMessages() {
    setErrorMessage("");
    setStatusMessage("");
  }

  function handlePhoneChange(value: string) {
    const digitsOnly = getDigitsOnly(value);

    if (!digitsOnly) {
      setPhone("");
      return;
    }

    setPhone(formatPhoneForDisplay(digitsOnly));
    clearMessages();
  }

  async function handleSendPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearMessages();

    const formattedPhone = normalizeUsPhoneNumber(phone);

    if (!isProbablyValidE164Phone(formattedPhone)) {
      setErrorMessage(
        "Enter a valid U.S. mobile number in the format (856) 555-1234.",
      );
      return;
    }

    setIsSendingCode(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: false,
        data: {
          source: "admin_phone_login",
        },
      },
    });

    setIsSendingCode(false);

    if (error) {
      setErrorMessage(
        error.message ||
          "SitGuru could not send the admin phone code. Please use email and password.",
      );
      return;
    }

    setNormalizedPhone(formattedPhone);
    setDisplaySentPhone(formatPhoneForDisplay(formattedPhone));
    setCode("");
    setCodeSent(true);
    setStatusMessage("Admin phone code sent. Use the newest SitGuru text code.");
  }

  async function handleSendNewPhoneCode() {
    clearMessages();
    setCode("");

    if (!normalizedPhone) {
      setCodeSent(false);
      return;
    }

    setIsSendingCode(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: normalizedPhone,
      options: {
        shouldCreateUser: false,
        data: {
          source: "admin_phone_login_resend",
        },
      },
    });

    setIsSendingCode(false);

    if (error) {
      setErrorMessage(
        error.message ||
          "SitGuru could not send a new admin phone code. Please use email and password.",
      );
      return;
    }

    setStatusMessage("New admin phone code sent. Use the latest text message.");
  }

  async function verifyAdminAccess(userId: string, userEmail: string | null) {
    if (isApprovedAdminEmail(userEmail)) {
      return true;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, role")
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      console.warn("Admin phone login profile lookup failed:", profileError);
    }

    if (isApprovedAdminEmail(profile?.email)) {
      return true;
    }

    return false;
  }

  async function handleVerifyPhoneCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    clearMessages();

    const cleanCode = code.replace(/\D/g, "");

    if (!normalizedPhone) {
      setErrorMessage("Please send an admin SitGuru code first.");
      return;
    }

    if (cleanCode.length !== 6) {
      setErrorMessage("Enter the 6-digit SitGuru code from your text message.");
      return;
    }

    setIsVerifyingCode(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: cleanCode,
      type: "sms",
    });

    if (error || !data.session || !data.user?.id) {
      setIsVerifyingCode(false);
      setErrorMessage(
        error?.message ||
          "That SitGuru admin code did not work. Please check the latest text message and try again.",
      );
      return;
    }

    const hasAdminAccess = await verifyAdminAccess(
      data.user.id,
      data.user.email || null,
    );

    if (!hasAdminAccess) {
      await supabase.auth.signOut();

      setIsVerifyingCode(false);
      setErrorMessage(
        `Phone code verified, but this account is not approved for Admin. Admin phone access is restricted to ${approvedAdminList}.`,
      );
      return;
    }

    setStatusMessage("Admin verified. Taking you to the Admin dashboard...");
    setIsVerifyingCode(false);

    router.replace("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#f3f8f5] px-3 py-4 text-slate-950 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="w-full rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.10)] sm:rounded-[2rem] sm:p-7 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-5 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center rounded-2xl transition hover:opacity-90"
                aria-label="Back to SitGuru homepage"
              >
                <Image
                  src="/images/sitguru-admin-avatar.jpg"
                  alt="SitGuru Admin"
                  width={76}
                  height={76}
                  priority
                  className="h-14 w-14 rounded-2xl border border-emerald-100 bg-white object-cover shadow-sm"
                />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-900 transition hover:border-emerald-200 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </div>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Admin Login
              </div>

              <h1 className="text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Sign in to Admin
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-600">
                Use your approved SitGuru Super User email/password or a secure
                admin phone code to continue.
              </p>
            </div>

            <div className="mb-5 grid gap-3 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setLoginMethod("email");
                  clearMessages();
                }}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  loginMethod === "email"
                    ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                    : "text-green-900 hover:bg-white/70"
                }`}
              >
                <Mail className="h-4 w-4" />
                Email Login
              </button>

              <button
                type="button"
                onClick={() => {
                  setLoginMethod("phone");
                  clearMessages();
                }}
                className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition ${
                  loginMethod === "phone"
                    ? "bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-100"
                    : "text-green-900 hover:bg-white/70"
                }`}
              >
                <Phone className="h-4 w-4" />
                Phone Code
              </button>
            </div>

            {loginMethod === "email" ? (
              <form
                noValidate
                action="/api/admin/login"
                method="post"
                className="space-y-4 sm:space-y-5"
              >
                <div>
                  <label
                    htmlFor="admin-email"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Email
                  </label>

                  <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                    <Mail className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      id="admin-email"
                      name="email"
                      type="email"
                      autoComplete="username"
                      className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="you@sitguru.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="admin-password"
                    className="mb-2 block text-sm font-black text-slate-800"
                  >
                    Password
                  </label>

                  <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                    <Lock className="h-5 w-5 shrink-0 text-slate-400" />

                    <input
                      id="admin-password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                      placeholder="Enter password"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-green-800"
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

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("phone");
                    clearMessages();
                  }}
                  className="text-sm font-black text-emerald-800 transition hover:text-green-900 hover:underline"
                >
                  Log in with phone code
                </button>

                {statusMessage ? (
                  <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                    {statusMessage}
                  </div>
                ) : null}

                {errorMessage ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  className="flex w-full items-center justify-center rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-green-900"
                >
                  Sign In
                </button>
              </form>
            ) : (
              <div className="rounded-[1.5rem] border border-emerald-100 bg-emerald-50/70 p-3 sm:p-4">
                <section className="rounded-[1.5rem] border border-emerald-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
                    <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
                      <ShieldCheck className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h2 className="text-2xl font-black tracking-tight text-slate-900">
                        Log in with admin phone code
                      </h2>

                      <p className="mt-1 text-base font-bold leading-7 text-slate-700">
                        Enter your approved Super User mobile number and
                        SitGuru will text you a secure 6-digit admin code.
                      </p>

                      <p className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-emerald-800 ring-1 ring-emerald-200">
                        Super User access only
                      </p>
                    </div>
                  </div>

                  {!codeSent ? (
                    <form onSubmit={handleSendPhoneCode} className="mt-5 space-y-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="admin-phone-number"
                          className="block text-sm font-black text-slate-800"
                        >
                          Mobile phone number
                        </label>

                        <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                          <Phone className="h-5 w-5 shrink-0 text-emerald-700" />

                          <input
                            id="admin-phone-number"
                            name="phone"
                            type="tel"
                            inputMode="tel"
                            autoComplete="tel"
                            value={phone}
                            onChange={(event) =>
                              handlePhoneChange(event.target.value)
                            }
                            placeholder="(856) 555-1234"
                            maxLength={14}
                            className="ml-3 w-full bg-transparent text-base font-bold text-slate-950 outline-none placeholder:text-slate-400"
                          />
                        </div>

                        <p className="text-sm font-semibold leading-6 text-slate-600">
                          Admin phone login only works for phone-auth accounts
                          tied to approved SitGuru Super User emails.
                        </p>
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingCode}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSendingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {isSendingCode
                          ? "Sending admin code..."
                          : "Text me an admin code"}
                      </button>
                    </form>
                  ) : (
                    <form
                      onSubmit={handleVerifyPhoneCode}
                      className="mt-5 space-y-4"
                    >
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-black text-emerald-800">
                          <MessageSquareText className="h-4 w-4 shrink-0" />
                          Code sent to {displaySentPhone || normalizedPhone}
                        </div>

                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                          Use the newest SitGuru code. Older codes may not
                          verify.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setCodeSent(false);
                            setCode("");
                            clearMessages();
                          }}
                          className="mt-2 text-sm font-black text-slate-700 underline-offset-4 hover:text-emerald-800 hover:underline"
                        >
                          Use a different number
                        </button>
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="admin-phone-code"
                          className="block text-sm font-black text-slate-800"
                        >
                          6-digit SitGuru admin code
                        </label>

                        <input
                          id="admin-phone-code"
                          name="code"
                          type="text"
                          inputMode="numeric"
                          autoComplete="one-time-code"
                          value={code}
                          onChange={(event) => {
                            const nextValue = event.target.value
                              .replace(/\D/g, "")
                              .slice(0, 6);

                            setCode(nextValue);
                            clearMessages();
                          }}
                          placeholder="123456"
                          maxLength={6}
                          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-slate-950 outline-none transition placeholder:text-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isVerifyingCode}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-green-800 px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-green-900 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isVerifyingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {isVerifyingCode
                          ? "Verifying admin access..."
                          : "Verify & enter Admin"}
                      </button>

                      <button
                        type="button"
                        onClick={handleSendNewPhoneCode}
                        disabled={isSendingCode}
                        className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {isSendingCode ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : null}
                        {isSendingCode
                          ? "Sending new code..."
                          : "Send a new admin code"}
                      </button>
                    </form>
                  )}
                </section>

                <button
                  type="button"
                  onClick={() => {
                    setLoginMethod("email");
                    clearMessages();
                  }}
                  className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800 transition hover:bg-emerald-50"
                >
                  Use email and password instead
                </button>
              </div>
            )}

            {statusMessage ? (
              <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                {statusMessage}
              </div>
            ) : null}

            {errorMessage ? (
              <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                {errorMessage}
              </div>
            ) : null}

            <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-2">
              <Link
                href="/"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Back to Homepage
              </Link>

              <Link
                href="/forgot-password"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-green-800"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Super User access only.
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-green-900">
                Admin access is reserved for approved SitGuru Super Users.
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                For live-site safety, sign in only when you need to manage
                Admin.
              </p>
            </div>

            <p className="mt-5 text-center text-xs font-bold leading-5 text-slate-400">
              Need help? Contact{" "}
              <a
                href="mailto:support@sitguru.com"
                className="font-black text-green-800 hover:underline"
              >
                support@sitguru.com
              </a>
              .
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}