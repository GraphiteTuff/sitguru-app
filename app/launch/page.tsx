"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { trackEvent } from "@/lib/analytics/track";

type InterestType = "customer" | "guru" | "both" | "";

function getLaunchSource() {
  if (typeof window === "undefined") return "social-launch";

  const params = new URLSearchParams(window.location.search);
  const source =
    params.get("source") ||
    params.get("utm_source") ||
    params.get("ref") ||
    "social-launch";

  const normalized = source.trim().toLowerCase();

  if (!normalized) return "social-launch";
  if (normalized === "ig" || normalized.includes("instagram")) return "instagram";
  if (normalized === "fb" || normalized.includes("facebook")) return "facebook";
  if (normalized === "tt" || normalized.includes("tiktok")) return "tiktok";
  if (normalized.includes("email")) return "email";
  if (normalized.includes("referral")) return "referral";

  return normalized;
}

function fireLaunchConfetti() {
  const end = Date.now() + 1800;

  const frame = () => {
    confetti({
      particleCount: 24,
      angle: 60,
      spread: 82,
      origin: { x: 0, y: 0.55 },
      scalar: 1.1,
      zIndex: 9999,
    });

    confetti({
      particleCount: 24,
      angle: 120,
      spread: 82,
      origin: { x: 1, y: 0.55 },
      scalar: 1.1,
      zIndex: 9999,
    });

    confetti({
      particleCount: 20,
      spread: 110,
      origin: { x: 0.5, y: 0.18 },
      scalar: 1.05,
      zIndex: 9999,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  frame();
}

function interestButtonClasses(
  selectedValue: InterestType,
  value: Exclude<InterestType, "">
) {
  const selected = selectedValue === value;

  return [
    "inline-flex items-center justify-center rounded-full border px-4 py-2.5 text-sm font-bold transition",
    selected
      ? "border-emerald-600 bg-emerald-600 text-white shadow-md"
      : "border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50",
  ].join(" ");
}

type LaunchFormCardProps = {
  fullName: string;
  email: string;
  interestType: InterestType;
  isSubmitting: boolean;
  error: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onInterestChange: (value: InterestType) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

function LaunchFormCard({
  fullName,
  email,
  interestType,
  isSubmitting,
  error,
  onNameChange,
  onEmailChange,
  onInterestChange,
  onSubmit,
}: LaunchFormCardProps) {
  return (
    <section className="rounded-[30px] border border-emerald-100 bg-white/96 p-5 shadow-[0_24px_60px_rgba(16,185,129,0.14)] backdrop-blur-sm sm:p-6">
      <div className="mb-5 text-center">
        <p className="text-[14px] font-black uppercase tracking-[0.28em] text-emerald-700 sm:text-[15px]">
          Join the Waitlist
        </p>
        <p className="mt-2 text-[14px] font-medium text-slate-500 sm:text-[16px]">
          Be first in line for launch news.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="launch-full-name"
            className="mb-2 block text-sm font-semibold text-slate-700"
          >
            Name
          </label>
          <input
            id="launch-full-name"
            type="text"
            value={fullName}
            onChange={(event) => onNameChange(event.target.value)}
            placeholder="Your name"
            autoComplete="name"
            className="w-full rounded-[18px] border border-emerald-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
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
            onChange={(event) => onEmailChange(event.target.value)}
            placeholder="Email Address"
            autoComplete="email"
            className="w-full rounded-[18px] border border-emerald-100 bg-white px-4 py-3.5 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
          />
        </div>

        <div>
          <p className="mb-3 text-sm font-semibold text-slate-700">I’m joining as</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              type="button"
              onClick={() => onInterestChange("customer")}
              className={interestButtonClasses(interestType, "customer")}
            >
              Pet Parent
            </button>
            <button
              type="button"
              onClick={() => onInterestChange("guru")}
              className={interestButtonClasses(interestType, "guru")}
            >
              Guru
            </button>
            <button
              type="button"
              onClick={() => onInterestChange("both")}
              className={interestButtonClasses(interestType, "both")}
            >
              Both
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-[22px] bg-emerald-600 px-6 py-4 text-lg font-black text-white shadow-[0_16px_30px_rgba(16,185,129,0.24)] transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70 sm:text-xl"
        >
          {isSubmitting ? "Joining..." : "Join the Waitlist"}
        </button>

        {error ? (
          <div className="rounded-[16px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700 shadow-sm">
            {error}
          </div>
        ) : null}

        <p className="text-center text-sm leading-6 text-slate-500">
          For <span className="font-semibold text-slate-700">Pet Parents</span> and{" "}
          <span className="font-semibold text-slate-700">Gurus*</span>.
        </p>
      </form>
    </section>
  );
}

export default function LaunchPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [interestType, setInterestType] = useState<InterestType>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [launchSource, setLaunchSource] = useState("social-launch");

  useEffect(() => {
    const source = getLaunchSource();

    setLaunchSource(source);

    trackEvent({
      eventName: "launch_page_visit",
      eventType: "traffic",
      source,
      metadata: {
        referrer: document.referrer || "",
        url: window.location.href,
        search: window.location.search,
        pathname: window.location.pathname,
      },
    });
  }, []);

  function handleInterestChange(value: InterestType) {
    setInterestType(value);

    trackEvent({
      eventName: "launch_interest_selected",
      eventType: "lead",
      source: launchSource || getLaunchSource(),
      role: value,
      metadata: {
        selected_interest: value,
        location: "launch_page_form",
      },
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const source = launchSource || getLaunchSource();

    if (!trimmedName || !trimmedEmail) {
      const message = "Please enter your name and email address.";
      setError(message);

      trackEvent({
        eventName: "launch_signup_validation_failed",
        eventType: "lead",
        source,
        role: interestType || "",
        metadata: {
          reason: "missing_name_or_email",
          has_name: Boolean(trimmedName),
          has_email: Boolean(trimmedEmail),
        },
      });

      return;
    }

    if (!interestType) {
      const message = "Please choose Pet Parent, Guru, or Both.";
      setError(message);

      trackEvent({
        eventName: "launch_signup_validation_failed",
        eventType: "lead",
        source,
        metadata: {
          reason: "missing_interest_type",
          has_name: Boolean(trimmedName),
          has_email: Boolean(trimmedEmail),
        },
      });

      return;
    }

    setIsSubmitting(true);

    trackEvent({
      eventName: "launch_signup_started",
      eventType: "lead",
      source,
      role: interestType,
      metadata: {
        location: "launch_page",
        has_name: Boolean(trimmedName),
        has_email: Boolean(trimmedEmail),
      },
    });

    try {
      const response = await fetch("/api/launch-signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: trimmedName,
          email: trimmedEmail,
          source,
          interestType,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || "Unable to join the waitlist right now.");
      }

      trackEvent({
        eventName: "launch_signup_completed",
        eventType: "lead",
        source,
        role: interestType,
        metadata: {
          location: "launch_page",
          interest_type: interestType,
        },
      });

      setFullName("");
      setEmail("");
      setInterestType("");
      fireLaunchConfetti();
      setShowSuccessModal(true);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Something went wrong. Please try again.";

      trackEvent({
        eventName: "launch_signup_failed",
        eventType: "lead",
        source,
        role: interestType,
        metadata: {
          location: "launch_page",
          error: message,
        },
      });

      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleShare() {
    const source = launchSource || getLaunchSource();

    const shareData = {
      title: "SitGuru",
      text: "Something New is Coming to Pet Care. Join the SitGuru waitlist.",
      url: typeof window !== "undefined" ? window.location.href : "",
    };

    trackEvent({
      eventName: "launch_share_clicked",
      eventType: "referral",
      source,
      metadata: {
        location: "launch_success_modal",
        share_url: shareData.url,
      },
    });

    try {
      if (navigator.share) {
        await navigator.share(shareData);

        trackEvent({
          eventName: "referral_shared",
          eventType: "referral",
          source,
          metadata: {
            location: "launch_success_modal",
            method: "native_share",
          },
        });

        return;
      }

      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url);

        trackEvent({
          eventName: "referral_shared",
          eventType: "referral",
          source,
          metadata: {
            location: "launch_success_modal",
            method: "clipboard",
          },
        });

        alert("Launch page link copied.");
      }
    } catch {
      trackEvent({
        eventName: "referral_share_cancelled",
        eventType: "referral",
        source,
        metadata: {
          location: "launch_success_modal",
        },
      });
    }
  }

  function handleInstagramClick() {
    trackEvent({
      eventName: "launch_cta_clicked",
      eventType: "navigation",
      source: launchSource || getLaunchSource(),
      metadata: {
        label: "Follow us on Instagram",
        location: "launch_success_modal",
        destination: "https://instagram.com",
      },
    });
  }

  function handleModalClose() {
    trackEvent({
      eventName: "launch_success_modal_closed",
      eventType: "lead",
      source: launchSource || getLaunchSource(),
      metadata: {
        location: "launch_success_modal",
      },
    });

    setShowSuccessModal(false);
  }

  return (
    <main className="min-h-screen bg-[#f4faf7] px-3 py-4 sm:px-4 sm:py-6">
      <div className="mx-auto max-w-[1180px]">
        <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(16,185,129,0.10)]">
          <img
            src="/images/pre-launch-page-clean.png"
            alt="SitGuru pre-launch page"
            className="block h-auto w-full select-none object-contain"
            draggable={false}
          />

          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            <div className="pointer-events-auto absolute right-[6.8%] top-[20.5%] w-[31.2%]">
              <LaunchFormCard
                fullName={fullName}
                email={email}
                interestType={interestType}
                isSubmitting={isSubmitting}
                error={error}
                onNameChange={setFullName}
                onEmailChange={setEmail}
                onInterestChange={handleInterestChange}
                onSubmit={handleSubmit}
              />
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-2xl lg:hidden">
          <LaunchFormCard
            fullName={fullName}
            email={email}
            interestType={interestType}
            isSubmitting={isSubmitting}
            error={error}
            onNameChange={setFullName}
            onEmailChange={setEmail}
            onInterestChange={handleInterestChange}
            onSubmit={handleSubmit}
          />
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
              You&apos;re In
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
                onClick={handleInstagramClick}
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
                onClick={handleModalClose}
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