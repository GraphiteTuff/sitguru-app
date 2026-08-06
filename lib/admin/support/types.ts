export type SupportRow = Record<string, unknown>;

export type SupportUserType = "parent" | "guru" | "ambassador";

export type SupportThreadMessage = {
  id: string;
  author: string;
  authorRole: "sender" | "admin" | "system";
  body: string;
  createdAt: string;
  channel: "intake" | "email" | "note";
};

export type SupportCase = {
  id: string;
  intakeNumber: string;
  source: string;
  supportEmail: string;
  senderName: string;
  senderEmail: string;
  senderPhone: string;
  subject: string;
  messageBody: string;
  relatedBookingId: string;
  caseType: string;
  caseTypeLabel: string;
  userType: SupportUserType;
  userTypeLabel: string;
  priority: string;
  priorityLabel: string;
  status: string;
  statusLabel: string;
  displayStatus: string;
  assignedTo: string;
  convertToDispute: boolean;
  linkedDisputeId: string;
  notes: string;
  replyThread: SupportThreadMessage[];
  financialAction: string;
  financialActionLabel: string;
  financialAmount: number;
  financialNote: string;
  refundRequested: boolean;
  refundAmount: number;
  financialImpact: number;
  createdAt: string;
  updatedAt: string;
};

export type SupportSenderProfile = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
};

export type SupportNotificationPayload = {
  to: string;
  senderName?: string;
  intakeNumber?: string;
  subject?: string;
  status?: string;
  message?: string;
  notificationType?: "created" | "updated" | "closed" | "converted";
  disputeNumber?: string;
};

export type SupportFilters = {
  q: string;
  type: string;
  status: string;
  priority: string;
  userType: string;
  sort: string;
  caseId: string;
};

export type SupportCasePatch = {
  status?: string;
  priority?: string;
  assignedTo?: string | null;
  notes?: string;
  replyBody?: string;
  sendEmail?: boolean;
};

export const CASE_TYPE_LABELS: Record<string, string> = {
  general_support: "General Support",
  booking_help: "Booking Help",
  payment_help: "Payment Help",
  guru_support: "Guru Support",
  customer_support: "Customer Support",
  platform_issue: "Platform Issue",
  refund_request: "Refund Request",
  dispute_request: "Dispute Request",
  trust_safety: "Trust & Safety",
  ambassador_support: "Ambassador Support",
};

export const USER_TYPE_LABELS: Record<SupportUserType, string> = {
  parent: "Pet Parent",
  guru: "Pet Guru",
  ambassador: "Ambassador",
};

/** Operator-facing priority: Low / Medium / Urgent */
export const PRIORITY_LABELS: Record<string, string> = {
  low: "Low",
  normal: "Medium",
  medium: "Medium",
  high: "Urgent",
  urgent: "Urgent",
};

/**
 * DB status → New / Open / Pending / Resolved
 * new → New, in_review → Open, waiting_response → Pending, closed/converted → Resolved
 */
export const STATUS_LABELS: Record<string, string> = {
  new: "New",
  in_review: "Open",
  waiting_response: "Pending",
  converted: "Resolved",
  closed: "Resolved",
};

export const STATUS_DETAIL_LABELS: Record<string, string> = {
  new: "New",
  in_review: "Open",
  waiting_response: "Pending",
  converted: "Converted",
  closed: "Resolved",
};

export const FINANCIAL_ACTION_LABELS: Record<string, string> = {
  none: "No Financial Action",
  customer_credit: "Customer Credit / Refund",
  customer_debit: "Customer Debit / Charge",
  guru_credit: "Guru Credit",
  guru_debit: "Guru Debit",
};

export const SUPPORT_SORT_OPTIONS = [
  { value: "updated_desc", label: "Last action (newest)" },
  { value: "updated_asc", label: "Last action (oldest)" },
  { value: "priority_desc", label: "Priority (urgent first)" },
  { value: "created_desc", label: "Created (newest)" },
  { value: "status", label: "Status" },
] as const;

export const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  normal: 2,
  low: 1,
};

export const STATUS_RANK: Record<string, number> = {
  new: 1,
  in_review: 2,
  waiting_response: 3,
  converted: 4,
  closed: 5,
};

export const QUICK_STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "in_review", label: "Open" },
  { value: "waiting_response", label: "Pending" },
  { value: "closed", label: "Resolved" },
] as const;
