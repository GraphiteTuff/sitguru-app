import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  enqueueProfileCompletionReminders,
  sendImmediateProfileCompletionNotice,
  type SupportedRole,
} from "@/lib/completion-reminders";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AccountIntent = "pet_parent" | "guru" | "ambassador" | "both";

type ProvisionSignupBody = {
  userId?: string;
  intent?: AccountIntent;
  fullName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  serviceArea?: string;

  // Universal referral input.
  referralCode?: string;

  // Legacy compatibility until all existing signup and callback paths migrate.
  ambassadorReferralCode?: string;

  source?: string;
  referralSource?: string;
  referralPlatform?: string;
  referralMedium?: string;
  referralCampaign?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
};

type ProvisionResult = {
  ok?: boolean;
  user_id?: string;
  intent?: string;
  profile_role?: string;
  roles?: string[];
  referral_code?: string;
  workspace_ready?: boolean;
  requires_email_verification?: boolean;
};

type GenericRow = Record<string, unknown>;
type GenericPayload = Record<string, unknown>;

type ReferralOwnerType =
  | "pet_parent"
  | "guru"
  | "ambassador"
  | "partner"
  | "business"
  | "campaign"
  | "system"
  | "multi_role"
  | "unknown";

type ReferralCandidate = {
  code: string;
  sourceTable: string;
  priority: number;
  status: string;
  ownerType: ReferralOwnerType;
  ownerUserId: string;
  ownerProfileId: string;
  ownerDisplayName: string;
  ownerEmail: string;
  referralCodeId: string;
  canonicalCodeId: string;
  ambassadorId: string;
  guruId: string;
  partnerId: string;
  campaignType: string;
  raw: GenericRow;
};

type ReferralResolution =
  | {
      status: "none";
      submittedCode: "";
      owner: null;
      warning: "";
    }
  | {
      status: "invalid_format";
      submittedCode: string;
      owner: null;
      warning: string;
    }
  | {
      status: "not_found";
      submittedCode: string;
      owner: null;
      warning: string;
    }
  | {
      status: "conflict";
      submittedCode: string;
      owner: null;
      warning: string;
    }
  | {
      status: "resolved";
      submittedCode: string;
      owner: ReferralCandidate;
      warning: "";
    };

type ReferralCaptureResult = {
  submittedCode: string;
  applied: boolean;
  status:
    | "none"
    | "applied"
    | "invalid_format"
    | "not_found"
    | "conflict"
    | "self_referral"
    | "recording_warning";
  ownerType: ReferralOwnerType | null;
  source: string;
  platform: string;
  medium: string;
  campaign: string;
  warning: string;
  writes: {
    canonicalEvent: boolean;
    generalReferral: boolean;
    adminActivity: boolean;
    petParentCompatibility: boolean;
    guruCompatibility: boolean;
    ambassadorCompatibility: boolean;
  };
};

type SafeWriteResult = {
  ok: boolean;
  skipped: boolean;
  row: GenericRow | null;
  error: string;
  removedColumns: string[];
};

const SUPPORTED_INTENTS = new Set<AccountIntent>([
  "pet_parent",
  "guru",
  "ambassador",
  "both",
]);

const BLOCKED_REFERRAL_STATUSES = new Set([
  "archived",
  "inactive",
  "disabled",
  "deleted",
  "voided",
  "suspended",
  "rejected",
  "expired",
]);

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function lowerText(value: unknown) {
  return cleanText(value).toLowerCase();
}

function firstText(...values: unknown[]) {
  for (const value of values) {
    const text = cleanText(value);
    if (text) return text;
  }

  return "";
}

function normalizeReferralCode(value: unknown) {
  return cleanText(value)
    .toUpperCase()
    .replace(/[^A-Z0-9_-]/g, "")
    .slice(0, 64);
}

function isValidReferralCodeFormat(value: string) {
  return /^[A-Z0-9_-]{2,64}$/.test(value);
}

function normalizeOwnerType(value: unknown): ReferralOwnerType {
  const normalized = lowerText(value).replace(/[\s-]+/g, "_");

  if (
    normalized === "customer" ||
    normalized === "pet_owner" ||
    normalized === "petparent" ||
    normalized === "pet_parent_referral" ||
    normalized === "customer_referral"
  ) {
    return "pet_parent";
  }

  if (
    normalized === "provider" ||
    normalized === "sitter" ||
    normalized === "walker" ||
    normalized === "future_guru" ||
    normalized === "guru_referral" ||
    normalized === "guru_lead"
  ) {
    return "guru";
  }

  if (
    normalized === "ambassador_referral" ||
    normalized === "community_ambassador"
  ) {
    return "ambassador";
  }

  if (
    normalized === "affiliate" ||
    normalized === "organization" ||
    normalized === "partner_referral"
  ) {
    return "partner";
  }

  if (normalized === "community" || normalized === "local_business") {
    return "business";
  }

  if (
    normalized === "social" ||
    normalized === "marketing" ||
    normalized === "growth" ||
    normalized === "promo" ||
    normalized === "promotion"
  ) {
    return "campaign";
  }

  if (
    normalized === "pet_parent" ||
    normalized === "guru" ||
    normalized === "ambassador" ||
    normalized === "partner" ||
    normalized === "business" ||
    normalized === "campaign" ||
    normalized === "system" ||
    normalized === "multi_role"
  ) {
    return normalized as ReferralOwnerType;
  }

  return "unknown";
}

function normalizeStatus(value: unknown) {
  return lowerText(value).replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

function isActiveReferralRow(row: GenericRow) {
  const status = normalizeStatus(row.status);
  return !status || !BLOCKED_REFERRAL_STATUSES.has(status);
}

function jsonError(message: string, status = 400, details?: unknown) {
  console.error("SIGNUP PROVISION ERROR:", {
    message,
    status,
    details,
  });

  return NextResponse.json(
    {
      ok: false,
      error: message,
    },
    { status },
  );
}

function getBearerToken(request: NextRequest) {
  const authorization = request.headers.get("authorization") || "";

  if (!authorization.toLowerCase().startsWith("bearer ")) {
    return "";
  }

  return authorization.slice(7).trim();
}

function isRecentAuthUser(createdAt?: string | null) {
  if (!createdAt) return false;

  const created = new Date(createdAt).getTime();
  if (!Number.isFinite(created)) return false;

  return Date.now() - created <= 20 * 60 * 1000;
}

function normalizeMetadataIntent(value: unknown): AccountIntent | "" {
  const normalized = cleanText(value)
    .toLowerCase()
    .replace(/[\s-]+/g, "_");

  if (normalized === "customer" || normalized === "petparent") {
    return "pet_parent";
  }

  if (normalized === "future_guru" || normalized === "pet_guru") {
    return "guru";
  }

  if (normalized === "partner") {
    return "ambassador";
  }

  if (SUPPORTED_INTENTS.has(normalized as AccountIntent)) {
    return normalized as AccountIntent;
  }

  return "";
}

function reminderRoleForIntent(intent: AccountIntent): SupportedRole {
  if (intent === "pet_parent") return "pet_parent";
  if (intent === "ambassador") return "ambassador";
  return "guru";
}

function getReferredRole(intent: AccountIntent) {
  if (intent === "pet_parent") return "pet_parent";
  if (intent === "guru") return "guru";
  if (intent === "ambassador") return "ambassador";
  return "both";
}

function getReferralType({
  ownerType,
  intent,
}: {
  ownerType: ReferralOwnerType;
  intent: AccountIntent;
}) {
  return `${ownerType}_to_${getReferredRole(intent)}`;
}

function getMissingColumnFromError(message?: string) {
  if (!message) return "";

  const patterns = [
    /Could not find the '([^']+)' column/i,
    /column ["']?([a-zA-Z0-9_]+)["']? does not exist/i,
    /record ["']?[^"']+["']? has no field ["']?([a-zA-Z0-9_]+)["']?/i,
  ];

  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
}

function isMissingTableError(error: { code?: string; message?: string } | null) {
  if (!error) return false;

  const code = cleanText(error.code).toUpperCase();
  const message = lowerText(error.message);

  return (
    code === "42P01" ||
    code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("could not find the table") ||
    message.includes("schema cache")
  );
}

function cleanPayload(payload: GenericPayload) {
  return Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined),
  );
}

async function safeInsert({
  table,
  payload,
  requiredColumns = [],
}: {
  table: string;
  payload: GenericPayload;
  requiredColumns?: string[];
}): Promise<SafeWriteResult> {
  const workingPayload = cleanPayload(payload);
  const removedColumns: string[] = [];

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from(table)
      .insert(workingPayload)
      .select("*")
      .limit(1)
      .maybeSingle();

    if (!error) {
      return {
        ok: true,
        skipped: false,
        row: (data || null) as GenericRow | null,
        error: "",
        removedColumns,
      };
    }

    if (isMissingTableError(error)) {
      return {
        ok: false,
        skipped: true,
        row: null,
        error: error.message,
        removedColumns,
      };
    }

    const missingColumn = getMissingColumnFromError(error.message);

    if (
      missingColumn &&
      Object.prototype.hasOwnProperty.call(workingPayload, missingColumn) &&
      !requiredColumns.includes(missingColumn)
    ) {
      delete workingPayload[missingColumn];
      removedColumns.push(missingColumn);
      continue;
    }

    return {
      ok: false,
      skipped: false,
      row: null,
      error: error.message,
      removedColumns,
    };
  }

  return {
    ok: false,
    skipped: false,
    row: null,
    error: `Unable to insert ${table} after removing optional missing columns.`,
    removedColumns,
  };
}

async function safeSelectFirst({
  table,
  column,
  value,
  caseInsensitive = false,
}: {
  table: string;
  column: string;
  value: string;
  caseInsensitive?: boolean;
}) {
  try {
    let query = supabaseAdmin.from(table).select("*");

    query = caseInsensitive
      ? query.ilike(column, value)
      : query.eq(column, value);

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) {
      if (!isMissingTableError(error)) {
        console.warn(
          `Referral lookup failed for ${table}.${column}:`,
          error.message,
        );
      }

      return null;
    }

    return (data || null) as GenericRow | null;
  } catch (error) {
    console.warn(`Referral lookup threw for ${table}.${column}:`, error);
    return null;
  }
}

async function safeExistingRow({
  table,
  filters,
}: {
  table: string;
  filters: Array<[string, string]>;
}) {
  try {
    let query = supabaseAdmin.from(table).select("*");

    for (const [column, value] of filters) {
      query = query.eq(column, value);
    }

    const { data, error } = await query.limit(1).maybeSingle();

    if (error) return null;
    return (data || null) as GenericRow | null;
  } catch {
    return null;
  }
}

async function getProfileForUser(userId: string) {
  const attempts = ["user_id", "id"];

  for (const column of attempts) {
    const row = await safeSelectFirst({
      table: "profiles",
      column,
      value: userId,
    });

    if (row) return row;
  }

  return null;
}

async function getAmbassadorById(ambassadorId: string) {
  if (!ambassadorId) return null;

  return safeSelectFirst({
    table: "ambassadors",
    column: "id",
    value: ambassadorId,
  });
}

async function getGuruById(guruId: string) {
  if (!guruId) return null;

  return safeSelectFirst({
    table: "gurus",
    column: "id",
    value: guruId,
  });
}

function referralCandidateFromCanonical(row: GenericRow): ReferralCandidate {
  return {
    code: normalizeReferralCode(
      firstText(row.code, row.referral_code, row.normalized_code),
    ),
    sourceTable: "pawperks_account_referral_codes",
    priority: 1,
    status: cleanText(row.status),
    ownerType: normalizeOwnerType(
      firstText(row.primary_role, row.owner_type, row.program_context),
    ),
    ownerUserId: firstText(row.user_id, row.owner_user_id),
    ownerProfileId: firstText(row.profile_id, row.owner_profile_id),
    ownerDisplayName: firstText(row.owner_display_name, row.display_name),
    ownerEmail: lowerText(firstText(row.owner_email, row.email)),
    referralCodeId: firstText(row.legacy_referral_code_id),
    canonicalCodeId: firstText(row.id),
    ambassadorId: firstText(row.ambassador_id),
    guruId: firstText(row.guru_id),
    partnerId: firstText(row.partner_id),
    campaignType: firstText(
      row.program_context,
      row.campaign_type,
      row.program_type,
    ),
    raw: row,
  };
}

function referralCandidateFromReferralProfile(
  row: GenericRow,
): ReferralCandidate {
  return {
    code: normalizeReferralCode(
      firstText(row.referral_code, row.code, row.slug),
    ),
    sourceTable: "referral_profiles",
    priority: 2,
    status: cleanText(row.status),
    ownerType: normalizeOwnerType(firstText(row.role, row.owner_type)),
    ownerUserId: firstText(row.user_id, row.owner_user_id),
    ownerProfileId: firstText(row.profile_id, row.id),
    ownerDisplayName: firstText(row.full_name, row.display_name, row.name),
    ownerEmail: lowerText(firstText(row.email)),
    referralCodeId: firstText(row.legacy_referral_code_id),
    canonicalCodeId: firstText(row.canonical_code_id),
    ambassadorId: firstText(row.ambassador_id),
    guruId: firstText(row.guru_id),
    partnerId: firstText(row.partner_id),
    campaignType: firstText(row.program_type),
    raw: row,
  };
}

async function referralCandidateFromReferralCode(
  row: GenericRow,
): Promise<ReferralCandidate> {
  const ambassadorId = firstText(row.ambassador_id);
  const guruId = firstText(row.guru_id);
  const ambassador = ambassadorId
    ? await getAmbassadorById(ambassadorId)
    : null;
  const guru = guruId ? await getGuruById(guruId) : null;

  return {
    code: normalizeReferralCode(
      firstText(
        row.normalized_code,
        row.code,
        row.referral_code,
        row.slug,
      ),
    ),
    sourceTable: "referral_codes",
    priority: 3,
    status: cleanText(row.status),
    ownerType: normalizeOwnerType(
      firstText(
        row.owner_type,
        row.program_type,
        row.campaign_type,
        ambassadorId ? "ambassador" : "",
        guruId ? "guru" : "",
        row.partner_id ? "partner" : "",
      ),
    ),
    ownerUserId: firstText(
      row.owner_user_id,
      row.issued_to_user_id,
      row.user_id,
      ambassador?.user_id,
      guru?.user_id,
    ),
    ownerProfileId: firstText(
      row.profile_id,
      row.owner_profile_id,
      ambassador?.profile_id,
      guru?.profile_id,
    ),
    ownerDisplayName: firstText(
      row.owner_display_name,
      row.display_name,
      ambassador?.display_name,
      ambassador?.full_name,
      guru?.display_name,
      guru?.full_name,
    ),
    ownerEmail: lowerText(
      firstText(
        row.owner_email,
        row.email,
        ambassador?.email,
        ambassador?.contact_email,
        guru?.email,
      ),
    ),
    referralCodeId: firstText(row.id),
    canonicalCodeId: firstText(row.canonical_code_id),
    ambassadorId,
    guruId,
    partnerId: firstText(row.partner_id),
    campaignType: firstText(
      row.program_type,
      row.campaign_type,
      row.program_context,
    ),
    raw: row,
  };
}

function referralCandidateFromAmbassador(
  row: GenericRow,
): ReferralCandidate {
  return {
    code: normalizeReferralCode(
      firstText(row.referral_code, row.ambassador_code, row.code),
    ),
    sourceTable: "ambassadors",
    priority: 4,
    status: cleanText(row.status),
    ownerType: "ambassador",
    ownerUserId: firstText(row.user_id, row.owner_user_id),
    ownerProfileId: firstText(row.profile_id),
    ownerDisplayName: firstText(
      row.display_name,
      row.full_name,
      row.name,
    ),
    ownerEmail: lowerText(
      firstText(row.email, row.contact_email, row.login_email),
    ),
    referralCodeId: firstText(row.referral_code_id),
    canonicalCodeId: firstText(row.canonical_code_id),
    ambassadorId: firstText(row.id),
    guruId: "",
    partnerId: "",
    campaignType: "ambassador_referral",
    raw: row,
  };
}

async function referralCandidateFromGuruCampaign(
  row: GenericRow,
): Promise<ReferralCandidate> {
  const guruId = firstText(row.guru_id);
  const guru = guruId ? await getGuruById(guruId) : null;

  return {
    code: normalizeReferralCode(
      firstText(row.referral_code, row.code, row.slug),
    ),
    sourceTable: "guru_referral_campaigns",
    priority: 5,
    status: cleanText(row.status),
    ownerType: "guru",
    ownerUserId: firstText(
      row.guru_user_id,
      row.user_id,
      row.owner_user_id,
      guru?.user_id,
    ),
    ownerProfileId: firstText(
      row.profile_id,
      row.owner_profile_id,
      guru?.profile_id,
    ),
    ownerDisplayName: firstText(
      row.owner_display_name,
      row.guru_name,
      guru?.display_name,
      guru?.full_name,
    ),
    ownerEmail: lowerText(
      firstText(row.guru_email, row.email, guru?.email),
    ),
    referralCodeId: firstText(row.referral_code_id),
    canonicalCodeId: firstText(row.canonical_code_id),
    ambassadorId: "",
    guruId,
    partnerId: "",
    campaignType: firstText(row.campaign_type, row.name, "guru_referral"),
    raw: row,
  };
}

async function findCanonicalByAlias(code: string) {
  const alias = await safeSelectFirst({
    table: "pawperks_referral_code_aliases",
    column: "normalized_alias_code",
    value: code,
  });

  if (!alias || !isActiveReferralRow(alias)) return null;

  const canonicalCodeId = firstText(alias.canonical_code_id);
  if (!canonicalCodeId) return null;

  const canonical = await safeSelectFirst({
    table: "pawperks_account_referral_codes",
    column: "id",
    value: canonicalCodeId,
  });

  return canonical && isActiveReferralRow(canonical) ? canonical : null;
}

function candidateOwnerKey(candidate: ReferralCandidate) {
  if (candidate.ownerUserId) return `user:${candidate.ownerUserId}`;
  if (candidate.ownerProfileId) return `profile:${candidate.ownerProfileId}`;
  if (candidate.ambassadorId) return `ambassador:${candidate.ambassadorId}`;
  if (candidate.guruId) return `guru:${candidate.guruId}`;
  if (candidate.partnerId) return `partner:${candidate.partnerId}`;
  if (candidate.canonicalCodeId) {
    return `canonical:${candidate.canonicalCodeId}`;
  }
  if (candidate.referralCodeId) {
    return `referral-code:${candidate.referralCodeId}`;
  }

  return "";
}

async function resolveReferralCode(
  submittedValue: unknown,
): Promise<ReferralResolution> {
  const submittedCode = normalizeReferralCode(submittedValue);

  if (!submittedCode) {
    return {
      status: "none",
      submittedCode: "",
      owner: null,
      warning: "",
    };
  }

  if (!isValidReferralCodeFormat(submittedCode)) {
    return {
      status: "invalid_format",
      submittedCode,
      owner: null,
      warning:
        "The referral code format was not valid, so the account was created without referral attribution.",
    };
  }

  const candidates: ReferralCandidate[] = [];

  const canonical =
    (await safeSelectFirst({
      table: "pawperks_account_referral_codes",
      column: "normalized_code",
      value: submittedCode,
    })) || (await findCanonicalByAlias(submittedCode));

  if (canonical && isActiveReferralRow(canonical)) {
    candidates.push(referralCandidateFromCanonical(canonical));
  }

  const referralProfile = await safeSelectFirst({
    table: "referral_profiles",
    column: "referral_code",
    value: submittedCode,
    caseInsensitive: true,
  });

  if (referralProfile && isActiveReferralRow(referralProfile)) {
    candidates.push(
      referralCandidateFromReferralProfile(referralProfile),
    );
  }

  const referralCodeRow =
    (await safeSelectFirst({
      table: "referral_codes",
      column: "normalized_code",
      value: submittedCode,
    })) ||
    (await safeSelectFirst({
      table: "referral_codes",
      column: "code",
      value: submittedCode,
      caseInsensitive: true,
    })) ||
    (await safeSelectFirst({
      table: "referral_codes",
      column: "slug",
      value: submittedCode,
      caseInsensitive: true,
    }));

  if (referralCodeRow && isActiveReferralRow(referralCodeRow)) {
    candidates.push(
      await referralCandidateFromReferralCode(referralCodeRow),
    );
  }

  const ambassador = await safeSelectFirst({
    table: "ambassadors",
    column: "referral_code",
    value: submittedCode,
    caseInsensitive: true,
  });

  if (ambassador && isActiveReferralRow(ambassador)) {
    candidates.push(referralCandidateFromAmbassador(ambassador));
  }

  const guruCampaign =
    (await safeSelectFirst({
      table: "guru_referral_campaigns",
      column: "referral_code",
      value: submittedCode,
      caseInsensitive: true,
    })) ||
    (await safeSelectFirst({
      table: "guru_referral_campaigns",
      column: "code",
      value: submittedCode,
      caseInsensitive: true,
    })) ||
    (await safeSelectFirst({
      table: "guru_referral_campaigns",
      column: "slug",
      value: submittedCode,
      caseInsensitive: true,
    }));

  if (guruCampaign && isActiveReferralRow(guruCampaign)) {
    candidates.push(
      await referralCandidateFromGuruCampaign(guruCampaign),
    );
  }

  const usableCandidates = candidates.filter(
    (candidate) => candidate.code === submittedCode,
  );

  if (usableCandidates.length === 0) {
    return {
      status: "not_found",
      submittedCode,
      owner: null,
      warning:
        "The referral code could not be verified. The SitGuru account was still created without applying a referral.",
    };
  }

  const ownerKeys = new Set(
    usableCandidates.map(candidateOwnerKey).filter(Boolean),
  );

  if (ownerKeys.size > 1) {
    console.error("Referral code ownership conflict:", {
      submittedCode,
      candidates: usableCandidates.map((candidate) => ({
        sourceTable: candidate.sourceTable,
        ownerType: candidate.ownerType,
        ownerKey: candidateOwnerKey(candidate),
      })),
    });

    return {
      status: "conflict",
      submittedCode,
      owner: null,
      warning:
        "This referral code needs SitGuru review because more than one account currently claims it. The signup was completed without assigning the referral.",
    };
  }

  const owner = [...usableCandidates].sort(
    (left, right) => left.priority - right.priority,
  )[0];

  return {
    status: "resolved",
    submittedCode,
    owner,
    warning: "",
  };
}

function getTrackingValues(
  body: ProvisionSignupBody,
  metadata: GenericRow,
) {
  const source = firstText(
    body.referralSource,
    body.source,
    metadata.referral_source,
    metadata.signup_source,
    "sitguru_signup_api",
  );

  const platform = firstText(
    body.referralPlatform,
    metadata.referral_platform,
    metadata.platform,
  );

  const medium = firstText(
    body.referralMedium,
    metadata.referral_medium,
    body.utmMedium,
    metadata.utm_medium,
    "manual_or_link",
  );

  const campaign = firstText(
    body.referralCampaign,
    metadata.referral_campaign,
    body.utmCampaign,
    metadata.utm_campaign,
  );

  return {
    source,
    platform,
    medium,
    campaign,
    utmSource: firstText(body.utmSource, metadata.utm_source),
    utmMedium: firstText(
      body.utmMedium,
      metadata.utm_medium,
      medium,
    ),
    utmCampaign: firstText(
      body.utmCampaign,
      metadata.utm_campaign,
      campaign,
    ),
    utmContent: firstText(body.utmContent, metadata.utm_content),
  };
}

async function callProvisioningRpc(
  body: Required<Pick<ProvisionSignupBody, "userId" | "intent">> &
    ProvisionSignupBody,
  resolvedAmbassadorReferralCode: string,
) {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const { data, error } = await supabaseAdmin.rpc(
      "provision_sitguru_account",
      {
        p_user_id: body.userId,
        p_intent: body.intent,
        p_full_name: cleanText(body.fullName) || null,
        p_email: cleanText(body.email).toLowerCase() || null,
        p_phone: cleanText(body.phone) || null,
        p_zip_code: cleanText(body.zipCode) || null,
        p_service_area: cleanText(body.serviceArea) || null,
        // The existing RPC parameter remains Ambassador-specific. Only pass a
        // code here when the universal resolver confirms an Ambassador owner.
        p_ambassador_referral_code:
          resolvedAmbassadorReferralCode || null,
        p_source: cleanText(body.source) || "sitguru_signup_api",
      },
    );

    if (!error) {
      return data as ProvisionResult;
    }

    lastError = error;

    if (attempt < 2) {
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  throw lastError;
}

async function updateReferralMetadata({
  userId,
  existingMetadata,
  resolution,
  capture,
}: {
  userId: string;
  existingMetadata: GenericRow;
  resolution: ReferralResolution;
  capture: ReferralCaptureResult;
}) {
  try {
    const metadata = {
      ...existingMetadata,
      referral_code: capture.submittedCode || null,
      ambassador_referral_code:
        resolution.status === "resolved" &&
        resolution.owner.ownerType === "ambassador"
          ? capture.submittedCode
          : null,
      referral_attribution_status: capture.status,
      referred_by_user_id:
        resolution.status === "resolved"
          ? resolution.owner.ownerUserId || null
          : null,
      referred_by_profile_id:
        resolution.status === "resolved"
          ? resolution.owner.ownerProfileId || null
          : null,
      referred_by_owner_type: capture.ownerType,
      referral_source: capture.source || null,
      referral_platform: capture.platform || null,
      referral_medium: capture.medium || null,
      referral_campaign: capture.campaign || null,
      referral_attribution_updated_at: new Date().toISOString(),
    };

    const { error } =
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: metadata,
      });

    if (error) {
      console.warn(
        "Signup completed but referral Auth metadata could not be updated:",
        error.message,
      );
    }
  } catch (error) {
    console.warn(
      "Signup completed but referral Auth metadata update threw:",
      error,
    );
  }
}

async function writeCanonicalReferralEvent({
  owner,
  userId,
  referredProfileId,
  referredEmail,
  referredName,
  intent,
  tracking,
}: {
  owner: ReferralCandidate;
  userId: string;
  referredProfileId: string;
  referredEmail: string;
  referredName: string;
  intent: AccountIntent;
  tracking: ReturnType<typeof getTrackingValues>;
}) {
  if (!owner.canonicalCodeId) return false;

  const existing = await safeExistingRow({
    table: "pawperks_referral_events",
    filters: [
      ["canonical_code_id", owner.canonicalCodeId],
      ["referred_user_id", userId],
      ["event_type", "signup_capture"],
    ],
  });

  if (existing) return true;

  const result = await safeInsert({
    table: "pawperks_referral_events",
    payload: {
      canonical_code_id: owner.canonicalCodeId,
      submitted_code: owner.code,
      referrer_profile_id: owner.ownerProfileId || null,
      referrer_user_id: owner.ownerUserId || null,
      referrer_role: owner.ownerType,
      referred_profile_id: referredProfileId || null,
      referred_user_id: userId,
      referred_email: referredEmail || null,
      referred_name: referredName || null,
      referred_role_at_signup: getReferredRole(intent),
      event_type: "signup_capture",
      program_context:
        owner.campaignType ||
        `${owner.ownerType}_referral`,
      capture_point: "provision_signup_api",
      source: tracking.source,
      platform: tracking.platform || null,
      medium: tracking.medium || null,
      campaign: tracking.campaign || null,
      utm_source: tracking.utmSource || null,
      utm_medium: tracking.utmMedium || null,
      utm_campaign: tracking.utmCampaign || null,
      utm_content: tracking.utmContent || null,
      conversion_stage: "signup",
      conversion_status: "pending",
      source_table: owner.sourceTable,
      metadata: {
        referral_code_id: owner.referralCodeId || null,
        ambassador_id: owner.ambassadorId || null,
        guru_id: owner.guruId || null,
        partner_id: owner.partnerId || null,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    requiredColumns: [
      "canonical_code_id",
      "referred_user_id",
      "event_type",
    ],
  });

  if (!result.ok && !result.skipped) {
    console.warn(
      "Canonical referral event insert failed:",
      result.error,
    );
  }

  return result.ok;
}

async function writeGeneralReferral({
  owner,
  userId,
  referredProfileId,
  referredEmail,
  intent,
  tracking,
}: {
  owner: ReferralCandidate;
  userId: string;
  referredProfileId: string;
  referredEmail: string;
  intent: AccountIntent;
  tracking: ReturnType<typeof getTrackingValues>;
}) {
  const existing = await safeExistingRow({
    table: "referrals",
    filters: [
      ["referred_user_id", userId],
      ["referral_code", owner.code],
    ],
  });

  if (existing) return true;

  const result = await safeInsert({
    table: "referrals",
    payload: {
      referrer_profile_id: owner.ownerProfileId || null,
      referred_profile_id: referredProfileId || null,
      referrer_user_id: owner.ownerUserId || null,
      referred_user_id: userId,
      referred_email: referredEmail || null,
      referral_code: owner.code,
      referral_code_id: owner.referralCodeId || null,
      referral_type: getReferralType({
        ownerType: owner.ownerType,
        intent,
      }),
      referred_role: getReferredRole(intent),
      status: "pending",
      reward_amount: 0,
      reward_type: "tracking",
      source: tracking.source,
      platform: tracking.platform || null,
      medium: tracking.medium || null,
      campaign: tracking.campaign || null,
      utm_source: tracking.utmSource || null,
      utm_medium: tracking.utmMedium || null,
      utm_campaign: tracking.utmCampaign || null,
      utm_content: tracking.utmContent || null,
      notes: JSON.stringify({
        source: tracking.source,
        platform: tracking.platform,
        medium: tracking.medium,
        campaign: tracking.campaign,
        utmSource: tracking.utmSource,
        utmMedium: tracking.utmMedium,
        utmCampaign: tracking.utmCampaign,
        utmContent: tracking.utmContent,
        ownerType: owner.ownerType,
        sourceTable: owner.sourceTable,
        canonicalCodeId: owner.canonicalCodeId || null,
        referralCodeId: owner.referralCodeId || null,
        capturePoint: "provision_signup_api",
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    requiredColumns: ["referred_user_id", "referral_code"],
  });

  if (!result.ok && !result.skipped) {
    console.warn("General referral insert failed:", result.error);
  }

  return result.ok;
}

async function writeAdminReferralActivity({
  owner,
  userId,
  referredEmail,
  intent,
  tracking,
}: {
  owner: ReferralCandidate;
  userId: string;
  referredEmail: string;
  intent: AccountIntent;
  tracking: ReturnType<typeof getTrackingValues>;
}) {
  const existing =
    (await safeExistingRow({
      table: "referral_activity",
      filters: [
        ["referral_code", owner.code],
        ["referred_user_id", userId],
      ],
    })) ||
    (owner.referralCodeId
      ? await safeExistingRow({
          table: "referral_activity",
          filters: [
            ["referral_code_id", owner.referralCodeId],
            ["referred_user_id", userId],
          ],
        })
      : null);

  if (existing) return true;

  const result = await safeInsert({
    table: "referral_activity",
    payload: {
      referral_code_id: owner.referralCodeId || null,
      referral_code: owner.code,
      code: owner.code,
      referrer_user_id: owner.ownerUserId || null,
      referred_user_id: userId,
      referred_email: referredEmail || null,
      referred_role: getReferredRole(intent),
      owner_type: owner.ownerType,
      program_type:
        owner.campaignType || `${owner.ownerType}_referral`,
      activity_type: "signup_capture",
      activity: "signup_capture",
      conversion_stage: "signup",
      conversion_status: "pending",
      status: "pending",
      source: tracking.source,
      platform: tracking.platform || null,
      medium: tracking.medium || null,
      campaign: tracking.campaign || null,
      signup_path: "/signup",
      notes: JSON.stringify({
        sourceTable: owner.sourceTable,
        canonicalCodeId: owner.canonicalCodeId || null,
        utmSource: tracking.utmSource,
        utmMedium: tracking.utmMedium,
        utmCampaign: tracking.utmCampaign,
        utmContent: tracking.utmContent,
        capturePoint: "provision_signup_api",
      }),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    requiredColumns: [],
  });

  if (!result.ok && !result.skipped) {
    console.warn(
      "Admin referral activity insert failed:",
      result.error,
    );
  }

  return result.ok;
}

async function writePetParentCompatibility({
  owner,
  userId,
  referredEmail,
  referredName,
  intent,
  tracking,
}: {
  owner: ReferralCandidate;
  userId: string;
  referredEmail: string;
  referredName: string;
  intent: AccountIntent;
  tracking: ReturnType<typeof getTrackingValues>;
}) {
  const existing = await safeExistingRow({
    table: "petperks_referrals",
    filters: [
      ["referred_user_id", userId],
      ["referral_code", owner.code],
    ],
  });

  if (existing) return true;

  const result = await safeInsert({
    table: "petperks_referrals",
    payload: {
      referral_code: owner.code,
      referral_code_id: owner.referralCodeId || null,
      referrer_user_id: owner.ownerUserId || null,
      referred_user_id: userId,
      referred_email: referredEmail || null,
      referred_name: referredName || null,
      referral_type: getReferralType({
        ownerType: owner.ownerType,
        intent,
      }),
      referred_role: getReferredRole(intent),
      referral_status: "pending",
      status: "pending",
      source: tracking.source,
      platform: tracking.platform || null,
      medium: tracking.medium || null,
      campaign: tracking.campaign || null,
      utm_source: tracking.utmSource || null,
      utm_medium: tracking.utmMedium || null,
      utm_campaign: tracking.utmCampaign || null,
      utm_content: tracking.utmContent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    requiredColumns: [],
  });

  if (!result.ok && !result.skipped) {
    console.warn(
      "Pet Parent referral compatibility insert failed:",
      result.error,
    );
  }

  return result.ok;
}

async function writeGuruCompatibility({
  owner,
  userId,
  referredEmail,
  referredName,
  intent,
  tracking,
}: {
  owner: ReferralCandidate;
  userId: string;
  referredEmail: string;
  referredName: string;
  intent: AccountIntent;
  tracking: ReturnType<typeof getTrackingValues>;
}) {
  if (owner.ownerType !== "guru") return false;

  const existing = await safeExistingRow({
    table: "guru_referrals",
    filters: [
      ["referred_user_id", userId],
      ["referral_code", owner.code],
    ],
  });

  if (existing) return true;

  const result = await safeInsert({
    table: "guru_referrals",
    payload: {
      guru_id: owner.guruId || null,
      referrer_id: owner.guruId || owner.ownerUserId || null,
      referrer_user_id: owner.ownerUserId || null,
      referred_user_id: userId,
      referred_email: referredEmail || null,
      referred_name: referredName || null,
      referral_code: owner.code,
      referral_code_id: owner.referralCodeId || null,
      referral_type: getReferralType({
        ownerType: owner.ownerType,
        intent,
      }),
      referred_role: getReferredRole(intent),
      status: "pending",
      source: tracking.source,
      platform: tracking.platform || null,
      medium: tracking.medium || null,
      campaign: tracking.campaign || null,
      utm_source: tracking.utmSource || null,
      utm_medium: tracking.utmMedium || null,
      utm_campaign: tracking.utmCampaign || null,
      utm_content: tracking.utmContent || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    requiredColumns: [],
  });

  if (!result.ok && !result.skipped) {
    console.warn("Guru referral compatibility insert failed:", result.error);
  }

  return result.ok;
}

async function writeAmbassadorCompatibility({
  owner,
  userId,
  referredEmail,
  referredName,
  intent,
  tracking,
}: {
  owner: ReferralCandidate;
  userId: string;
  referredEmail: string;
  referredName: string;
  intent: AccountIntent;
  tracking: ReturnType<typeof getTrackingValues>;
}) {
  if (owner.ownerType !== "ambassador" || !owner.ambassadorId) {
    return false;
  }

  const existing = await safeExistingRow({
    table: "ambassador_referrals",
    filters: [
      ["ambassador_id", owner.ambassadorId],
      ["referred_user_id", userId],
    ],
  });

  if (existing) return true;

  const result = await safeInsert({
    table: "ambassador_referrals",
    payload: {
      ambassador_id: owner.ambassadorId,
      referral_code: owner.code,
      referral_type: getReferredRole(intent),
      referred_user_id: userId,
      display_name: referredName || null,
      email: referredEmail || null,
      status: "signed_up",
      signup_date: new Date().toISOString(),
      source: tracking.source,
      medium: tracking.medium || null,
      campaign: tracking.campaign || null,
      platform: tracking.platform || null,
      referral_source: tracking.source,
      referral_medium: tracking.medium || null,
      referral_campaign: tracking.campaign || null,
      utm_source: tracking.utmSource || null,
      utm_medium: tracking.utmMedium || null,
      utm_campaign: tracking.utmCampaign || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    requiredColumns: ["ambassador_id", "referred_user_id"],
  });

  if (!result.ok && !result.skipped) {
    console.warn(
      "Ambassador referral compatibility insert failed:",
      result.error,
    );
  }

  return result.ok;
}

async function recordReferralAttribution({
  resolution,
  body,
  metadata,
  userId,
  referredEmail,
  referredName,
  intent,
}: {
  resolution: ReferralResolution;
  body: ProvisionSignupBody;
  metadata: GenericRow;
  userId: string;
  referredEmail: string;
  referredName: string;
  intent: AccountIntent;
}): Promise<ReferralCaptureResult> {
  const tracking = getTrackingValues(body, metadata);
  const emptyWrites = {
    canonicalEvent: false,
    generalReferral: false,
    adminActivity: false,
    petParentCompatibility: false,
    guruCompatibility: false,
    ambassadorCompatibility: false,
  };

  if (resolution.status === "none") {
    return {
      submittedCode: "",
      applied: false,
      status: "none",
      ownerType: null,
      source: tracking.source,
      platform: tracking.platform,
      medium: tracking.medium,
      campaign: tracking.campaign,
      warning: "",
      writes: emptyWrites,
    };
  }

  if (resolution.status !== "resolved") {
    return {
      submittedCode: resolution.submittedCode,
      applied: false,
      status: resolution.status,
      ownerType: null,
      source: tracking.source,
      platform: tracking.platform,
      medium: tracking.medium,
      campaign: tracking.campaign,
      warning: resolution.warning,
      writes: emptyWrites,
    };
  }

  const owner = resolution.owner;

  if (owner.ownerUserId && owner.ownerUserId === userId) {
    return {
      submittedCode: resolution.submittedCode,
      applied: false,
      status: "self_referral",
      ownerType: owner.ownerType,
      source: tracking.source,
      platform: tracking.platform,
      medium: tracking.medium,
      campaign: tracking.campaign,
      warning:
        "SitGuru does not allow self-referrals. The account was created without applying this referral code.",
      writes: emptyWrites,
    };
  }

  const referredProfile = await getProfileForUser(userId);
  const referredProfileId = firstText(referredProfile?.id);

  const [
    canonicalEvent,
    generalReferral,
    adminActivity,
    petParentCompatibility,
    guruCompatibility,
    ambassadorCompatibility,
  ] = await Promise.all([
    writeCanonicalReferralEvent({
      owner,
      userId,
      referredProfileId,
      referredEmail,
      referredName,
      intent,
      tracking,
    }),
    writeGeneralReferral({
      owner,
      userId,
      referredProfileId,
      referredEmail,
      intent,
      tracking,
    }),
    writeAdminReferralActivity({
      owner,
      userId,
      referredEmail,
      intent,
      tracking,
    }),
    writePetParentCompatibility({
      owner,
      userId,
      referredEmail,
      referredName,
      intent,
      tracking,
    }),
    writeGuruCompatibility({
      owner,
      userId,
      referredEmail,
      referredName,
      intent,
      tracking,
    }),
    writeAmbassadorCompatibility({
      owner,
      userId,
      referredEmail,
      referredName,
      intent,
      tracking,
    }),
  ]);

  const writes = {
    canonicalEvent,
    generalReferral,
    adminActivity,
    petParentCompatibility,
    guruCompatibility,
    ambassadorCompatibility,
  };

  const durableWriteCompleted =
    canonicalEvent ||
    generalReferral ||
    adminActivity ||
    petParentCompatibility ||
    guruCompatibility ||
    ambassadorCompatibility;

  return {
    submittedCode: resolution.submittedCode,
    applied: durableWriteCompleted,
    status: durableWriteCompleted ? "applied" : "recording_warning",
    ownerType: owner.ownerType,
    source: tracking.source,
    platform: tracking.platform,
    medium: tracking.medium,
    campaign: tracking.campaign,
    warning: durableWriteCompleted
      ? ""
      : "The referral code was verified, but SitGuru could not finish recording the referral. The account is ready and Admin can review the signup metadata.",
    writes,
  };
}

async function queueAndSendSignupNotice({
  userId,
  intent,
}: {
  userId: string;
  intent: AccountIntent;
}) {
  const role = reminderRoleForIntent(intent);

  try {
    const immediate = await sendImmediateProfileCompletionNotice({
      userId,
      role,
    });

    return {
      queued: true,
      immediateAttempted: true,
      immediate,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Profile-completion reminders could not be started.";

    console.warn(
      "Signup completed but immediate reminder delivery failed:",
      error,
    );

    try {
      await enqueueProfileCompletionReminders({
        userId,
        role,
        anchor: new Date(),
        source: "signup_provisioning_retry_queue",
      });

      return {
        queued: true,
        immediateAttempted: false,
        immediate: null,
        error: message,
      };
    } catch (queueError) {
      console.error("Signup reminder queue failed:", queueError);

      return {
        queued: false,
        immediateAttempted: false,
        immediate: null,
        error:
          queueError instanceof Error
            ? queueError.message
            : "Profile-completion reminder queue failed.",
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProvisionSignupBody;
    const userId = cleanText(body.userId);
    const requestedIntent = body.intent;

    if (
      !userId ||
      !requestedIntent ||
      !SUPPORTED_INTENTS.has(requestedIntent)
    ) {
      return jsonError(
        "Required SitGuru signup information is missing or invalid.",
        400,
      );
    }

    const bearerToken = getBearerToken(request);
    let verifiedUserId = "";

    if (bearerToken) {
      const { data, error } =
        await supabaseAdmin.auth.getUser(bearerToken);

      if (error || !data.user) {
        return jsonError(
          "The SitGuru signup session could not be verified.",
          401,
          error,
        );
      }

      verifiedUserId = data.user.id;
    }

    const { data: authResult, error: authError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError || !authResult.user) {
      return jsonError(
        "SitGuru could not verify the newly created account.",
        401,
        authError,
      );
    }

    const authUser = authResult.user;
    const authEmail = cleanText(authUser.email).toLowerCase();
    const submittedEmail = cleanText(body.email).toLowerCase();
    const metadata = (authUser.user_metadata || {}) as GenericRow;
    const metadataIntent = normalizeMetadataIntent(
      metadata.account_intent ||
        metadata.signup_intent ||
        metadata.signup_role ||
        metadata.role,
    );

    if (verifiedUserId) {
      if (verifiedUserId !== userId) {
        return jsonError(
          "The signup session did not match this SitGuru account.",
          403,
        );
      }
    } else {
      // Email confirmation can leave the browser without a session. Allow only
      // a recent account whose Auth email and signup metadata match.
      if (!isRecentAuthUser(authUser.created_at)) {
        return jsonError(
          "This signup verification window has expired. Please sign in and try again.",
          401,
        );
      }

      if (!submittedEmail || !authEmail || submittedEmail !== authEmail) {
        return jsonError(
          "The signup email did not match the SitGuru Auth account.",
          403,
        );
      }

      if (metadataIntent && metadataIntent !== requestedIntent) {
        return jsonError(
          "The requested workspace did not match the signup selection.",
          403,
        );
      }
    }

    const submittedReferralCode = firstText(
      body.referralCode,
      body.ambassadorReferralCode,
      metadata.referral_code,
      metadata.ambassador_referral_code,
      metadata.ambassador_code,
      metadata.referred_by_code,
    );

    const referralResolution = await resolveReferralCode(
      submittedReferralCode,
    );

    const resolvedAmbassadorReferralCode =
      referralResolution.status === "resolved" &&
      referralResolution.owner.ownerType === "ambassador"
        ? referralResolution.owner.code
        : "";

    const result = await callProvisioningRpc(
      {
        ...body,
        userId,
        intent: requestedIntent,
      },
      resolvedAmbassadorReferralCode,
    );

    if (!result?.ok) {
      return jsonError(
        "SitGuru could not verify the completed account setup.",
        500,
        result,
      );
    }

    if (
      requestedIntent === "ambassador" &&
      result.workspace_ready !== true
    ) {
      return jsonError(
        "SitGuru could not verify the Ambassador workspace.",
        500,
        result,
      );
    }

    const referredEmail =
      authEmail || submittedEmail || lowerText(metadata.email);
    const referredName = firstText(
      body.fullName,
      metadata.full_name,
      [
        cleanText(metadata.first_name),
        cleanText(metadata.last_name),
      ]
        .filter(Boolean)
        .join(" "),
    );

    // Referral recording never creates or approves a financial reward. It
    // records attribution and pending signup activity only.
    const referral = await recordReferralAttribution({
      resolution: referralResolution,
      body,
      metadata,
      userId,
      referredEmail,
      referredName,
      intent: requestedIntent,
    });

    await updateReferralMetadata({
      userId,
      existingMetadata: metadata,
      resolution: referralResolution,
      capture: referral,
    });

    // Notification failures never undo a successful signup. The hourly cron
    // job retries pending reminder rows.
    const reminder = await queueAndSendSignupNotice({
      userId,
      intent: requestedIntent,
    });

    return NextResponse.json({
      ok: true,
      userId,
      intent: result.intent || requestedIntent,
      profileRole: result.profile_role || null,
      roles: result.roles || [],

      // This is the newly created member's own SitGuru referral code returned
      // by the provisioning RPC, not the code that referred them.
      referralCode: result.referral_code || null,

      appliedReferral: {
        code: referral.submittedCode || null,
        applied: referral.applied,
        status: referral.status,
        ownerType: referral.ownerType,
        source: referral.source || null,
        platform: referral.platform || null,
        medium: referral.medium || null,
        campaign: referral.campaign || null,
        warning: referral.warning || null,
      },

      workspaceReady: result.workspace_ready === true,
      requiresEmailVerification:
        result.requires_email_verification === true,
      reminder,
      message:
        requestedIntent === "ambassador"
          ? "Your SitGuru Ambassador workspace is ready. Check your email for the next steps."
          : "Your SitGuru account and workspace are ready. Check your email for the next steps.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error
        ? error.message
        : "SitGuru could not finish account setup.",
      500,
      error,
    );
  }
}