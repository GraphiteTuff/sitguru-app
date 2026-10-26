/**
 * Lightweight SitGuru domain event names (req 98).
 * Drive live UI sync, optional notifications, audit attribution, and path refresh.
 * Not an enterprise bus — string constants only.
 */

export const SITGURU_DOMAIN_EVENTS = {
  TIME_ENTRY_CREATED: "time.entry.created",
  TIME_PERIOD_SUBMITTED: "time.period.submitted",
  TIME_PERIOD_APPROVED: "time.period.approved",
  PAYMENT_READY: "payment.ready",
  PAYMENT_PROCESSING: "payment.processing",
  PAYMENT_PAID: "payment.paid",
  INTERN_HOURS_SUBMITTED: "intern.hours.submitted",
  INTERN_HOURS_REVIEWED: "intern.hours.reviewed",
  INTERN_HOURS_APPROVED: "intern.hours.approved",
  INTERN_CHECKIN_SUBMITTED: "intern.checkin.submitted",
  INTERN_CHECKIN_REVIEWED: "intern.checkin.reviewed",
  INTERN_ASSIGNMENT_CREATED: "intern.assignment.created",
  INTERN_ASSIGNMENT_UPDATED: "intern.assignment.updated",
  INTERN_MILESTONE_COMPLETED: "intern.milestone.completed",
  INTERN_QUESTION_ASKED: "intern.question.asked",
  INTERN_QUESTION_ANSWERED: "intern.question.answered",
  GROWTH_INITIATIVE_CREATED: "growth.initiative.created",
  GROWTH_INITIATIVE_UPDATED: "growth.initiative.updated",
  GROWTH_EVENT_RECORDED: "growth.event.recorded",
  GROWTH_INTELLIGENCE_RECORDED: "growth.intelligence.recorded",
  ONBOARDING_ITEM_COMPLETED: "onboarding.item.completed",
  ACCESS_UPDATED: "access.updated",
  MESSAGE_CREATED: "message.created",
  WORKSPACE_GENERIC: "workspace.updated",
} as const;

export type SitGuruDomainEvent =
  (typeof SITGURU_DOMAIN_EVENTS)[keyof typeof SITGURU_DOMAIN_EVENTS];

/** Events that warrant a user-facing notification (req 102 — avoid spam). */
export const NOTIFY_WORTHY_EVENTS = new Set<SitGuruDomainEvent>([
  SITGURU_DOMAIN_EVENTS.INTERN_HOURS_SUBMITTED,
  SITGURU_DOMAIN_EVENTS.INTERN_HOURS_APPROVED,
  SITGURU_DOMAIN_EVENTS.INTERN_HOURS_REVIEWED,
  SITGURU_DOMAIN_EVENTS.INTERN_CHECKIN_SUBMITTED,
  SITGURU_DOMAIN_EVENTS.INTERN_CHECKIN_REVIEWED,
  SITGURU_DOMAIN_EVENTS.INTERN_ASSIGNMENT_CREATED,
  SITGURU_DOMAIN_EVENTS.INTERN_ASSIGNMENT_UPDATED,
  SITGURU_DOMAIN_EVENTS.INTERN_MILESTONE_COMPLETED,
  SITGURU_DOMAIN_EVENTS.INTERN_QUESTION_ASKED,
  SITGURU_DOMAIN_EVENTS.TIME_PERIOD_SUBMITTED,
  SITGURU_DOMAIN_EVENTS.TIME_PERIOD_APPROVED,
  SITGURU_DOMAIN_EVENTS.PAYMENT_READY,
  SITGURU_DOMAIN_EVENTS.PAYMENT_PAID,
  SITGURU_DOMAIN_EVENTS.ONBOARDING_ITEM_COMPLETED,
  SITGURU_DOMAIN_EVENTS.ACCESS_UPDATED,
]);

export type LiveSignalScope =
  | "intern"
  | "manager"
  | "admin"
  | "growth"
  | "help"
  | "payments"
  | "timekeeper"
  | "messaging"
  | "onboarding"
  | "access"
  | "workspace";
