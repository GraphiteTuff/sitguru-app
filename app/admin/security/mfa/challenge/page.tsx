"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

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

type ChallengeFactor = {
  id: string;
  friendly_name?: string | null;
  factor_type?: string | null;
  status?: string | null;
};

export default function AdminMfaChallengePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [code, setCode] = useState("");
  const [factor, setFactor] = useState<ChallengeFactor | null>(null);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadChallengeState() {
      setError("");

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/admin/login");
        return;
      }

      setEmail(user.email || "");

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || profile?.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      const { data: aalData, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

      if (aalError) {
        setError(normalizeError(aalError));
        setLoading(false);
        return;
      }

      if (aalData?.currentLevel === "aal2") {
        router.replace("/admin");
        return;
      }

      const { data: factorsData, error: factorsError } =
        await supabase.auth.mfa.listFactors();

      if (factorsError) {
        setError(normalizeError(factorsError));
        setLoading(false);
        return;
      }

      const verifiedTotpFactor =
        factorsData?.totp?.find((item) => item.status === "verified") ||
        factorsData?.all?.find(
          (item) =>
            item.status === "verified" && item.factor_type === "totp",
        ) ||
        null;

      if (!verifiedTotpFactor) {
        router.replace("/admin/security/mfa");
        return;
      }

      setFactor(verifiedTotpFactor as ChallengeFactor);
      setLoading(false);
    }

    loadChallengeState();
  }, [router]);

  async function verifyMfaCode() {
    if (!factor) {
      setError("No verified MFA factor was found.");
      return;
    }

    const cleanCode = code.trim().replace(/\s+/g, "");

    if (cleanCode.length < 6) {
      setError("Enter the 6-digit code from your authenticator app.");
      return;
    }

    setBusy(true);
    setError("");

    const { data: challengeData, error: challengeError } =
      await supabase.auth.mfa.challenge({
        factorId: factor.id,
      });

    if (challengeError || !challengeData?.id) {
      setError(normalizeError(challengeError));
      setBusy(false);
      return;
    }

    const { error: verifyError } = await supabase.auth.mfa.verify({
      factorId: factor.id,
      challengeId: challengeData.id,
      code: cleanCode,
    });

    if (verifyError) {
      setError(normalizeError(verifyError));
      setBusy(false);
      return;
    }

    router.replace("/admin");
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-6 py-10">
        <div className="mx-auto max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Loading MFA challenge...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-10">
      <section className="w-full max-w-xl rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
        <div className="mb-6">
          <div className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-4 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
            Admin MFA Required
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
            Verify your admin sign-in
          </h1>

          <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
            Enter the 6-digit code from your authenticator app to continue to
            the SitGuru admin dashboard.
          </p>

          {email ? (
            <p className="mt-3 text-sm font-bold text-slate-800">
              Signed in as {email}
            </p>
          ) : null}
        </div>

        {error ? (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
            {error}
          </div>
        ) : null}

        <div>
          <label className="text-sm font-black text-slate-800">
            Authenticator code
          </label>

          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={8}
            placeholder="000000"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-center text-2xl font-black tracking-[0.35em] text-slate-950 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                verifyMfaCode();
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={verifyMfaCode}
          disabled={busy}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-emerald-700 px-6 py-4 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "Verifying..." : "Verify MFA"}
        </button>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={signOut}
            className="text-sm font-black text-slate-500 hover:text-red-600"
          >
            Sign out
          </button>

          <Link
            href="/admin/security/mfa"
            className="text-sm font-black text-emerald-700 hover:text-emerald-800"
          >
            Manage MFA
          </Link>
        </div>
      </section>
    </main>
  );
}