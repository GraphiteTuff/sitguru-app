"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { Mail } from "lucide-react";

import { login } from "@/app/auth/actions";
import TurnstileWidget from "@/components/TurnstileWidget";

type CustomerEmailLoginFormProps = {
  nextPath: string;
};

export default function CustomerEmailLoginForm({
  nextPath,
}: CustomerEmailLoginFormProps) {
  const [turnstileToken, setTurnstileToken] = useState("");
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const handleTurnstileVerify = useCallback((token: string) => {
    setTurnstileToken(token);
  }, []);

  const handleTurnstileExpire = useCallback(() => {
    setTurnstileToken("");
    setTurnstileResetKey((value) => value + 1);
  }, []);

  const handleTurnstileError = useCallback(() => {
    setTurnstileToken("");
  }, []);

  return (
    <details className="group rounded-2xl border border-slate-200 bg-slate-50">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-sm font-bold text-slate-800">
        <span className="inline-flex items-center gap-2">
          <Mail className="h-4 w-4 text-emerald-600" />
          Log in with email and password
        </span>

        <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500 shadow-sm">
          Backup option
        </span>
      </summary>

      <div className="border-t border-slate-200 bg-white px-5 py-5">
        <form action={login} className="space-y-5">
          <input type="hidden" name="next" value={nextPath} />
          <input type="hidden" name="turnstileToken" value={turnstileToken} />

          <div className="space-y-2">
            <label
              htmlFor="customer-login-email"
              className="block text-sm font-medium text-slate-700"
            >
              Email
            </label>

            <input
              id="customer-login-email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="customer@sitguru.com"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="customer-login-password"
              className="block text-sm font-medium text-slate-700"
            >
              Password
            </label>

            <input
              id="customer-login-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="Enter your password"
              className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-emerald-500"
            />
          </div>

          <TurnstileWidget
            action="pet_parent_email_login"
            resetKey={turnstileResetKey}
            onVerify={handleTurnstileVerify}
            onExpire={handleTurnstileExpire}
            onError={handleTurnstileError}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
            <Link
              href="/forgot-password"
              className="text-emerald-700 hover:text-emerald-600"
            >
              Forgot password?
            </Link>

            <Link
              href={`/signup?next=${encodeURIComponent(nextPath)}`}
              className="text-emerald-700 hover:text-emerald-600"
            >
              Need an account?
            </Link>
          </div>

          <button
            type="submit"
            disabled={!turnstileToken}
            className="inline-flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            {turnstileToken
              ? "Log in with email"
              : "Complete secure login check"}
          </button>
        </form>
      </div>
    </details>
  );
}
