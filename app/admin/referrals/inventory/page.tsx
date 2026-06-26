import Link from "next/link";
import {
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  ClipboardCheck,
  Copy,
  DatabaseZap,
  Link2,
  SearchX,
  ShieldCheck,
  TableProperties,
  TrendingUp,
  UserRoundX,
  Users,
} from "lucide-react";

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

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
}: {
  title: string;
  value: number;
  detail: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">
            {value.toLocaleString()}
          </p>
        </div>
        <Icon className="h-8 w-8 text-emerald-600" />
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
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
  const inventory = await getInventory();

  return (
    <main className="min-h-screen bg-slate-50 px-6 py-8 text-slate-900 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <Link
          href="/admin/referrals"
          className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Growth & Referrals
        </Link>

        <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                <ShieldCheck className="h-4 w-4" /> Admin-only read-only cleanup
                report
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight">
                PawPerks referral inventory report
              </h1>
              <p className="mt-4 text-lg text-slate-200">
                This is a read-only PawPerks cleanup report. It does not change
                referral codes, signup behavior, generation behavior, payouts,
                or referral program operations. PawPerks is SitGuru’s branded
                referral/rewards program for Pet Parents, Gurus, Ambassadors,
                and multi-role accounts; PetPerks appears here only as a
                legacy/alternate label where existing tables or code already use
                it. Use this report to prepare SitGuru for the future
                one-code-per-account PawPerks system.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-slate-100">
              <p className="font-black uppercase tracking-wide text-emerald-200">
                Sources read
              </p>
              <p className="mt-3">
                pawperks_referral_conflicts and
                pawperks_referral_backfill_audit, plus legacy inventory tables
                for comparison. Reads are inventory-only; no database rows are
                inserted, updated, or deleted.
              </p>
            </div>
          </div>
        </section>

        {inventory.warnings.length > 0 ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-black">
              Some optional referral inventory reads were skipped or limited by
              Supabase:
            </p>
            <ul className="mt-2 list-disc pl-5">
              {inventory.warnings.map((warning) => (
                <li key={warning.table}>
                  {warning.table}: {warning.error}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Open conflicts"
            value={inventory.openConflicts.length}
            detail="Canonical conflict rows with open/reviewing status."
            icon={AlertTriangle}
          />
          <StatCard
            title="Resolved conflicts"
            value={inventory.resolvedConflicts.length}
            detail="Canonical conflict rows marked resolved or ignored."
            icon={CheckCircle2}
          />
          <StatCard
            title="Profiles with no code"
            value={inventory.canonicalProfilesWithNoCode.length}
            detail="missing_legacy_referral_code conflicts."
            icon={UserRoundX}
          />
          <StatCard
            title="Profiles with multiple codes"
            value={inventory.canonicalProfilesWithMultipleCodes.length}
            detail="multiple_legacy_referral_codes conflicts."
            icon={Copy}
          />
          <StatCard
            title="Duplicate codes across owners"
            value={inventory.canonicalDuplicateCodes.length}
            detail="duplicate_legacy_referral_code conflicts."
            icon={DatabaseZap}
          />
          <StatCard
            title="Unresolved owners/activity"
            value={inventory.canonicalUnresolvedActivity.length}
            detail="unresolved_referral_activity conflicts."
            icon={ClipboardCheck}
          />
          <StatCard
            title="Audit imported/flagged/skipped"
            value={
              inventory.auditImported +
              inventory.auditFlagged +
              inventory.auditSkipped
            }
            detail={`${inventory.auditImported.toLocaleString()} imported · ${inventory.auditFlagged.toLocaleString()} flagged · ${inventory.auditSkipped.toLocaleString()} skipped`}
            icon={TableProperties}
          />
          <StatCard
            title="Audit rows"
            value={inventory.auditRows.length}
            detail="Rows read from pawperks_referral_backfill_audit."
            icon={ShieldCheck}
          />
        </section>

        <section className="rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="flex items-center gap-2 text-2xl font-black">
                <ShieldCheck className="h-6 w-6 text-emerald-600" /> Canonical
                Backfill Dry Run
              </h2>
              <p className="mt-2 text-sm font-semibold text-slate-600">
                Read-only validation report from
                pawperks_referral_backfill_audit. These counts describe what a
                later write-enabled canonical code and alias backfill would do;
                this admin page does not create, approve, or mutate referral
                records.
              </p>
            </div>
            <span className="rounded-full bg-emerald-50 px-4 py-2 text-xs font-black uppercase tracking-wide text-emerald-700">
              Dry-run results only
            </span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Safe canonical candidates"
              value={inventory.canonicalDryRunSummary.safeCanonicalCandidates}
              detail="Profiles with exactly one safe canonical PawPerks code candidate."
              icon={CheckCircle2}
            />
            <StatCard
              title="Skipped: missing code"
              value={inventory.canonicalDryRunSummary.missingCode}
              detail="Profiles without a readable source referral code."
              icon={SearchX}
            />
            <StatCard
              title="Skipped: multiple codes"
              value={inventory.canonicalDryRunSummary.multipleCodes}
              detail="Profiles with more than one distinct source code."
              icon={Copy}
            />
            <StatCard
              title="Skipped: duplicate ownership"
              value={inventory.canonicalDryRunSummary.duplicateOwnership}
              detail="Candidate code is associated with more than one owner."
              icon={Users}
            />
            <StatCard
              title="Skipped: canonical exists"
              value={
                inventory.canonicalDryRunSummary.canonicalCodeAlreadyExists
              }
              detail="Canonical PawPerks code already exists for the profile/code."
              icon={Link2}
            />
            <StatCard
              title="Skipped: alias/canonical collision"
              value={
                inventory.canonicalDryRunSummary.aliasCanonicalCollisionExists
              }
              detail="Candidate collides with an existing canonical code or alias."
              icon={AlertTriangle}
            />
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <DistributionCard
              title="Proposed canonical source distribution by table"
              rows={
                inventory.canonicalDryRunSummary.canonicalSourceDistribution
              }
            />
            <DistributionCard
              title="Proposed alias source distribution by table"
              rows={inventory.canonicalDryRunSummary.aliasSourceDistribution}
            />
          </div>

          <div className="mt-6">
            <h3 className="flex items-center gap-2 text-lg font-black text-slate-950">
              <TableProperties className="h-5 w-5 text-purple-600" /> Recent
              dry-run audit rows
            </h3>
            <AuditTable
              rows={inventory.canonicalDryRunAuditRows.slice(0, 25)}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <AlertTriangle className="h-6 w-6 text-amber-600" /> Open canonical
            PawPerks referral conflicts
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Read-only rows from pawperks_referral_conflicts that need review
            before canonical code backfill. No approve or resolve actions are
            available here yet.
          </p>
          <ConflictTable rows={inventory.openConflicts.slice(0, 250)} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <TableProperties className="h-6 w-6 text-purple-600" /> Recent
            PawPerks referral backfill audit
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Latest read-only audit entries from pawperks_referral_backfill_audit
            for imported, flagged, skipped, and recorded cleanup decisions.
          </p>
          <AuditTable rows={inventory.auditRows.slice(0, 25)} />
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard
            title="Legacy profiles scanned"
            value={inventory.profiles.length}
            detail="Rows from referral_profiles."
            icon={Users}
          />
          <StatCard
            title="Legacy codes found"
            value={inventory.allCodes.length}
            detail="Existing PawPerks/PetPerks codes across legacy inventory sources."
            icon={Link2}
          />
          <StatCard
            title="Legacy no code"
            value={inventory.profilesWithNoCode.length}
            detail="Profiles without a detected legacy code."
            icon={UserRoundX}
          />
          <StatCard
            title="Legacy multiple codes"
            value={inventory.profilesWithMultipleCodes.length}
            detail="Profiles with more than one unique legacy code."
            icon={Copy}
          />
          <StatCard
            title="Legacy duplicate codes"
            value={inventory.duplicateCodes.length}
            detail="Legacy code strings shared by different owners."
            icon={AlertTriangle}
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Users className="h-6 w-6 text-emerald-600" /> All scanned PawPerks
            profiles and detected codes
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Inventory view of referral_profiles with any matched code from
            referral_profiles, ambassadors, referral_codes, or
            guru_referral_campaigns.
          </p>
          <InventoryTable
            rows={inventory.profiles.slice(0, 250)}
            empty="No referral_profiles rows were available to scan."
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Link2 className="h-6 w-6 text-blue-600" /> All detected
            PawPerks/PetPerks code records
          </h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Read-only list of referral code strings found directly in
            referral_profiles, ambassadors, referral_codes, and
            guru_referral_campaigns, including available owner and role context.
          </p>
          <CodeSourceTable rows={inventory.allCodes.slice(0, 250)} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <SearchX className="h-6 w-6 text-rose-600" /> Profiles with no
            referral code found
          </h2>
          <InventoryTable
            rows={inventory.profilesWithNoCode.slice(0, 100)}
            empty="Every scanned profile has at least one detected code."
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <Copy className="h-6 w-6 text-amber-600" /> Profiles with multiple
            referral codes found
          </h2>
          <InventoryTable
            rows={inventory.profilesWithMultipleCodes.slice(0, 100)}
            empty="No scanned profile has multiple unique referral codes."
          />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <DatabaseZap className="h-6 w-6 text-purple-600" /> Duplicate code
            strings across owners
          </h2>
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
                      <td className="py-3 pr-4 text-slate-700">
                        {item.owners}
                      </td>
                      <td className="py-3 pr-4">
                        <CodeBadges codes={item.sources} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-slate-500">
                      No duplicate code strings found across different owners.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black">
            <ClipboardCheck className="h-6 w-6 text-blue-600" /> Referral
            activity that cannot resolve to an owner
          </h2>
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
                      No unresolved referral activity found in the scanned rows.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
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
