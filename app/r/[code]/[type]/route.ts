import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    code: string;
    type: string;
  }>;
};

type ReferralType = "pet-parent" | "guru";

type AmbassadorRow = {
  id: string;
  user_id: string | null;
  referral_code: string | null;
  status: string | null;
  dashboard_enabled: boolean | null;
  login_enabled: boolean | null;
};

type ReferralCodeRow = {
  id: string;
  owner_user_id: string | null;
  owner_type: string;
  ambassador_id: string | null;
  code: string;
  slug: string | null;
  campaign_type: string;
  status: string;
};

function normalizeReferralType(value: string): ReferralType | null {
  const normalized = value.trim().toLowerCase();

  if (
    normalized === "pet-parent" ||
    normalized === "pet_parent" ||
    normalized === "customer"
  ) {
    return "pet-parent";
  }

  if (
    normalized === "guru" ||
    normalized === "future-guru" ||
    normalized === "future_guru"
  ) {
    return "guru";
  }

  return null;
}

function normalizeReferralCode(value: string) {
  const decoded = decodeURIComponent(value).trim();

  if (!/^[A-Za-z0-9_-]{2,64}$/.test(decoded)) {
    return "";
  }

  return decoded;
}

function isActiveAmbassador(ambassador: AmbassadorRow) {
  const status = (ambassador.status || "").trim().toLowerCase();

  return (
    Boolean(ambassador.id) &&
    ![
      "archived",
      "paused",
      "suspended",
      "inactive",
      "disabled",
      "not a fit",
    ].includes(status)
  );
}

async function findAmbassador(referralCode: string) {
  const { data, error } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id, user_id, referral_code, status, dashboard_enabled, login_enabled",
    )
    .ilike("referral_code", referralCode)
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error(
      "Ambassador short-link lookup failed:",
      error.message,
    );
    return null;
  }

  return (data || null) as AmbassadorRow | null;
}

async function ensureReferralCode(
  ambassador: AmbassadorRow,
  referralCode: string,
) {
  const { data: byAmbassador, error: ambassadorLookupError } =
    await supabaseAdmin
      .from("referral_codes")
      .select(
        "id, owner_user_id, owner_type, ambassador_id, code, slug, campaign_type, status",
      )
      .eq("ambassador_id", ambassador.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

  if (ambassadorLookupError) {
    console.warn(
      "Ambassador short-link referral-code lookup by Ambassador failed:",
      ambassadorLookupError.message,
    );
  }

  if (byAmbassador) {
    return byAmbassador as ReferralCodeRow;
  }

  const { data: byCode, error: codeLookupError } = await supabaseAdmin
    .from("referral_codes")
    .select(
      "id, owner_user_id, owner_type, ambassador_id, code, slug, campaign_type, status",
    )
    .ilike("code", referralCode)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (codeLookupError) {
    console.warn(
      "Ambassador short-link referral-code lookup by code failed:",
      codeLookupError.message,
    );
  }

  if (byCode) {
    return byCode as ReferralCodeRow;
  }

  const canonicalSlug = `ambassador-${referralCode
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")}`;

  const { data: created, error: createError } = await supabaseAdmin
    .from("referral_codes")
    .insert({
      owner_user_id: ambassador.user_id,
      owner_type: "ambassador",
      partner_id: null,
      ambassador_id: ambassador.id,
      code: referralCode,
      slug: canonicalSlug,
      campaign_type: "ambassador",
      status: "active",
    })
    .select(
      "id, owner_user_id, owner_type, ambassador_id, code, slug, campaign_type, status",
    )
    .single();

  if (createError) {
    console.error(
      "Ambassador short-link referral-code provisioning failed:",
      createError.message,
    );
    return null;
  }

  return created as ReferralCodeRow;
}

function getTrackingCookieName(
  referralCode: string,
  type: ReferralType,
  via: string,
) {
  const safeCode = referralCode
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");

  return `sg_referral_${safeCode}_${type}_${via}`;
}

function getSignupDestination({
  request,
  referralCode,
  type,
  via,
}: {
  request: NextRequest;
  referralCode: string;
  type: ReferralType;
  via: "qr" | "link";
}) {
  const role = type === "pet-parent" ? "pet_parent" : "guru";
  const campaign =
    type === "pet-parent"
      ? "ambassador_pet_parent_referral"
      : "ambassador_guru_referral";
  const next =
    type === "pet-parent" ? "/customer/dashboard" : "/guru/dashboard";

  const destination = new URL("/signup", request.url);

  destination.searchParams.set("role", role);
  destination.searchParams.set("type", role);
  destination.searchParams.set("ref", referralCode);
  destination.searchParams.set(
    "ambassador_referral_code",
    referralCode,
  );
  destination.searchParams.set("ambassador_code", referralCode);
  destination.searchParams.set("source", "ambassador_short_link");
  destination.searchParams.set("medium", via);
  destination.searchParams.set("campaign", campaign);
  destination.searchParams.set("program", "ambassador");
  destination.searchParams.set("platform", "web");
  destination.searchParams.set("utm_source", "sitguru_ambassador");
  destination.searchParams.set("utm_medium", via);
  destination.searchParams.set("utm_campaign", campaign);
  destination.searchParams.set("next", next);

  return destination;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const { code: rawCode, type: rawType } = await context.params;
  const referralCode = normalizeReferralCode(rawCode);
  const type = normalizeReferralType(rawType);

  if (!referralCode || !type) {
    return NextResponse.redirect(
      new URL("/programs/ambassadors", request.url),
    );
  }

  const ambassador = await findAmbassador(referralCode);

  if (!ambassador || !isActiveAmbassador(ambassador)) {
    return NextResponse.redirect(
      new URL("/programs/ambassadors", request.url),
    );
  }

  const referralCodeRow = await ensureReferralCode(
    ambassador,
    referralCode,
  );

  const viaValue = request.nextUrl.searchParams.get("via");
  const via = viaValue === "qr" ? "qr" : "link";
  const cookieName = getTrackingCookieName(
    referralCode,
    type,
    via,
  );
  const alreadyTracked =
    request.cookies.get(cookieName)?.value === "1";

  if (referralCodeRow && !alreadyTracked) {
    try {
      await trackReferralClick({
        referralCodeId: referralCodeRow.id,
        landingPage: `/r/${encodeURIComponent(
          referralCode,
        )}/${type}?via=${via}`,
        utmSource: "sitguru_ambassador",
        utmMedium: via,
        utmCampaign:
          type === "pet-parent"
            ? "ambassador_pet_parent_referral"
            : "ambassador_guru_referral",
      });
    } catch (error) {
      console.error(
        "Ambassador short-link click tracking failed:",
        error,
      );
    }
  }

  const destination = getSignupDestination({
    request,
    referralCode,
    type,
    via,
  });

  const response = NextResponse.redirect(destination, 307);

  response.headers.set("Cache-Control", "no-store, max-age=0");
  response.headers.set("Pragma", "no-cache");

  response.cookies.set(cookieName, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 10 * 60,
  });

  response.cookies.set("sitguru_ambassador_code", referralCode, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set(
    "sitguru_referral_source",
    "ambassador_short_link",
    {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  response.cookies.set("sitguru_referral_type", type, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  response.cookies.set("sitguru_referral_medium", via, {
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return response;
}