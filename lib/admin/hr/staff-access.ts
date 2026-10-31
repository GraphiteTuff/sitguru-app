import { GROWTH_HIRE_ROLE, GROWTH_HIRE_TITLE } from "@/lib/admin/growth/hire";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { displayUniversityName } from "@/lib/internship/team-roster";
import { lifecycleLabel } from "@/lib/internship/assignment";

export function staffAccessPath(userId: string) {
  return `/admin/hr/staff/${encodeURIComponent(userId)}/access`;
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function formatWhen(value?: string | null) {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export type StaffAccessRoleFlag = {
  key: "parent" | "ambassador" | "manager" | "intern_preview" | "admin";
  label: string;
  enabled: boolean;
  detail: string;
};

export type StaffAssignedIntern = {
  id: string;
  fullName: string;
  universityName: string;
  status: string;
  statusLabel: string;
};

export type StaffAccessAuditRow = {
  id: string;
  action: string;
  createdAt: string;
  actorEmail: string;
};

export type StaffAccessSnapshot = {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  jobTitle: string;
  hireType: string;
  startDate: string;
  memberSince: string;
  lastSignIn: string | null;
  accountActive: boolean;
  emailVerified: boolean | null;
  managerPortalActive: boolean;
  canManageInterns: boolean;
  roles: StaffAccessRoleFlag[];
  assignedInterns: StaffAssignedIntern[];
  onboarding: { label: string; done: boolean; tone: "done" | "pending" | "progress" }[];
  microsoft: {
    status: string;
    detail: string;
  };
  activity: StaffAccessAuditRow[];
  accessRecordId: string | null;
};

const FORBIDDEN_STAFF_ROLES = new Set([
  "admin",
  "super_admin",
  "super_user",
  "founder",
  "owner",
  "finance_admin",
  "hr_admin",
]);

export function isForbiddenStaffRole(role: string) {
  return FORBIDDEN_STAFF_ROLES.has(String(role || "").trim().toLowerCase());
}

export async function loadStaffAccessSnapshot(
  userId: string,
): Promise<StaffAccessSnapshot | null> {
  const id = String(userId || "").trim();
  if (!id) return null;

  const [profileRes, accessRes, rolesRes, eligibilityRes, hrRes, internsRes, auditRes, authRes] =
    await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id,email,full_name,phone,city,state,is_active,created_at,role")
        .eq("id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("admin_user_access")
        .select("id,email,role_key,is_active,assigned_at,notes,deactivated_at")
        .eq("user_id", id)
        .eq("role_key", GROWTH_HIRE_ROLE)
        .order("assigned_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", id),
      supabaseAdmin
        .from("internship_staff_eligibility")
        .select("can_manage_interns,can_supervise_interns,job_title")
        .eq("user_id", id)
        .maybeSingle(),
      supabaseAdmin
        .from("hr_employees")
        .select("role_title,employment_status,location,start_date")
        .eq("profile_id", id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("internship_interns")
        .select("id,full_name,status,university_id")
        .eq("manager_user_id", id)
        .not("status", "in", "(withdrawn,archived)"),
      supabaseAdmin
        .from("admin_audit_logs")
        .select("id,action,actor_email,created_at,target_id")
        .eq("target_id", id)
        .order("created_at", { ascending: false })
        .limit(12),
      supabaseAdmin.auth.admin.getUserById(id),
    ]);

  const profile = profileRes.data;
  const access = accessRes.data;
  if (!profile?.id && !access?.id && !authRes.data?.user?.id) return null;

  const authUser = authRes.data?.user || null;
  const email =
    text(profile?.email).toLowerCase() ||
    text(access?.email).toLowerCase() ||
    text(authUser?.email).toLowerCase();
  const fullName =
    text(profile?.full_name) ||
    text(authUser?.user_metadata?.full_name) ||
    email.split("@")[0] ||
    "Staff member";

  const roleSet = new Set(
    (rolesRes.data || [])
      .map((row) => text(row.role).toLowerCase())
      .filter(Boolean),
  );
  if (text(profile?.role)) roleSet.add(text(profile?.role).toLowerCase());

  const managerPortalActive = access?.is_active === true;
  const canManageInterns = eligibilityRes.data?.can_manage_interns === true;
  const hasParent = [...roleSet].some(
    (role) => role === "customer" || role === "parent" || role.includes("pet_parent"),
  );
  const hasAmbassador = [...roleSet].some((role) => role.includes("ambassador"));
  const hasAdmin = [...roleSet].some((role) => isForbiddenStaffRole(role) || role === "admin");

  const universityIds = [
    ...new Set(
      (internsRes.data || [])
        .map((row) => text(row.university_id))
        .filter(Boolean),
    ),
  ];
  const { data: universities } = universityIds.length
    ? await supabaseAdmin.from("internship_universities").select("id,name").in("id", universityIds)
    : { data: [] as { id: string; name: string }[] };
  const universityName = new Map(
    (universities || []).map((row) => [text(row.id), displayUniversityName(text(row.name))]),
  );

  const assignedInterns: StaffAssignedIntern[] = (internsRes.data || []).map((row) => ({
    id: text(row.id),
    fullName: text(row.full_name) || "Intern",
    universityName: universityName.get(text(row.university_id)) || "University pending",
    status: text(row.status),
    statusLabel: lifecycleLabel(text(row.status) || "candidate"),
  }));

  const location =
    text(hrRes.data?.location) ||
    [text(profile?.city), text(profile?.state)].filter(Boolean).join(", ") ||
    "—";

  const activity: StaffAccessAuditRow[] = (auditRes.data || []).map((row) => ({
    id: text(row.id),
    action: text(row.action) || "Access update",
    createdAt: text(row.created_at),
    actorEmail: text(row.actor_email),
  }));

  const memberSince =
    text(profile?.created_at) || text(access?.assigned_at) || text(authUser?.created_at) || "";
  const lastSignIn = text(authUser?.last_sign_in_at) || null;

  return {
    userId: id,
    fullName,
    email,
    phone: text(profile?.phone),
    location,
    jobTitle:
      text(eligibilityRes.data?.job_title) ||
      text(hrRes.data?.role_title) ||
      GROWTH_HIRE_TITLE,
    hireType: text(hrRes.data?.employment_status) || "Independent Contractor",
    startDate: text(hrRes.data?.start_date) || text(access?.assigned_at)?.slice(0, 10) || "",
    memberSince: formatWhen(memberSince),
    lastSignIn: lastSignIn ? formatWhen(lastSignIn) : null,
    accountActive: profile?.is_active !== false && authUser?.banned_until == null,
    emailVerified: authUser ? Boolean(authUser.email_confirmed_at) : null,
    managerPortalActive,
    canManageInterns,
    roles: [
      {
        key: "parent",
        label: "Pet Parent",
        enabled: hasParent,
        detail: "Marketplace Pet Parent portal",
      },
      {
        key: "ambassador",
        label: "Ambassador",
        enabled: hasAmbassador,
        detail: "Ambassador dashboard and outreach",
      },
      {
        key: "manager",
        label: "Manager Portal",
        enabled: managerPortalActive,
        detail: "Growth Manager workplace at /manager",
      },
      {
        key: "intern_preview",
        label: "Assigned Intern Preview",
        enabled: canManageInterns,
        detail: "Preview assigned interns only — not a student intern identity",
      },
      {
        key: "admin",
        label: "Admin Access",
        enabled: hasAdmin,
        detail: "Must stay off for Growth Managers",
      },
    ],
    assignedInterns,
    onboarding: [
      { label: "Account created", done: Boolean(authUser?.id || profile?.id), tone: "done" },
      {
        label: "Manager Portal access",
        done: managerPortalActive,
        tone: managerPortalActive ? "done" : "pending",
      },
      {
        label: "Intern management eligibility",
        done: canManageInterns,
        tone: canManageInterns ? "done" : "pending",
      },
      {
        label: "Email verified",
        done: Boolean(authUser?.email_confirmed_at),
        tone: authUser?.email_confirmed_at ? "done" : "pending",
      },
      {
        label: "First login",
        done: Boolean(lastSignIn),
        tone: lastSignIn ? "done" : "pending",
      },
    ],
    microsoft: {
      status: "Not provisioned",
      detail: "Microsoft 365 mailbox creation is tracked separately and was not changed here.",
    },
    activity,
    accessRecordId: text(access?.id) || null,
  };
}
