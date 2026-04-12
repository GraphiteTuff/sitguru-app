"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SignupPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [accountType, setAccountType] = useState("Pet Owner");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function mapAccountTypeToRole(value: string) {
    if (value === "Pet Owner") return "customer";
    if (value === "Guru") return "guru";
    if (value === "Sitter") return "sitter";
    if (value === "Walker") return "walker";
    if (value === "Caretaker") return "caretaker";
    return "customer";
  }

  async function applyReferralIfPresent({
    referralCode,
    profileId,
    role,
  }: {
    referralCode?: string;
    profileId: string;
    role: string;
  }) {
    if (!referralCode || !referralCode.trim()) {
      return { success: true, skipped: true };
    }

    const { data, error } = await supabase.rpc("apply_signup_referral_code", {
      p_referral_code: referralCode.trim().toUpperCase(),
      p_referred_profile_id: profileId,
      p_referred_role: role.toLowerCase(),
    });

    if (error) {
      return {
        success: false,
        message: error.message,
      };
    }

    return data;
  }

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedRole = mapAccountTypeToRole(accountType);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          account_type: accountType,
          role: normalizedRole,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const user = data.user;

    if (user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: user.id,
        first_name: firstName,
        last_name: lastName,
        account_type: accountType,
        role: normalizedRole,
        used_referral_code: referralCode.trim()
          ? referralCode.trim().toUpperCase()
          : null,
      });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      const referralResult = await applyReferralIfPresent({
        referralCode,
        profileId: user.id,
        role: normalizedRole,
      });

      if (!referralResult?.success && !referralResult?.skipped) {
        console.error("Referral code not applied:", referralResult?.message);
      }
    }

    setLoading(false);
    router.push("/dashboard");
  }

  return (
    <main className="page-shell">
      <section className="section-space">
        <div className="page-container">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1fr_520px] lg:items-start">
            <div className="panel hidden p-8 lg:block">
              <div className="section-kicker">Join SitGuru</div>

              <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
                Create your account and get started with trusted pet care.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
                Sign up as a pet owner or begin your path as a guru with a
                cleaner, more modern experience built to grow with SitGuru.
              </p>
            </div>

            <div className="panel p-6 sm:p-8">
              <div className="section-kicker">Create account</div>

              <h2 className="mt-4">Start using SitGuru</h2>

              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Create an account to book pet care, save favorite gurus, or
                begin offering services.
              </p>

              {error ? (
                <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                  {error}
                </div>
              ) : null}

              <form onSubmit={handleSignup} className="mt-8 grid gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      First name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="First name"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Last name
                    </label>
                    <input
                      type="text"
                      className="input"
                      placeholder="Last name"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Email address
                  </label>
                  <input
                    type="email"
                    className="input"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Account type
                  </label>
                  <select
                    className="select"
                    value={accountType}
                    onChange={(e) => setAccountType(e.target.value)}
                  >
                    <option value="Pet Owner">Pet Owner</option>
                    <option value="Guru">Guru</option>
                    <option value="Sitter">Sitter</option>
                    <option value="Walker">Walker</option>
                    <option value="Caretaker">Caretaker</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Referral Code (optional)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Password
                  </label>
                  <input
                    type="password"
                    className="input"
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary mt-2 w-full"
                  disabled={loading}
                >
                  {loading ? "Creating account..." : "Create account"}
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
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}