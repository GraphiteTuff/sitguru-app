import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";
import { findApprovedShare, guruMatchQrUrl } from "@/lib/guru-match/service";
import { GURU_MATCH_SERVICES } from "@/lib/guru-match/matching";
import { renderGuruMatchCardPng } from "@/lib/guru-match/card-image";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safePhoto(raw: string | null): Promise<Buffer | null> {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const permitted = url.protocol === "https:" && (
      (url.hostname === "mmtjhxnzuglbyumbsjhs.supabase.co" &&
        ["guru-photos", "guru-profile-photos", "guru-avatars", "profile-photos", "avatars"].some(bucket =>
          url.pathname.startsWith(`/storage/v1/object/public/${bucket}/`))) ||
      url.hostname === "lh3.googleusercontent.com" ||
      url.hostname === "auth.sitguru.com"
    );
    if (!permitted) return null;
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(4500), cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) return null;
    if (Number(response.headers.get("content-length") || 0) > 2_000_000) return null;
    const original = Buffer.from(await response.arrayBuffer());
    if (original.byteLength > 2_000_000) return null;
    return sharp(original).resize(190, 190, { fit: "cover" }).png().toBuffer();
  } catch {
    return null;
  }
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const share = await findApprovedShare(code);
  if (!share) return new Response("Not found", { status: 404 });
  try {
    const [logoPng, photoPng, qrPng] = await Promise.all([
      readFile(path.join(process.cwd(), "public/images/sitguru-logo-final.png"))
        .then(data => sharp(data).resize({ width: 220 }).png().toBuffer()),
      safePhoto(share.guru.photoUrl),
      QRCode.toBuffer(guruMatchQrUrl(code), { type: "png", width: 460, margin: 2, errorCorrectionLevel: "H" }),
    ]);
    const serviceLabel = GURU_MATCH_SERVICES.find(item => item.key === share.service_key)?.label || "Pet Care";
    const png = await renderGuruMatchCardPng({
      guruName: share.guru.name,
      city: share.city,
      state: share.state,
      serviceLabel,
      logoPng,
      qrPng,
      photoPng,
    });
    return new Response(new Uint8Array(png), {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "private, no-store",
        "Content-Disposition": 'inline; filename="sitguru-guru-share.png"',
      },
    });
  } catch (error) {
    console.error("Unable to render Guru Match PNG", error);
    return new Response("Card image temporarily unavailable", { status: 503 });
  }
}
