export const CONTENT_FLOW = [
  "Draft",
  "Submitted to Ava",
  "Changes Requested",
  "Approved",
  "Needs CEO Review",
  "Ready to Publish",
  "Published",
  "Results Available",
] as const;

const LEGACY_LABELS: Record<string, string> = {
  Ready: "Ready to Publish",
  Posted: "Published",
};

export function contentStatusLabel(status: string) {
  return LEGACY_LABELS[status] || status || "Draft";
}

export type ContentActor = "intern" | "manager" | "supervisor";

export function contentStatusActions(input: { status: string; actor: ContentActor }) {
  const status = input.status || "Draft";
  const actor = input.actor;
  const actions: { status: string; label: string }[] = [];

  const push = (next: string, label: string) => actions.push({ status: next, label });

  if (status === "Draft" && actor !== "supervisor") {
    push("Submitted to Ava", "Submit to Ava");
  }
  if (status === "Changes Requested" && (actor === "intern" || actor === "manager")) {
    push("Submitted to Ava", "Resubmit to Ava");
  }
  if (status === "Submitted to Ava" && (actor === "manager" || actor === "supervisor")) {
    push("Approved", "Approve");
    push("Changes Requested", "Request changes");
    push("Needs CEO Review", "Escalate to Jason");
  }
  if (status === "Approved") {
    push("Ready to Publish", "Ready to publish");
  }
  if ((status === "Ready to Publish" || status === "Ready") && (actor === "intern" || actor === "manager" || actor === "supervisor")) {
    push("Published", "Mark published");
  }
  if ((status === "Published" || status === "Posted") && (actor === "intern" || actor === "manager" || actor === "supervisor")) {
    push("Results Available", "Results are in");
  }
  if (status === "Needs CEO Review" && actor === "supervisor") {
    push("Approved", "CEO approve");
    push("Changes Requested", "Request changes");
  }
  return actions;
}

export function allowedContentTransition(input: {
  from: string;
  to: string;
  actor: ContentActor;
}) {
  return contentStatusActions({ status: input.from, actor: input.actor }).some(
    (action) => action.status === input.to,
  );
}
