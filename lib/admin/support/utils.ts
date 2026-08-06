import {
  CASE_TYPE_LABELS,
  FINANCIAL_ACTION_LABELS,
  PRIORITY_LABELS,
  PRIORITY_RANK,
  STATUS_DETAIL_LABELS,
  STATUS_LABELS,
  STATUS_RANK,
  USER_TYPE_LABELS,
  type SupportCase,
  type SupportFilters,
  type SupportRow,
  type SupportThreadMessage,
  type SupportUserType,
} from "@/lib/admin/support/types";

export function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function toNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const parsed = Number(String(value || "").replace(/[^0-9.-]/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

export function moneyExact(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Math.abs(value));
}

export function getFinancialActionLabel(value: string) {
  return (
    FINANCIAL_ACTION_LABELS[value] ||
    value.replace(/_/g, " ") ||
    "No Financial Action"
  );
}

export function extractMoneyAmount(value: string) {
  const match = value.match(
    /\$\s*([0-9]+(?:,[0-9]{3})*(?:\.[0-9]{1,2})?|[0-9]+(?:\.[0-9]{1,2})?)/
  );

  if (!match?.[1]) {
    return 0;
  }

  const parsed = Number(match[1].replace(/,/g, ""));

  return Number.isFinite(parsed) ? parsed : 0;
}

export function isRefundAction(action: string) {
  return action === "customer_credit";
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value
  );
}

export function shouldSendEmail(formData: FormData) {
  return formData.get("sendEmail") === "on";
}

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function formatDateShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTimeShort(value?: string | null) {
  if (!value) return "—";

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return "—";

  return parsed.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "—";

  const date = formatDateShort(value);
  const time = formatTimeShort(value);

  if (date === "—" || time === "—") return date;

  return `${date} · ${time}`;
}

export function isToday(value?: string | null) {
  if (!value) return false;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) return false;

  const now = new Date();

  return (
    parsed.getFullYear() === now.getFullYear() &&
    parsed.getMonth() === now.getMonth() &&
    parsed.getDate() === now.getDate()
  );
}

export function getCaseTypeLabel(value: string) {
  return CASE_TYPE_LABELS[value] || value.replace(/_/g, " ") || "General Support";
}

export function getPriorityLabel(value: string) {
  return PRIORITY_LABELS[value] || value.replace(/_/g, " ") || "Normal";
}

export function getStatusLabel(value: string) {
  return STATUS_LABELS[value] || value.replace(/_/g, " ") || "Open";
}

export function getStatusDetailLabel(value: string) {
  return STATUS_DETAIL_LABELS[value] || value.replace(/_/g, " ") || "New";
}

export function getUserTypeLabel(value: SupportUserType | string) {
  const key = value as SupportUserType;
  return USER_TYPE_LABELS[key] || "Pet Parent";
}

export function deriveUserType(
  caseType: string,
  explicit?: string | null
): SupportUserType {
  const normalized = asTrimmedString(explicit).toLowerCase();

  if (
    normalized === "parent" ||
    normalized === "guru" ||
    normalized === "ambassador"
  ) {
    return normalized;
  }

  if (caseType === "guru_support") return "guru";
  if (caseType === "ambassador_support") return "ambassador";

  return "parent";
}

export function makeIntakeNumber() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  return `SUP-${stamp}`;
}

export function makeDisputeNumber() {
  const stamp = new Date()
    .toISOString()
    .replace(/[-:.TZ]/g, "")
    .slice(0, 14);

  return `DP-${stamp}`;
}

export function mapCaseTypeToDisputeType(caseType: string) {
  if (caseType === "refund_request") return "refund_review";
  if (caseType === "trust_safety") return "trust_safety";
  if (caseType === "payment_help") return "payment_issue";
  if (caseType === "booking_help") return "booking_issue";
  if (caseType === "dispute_request") return "service_complaint";

  return "service_complaint";
}

export function parseReplyThread(value: unknown): SupportThreadMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => {
      if (!item || typeof item !== "object") return null;
      const row = item as Record<string, unknown>;
      const body = asTrimmedString(row.body);
      if (!body) return null;

      const authorRoleRaw = asTrimmedString(row.authorRole).toLowerCase();
      const authorRole =
        authorRoleRaw === "admin" || authorRoleRaw === "system"
          ? authorRoleRaw
          : "sender";

      const channelRaw = asTrimmedString(row.channel).toLowerCase();
      const channel =
        channelRaw === "email" || channelRaw === "note"
          ? channelRaw
          : "intake";

      return {
        id: asTrimmedString(row.id) || `msg-${index + 1}`,
        author: asTrimmedString(row.author) || "Unknown",
        authorRole: authorRole as SupportThreadMessage["authorRole"],
        body,
        createdAt:
          asTrimmedString(row.createdAt) || new Date().toISOString(),
        channel: channel as SupportThreadMessage["channel"],
      };
    })
    .filter(Boolean) as SupportThreadMessage[];
}

export function buildConversationTimeline(
  item: SupportCase
): SupportThreadMessage[] {
  const intake: SupportThreadMessage = {
    id: `${item.id}-intake`,
    author: item.senderName,
    authorRole: "sender",
    body: item.messageBody || item.subject || "No message body entered.",
    createdAt: item.createdAt || new Date().toISOString(),
    channel: "intake",
  };

  const thread = item.replyThread.length
    ? item.replyThread
    : item.notes
      ? [
          {
            id: `${item.id}-notes`,
            author: item.assignedTo || "Admin",
            authorRole: "admin" as const,
            body: item.notes,
            createdAt: item.updatedAt || item.createdAt,
            channel: "note" as const,
          },
        ]
      : [];

  return [intake, ...thread].sort(
    (a, b) =>
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

export function normalizeSupportCase(
  row: SupportRow,
  index: number
): SupportCase {
  const caseType = asTrimmedString(row.case_type) || "general_support";
  const priority = asTrimmedString(row.priority) || "normal";
  const status = asTrimmedString(row.status) || "new";
  const userType = deriveUserType(caseType, asTrimmedString(row.user_type));
  const createdAt = asTrimmedString(row.created_at);
  const senderName = asTrimmedString(row.sender_name) || "Sender";
  const messageBody = asTrimmedString(row.message_body);

  return {
    id: asTrimmedString(row.id),
    intakeNumber:
      asTrimmedString(row.intake_number) ||
      `SUP-${String(index + 1).padStart(4, "0")}`,
    source: asTrimmedString(row.source) || "support_email",
    supportEmail: asTrimmedString(row.support_email) || "support@sitguru.com",
    senderName,
    senderEmail: asTrimmedString(row.sender_email),
    senderPhone: asTrimmedString(row.sender_phone),
    subject: asTrimmedString(row.subject) || "Support request",
    messageBody,
    relatedBookingId: asTrimmedString(row.related_booking_id),
    caseType,
    caseTypeLabel: getCaseTypeLabel(caseType),
    userType,
    userTypeLabel: getUserTypeLabel(userType),
    priority,
    priorityLabel: getPriorityLabel(priority),
    status,
    statusLabel: getStatusLabel(status),
    displayStatus: getStatusLabel(status),
    assignedTo: asTrimmedString(row.assigned_to),
    convertToDispute: Boolean(row.convert_to_dispute),
    linkedDisputeId: asTrimmedString(row.linked_dispute_id),
    notes: asTrimmedString(row.notes),
    replyThread: parseReplyThread(row.reply_thread),
    financialAction: asTrimmedString(row.financial_action) || "none",
    financialActionLabel: getFinancialActionLabel(
      asTrimmedString(row.financial_action) || "none"
    ),
    financialAmount: toNumber(row.financial_amount),
    financialNote: asTrimmedString(row.financial_note),
    refundRequested: Boolean(row.refund_requested),
    refundAmount: toNumber(row.refund_amount),
    financialImpact: toNumber(row.financial_impact),
    createdAt,
    updatedAt: asTrimmedString(row.updated_at),
  };
}

export function getSearchValue(
  params: Record<string, string | string[] | undefined>,
  key: string
) {
  const value = params[key];

  if (Array.isArray(value)) {
    return value[0] || "";
  }

  return value || "";
}

export function parseSupportFilters(
  params: Record<string, string | string[] | undefined>
): SupportFilters {
  return {
    q: getSearchValue(params, "q").trim(),
    type: getSearchValue(params, "type").trim().toLowerCase() || "all",
    status: getSearchValue(params, "status").trim().toLowerCase() || "all",
    priority: getSearchValue(params, "priority").trim().toLowerCase() || "all",
    userType: getSearchValue(params, "userType").trim().toLowerCase() || "all",
    sort: getSearchValue(params, "sort").trim() || "updated_desc",
    caseId: getSearchValue(params, "case").trim(),
  };
}

function matchesQueueType(item: SupportCase, type: string) {
  if (type === "all" || !type) return true;
  if (type === "customer") {
    return [
      "customer_support",
      "booking_help",
      "payment_help",
      "refund_request",
      "general_support",
    ].includes(item.caseType);
  }
  if (type === "guru") return item.caseType === "guru_support";
  if (type === "platform") return item.caseType === "platform_issue";
  if (type === "escalated") {
    return ["dispute_request", "trust_safety", "refund_request"].includes(
      item.caseType
    );
  }
  return item.caseType === type;
}

function matchesDisplayStatus(item: SupportCase, status: string) {
  if (status === "all" || !status) return true;
  if (status === "new") return item.status === "new";
  if (status === "open") return item.status === "in_review";
  if (status === "pending") return item.status === "waiting_response";
  if (status === "resolved") {
    return ["closed", "converted"].includes(item.status);
  }
  return item.status === status;
}

export function filterAndSortCases(
  cases: SupportCase[],
  filters: SupportFilters
) {
  const query = filters.q.toLowerCase();

  let filtered = cases.filter((item) => {
    if (!matchesQueueType(item, filters.type)) return false;
    if (!matchesDisplayStatus(item, filters.status)) return false;
    if (filters.priority !== "all") {
      if (filters.priority === "urgent") {
        if (!["urgent", "high"].includes(item.priority)) return false;
      } else if (
        filters.priority === "normal" ||
        filters.priority === "medium"
      ) {
        if (!["normal", "medium"].includes(item.priority)) return false;
      } else if (item.priority !== filters.priority) {
        return false;
      }
    }
    if (filters.userType !== "all" && item.userType !== filters.userType) {
      return false;
    }
    if (query) {
      const haystack = [
        item.intakeNumber,
        item.senderName,
        item.senderEmail,
        item.subject,
        item.messageBody,
        item.caseTypeLabel,
        item.assignedTo,
        item.notes,
      ]
        .join(" ")
        .toLowerCase();

      if (!haystack.includes(query)) return false;
    }

    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    switch (filters.sort) {
      case "updated_asc":
        return (
          new Date(a.updatedAt || a.createdAt).getTime() -
          new Date(b.updatedAt || b.createdAt).getTime()
        );
      case "priority_desc": {
        const rank =
          (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0);
        if (rank !== 0) return rank;
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
      }
      case "created_desc":
        return (
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case "status": {
        const rank =
          (STATUS_RANK[a.status] || 99) - (STATUS_RANK[b.status] || 99);
        if (rank !== 0) return rank;
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
      }
      case "updated_desc":
      default:
        return (
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
        );
    }
  });

  if (filters.caseId) {
    const needle = filters.caseId.toLowerCase();
    sorted.sort((a, b) => {
      const aMatch =
        a.intakeNumber.toLowerCase() === needle || a.id === filters.caseId
          ? 0
          : 1;
      const bMatch =
        b.intakeNumber.toLowerCase() === needle || b.id === filters.caseId
          ? 0
          : 1;
      return aMatch - bMatch;
    });
  }

  return sorted;
}

export function buildSupportHref(
  filters: Partial<SupportFilters> & Record<string, string | undefined>
) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (!value || value === "all") return;
    if (key === "sort" && value === "updated_desc") return;
    params.set(key === "caseId" ? "case" : key, value);
  });

  const query = params.toString();
  return query ? `/admin/support?${query}` : "/admin/support";
}
