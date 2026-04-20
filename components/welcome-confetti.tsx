"use client";

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

      const particleCount = Math.max(12, Math.floor((timeLeft / duration) * 60));

      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.1 + Math.random() * 0.2, y: Math.random() * 0.35 },
      });

      confetti({
        ...defaults,
        particleCount,
        origin: { x: 0.7 + Math.random() * 0.2, y: Math.random() * 0.35 },
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
    setVisible(true);
    fireConfettiBurst();

    if (onCelebrate) {
      startTransition(() => {
        void onCelebrate();
      });
    }

    const timeout = window.setTimeout(() => {
      setVisible(false);
    }, 4200);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [shouldCelebrate, hasSeenWelcomeConfetti, onCelebrate]);

  if (!visible) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[9998] flex justify-center px-4">
      <div className="max-w-xl rounded-2xl border border-emerald-400/20 bg-slate-950/95 px-5 py-4 text-center shadow-2xl shadow-black/40 backdrop-blur">
        <p className="text-sm font-semibold text-emerald-300">{message}</p>
        <p className="mt-1 text-xs text-slate-300">
          {isPending ? "Saving celebration..." : "We’re excited to have you here."}
        </p>
      </div>
    </div>
  );
}