"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type MfaFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

type EnrollmentState = {
  id: string;
  qrCode: string;
  secret: string;
  uri?: string;
};

function formatDateTime(value?: string | null) {
  if (!value) return "—";

  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return "—";
  }
}

function normalizeError(error: unknown) {
  if (!error) return "Something went wrong.";

  if (typeof error === "string") return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Something went wrong.";
}

function StatusPill({ status }: { status?: string | null }) {
  const normalized = (status || "unknown").toLowerCase();

  const classes =
    normalized === "verified"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : normalized === "unverified"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : "border-slate-200 bg-slate-50 text-slate-600";

  return (
    <span
      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${classes}`}
    >
      {normalized}
    </span>
  );
}

export default function AdminMfaPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const [factors, setFactors] = useState<MfaFactor[]>([]);
  const [currentLevel, setCurrentLevel] = useState("aal1");
  const [nextLevel, setNextLevel] = useState("aal1");

  const [factorName, setFactorName] = useState("PawNecto Admin");
  const [enrollment, setEnrollment] = useState<EnrollmentState | null>(null);
  const [verificationCode, setVerificationCode] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const verifiedFactors = useMemo(
    () => factors.filter((factor) => factor.status === "verified"),
    [factors]
  );

  const unverifiedFactors = useMemo(
    () => factors.filter((factor) => factor.status !== "verified"),
    [factors]
  );

  const hasVerifiedMfa = verifiedFactors.length > 0;

  async function loadMfaState() {
    setError("");
    setMessage("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.push("/admin/login");
      return;
    }

    setAuthEmail(user.email || null);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || profile?.role !== "admin") {
      router.push("/admin/login");
      return;
    }

    const { data: factorsData, error: factorsError } =
      await supabase.auth.mfa.listFactors();

    if (factorsError) {
      setError(normalizeError(factorsError));
    } else {
      const allFactors = (factorsData?.all || []) as MfaFactor[];
      setFactors(allFactors);
    }

    const { data: aalData, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    if (!aalError && aalData) {
      setCurrentLevel(aalData.currentLevel || "aal1");
      setNextLevel(aalData.nextLevel || "aal1");
    }

    setLoading(false);
  }

  useEffect(() => {
    loadMfaState();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function startEnrollment() {
    setBusy(true);
    setError("");
    setMessage("");
    setVerificationCode("");

    const { data, error: enrollError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: factorName.trim() || "PawNecto Admin",
    });

    if (enrollError) {
      setError(normalizeError(enrollError));
      setBusy(false);
      return;
    }

    setEnrollment({
      id: data.id,
      qrCode: data.totp.qr_code,
      secret: data.totp.secret,
      uri: data.totp.uri,
    });

    setMessage(
      "Scan the QR code with your authenticator app, then enter the 6-digit code."
    );

    setBusy(false);
  }

  async function verifyEnrollment() {
    if (!enrollment) return;

    const code = verificationCode.trim().replace(/\s+/g, "");

    if (!code || code.length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const { error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
      factorId: enrollment.id,
      code,
    });

    if (verifyError) {
      setError(normalizeError(verifyError));
      setBusy(false);
      return;
    }

    setEnrollment(null);
    setVerificationCode("");
    setMessage("MFA is now enabled for this admin account.");

    await loadMfaState();
    setBusy(false);
  }

  async function cancelEnrollment() {
    if (!enrollment) {
      setEnrollment(null);
      return;
    }

    setBusy(true);
    setError("");
    setMessage("");

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId: enrollment.id,
    });

    if (unenrollError) {
      setError(normalizeError(unenrollError));
    } else {
      setEnrollment(null);
      setVerificationCode("");
      setMessage("MFA setup was canceled.");
      await loadMfaState();
    }

    setBusy(false);
  }

  async function removeFactor(factorId: string) {
    const confirmed = window.confirm(
      "Remove this MFA factor? This lowers protection for this admin account."
    );

    if (!confirmed) return;

    setBusy(true);
    setError("");
    setMessage("");

    const { error: unenrollError } = await supabase.auth.mfa.unenroll({
      factorId,
    });

    if (unenrollError) {
      setError(normalizeError(unenrollError));
      setBusy(false);
      return;
    }

    setMessage("MFA factor removed.");
    await loadMfaState();
    setBusy(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">
              Loading MFA settings...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/admin/security"
              className="text-sm font-bold text-emerald-700 hover:text-emerald-800"
            >
              ← Back to Security
            </Link>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Multi-Factor Authentication
            </h1>

            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Require an authenticator app code for admin account protection.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm hover:border-emerald-300 hover:text-emerald-700"
          >
            Admin Dashboard
          </Link>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-semibold text-red-700">
            {error}
          </div>
        ) : null}

        {message ? (
          <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <section className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Current Status
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    {hasVerifiedMfa ? "MFA is enabled" : "MFA is not enabled"}
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    Signed in as{" "}
                    <span className="font-bold text-slate-900">
                      {authEmail || "admin"}
                    </span>
                  </p>
                </div>

                <div
                  className={`rounded-2xl border px-4 py-3 text-sm font-black ${
                    hasVerifiedMfa
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-amber-200 bg-amber-50 text-amber-700"
                  }`}
                >
                  {hasVerifiedMfa ? "Protected" : "Needs MFA"}
                </div>
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Verified Factors
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {verifiedFactors.length}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Current AAL
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {currentLevel.toUpperCase()}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                    Next AAL
                  </p>
                  <p className="mt-2 text-3xl font-black text-slate-950">
                    {nextLevel.toUpperCase()}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Authenticator App
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  Add a new MFA factor
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-slate-600">
                  Use Google Authenticator, Microsoft Authenticator, 1Password,
                  Authy, or any TOTP-compatible authenticator app.
                </p>
              </div>

              {!enrollment ? (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="text-sm font-bold text-slate-700">
                      Factor name
                    </label>

                    <input
                      value={factorName}
                      onChange={(event) => setFactorName(event.target.value)}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-400"
                      placeholder="PawNecto Admin"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={startEnrollment}
                    disabled={busy}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {busy ? "Starting setup..." : "Start MFA Setup"}
                  </button>
                </div>
              ) : (
                <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="rounded-2xl bg-white p-4">
                      <img
                        src={enrollment.qrCode}
                        alt="MFA QR code"
                        className="mx-auto h-52 w-52"
                      />
                    </div>

                    <p className="mt-3 text-center text-xs font-semibold text-slate-500">
                      Scan this QR code with your authenticator app.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-xl font-black text-slate-950">
                      Verify setup
                    </h3>

                    <p className="mt-2 text-sm text-slate-600">
                      After scanning the QR code, enter the 6-digit code shown
                      in your authenticator app.
                    </p>

                    <div className="mt-5">
                      <label className="text-sm font-bold text-slate-700">
                        6-digit code
                      </label>

                      <input
                        value={verificationCode}
                        onChange={(event) =>
                          setVerificationCode(event.target.value)
                        }
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-lg font-black tracking-[0.35em] text-slate-950 outline-none focus:border-emerald-400"
                        placeholder="000000"
                      />
                    </div>

                    <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Manual setup key
                      </p>

                      <p className="mt-2 break-all font-mono text-sm font-bold text-slate-800">
                        {enrollment.secret}
                      </p>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <button
                        type="button"
                        onClick={verifyEnrollment}
                        disabled={busy}
                        className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-6 py-3 text-sm font-black text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {busy ? "Verifying..." : "Verify and Enable MFA"}
                      </button>

                      <button
                        type="button"
                        onClick={cancelEnrollment}
                        disabled={busy}
                        className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-black text-slate-700 shadow-sm hover:border-red-300 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Cancel Setup
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Existing Factors
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  MFA devices
                </h2>
              </div>

              <div className="mt-6 space-y-3">
                {factors.length > 0 ? (
                  factors.map((factor) => (
                    <div
                      key={factor.id}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-950">
                            {factor.friendly_name || "Authenticator app"}
                          </p>

                          <StatusPill status={factor.status} />
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          Type: {factor.factor_type || "totp"}
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          Created {formatDateTime(factor.created_at)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => removeFactor(factor.id)}
                        disabled={busy}
                        className="inline-flex items-center justify-center rounded-full border border-red-200 bg-white px-5 py-2.5 text-sm font-black text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    No MFA factors are connected yet.
                  </div>
                )}
              </div>

              {unverifiedFactors.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                  You have {unverifiedFactors.length} unverified MFA factor
                  {unverifiedFactors.length === 1 ? "" : "s"}. Remove old
                  unverified factors if you do not need them.
                </div>
              ) : null}
            </div>
          </section>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                Security Checklist
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">
                    1. Add authenticator app
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Scan the QR code using a trusted app.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">
                    2. Verify the 6-digit code
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Supabase marks the factor verified after code confirmation.
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="font-black text-slate-950">
                    3. Keep backup access safe
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Do not rely on one device without account recovery planning.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                Recommended
              </p>

              <h3 className="mt-2 text-xl font-black text-emerald-950">
                Require MFA for every owner/admin account.
              </h3>

              <p className="mt-2 text-sm font-semibold text-emerald-800">
                This page protects the currently signed-in admin. For team-wide
                enforcement, add server-side checks on sensitive admin routes
                and actions.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}