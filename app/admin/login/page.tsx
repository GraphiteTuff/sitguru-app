"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";

function decodeMessage(value: string | null) {
  if (!value) return "";

  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    setErrorMessage(decodeMessage(params.get("error")));
    setStatusMessage(decodeMessage(params.get("status")));
  }, []);

  return (
    <main className="min-h-screen bg-[#f3f8f5] px-3 py-4 text-slate-950 sm:px-5 sm:py-8 lg:px-8 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-2rem)] w-full max-w-2xl items-center justify-center sm:min-h-[calc(100vh-4rem)]">
        <section className="w-full rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-[0_18px_54px_rgba(15,23,42,0.10)] sm:rounded-[2rem] sm:p-7 lg:p-10">
          <div className="mx-auto max-w-md">
            <div className="mb-5 flex items-center justify-between gap-4">
              <Link
                href="/"
                className="inline-flex items-center rounded-2xl transition hover:opacity-90"
                aria-label="Back to SitGuru homepage"
              >
                <Image
                  src="/images/sitguru-admin-avatar.jpg"
                  alt="SitGuru Admin"
                  width={76}
                  height={76}
                  priority
                  className="h-14 w-14 rounded-2xl border border-emerald-100 bg-white object-cover shadow-sm"
                />
              </Link>

              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black text-green-900 transition hover:border-emerald-200 hover:bg-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Home
              </Link>
            </div>

            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-800">
                <ShieldCheck className="h-4 w-4" />
                Admin Login
              </div>

              <h1 className="text-4xl font-black tracking-tight text-green-950 sm:text-5xl">
                Sign in to Admin
              </h1>

              <p className="mx-auto mt-3 max-w-sm text-sm font-semibold leading-6 text-slate-600">
                Use your approved SitGuru Super User email and password to
                continue.
              </p>
            </div>

            <form
              noValidate
              action="/api/admin/login"
              method="post"
              className="space-y-4 sm:space-y-5"
            >
              <div>
                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-black text-slate-800"
                >
                  Email
                </label>

                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Mail className="h-5 w-5 shrink-0 text-slate-400" />

                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="you@sitguru.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-black text-slate-800"
                >
                  Password
                </label>

                <div className="flex items-center rounded-2xl border border-slate-300 bg-white px-4 py-3 transition focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                  <Lock className="h-5 w-5 shrink-0 text-slate-400" />

                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    className="ml-3 w-full bg-transparent text-base font-semibold text-slate-950 outline-none placeholder:text-slate-400"
                    placeholder="Enter password"
                    required
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="ml-3 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-slate-500 transition hover:bg-emerald-50 hover:text-green-800"
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

              {statusMessage ? (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                  {statusMessage}
                </div>
              ) : null}

              {errorMessage ? (
                <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="submit"
                className="flex w-full items-center justify-center rounded-2xl bg-green-800 px-5 py-4 text-base font-black text-white shadow-sm transition hover:bg-green-900"
              >
                Sign In
              </button>
            </form>

            <div className="mt-6 grid gap-3 text-sm font-bold sm:grid-cols-2">
              <Link
                href="/"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-green-800 transition hover:border-emerald-200 hover:bg-emerald-50"
              >
                Back to Homepage
              </Link>

              <Link
                href="/forgot-password"
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-slate-600 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-green-800"
              >
                Forgot Password?
              </Link>
            </div>

            <div className="mt-6 rounded-3xl border border-emerald-100 bg-emerald-50 px-4 py-4 text-center">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
                Super User access only.
              </p>

              <p className="mt-2 text-sm font-semibold leading-6 text-green-900">
                Admin access is reserved for approved SitGuru Super Users.
              </p>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                For live-site safety, sign in only when you need to manage
                Admin.
              </p>
            </div>

            <p className="mt-5 text-center text-xs font-bold leading-5 text-slate-400">
              Need help? Contact{" "}
              <a
                href="mailto:support@sitguru.com"
                className="font-black text-green-800 hover:underline"
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