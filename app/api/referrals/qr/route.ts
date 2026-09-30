import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getAppOrigin } from "@/lib/config/site";
import {
  normalizeReferralCode,
  publicReferralUrl,
} from "@/lib/ambassador/creator-referral";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = normalizeReferralCode(request.nextUrl.searchParams.get("code"));
  const path = String(request.nextUrl.searchParams.get("path") || "");
  const safePath =
    path.startsWith("/r/") && /^\/r\/[A-Za-z0-9_%./?=&-]+$/.test(path) ? path : "";
  if ((!code || code.length > 64) && !safePath) {
    return NextResponse.json({ ok: false, error: "Missing referral code." }, { status: 400 });
  }

  const destination = safePath
    ? `${getAppOrigin()}${safePath}`
    : publicReferralUrl(getAppOrigin(), code);
  const download = request.nextUrl.searchParams.get("download") === "1";
  const width = download ? 1024 : 512;

  try {
    const png = await QRCode.toBuffer(destination, {
      type: "png",
      width,
      margin: 2,
      errorCorrectionLevel: "M",
      color: { dark: "#0D5C3A", light: "#FFFFFF" },
    });

    return new NextResponse(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=86400",
        "Content-Disposition": download
          ? `attachment; filename="sitguru-${(code || "referral").toLowerCase()}-qr.png"`
          : "inline",
      },
    });
  } catch (error) {
    console.error(
      "[referrals/qr]",
      error instanceof Error ? error.message : "qr_failed",
    );
    return NextResponse.json(
      { ok: false, error: "SitGuru could not create that QR code." },
      { status: 500 },
    );
  }
}
