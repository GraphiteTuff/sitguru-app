import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import sharp from "sharp";
import { resolvePublicReferral } from "@/lib/referrals/public-referral";
import { renderAmbassadorCardPng } from "@/lib/ambassador/card-image";
import {
  allowedGuruMatchPhotoBytes,
  trustedGuruMatchPhotoUrl,
  GURU_MATCH_PHOTO_TIMEOUT_MS,
  MAX_GURU_MATCH_PHOTO_PIXELS,
} from "@/lib/guru-match/photo-policy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function brandLogo() {
  for (const asset of [
    "public/images/sitguru-logo-cropped.png",
    "public/images/sitguru-logo-final.png",
    "public/images/sitguru-logo-mark.png",
  ]) {
    try {
      return await sharp(await readFile(path.join(process.cwd(), asset)))
        .resize(420, 160, { fit: "contain", background: "#FFFFFF" }).png().toBuffer();
    } catch { /* try next approved brand asset */ }
  }
  return sharp(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="400" height="130"><rect width="400" height="130" fill="#fff"/><text x="20" y="84" font-size="64" font-weight="bold" fill="#0D5C3A">SitGuru</text></svg>')).png().toBuffer();
}

async function approvedPortrait(raw: string | null): Promise<Buffer | null> {
  const url = trustedGuruMatchPhotoUrl(raw);
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "no-store", redirect: "error", signal: AbortSignal.timeout(GURU_MATCH_PHOTO_TIMEOUT_MS) });
    if (!response.ok || !response.headers.get("content-type")?.toLowerCase().startsWith("image/")) return null;
    const size = Number(response.headers.get("content-length") || 0);
    if (size > 0 && !allowedGuruMatchPhotoBytes(size)) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!allowedGuruMatchPhotoBytes(bytes.length)) return null;
    return await sharp(bytes, { limitInputPixels: MAX_GURU_MATCH_PHOTO_PIXELS }).rotate()
      .resize(720, 850, { fit: "inside", withoutEnlargement: true }).png().toBuffer();
  } catch { return null; }
}

export async function GET(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  const referral = await resolvePublicReferral(code);
  if (!referral || !referral.ambassadorId || !referral.isPublicAmbassador) {
    return new Response("Ambassador poster not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const target = "https://www.sitguru.com/r/" + encodeURIComponent(referral.code) +
      "?via=qr&utm_source=sitguru_ambassador&utm_campaign=ambassador_card";
    const [logoPng, portraitPng, qrPng] = await Promise.all([
      brandLogo(),
      approvedPortrait(referral.portraitUrl),
      QRCode.toBuffer(target, { type: "png", width: 620, margin: 3, errorCorrectionLevel: "H" }),
    ]);
    const png = await renderAmbassadorCardPng({
      ambassadorName: referral.displayName,
      referralCode: referral.code,
      logoPng, portraitPng, qrPng,
    });
    const download = new URL(request.url).searchParams.get("download") === "1";
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.length),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="sitguru-ambassador-card.png"`,
      },
    });
  } catch (error) {
    console.error("[ambassador-card] PNG rendering failed", error);
    return new Response("Promotional card temporarily unavailable", { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
