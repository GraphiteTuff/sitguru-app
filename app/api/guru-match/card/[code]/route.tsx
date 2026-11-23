import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";
import { findApprovedShare, guruMatchQrUrl } from "@/lib/guru-match/service";
import { GURU_MATCH_SERVICES } from "@/lib/guru-match/matching";
import { renderGuruMatchCardPng } from "@/lib/guru-match/card-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Never stream an ImageResponse from this route: the production Satori encoder
 * can fail after headers are sent, producing a broken preview and a 500 download.
 * All card assets are embedded in the complete Sharp-rendered PNG below.
 */
async function safeBrandLogo(): Promise<Buffer> {
  for (const file of [
    "public/images/sitguru-logo-cropped.png",
    "public/images/sitguru-logo-final.png",
    "public/images/sitguru-logo-mark.png",
    "public/apple-touch-icon.png",
  ]) {
    try {
      const image = await readFile(path.join(process.cwd(), file));
      return await sharp(image).trim({background:"#FFFFFF",threshold:12}).resize(304, 116, {
        fit: "contain", background: "#FFFFFF",
      }).png().toBuffer();
    } catch {
      // Missing file or unsupported image format: try the next approved asset.
    }
  }
  const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="304" height="116">' +
    '<rect width="304" height="116" fill="white"/>' +
    '<text x="14" y="76" font-size="52" font-family="DejaVu Sans,sans-serif" ' +
    'font-weight="bold" fill="#0D5C3A">SitGuru</text></svg>';
  return await sharp(Buffer.from(svg)).png().toBuffer();
}

async function safePhoto(raw: string | null): Promise<Buffer | null> {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const permitted = url.protocol === "https:" && (
      (url.hostname === "mmtjhxnzuglbyumbsjhs.supabase.co" &&
        (url.pathname.startsWith("/storage/v1/object/public/") ||
         url.pathname.startsWith("/storage/v1/object/sign/"))) ||
      url.hostname === "lh3.googleusercontent.com" ||
      url.hostname === "auth.sitguru.com"
    );
    if (!permitted) return null;
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(4500), cache: "no-store", redirect: "error" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) return null;
    if (Number(response.headers.get("content-length") || 0) > 2_000_000) return null;
    const original = Buffer.from(await response.arrayBuffer());
    if (original.byteLength > 2_000_000) return null;
    return sharp(original, {limitInputPixels:10_000_000}).rotate().resize(304, 304, { fit: "cover" }).png().toBuffer();
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  try {
    const share = await findApprovedShare(code);
    if (!share) return new Response("Not found", { status: 404 });
    const [logoPng, photoPng, qrPng, dogPng, catPng] = await Promise.all([
      safeBrandLogo(),
      safePhoto(share.guru.photoUrl),
      QRCode.toBuffer(guruMatchQrUrl(code), { type: "png", width: 620, margin: 4, errorCorrectionLevel: "H" }),
      readFile(path.join(process.cwd(), "public/images/hero/sitguru-dog-walking-hero.jpg")).catch(() => null),
      readFile(path.join(process.cwd(), "public/images/petperks/petperks-pet-parent-cat.jpg")).catch(() => null),
    ]);
    const serviceLabel = share.promotionType==="community"?"Explore local care":share.service_key==="custom_care"?"Explore Guru services":GURU_MATCH_SERVICES.find(item => item.key === share.service_key)?.label || "Pet Care";
    const png = await renderGuruMatchCardPng({
      guruName: share.guru.name,
      promotionType: share.promotionType,
      city: share.city,
      state: share.state,
      serviceLabel,
      logoPng,
      qrPng,
      photoPng,
      dogPng,
      catPng,
      experienceYears:share.guru.experienceYears,
    });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Content-Length": String(png.byteLength),
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'inline; filename="sitguru-guru-social-portrait.png"',
      },
    });
  } catch (error) {
    console.error("Unable to render Guru Match PNG", error);
    return new Response("Card image temporarily unavailable", { status: 503, headers: {"Cache-Control":"no-store"} });
  }
}
