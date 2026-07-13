import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type AccountIntent = "pet_parent" | "guru" | "ambassador" | "both";
type SignupProfileRole = "customer" | "guru" | "ambassador" | "both";

type ProvisionSignupBody = {
  userId?: string;
  intent?: AccountIntent;
  fullName?: string;
  email?: string;
  phone?: string;
  zipCode?: string;
  serviceArea?: string;
  ambassadorReferralCode?: string;
  source?: string;
};

function jsonError(message: string, status = 400, details?: unknown) {
  console.error("SIGNUP PROVISION ERROR:", { message, status, details });
  return NextResponse.json({ ok: false, error: message }, { status });
}

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getProfileRole(intent: AccountIntent): SignupProfileRole {
  if (intent === "guru") return "guru";
  if (intent === "ambassador") return "ambassador";
  if (intent === "both") return "both";
  return "customer";
}

function getRoles(intent: AccountIntent) {
  if (intent === "both") return ["customer", "guru"] as const;
  return [getProfileRole(intent)] as const;
}

function getNameParts(fullName: string) {
  const parts = fullName.replace(/\s+/g, " ").trim().split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

function buildReferralCode(userId: string, fullName: string) {
  const nameCode = fullName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 8);
  return `${nameCode || "SITGURU"}-${userId.replace(/-/g, "").toUpperCase()}`;
}

function buildSlug(userId: string, fullName: string) {
  const baseSlug = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return baseSlug || `user-${userId.slice(0, 8)}`;
}

async function requireSuccess(
  operation: string,
  promise: PromiseLike<{ error: { message?: string; code?: string } | null }>,
) {
  const { error } = await promise;
  if (error) {
    throw new Error(`${operation}: ${error.message || error.code || "unknown database error"}`);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ProvisionSignupBody;
    const userId = cleanText(body.userId);
    const fullName = cleanText(body.fullName).replace(/\s+/g, " ");
    const email = cleanText(body.email).toLowerCase();
    const phone = cleanText(body.phone);
    const zipCode = cleanText(body.zipCode);
    const serviceArea = cleanText(body.serviceArea) || zipCode;
    const source = cleanText(body.source) || "sitguru_signup";
    const intent = body.intent;

    if (!userId || !intent || !fullName || !/^\d{5}$/.test(zipCode)) {
      return jsonError("Required signup information is missing or invalid.", 400);
    }

    if (!["pet_parent", "guru", "ambassador", "both"].includes(intent)) {
      return jsonError("Unsupported SitGuru account type.", 400);
    }

    const { data: authUserResult, error: authUserError } =
      await supabaseAdmin.auth.admin.getUserById(userId);

    if (authUserError || !authUserResult.user) {
      return jsonError("SitGuru could not verify the newly created account.", 401, authUserError);
    }

    const authUser = authUserResult.user;
    const authEmail = (authUser.email || "").trim().toLowerCase();
    const authPhone = (authUser.phone || "").trim();

    if (email && authEmail && email !== authEmail) {
      return jsonError("The signup email did not match the authenticated account.", 403);
    }

    if (phone && authPhone && phone !== authPhone) {
      return jsonError("The signup phone did not match the authenticated account.", 403);
    }

    const now = new Date().toISOString();
    const profileRole = getProfileRole(intent);
    const { firstName, lastName } = getNameParts(fullName);
    const referralCode = buildReferralCode(userId, fullName);
    const roles = getRoles(intent);

    await requireSuccess(
      "Profile setup failed",
      supabaseAdmin.from("profiles").upsert(
        {
          id: userId,
          full_name: fullName,
          first_name: firstName || null,
          last_name: lastName || null,
          email: email || authEmail || null,
          phone: phone || authPhone || null,
          role: profileRole,
          account_type: profileRole,
          source,
          zip_code: zipCode,
          service_area: serviceArea,
          referral_code: referralCode,
          admin_status: "pending_setup",
          profile_quality_status: "needs_setup",
          is_public_visible: false,
          is_bookable: false,
          is_archived: false,
          is_test_account: false,
          missing_requirements: ["basic profile completion"],
          updated_at: now,
        },
        { onConflict: "id" },
      ),
    );

    for (const role of roles) {
      await requireSuccess(
        `Role setup failed for ${role}`,
        supabaseAdmin.from("user_roles").upsert(
          { user_id: userId, role, updated_at: now },
          { onConflict: "user_id,role" },
        ),
      );
    }

    await requireSuccess(
      "Referral setup failed",
      supabaseAdmin.from("pawperks_account_referral_codes").upsert(
        {
          account_id: userId,
          code: referralCode,
          program:
            intent === "guru" || intent === "both"
              ? "guru"
              : intent === "ambassador"
                ? "ambassador"
                : "pet_parent",
          status: "active",
          metadata: {
            source: "signup",
            role: profileRole,
            referred_by_code: cleanText(body.ambassadorReferralCode) || null,
          },
        },
        { onConflict: "account_id" },
      ),
    );

    if (intent === "guru" || intent === "both") {
      await requireSuccess(
        "Guru workspace setup failed",
        supabaseAdmin.from("gurus").upsert(
          {
            user_id: userId,
            display_name: fullName,
            full_name: fullName,
            slug: buildSlug(userId, fullName),
            zip_code: zipCode,
            service_area: serviceArea,
            is_public: false,
            booking_status: "not_listed",
            application_status: "pending",
            admin_status: "pending_setup",
            profile_quality_status: "needs_setup",
            is_public_visible: false,
            is_bookable: false,
            is_archived: false,
            is_test_account: false,
            missing_requirements: [
              "services offered",
              "rates/pricing",
              "availability",
              "bio/about",
              "profile photo",
              "admin approved",
            ],
            onboarding_completed: false,
            profile_completed: false,
            updated_at: now,
          },
          { onConflict: "user_id" },
        ),
      );
    }

    if (intent === "ambassador") {
      await requireSuccess(
        "Ambassador workspace setup failed",
        supabaseAdmin.from("ambassadors").upsert(
          {
            user_id: userId,
            full_name: fullName,
            email: email || authEmail || null,
            contact_email: email || authEmail || null,
            phone: phone || authPhone || null,
            referral_code: referralCode,
            status: "pending",
            referral_status: "pending",
            admin_status: "application_received",
            profile_quality_status: "application_received",
            is_public_visible: false,
            is_bookable: false,
            is_archived: false,
            is_test_account: false,
            missing_requirements: ["admin approved", "training completion"],
            onboarding_status: "started",
            training_status: "not_started",
            dashboard_enabled: false,
            login_enabled: true,
            dashboard_slug: buildSlug(userId, fullName),
            base_zip_code: zipCode,
            service_area: serviceArea,
            updated_at: now,
          },
          { onConflict: "user_id" },
        ),
      );
    }

    const verificationChecks = [
      supabaseAdmin.from("profiles").select("id").eq("id", userId).maybeSingle(),
      supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", [...roles]),
    ] as const;

    const [profileCheck, rolesCheck] = await Promise.all(verificationChecks);

    if (profileCheck.error || !profileCheck.data) {
      throw new Error("SitGuru could not verify the completed profile setup.");
    }

    const savedRoles = new Set((rolesCheck.data || []).map((row) => row.role));
    if (roles.some((role) => !savedRoles.has(role))) {
      throw new Error("SitGuru could not verify all assigned account roles.");
    }

    if (intent === "ambassador") {
      const { data: ambassador, error: ambassadorError } = await supabaseAdmin
        .from("ambassadors")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();

      if (ambassadorError || !ambassador) {
        throw new Error("SitGuru could not verify the Ambassador workspace.");
      }
    }

    return NextResponse.json({
      ok: true,
      userId,
      intent,
      message: "SitGuru account and workspace created successfully.",
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "SitGuru could not finish account setup.",
      500,
      error,
    );
  }
}