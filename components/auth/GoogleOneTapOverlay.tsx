/**
 * Google One-Tap overlay — non-intrusive GIS prompt for public marketing + signup.
 */

"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getPublicGoogleClientId,
  inferRoleFromPath,
  isOneTapEligiblePath,
  normalizeOneTapRole,
  type OneTapRole,
} from "@/lib/auth/google-one-tap";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleAccountsId = {
  initialize: (config: Record<string, unknown>) => void;
  prompt: (callback?: (notification: {
    isNotDisplayed: () => boolean;
    isSkippedMoment: () => boolean;
    isDismissedMoment: () => boolean;
    getNotDisplayedReason?: () => string;
    getSkippedReason?: () => string;
    getDismissedReason?: () => string;
  }) => void) => void;
  cancel: () => void;
};

declare global {
  interface Window {
    google?: {
      accounts?: {
        id?: GoogleAccountsId;
      };
    };
  }
}

const GIS_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const GIS_SCRIPT_ID = "sitguru-google-gsi-client";

type GoogleOneTapOverlayProps = {
  /** Force role when mounted inside a role-aware signup frame. */
  activeRole?: OneTapRole;
  /** Disable auto prompt (still available for manual mounts). */
  disabled?: boolean;
};

export default function GoogleOneTapOverlay({
  activeRole,
  disabled = false,
}: GoogleOneTapOverlayProps) {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const initializingRef = useRef(false);
  const handledCredentialRef = useRef(false);

  const roleFromQuery = searchParams?.get("role") || searchParams?.get("intent");
  const resolvedRole = normalizeOneTapRole(
    activeRole || roleFromQuery || inferRoleFromPath(pathname),
  );

  useEffect(() => {
    if (disabled) return;
    if (typeof window === "undefined") return;
    if (!isOneTapEligiblePath(pathname)) return;

    const clientId = getPublicGoogleClientId();
    if (!clientId) return;

    let cancelled = false;
    handledCredentialRef.current = false;

    async function bootstrap() {
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (cancelled || session?.user) {
          initializingRef.current = false;
          return;
        }

        await loadGisScript();
        if (cancelled || !window.google?.accounts?.id) {
          initializingRef.current = false;
          return;
        }

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: GoogleCredentialResponse) => {
            void handleCredential(response);
          },
          auto_select: false,
          cancel_on_tap_outside: true,
          context: "signup",
          itp_support: true,
          use_fedcm_for_prompt: true,
        });

        window.google.accounts.id.prompt((notification) => {
          if (
            notification.isNotDisplayed() ||
            notification.isSkippedMoment() ||
            notification.isDismissedMoment()
          ) {
            // Quietly no-op — user dismissed or browser blocked the prompt.
          }
        });
      } catch (err) {
        console.error("Google One-Tap bootstrap failed:", err);
      } finally {
        initializingRef.current = false;
      }
    }

    async function handleCredential(response: GoogleCredentialResponse) {
      if (handledCredentialRef.current) return;
      const credential = String(response?.credential || "").trim();
      if (!credential) return;

      handledCredentialRef.current = true;
      setLoading(true);
      setError("");

      try {
        const res = await fetch(
          `/api/auth/callback/google?role=${encodeURIComponent(resolvedRole)}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              credential,
              role: resolvedRole,
            }),
          },
        );

        const data = (await res.json()) as {
          success?: boolean;
          redirectUrl?: string;
          error?: string;
        };

        if (!res.ok || !data.success) {
          throw new Error(
            data.error || "Google One-Tap sign-in could not be completed.",
          );
        }

        try {
          const { dispatchSignupPostback } = await import(
            "@/utils/analyticsTelemetry"
          );
          await dispatchSignupPostback({
            email: String((data as { email?: string }).email || ""),
            role: resolvedRole,
            provider: "google",
            isNewUser: true,
          });
        } catch {
          // Telemetry must never block redirect.
        }

        window.location.href = data.redirectUrl || "/customer/dashboard";
      } catch (err) {
        handledCredentialRef.current = false;
        setLoading(false);
        setError(
          err instanceof Error
            ? err.message
            : "Google One-Tap session handshake dropped.",
        );
        console.error("One-Tap session handshake dropped:", err);
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
      try {
        window.google?.accounts?.id?.cancel();
      } catch {
        // ignore
      }
    };
  }, [activeRole, disabled, pathname, resolvedRole, roleFromQuery]);

  if (!loading && !error) {
    return (
      <div
        id="g_id_onload"
        className="pointer-events-none fixed right-4 top-4 z-[90]"
        aria-hidden
      />
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-end bg-slate-950/25 p-4 backdrop-blur-[2px] sm:p-6">
      <div
        role="status"
        aria-live="polite"
        className="mt-2 w-full max-w-sm rounded-2xl border border-white/20 bg-white p-4 shadow-2xl sm:mt-4"
      >
        <div className="flex items-start gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-[#0D5C3A]">
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <span className="text-sm font-black">G</span>
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-slate-950">
              {loading ? "Signing you into SitGuru…" : "Google sign-in issue"}
            </p>
            <p className="mt-1 text-xs font-semibold leading-5 text-slate-600">
              {loading
                ? `Preparing your ${
                    resolvedRole === "guru"
                      ? "Guru"
                      : resolvedRole === "ambassador"
                        ? "Ambassador"
                        : "Pet Parent"
                  } dashboard.`
                : error}
            </p>
          </div>
        </div>
        {error ? (
          <button
            type="button"
            onClick={() => setError("")}
            className="mt-3 inline-flex min-h-10 w-full items-center justify-center rounded-xl bg-[#0D5C3A] px-4 text-xs font-black text-white"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  );
}

function loadGisScript() {
  return new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Window unavailable"));
      return;
    }

    if (window.google?.accounts?.id) {
      resolve();
      return;
    }

    const existing = document.getElementById(
      GIS_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Failed to load Google Identity Services")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.id = GIS_SCRIPT_ID;
    script.src = GIS_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}
