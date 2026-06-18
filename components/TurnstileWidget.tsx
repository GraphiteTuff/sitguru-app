"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck } from "lucide-react";

type TurnstileTheme = "light" | "dark" | "auto";
type TurnstileSize = "normal" | "compact" | "flexible";

type TurnstileWidgetProps = {
  siteKey?: string;
  action?: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  className?: string;
  resetKey?: string | number;
  onVerify: (token: string) => void;
  onExpire?: () => void;
  onError?: () => void;
};

type TurnstileRenderOptions = {
  sitekey: string;
  action?: string;
  theme?: TurnstileTheme;
  size?: TurnstileSize;
  callback?: (token: string) => void;
  "expired-callback"?: () => void;
  "error-callback"?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement | string,
        options: TurnstileRenderOptions,
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-script";

function loadTurnstileScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      resolve();
      return;
    }

    if (window.turnstile) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = TURNSTILE_SCRIPT_ID;
    script.src =
      "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject();

    document.head.appendChild(script);
  });
}

export default function TurnstileWidget({
  siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "",
  action = "login",
  theme = "light",
  size = "normal",
  className = "",
  resetKey,
  onVerify,
  onExpire,
  onError,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(Boolean(siteKey));
  const [isLoading, setIsLoading] = useState(Boolean(siteKey));

  useEffect(() => {
    setIsConfigured(Boolean(siteKey));
  }, [siteKey]);

  useEffect(() => {
    let isMounted = true;

    async function renderTurnstile() {
      if (!siteKey || !containerRef.current) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        await loadTurnstileScript();

        if (!isMounted || !containerRef.current || !window.turnstile) return;

        if (widgetIdRef.current) {
          window.turnstile.remove(widgetIdRef.current);
          widgetIdRef.current = null;
        }

        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          action,
          theme,
          size,
          callback: (token: string) => {
            onVerify(token);
          },
          "expired-callback": () => {
            onExpire?.();
          },
          "error-callback": () => {
            onError?.();
          },
        });
      } catch {
        onError?.();
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    renderTurnstile();

    return () => {
      isMounted = false;

      if (
        typeof window !== "undefined" &&
        window.turnstile &&
        widgetIdRef.current
      ) {
        window.turnstile.remove(widgetIdRef.current);
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, action, theme, size, resetKey, onVerify, onExpire, onError]);

  if (!isConfigured) {
    return (
      <div
        className={`rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 ${className}`}
      >
        Turnstile is not configured yet. Add NEXT_PUBLIC_TURNSTILE_SITE_KEY in
        Vercel.
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-emerald-100 bg-emerald-50/60 p-3 ${className}`}
    >
      <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-emerald-700">
        <ShieldCheck className="h-4 w-4" />
        Protected login
      </div>

      <div className="min-h-[65px]">
        {isLoading ? (
          <div className="flex min-h-[65px] items-center text-sm font-semibold text-slate-600">
            Loading secure login check...
          </div>
        ) : null}

        <div ref={containerRef} />
      </div>
    </div>
  );
}