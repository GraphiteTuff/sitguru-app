import { supabaseAdmin } from "@/lib/supabase/admin";
import { listHqRecipientIds } from "@/lib/admin/referrals/hq-alerts";

type AnyRow = Record<string, unknown>;

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export type HqSignupRole = "pet_parent" | "guru" | "ambassador" | "both" | string;

export async function notifyHqInbound(input: {
  type: string;
  title: string;
  body: string;
  href: string;
}) {
  const type = text(input.type) || "signup";
  const title = text(input.title) || "New SitGuru signup";
  const body = text(input.body) || "Someone just joined SitGuru.";
  const href = text(input.href) || "/admin";
  const now = new Date().toISOString();

  const adminIds = await listHqRecipientIds();
  if (!adminIds.length) return { notified: 0 };

  const since = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from("notifications")
    .select("id, user_id, href, type")
    .eq("type", type)
    .gte("created_at", since)
    .limit(400);

  const already = new Set(
    ((existing || []) as AnyRow[])
      .filter((row) => text(row.href) === href)
      .map((row) => text(row.user_id)),
  );

  const rows = adminIds
    .filter((userId) => !already.has(userId))
    .map((userId) => ({
      user_id: userId,
      title,
      body,
      type,
      href,
      link: href,
      is_read: false,
      created_at: now,
      updated_at: now,
    }));

  if (!rows.length) return { notified: 0 };

  const { error } = await supabaseAdmin.from("notifications").insert(rows);
  if (error) {
    console.warn("HQ inbound notification skipped:", error.message);
    return { notified: 0 };
  }

  return { notified: rows.length };
}

function signupCopy(role: HqSignupRole) {
  if (role === "guru") {
    return {
      type: "guru_signup",
      title: "New Guru registered",
      noun: "Guru",
    };
  }
  if (role === "ambassador") {
    return {
      type: "ambassador_signup",
      title: "New Ambassador registered",
      noun: "Ambassador",
    };
  }
  if (role === "both") {
    return {
      type: "guru_signup",
      title: "New Pet Parent + Guru registered",
      noun: "Pet Parent + Guru",
    };
  }
  if (role === "partner") {
    return {
      type: "partner_application",
      title: "New partner application",
      noun: "Partner",
    };
  }
  return {
    type: "pet_parent_signup",
    title: "New Pet Parent registered",
    noun: "Pet Parent",
  };
}

function signupHref(input: {
  role: HqSignupRole;
  userId?: string;
  guruId?: string;
}) {
  const lookup = text(input.userId);
  if (input.role === "guru" && text(input.guruId)) {
    return `/admin/gurus/${encodeURIComponent(text(input.guruId))}`;
  }
  if (input.role === "guru") {
    return lookup
      ? `/admin/account-lifecycle/${encodeURIComponent(lookup)}`
      : "/admin/guru-approvals";
  }
  if (input.role === "ambassador" || input.role === "both") {
    return lookup
      ? `/admin/account-lifecycle/${encodeURIComponent(lookup)}`
      : "/admin/account-lifecycle";
  }
  if (input.role === "partner") {
    return "/admin/partners/applications";
  }
  return lookup ? `/admin/petparents/${encodeURIComponent(lookup)}` : "/admin/petparents#new";
}

export async function notifyHqNewSignup(input: {
  role: HqSignupRole;
  userId?: string;
  guruId?: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  const role = text(input.role) || "pet_parent";
  const copy = signupCopy(role);
  const href = signupHref({ role, userId: input.userId, guruId: input.guruId });
  const name = text(input.name) || "A new SitGuru member";
  const contact = text(input.email) || text(input.phone) || "No contact yet";

  return notifyHqInbound({
    type: copy.type,
    title: copy.title,
    body: `${name} just joined SitGuru as a ${copy.noun}. ${contact}`,
    href,
  });
}

export async function notifyHqPartnerApplication(input: {
  id?: string;
  applicantType?: string;
  name: string;
  businessName?: string;
  email?: string;
  phone?: string;
}) {
  const kind = text(input.applicantType).replace(/_/g, " ") || "partner";
  const who = text(input.businessName) || text(input.name) || "A new partner";
  const contact = text(input.email) || text(input.phone) || "No contact yet";
  const href = text(input.id)
    ? `/admin/partners/applications/${encodeURIComponent(text(input.id))}`
    : "/admin/partners/applications";

  return notifyHqInbound({
    type: "partner_application",
    title: `New ${kind} application`,
    body: `${who} applied as a ${kind}. ${contact}`,
    href,
  });
}

export async function notifyHqCareerApplication(input: {
  id?: string;
  program: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  const program = text(input.program) || "career";
  const label =
    program === "student-hire"
      ? "Student Hire"
      : program === "community-hire"
        ? "Community Hire"
        : program === "veterans-hire"
          ? "Veterans & Military Families"
          : program === "skillbridge-interest"
            ? "SkillBridge"
            : program === "ambassador-program"
              ? "Ambassador Program"
              : program.replace(/-/g, " ");
  const isAmbassador = program === "ambassador-program";
  const who = text(input.name) || "A new applicant";
  const contact = text(input.email) || text(input.phone) || "No contact yet";
  const href = text(input.id)
    ? `/admin/program-applications?program=${encodeURIComponent(program)}&id=${encodeURIComponent(text(input.id))}`
    : `/admin/program-applications?program=${encodeURIComponent(program)}`;

  return notifyHqInbound({
    type: isAmbassador ? "ambassador_application" : "career_application",
    title: isAmbassador ? "New Ambassador application" : `New ${label} application`,
    body: `${who} applied to ${label}. ${contact}`,
    href,
  });
}

export async function notifyHqLaunchSignup(input: {
  name: string;
  email?: string;
  phone?: string;
  interestType?: string;
}) {
  const who = text(input.name) || "A new waitlist signup";
  const interest = text(input.interestType) || "customer";
  const contact = text(input.email) || text(input.phone) || "No contact yet";

  return notifyHqInbound({
    type: "launch_signup",
    title: "New launch waitlist signup",
    body: `${who} joined the launch list as ${interest}. ${contact}`,
    href: "/admin/sales-marketing/signup-leads",
  });
}

export async function notifyHqNewPetParent(input: {
  userId?: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  return notifyHqNewSignup({
    role: "pet_parent",
    userId: input.userId,
    name: input.name,
    email: input.email,
    phone: input.phone,
  });
}

export async function notifyHqNewGuru(input: {
  userId?: string;
  guruId?: string;
  name: string;
  email?: string;
  phone?: string;
}) {
  return notifyHqNewSignup({
    role: "guru",
    userId: input.userId,
    guruId: input.guruId,
    name: input.name,
    email: input.email,
    phone: input.phone,
  });
}
