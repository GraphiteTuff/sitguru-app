import type { InternshipIntern } from "@/lib/internship/types";
import {
  SITGURU_DOMAIN_EVENTS,
  type SitGuruDomainEvent,
} from "@/lib/realtime/events";
import {
  pathsForGrowthWorkspace,
  pathsForInternWorkspace,
  pathsForManagerDesk,
  pathsForOnboarding,
} from "@/lib/realtime/query-keys";
import {
  publishLiveSignals,
  stableEventId,
} from "@/lib/realtime/publish-live-signal";
import {
  recipientsForGrowthWorkspace,
  recipientsForInternWorkspace,
} from "@/lib/realtime/recipients";

type Actor = {
  userId?: string | null;
  label?: string;
};

export async function publishInternHoursEvent(input: {
  intern: Pick<InternshipIntern, "id" | "userId" | "managerUserId" | "supervisorUserId" | "fullName">;
  eventType: SitGuruDomainEvent;
  resourceId: string;
  actor: Actor;
  submitted?: boolean;
  approved?: boolean;
  changesRequested?: boolean;
}) {
  const recipients = await recipientsForInternWorkspace(input.intern, {
    includeOversight: true,
  });
  const title = input.submitted
    ? `${input.intern.fullName} submitted hours`
    : input.approved
      ? "Hours approved"
      : input.changesRequested
        ? "Hours need changes"
        : "Hours updated";
  const body = input.submitted
    ? "Review submitted internship hours on Manager's Desk."
    : input.approved
      ? "Your internship hours were approved."
      : input.changesRequested
        ? "Your manager asked for hour changes."
        : "Internship hours changed.";

  return publishLiveSignals({
    eventType: input.eventType,
    eventId: stableEventId([
      input.eventType,
      input.resourceId,
      input.actor.userId,
      input.submitted ? "submit" : input.approved ? "approve" : "update",
    ]),
    recipientUserIds: recipients,
    resourceType: "internship_time_logs",
    resourceId: input.resourceId,
    scope: "intern",
    paths: pathsForInternWorkspace(),
    actorUserId: input.actor.userId,
    actorLabel: input.actor.label || "",
    revalidatePaths: pathsForInternWorkspace(),
    notify: Boolean(input.submitted || input.approved || input.changesRequested),
    notifyTitle: title,
    notifyBody: body,
    notifyHref: input.submitted ? "/intern/manage?tab=reviews" : "/intern?tab=home",
  });
}

export async function publishInternCheckinEvent(input: {
  intern: Pick<InternshipIntern, "id" | "userId" | "managerUserId" | "supervisorUserId" | "fullName">;
  eventType: SitGuruDomainEvent;
  resourceId: string;
  actor: Actor;
  needsChanges?: boolean;
  resubmitted?: boolean;
}) {
  const recipients = await recipientsForInternWorkspace(input.intern, {
    includeOversight: true,
  });
  return publishLiveSignals({
    eventType: input.eventType,
    eventId: stableEventId([input.eventType, input.resourceId, input.actor.userId]),
    recipientUserIds: recipients,
    resourceType: "internship_weekly_reviews",
    resourceId: input.resourceId,
    scope: "manager",
    paths: pathsForManagerDesk(),
    actorUserId: input.actor.userId,
    actorLabel: input.actor.label || "",
    revalidatePaths: pathsForManagerDesk(),
    notify: true,
    notifyTitle: input.needsChanges
      ? "Weekly check-in needs changes"
      : input.resubmitted
        ? `${input.intern.fullName} resubmitted a check-in`
        : `${input.intern.fullName} submitted a weekly check-in`,
    notifyBody: input.needsChanges
      ? "Review manager feedback and resubmit."
      : "Open Manager's Desk to review.",
    notifyHref: input.needsChanges ? "/intern?tab=home" : "/intern/manage?tab=reviews",
  });
}

export async function publishInternAssignmentEvent(input: {
  intern: Pick<InternshipIntern, "id" | "userId" | "managerUserId" | "supervisorUserId" | "fullName">;
  resourceId: string;
  actor: Actor;
  created?: boolean;
}) {
  const recipients = await recipientsForInternWorkspace(input.intern, {
    includeOversight: true,
  });
  const eventType = input.created
    ? SITGURU_DOMAIN_EVENTS.INTERN_ASSIGNMENT_CREATED
    : SITGURU_DOMAIN_EVENTS.INTERN_ASSIGNMENT_UPDATED;
  return publishLiveSignals({
    eventType,
    eventId: stableEventId([eventType, input.resourceId, input.actor.userId]),
    recipientUserIds: recipients,
    resourceType: "internship_interns",
    resourceId: input.resourceId,
    scope: "intern",
    paths: [...pathsForInternWorkspace(), ...pathsForOnboarding()],
    actorUserId: input.actor.userId,
    actorLabel: input.actor.label || "",
    revalidatePaths: pathsForInternWorkspace(),
    notify: true,
    notifyTitle: input.created
      ? "New internship assignment"
      : "Internship assignment updated",
    notifyBody: "Open your Intern Portal for Next Up details.",
    notifyHref: "/intern?tab=home",
  });
}

export async function publishInternQuestionEvent(input: {
  intern: Pick<InternshipIntern, "id" | "userId" | "managerUserId" | "supervisorUserId" | "fullName">;
  resourceId: string;
  actor: Actor;
  answered?: boolean;
}) {
  const recipients = await recipientsForInternWorkspace(input.intern);
  const eventType = input.answered
    ? SITGURU_DOMAIN_EVENTS.INTERN_QUESTION_ANSWERED
    : SITGURU_DOMAIN_EVENTS.INTERN_QUESTION_ASKED;
  return publishLiveSignals({
    eventType,
    eventId: stableEventId([eventType, input.resourceId, input.actor.userId]),
    recipientUserIds: recipients,
    resourceType: "internship_questions",
    resourceId: input.resourceId,
    scope: "manager",
    paths: pathsForManagerDesk(),
    actorUserId: input.actor.userId,
    actorLabel: input.actor.label || "",
    revalidatePaths: pathsForManagerDesk(),
    notify: true,
    notifyTitle: input.answered ? "Manager answered your question" : "New question for your manager",
    notifyBody: input.answered
      ? "Open the Intern Portal to read the answer."
      : `${input.intern.fullName} asked a question.`,
    notifyHref: input.answered ? "/intern" : "/intern/manage?tab=questions",
  });
}

export async function publishGrowthWorkspaceEvent(input: {
  eventType: SitGuruDomainEvent;
  resourceType: string;
  resourceId: string;
  actor: Actor;
  extraRecipients?: string[];
}) {
  const recipients = await recipientsForGrowthWorkspace(input.extraRecipients);
  return publishLiveSignals({
    eventType: input.eventType,
    eventId: stableEventId([
      input.eventType,
      input.resourceId,
      input.actor.userId,
      input.resourceType,
    ]),
    recipientUserIds: recipients,
    resourceType: input.resourceType,
    resourceId: input.resourceId,
    scope: "growth",
    paths: pathsForGrowthWorkspace(),
    actorUserId: input.actor.userId,
    actorLabel: input.actor.label || "",
    revalidatePaths: pathsForGrowthWorkspace(),
    notify: false,
  });
}

export async function publishOnboardingEvent(input: {
  intern: Pick<InternshipIntern, "id" | "userId" | "managerUserId" | "supervisorUserId" | "fullName">;
  resourceId: string;
  actor: Actor;
}) {
  const recipients = await recipientsForInternWorkspace(input.intern, {
    includeOversight: true,
  });
  return publishLiveSignals({
    eventType: SITGURU_DOMAIN_EVENTS.ONBOARDING_ITEM_COMPLETED,
    eventId: stableEventId([
      SITGURU_DOMAIN_EVENTS.ONBOARDING_ITEM_COMPLETED,
      input.resourceId,
      input.actor.userId,
    ]),
    recipientUserIds: recipients,
    resourceType: "internship_onboarding",
    resourceId: input.resourceId,
    scope: "onboarding",
    paths: pathsForOnboarding(),
    actorUserId: input.actor.userId,
    actorLabel: input.actor.label || "",
    revalidatePaths: pathsForOnboarding(),
    notify: true,
    notifyTitle: "Onboarding updated",
    notifyBody: "Your onboarding status changed.",
    notifyHref: "/intern/onboarding",
  });
}

export { SITGURU_DOMAIN_EVENTS };
