"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  Eye,
  EyeOff,
  Home,
  Lock,
  Mail,
  PawPrint,
  ShieldCheck,
  User,
} from "lucide-react";
import { login } from "@/app/auth/actions";

export default function GuruLoginPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="min-h-screen bg-[#f3f8f5] px-3 py-4 text-[#0f172a] sm:px-5 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="w-full rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.10)] sm:rounded-[2rem] sm:p-7 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-6 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center rounded-2xl transition hover:opacity-90"
                aria-label="Back to SitGuru homepage"
              >
                <Image
                  src="/images/sitguru-message-avatar.jpg"
                  alt="SitGuru Guru"
                  width={76}
                  height={76}
                  priority
                  className="h-14 w-14 rounded-2xl border border-emerald-100 bg-emerald-600 object-cover shadow-sm"
                />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-sm font-black text-[#065f46] transition hover:border-emerald-200 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </div>

            <div className="mb-7 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-[#047857]">
                <PawPrint className="h-4 w-4" />
                Guru Login
              </div>

              <h1 className="text-4xl font-black leading-[1.02] tracking-tight text-[#0f172a] sm:text-5xl">
                Welcome back, Guru.
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-base font-semibold leading-7 text-[#334155]">
                Sign in to manage your profile, bookings, messages,
                availability, and earnings.
              </p>
            </div>

            <form action={login} className="space-y-4 sm:space-y-5">
              <input type="hidden" name="next" value="/guru/dashboard" />

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-black text-[#0f172a]"
                >
                  Email
                </label>

                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail className="h-5 w-5 shrink-0 text-[#047857]" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="guru@sitguru.com"
                    className="ml-3 w-full bg-transparent text-base font-semibold text-[#0f172a] outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-black text-[#0f172a]"
                >
                  Password
                </label>

                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Lock className="h-5 w-5 shrink-0 text-[#047857]" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="ml-3 w-full bg-transparent text-base font-semibold text-[#0f172a] outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#047857] transition hover:bg-emerald-50 hover:text-green-900"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                type="submit"
                className="flex w-full items-center justify-center rounded-2xl bg-[#047857] px-5 py-4 text-base font-black text-white shadow-[0_14px_30px_rgba(4,120,87,0.22)] transition hover:bg-[#065f46]"
              >
                Sign In to Guru Dashboard
              </button>
            </form>

            <div className="mt-6 grid gap-3 text-sm font-black sm:grid-cols-2">
              <Link
                href="/forgot-password"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[#0f172a] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#047857]"
              >
                Forgot Password?
              </Link>

              <Link
                href="/signup?accountType=future_guru"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-[#047857] transition hover:border-emerald-300 hover:bg-white"
              >
                Become a Guru
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[#0f172a] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#047857]"
              >
                <User className="h-4 w-4" />
                Pet Parent Login
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-[#0f172a] transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#047857]"
              >
                <Home className="h-4 w-4" />
                Back to Homepage
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm">
                <ShieldCheck className="h-6 w-6 text-[#047857]" />
              </div>

              <p className="text-xs font-black uppercase tracking-[0.18em] text-[#047857]">
                Simple. Secure. Guru-friendly.
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-[#064e3b]">
                Your Guru account helps you manage care requests, messages,
                availability, and SitGuru earnings in one place.
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-[#334155]">
                New to SitGuru? Apply as a Guru and start building your pet care
                profile.
              </p>
            </div>

            <p className="mt-5 text-center text-xs font-bold leading-5 text-[#475569]">
              Need help? Contact{" "}
              <a
                href="mailto:support@sitguru.com"
                className="font-black text-[#047857] hover:underline"
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