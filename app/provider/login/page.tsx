"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function ProviderLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function isProviderRole(role?: string | null, accountType?: string | null) {
    const normalizedRole = String(role || "").toLowerCase();
    const normalizedAccountType = String(accountType || "").toLowerCase();

    return (
      ["sitter", "walker", "caretaker"].includes(normalizedRole) ||
      normalizedAccountType.includes("sitter") ||
      normalizedAccountType.includes("walker") ||
      normalizedAccountType.includes("caretaker") ||
      normalizedAccountType.includes("provider")
    );
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Login failed.");
      setLoading(false);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role, account_type")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setError("No provider profile was found for this account.");
      setLoading(false);
      return;
    }

    if (profile.role === "admin") {
      await supabase.auth.signOut();
      setError("Please use the Admin Login page.");
      setLoading(false);
      return;
    }

    if (!isProviderRole(profile.role, profile.account_type)) {
      await supabase.auth.signOut();
      setError("This account is a customer account. Please use Customer Login.");
      setLoading(false);
      return;
    }

    router.push("/sitter-dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold text-emerald-600">SitGuru Provider Access</p>
          <h1 className="mt-2 text-3xl font-black text-slate-900">
            Provider Login
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Log in to manage bookings, provider media, messages, and your sitter dashboard.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              placeholder="provider@example.com"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
              placeholder="Enter password"
              required
            />
          </div>

          <div className="flex items-center justify-between gap-3 text-sm">
            <Link
              href="/forgot-password"
              className="font-semibold text-emerald-600 hover:underline"
            >
              Forgot password?
            </Link>

            <Link
              href="/become-a-sitter"
              className="font-semibold text-emerald-600 hover:underline"
            >
              Become a provider
            </Link>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Log in as Provider"}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-sm">
          <p className="text-slate-600">
            Are you a customer?{" "}
            <Link
              href="/login"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Go to Customer Login
            </Link>
          </p>

          <p className="text-slate-600">
            Want to join SitGuru as a Provider?{" "}
            <Link
              href="/become-a-sitter"
              className="font-semibold text-emerald-600 hover:text-emerald-700"
            >
              Start provider setup
            </Link>
          </p>

          <p className="text-slate-600">
            Admin access?{" "}
            <Link
              href="/admin/login"
              className="font-semibold text-slate-900 hover:text-emerald-700"
            >
              Go to Admin Login
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}