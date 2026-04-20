"use client";

import Link from "next/link";
import { signup } from "@/app/auth/actions";

export default function SignupPage() {
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
                Sign up as a pet owner or begin your path as a Guru with a
                cleaner, more modern experience built to grow with SitGuru.
              </p>
            </div>

            <div className="panel p-6 sm:p-8">
              <div className="section-kicker">Create account</div>

              <h2 className="mt-4">Start using SitGuru</h2>

              <p className="mt-4 text-base leading-7 text-slate-600 sm:text-lg">
                Create an account to book pet care, save favorite Gurus, or
                begin offering services.
              </p>

              <form action={signup} className="mt-8 grid gap-4">
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
                    defaultValue="pet_owner"
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
                  Create account
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