"use client";

import { useState } from "react";
import confetti from "canvas-confetti";

function fireLaunchConfetti() {
  const end = Date.now() + 1800;

  const frame = () => {
    confetti({
      particleCount: 22,
      angle: 60,
      spread: 78,
      origin: { x: 0, y: 0.55 },
      scalar: 1.08,
      zIndex: 9999,
    });

    confetti({
      particleCount: 22,
      angle: 120,
      spread: 78,
      origin: { x: 1, y: 0.55 },
      scalar: 1.08,
      zIndex: 9999,
    });

    confetti({
      particleCount: 18,
      spread: 100,
      origin: { x: 0.5, y: 0.18 },
      scalar: 1.02,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

type InterestType = "customer" | "guru" | "both" | "";

export default function LaunchPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [interestType, setInterestType] = useState<InterestType>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail) {
      setError("Please enter your name and email address.");
      return;
    }

    if (!interestType) {
      setError("Please choose Pet Parent, Guru, or Both.");
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
          interestType,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to join the waitlist right now.");
      }

      setName("");
      setEmail("");
      setInterestType("");
      fireLaunchConfetti();
      setShowSuccessModal(true);
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

  async function handleShare() {
    const shareData = {
      title: "SitGuru",
      text: "Something New is Coming to Pet Care. Join the SitGuru waitlist.",
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);
        alert("Launch page link copied.");
      }
    } catch {
      // ignore
    }
  }

  function interestButtonClasses(value: Exclude<InterestType, "">) {
    const selected = interestType === value;

    return [
      "inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-bold transition",
      selected
        ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
        : "border-emerald-200 bg-white/95 text-emerald-700 hover:bg-emerald-50",
    ].join(" ");
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
              <div className="space-y-4">
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

                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    type="button"
                    onClick={() => setInterestType("customer")}
                    className={interestButtonClasses("customer")}
                  >
                    Pet Parent
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestType("guru")}
                    className={interestButtonClasses("guru")}
                  >
                    Guru
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterestType("both")}
                    className={interestButtonClasses("both")}
                  >
                    Both
                  </button>
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
                  {isSubmitting ? "Joining..." : "Join the Waitlist"}
                </button>
              </div>

              {error ? (
                <div className="mt-3 rounded-[16px] border border-rose-200 bg-white/95 px-4 py-3 text-sm font-medium text-rose-700 shadow-md">
                  {error}
                </div>
              ) : null}
            </form>
          </div>
        </div>
      </div>

      {showSuccessModal ? (
        <div className="fixed inset-0 z-[9998] flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-[420px] rounded-[28px] border border-emerald-100 bg-white p-6 text-center shadow-[0_30px_80px_rgba(15,23,42,0.24)] sm:p-7">
            <div className="mx-auto mb-3 flex justify-center">
              <img
                src="/images/sitguru-logo-cropped.png"
                alt="SitGuru logo"
                className="h-12 w-auto object-contain"
              />
            </div>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50">
              <svg
                viewBox="0 0 24 24"
                className="h-7 w-7 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path d="m5 13 4 4L19 7" />
              </svg>
            </div>

            <p className="text-[11px] font-black uppercase tracking-[0.26em] text-emerald-600">
              You're In
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
              Welcome to SitGuru.com!
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-600">
              You’re officially on the list and we’ll let you know as soon as SitGuru launches.
            </p>

            <div className="mt-5 grid gap-2.5">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex w-full items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-emerald-700"
              >
                Follow us on Instagram
              </a>

              <button
                type="button"
                onClick={handleShare}
                className="inline-flex w-full items-center justify-center rounded-full border border-emerald-200 bg-white px-5 py-3 text-sm font-bold text-emerald-700 transition hover:bg-emerald-50"
              >
                Share with a Pet Parent
              </button>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}