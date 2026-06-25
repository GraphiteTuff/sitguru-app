import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  ClipboardCheck,
  Copy,
  DatabaseZap,
  Link2,
  SearchX,
  ShieldCheck,
  UserRoundX,
  Users,
} from "lucide-react";

import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type Row = Record<string, unknown>;

type CodeSource = {
  source: "referral_profiles" | "ambassadors" | "referral_codes" | "guru_referral_campaigns";
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
  return text(value).toUpperCase().replace(/[^A-Z0-9-_]/g, "");
}

function titleize(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleContext(row: Row, fallback = "Unknown") {
  const role = pick(row, ["role", "account_type", "owner_type", "program_type", "ambassador_type", "partner_type"]);
  const normalized = role.toLowerCase();

  if (["pet_parent", "pet owner", "pet_owner", "customer", "client"].includes(normalized)) return "Pet Parent";
  if (["guru", "sitter", "pet_guru", "pet guru"].includes(normalized)) return "Guru";
  if (normalized.includes("ambassador")) return "Ambassador";
  if (normalized.includes("partner") || normalized.includes("affiliate")) return "Partner/Affiliate";
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
  const ownerName = pick(row, ["display_name", "full_name", "name", "owner_name"]);
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
  const ownerName = pick(row, ["display_name", "full_name", "name", "first_name"]);

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
  const normalizedCode = normalizeCode(pick(row, ["normalized_code", "code", "slug", "referral_code"]));
  if (!normalizedCode) return null;

  const ownerId = pick(row, ["owner_user_id", "issued_to_user_id", "profile_id", "ambassador_id", "partner_id", "id"]);
  const ownerEmail = pick(row, ["owner_email", "issued_to_email", "email"]);
  const ownerName = pick(row, ["owner_name", "issued_to_name", "name", "display_name"]);
  const ownerType = roleContext(row, titleize(pick(row, ["owner_type", "issued_to_type"]) || "Unknown"));

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
  const ownerName = pick(row, ["guru_name", "display_name", "full_name", "name", "campaign_name"]);

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
    [code.ownerId, code.ownerEmail, code.sourceId].some((value) => value && keys.has(value)),
  );

  return { profileId, userId, name, email, roleContext: context, codes };
}

function buildActivityIssues(activityRows: Row[], codeMap: Map<string, CodeSource[]>): ActivityIssue[] {
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
            : owners.every((owner) => !owner.ownerId && !owner.ownerEmail && !owner.ownerName)
              ? "Matched code has no owner fields"
              : "";

      if (!reason) return null;

      return {
        id: pick(row, ["id"]),
        code,
        activityType: pick(row, ["activity_type", "conversion_stage", "conversion_status", "status"]),
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
  const [profilesResult, ambassadorsResult, referralCodesResult, guruCampaignsResult, activityResult] =
    await Promise.all([
      safeRows("referral_profiles"),
      safeRows("ambassadors"),
      safeRows("referral_codes"),
      safeRows("guru_referral_campaigns"),
      safeRows("referral_activity"),
    ]);

  const profileCodes = profilesResult.rows.map(codeFromProfile).filter(Boolean) as CodeSource[];
  const ambassadorCodes = ambassadorsResult.rows.map(codeFromAmbassador).filter(Boolean) as CodeSource[];
  const referralCodes = referralCodesResult.rows.map(codeFromReferralCode).filter(Boolean) as CodeSource[];
  const guruCampaignCodes = guruCampaignsResult.rows.map(codeFromGuruCampaign).filter(Boolean) as CodeSource[];
  const allCodes = [...profileCodes, ...ambassadorCodes, ...referralCodes, ...guruCampaignCodes];

  const codeMap = allCodes.reduce((map, code) => {
    const list = map.get(code.normalizedCode) || [];
    list.push(code);
    map.set(code.normalizedCode, list);
    return map;
  }, new Map<string, CodeSource[]>());

  const profiles = profilesResult.rows.map((row) => profileFromRow(row, allCodes));
  const profilesWithNoCode = profiles.filter((profile) => profile.codes.length === 0);
  const profilesWithMultipleCodes = profiles.filter(
    (profile) => new Set(profile.codes.map((code) => code.normalizedCode)).size > 1,
  );
  const duplicateCodes = Array.from(codeMap.entries())
    .map(([code, sources]) => ({ code, sources, owners: new Set(sources.map((source) => source.ownerKey)).size }))
    .filter((item) => item.owners > 1)
    .sort((a, b) => b.owners - a.owners || a.code.localeCompare(b.code));
  const unresolvedActivity = buildActivityIssues(activityResult.rows, codeMap);

  const warnings = [profilesResult, ambassadorsResult, referralCodesResult, guruCampaignsResult, activityResult]
    .map((result, index) => ({
      table: ["referral_profiles", "ambassadors", "referral_codes", "guru_referral_campaigns", "referral_activity"][index],
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
    warnings,
  };
}

function StatCard({ title, value, detail, icon: Icon }: { title: string; value: number; detail: string; icon: typeof Users }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-black text-slate-950">{value.toLocaleString()}</p>
        </div>
        <Icon className="h-8 w-8 text-emerald-600" />
      </div>
      <p className="mt-3 text-sm text-slate-600">{detail}</p>
    </div>
  );
}

function CodeBadges({ codes }: { codes: CodeSource[] }) {
  if (!codes.length) return <span className="text-sm text-rose-700">No code found</span>;

  return (
    <div className="flex flex-wrap gap-2">
      {codes.map((code) => (
        <span key={`${code.source}:${code.sourceId}:${code.normalizedCode}`} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
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
        <Link href="/admin/referrals" className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900">
          <ArrowLeft className="h-4 w-4" /> Back to Growth & Referrals
        </Link>

        <section className="rounded-[2rem] bg-slate-950 p-8 text-white shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <p className="inline-flex items-center gap-2 rounded-full bg-emerald-400/10 px-4 py-2 text-sm font-bold text-emerald-200">
                <ShieldCheck className="h-4 w-4" /> Admin-only read-only cleanup report
              </p>
              <h1 className="mt-5 text-4xl font-black tracking-tight">PawPerks referral inventory report</h1>
              <p className="mt-4 text-lg text-slate-200">
                This is a read-only PawPerks cleanup report. It does not change referral codes, signup behavior, generation behavior, payouts, or referral program operations. PawPerks is SitGuru’s branded referral/rewards program for Pet Parents, Gurus, Ambassadors, and multi-role accounts; PetPerks appears here only as a legacy/alternate label where existing tables or code already use it. Use this report to prepare SitGuru for the future one-code-per-account PawPerks system.
              </p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/10 p-5 text-sm text-slate-100">
              <p className="font-black uppercase tracking-wide text-emerald-200">Sources read</p>
              <p className="mt-3">referral_profiles, ambassadors, referral_codes, guru_referral_campaigns, and referral_activity. Reads are inventory-only; no database rows are inserted, updated, or deleted.</p>
            </div>
          </div>
        </section>

        {inventory.warnings.length > 0 ? (
          <section className="rounded-3xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="font-black">Some optional referral inventory reads were skipped or limited by Supabase:</p>
            <ul className="mt-2 list-disc pl-5">
              {inventory.warnings.map((warning) => (
                <li key={warning.table}>{warning.table}: {warning.error}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard title="Profiles scanned" value={inventory.profiles.length} detail="Rows from referral_profiles." icon={Users} />
          <StatCard title="Codes found" value={inventory.allCodes.length} detail="Existing PawPerks/PetPerks codes across all inventory sources." icon={Link2} />
          <StatCard title="No code" value={inventory.profilesWithNoCode.length} detail="Profiles without a detected code." icon={UserRoundX} />
          <StatCard title="Multiple codes" value={inventory.profilesWithMultipleCodes.length} detail="Profiles with more than one unique code." icon={Copy} />
          <StatCard title="Duplicate codes" value={inventory.duplicateCodes.length} detail="Code strings shared by different owners." icon={AlertTriangle} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black"><Users className="h-6 w-6 text-emerald-600" /> All scanned PawPerks profiles and detected codes</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Inventory view of referral_profiles with any matched code from referral_profiles, ambassadors, referral_codes, or guru_referral_campaigns.
          </p>
          <InventoryTable rows={inventory.profiles.slice(0, 250)} empty="No referral_profiles rows were available to scan." />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black"><Link2 className="h-6 w-6 text-blue-600" /> All detected PawPerks/PetPerks code records</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            Read-only list of referral code strings found directly in referral_profiles, ambassadors, referral_codes, and guru_referral_campaigns, including available owner and role context.
          </p>
          <CodeSourceTable rows={inventory.allCodes.slice(0, 250)} />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black"><SearchX className="h-6 w-6 text-rose-600" /> Profiles with no referral code found</h2>
          <InventoryTable rows={inventory.profilesWithNoCode.slice(0, 100)} empty="Every scanned profile has at least one detected code." />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black"><Copy className="h-6 w-6 text-amber-600" /> Profiles with multiple referral codes found</h2>
          <InventoryTable rows={inventory.profilesWithMultipleCodes.slice(0, 100)} empty="No scanned profile has multiple unique referral codes." />
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black"><DatabaseZap className="h-6 w-6 text-purple-600" /> Duplicate code strings across owners</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Code</th><th className="py-3 pr-4">Owners</th><th className="py-3 pr-4">Sources</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.duplicateCodes.length ? inventory.duplicateCodes.slice(0, 100).map((item) => (
                  <tr key={item.code} className="align-top">
                    <td className="py-3 pr-4 font-black text-slate-950">{item.code}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.owners}</td>
                    <td className="py-3 pr-4"><CodeBadges codes={item.sources} /></td>
                  </tr>
                )) : <tr><td colSpan={3} className="py-6 text-slate-500">No duplicate code strings found across different owners.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 text-2xl font-black"><ClipboardCheck className="h-6 w-6 text-blue-600" /> Referral activity that cannot resolve to an owner</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Code</th><th className="py-3 pr-4">Reason</th><th className="py-3 pr-4">Activity</th><th className="py-3 pr-4">Referred email</th><th className="py-3 pr-4">Created</th></tr></thead>
              <tbody className="divide-y divide-slate-100">
                {inventory.unresolvedActivity.length ? inventory.unresolvedActivity.map((item) => (
                  <tr key={item.id || `${item.code}:${item.createdAt}`}>
                    <td className="py-3 pr-4 font-black text-slate-950">{item.code || "—"}</td>
                    <td className="py-3 pr-4 text-rose-700">{item.reason}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.activityType || item.source || "—"}</td>
                    <td className="py-3 pr-4 text-slate-700">{item.referredEmail || "—"}</td>
                    <td className="py-3 pr-4 text-slate-500">{item.createdAt || "—"}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="py-6 text-slate-500">No unresolved referral activity found in the scanned rows.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function InventoryTable({ rows, empty }: { rows: ProfileInventory[]; empty: string }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Profile</th><th className="py-3 pr-4">Role context</th><th className="py-3 pr-4">Email</th><th className="py-3 pr-4">Codes</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((profile) => (
            <tr key={profile.profileId || profile.userId || profile.email} className="align-top">
              <td className="py-3 pr-4"><p className="font-black text-slate-950">{profile.name || "Unnamed profile"}</p><p className="text-xs text-slate-500">{profile.profileId || profile.userId || "No id"}</p></td>
              <td className="py-3 pr-4 text-slate-700">{profile.roleContext}</td>
              <td className="py-3 pr-4 text-slate-700">{profile.email || "—"}</td>
              <td className="py-3 pr-4"><CodeBadges codes={profile.codes} /></td>
            </tr>
          )) : <tr><td colSpan={4} className="py-6 text-slate-500">{empty}</td></tr>}
        </tbody>
      </table>
    </div>
  );
}


function CodeSourceTable({ rows }: { rows: CodeSource[] }) {
  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-left text-sm">
        <thead className="text-xs uppercase text-slate-500"><tr><th className="py-3 pr-4">Code</th><th className="py-3 pr-4">Source</th><th className="py-3 pr-4">Role context</th><th className="py-3 pr-4">Owner</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Created</th></tr></thead>
        <tbody className="divide-y divide-slate-100">
          {rows.length ? rows.map((code) => (
            <tr key={`${code.source}:${code.sourceId}:${code.normalizedCode}`} className="align-top">
              <td className="py-3 pr-4 font-black text-slate-950">{code.code}</td>
              <td className="py-3 pr-4 text-slate-700">{code.source}</td>
              <td className="py-3 pr-4 text-slate-700">{code.roleContext || code.ownerType || "Unknown"}</td>
              <td className="py-3 pr-4 text-slate-700"><p>{code.ownerName || code.ownerId || "Unresolved owner"}</p><p className="text-xs text-slate-500">{code.ownerEmail || code.ownerId || "—"}</p></td>
              <td className="py-3 pr-4 text-slate-700">{code.status || "—"}</td>
              <td className="py-3 pr-4 text-slate-500">{code.createdAt || "—"}</td>
            </tr>
          )) : <tr><td colSpan={6} className="py-6 text-slate-500">No code records were detected in the scanned source tables.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
