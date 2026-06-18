import { redirect } from "next/navigation";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROUTES = {
  admin: "/admin",
  petParent: "/customer/dashboard",
  guru: "/guru/dashboard",
  ambassador: "/ambassador/dashboard",
  login: "/login?mode=phone",
};

type PreferredDashboard = "pet_parent" | "guru" | "ambassador" | null;

function normalizeRole(value: unknown) {
  return String(value || "").trim().toLowerCase();
}

function isAdminRole(value: unknown) {
  const role = normalizeRole(value);
  return role === "admin" || role === "super_admin" || role === "owner";
}

function isPetParentRole(value: unknown) {
  const role = normalizeRole(value);
  return (
    role === "customer" ||
    role === "pet_parent" ||
    role === "pet-parent" ||
    role === "parent" ||
    role === "both"
  );
}

function isGuruRole(value: unknown) {
  const role = normalizeRole(value);
  return (
    role === "guru" ||
    role === "future_guru" ||
    role === "future-guru" ||
    role === "provider" ||
    role === "sitter" ||
    role === "both"
  );
}

function isAmbassadorRole(value: unknown) {
  const role = normalizeRole(value);
  return (
    role === "ambassador" ||
    role === "ambassadors" ||
    role === "rep" ||
    role === "representative" ||
    role === "sitguru_rep"
  );
}

function getPreferredDashboard(value: string | string[] | undefined): PreferredDashboard {
  const preferred = Array.isArray(value) ? value[0] : value;
  const normalized = normalizeRole(preferred);

  if (
    normalized === "pet_parent" ||
    normalized === "pet-parent" ||
    normalized === "customer" ||
    normalized === "parent"
  ) {
    return "pet_parent";
  }

  if (
    normalized === "guru" ||
    normalized === "future_guru" ||
    normalized === "future-guru" ||
    normalized === "provider"
  ) {
    return "guru";
  }

  if (
    normalized === "ambassador" ||
    normalized === "ambassadors" ||
    normalized === "rep" ||
    normalized === "representative"
  ) {
    return "ambassador";
  }

  return null;
}

function getDashboardRoute(preferred: PreferredDashboard) {
  if (preferred === "guru") return ROUTES.guru;
  if (preferred === "ambassador") return ROUTES.ambassador;
  return ROUTES.petParent;
}

type LoginRouteSearchParams = Record<string, string | string[] | undefined>;

export default async function LoginRoutePage({
  searchParams,
}: {
  searchParams?: LoginRouteSearchParams | Promise<LoginRouteSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const preferred = getPreferredDashboard(resolvedSearchParams.preferred);

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect(ROUTES.login);
  }

  const supabaseAdmin = createSupabaseAdminClient();
  const roles = new Set<string>();

  const { data: roleRows, error: roleRowsError } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  if (roleRowsError) {
    console.error("Login route user_roles lookup failed:", roleRowsError.message);
  }

  roleRows?.forEach((row) => {
    const role = normalizeRole(row.role);
    if (role) roles.add(role);
  });

  const { data: profileRow, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("role, account_type")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError) {
    console.error("Login route profile lookup failed:", profileError.message);
  }

  const profileRole = normalizeRole(profileRow?.role);
  const profileAccountType = normalizeRole(profileRow?.account_type);

  if (profileRole) roles.add(profileRole);
  if (profileAccountType) roles.add(profileAccountType);

  const { data: guruRow, error: guruError } = await supabaseAdmin
    .from("gurus")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (guruError) {
    console.error("Login route guru lookup failed:", guruError.message);
  }

  if (guruRow?.id) {
    roles.add("guru");
  }

  const { data: ambassadorRows, error: ambassadorError } = await supabaseAdmin
    .from("ambassadors")
    .select("id")
    .eq("user_id", user.id)
    .limit(1);

  if (ambassadorError) {
    console.error("Login route ambassador lookup failed:", ambassadorError.message);
  }

  if (ambassadorRows?.length) {
    roles.add("ambassador");
  }

  const roleList = Array.from(roles);

  const hasAdminAccess = roleList.some(isAdminRole);
  const hasPetParentAccess = roleList.some(isPetParentRole);
  const hasGuruAccess = roleList.some(isGuruRole);
  const hasAmbassadorAccess = roleList.some(isAmbassadorRole);

  if (hasAdminAccess) {
    redirect(ROUTES.admin);
  }

  if (preferred === "guru" && hasGuruAccess) {
    redirect(ROUTES.guru);
  }

  if (preferred === "ambassador" && hasAmbassadorAccess) {
    redirect(ROUTES.ambassador);
  }

  if (preferred === "pet_parent" && hasPetParentAccess) {
    redirect(ROUTES.petParent);
  }

  const availableDashboards = [
    hasPetParentAccess ? "pet_parent" : null,
    hasGuruAccess ? "guru" : null,
    hasAmbassadorAccess ? "ambassador" : null,
  ].filter(Boolean) as Exclude<PreferredDashboard, null>[];

  if (availableDashboards.length === 1) {
    redirect(getDashboardRoute(availableDashboards[0]));
  }

  if (hasPetParentAccess) {
    redirect(ROUTES.petParent);
  }

  if (hasGuruAccess) {
    redirect(ROUTES.guru);
  }

  if (hasAmbassadorAccess) {
    redirect(ROUTES.ambassador);
  }

  redirect(
    "/login?mode=phone&error=We%20couldn%E2%80%99t%20find%20a%20SitGuru%20dashboard%20for%20this%20account.%20Please%20choose%20a%20Become%20option%20to%20finish%20setup."
  );
}
