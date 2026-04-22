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
      setError("");
      setName("");
      setEmail("");
      fireLaunchConfetti();
    } catch (err) {
      setSuccess("");
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
    <main className="min-h-screen bg-[#f7faf8] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-[1143px]">
        <div className="relative w-full overflow-hidden rounded-[24px] bg-white shadow-[0_20px_70px_rgba(16,185,129,0.08)]">
          <img
            src="/images/pre-launch-page.png"
            alt="SitGuru pre-launch page"
            className="block h-auto w-full select-none object-contain"
            draggable={false}
          />

          <div className="absolute inset-0">
            <form
              onSubmit={handleSubmit}
              className="absolute"
              style={{
                top: "39.8%",
                right: "8.9%",
                width: "34.5%",
              }}
            >
              <div className="space-y-6">
                <div>
                  <label htmlFor="launch-name" className="sr-only">
                    Name
                  </label>
                  <input
                    id="launch-name"
                    type="text"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    autoComplete="name"
                    placeholder="Name"
                    className="block w-full rounded-[18px] border border-transparent bg-transparent px-4 text-slate-800 outline-none"
                    style={{
                      height: "clamp(40px, 5vw, 60px)",
                      paddingLeft: "clamp(42px, 4.7vw, 58px)",
                      fontSize: "clamp(16px, 1.7vw, 18px)",
                    }}
                  />
                </div>

                <div>
                  <label htmlFor="launch-email" className="sr-only">
                    Email Address
                  </label>
                  <input
                    id="launch-email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    autoComplete="email"
                    placeholder="Email Address"
                    className="block w-full rounded-[18px] border border-transparent bg-transparent px-4 text-slate-800 outline-none"
                    style={{
                      height: "clamp(40px, 5vw, 60px)",
                      paddingLeft: "clamp(42px, 4.7vw, 58px)",
                      fontSize: "clamp(16px, 1.7vw, 18px)",
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="block w-full rounded-[22px] font-extrabold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    height: "clamp(54px, 6.1vw, 82px)",
                    fontSize: "clamp(22px, 2.3vw, 28px)",
                    background:
                      "linear-gradient(180deg, rgb(32, 191, 78) 0%, rgb(14, 170, 72) 100%)",
                    boxShadow: "0 12px 30px rgba(16, 185, 129, 0.22)",
                  }}
                >
                  {buttonLabel}
                </button>
              </div>

              {error ? (
                <div className="mt-3 rounded-[16px] border border-rose-200 bg-white/95 px-4 py-3 text-sm font-medium text-rose-700 shadow-md">
                  {error}
                </div>
              ) : null}

              {success ? (
                <div className="mt-3 rounded-[16px] border border-emerald-200 bg-white/95 px-4 py-3 text-sm font-medium text-emerald-700 shadow-md">
                  {success}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}