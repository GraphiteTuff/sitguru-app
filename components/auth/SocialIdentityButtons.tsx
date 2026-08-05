/**
 * Official Google + Apple social identity buttons for signup/login.
 * Full-width, touch-friendly, fluid across desktop / webapp / mobile.
 */

"use client";

import { Loader2 } from "lucide-react";

type SocialIdentityButtonsProps = {
  onGoogle: () => void;
  onApple: () => void;
  googleLoading?: boolean;
  appleLoading?: boolean;
  className?: string;
};

export function GoogleBrandIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 ${className}`}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}

export function AppleBrandIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={`shrink-0 fill-current ${className}`}
    >
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

export default function SocialIdentityButtons({
  onGoogle,
  onApple,
  googleLoading = false,
  appleLoading = false,
  className = "",
}: SocialIdentityButtonsProps) {
  const busy = googleLoading || appleLoading;

  return (
    <div className={`grid w-full gap-3 ${className}`}>
      <button
        type="button"
        onClick={onGoogle}
        disabled={busy}
        aria-label="Continue with Google"
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-black tracking-[-0.01em] text-slate-800 shadow-[0_1px_2px_rgba(15,23,42,0.06),0_4px_12px_rgba(15,23,42,0.06)] transition hover:border-slate-300 hover:bg-slate-50 hover:shadow-[0_2px_8px_rgba(15,23,42,0.08)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {googleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
        ) : (
          <GoogleBrandIcon />
        )}
        <span>Continue with Google</span>
      </button>

      <button
        type="button"
        onClick={onApple}
        disabled={busy}
        aria-label="Continue with Apple"
        className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-black tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(15,23,42,0.2),0_4px_12px_rgba(15,23,42,0.18)] transition hover:bg-black active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {appleLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-white" />
        ) : (
          <AppleBrandIcon className="h-5 w-5 text-white" />
        )}
        <span>Continue with Apple</span>
      </button>
    </div>
  );
}

export function TraditionalEmailDivider({
  label = "Or use traditional email",
}: {
  label?: string;
}) {
  return (
    <div className="relative flex w-full items-center py-1">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="mx-3 shrink-0 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}
