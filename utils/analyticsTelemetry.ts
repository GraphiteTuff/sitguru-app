/**
 * Client signup postback telemetry — wires new accounts into ambassador charts.
 */

export type SignupPostbackRole = "pet_parent" | "guru" | "ambassador";
export type SignupPostbackProvider = "google" | "apple" | "email";

export type SignupPostbackParams = {
  email: string;
  role: SignupPostbackRole;
  provider: SignupPostbackProvider;
  isNewUser: boolean;
};

type ReferralContext = {
  code?: string;
  campaign?: string;
  source?: string;
  program?: string;
};

function readLocal(key: string) {
  if (typeof window === "undefined") return "";
  try {
    return String(window.localStorage.getItem(key) || "").trim();
  } catch {
    return "";
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!match) return "";
  return decodeURIComponent(match.slice(name.length + 1)).trim();
}

function resolveReferralContext(): ReferralContext {
  const rawActive = readLocal("sitguru_active_referral");
  if (rawActive) {
    try {
      const parsed = JSON.parse(rawActive) as ReferralContext;
      if (parsed && typeof parsed === "object") {
        return {
          code: String(parsed.code || "").trim() || undefined,
          campaign: String(parsed.campaign || "").trim() || undefined,
          source: String(parsed.source || "").trim() || undefined,
          program: String(parsed.program || "").trim() || undefined,
        };
      }
    } catch {
      // Non-JSON string — treat as bare code.
      return { code: rawActive };
    }
  }

  const code =
    readLocal("sitguru_ambassador_code") ||
    readLocal("sitguru_referral_code") ||
    readCookie("sitguru_ambassador_code") ||
    readCookie("sitguru_referral_code") ||
    readCookie("sitguru_ambassador_ref");

  const campaign =
    readLocal("sitguru_referral_campaign") ||
    readCookie("sitguru_referral_campaign");

  return {
    code: code || undefined,
    campaign: campaign || undefined,
  };
}

async function sha256Hex(value: string) {
  const input = String(value || "").trim().toLowerCase();
  if (!input) return "";

  if (typeof window === "undefined" || !window.crypto?.subtle) {
    // Lightweight non-crypto fallback for rare environments.
    let hash = 0;
    for (let i = 0; i < input.length; i += 1) {
      hash = (hash << 5) - hash + input.charCodeAt(i);
      hash |= 0;
    }
    return `fallback_${Math.abs(hash)}`;
  }

  const data = new TextEncoder().encode(input);
  const digest = await window.crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Fire signup completion telemetry for Google / Apple / email success states.
 * Never throws — analytics must not block onboarding.
 */
export async function dispatchSignupPostback(data: SignupPostbackParams) {
  try {
    if (typeof window === "undefined") return;

    const referralContext = resolveReferralContext();
    const email = String(data.email || "").trim().toLowerCase();
    const userIdSha256 = await sha256Hex(email);

    const payload = {
      event: "user_registered_completed",
      timestamp: new Date().toISOString(),
      userIdSha256,
      userEmail: email || undefined,
      role: data.role,
      provider: data.provider,
      isNewUser: Boolean(data.isNewUser),
      ambassadorCodeApplied: referralContext.code || null,
      campaignSource: referralContext.campaign || referralContext.source || "direct",
      metadata: {
        program: referralContext.program || null,
      },
    };

    await Promise.allSettled([
      fetch("/api/analytics/event-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }),
      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventName: "user_registered_completed",
          eventType: "signup",
          role: data.role,
          source: data.provider,
          pagePath: window.location.pathname,
          metadata: {
            provider: data.provider,
            isNewUser: data.isNewUser,
            ambassadorCodeApplied: referralContext.code || null,
            campaignSource:
              referralContext.campaign || referralContext.source || "direct",
            userIdSha256,
          },
        }),
        keepalive: true,
      }),
    ]);
  } catch (err) {
    console.warn("Analytics telemetry pipeline dropped event logging:", err);
  }
}
