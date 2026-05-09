"use client";

import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";

type WelcomeConfettiProps = {
  shouldCelebrate: boolean;
  hasSeenWelcomeConfetti: boolean;
  message: string;
  onCelebrate?: () => Promise<void> | void;
};

function fireConfettiBurst() {
  if (typeof window === "undefined") return;

  const duration = 1800;
  const animationEnd = Date.now() + duration;

  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 70,
    zIndex: 9999,
    scalar: 0.95,
  };

  async function loadConfetti() {
    const mod = await import("canvas-confetti");
    return mod.default;
  }

  void loadConfetti().then((confetti) => {
    const interval = window.setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        window.clearInterval(interval);
        return;
      }

      const particleCount = Math.max(
        12,
        Math.floor((timeLeft / duration) * 60),
      );

      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: 0.1 + Math.random() * 0.2,
          y: Math.random() * 0.35,
        },
      });

      confetti({
        ...defaults,
        particleCount,
        origin: {
          x: 0.7 + Math.random() * 0.2,
          y: Math.random() * 0.35,
        },
      });
    }, 220);
  });
}

export default function WelcomeConfetti({
  shouldCelebrate,
  hasSeenWelcomeConfetti,
  message,
  onCelebrate,
}: WelcomeConfettiProps) {
  const [visible, setVisible] = useState(false);
  const [isPending, startTransition] = useTransition();
  const hasFiredRef = useRef(false);

  useEffect(() => {
    if (!shouldCelebrate || hasSeenWelcomeConfetti || hasFiredRef.current) {
      return;
    }

    hasFiredRef.current = true;

    const showTimer = window.setTimeout(() => {
      setVisible(true);
      fireConfettiBurst();

      if (onCelebrate) {
        startTransition(() => {
          void onCelebrate();
        });
      }
    }, 0);

    const hideTimer = window.setTimeout(() => {
      setVisible(false);
    }, 4200);

    return () => {
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
    };
  }, [shouldCelebrate, hasSeenWelcomeConfetti, onCelebrate]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[9998] flex justify-center px-4">
      <div className="flex w-full max-w-xl items-center gap-4 rounded-[2rem] border border-emerald-100 bg-white/95 px-5 py-4 text-left shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur">
        <Image
          src="/images/sitguru-message-avatar.jpg"
          alt="SitGuru"
          width={58}
          height={58}
          className="h-[58px] w-[58px] shrink-0 rounded-full border-4 border-emerald-100 object-cover"
          priority
        />

        <div>
          <p className="text-sm font-black text-emerald-700">
            Welcome to SitGuru 🎉
          </p>

          <p className="mt-1 text-sm font-semibold leading-5 text-slate-700">
            {message}
          </p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {isPending
              ? "Saving celebration..."
              : "We’re excited to have you here. Check your email to confirm your account."}
          </p>
        </div>
      </div>
    </div>
  );
}