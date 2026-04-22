"use client";

import { useMemo, useState } from "react";
import confetti from "canvas-confetti";

function fireLaunchConfetti() {
  const count = 180;
  const defaults = {
    origin: { y: 0.72 },
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

export default function LaunchPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
    <main className="min-h-screen bg-[#f7faf8] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[1143px]">
        <div className="overflow-hidden rounded-[28px] border border-emerald-100 bg-white shadow-[0_20px_70px_rgba(16,185,129,0.08)]">
          <img
            src="/images/pre-launch-page.png"
            alt="SitGuru pre-launch page"
            className="h-auto w-full object-contain"
          />
        </div>

        <section className="mx-auto mt-8 max-w-3xl rounded-[32px] border border-emerald-100 bg-white p-6 shadow-[0_20px_70px_rgba(16,185,129,0.10)] sm:p-8">
          <div className="mb-6 text-center">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-emerald-700">
              Join the Waitlist
            </p>
            <p className="mt-2 text-sm text-slate-500">
              Be first in line for launch news.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
                className="w-full rounded-[22px] border border-emerald-100 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
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
                placeholder="Email Address"
                autoComplete="email"
                className="w-full rounded-[22px] border border-emerald-100 bg-white px-4 py-4 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
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
              className="inline-flex w-full items-center justify-center rounded-[24px] bg-emerald-600 px-6 py-4 text-xl font-black text-white shadow-[0_16px_30px_rgba(16,185,129,0.24)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {buttonLabel}
            </button>

            <p className="text-center text-base leading-7 text-slate-500">
              For <span className="font-semibold text-slate-700">Pet Parents</span> and{" "}
              <span className="font-semibold text-slate-700">Gurus*</span>.
            </p>
          </form>
        </section>

        <div className="mx-auto mt-8 max-w-4xl text-center">
          <p className="text-sm leading-7 text-slate-600">
            <span className="font-bold text-emerald-700">*What is a Guru?</span>{" "}
            A Guru is a trusted pet care provider on the SitGuru network offering
            services like pet sitting, dog walking, boarding, daycare, drop-ins,
            and more.
          </p>
        </div>
      </div>
    </main>
  );
}