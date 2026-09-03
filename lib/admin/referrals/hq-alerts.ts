import { supabaseAdmin } from "@/lib/supabase/admin";
import { isAdminRole } from "@/lib/admin/access";
import { SUPER_USER_EMAILS } from "@/lib/admin/super-users";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function deskHref(program: string, code: string) {
  const normalized = program.toLowerCase();
  if (normalized.includes("guru")) return `/admin/referrals/gurus?q=${encodeURIComponent(code)}`;
  if (normalized.includes("ambassador")) {
    return `/admin/referrals/ambassadors?q=${encodeURIComponent(code)}`;
  }
  if (normalized.includes("partner") || normalized.includes("clinic")) {
    return `/admin/referrals/partners?q=${encodeURIComponent(code)}`;
  }
  return `/admin/referrals/pet-parents?q=${encodeURIComponent(code)}`;
}

export async function listHqRecipientIds() {
  const [roleRows, adminProfiles, founderProfiles] = await Promise.all([
    supabaseAdmin.from("user_roles").select("user_id, role").limit(2000),
    supabaseAdmin.from("profiles").select("id, role").eq("role", "admin").limit(80),
    supabaseAdmin
      .from("profiles")
      .select("id")
      .in("email", [...SUPER_USER_EMAILS])
      .limit(10),
  ]);

  const ids = new Set<string>();

  for (const row of (roleRows.data || []) as AnyRow[]) {
    if (isAdminRole(text(row.role))) {
      const id = text(row.user_id);
      if (id) ids.add(id);
    }
  }

  for (const row of [
    ...((adminProfiles.data || []) as AnyRow[]),
    ...((founderProfiles.data || []) as AnyRow[]),
  ]) {
    const id = text(row.id);
    if (id) ids.add(id);
  }

  return Array.from(ids);
}

export async function notifyHqReferralAttributed(input: {
  code: string;
  referredName?: string | null;
  referredEmail?: string | null;
  referredRole?: string | null;
  ownerName?: string | null;
  ownerType?: string | null;
  program?: string | null;
}) {
  const code = text(input.code).toUpperCase();
  if (!code) return { notified: 0 };

  const adminIds = await listHqRecipientIds();
  if (!adminIds.length) return { notified: 0 };

  const person =
    text(input.referredName) ||
    text(input.referredEmail) ||
    "A new SitGuru member";
  const owner = text(input.ownerName) || "an unassigned code";
  const role = text(input.referredRole) || "member";
  const href = deskHref(text(input.program || input.ownerType), code);
  const title = "Referral signup captured";
  const body = `${person} joined as ${role} using ${code} (${owner}). Review reward eligibility.`;
  const now = new Date().toISOString();

  const since = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, href, body")
    .eq("type", "referral_signup")
    .gte("created_at", since)
    .limit(400);

  const already = new Set(
    ((existing || []) as AnyRow[])
      .filter((row) => text(row.href) === href && text(row.body) === body)
      .map((row) => text(row.user_id)),
  );

  const rows = adminIds
    .filter((userId) => !already.has(userId))
    .map((userId) => ({
      user_id: userId,
      title,
      body,
      type: "referral_signup",
      href,
      link: href,
      is_read: false,
      created_at: now,
      updated_at: now,
    }));

  if (!rows.length) return { notified: 0 };

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) {
    console.warn("Referral HQ notification skipped:", error.message);
    return { notified: 0 };
  }

  return { notified: rows.length };
}
