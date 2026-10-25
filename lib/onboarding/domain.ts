export const EXAMPLE_SIGNATURE_PROVIDERS = [
  "internal_acknowledgment",
  "sharepoint_esign",
  "adobe_sign",
  "docusign",
  "external_provider",
  "manual_verified",
] as const;

export type OnboardingKind = "signature" | "review" | "acknowledgment";
export type RequirementLevel = "required" | "optional";

export type OnboardingItemState = {
  id: string;
  kind: OnboardingKind;
  requirement: RequirementLevel;
  status: string;
  title: string;
  versionId: string;
  versionLabel: string;
  featureKey?: string | null;
  storageRef?: string | null;
  signingUrl?: string | null;
  referencedVersionIds?: string[];
};

const SIGNATURE_COMPLETE = new Set(["fully_executed"]);

export function normalizeProvider(value: string) {
  const provider = String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
  if (!provider || provider.length > 80) {
    return { ok: false as const, error: "Choose how this document will be signed." };
  }
  return { ok: true as const, provider };
}

export function statusLabel(kind: OnboardingKind, status: string) {
  if (kind === "review") {
    if (status === "reviewed") return "Reviewed";
    if (status === "opened") return "Review required";
    if (status === "superseded") return "Replaced";
    return "Not reviewed";
  }
  if (status === "fully_executed") return "Complete";
  if (status === "countersignature_pending" || status === "signed_by_contractor") {
    return "Awaiting SitGuru signature";
  }
  if (status === "viewed" || status === "sent_for_signature") return "Ready to sign";
  if (status === "returned") return "Needs an update";
  if (status === "superseded") return "Replaced";
  if (kind === "acknowledgment") return "Ready when reviews are done";
  return "Not started";
}

export function openForReview(status: string) {
  if (status === "reviewed" || status === "superseded") {
    return { ok: true as const, status, reviewed: status === "reviewed" };
  }
  return { ok: true as const, status: "opened", reviewed: false };
}

export function confirmReview(status: string) {
  if (status === "superseded") {
    return { ok: false as const, error: "This version was replaced. Review the current one." };
  }
  if (status !== "opened" && status !== "reviewed") {
    return { ok: false as const, error: "Open the document, then confirm you have reviewed it." };
  }
  return { ok: true as const, status: "reviewed" };
}

export function userCanCompleteSignature() {
  return false;
}

export function followSigningLink(status: string) {
  if (!["sent_for_signature", "viewed", "returned"].includes(status)) {
    return { ok: false as const, error: "A signing request is not ready yet." };
  }
  return { ok: true as const, status: "viewed", completed: false };
}

export function adminSignatureTransition(input: {
  status: string;
  action: "send" | "record_signed" | "verify" | "return";
}) {
  if (input.action === "send") {
    if (!["assigned", "returned", "not_assigned"].includes(input.status)) {
      return { ok: false as const, error: "This item is already out for signature." };
    }
    return { ok: true as const, status: "sent_for_signature" };
  }
  if (input.action === "record_signed") {
    if (!["sent_for_signature", "viewed"].includes(input.status)) {
      return { ok: false as const, error: "Send the signing request before recording a signature." };
    }
    return { ok: true as const, status: "countersignature_pending" };
  }
  if (input.action === "return") {
    return { ok: true as const, status: "returned" };
  }
  if (!["sent_for_signature", "viewed", "signed_by_contractor", "countersignature_pending"].includes(input.status)) {
    return { ok: false as const, error: "Nothing is ready to verify." };
  }
  return { ok: true as const, status: "fully_executed" };
}

export function reviewsComplete(items: OnboardingItemState[]) {
  return items
    .filter((item) => item.kind === "review" && item.requirement === "required" && item.status !== "superseded")
    .every((item) => item.status === "reviewed");
}

export function acknowledgmentUnlocked(items: OnboardingItemState[]) {
  return reviewsComplete(items);
}

export function itemComplete(item: OnboardingItemState) {
  if (item.status === "superseded") return true;
  if (item.kind === "review") return item.status === "reviewed";
  return SIGNATURE_COMPLETE.has(item.status);
}

export function onboardingProgress(items: OnboardingItemState[]) {
  const required = items.filter((item) => item.requirement === "required" && item.status !== "superseded");
  const done = required.filter(itemComplete).length;
  const percent = required.length ? Math.round((done / required.length) * 100) : 0;
  return {
    complete: required.length > 0 && done === required.length,
    percent,
    done,
    total: required.length,
    outstanding: required.filter((item) => !itemComplete(item)).map((item) => item.title),
  };
}

export function visiblePackageItems<T extends { featureKey?: string | null }>(
  items: T[],
  flags: Record<string, boolean>,
) {
  return items.filter((item) => !item.featureKey || flags[item.featureKey] === true);
}

export function publishNextVersion(input: {
  previousVersionId: string;
  nextVersionId: string;
  reacknowledgmentRequired: boolean;
}) {
  return {
    previousVersionId: input.previousVersionId,
    nextVersionId: input.nextVersionId,
    previousRemainsVisible: true,
    requiresNewAcknowledgment: input.reacknowledgmentRequired,
  };
}

export function canReadPersonnelFile(actor: "subject" | "founder" | "manager" | "team" | "none") {
  return actor === "subject" || actor === "founder";
}

export function readinessForManager(item: OnboardingItemState) {
  return {
    title: item.title,
    status: statusLabel(item.kind, item.status),
    fileHidden: true,
  };
}

export function assignPackage(input: {
  templateRole: string;
  subjectRole: string;
}) {
  if (input.templateRole !== input.subjectRole) {
    return { ok: false as const, error: "That onboarding package is for a different role." };
  }
  return { ok: true as const };
}

export function layoutForWidth(width: number) {
  return width < 768 ? "cards" : "split";
}

export function referencedVersionSnapshot(items: OnboardingItemState[]) {
  return items
    .filter((item) => item.kind === "review" && item.requirement === "required" && item.status === "reviewed")
    .map((item) => ({
      versionId: item.versionId,
      versionLabel: item.versionLabel,
      title: item.title,
    }));
}
