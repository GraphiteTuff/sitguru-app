import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dispatchNotification } from "@/lib/notifications";
import {
  canGuruSetStatus,
  chooseExpirationNotice,
  isExpiringSoon,
  maskReference,
  safeCredentialAnalytics,
  toPublicCredential,
  utcDateOnly,
  type CredentialRecord,
  type PublicCredentialHighlight,
} from "@/lib/credentials/model";

const DOCUMENT_BUCKET = "guru-credential-documents";
const MAX_DOCUMENT_BYTES = 8 * 1024 * 1024;
const ALLOWED_DOCUMENT_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

export type CredentialTypeRow = {
  id: string;
  slug: string;
  category: string;
  display_name: string;
  short_display_name: string;
  description: string;
  icon: string;
  public_badge_label: string;
  chip_label: string;
  filter_key: string;
  explore_label: string | null;
  add_label: string;
  default_provider_slug: string | null;
  requires_expiration: boolean;
  supports_document: boolean;
  supports_certificate_number: boolean;
  supports_verification_url: boolean;
  sort_order: number;
};

export type CredentialProviderRow = {
  id: string;
  slug: string;
  provider_name: string;
  provider_type: string;
  description: string | null;
  public_url: string | null;
  training_url: string | null;
  partner_url: string | null;
  affiliate_url: string | null;
  promo_code: string | null;
  logo_url: string | null;
  logo_authorized: boolean;
  is_partner: boolean;
  is_featured: boolean;
  referral_enabled: boolean;
  affiliate_enabled: boolean;
  active: boolean;
  sort_order: number;
};

type CredentialDbRow = {
  id: string;
  guru_id: string | null;
  owner_user_id: string;
  credential_type_id: string;
  provider_id: string | null;
  custom_provider_name: string | null;
  credential_name: string;
  certificate_or_member_reference: string | null;
  issue_date: string | null;
  expiration_date: string | null;
  verification_url: string | null;
  storage_path: string | null;
  submission_notes: string | null;
  metadata: Record<string, unknown> | null;
  status: string;
  verification_notes: string | null;
  verified_at: string | null;
  verified_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
  credential_types?: CredentialTypeRow | CredentialTypeRow[] | null;
  credential_providers?: CredentialProviderRow | CredentialProviderRow[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function cleanText(value: unknown, max = 240) {
  return String(value || "").trim().slice(0, max);
}

function cleanDate(value: unknown) {
  const text = cleanText(value, 10);
  if (!text) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null;
  return text;
}

function missingTable(error: { code?: string; message?: string } | null) {
  const message = String(error?.message || "").toLowerCase();
  return (
    error?.code === "42P01" ||
    error?.code === "PGRST205" ||
    message.includes("does not exist") ||
    message.includes("schema cache")
  );
}

export async function getCredentialSettings() {
  const { data, error } = await supabaseAdmin
    .from("credential_settings")
    .select("setting_key, setting_value");

  const defaults: Record<string, string> = {
    guru_trust_credentials_enabled: "true",
    credential_homepage_section_enabled: "true",
    credential_search_filters_enabled: "true",
    credential_public_metrics_enabled: "false",
    credential_partner_links_enabled: "true",
    homepage_credential_metric_min_count: "12",
  };

  if (error || !data) return defaults;

  for (const row of data) {
    defaults[String(row.setting_key)] = String(row.setting_value);
  }

  return defaults;
}

export function settingEnabled(
  settings: Record<string, string>,
  key: string,
) {
  return settings[key] !== "false";
}

export async function requireSignedInUser(request?: Request) {
  const header = request?.headers.get("authorization") || "";
  if (header.startsWith("Bearer ")) {
    const token = header.slice("Bearer ".length).trim();
    if (token) {
      const { data } = await supabaseAdmin.auth.getUser(token);
      if (data.user) return data.user;
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function findGuruForUser(userId: string) {
  const { data } = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, name, display_name, full_name, slug")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  return data;
}

async function loadCatalog() {
  const [typesResult, providersResult, settings] = await Promise.all([
    supabaseAdmin
      .from("credential_types")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    supabaseAdmin
      .from("credential_providers")
      .select("*")
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    getCredentialSettings(),
  ]);

  return {
    types: (typesResult.data || []) as CredentialTypeRow[],
    providers: (providersResult.data || []) as CredentialProviderRow[],
    settings,
    unavailable: missingTable(typesResult.error) || missingTable(providersResult.error),
  };
}

function providerName(
  row: CredentialDbRow,
  provider: CredentialProviderRow | null,
) {
  return provider?.provider_name || row.custom_provider_name || null;
}

function toRecord(
  row: CredentialDbRow,
  type: CredentialTypeRow | null,
  provider: CredentialProviderRow | null,
): CredentialRecord {
  return {
    id: row.id,
    guruId: row.guru_id || "",
    ownerUserId: row.owner_user_id,
    status: row.status,
    typeSlug: type?.slug || "",
    filterKey: type?.filter_key || "",
    chipLabel: type?.chip_label || "Credential",
    badgeLabel: type?.public_badge_label || row.credential_name,
    icon: type?.icon || "paw",
    sortOrder: type?.sort_order || 100,
    providerName: providerName(row, provider),
    credentialName: row.credential_name,
    expirationDate: row.expiration_date,
    issueDate: row.issue_date,
    reference: row.certificate_or_member_reference,
    storagePath: row.storage_path,
    submissionNotes: row.submission_notes,
    verificationNotes: row.verification_notes,
    rejectionReason: row.rejection_reason,
    coverageLimit:
      row.metadata && typeof row.metadata.coverage_limit === "string"
        ? row.metadata.coverage_limit
        : null,
  };
}

function ownerPayload(row: CredentialDbRow) {
  const type = one(row.credential_types);
  const provider = one(row.credential_providers);
  const record = toRecord(row, type, provider);
  const today = utcDateOnly();

  return {
    id: row.id,
    typeSlug: type?.slug || "",
    typeName: type?.display_name || row.credential_name,
    credentialName: row.credential_name,
    providerName: record.providerName,
    providerId: row.provider_id,
    customProviderName: row.custom_provider_name,
    reference: row.certificate_or_member_reference,
    issueDate: row.issue_date,
    expirationDate: row.expiration_date,
    verificationUrl: row.verification_url,
    hasDocument: Boolean(row.storage_path),
    submissionNotes: row.submission_notes,
    metadata: row.metadata || {},
    status: row.status,
    rejectionReason: row.rejection_reason,
    verifiedAt: row.verified_at,
    expiringSoon: isExpiringSoon(record, today),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

const CREDENTIAL_SELECT = `
  id,
  guru_id,
  owner_user_id,
  credential_type_id,
  provider_id,
  custom_provider_name,
  credential_name,
  certificate_or_member_reference,
  issue_date,
  expiration_date,
  verification_url,
  storage_path,
  submission_notes,
  metadata,
  status,
  verification_notes,
  verified_at,
  verified_by,
  rejected_at,
  rejection_reason,
  revoked_at,
  created_at,
  updated_at,
  credential_types (*),
  credential_providers (*)
`;

export async function getGuruCredentialWorkspace(userId: string) {
  const catalog = await loadCatalog();
  if (!settingEnabled(catalog.settings, "guru_trust_credentials_enabled")) {
    return { enabled: false, types: [], providers: [], credentials: [] };
  }

  const { data, error } = await supabaseAdmin
    .from("guru_credentials")
    .select(CREDENTIAL_SELECT)
    .eq("owner_user_id", userId)
    .order("created_at", { ascending: false });

  if (error && !missingTable(error)) {
    throw new Error(error.message);
  }

  return {
    enabled: true,
    unavailable: catalog.unavailable,
    types: catalog.types,
    providers: catalog.providers.map((provider) => ({
      ...provider,
      exploreUrl: settingEnabled(catalog.settings, "credential_partner_links_enabled")
        ? provider.training_url || provider.public_url
        : null,
      partnerLabel: provider.is_partner ? "SitGuru Partner" : null,
    })),
    credentials: ((data || []) as CredentialDbRow[]).map(ownerPayload),
  };
}

export async function createGuruCredential(input: {
  userId: string;
  guruId?: string | null;
  typeSlug: string;
  providerId?: string | null;
  customProviderName?: string | null;
  credentialName?: string | null;
  reference?: string | null;
  issueDate?: string | null;
  expirationDate?: string | null;
  verificationUrl?: string | null;
  submissionNotes?: string | null;
  metadata?: Record<string, unknown> | null;
  status?: string | null;
}) {
  const status = input.status || "submitted";
  if (!canGuruSetStatus(status)) {
    throw new Error("A Guru cannot verify their own credential.");
  }

  const catalog = await loadCatalog();
  const type = catalog.types.find((item) => item.slug === input.typeSlug);
  if (!type) throw new Error("Choose a credential type to add.");

  const provider = input.providerId
    ? catalog.providers.find((item) => item.id === input.providerId) || null
    : null;

  const { data: prior } = await supabaseAdmin
    .from("guru_credentials")
    .select("id")
    .eq("owner_user_id", input.userId)
    .eq("credential_type_id", type.id)
    .in("status", ["verified", "expired"])
    .limit(1);

  const { data, error } = await supabaseAdmin
    .from("guru_credentials")
    .insert({
      guru_id: input.guruId || null,
      owner_user_id: input.userId,
      credential_type_id: type.id,
      provider_id: provider?.id || null,
      custom_provider_name: cleanText(input.customProviderName, 160) || null,
      credential_name: cleanText(input.credentialName, 180) || type.display_name,
      certificate_or_member_reference: cleanText(input.reference, 120) || null,
      issue_date: cleanDate(input.issueDate),
      expiration_date: cleanDate(input.expirationDate),
      verification_url: cleanText(input.verificationUrl, 400) || null,
      submission_notes: cleanText(input.submissionNotes, 1000) || null,
      metadata: input.metadata || {},
      status,
    })
    .select("id, status")
    .single();

  if (error || !data) {
    throw new Error(error?.message || "SitGuru could not save this credential.");
  }

  await supabaseAdmin.from("guru_credential_events").insert({
    credential_id: data.id,
    actor_user_id: input.userId,
    from_status: null,
    to_status: data.status,
    note: "Guru submitted a credential highlight.",
  });

  await recordCredentialAnalytics({
    eventName: prior?.length ? "credential_renewal_started" : "credential_submitted",
    userId: input.userId,
    guruId: input.guruId,
    typeSlug: type.slug,
    providerSlug: provider?.slug,
    role: "guru",
    source: "guru_credentials_api",
  });

  return data;
}

export async function updateOwnCredential(input: {
  userId: string;
  credentialId: string;
  patch: Record<string, unknown>;
}) {
  const { data: existing, error } = await supabaseAdmin
    .from("guru_credentials")
    .select("id, owner_user_id, status")
    .eq("id", input.credentialId)
    .maybeSingle();

  if (error || !existing || existing.owner_user_id !== input.userId) {
    throw new Error("That credential is not on your Guru profile.");
  }

  if (!["draft", "submitted", "rejected", "expired"].includes(existing.status)) {
    throw new Error("This verified highlight stays as-is. Add an update instead.");
  }

  const nextStatus = cleanText(input.patch.status, 40) || "submitted";
  if (!canGuruSetStatus(nextStatus)) {
    throw new Error("A Guru cannot verify their own credential.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("guru_credentials")
    .update({
      custom_provider_name: cleanText(input.patch.customProviderName, 160) || null,
      provider_id: cleanText(input.patch.providerId, 80) || null,
      credential_name: cleanText(input.patch.credentialName, 180),
      certificate_or_member_reference: cleanText(input.patch.reference, 120) || null,
      issue_date: cleanDate(input.patch.issueDate),
      expiration_date: cleanDate(input.patch.expirationDate),
      verification_url: cleanText(input.patch.verificationUrl, 400) || null,
      submission_notes: cleanText(input.patch.submissionNotes, 1000) || null,
      metadata:
        input.patch.metadata && typeof input.patch.metadata === "object"
          ? input.patch.metadata
          : {},
      status: nextStatus,
      rejection_reason: null,
      rejected_at: null,
      verified_at: null,
      verified_by: null,
      verification_notes: null,
    })
    .eq("id", input.credentialId)
    .eq("owner_user_id", input.userId);

  if (updateError) throw new Error(updateError.message);

  await supabaseAdmin.from("guru_credential_events").insert({
    credential_id: input.credentialId,
    actor_user_id: input.userId,
    from_status: existing.status,
    to_status: nextStatus,
    note: "Guru updated a credential highlight.",
  });
}

async function recordCredentialAnalytics(input: {
  eventName: string;
  userId?: string | null;
  guruId?: string | null;
  typeSlug?: string | null;
  providerSlug?: string | null;
  role: string;
  source: string;
}) {
  const { error } = await supabaseAdmin.from("analytics_events").insert({
    user_id: input.userId || null,
    event_name: input.eventName,
    event_type: "credentials",
    role: input.role,
    source: input.source,
    page_path: "/guru/dashboard/credentials",
    guru_id: input.guruId || null,
    metadata: safeCredentialAnalytics({
      typeSlug: input.typeSlug,
      providerSlug: input.providerSlug,
      platform: "server",
      role: input.role,
      source: input.source,
    }),
  });
  if (error) console.error("Credential analytics skipped:", error.message);
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, "-").replace(/^-|-$/g, "") || "document";
}

export async function saveCredentialDocument(input: {
  userId: string;
  credentialId: string;
  file: File;
}) {
  if (input.file.size <= 0 || input.file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("Upload a PDF, JPG, or PNG up to 8 MB.");
  }

  const mime = input.file.type || "";
  const extension = input.file.name.split(".").pop()?.toLowerCase() || "";
  const extensionOk = ["pdf", "jpg", "jpeg", "png"].includes(extension);
  if (!ALLOWED_DOCUMENT_TYPES.has(mime) || !extensionOk) {
    throw new Error("Upload a PDF, JPG, or PNG. HEIC photos need to be saved as JPG first.");
  }

  const { data: existing } = await supabaseAdmin
    .from("guru_credentials")
    .select("id, owner_user_id, status")
    .eq("id", input.credentialId)
    .maybeSingle();

  if (!existing || existing.owner_user_id !== input.userId) {
    throw new Error("That credential is not on your Guru profile.");
  }

  if (!["draft", "submitted", "rejected", "expired"].includes(existing.status)) {
    throw new Error("Add an updated credential to attach a new document.");
  }

  const path = `${input.userId}/${input.credentialId}/${Date.now()}-${safeFileName(input.file.name)}`;
  const bytes = Buffer.from(await input.file.arrayBuffer());
  const { error } = await supabaseAdmin.storage
    .from(DOCUMENT_BUCKET)
    .upload(path, bytes, { contentType: mime, upsert: false });

  if (error) throw new Error(error.message);

  await supabaseAdmin
    .from("guru_credentials")
    .update({ storage_path: path })
    .eq("id", input.credentialId)
    .eq("owner_user_id", input.userId);

  return { hasDocument: true };
}

export async function signedCredentialDocumentUrl(input: {
  credentialId: string;
  requesterId: string;
  admin: boolean;
}) {
  const { data } = await supabaseAdmin
    .from("guru_credentials")
    .select("id, owner_user_id, storage_path")
    .eq("id", input.credentialId)
    .maybeSingle();

  if (!data?.storage_path) throw new Error("No document is attached yet.");
  if (!input.admin && data.owner_user_id !== input.requesterId) {
    throw new Error("That document is private.");
  }

  const { data: signed, error } = await supabaseAdmin.storage
    .from(DOCUMENT_BUCKET)
    .createSignedUrl(data.storage_path, 60);

  if (error || !signed?.signedUrl) {
    throw new Error(error?.message || "SitGuru could not open that document.");
  }

  return signed.signedUrl;
}

function highlightsFromRows(rows: CredentialDbRow[]) {
  const today = utcDateOnly();
  const highlights: PublicCredentialHighlight[] = [];

  for (const row of rows) {
    const highlight = toPublicCredential(
      toRecord(row, one(row.credential_types), one(row.credential_providers)),
      today,
    );
    if (highlight) highlights.push(highlight);
  }

  return highlights;
}

export async function listPublicCredentialsForGurus(guruKeys: string[]) {
  const settings = await getCredentialSettings();
  if (!settingEnabled(settings, "guru_trust_credentials_enabled")) {
    return {
      enabled: false,
      filtersEnabled: false,
      highlights: [] as PublicCredentialHighlight[],
    };
  }

  const ids = Array.from(
    new Set(
      guruKeys
        .map((id) => id.trim())
        .filter((id) => /^[A-Za-z0-9-]+$/.test(id)),
    ),
  ).slice(0, 200);
  if (!ids.length) {
    return {
      enabled: true,
      filtersEnabled: settingEnabled(settings, "credential_search_filters_enabled"),
      highlights: [] as PublicCredentialHighlight[],
    };
  }

  const uuidIds = ids.filter((id) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id),
  );

  const [byGuru, byOwner] = await Promise.all([
    supabaseAdmin
      .from("guru_credentials")
      .select(CREDENTIAL_SELECT)
      .eq("status", "verified")
      .in("guru_id", ids),
    uuidIds.length
      ? supabaseAdmin
          .from("guru_credentials")
          .select(CREDENTIAL_SELECT)
          .eq("status", "verified")
          .in("owner_user_id", uuidIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const error = byGuru.error || byOwner.error;
  if (error) {
    if (missingTable(error)) {
      return { enabled: true, filtersEnabled: false, highlights: [] as PublicCredentialHighlight[] };
    }
    throw new Error(error.message);
  }

  const merged = new Map<string, CredentialDbRow>();
  for (const row of [...(byGuru.data || []), ...(byOwner.data || [])] as CredentialDbRow[]) {
    merged.set(row.id, row);
  }

  return {
    enabled: true,
    filtersEnabled: settingEnabled(settings, "credential_search_filters_enabled"),
    highlights: highlightsFromRows(Array.from(merged.values())),
  };
}

export async function listPublicCredentialMetrics() {
  const settings = await getCredentialSettings();
  const enabled = settingEnabled(settings, "credential_public_metrics_enabled");
  const minimum = Number(settings.homepage_credential_metric_min_count || 12);
  if (!enabled) return { enabled: false, minimum, metrics: [] };

  const { data, error } = await supabaseAdmin
    .from("guru_credentials")
    .select(CREDENTIAL_SELECT)
    .eq("status", "verified")
    .limit(1000);

  if (error || !data) return { enabled: true, minimum, metrics: [] };

  const highlights = highlightsFromRows(data as CredentialDbRow[]);
  const groups = [
    { key: "pet_cpr", label: "Pet CPR & First Aid Credentials" },
    { key: "insured", label: "Insured Gurus" },
    { key: "bonded", label: "Bonded Gurus" },
    { key: "professional", label: "Professional Credentials" },
  ];

  const metrics = groups
    .map((group) => {
      const gurus = new Set(
        highlights
          .filter((item) =>
            group.key === "professional"
              ? item.filterKey === "professional" || item.filterKey === "psi"
              : item.filterKey === group.key,
          )
          .map((item) => item.guruId || item.ownerUserId),
      );
      return { ...group, count: gurus.size };
    })
    .filter((metric) => metric.count >= minimum);

  return { enabled: true, minimum, metrics };
}

export async function listAdminCredentials(tab: string) {
  let query = supabaseAdmin
    .from("guru_credentials")
    .select(CREDENTIAL_SELECT)
    .order("created_at", { ascending: false })
    .limit(200);

  const today = utcDateOnly();
  const soon = new Date();
  soon.setUTCDate(soon.getUTCDate() + 60);
  const soonDate = soon.toISOString().slice(0, 10);

  if (tab === "pending") query = query.in("status", ["submitted", "under_review"]);
  else if (tab === "verified") query = query.eq("status", "verified");
  else if (tab === "expired") query = query.eq("status", "expired");
  else if (tab === "rejected") query = query.in("status", ["rejected", "revoked"]);
  else if (tab === "expiring") {
    query = query
      .eq("status", "verified")
      .gte("expiration_date", today)
      .lte("expiration_date", soonDate);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  return ((data || []) as CredentialDbRow[]).map((row) => {
    const owner = ownerPayload(row);
    return {
      ...owner,
      referenceMasked: maskReference(row.certificate_or_member_reference),
      reference: row.certificate_or_member_reference,
      verificationNotes: row.verification_notes,
      guruId: row.guru_id,
      ownerUserId: row.owner_user_id,
      metadata: row.metadata || {},
    };
  });
}

export async function reviewCredential(input: {
  adminId: string;
  credentialId: string;
  action: "verify" | "reject" | "revoke";
  note?: string | null;
  rejectionReason?: string | null;
}) {
  const { data: existing, error } = await supabaseAdmin
    .from("guru_credentials")
    .select("id, status, owner_user_id, credential_type_id, guru_id, credential_types(slug)")
    .eq("id", input.credentialId)
    .maybeSingle();

  if (error || !existing) throw new Error("Credential not found.");

  const now = new Date().toISOString();
  let patch: Record<string, unknown> = {};
  let nextStatus = existing.status;

  if (input.action === "verify") {
    nextStatus = "verified";
    patch = {
      status: "verified",
      verified_at: now,
      verified_by: input.adminId,
      verification_notes: cleanText(input.note, 1000) || null,
      rejection_reason: null,
      rejected_at: null,
      revoked_at: null,
    };
  } else if (input.action === "reject") {
    nextStatus = "rejected";
    patch = {
      status: "rejected",
      rejected_at: now,
      rejection_reason:
        cleanText(input.rejectionReason, 500) ||
        "We couldn't verify this credential yet. Please review the information and update your submission.",
      verification_notes: cleanText(input.note, 1000) || null,
      verified_at: null,
      verified_by: null,
    };
  } else {
    nextStatus = "revoked";
    patch = {
      status: "revoked",
      revoked_at: now,
      verification_notes: cleanText(input.note, 1000) || null,
    };
  }

  const { error: updateError } = await supabaseAdmin
    .from("guru_credentials")
    .update(patch)
    .eq("id", input.credentialId);

  if (updateError) throw new Error(updateError.message);

  if (input.action === "verify") {
    await supabaseAdmin
      .from("guru_credentials")
      .update({ status: "archived" })
      .eq("owner_user_id", existing.owner_user_id)
      .eq("credential_type_id", existing.credential_type_id)
      .eq("status", "verified")
      .neq("id", input.credentialId);
  }

  await supabaseAdmin.from("guru_credential_events").insert({
    credential_id: input.credentialId,
    actor_user_id: input.adminId,
    from_status: existing.status,
    to_status: nextStatus,
    note: cleanText(input.note, 1000) || input.action,
  });

  const typeSlug = one(
    (existing as { credential_types?: { slug?: string } | { slug?: string }[] | null })
      .credential_types,
  )?.slug;

  await recordCredentialAnalytics({
    eventName:
      input.action === "verify"
        ? "credential_verified"
        : input.action === "reject"
          ? "credential_rejected"
          : "credential_revoked",
    userId: existing.owner_user_id,
    guruId: existing.guru_id,
    typeSlug,
    role: "admin",
    source: "admin_credential_review",
  });

  return { ownerUserId: existing.owner_user_id as string, status: nextStatus };
}

export async function updateCredentialSettings(
  settings: Record<string, string>,
) {
  const rows = Object.entries(settings)
    .filter(([key]) => key.startsWith("credential_") || key.startsWith("guru_trust") || key.startsWith("homepage_credential"))
    .map(([setting_key, setting_value]) => ({
      setting_key,
      setting_value: String(setting_value),
      updated_at: new Date().toISOString(),
    }));

  if (!rows.length) return;
  const { error } = await supabaseAdmin
    .from("credential_settings")
    .upsert(rows, { onConflict: "setting_key" });
  if (error) throw new Error(error.message);
}

export async function updateCredentialProvider(input: {
  id: string;
  publicUrl?: string | null;
  trainingUrl?: string | null;
  partnerUrl?: string | null;
  promoCode?: string | null;
  active?: boolean;
  logoAuthorized?: boolean;
  isPartner?: boolean;
}) {
  const { error } = await supabaseAdmin
    .from("credential_providers")
    .update({
      public_url: cleanText(input.publicUrl, 400) || null,
      training_url: cleanText(input.trainingUrl, 400) || null,
      partner_url: cleanText(input.partnerUrl, 400) || null,
      promo_code: cleanText(input.promoCode, 80) || null,
      active: input.active !== false,
      logo_authorized: Boolean(input.logoAuthorized),
      is_partner: Boolean(input.isPartner),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.id);

  if (error) throw new Error(error.message);
}

export async function listCredentialProvidersForAdmin() {
  const { data, error } = await supabaseAdmin
    .from("credential_providers")
    .select("*")
    .order("sort_order", { ascending: true });
  if (error) throw new Error(error.message);
  return data || [];
}

async function notifyOwner(input: {
  userId: string;
  title: string;
  body: string;
  type: string;
}) {
  await dispatchNotification({
    userId: input.userId,
    title: input.title,
    body: input.body,
    type: input.type,
    href: "/guru/dashboard/credentials",
    channels: ["in_app"],
  });
}

export async function processCredentialExpirations() {
  const today = utcDateOnly();
  const { data, error } = await supabaseAdmin
    .from("guru_credentials")
    .select(
      "id, owner_user_id, credential_name, expiration_date, status, notify_60_sent_at, notify_30_sent_at, notify_7_sent_at, expiration_handled_at",
    )
    .eq("status", "verified")
    .not("expiration_date", "is", null)
    .limit(500);

  if (error) {
    if (missingTable(error)) return { reminded: 0, expired: 0, skipped: true };
    throw new Error(error.message);
  }

  let reminded = 0;
  let expired = 0;

  for (const row of data || []) {
    const expiration = String(row.expiration_date);
    const days = Math.round(
      (new Date(`${expiration}T00:00:00Z`).getTime() -
        new Date(`${today}T00:00:00Z`).getTime()) /
        86_400_000,
    );

    if (days < 0 && !row.expiration_handled_at) {
      await supabaseAdmin
        .from("guru_credentials")
        .update({
          status: "expired",
          expiration_handled_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      await notifyOwner({
        userId: row.owner_user_id,
        title: "Time for a quick credential refresh",
        body: `${row.credential_name} is no longer shown as current. Upload the renewed details anytime and SitGuru will review them.`,
        type: "credential_expired",
      });
      expired += 1;
      continue;
    }

    const notice = chooseExpirationNotice(days, {
      60: Boolean(row.notify_60_sent_at),
      30: Boolean(row.notify_30_sent_at),
      7: Boolean(row.notify_7_sent_at),
    });
    if (!notice) continue;

    const columns = {
      60: "notify_60_sent_at",
      30: "notify_30_sent_at",
      7: "notify_7_sent_at",
    } as const;
    const stamp = new Date().toISOString();
    const patch: Record<string, string> = {};
    for (const windowDays of notice.mark) {
      patch[columns[windowDays]] = stamp;
    }

    await supabaseAdmin.from("guru_credentials").update(patch).eq("id", row.id);
    await notifyOwner({
      userId: row.owner_user_id,
      title: "Your credential is coming up for renewal 🐾",
      body: `${row.credential_name} expires on ${expiration}. If you've renewed it, upload the updated information anytime to keep it visible on your Guru profile.`,
      type: "credential_expiring",
    });
    reminded += 1;
  }

  return { reminded, expired, skipped: false };
}
