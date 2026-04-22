"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";

function fireLaunchConfetti() {
  const count = 180;
  const defaults = {
    origin: { y: 0.68 },
  };

  function fire(
    particleRatio: number,
    options: Record<string, number | boolean | { y: number }>
  ) {
    confetti({
      ...defaults,
      ...options,
      particleCount: Math.floor(count * particleRatio),
    });
  }

  fire(0.25, { spread: 26, startVelocity: 55 });
  fire(0.2, { spread: 60 });
  fire(0.25, { spread: 100, decay: 0.92, scalar: 0.95 });
  fire(0.15, { spread: 120, startVelocity: 30, decay: 0.91, scalar: 1.08 });
  fire(0.15, { spread: 135, startVelocity: 45 });
}

function PawPrint({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute opacity-[0.08] ${className}`}
    >
      <div className="relative h-20 w-20">
        <span className="absolute left-7 top-9 h-9 w-9 rounded-full bg-emerald-500" />
        <span className="absolute left-0 top-7 h-5 w-5 rounded-full bg-emerald-500" />
        <span className="absolute left-[60px] top-7 h-5 w-5 rounded-full bg-emerald-500" />
        <span className="absolute left-6 top-0 h-5 w-5 rounded-full bg-emerald-500" />
        <span className="absolute left-[52px] top-0 h-5 w-5 rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}

function BenefitCard({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[28px] border border-emerald-100 bg-white/90 p-5 shadow-[0_10px_35px_rgba(16,185,129,0.08)] backdrop-blur">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
        🐾
      </div>
      <h3 className="text-lg font-black tracking-tight text-slate-900">
        {title}
      </h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

export default function LaunchPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    document.body.classList.add("launch-page-active");

    return () => {
      document.body.classList.remove("launch-page-active");
    };
  }, []);

  const buttonLabel = useMemo(() => {
    if (isSubmitting) return "Joining...";
    if (success) return "You're In 🎉";
    return "Join the Waitlist";
  }, [isSubmitting, success]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setSuccess("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setError("Please enter your name and email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/launch-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          source: "social-launch",
          interestType: "both",
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to join the waitlist right now.");
      }

      setSuccess("You're on the list. We'll let you know when SitGuru launches.");
      setName("");
      setEmail("");
      fireLaunchConfetti();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <style jsx global>{`
        body.launch-page-active header:first-of-type,
        body.launch-page-active nav,
        body.launch-page-active footer:not(.launch-footer) {
          display: none !important;
        }

        body.launch-page-active main {
          padding-top: 0 !important;
        }
      `}</style>

      <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f7fff9_0%,#f2fbf5_40%,#ffffff_100%)] text-slate-900">
        <PawPrint className="-left-4 top-10" />
        <PawPrint className="right-4 top-24 scale-90" />
        <PawPrint className="bottom-20 left-8 scale-110" />

        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-[-130px] h-[380px] w-[380px] -translate-x-1/2 rounded-full bg-emerald-300/25 blur-3xl" />
          <div className="absolute right-[-80px] top-[140px] h-[280px] w-[280px] rounded-full bg-lime-200/30 blur-3xl" />
          <div className="absolute bottom-[-80px] left-[-60px] h-[260px] w-[260px] rounded-full bg-emerald-100/50 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-4 flex justify-center lg:justify-start">
            <div className="inline-flex items-center gap-3 rounded-full border border-emerald-100 bg-white/90 px-4 py-2 shadow-sm backdrop-blur">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-emerald-100">
                <img
                  src="/images/sitguru-logo-cropped.png"
                  alt="SitGuru logo"
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div className="leading-tight">
                <p className="text-sm font-black tracking-[0.18em] text-emerald-700">
                  SITGURU
                </p>
                <p className="text-xs font-medium text-slate-500">
                  Trusted pet care, launching soon
                </p>
              </div>
            </div>
          </div>

          <section className="grid items-center gap-10 pb-10 pt-6 lg:grid-cols-[1.05fr_0.95fr] lg:gap-12 lg:pt-10">
            <div className="max-w-2xl">
              <div className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700 shadow-sm">
                Launching Soon
              </div>

              <h1 className="mt-5 text-4xl font-black tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Something New is Coming to Pet Care
              </h1>

              <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600 sm:text-xl">
                Get on the list and be first to know.
              </p>

              <p className="mt-5 max-w-xl text-sm leading-7 text-slate-500 sm:text-base">
                Fresh, trusted pet care for{" "}
                <span className="font-semibold text-slate-700">Pet Parents</span> and{" "}
                <span className="font-semibold text-slate-700">Gurus*</span>.
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <span className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Trusted Care
                </span>
                <span className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Simple Booking
                </span>
                <span className="rounded-full border border-emerald-100 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm">
                  Community
                </span>
              </div>
            </div>

            <div className="relative">
              <div className="absolute -inset-4 rounded-[34px] bg-gradient-to-br from-emerald-200/40 to-lime-100/20 blur-2xl" />
              <div className="relative rounded-[34px] border border-emerald-100 bg-white/90 p-5 shadow-[0_20px_80px_rgba(16,185,129,0.14)] backdrop-blur sm:p-7">
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-emerald-50 ring-1 ring-emerald-100">
                    <img
                      src="/images/sitguru-logo-cropped.png"
                      alt="SitGuru mark"
                      className="h-9 w-9 object-contain"
                    />
                  </div>
                  <div>
                    <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700">
                      Join the Waitlist
                    </p>
                    <p className="text-sm text-slate-500">
                      Be first in line for launch news.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label
                      htmlFor="launch-name"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Name
                    </label>
                    <input
                      id="launch-name"
                      type="text"
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                      className="w-full rounded-[22px] border border-emerald-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="launch-email"
                      className="mb-2 block text-sm font-semibold text-slate-700"
                    >
                      Email Address
                    </label>
                    <input
                      id="launch-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      className="w-full rounded-[22px] border border-emerald-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
                    />
                  </div>

                  {error ? (
                    <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
                      {error}
                    </div>
                  ) : null}

                  {success ? (
                    <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                      {success}
                    </div>
                  ) : null}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {buttonLabel}
                  </button>

                  <p className="text-center text-xs font-medium text-slate-500">
                    For{" "}
                    <span className="font-semibold text-slate-700">
                      Pet Parents
                    </span>{" "}
                    and{" "}
                    <span className="font-semibold text-slate-700">Gurus*</span>.
                  </p>
                </form>
              </div>
            </div>
          </section>

          <section className="grid gap-4 pb-12 md:grid-cols-3">
            <BenefitCard
              title="Trusted Care"
              body="Dependable, vetted Gurus. Safe, loving care you can count on."
            />
            <BenefitCard
              title="Simple Booking"
              body="Book in minutes with an easy, streamlined experience."
            />
            <BenefitCard
              title="Community"
              body="A welcoming community for Pet Parents and Gurus."
            />
          </section>

          <footer className="launch-footer border-t border-emerald-100 py-6">
            <div className="flex flex-col gap-3 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
              <p>© {new Date().getFullYear()} SitGuru. All rights reserved.</p>

              <div className="flex flex-wrap gap-4">
                <Link
                  href="https://instagram.com"
                  className="font-medium text-slate-500 transition hover:text-emerald-700"
                >
                  Instagram
                </Link>
                <Link
                  href="mailto:hello@sitguru.com"
                  className="font-medium text-slate-500 transition hover:text-emerald-700"
                >
                  Contact
                </Link>
              </div>
            </div>

            <p className="mt-4 text-xs leading-6 text-slate-500">
              *A <span className="font-semibold text-slate-700">Guru</span> is a trusted pet care provider on the SitGuru network offering services like pet sitting, dog walking, boarding, daycare, drop-ins, and more.
            </p>
          </footer>
        </div>
      </main>
    </>
  );
}