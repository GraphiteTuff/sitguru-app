const CHECKR_API_BASE = "https://api.checkr.com/v1";

type CheckrRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: Record<string, unknown>;
};

export type CheckrCandidate = {
  id: string;
  object?: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  custom_id?: string;
};

export type CheckrInvitation = {
  id: string;
  object?: string;
  uri?: string;
  invitation_url?: string;
  status?: string;
  candidate_id?: string;
  report_id?: string;
};

export type CheckrWebhookPayload = {
  id?: string;
  object?: string;
  type?: string;
  created_at?: string;
  webhook_url?: string;
  data?: {
    object?: {
      id?: string;
      object?: string;
      status?: string | null;
      result?: string | null;
      candidate_id?: string;
      report_id?: string;
      invitation_url?: string;
      uri?: string;
      package?: string;
      includes_canceled?: boolean;
      [key: string]: unknown;
    };
  };
};

function getCheckrApiKey() {
  const apiKey = process.env.CHECKR_API_KEY;

  if (!apiKey) {
    throw new Error("Missing CHECKR_API_KEY environment variable.");
  }

  return apiKey;
}

export async function checkrRequest<T>(
  path: string,
  options: CheckrRequestOptions = {},
): Promise<T> {
  const apiKey = getCheckrApiKey();
  const auth = Buffer.from(`${apiKey}:`).toString("base64");

  const response = await fetch(`${CHECKR_API_BASE}${path}`, {
    method: options.method ?? "GET",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    cache: "no-store",
  });

  const text = await response.text();

  let data: unknown = null;

  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  if (!response.ok) {
    console.error("Checkr API error:", {
      path,
      status: response.status,
      data,
    });

    throw new Error(
      typeof data === "object" && data !== null && "error" in data
        ? String((data as { error?: unknown }).error)
        : "Checkr API request failed.",
    );
  }

  return data as T;
}

export async function createCheckrCandidate(params: {
  guruId: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
}) {
  return checkrRequest<CheckrCandidate>("/candidates", {
    method: "POST",
    body: {
      email: params.email,
      first_name: params.firstName || undefined,
      last_name: params.lastName || undefined,
      phone: params.phone || undefined,
      custom_id: params.guruId,
    },
  });
}

export async function createCheckrInvitation(params: {
  candidateId: string;
  packageSlug: string;
  city?: string | null;
  state?: string | null;
  country?: string | null;
}) {
  return checkrRequest<CheckrInvitation>("/invitations", {
    method: "POST",
    body: {
      candidate_id: params.candidateId,
      package: params.packageSlug,
      work_locations: [
        {
          country: params.country || "US",
          state: params.state || "FL",
          city: params.city || undefined,
        },
      ],
    },
  });
}

export function extractInvitationUrl(invitation: CheckrInvitation) {
  return invitation.invitation_url || invitation.uri || null;
}

export function mapCheckrWebhookToSitGuruStatus(
  payload: CheckrWebhookPayload,
):
  | "not_started"
  | "invited"
  | "pending"
  | "clear"
  | "consider"
  | "suspended"
  | "canceled"
  | "failed" {
  const type = payload.type;
  const object = payload.data?.object;
  const status = object?.status;
  const result = object?.result;

  if (type === "invitation.created") return "invited";
  if (type === "invitation.completed") return "pending";
  if (type === "invitation.expired") return "canceled";
  if (type === "invitation.deleted") return "canceled";

  if (type === "report.suspended") return "suspended";
  if (type === "report.resumed") return "pending";
  if (type === "report.canceled") return "canceled";
  if (type === "report.engaged") return "clear";
  if (type === "report.pre_adverse_action") return "consider";
  if (type === "report.post_adverse_action") return "failed";
  if (type === "report.disputed") return "consider";

  if (type === "report.completed") {
    if (result === "clear") return "clear";
    if (result === "consider") return "consider";
    if (status === "canceled") return "canceled";

    return "pending";
  }

  if (status === "suspended") return "suspended";
  if (status === "canceled") return "canceled";
  if (status === "pending") return "pending";
  if (result === "clear") return "clear";
  if (result === "consider") return "consider";

  return "pending";
}

export function extractWebhookObjectId(payload: CheckrWebhookPayload) {
  return payload.data?.object?.id ?? null;
}

export function extractWebhookCandidateId(payload: CheckrWebhookPayload) {
  return payload.data?.object?.candidate_id ?? null;
}

export function extractWebhookReportId(payload: CheckrWebhookPayload) {
  const object = payload.data?.object;

  if (!object) return null;

  if (object.object === "report") {
    return object.id ?? null;
  }

  return object.report_id ?? null;
}
