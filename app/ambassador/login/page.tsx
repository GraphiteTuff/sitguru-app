// app/ambassador/login/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type LoginSearchParams = Record<string, string | string[] | undefined>;

type AmbassadorAccessRow = {
  id: string;
  user_id: string | null;
  status: string | null;
  referral_status: string | null;
  dashboard_enabled: boolean | null;
  login_enabled: boolean | null;
  email: string | null;
  contact_email: string | null;
  login_email: string | null;
};

function getFirstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeValue(value: unknown) {
  return cleanText(value).toLowerCase();
}

function getLoginMode(value: string | string[] | undefined) {
  const mode = normalizeValue(getFirstParam(value));

  if (mode === "phone" || mode === "sms") {
    return "phone";
  }

  return "email";
}

function getSafeNextPath(value: string | string[] | undefined) {
  const nextPath = cleanText(getFirstParam(value));

  if (!nextPath || !nextPath.startsWith("/") || nextPath.startsWith("//")) {
    return "/ambassador/dashboard";
  }

  return nextPath;
}

function getAmbassadorStatusMessage(
  ambassador: AmbassadorAccessRow,
): string {
  const status = normalizeValue(ambassador.status);

  if (status === "archived") {
    return "This Ambassador account has been archived. Contact SitGuru support if you believe this was done in error.";
  }

  if (status === "inactive") {
    return "This Ambassador account is currently inactive. Contact SitGuru support to request account restoration.";
  }

  if (status === "not_a_fit") {
    return "This Ambassador application is not currently eligible for workspace access. Contact SitGuru support with any questions.";
  }

  if (status === "paused") {
    return "This Ambassador account is temporarily paused. Contact SitGuru support if you need help restoring access.";
  }

  if (status === "active") {
    return "Your Ambassador account is active, but workspace access is not enabled. Contact SitGuru support so we can correct it.";
  }

  return "Your Ambassador workspace is still being prepared. Contact SitGuru support if you need help completing setup.";
}

async function findAmbassadorAccount({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const { data: ambassadorByUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id,user_id,status,referral_status,dashboard_enabled,login_enabled,email,contact_email,login_email",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "AMBASSADOR LOGIN USER-ID LOOKUP ERROR:",
      userIdError.message,
    );
  }

  if (ambassadorByUserId) {
    return ambassadorByUserId as AmbassadorAccessRow;
  }

  if (!email) {
    return null;
  }

  const emailColumns = ["login_email", "contact_email", "email"] as const;

  for (const column of emailColumns) {
    const { data, error } = await supabaseAdmin
      .from("ambassadors")
      .select(
        "id,user_id,status,referral_status,dashboard_enabled,login_enabled,email,contact_email,login_email",
      )
      .eq(column, email)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error(
        `AMBASSADOR LOGIN ${column.toUpperCase()} LOOKUP ERROR:`,
        error.message,
      );
      continue;
    }

    if (data) {
      return data as AmbassadorAccessRow;
    }
  }

  return null;
}

function buildCentralLoginPath({
  mode,
  nextPath,
  error,
}: {
  mode: "email" | "phone";
  nextPath: string;
  error?: string;
}) {
  const params = new URLSearchParams();

  params.set("role", "ambassador");
  params.set("mode", mode);
  params.set("next", nextPath);

  if (error) {
    params.set("error", error);
  }

  return `/login?${params.toString()}`;
}

export default async function AmbassadorLoginRedirectPage({
  searchParams,
}: {
  searchParams?: LoginSearchParams | Promise<LoginSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const mode = getLoginMode(resolvedSearchParams.mode);
  const nextPath = getSafeNextPath(resolvedSearchParams.next);

  const suppliedError =
    cleanText(getFirstParam(resolvedSearchParams.error)) ||
    cleanText(getFirstParam(resolvedSearchParams.message)) ||
    cleanText(getFirstParam(resolvedSearchParams.auth_error));

  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user?.id) {
    redirect(
      buildCentralLoginPath({
        mode,
        nextPath,
        error: suppliedError || undefined,
      }),
    );
  }

  const userEmail = cleanText(user.email).toLowerCase();
  const ambassador = await findAmbassadorAccount({
    userId: user.id,
    email: userEmail,
  });

  if (!ambassador) {
    const routeParams = new URLSearchParams({
      preferred: "ambassador",
      next: nextPath,
    });

    if (suppliedError) {
      routeParams.set("error", suppliedError);
    }

    redirect(`/login/route?${routeParams.toString()}`);
  }

  const status = normalizeValue(ambassador.status);
  const workspaceAvailable =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not_a_fit";

  if (workspaceAvailable) {
    redirect(nextPath);
  }

  await supabase.auth.signOut();

  redirect(
    buildCentralLoginPath({
      mode,
      nextPath,
      error: suppliedError || getAmbassadorStatusMessage(ambassador),
    }),
  );
}