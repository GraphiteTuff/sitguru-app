"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

export default function GuruLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
    } else {
      // Redirect to guru dashboard after login
      window.location.href = "/guru/dashboard";
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen bg-[#f8fafc] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="text-4xl">🐾</div>
          </div>
          <h1 className="text-4xl font-bold text-slate-900">Guru Login</h1>
          <p className="text-slate-600 mt-3">Welcome back to SitGuru</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-slate-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-600 text-slate-900 placeholder:text-slate-400"
                placeholder="guru@sitguru.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:outline-none focus:border-emerald-600 text-slate-900 placeholder:text-slate-400"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-600 text-sm text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 transition rounded-2xl font-semibold text-white text-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-500">
            Don't have a guru account?{" "}
            <Link href="/become-a-guru" className="text-emerald-600 hover:underline font-medium">
              Become a Guru
            </Link>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-8 text-sm text-slate-500 space-y-2">
          <div>
            Are you a customer?{" "}
            <Link href="/login" className="text-emerald-600 hover:underline">
              Go to Customer Login
            </Link>
          </div>
          <div>
            Need help?{" "}
            <Link href="/forgot-password" className="text-emerald-600 hover:underline">
              Forgot Password
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}