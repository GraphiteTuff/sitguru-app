import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import QRCode from "qrcode";
import { findApprovedShare, guruMatchQrUrl } from "@/lib/guru-match/service";
import { GURU_MATCH_SERVICES } from "@/lib/guru-match/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function safePhoto(raw: string | null): Promise<string | null> {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    const permitted = url.protocol === "https:" && (
      (url.hostname === "mmtjhxnzuglbyumbsjhs.supabase.co" &&
        url.pathname.startsWith("/storage/v1/object/public/guru-photos/")) ||
      url.hostname === "lh3.googleusercontent.com" ||
      url.hostname === "auth.sitguru.com"
    );
    if (!permitted) return null;
    const response = await fetch(url.toString(), { signal: AbortSignal.timeout(4500), cache: "no-store" });
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) return null;
    if (Number(response.headers.get("content-length") || 0) > 2_000_000) return null;
    const original = Buffer.from(await response.arrayBuffer());
    if (original.byteLength > 2_000_000) return null;
    const png = await sharp(original).resize(190, 190, { fit: "cover" }).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch { return null; }
}

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const share = await findApprovedShare(code);
  if (!share) return new Response("Not found", { status: 404 });
  try {
    const [font, logo, photo, qr] = await Promise.all([
      readFile(path.join(process.cwd(), "app/fonts/plus-jakarta-sans-latin.woff2")),
      readFile(path.join(process.cwd(), "public/images/sitguru-logo-final.png"))
        .then(data => sharp(data).resize({ width: 220 }).png().toBuffer())
        .then(data => `data:image/png;base64,${data.toString("base64")}`),
      safePhoto(share.guru.photoUrl),
      QRCode.toDataURL(guruMatchQrUrl(code), { width: 360, margin: 2, errorCorrectionLevel: "H" }),
    ]);
    const service = GURU_MATCH_SERVICES.find(item => item.key === share.service_key)?.label || "Pet Care";
    const family = "SitGuru";
    return new ImageResponse(
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#F4F7FB", fontFamily: family }}>
        <div style={{ height: 210, display: "flex", flexDirection: "column", background: "linear-gradient(110deg,#0F2744,#0D5C3A)", padding: "27px 58px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} alt="" width={115} height={65} style={{ objectFit: "contain" }} />
            <span style={{ fontSize: 21, fontWeight: 800, letterSpacing: 2, color: "#BBF7D0" }}>LOCAL PET CARE</span>
          </div>
          <div style={{ marginTop: 9, fontSize: 45, lineHeight: 1.15, fontWeight: 800, color: "white" }}>Need pet care nearby?</div>
          <div style={{ marginTop: 7, fontSize: 23, color: "#E5F7F0" }}>Meet a local SitGuru Guru and explore their services.</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", margin: "24px 48px 0", padding: "22px 26px", height: 315, borderRadius: 28, background: "white" }}>
          <div style={{ display: "flex", alignItems: "center", flex: 1, gap: 26 }}>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", width: 156, height: 156, borderRadius: 78, overflow: "hidden", background: "#DCFCE7" }}>
              {photo ? <img src={photo} alt="" width={156} height={156} style={{ objectFit: "cover" }} /> :
                <span style={{ fontSize: 62, fontWeight: 800, color: "#0D5C3A" }}>SG</span>}
            </div>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, minWidth: 0, gap: 12 }}>
              <div style={{ fontSize: 37, lineHeight: 1.15, fontWeight: 800, color: "#0F2744" }}>{share.guru.name.slice(0, 42)}</div>
              <div style={{ fontSize: 23, color: "#475569" }}>{share.city}, {share.state}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: "#0D5C3A" }}>{service}</div>
              <div style={{ display: "flex", fontSize: 18, fontWeight: 700, color: "#1D4ED8" }}>View services and availability on SitGuru</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 244, gap: 5, padding: 7, background: "#F8FAFC", borderRadius: 16 }}>
              <img src={qr} alt="" width={210} height={210} />
              <span style={{ fontSize: 16, fontWeight: 800, color: "#0F2744" }}>Scan to meet this Guru</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", margin: "20px 60px 0", fontSize: 17, color: "#475569" }}>sitguru.com  |  Verify availability and pet needs with the Guru</div>
      </div>,
      {
        width: 1200, height: 630,
        fonts: [{ name: family, data: font, weight: 800, style: "normal" }],
        headers: {
          "Cache-Control": "private, no-store",
          "Content-Disposition": 'inline; filename="sitguru-guru-share.png"',
        },
      }
    );
  } catch (error) {
    console.error("Unable to render Guru Match PNG", error);
    return new Response("Card image temporarily unavailable", { status: 503 });
  }
}
