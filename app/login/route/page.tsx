// app/login/route/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type LoginSearchParams = Record<string, string | string[] | undefined>;

type PreferredWorkspace = "pet_parent" | "guru" | "ambassador" | "admin";

type AmbassadorAccessRow = {
  id: string;
  status: string | null;
  dashboard_enabled: boolean | null;
  login_enabled: boolean | null;
};

const SUPER_USER_EMAILS = new Set([
  "jason@sitguru.com",
  "nette@sitguru.com",
]);

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeValue(value: unknown) {
  return cleanText(value).toLowerCase();
}

function isSuperUserEmail(email: string | null | undefined) {
  return SUPER_USER_EMAILS.has(normalizeValue(email));
}

function normalizePreferredWorkspace(
  value: string | string[] | undefined,
): PreferredWorkspace | null {
  const preferred = normalizeValue(getFirstParam(value));

  if (
    preferred === "pet_parent" ||
    preferred === "pet-parent" ||
    preferred === "customer" ||
    preferred === "parent"
  ) {
    return "pet_parent";
  }

  if (
    preferred === "guru" ||
    preferred === "future_guru" ||
    preferred === "future-guru" ||
    preferred === "provider"
  ) {
    return "guru";
  }

  if (
    preferred === "ambassador" ||
    preferred === "partner" ||
    preferred === "representative"
  ) {
    return "ambassador";
  }

  if (
    preferred === "admin" ||
    preferred === "owner" ||
    preferred === "super_admin" ||
    preferred === "superuser"
  ) {
    return "admin";
  }

  return null;
}

function isAdminRole(value: unknown) {
  const role = normalizeValue(value);

  return [
    "admin",
    "owner",
    "super_admin",
    "super user",
    "superuser",
    "founder",
    "ceo",
    "founder/ceo",
    "co-founder",
    "cofounder",
  ].includes(role);
}

function isGuruRole(value: unknown) {
  const role = normalizeValue(value);

  return [
    "guru",
    "future_guru",
    "future-guru",
    "provider",
    "sitter",
    "walker",
    "caretaker",
    "pet_guru",
    "pet-care-guru",
    "pet_care_guru",
    "both",
  ].includes(role);
}

function isPetParentRole(value: unknown) {
  const role = normalizeValue(value);

  return [
    "customer",
    "pet_parent",
    "pet-parent",
    "pet parent",
    "pet_owner",
    "pet-owner",
    "pet owner",
    "parent",
    "both",
  ].includes(role);
}

function isAmbassadorRole(value: unknown) {
  const role = normalizeValue(value);

  return [
    "ambassador",
    "ambassadors",
    "student_ambassador",
    "student-ambassador",
    "community_ambassador",
    "community-ambassador",
    "military_ambassador",
    "military-ambassador",
    "veteran_ambassador",
    "veteran-ambassador",
    "partner",
    "rep",
    "representative",
    "sitguru_rep",
  ].includes(role);
}

function getSafeNextPath(
  value: string | string[] | undefined,
  preferred: PreferredWorkspace | null,
) {
  const nextPath = cleanText(getFirstParam(value));

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "";
  }

  if (
    preferred === "ambassador" &&
    !nextPath.startsWith("/ambassador/")
  ) {
    return "";
  }

  if (preferred === "guru" && !nextPath.startsWith("/guru/")) {
    return "";
  }

  if (
    preferred === "pet_parent" &&
    !nextPath.startsWith("/customer/")
  ) {
    return "";
  }

  if (
    preferred === "admin" &&
    nextPath !== "/admin" &&
    !nextPath.startsWith("/admin/")
  ) {
    return "";
  }

  return nextPath;
}

function buildLoginRedirect({
  preferred,
  nextPath,
  error,
}: {
  preferred: PreferredWorkspace | null;
  nextPath?: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  if (preferred) {
    params.set("role", preferred);
  }

  if (nextPath) {
    params.set("next", nextPath);
  }

  if (error) {
    params.set("error", error);
  }

  const query = params.toString();

  return query ? `/login?${query}` : "/login";
}

function ambassadorAccessMessage(
  ambassador: AmbassadorAccessRow | null,
) {
  if (!ambassador) {
    return "We could not find an Ambassador workspace for this account.";
  }

  const status = normalizeValue(ambassador.status);

  if (status === "archived") {
    return "This Ambassador account has been archived. Contact SitGuru support if you believe this is an error.";
  }

  if (status === "inactive") {
    return "This Ambassador account is inactive. Contact SitGuru support to request restoration.";
  }

  if (status === "not_a_fit") {
    return "This Ambassador application is not currently eligible for workspace access.";
  }

  if (status === "paused") {
    return "This Ambassador account is paused. Contact SitGuru support if you need help restoring access.";
  }

  return "Your Ambassador workspace is not available yet. Contact SitGuru support if you need help completing setup.";
}

export default async function LoginRoutePage({
  searchParams,
}: {
  searchParams?: LoginSearchParams | Promise<LoginSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const preferred = normalizePreferredWorkspace(
    resolvedSearchParams.preferred ||
      resolvedSearchParams.role ||
      resolvedSearchParams.workspace,
  );
  const safeNextPath = getSafeNextPath(
    resolvedSearchParams.next,
    preferred,
  );
  const suppliedError =
    cleanText(getFirstParam(resolvedSearchParams.error)) ||
    cleanText(getFirstParam(resolvedSearchParams.message)) ||
    cleanText(getFirstParam(resolvedSearchParams.auth_error));

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user?.id) {
    redirect(
      buildLoginRedirect({
        preferred,
        nextPath: safeNextPath || undefined,
        error: suppliedError || undefined,
      }),
    );
  }

  const userEmail = normalizeValue(user.email);

  const [
    roleRowsResult,
    profileResult,
    guruResult,
    ambassadorResult,
  ] = await Promise.all([
    supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id),
    supabaseAdmin
      .from("profiles")
      .select("role, account_type")
      .eq("id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("gurus")
      .select("id")
      .eq("user_id", user.id)
      .limit(1),
    supabaseAdmin
      .from("ambassadors")
      .select("id,status,dashboard_enabled,login_enabled")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  if (roleRowsResult.error) {
    console.error(
      "LOGIN ROUTE USER ROLES LOOKUP ERROR:",
      roleRowsResult.error.message,
    );
  }

  if (profileResult.error) {
    console.error(
      "LOGIN ROUTE PROFILE LOOKUP ERROR:",
      profileResult.error.message,
    );
  }

  if (guruResult.error) {
    console.error(
      "LOGIN ROUTE GURU LOOKUP ERROR:",
      guruResult.error.message,
    );
  }

  if (ambassadorResult.error) {
    console.error(
      "LOGIN ROUTE AMBASSADOR LOOKUP ERROR:",
      ambassadorResult.error.message,
    );
  }

  const roleValues = new Set<string>();

  for (const row of roleRowsResult.data || []) {
    const role = cleanText(row.role);
    if (role) roleValues.add(role);
  }

  const profileRole = cleanText(profileResult.data?.role);
  const profileAccountType = cleanText(
    profileResult.data?.account_type,
  );

  if (profileRole) roleValues.add(profileRole);
  if (profileAccountType) roleValues.add(profileAccountType);

  const roles = Array.from(roleValues);
  const ambassador =
    (ambassadorResult.data as AmbassadorAccessRow | null) || null;
  const ambassadorStatus = normalizeValue(ambassador?.status);

  const hasAdminAccess =
    isSuperUserEmail(userEmail) || roles.some(isAdminRole);

  const hasGuruAccess =
    roles.some(isGuruRole) ||
    Boolean(guruResult.data?.length);

  const hasPetParentAccess = roles.some(isPetParentRole);

  const hasAmbassadorRole = roles.some(isAmbassadorRole);
  const hasAmbassadorWorkspace =
    Boolean(ambassador?.id) &&
    ambassador?.dashboard_enabled === true &&
    ambassador?.login_enabled === true &&
    ambassadorStatus !== "archived" &&
    ambassadorStatus !== "inactive" &&
    ambassadorStatus !== "not_a_fit";

  if (hasAmbassadorWorkspace && !hasAmbassadorRole) {
    const { error: roleRepairError } = await supabaseAdmin
      .from("user_roles")
      .upsert(
        {
          user_id: user.id,
          role: "ambassador",
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,role",
        },
      );

    if (roleRepairError) {
      console.error(
        "LOGIN ROUTE AMBASSADOR ROLE REPAIR ERROR:",
        roleRepairError.message,
      );
    }
  }

  if (preferred === "admin") {
    if (hasAdminAccess) {
      redirect(safeNextPath || "/admin");
    }

    redirect(
      buildLoginRedirect({
        preferred,
        error:
          suppliedError ||
          "This account is not authorized for SitGuru Admin access.",
      }),
    );
  }

  if (preferred === "ambassador") {
    if (hasAmbassadorWorkspace) {
      redirect(safeNextPath || "/ambassador/dashboard");
    }

    redirect(
      `/ambassador/login?${new URLSearchParams({
        error:
          suppliedError ||
          ambassadorAccessMessage(ambassador),
      }).toString()}`,
    );
  }

  if (preferred === "guru") {
    if (hasGuruAccess) {
      redirect(safeNextPath || "/guru/dashboard");
    }

    const applicationParams = new URLSearchParams({
      from: "login-route",
      reason: "guru-access-required",
    });

    if (suppliedError) {
      applicationParams.set("error", suppliedError);
    }

    redirect(`/guru/application?${applicationParams.toString()}`);
  }

  if (preferred === "pet_parent") {
    if (hasPetParentAccess) {
      redirect(safeNextPath || "/customer/dashboard/profile");
    }

    redirect(
      buildLoginRedirect({
        preferred,
        error:
          suppliedError ||
          "This account does not currently have a Pet Parent workspace.",
      }),
    );
  }

  if (hasAdminAccess) {
    redirect("/admin");
  }

  if (hasAmbassadorWorkspace) {
    redirect("/ambassador/dashboard");
  }

  if (hasGuruAccess) {
    redirect("/guru/dashboard");
  }

  if (hasPetParentAccess) {
    redirect("/customer/dashboard/profile");
  }

  redirect(
    buildLoginRedirect({
      preferred: null,
      error:
        suppliedError ||
        "SitGuru could not determine which workspace belongs to this account.",
    }),
  );
}