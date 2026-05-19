"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  MessageSquareText,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type PhoneLoginRole = "customer" | "guru";
type ProfileRole = "customer" | "guru" | "both";

type PhoneCodeLoginProps = {
  nextPath: string;
  role: PhoneLoginRole;
  heading?: string;
  description?: string;
  submitLabel?: string;
  verifyLabel?: string;
  compact?: boolean;
};

function getSafeRedirectPath(
  value: string,
  fallback: string,
  role: PhoneLoginRole,
) {
  try {
    const decoded = decodeURIComponent(value || "").trim();

    if (!decoded.startsWith("/")) return fallback;
    if (decoded.startsWith("//")) return fallback;
    if (decoded.includes("://")) return fallback;

    if (role === "customer" && decoded.startsWith("/guru")) {
      return fallback;
    }

    if (role === "guru" && decoded.startsWith("/customer")) {
      return fallback;
    }

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

function getRoleLabel(role: PhoneLoginRole) {
  return role === "guru" ? "Future Guru" : "Pet Parent";
}

function getRequestedProfileRole(role: PhoneLoginRole): ProfileRole {
  return role === "guru" ? "guru" : "customer";
}

function getMergedProfileRole(
  existingRole: string | null | undefined,
  requestedRole: ProfileRole,
): ProfileRole {
  if (existingRole === "both") return "both";

  if (existingRole === "customer" && requestedRole === "guru") {
    return "both";
  }

  if (existingRole === "guru" && requestedRole === "customer") {
    return "both";
  }

  if (existingRole === "customer" || existingRole === "guru") {
    return existingRole;
  }

  return requestedRole;
}

function getDefaultPath(role: PhoneLoginRole) {
  return role === "guru"
    ? "/guru/dashboard/profile"
    : "/customer/dashboard/profile";
}

async function safelyAddUserRole(userId: string, role: PhoneLoginRole) {
  try {
    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role,
    });

    if (error && error.code !== "23505") {
      console.warn("Phone login user_roles insert skipped:", error.message);
    }
  } catch (error) {
    console.warn("Phone login user_roles sync skipped:", error);
  }
}

export default function PhoneCodeLogin({
  nextPath,
  role,
  heading = "Continue with phone",
  description = "Enter your mobile number and we’ll text you a secure 6-digit SitGuru code.",
  submitLabel = "Text me a SitGuru code",
  verifyLabel = "Verify & continue",
  compact = false,
}: PhoneCodeLoginProps) {
  const router = useRouter();

  const fallbackPath = getDefaultPath(role);

  const safeNextPath = useMemo(
    () => getSafeRedirectPath(nextPath, fallbackPath, role),
    [nextPath, fallbackPath, role],
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

  const roleLabel = getRoleLabel(role);
  const requestedProfileRole = getRequestedProfileRole(role);

  function handlePhoneChange(value: string) {
    const digitsOnly = getDigitsOnly(value);

    if (!digitsOnly) {
      setPhone("");
      return;
    }

    setPhone(formatPhoneForDisplay(digitsOnly));
    setErrorMessage("");
    setStatusMessage("");
  }

  async function sendCodeToPhone(phoneToSend: string) {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phoneToSend,
      options: {
        shouldCreateUser: true,
        data: {
          role: requestedProfileRole,
          account_type: requestedProfileRole,
          signup_method: "phone",
          signup_role: role,
          source: "phone_login",
        },
      },
    });

    return error;
  }

  async function handleSendCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setStatusMessage("");

    const formattedPhone = normalizeUsPhoneNumber(phone);

    if (!isProbablyValidE164Phone(formattedPhone)) {
      setErrorMessage(
        "Enter a valid U.S. mobile number in the format (856) 555-1234.",
      );
      return;
    }

    setIsSending(true);

    const error = await sendCodeToPhone(formattedPhone);

    setIsSending(false);

    if (error) {
      setErrorMessage(
        error.message || "We could not send the SitGuru code. Please try again.",
      );
      return;
    }

    setNormalizedPhone(formattedPhone);
    setDisplaySentPhone(formatPhoneForDisplay(formattedPhone));
    setCodeSent(true);
    setStatusMessage("SitGuru code sent. Check your text messages.");
  }

  async function handleSendNewCode() {
    setErrorMessage("");
    setStatusMessage("");
    setCode("");

    if (!normalizedPhone) {
      setCodeSent(false);
      return;
    }

    setIsSending(true);

    const error = await sendCodeToPhone(normalizedPhone);

    setIsSending(false);

    if (error) {
      setErrorMessage(
        error.message ||
          "We could not send a new SitGuru code. Please try again.",
      );
      return;
    }

    setStatusMessage("New SitGuru code sent. Use the latest text message.");
  }

  async function syncProfileAfterPhoneLogin(
    userId: string,
    userEmail: string | null,
  ) {
    const { data: existingProfile, error: existingProfileError } = await supabase
      .from("profiles")
      .select("role, email, full_name, first_name, last_name")
      .eq("id", userId)
      .maybeSingle();

    if (existingProfileError) {
      console.warn(
        "Phone login existing profile lookup failed:",
        existingProfileError.message,
      );
    }

    const mergedRole = getMergedProfileRole(
      existingProfile?.role,
      requestedProfileRole,
    );

    const profilePayload = {
      id: userId,
      email: existingProfile?.email || userEmail,
      role: mergedRole,
    };

    const { error: profileError } = await supabase.from("profiles").upsert(
      profilePayload,
      {
        onConflict: "id",
      },
    );

    if (profileError) {
      console.warn("Phone login profile sync failed:", profileError.message);
    }

    await safelyAddUserRole(userId, role);

    if (mergedRole === "both") {
      await safelyAddUserRole(userId, "customer");
      await safelyAddUserRole(userId, "guru");
    }

    return mergedRole;
  }

  async function handleVerifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setStatusMessage("");

    const cleanCode = code.replace(/\D/g, "");

    if (!normalizedPhone) {
      setErrorMessage("Please send a SitGuru code first.");
      return;
    }

    if (cleanCode.length !== 6) {
      setErrorMessage("Enter the 6-digit SitGuru code from your text message.");
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
        error?.message ||
          "That SitGuru code did not work. Please check the latest text message and try again.",
      );
      return;
    }

    try {
      const userId = data.user?.id;
      const userEmail = data.user?.email || null;

      if (userId) {
        await syncProfileAfterPhoneLogin(userId, userEmail);
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
      className={`rounded-[1.5rem] border border-emerald-200 bg-white shadow-sm ${
        compact ? "mt-0 p-4" : "mt-8 p-5"
      }`}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-sm">
          <ShieldCheck className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <h3
            className="text-2xl font-black tracking-tight"
            style={{
              color: "#1f2937",
              WebkitTextFillColor: "#1f2937",
              opacity: 1,
            }}
          >
            {heading}
          </h3>

          <p
            className="mt-1 text-base font-bold leading-7"
            style={{
              color: "#334155",
              WebkitTextFillColor: "#334155",
              opacity: 1,
            }}
          >
            {description}
          </p>

          <p
            className="mt-3 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black ring-1 ring-emerald-200"
            style={{
              color: "#065f46",
              WebkitTextFillColor: "#065f46",
              opacity: 1,
            }}
          >
            Signing in as: {roleLabel}
          </p>
        </div>
      </div>

      {!codeSent ? (
        <form onSubmit={handleSendCode} className="mt-5 space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="phone-login-number"
              className="block text-sm font-black"
              style={{
                color: "#1f2937",
                WebkitTextFillColor: "#1f2937",
                opacity: 1,
              }}
            >
              Mobile phone number
            </label>

            <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
              <Phone className="h-5 w-5 shrink-0 text-emerald-700" />

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
                className="ml-3 w-full bg-transparent text-base font-bold placeholder:text-slate-400 outline-none"
                style={{
                  color: "#0f172a",
                  WebkitTextFillColor: "#0f172a",
                  opacity: 1,
                }}
              />
            </div>

            <p
              className="text-sm font-semibold leading-6"
              style={{
                color: "#64748b",
                WebkitTextFillColor: "#64748b",
                opacity: 1,
              }}
            >
              Enter your U.S. mobile number. SitGuru sends it securely as +1
              format for your 6-digit code.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSending ? "Sending SitGuru code..." : submitLabel}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyCode} className="mt-5 space-y-4">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
            <div
              className="flex items-center gap-2 text-sm font-black"
              style={{
                color: "#047857",
                WebkitTextFillColor: "#047857",
                opacity: 1,
              }}
            >
              <MessageSquareText className="h-4 w-4 shrink-0" />
              Code sent to {displaySentPhone || normalizedPhone}
            </div>

            <p
              className="mt-2 text-sm font-semibold leading-6"
              style={{
                color: "#475569",
                WebkitTextFillColor: "#475569",
                opacity: 1,
              }}
            >
              Use the newest SitGuru code you received. Older codes may not
              verify.
            </p>

            <button
              type="button"
              onClick={() => {
                setCodeSent(false);
                setCode("");
                setStatusMessage("");
                setErrorMessage("");
              }}
              className="mt-2 text-sm font-black underline-offset-4 hover:underline"
              style={{
                color: "#334155",
                WebkitTextFillColor: "#334155",
                opacity: 1,
              }}
            >
              Use a different number
            </button>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="phone-login-code"
              className="block text-sm font-black"
              style={{
                color: "#1f2937",
                WebkitTextFillColor: "#1f2937",
                opacity: 1,
              }}
            >
              6-digit SitGuru code
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
                setErrorMessage("");
              }}
              placeholder="123456"
              maxLength={6}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.35em] placeholder:text-slate-300 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              style={{
                color: "#0f172a",
                WebkitTextFillColor: "#0f172a",
                opacity: 1,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-base font-black text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isVerifying ? "Verifying..." : verifyLabel}
          </button>

          <button
            type="button"
            onClick={handleSendNewCode}
            disabled={isSending}
            className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base font-black text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isSending ? "Sending new code..." : "Send a new SitGuru code"}
          </button>
        </form>
      )}

      {statusMessage ? (
        <div className="mt-4 flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          {statusMessage}
        </div>
      ) : null}

      {errorMessage ? (
        <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-black text-red-700">
          {errorMessage}
        </div>
      ) : null}
    </section>
  );
}