"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PhoneCodeLoginProps = {
  nextPath: string;
  role: "customer" | "guru";
  heading?: string;
  description?: string;
  submitLabel?: string;
  verifyLabel?: string;
  compact?: boolean;
};

function getSafeRedirectPath(value: string, fallback: string) {
  try {
    const decoded = decodeURIComponent(value || "").trim();

    if (!decoded.startsWith("/")) return fallback;
    if (decoded.startsWith("//")) return fallback;
    if (decoded.includes("://")) return fallback;

    return decoded;
  } catch {
    return fallback;
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

function getRoleLabel(role: "customer" | "guru") {
  return role === "guru" ? "Pet Care Guru" : "Pet Parent";
}

function getProfileRole(role: "customer" | "guru") {
  return role === "guru" ? "guru" : "customer";
}

export default function PhoneCodeLogin({
  nextPath,
  role,
  heading = "Continue with phone",
  description = "Enter your mobile number and we’ll text you a secure 6-digit SitGuru code.",
  submitLabel = "Text me a code",
  verifyLabel = "Verify & continue",
  compact = false,
}: PhoneCodeLoginProps) {
  const router = useRouter();

  const fallbackPath =
    role === "guru" ? "/guru/dashboard" : "/customer/dashboard";

  const safeNextPath = useMemo(
    () => getSafeRedirectPath(nextPath, fallbackPath),
    [nextPath, fallbackPath],
  );

  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [normalizedPhone, setNormalizedPhone] = useState("");
  const [displaySentPhone, setDisplaySentPhone] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  function handlePhoneChange(value: string) {
    const digitsOnly = getDigitsOnly(value);

    /**
     * Keep the visual format user-friendly while preserving a clean
     * E.164 value for Supabase/Twilio behind the scenes.
     */
    if (!digitsOnly) {
      setPhone("");
      return;
    }

    setPhone(formatPhoneForDisplay(digitsOnly));
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setStatusMessage("");

    const formattedPhone = normalizeUsPhoneNumber(phone);

    if (!isProbablyValidE164Phone(formattedPhone)) {
      setErrorMessage(
        "Enter a valid mobile number in the format (856) 555-1234.",
      );
      return;
    }

    setIsSending(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone: formattedPhone,
      options: {
        shouldCreateUser: true,
        data: {
          role: getProfileRole(role),
          source: "phone_login",
        },
      },
    });

    setIsSending(false);

    if (error) {
      setErrorMessage(
        error.message || "We could not send the code. Please try again.",
      );
      return;
    }

    setNormalizedPhone(formattedPhone);
    setDisplaySentPhone(formatPhoneForDisplay(formattedPhone));
    setCodeSent(true);
    setStatusMessage("Code sent. Check your text messages.");
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setStatusMessage("");

    const cleanCode = code.replace(/\D/g, "");

    if (!normalizedPhone) {
      setErrorMessage("Please send a code first.");
      return;
    }

    if (cleanCode.length !== 6) {
      setErrorMessage("Enter the 6-digit code from your text message.");
      return;
    }

    setIsVerifying(true);

    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizedPhone,
      token: cleanCode,
      type: "sms",
    });

    if (error || !data.session) {
      setIsVerifying(false);
      setErrorMessage(
        error?.message || "That code did not work. Please try again.",
      );
      return;
    }

    try {
      const userId = data.user?.id;
      const userEmail = data.user?.email || null;

      if (userId) {
        await supabase.from("profiles").upsert(
          {
            id: userId,
            email: userEmail,
            role: getProfileRole(role),
          },
          {
            onConflict: "id",
          },
        );
      }
    } catch (profileError) {
      console.error("Phone login profile sync failed:", profileError);
    }

    setStatusMessage("Verified. Taking you to SitGuru...");
    setIsVerifying(false);

    router.replace(safeNextPath);
    router.refresh();
  }

  return (
    <section
      className={`rounded-[1.5rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-sky-50 shadow-sm ${
        compact ? "mt-4 p-4" : "mt-8 p-5"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className="mt-1 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
          <ShieldCheck className="h-5 w-5" />
        </span>

        <div>
          <h3 className="text-xl font-bold tracking-tight text-slate-950">
            {heading}
          </h3>

          <p className="mt-1 text-sm leading-6 text-slate-600">
            {description}
          </p>

          <p className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-700 ring-1 ring-emerald-100">
            Signing in as: {getRoleLabel(role)}
          </p>
        </div>
      </div>

      {!codeSent ? (
        <form onSubmit={handleSendCode} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="phone-login-number"
              className="block text-sm font-bold text-slate-800"
            >
              Mobile phone number
            </label>

            <input
              id="phone-login-number"
              name="phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              value={phone}
              onChange={(event) => handlePhoneChange(event.target.value)}
              placeholder="(856) 555-1234"
              maxLength={14}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />

            <p className="text-xs font-medium text-slate-500">
              Enter your U.S. mobile number. SitGuru will securely send it as +1
              format for the 6-digit verification code.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSending ? "Sending code..." : submitLabel}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-white px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-700">
              <MessageSquareText className="h-4 w-4" />
              Code sent to {displaySentPhone || normalizedPhone}
            </div>

            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setStatusMessage("");
                setErrorMessage("");
              }}
              className="mt-2 text-xs font-bold text-slate-500 underline-offset-4 hover:text-emerald-700 hover:underline"
            >
              Use a different number
            </button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone-login-code"
              className="block text-sm font-bold text-slate-800"
            >
              6-digit code
            </label>

            <input
              id="phone-login-code"
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
              }}
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-center text-2xl font-black tracking-[0.35em] text-slate-950 placeholder:text-slate-300 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isVerifying ? "Verifying..." : verifyLabel}
          </button>

          <button
            type="button"
            onClick={() => {
              setCode("");
              setErrorMessage("");
              setStatusMessage("");
              setCodeSent(false);

              window.setTimeout(() => {
                const phoneInput = document.getElementById(
                  "phone-login-number",
                );
                phoneInput?.focus();
              }, 0);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
          >
            Send a new code
          </button>
        </form>
      )}

      {statusMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
          <CheckCircle2 className="h-4 w-4" />
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}