import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { trackReferralClick } from "@/lib/referrals/trackReferralClick";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    code: string;
    platform: string;
  }>;
};

type SocialPlatform =
  | "facebook"
  | "instagram"
  | "tiktok"
  | "x"
  | "youtube";

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

const SOCIAL_DESTINATIONS: Record<SocialPlatform, string> = {
  facebook: "https://www.facebook.com/SitGuruOfficial/",
  instagram: "https://www.instagram.com/sitguruofficial/",
  tiktok: "https://www.tiktok.com/@sitguruofficial",
  x: "https://x.com/sitguruofficial",
  youtube: "https://www.youtube.com/@SitGuruOfficial",
};

function normalizePlatform(value: string): SocialPlatform | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === "twitter") return "x";

  if (
    normalized === "facebook" ||
    normalized === "instagram" ||
    normalized === "tiktok" ||
    normalized === "x" ||
    normalized === "youtube"
  ) {
    return normalized;
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
      "Social short-link Ambassador lookup failed:",
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
      "Social short-link referral-code lookup by Ambassador failed:",
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
      "Social short-link referral-code lookup by code failed:",
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
      "Social short-link referral-code provisioning failed:",
      createError.message,
    );
    return null;
  }

  return created as ReferralCodeRow;
}

function getTrackingCookieName(
  referralCode: string,
  platform: SocialPlatform,
  via: string,
) {
  const safeCode = referralCode
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "_");

  return `sg_social_${safeCode}_${platform}_${via}`;
}

export async function GET(
  request: NextRequest,
  context: RouteContext,
) {
  const { code: rawCode, platform: rawPlatform } = await context.params;
  const referralCode = normalizeReferralCode(rawCode);
  const platform = normalizePlatform(rawPlatform);

  if (!referralCode || !platform) {
    return NextResponse.redirect(
      new URL("/programs/ambassadors", request.url),
    );
  }

  const destination = SOCIAL_DESTINATIONS[platform];
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
    platform,
    via,
  );
  const alreadyTracked =
    request.cookies.get(cookieName)?.value === "1";

  if (referralCodeRow && !alreadyTracked) {
    try {
      await trackReferralClick({
        referralCodeId: referralCodeRow.id,
        landingPage: `/r/social/${encodeURIComponent(
          referralCode,
        )}/${platform}?via=${via}`,
        utmSource: platform,
        utmMedium: via,
        utmCampaign: `sitguru_ambassador_social_${platform}`,
      });
    } catch (error) {
      console.error(
        "Social short-link click tracking failed:",
        error,
      );
    }
  }

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
    "ambassador_social",
    {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    },
  );

  response.cookies.set("sitguru_referral_platform", platform, {
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