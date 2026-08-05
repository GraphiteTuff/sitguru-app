/**
 * Client partnership inquiry helper.
 * Posts through the existing `/api/contact` pipeline (Supabase + notify).
 */

export type PartnershipPartnerType =
  | "parent"
  | "guru"
  | "ambassador"
  | "investor";

export type PartnershipPayload = {
  partnerType: PartnershipPartnerType;
  fullName: string;
  email: string;
  zipCode?: string;
  message: string;
  ambassadorCode?: string;
  organization?: string;
  programInterest?: string;
  urgentMedia?: boolean;
  source?: string;
  pagePath?: string;
};

export type PartnershipSubmitResult = {
  success: boolean;
  error?: string;
};

function partnerToTopic(partnerType: PartnershipPartnerType) {
  if (partnerType === "parent") return "pet-parent";
  if (partnerType === "guru") return "guru";
  if (partnerType === "ambassador") return "ambassadors";
  return "investors";
}

function buildMessage(payload: PartnershipPayload) {
  const parts = [payload.message.trim()];

  if (payload.partnerType === "parent" && payload.zipCode?.trim()) {
    parts.push(`ZIP: ${payload.zipCode.trim()}`);
  }
  if (payload.partnerType === "ambassador") {
    if (payload.ambassadorCode?.trim()) {
      parts.push(
        `Ambassador code preference: ${payload.ambassadorCode.trim()}`,
      );
    }
    if (payload.organization?.trim()) {
      parts.push(`Organization/School: ${payload.organization.trim()}`);
    }
  }
  if (payload.partnerType === "investor") {
    if (payload.organization?.trim()) {
      parts.push(`Organization / Firm: ${payload.organization.trim()}`);
    }
    if (payload.urgentMedia) {
      parts.push("URGENT MEDIA DEADLINE requested");
    }
  }

  return parts.filter(Boolean).join("\n\n");
}

/** Submit a partnership inquiry through SitGuru contact routing. */
export async function submitPartnershipInquiry(
  payload: PartnershipPayload,
): Promise<PartnershipSubmitResult> {
  const topic = partnerToTopic(payload.partnerType);
  const displayName =
    payload.partnerType === "investor"
      ? payload.organization?.trim() || payload.fullName.trim()
      : payload.fullName.trim();

  const response = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fullName: displayName,
      email: payload.email.trim(),
      phone: payload.zipCode?.trim() || undefined,
      topic,
      programInterest:
        payload.partnerType === "ambassador"
          ? payload.programInterest || ""
          : "",
      message: buildMessage(payload),
      source: payload.source || "contact-page",
      pagePath:
        payload.pagePath ||
        (typeof window !== "undefined"
          ? window.location.pathname
          : "/contact"),
      trafficSource:
        typeof window !== "undefined" ? window.location.hostname : "unknown",
    }),
  });

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    return {
      success: false,
      error:
        (body && typeof body.error === "string" && body.error) ||
        `Unable to submit right now (${response.status}).`,
    };
  }

  return { success: true };
}
