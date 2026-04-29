"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { signup } from "@/app/auth/actions";

type AccountType =
  | "pet_owner"
  | "guru"
  | "sitter"
  | "walker"
  | "caretaker"
  | "admin";

type ReferralState = {
  code: string;
  type: string;
  source: string;
  medium: string;
  campaign: string;
};

const emptyReferralState: ReferralState = {
  code: "",
  type: "",
  source: "direct",
  medium: "",
  campaign: "",
};

function cleanParam(value: string | null) {
  return value?.trim() || "";
}

function getAccountTypeFromReferral(type: string): AccountType {
  const normalized = type.trim().toLowerCase();

  if (
    normalized === "guru" ||
    normalized === "provider" ||
    normalized === "sitter"
  ) {
    return "guru";
  }

  return "pet_owner";
}

function isGuruPath(accountType: AccountType) {
  return (
    accountType === "guru" ||
    accountType === "sitter" ||
    accountType === "walker" ||
    accountType === "caretaker"
  );
}

export default function SignupPage() {
  const [accountType, setAccountType] = useState<AccountType>("pet_owner");
  const [referral, setReferral] = useState<ReferralState>(emptyReferralState);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const referralCode = cleanParam(params.get("ref"));
    const referralType = cleanParam(params.get("type"));
    const source =
      cleanParam(params.get("source")) ||
      cleanParam(params.get("utm_source")) ||
      "direct";
    const medium = cleanParam(params.get("utm_medium"));
    const campaign = cleanParam(params.get("utm_campaign"));
    const error = cleanParam(params.get("error"));

    if (error) {
      setErrorMessage(error);
    }

    if (referralCode || referralType || source || medium || campaign) {
      setReferral({
        code: referralCode,
        type: referralType || "customer",
        source,
        medium,
        campaign,
      });
    }

    if (referralType) {
      setAccountType(getAccountTypeFromReferral(referralType));
    }
  }, []);

  const referralLabel = useMemo(() => {
    if (!referral.code) return "";

    if (referral.type === "guru" || isGuruPath(accountType)) {
      return "Guru referral invite detected";
    }

    return "Customer referral invite detected";
  }, [accountType, referral.code, referral.type]);

  const guruSelected = isGuruPath(accountType);

  return (
    <main className="page-shell">
      <section className="section-space">
        <div className="page-container">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_520px] lg:items-start">
            <div className="panel hidden p-8 lg:block">
              <div className="section-kicker">
                {guruSelected ? "Apply Free" : "Join SitGuru"}
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                {guruSelected
                  ? "Apply Free. Get Approved. Get Booked."
                  : "Create your account and get started with trusted pet care."}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                {guruSelected
                  ? "Start your SitGuru Guru application at no cost. Once reviewed and pre-approved, SitGuru will guide you through verification so you can begin accepting pet care bookings."
                  : "Sign up as a pet owner or begin your path as a Guru with a cleaner, more modern experience built to grow with SitGuru."}
              </p>

              {guruSelected ? (
                <div className="mt-8 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                    No upfront screening fee
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    Start your Guru application without paying upfront.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    No upfront screening fee to apply. If approved, screening
                    costs may be deducted from your first completed SitGuru
                    booking.
                  </p>
                </div>
              ) : (
                <div className="mt-8 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5">
                  <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                    SitGuru Circle Rewards
                  </p>
                  <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                    Referrals are tracked when new members join.
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-700">
                    If you arrived through a SitGuru referral link, we’ll
                    connect your signup to that referral after your account is
                    created.
                  </p>
                </div>
              )}

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-black text-slate-950">
                    {guruSelected ? "Apply Free" : "Book Care"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {guruSelected
                      ? "Start your application at no cost."
                      : "Find trusted pet care near you."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-black text-slate-950">
                    {guruSelected ? "Get Approved" : "Save Gurus"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {guruSelected
                      ? "Complete SitGuru’s review steps."
                      : "Keep track of favorite providers."}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-sm font-black text-slate-950">
                    {guruSelected ? "Get Booked" : "Join Free"}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-slate-600">
                    {guruSelected
                      ? "Start accepting pet care bookings."
                      : "Create your account and get started."}
                  </p>
                </div>
              </div>
            </div>

            <div className="panel p-6 sm:p-8">
              <div className="section-kicker">
                {guruSelected ? "Free Guru application" : "Create account"}
              </div>

              <h2 className="mt-4">
                {guruSelected ? "Apply to become a SitGuru" : "Start using SitGuru"}
              </h2>

              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                {guruSelected
                  ? "Apply free today. Once your profile is reviewed and pre-approved, SitGuru will guide you through the next verification steps."
                  : "Create an account to book pet care, save favorite Gurus, or begin offering services."}
              </p>

              {guruSelected ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    Apply Free. Get Approved. Get Booked.
                  </p>
                  <p className="mt-2 text-sm leading-6 text-slate-700">
                    No upfront screening fee to apply. If approved, screening
                    costs may be deducted from your first completed SitGuru
                    booking.
                  </p>
                </div>
              ) : null}

              {errorMessage ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              {referral.code ? (
                <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                    {referralLabel}
                  </p>
                  <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                    Referral code: {referral.code}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Source: {referral.source || "direct"}
                  </p>
                </div>
              ) : null}

              <form action={signup} className="mt-8 grid gap-4">
                <input type="hidden" name="referralCode" value={referral.code} />
                <input type="hidden" name="referralType" value={referral.type} />
                <input
                  type="hidden"
                  name="referralSource"
                  value={referral.source}
                />
                <input
                  type="hidden"
                  name="referralMedium"
                  value={referral.medium}
                />
                <input
                  type="hidden"
                  name="referralCampaign"
                  value={referral.campaign}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      First name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      className="input"
                      placeholder="First name"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Last name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      className="input"
                      placeholder="Last name"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Email address
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="accountType"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Account type
                  </label>
                  <select
                    id="accountType"
                    name="accountType"
                    className="select"
                    value={accountType}
                    onChange={(event) =>
                      setAccountType(event.target.value as AccountType)
                    }
                  >
                    <option value="pet_owner">Pet Owner</option>
                    <option value="guru">Guru</option>
                    <option value="sitter">Sitter</option>
                    <option value="walker">Walker</option>
                    <option value="caretaker">Caretaker</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Password
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    className="input"
                    placeholder="Create a password"
                    autoComplete="new-password"
                    minLength={6}
                    required
                  />
                </div>

                <button type="submit" className="btn-primary mt-2 w-full">
                  {guruSelected ? "Submit Free Application" : "Create account"}
                </button>
              </form>

              <div className="mt-6 border-t border-slate-100 pt-5">
                <p className="text-sm text-slate-500">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-semibold text-emerald-700 hover:text-emerald-800"
                  >
                    Log in
                  </Link>
                </p>

                {!guruSelected ? (
                  <p className="mt-3 text-sm text-slate-500">
                    Want to offer pet care?{" "}
                    <button
                      type="button"
                      onClick={() => setAccountType("guru")}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Apply free as a Guru
                    </button>
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Looking for pet care instead?{" "}
                    <button
                      type="button"
                      onClick={() => setAccountType("pet_owner")}
                      className="font-semibold text-emerald-700 hover:text-emerald-800"
                    >
                      Switch to Pet Owner
                    </button>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}