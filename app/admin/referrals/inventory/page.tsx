import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ClipboardCheck,
  Copy,
  DatabaseZap,
  Gift,
  Link2,
  Plus,
  SearchX,
  ShieldAlert,
  ShieldCheck,
  TableProperties,
  TrendingUp,
  UserRoundX,
  Users,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import {
  GrowthCard,
  GrowthPageFrame,
  StatusPill,
} from "@/components/admin/growth/GrowthPageFrame";
import { getAdminIdentity } from "@/lib/admin/access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, unknown>;

type JsonRecord = Record<string, unknown>;

type ReferralConflict = {
  id: string;
  conflictType: string;
  normalizedCode: string;
  ownerName: string;
  ownerEmail: string;
  sourceTables: string;
  recommendedAction: string;
  resolutionStatus: string;
  createdAt: string;
};

type ReferralAuditRow = {
  id: string;
  migrationName: string;
  batchId: string;
  sourceTable: string;
  sourceCode: string;
  action: string;
  decision: string;
  reason: string;
  createdAt: string;
  metadata: JsonRecord;
};

type DryRunSummary = {
  safeCanonicalCandidates: number;
  missingCode: number;
  multipleCodes: number;
  duplicateOwnership: number;
  canonicalCodeAlreadyExists: number;
  aliasCanonicalCollisionExists: number;
  canonicalSourceDistribution: Record<string, number>;
  aliasSourceDistribution: Record<string, number>;
};

type CodeSource = {
  source:
    | "referral_profiles"
    | "ambassadors"
    | "referral_codes"
    | "guru_referral_campaigns";
  sourceId: string;
  code: string;
  normalizedCode: string;
  ownerKey: string;
  ownerType: string;
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  roleContext: string;
  status: string;
  createdAt: string;
};

type ProfileInventory = {
  profileId: string;
  userId: string;
  name: string;
  email: string;
  roleContext: string;
  codes: CodeSource[];
};

type ActivityIssue = {
  id: string;
  code: string;
  activityType: string;
  source: string;
  referredEmail: string;
  createdAt: string;
  reason: string;
};

const TABLE_LIMIT = 5000;

function text(value: unknown) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function pick(row: Row, keys: string[]) {
  return keys.map((key) => text(row[key])).find(Boolean) || "";
}

function normalizeCode(value: unknown) {
  return text(value)
    .toUpperCase()
    .replace(/[^A-Z0-9-_]/g, "");
}

function jsonRecord(value: unknown): JsonRecord {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : {};
}

function metadataNumber(metadata: JsonRecord, keys: string[]) {
  for (const key of keys) {
    const value = metadata[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    const parsed = Number(text(value));
    if (Number.isFinite(parsed)) return parsed;
  }

  return 0;
}

function distributionRecord(value: unknown): Record<string, number> {
  const record = jsonRecord(value);

  return Object.fromEntries(
    Object.entries(record)
      .map(([key, count]) => [
        key,
        typeof count === "number" ? count : Number(text(count)),
      ])
      .filter(
        (entry): entry is [string, number] =>
          Boolean(entry[0]) && Number.isFinite(entry[1]),
      ),
  );
}

function metadataText(metadata: JsonRecord, keys: string[]) {
  return keys.map((key) => text(metadata[key])).find(Boolean) || "";
}

function sourceTablesFromMetadata(metadata: JsonRecord, fallback: string) {
  const sourceRecords = metadata.source_records;
  if (Array.isArray(sourceRecords)) {
    const sources = sourceRecords
      .map((record) =>
        metadataText(jsonRecord(record), ["source", "table", "legacy_source"]),
      )
      .filter(Boolean);
    if (sources.length) return Array.from(new Set(sources)).join(", ");
  }

  return fallback;
}

function conflictFromRow(row: Row): ReferralConflict {
  const metadata = jsonRecord(row.metadata);
  const sourceRecords = Array.isArray(metadata.source_records)
    ? metadata.source_records.map(jsonRecord)
    : [];
  const firstSourceRecord = sourceRecords[0] || {};
  const normalizedCode =
    metadataText(metadata, [
      "code_normalized",
      "referral_code_normalized",
      "normalized_code",
      "referral_code",
    ]) ||
    metadataText(firstSourceRecord, [
      "code",
      "referral_code",
      "normalized_code",
    ]) ||
    pick(row, ["conflict_key", "conflicting_record_id"]);

  return {
    id: pick(row, ["id"]),
    conflictType: pick(row, ["conflict_type"]),
    normalizedCode,
    ownerName:
      metadataText(metadata, [
        "owner_name",
        "profile_name",
        "name",
        "full_name",
      ]) || metadataText(firstSourceRecord, ["owner_name", "name"]),
    ownerEmail:
      metadataText(metadata, ["owner_email", "profile_email", "email"]) ||
      metadataText(firstSourceRecord, ["owner_email", "email"]),
    sourceTables: sourceTablesFromMetadata(
      metadata,
      pick(row, ["conflicting_table"]),
    ),
    recommendedAction:
      metadataText(metadata, ["recommended_action", "recommendation"]) ||
      "Review this conflict before canonical PawPerks referral code backfill.",
    resolutionStatus: pick(row, ["resolution_status"]),
    createdAt: pick(row, ["created_at"]),
  };
}

function auditFromRow(row: Row): ReferralAuditRow {
  const metadata = jsonRecord(row.metadata);

  return {
    id: pick(row, ["id"]),
    migrationName:
      pick(row, ["backfill_name"]) ||
      metadataText(metadata, ["migration_name"]),
    batchId:
      metadataText(metadata, ["batch_id"]) || pick(row, ["legacy_record_id"]),
    sourceTable: pick(row, ["legacy_source"]),
    sourceCode:
      metadataText(metadata, [
        "referral_code",
        "referral_code_normalized",
        "code",
        "code_normalized",
      ]) || pick(row, ["legacy_record_id"]),
    action: pick(row, ["action"]),
    decision: pick(row, ["status"]),
    reason:
      pick(row, ["notes"]) ||
      metadataText(metadata, [
        "reason",
        "decision_reason",
        "skip_reason",
        "recommended_action",
      ]),
    createdAt: pick(row, ["created_at"]),
    metadata,
  };
}

function dryRunSummaryFromRows(rows: ReferralAuditRow[]): DryRunSummary {
  const reportRows = rows.filter(
    (row) =>
      row.action === "dry_run_validation_report" ||
      row.migrationName.includes(
        "dry_run_pawperks_canonical_code_backfill_validation",
      ) ||
      row.metadata.dry_run_only === true,
  );
  const latestReport = reportRows[0];
  const metadata = latestReport?.metadata || {};

  return {
    safeCanonicalCandidates: metadataNumber(metadata, [
      "profiles_with_one_safe_canonical_candidate",
    ]),
    missingCode: metadataNumber(metadata, [
      "profiles_skipped_for_missing_code",
    ]),
    multipleCodes: metadataNumber(metadata, [
      "profiles_skipped_for_multiple_codes",
    ]),
    duplicateOwnership: metadataNumber(metadata, [
      "profiles_skipped_for_duplicate_ownership",
    ]),
    canonicalCodeAlreadyExists: metadataNumber(metadata, [
      "profiles_skipped_because_canonical_code_already_exists",
    ]),
    aliasCanonicalCollisionExists: metadataNumber(metadata, [
      "profiles_skipped_because_alias_canonical_collision_exists",
      "profiles_skipped_because_alias_or_canonical_collision_exists",
    ]),
    canonicalSourceDistribution: distributionRecord(
      metadata.proposed_canonical_source_distribution_by_table,
    ),
    aliasSourceDistribution: distributionRecord(
      metadata.proposed_alias_source_distribution_by_table,
    ),
  };
}

function dryRunAuditRows(rows: ReferralAuditRow[]) {
  return rows.filter(
    (row) =>
      row.action.startsWith("dry_run") ||
      row.migrationName.includes("dry_run") ||
      row.metadata.dry_run_only === true ||
      Boolean(row.metadata.batch_id),
  );
}

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleContext(row: Row, fallback = "Unknown") {
  const role = pick(row, [
    "role",
    "account_type",
    "owner_type",
    "program_type",
    "ambassador_type",
    "partner_type",
  ]);
  const normalized = role.toLowerCase();

  if (
    ["pet_parent", "pet owner", "pet_owner", "customer", "client"].includes(
      normalized,
    )
  )
    return "Pet Parent";
  if (["guru", "sitter", "pet_guru", "pet guru"].includes(normalized))
    return "Guru";
  if (normalized.includes("ambassador")) return "Ambassador";
  if (normalized.includes("partner") || normalized.includes("affiliate"))
    return "Partner/Affiliate";
  if (normalized.includes("admin")) return "Admin";

  return role ? titleize(role) : fallback;
}

function ownerKey(type: string, id: string, email: string, name: string) {
  return [type || "unknown", id || email || name || "unresolved"].join(":");
}

async function safeRows(table: string) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .limit(TABLE_LIMIT);

  return {
    rows: ((data || []) as Row[]).filter(Boolean),
    error: error?.message || "",
  };
}

function codeFromProfile(row: Row): CodeSource | null {
  const code = pick(row, ["referral_code", "code", "slug"]);
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const ownerId = pick(row, ["user_id", "profile_id", "id"]);
  const ownerEmail = pick(row, ["email", "owner_email"]);
  const ownerName = pick(row, [
    "display_name",
    "full_name",
    "name",
    "owner_name",
  ]);
  const ownerType = roleContext(row, "Profile");

  return {
    source: "referral_profiles",
    sourceId: pick(row, ["id", "profile_id", "user_id"]),
    code,
    normalizedCode,
    ownerKey: ownerKey(ownerType, ownerId, ownerEmail, ownerName),
    ownerType,
    ownerId,
    ownerName,
    ownerEmail,
    roleContext: ownerType,
    status: pick(row, ["status", "account_status"]),
    createdAt: pick(row, ["created_at"]),
  };
}

function codeFromAmbassador(row: Row): CodeSource | null {
  const code = pick(row, ["referral_code", "ambassador_code", "code", "slug"]);
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const ownerId = pick(row, ["user_id", "profile_id", "id"]);
  const ownerEmail = pick(row, ["email", "owner_email"]);
  const ownerName = pick(row, [
    "display_name",
    "full_name",
    "name",
    "first_name",
  ]);

  return {
    source: "ambassadors",
    sourceId: pick(row, ["id", "ambassador_id", "user_id"]),
    code,
    normalizedCode,
    ownerKey: ownerKey("Ambassador", ownerId, ownerEmail, ownerName),
    ownerType: "Ambassador",
    ownerId,
    ownerName,
    ownerEmail,
    roleContext: roleContext(row, "Ambassador"),
    status: pick(row, ["status", "account_status"]),
    createdAt: pick(row, ["created_at"]),
  };
}

function codeFromReferralCode(row: Row): CodeSource | null {
  const code = pick(row, ["code", "slug", "referral_code", "normalized_code"]);
  const normalizedCode = normalizeCode(
    pick(row, ["normalized_code", "code", "slug", "referral_code"]),
  );
  if (!normalizedCode) return null;

  const ownerId = pick(row, [
    "owner_user_id",
    "issued_to_user_id",
    "profile_id",
    "ambassador_id",
    "partner_id",
    "id",
  ]);
  const ownerEmail = pick(row, ["owner_email", "issued_to_email", "email"]);
  const ownerName = pick(row, [
    "owner_name",
    "issued_to_name",
    "name",
    "display_name",
  ]);
  const ownerType = roleContext(
    row,
    titleize(pick(row, ["owner_type", "issued_to_type"]) || "Unknown"),
  );

  return {
    source: "referral_codes",
    sourceId: pick(row, ["id"]),
    code,
    normalizedCode,
    ownerKey: ownerKey(ownerType, ownerId, ownerEmail, ownerName),
    ownerType,
    ownerId,
    ownerName,
    ownerEmail,
    roleContext: ownerType,
    status: pick(row, ["status"]),
    createdAt: pick(row, ["created_at"]),
  };
}

function codeFromGuruCampaign(row: Row): CodeSource | null {
  const code = pick(row, ["referral_code", "code", "slug"]);
  const normalizedCode = normalizeCode(code);
  if (!normalizedCode) return null;

  const ownerId = pick(row, ["guru_user_id", "user_id", "profile_id", "id"]);
  const ownerEmail = pick(row, ["guru_email", "email", "owner_email"]);
  const ownerName = pick(row, [
    "guru_name",
    "display_name",
    "full_name",
    "name",
    "campaign_name",
  ]);

  return {
    source: "guru_referral_campaigns",
    sourceId: pick(row, ["id"]),
    code,
    normalizedCode,
    ownerKey: ownerKey("Guru", ownerId, ownerEmail, ownerName),
    ownerType: "Guru",
    ownerId,
    ownerName,
    ownerEmail,
    roleContext: "Guru",
    status: pick(row, ["status", "is_active"]),
    createdAt: pick(row, ["created_at"]),
  };
}

function profileFromRow(row: Row, allCodes: CodeSource[]): ProfileInventory {
  const profileId = pick(row, ["id", "profile_id"]);
  const userId = pick(row, ["user_id", "id"]);
  const email = pick(row, ["email"]);
  const name = pick(row, ["display_name", "full_name", "name", "first_name"]);
  const context = roleContext(row, "Pet Parent");
  const keys = new Set([profileId, userId, email].filter(Boolean));
  const codes = allCodes.filter((code) =>
    [code.ownerId, code.ownerEmail, code.sourceId].some(
      (value) => value && keys.has(value),
    ),
  );

  return { profileId, userId, name, email, roleContext: context, codes };
}

function buildActivityIssues(
  activityRows: Row[],
  codeMap: Map<string, CodeSource[]>,
): ActivityIssue[] {
  return activityRows
    .map((row) => {
      const code = pick(row, ["code", "referral_code", "normalized_code"]);
      const normalized = normalizeCode(code);
      const referralCodeId = pick(row, ["referral_code_id"]);
      const owners = normalized ? codeMap.get(normalized) || [] : [];
      const reason = !normalized
        ? "No readable code on activity"
        : referralCodeId && owners.length > 0
          ? ""
          : owners.length === 0
            ? "Code does not match a known owner"
            : owners.every(
                  (owner) =>
                    !owner.ownerId && !owner.ownerEmail && !owner.ownerName,
                )
              ? "Matched code has no owner fields"
              : "";

      if (!reason) return null;

      return {
        id: pick(row, ["id"]),
        code,
        activityType: pick(row, [
          "activity_type",
          "conversion_stage",
          "conversion_status",
          "status",
        ]),
        source: pick(row, ["source", "campaign", "activity"]),
        referredEmail: pick(row, ["referred_email", "email"]),
        createdAt: pick(row, ["created_at"]),
        reason,
      };
    })
    .filter(Boolean)
    .slice(0, 100) as ActivityIssue[];
}

async function getInventory() {
  const [
    profilesResult,
    ambassadorsResult,
    referralCodesResult,
    guruCampaignsResult,
    activityResult,
    conflictsResult,
    auditResult,
  ] = await Promise.all([
    safeRows("referral_profiles"),
    safeRows("ambassadors"),
    safeRows("referral_codes"),
    safeRows("guru_referral_campaigns"),
    safeRows("referral_activity"),
    safeRows("pawperks_referral_conflicts"),
    safeRows("pawperks_referral_backfill_audit"),
  ]);

  const profileCodes = profilesResult.rows
    .map(codeFromProfile)
    .filter(Boolean) as CodeSource[];
  const ambassadorCodes = ambassadorsResult.rows
    .map(codeFromAmbassador)
    .filter(Boolean) as CodeSource[];
  const referralCodes = referralCodesResult.rows
    .map(codeFromReferralCode)
    .filter(Boolean) as CodeSource[];
  const guruCampaignCodes = guruCampaignsResult.rows
    .map(codeFromGuruCampaign)
    .filter(Boolean) as CodeSource[];
  const allCodes = [
    ...profileCodes,
    ...ambassadorCodes,
    ...referralCodes,
    ...guruCampaignCodes,
  ];

  const codeMap = allCodes.reduce((map, code) => {
    const list = map.get(code.normalizedCode) || [];
    list.push(code);
    map.set(code.normalizedCode, list);
    return map;
  }, new Map<string, CodeSource[]>());

  const profiles = profilesResult.rows.map((row) =>
    profileFromRow(row, allCodes),
  );
  const profilesWithNoCode = profiles.filter(
    (profile) => profile.codes.length === 0,
  );
  const profilesWithMultipleCodes = profiles.filter(
    (profile) =>
      new Set(profile.codes.map((code) => code.normalizedCode)).size > 1,
  );
  const duplicateCodes = Array.from(codeMap.entries())
    .map(([code, sources]) => ({
      code,
      sources,
      owners: new Set(sources.map((source) => source.ownerKey)).size,
    }))
    .filter((item) => item.owners > 1)
    .sort((a, b) => b.owners - a.owners || a.code.localeCompare(b.code));
  const unresolvedActivity = buildActivityIssues(activityResult.rows, codeMap);

  const conflicts = conflictsResult.rows.map(conflictFromRow);
  const openConflicts = conflicts.filter(
    (conflict) =>
      conflict.resolutionStatus === "open" ||
      conflict.resolutionStatus === "reviewing",
  );
  const resolvedConflicts = conflicts.filter(
    (conflict) =>
      conflict.resolutionStatus === "resolved" ||
      conflict.resolutionStatus === "ignored",
  );
  const auditRows = auditResult.rows
    .map(auditFromRow)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const canonicalDryRunAuditRows = dryRunAuditRows(auditRows);
  const canonicalDryRunSummary = dryRunSummaryFromRows(
    canonicalDryRunAuditRows,
  );
  const auditImported = auditRows.filter(
    (row) => row.decision === "imported" || row.action.includes("import"),
  ).length;
  const auditFlagged = auditRows.filter(
    (row) => row.decision === "flagged" || row.action.includes("flag"),
  ).length;
  const auditSkipped = auditRows.filter(
    (row) => row.decision === "skipped" || row.action.includes("skip"),
  ).length;

  const warnings = [
    profilesResult,
    ambassadorsResult,
    referralCodesResult,
    guruCampaignsResult,
    activityResult,
    conflictsResult,
    auditResult,
  ]
    .map((result, index) => ({
      table: [
        "referral_profiles",
        "ambassadors",
        "referral_codes",
        "guru_referral_campaigns",
        "referral_activity",
        "pawperks_referral_conflicts",
        "pawperks_referral_backfill_audit",
      ][index],
      error: result.error,
    }))
    .filter((item) => item.error);

  return {
    allCodes,
    profiles,
    profilesWithNoCode,
    profilesWithMultipleCodes,
    duplicateCodes,
    unresolvedActivity,
    conflicts,
    openConflicts,
    resolvedConflicts,
    canonicalProfilesWithNoCode: conflicts.filter(
      (conflict) => conflict.conflictType === "missing_legacy_referral_code",
    ),
    canonicalProfilesWithMultipleCodes: conflicts.filter(
      (conflict) => conflict.conflictType === "multiple_legacy_referral_codes",
    ),
    canonicalDuplicateCodes: conflicts.filter(
      (conflict) => conflict.conflictType === "duplicate_legacy_referral_code",
    ),
    canonicalUnresolvedActivity: conflicts.filter(
      (conflict) => conflict.conflictType === "unresolved_referral_activity",
    ),
    auditRows,
    canonicalDryRunAuditRows,
    canonicalDryRunSummary,
    auditImported,
    auditFlagged,
    auditSkipped,
    warnings,
  };
}

function CodeBadges({ codes }: { codes: CodeSource[] }) {
  if (!codes.length)
    return <span className="text-sm text-rose-700">No code found</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {codes.map((code) => (
        <span
          key={`${code.source}:${code.sourceId}:${code.normalizedCode}`}
          className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
        >
          {code.code} · {code.source}
        </span>
      ))}
    </div>
  );
}

export default async function ReferralInventoryPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <div className="min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950">
        <h1 className="text-3xl font-black">Admin access required.</h1>
      </div>
    );
  }

  const inventory = await getInventory();
  const workCount =
    inventory.openConflicts.length +
    inventory.profilesWithNoCode.length +
    inventory.duplicateCodes.length +
    inventory.unresolvedActivity.length;

  return (
    <GrowthPageFrame
      kicker="PawPerks Inventory Workplace"
      title="Give every SitGuru account one clean referral code."
      detail="Read-only cleanup board. Find missing codes, duplicates, and conflicts — then jump to Registry to fix them. This page does not write codes or payouts."
      action={
        <Link
          href="/admin/referrals/codes#generate-code"
          className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-white px-5 text-sm font-black text-green-950"
        >
          <Plus size={17} />
          Generate code
        </Link>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Link
          href="/admin/referrals"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3 py-2 text-xs font-black text-emerald-800"
        >
          <ArrowLeft size={14} />
          Referrals workplace
        </Link>
        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-800">
          {actor.email}
        </span>
      </div>

      {inventory.warnings.length > 0 ? (
        <GrowthCard className="border-amber-200 bg-amber-50">
          <p className="text-sm font-black text-amber-950">
            Some inventory reads were skipped
          </p>
          <ul className="mt-2 list-disc pl-5 text-sm font-semibold text-amber-900">
            {inventory.warnings.map((warning) => (
              <li key={warning.table}>
                {warning.table}: {warning.error}
              </li>
            ))}
          </ul>
        </GrowthCard>
      ) : null}

      <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <AdminThemeCard
          label="Open conflicts"
          value={inventory.openConflicts.length}
          helper="Need review"
          tone="rose"
          icon={<AlertTriangle size={18} />}
        />
        <AdminThemeCard
          label="Resolved"
          value={inventory.resolvedConflicts.length}
          helper="Closed or ignored"
          tone="emerald"
          icon={<CheckCircle2 size={18} />}
        />
        <AdminThemeCard
          label="No code"
          value={inventory.profilesWithNoCode.length}
          helper="Legacy profiles"
          tone="amber"
          icon={<UserRoundX size={18} />}
        />
        <AdminThemeCard
          label="Multiple codes"
          value={inventory.profilesWithMultipleCodes.length}
          helper="More than one code"
          tone="violet"
          icon={<Copy size={18} />}
        />
        <AdminThemeCard
          label="Duplicate owners"
          value={inventory.duplicateCodes.length}
          helper="Same code, two people"
          tone="rose"
          icon={<DatabaseZap size={18} />}
        />
        <AdminThemeCard
          label="Unresolved activity"
          value={inventory.unresolvedActivity.length}
          helper="No owner match"
          tone="sky"
          icon={<ClipboardCheck size={18} />}
        />
        <AdminThemeCard
          label="Audit decisions"
          value={
            inventory.auditImported +
            inventory.auditFlagged +
            inventory.auditSkipped
          }
          helper={`${inventory.auditImported} in · ${inventory.auditFlagged} flag · ${inventory.auditSkipped} skip`}
          tone="slate"
          icon={<TableProperties size={18} />}
        />
        <AdminThemeCard
          label="Codes scanned"
          value={inventory.allCodes.length}
          helper={`${inventory.profiles.length} profiles`}
          tone="emerald"
          icon={<Gift size={18} />}
        />
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {[
          {
            href: "#conflicts",
            label: "Review conflicts",
            detail: `${inventory.openConflicts.length} open rows`,
            icon: ShieldAlert,
            primary: inventory.openConflicts.length > 0,
          },
          {
            href: "#no-code",
            label: "Assign missing codes",
            detail: `${inventory.profilesWithNoCode.length} profiles`,
            icon: UserRoundX,
          },
          {
            href: "#duplicates",
            label: "Split duplicate codes",
            detail: `${inventory.duplicateCodes.length} shared strings`,
            icon: DatabaseZap,
          },
          {
            href: "#activity",
            label: "Match activity owners",
            detail: `${inventory.unresolvedActivity.length} unmatched`,
            icon: ClipboardCheck,
          },
          {
            href: "/admin/referrals/codes",
            label: "Open Code Registry",
            detail: "Edit or issue a code",
            icon: Plus,
          },
          {
            href: "#dry-run",
            label: "Canonical dry run",
            detail: "What a later backfill would do",
            icon: ShieldCheck,
          },
        ].map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={
                action.primary
                  ? "flex min-h-24 items-center gap-4 rounded-[1.6rem] px-5 py-4 text-white shadow-sm"
                  : "flex min-h-24 items-center gap-4 rounded-[1.6rem] border border-emerald-100 bg-white px-5 py-4 shadow-sm"
              }
              style={action.primary ? { background: "#0D5C3A" } : undefined}
            >
              <span
                className={
                  action.primary
                    ? "flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15"
                    : "flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-[#0D5C3A]"
                }
              >
                <Icon size={26} />
              </span>
              <span>
                <span
                  className={`block text-lg font-black ${
                    action.primary ? "!text-white" : "text-slate-950"
                  }`}
                >
                  {action.label}
                </span>
                <span
                  className={`mt-1 block text-sm font-semibold ${
                    action.primary ? "!text-white/85" : "text-slate-500"
                  }`}
                >
                  {action.detail}
                </span>
              </span>
            </Link>
          );
        })}
      </section>

      <div className="grid gap-4 md:grid-cols-2">
        <GrowthCard>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-black text-slate-950">Today’s cleanup</h2>
            <StatusPill value={workCount > 0 ? "Review" : "Ready"} />
          </div>
          <div className="mt-4 space-y-3">
            {inventory.openConflicts.length ? (
              <Link
                href="#conflicts"
                className="block rounded-2xl bg-rose-50 px-3 py-3 text-sm font-black text-rose-900"
              >
                {inventory.openConflicts.length} open PawPerks conflicts
              </Link>
            ) : null}
            {inventory.profilesWithNoCode.length ? (
              <Link
                href="#no-code"
                className="block rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-900"
              >
                {inventory.profilesWithNoCode.length} profiles still need a code
              </Link>
            ) : null}
            {inventory.duplicateCodes.length ? (
              <Link
                href="#duplicates"
                className="block rounded-2xl bg-violet-50 px-3 py-3 text-sm font-black text-violet-900"
              >
                {inventory.duplicateCodes.length} codes shared by more than one owner
              </Link>
            ) : null}
            {inventory.unresolvedActivity.length ? (
              <Link
                href="#activity"
                className="block rounded-2xl bg-sky-50 px-3 py-3 text-sm font-black text-sky-900"
              >
                {inventory.unresolvedActivity.length} activity rows without an owner
              </Link>
            ) : null}
            {workCount === 0 ? (
              <p className="text-sm font-semibold text-slate-500">
                Inventory is clean. Scan the dry-run report before any future
                backfill.
              </p>
            ) : null}
          </div>
        </GrowthCard>

        <GrowthCard>
          <h2 className="text-lg font-black text-slate-950">Canonical dry run</h2>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            What a later one-code-per-account backfill would do. No writes here.
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <p className="rounded-2xl bg-emerald-50 px-3 py-3 text-sm font-black text-emerald-900">
              {inventory.canonicalDryRunSummary.safeCanonicalCandidates} safe
            </p>
            <p className="rounded-2xl bg-amber-50 px-3 py-3 text-sm font-black text-amber-900">
              {inventory.canonicalDryRunSummary.missingCode} missing
            </p>
            <p className="rounded-2xl bg-violet-50 px-3 py-3 text-sm font-black text-violet-900">
              {inventory.canonicalDryRunSummary.multipleCodes} multiple
            </p>
            <p className="rounded-2xl bg-rose-50 px-3 py-3 text-sm font-black text-rose-900">
              {inventory.canonicalDryRunSummary.duplicateOwnership} duplicate
            </p>
          </div>
          <Link
            href="#dry-run"
            className="mt-4 inline-block text-sm font-black text-emerald-800"
          >
            Open dry-run detail →
          </Link>
        </GrowthCard>
      </div>

      <GrowthCard id="conflicts">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Open conflicts
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Decide these before SitGuru can keep one official code per
              account. This queue is read-only.
            </p>
          </div>
          <StatusPill
            value={
              inventory.openConflicts.length > 0 ? "Needs review" : "Ready"
            }
          />
        </div>
        <ConflictTable rows={inventory.openConflicts.slice(0, 250)} />
      </GrowthCard>

      <GrowthCard id="no-code">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Profiles with no code
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              Issue a PawPerks code from Registry for anyone still missing one.
            </p>
          </div>
          <Link
            href="/admin/referrals/codes#generate-code"
            className="text-sm font-black text-emerald-800"
          >
            Generate code →
          </Link>
        </div>
        <InventoryTable
          rows={inventory.profilesWithNoCode.slice(0, 100)}
          empty="Every scanned profile already has a code."
        />
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">
          Profiles with more than one code
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Keep the official code and retire extras in Registry.
        </p>
        <InventoryTable
          rows={inventory.profilesWithMultipleCodes.slice(0, 100)}
          empty="No scanned profile has more than one unique code."
        />
      </GrowthCard>

      <GrowthCard id="duplicates">
        <h2 className="text-lg font-black text-slate-950">
          Codes shared by more than one owner
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Split or retire these so each code belongs to one person.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Code</th>
                <th className="py-3 pr-4">Owners</th>
                <th className="py-3 pr-4">Sources</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.duplicateCodes.length ? (
                inventory.duplicateCodes.slice(0, 100).map((item) => (
                  <tr key={item.code} className="align-top">
                    <td className="py-3 pr-4 font-black text-slate-950">
                      {item.code}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">{item.owners}</td>
                    <td className="py-3 pr-4">
                      <CodeBadges codes={item.sources} />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="py-6 text-slate-500">
                    No code is shared by more than one owner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GrowthCard>

      <GrowthCard id="activity">
        <h2 className="text-lg font-black text-slate-950">
          Activity without an owner
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          These referral hits could not be matched to a SitGuru account.
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-500">
              <tr>
                <th className="py-3 pr-4">Code</th>
                <th className="py-3 pr-4">Reason</th>
                <th className="py-3 pr-4">Activity</th>
                <th className="py-3 pr-4">Referred email</th>
                <th className="py-3 pr-4">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inventory.unresolvedActivity.length ? (
                inventory.unresolvedActivity.map((item) => (
                  <tr key={item.id || `${item.code}:${item.createdAt}`}>
                    <td className="py-3 pr-4 font-black text-slate-950">
                      {item.code || "—"}
                    </td>
                    <td className="py-3 pr-4 text-rose-700">{item.reason}</td>
                    <td className="py-3 pr-4 text-slate-700">
                      {item.activityType || item.source || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-700">
                      {item.referredEmail || "—"}
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {item.createdAt || "—"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-slate-500">
                    Every scanned activity row already has an owner.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GrowthCard>

      <GrowthCard id="dry-run">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Canonical dry-run detail
            </h2>
            <p className="mt-1 text-sm font-semibold text-slate-500">
              What a later one-code-per-account backfill would do. This page
              does not write codes, aliases, or payouts.
            </p>
          </div>
          <StatusPill value="Read only" />
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          <AdminThemeCard
            label="Safe to keep"
            value={inventory.canonicalDryRunSummary.safeCanonicalCandidates}
            helper="One clean candidate"
            tone="emerald"
            icon={<CheckCircle2 size={18} />}
          />
          <AdminThemeCard
            label="Missing code"
            value={inventory.canonicalDryRunSummary.missingCode}
            helper="Would skip"
            tone="amber"
            icon={<SearchX size={18} />}
          />
          <AdminThemeCard
            label="Multiple codes"
            value={inventory.canonicalDryRunSummary.multipleCodes}
            helper="Would skip"
            tone="violet"
            icon={<Copy size={18} />}
          />
          <AdminThemeCard
            label="Duplicate owners"
            value={inventory.canonicalDryRunSummary.duplicateOwnership}
            helper="Would skip"
            tone="rose"
            icon={<Users size={18} />}
          />
          <AdminThemeCard
            label="Already official"
            value={inventory.canonicalDryRunSummary.canonicalCodeAlreadyExists}
            helper="Would skip"
            tone="sky"
            icon={<Link2 size={18} />}
          />
          <AdminThemeCard
            label="Name collision"
            value={
              inventory.canonicalDryRunSummary.aliasCanonicalCollisionExists
            }
            helper="Would skip"
            tone="slate"
            icon={<AlertTriangle size={18} />}
          />
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <DistributionCard
            title="Where official codes would come from"
            rows={inventory.canonicalDryRunSummary.canonicalSourceDistribution}
          />
          <DistributionCard
            title="Where aliases would come from"
            rows={inventory.canonicalDryRunSummary.aliasSourceDistribution}
          />
        </div>

        <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-slate-500">
          Latest dry-run rows
        </h3>
        <AuditTable rows={inventory.canonicalDryRunAuditRows.slice(0, 25)} />
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Recent audit</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Imported, flagged, and skipped decisions from the last cleanup pass.
        </p>
        <AuditTable rows={inventory.auditRows.slice(0, 25)} />
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">
          Scanned profiles
        </h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Referral profiles and any codes found on the account.
        </p>
        <InventoryTable
          rows={inventory.profiles.slice(0, 250)}
          empty="No referral profiles were available to scan."
        />
      </GrowthCard>

      <GrowthCard>
        <h2 className="text-lg font-black text-slate-950">Detected codes</h2>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Every code string found across profiles, ambassadors, registry, and
          Guru campaigns.
        </p>
        <CodeSourceTable rows={inventory.allCodes.slice(0, 250)} />
      </GrowthCard>
    </GrowthPageFrame>
  );
}

function InventoryTable({
  rows,
  empty,
}: {
  rows: ProfileInventory[];
  empty: string;
}) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-3 pr-4">Profile</th>
            <th className="py-3 pr-4">Role context</th>
            <th className="py-3 pr-4">Email</th>
            <th className="py-3 pr-4">Codes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((profile) => (
              <tr
                key={profile.profileId || profile.userId || profile.email}
                className="align-top"
              >
                <td className="py-3 pr-4">
                  <p className="font-black text-slate-950">
                    {profile.name || "Unnamed profile"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {profile.profileId || profile.userId || "No id"}
                  </p>
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {profile.roleContext}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {profile.email || "—"}
                </td>
                <td className="py-3 pr-4">
                  <CodeBadges codes={profile.codes} />
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={4} className="py-6 text-slate-500">
                {empty}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function DistributionCard({
  title,
  rows,
}: {
  title: string;
  rows: Record<string, number>;
}) {
  const entries = Object.entries(rows).sort(([a], [b]) => a.localeCompare(b));

  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-700">
        <TrendingUp className="h-4 w-4 text-emerald-600" /> {title}
      </h3>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs uppercase text-slate-500">
            <tr>
              <th className="py-2 pr-4">Table</th>
              <th className="py-2 pr-4">Count</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {entries.length ? (
              entries.map(([source, count]) => (
                <tr key={source}>
                  <td className="py-2 pr-4 font-bold text-slate-800">
                    {source}
                  </td>
                  <td className="py-2 pr-4 text-slate-700">
                    {count.toLocaleString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={2} className="py-4 text-slate-500">
                  No dry-run distribution data recorded.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CodeSourceTable({ rows }: { rows: CodeSource[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-3 pr-4">Code</th>
            <th className="py-3 pr-4">Source</th>
            <th className="py-3 pr-4">Role context</th>
            <th className="py-3 pr-4">Owner</th>
            <th className="py-3 pr-4">Status</th>
            <th className="py-3 pr-4">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((code) => (
              <tr
                key={`${code.source}:${code.sourceId}:${code.normalizedCode}`}
                className="align-top"
              >
                <td className="py-3 pr-4 font-black text-slate-950">
                  {code.code}
                </td>
                <td className="py-3 pr-4 text-slate-700">{code.source}</td>
                <td className="py-3 pr-4 text-slate-700">
                  {code.roleContext || code.ownerType || "Unknown"}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  <p>{code.ownerName || code.ownerId || "Unresolved owner"}</p>
                  <p className="text-xs text-slate-500">
                    {code.ownerEmail || code.ownerId || "—"}
                  </p>
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {code.status || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  {code.createdAt || "—"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="py-6 text-slate-500">
                No code records were detected in the scanned source tables.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function ConflictTable({ rows }: { rows: ReferralConflict[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-3 pr-4">Conflict type</th>
            <th className="py-3 pr-4">Normalized code</th>
            <th className="py-3 pr-4">Owner</th>
            <th className="py-3 pr-4">Source tables</th>
            <th className="py-3 pr-4">Recommended action</th>
            <th className="py-3 pr-4">Resolution</th>
            <th className="py-3 pr-4">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((conflict) => (
              <tr
                key={
                  conflict.id ||
                  `${conflict.conflictType}:${conflict.normalizedCode}:${conflict.createdAt}`
                }
                className="align-top"
              >
                <td className="py-3 pr-4 font-black text-slate-950">
                  {titleize(conflict.conflictType)}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {conflict.normalizedCode || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  <p>{conflict.ownerName || "Owner unavailable"}</p>
                  <p className="text-xs text-slate-500">
                    {conflict.ownerEmail || "—"}
                  </p>
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {conflict.sourceTables || "—"}
                </td>
                <td className="max-w-md py-3 pr-4 text-slate-700">
                  {conflict.recommendedAction}
                </td>
                <td className="py-3 pr-4 font-bold text-amber-700">
                  {titleize(conflict.resolutionStatus || "open")}
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  {conflict.createdAt || "—"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={7} className="py-6 text-slate-500">
                No open canonical PawPerks referral conflicts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function AuditTable({ rows }: { rows: ReferralAuditRow[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500">
          <tr>
            <th className="py-3 pr-4">Migration</th>
            <th className="py-3 pr-4">Batch ID</th>
            <th className="py-3 pr-4">Source table</th>
            <th className="py-3 pr-4">Source code</th>
            <th className="py-3 pr-4">Action</th>
            <th className="py-3 pr-4">Decision</th>
            <th className="py-3 pr-4">Reason</th>
            <th className="py-3 pr-4">Created</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? (
            rows.map((row) => (
              <tr
                key={
                  row.id ||
                  `${row.migrationName}:${row.sourceTable}:${row.sourceCode}:${row.createdAt}`
                }
                className="align-top"
              >
                <td className="py-3 pr-4 font-black text-slate-950">
                  {row.migrationName || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {row.batchId || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {row.sourceTable || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {row.sourceCode || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-700">
                  {row.action || "—"}
                </td>
                <td className="py-3 pr-4 font-bold text-slate-800">
                  {row.decision || "—"}
                </td>
                <td className="max-w-md py-3 pr-4 text-slate-700">
                  {row.reason || "—"}
                </td>
                <td className="py-3 pr-4 text-slate-500">
                  {row.createdAt || "—"}
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={8} className="py-6 text-slate-500">
                No PawPerks referral backfill audit rows found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
