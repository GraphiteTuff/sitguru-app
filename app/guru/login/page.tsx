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
    <main className="min-h-screen bg-[#edf8f2] px-3 py-4 text-[#061525] sm:px-5 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="w-full rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-[0_20px_70px_rgba(15,23,42,0.12)] sm:rounded-[2rem] sm:p-7 lg:p-10">
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
                  className="h-14 w-14 rounded-2xl border border-emerald-100 bg-emerald-600 object-cover shadow-md sm:h-16 sm:w-16"
                />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-sm font-black text-[#065f46] shadow-sm transition hover:border-emerald-300 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4 stroke-[3]" />
                Home
              </Link>
            </div>

            <div className="mb-7 text-center">
              <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-2.5 text-xs font-black uppercase tracking-[0.22em] text-[#065f46] shadow-sm">
                <PawPrint className="h-4 w-4 fill-[#047857] text-[#047857]" />
                Guru Login
              </div>

              <h1 className="text-5xl font-black leading-[0.98] tracking-[-0.045em] text-[#061525] drop-shadow-[0_2px_0_rgba(15,23,42,0.04)] sm:text-6xl">
                Welcome back, Guru.
              </h1>

              <p className="mx-auto mt-4 max-w-sm text-lg font-bold leading-8 text-[#0f172a]">
                Sign in to manage your profile, bookings, messages,
                availability, and earnings.
              </p>
            </div>

            <form action={login} className="space-y-4 sm:space-y-5">
              <input type="hidden" name="next" value="/guru/dashboard" />

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-base font-black text-[#061525]"
                >
                  Email
                </label>

                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3.5 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail className="h-5 w-5 shrink-0 stroke-[2.5] text-[#047857]" />

                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="guru@sitguru.com"
                    className="ml-3 w-full bg-transparent text-lg font-semibold text-[#061525] outline-none placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-base font-black text-[#061525]"
                >
                  Password
                </label>

                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3.5 shadow-sm transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Lock className="h-5 w-5 shrink-0 stroke-[2.5] text-[#047857]" />

                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    autoComplete="current-password"
                    placeholder="Enter password"
                    className="ml-3 w-full bg-transparent text-lg font-semibold text-[#061525] outline-none placeholder:text-slate-400"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[#047857] transition hover:bg-emerald-50 hover:text-[#065f46]"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 stroke-[2.5]" />
                    ) : (
                      <Eye className="h-5 w-5 stroke-[2.5]" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-2xl bg-[#047857] px-5 py-4 text-lg font-black text-white shadow-[0_18px_38px_rgba(4,120,87,0.28)] transition hover:bg-[#065f46] focus:outline-none focus:ring-4 focus:ring-emerald-200"
              >
                Sign In to Guru Dashboard
              </button>
            </form>

            <div className="mt-6 grid gap-3 text-base font-black sm:grid-cols-2">
              <Link
                href="/forgot-password"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-[#061525] shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#047857]"
              >
                Forgot Password?
              </Link>

              <Link
                href="/signup?accountType=future_guru"
                className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3.5 text-center text-[#047857] shadow-sm transition hover:border-emerald-300 hover:bg-white hover:text-[#065f46]"
              >
                Become a Guru
              </Link>

              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-[#061525] shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#047857]"
              >
                <User className="h-4 w-4 stroke-[2.5]" />
                Pet Parent Login
              </Link>

              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-center text-[#061525] shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-[#047857]"
              >
                <Home className="h-4 w-4 fill-[#047857] stroke-[2.5] text-[#047857]" />
                Back to Homepage
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-200 bg-emerald-50/85 px-5 py-5 text-left shadow-sm sm:flex sm:items-start sm:gap-5">
              <div className="mx-auto mb-4 flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#047857] shadow-md sm:mx-0 sm:mb-0">
                <ShieldCheck className="h-8 w-8 text-white" />
              </div>

              <div className="text-center sm:text-left">
                <p className="text-sm font-black uppercase tracking-[0.18em] text-[#065f46]">
                  Simple. Secure. Guru-friendly.
                </p>

                <p className="mt-2 text-base font-semibold leading-7 text-[#061525]">
                  Your Guru account helps you manage care requests, messages,
                  availability, and SitGuru earnings in one place.
                </p>

                <p className="mt-3 text-base font-semibold leading-7 text-[#0f172a]">
                  New to SitGuru? Apply as a Guru and start building your pet
                  care profile.
                </p>
              </div>
            </div>

            <p className="mt-5 text-center text-sm font-bold leading-6 text-[#334155]">
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