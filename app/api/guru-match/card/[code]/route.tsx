import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";
import sharp from "sharp";
import QRCode from "qrcode";
import { findApprovedShare, guruMatchQrUrl } from "@/lib/guru-match/service";
import { GURU_MATCH_SERVICES } from "@/lib/guru-match/matching";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Next ImageResponse requires TTF/OTF/WOFF fonts; SVG/Sharp fallback fonts
 * produce empty squares in Vercel's minimal Linux runtime. */
async function cardFont(): Promise<ArrayBuffer> {
  const base64 = await readFile(path.join(process.cwd(), "app/fonts/plus-jakarta-sans-latin.ttf.base64"), "utf8");
  const font = Buffer.from(base64, "base64");
  return font.buffer.slice(font.byteOffset, font.byteOffset + font.byteLength) as ArrayBuffer;
}

async function safePhoto(raw: string | null): Promise<string | null> {
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
    const png = await sharp(original).resize(200, 200, { fit: "cover" }).png().toBuffer();
    return "data:image/png;base64," + png.toString("base64");
  } catch {
    return null;
  }
}
const cardText = (text: string, maximum = 75) => {
  const normalized = String(text || "").replace(/[\u0000-\u001f\u007f]/g," ").trim();
  return normalized.length > maximum ? normalized.slice(0,maximum-1) + "…" : normalized;
};

export async function GET(_request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const share = await findApprovedShare(code);
  if (!share) return new Response("Not found", { status: 404 });
  try {
    const [font, logo, photo, qr] = await Promise.all([
      cardFont(),
      readFile(path.join(process.cwd(), "public/images/sitguru-logo-final.png"))
        .then(buffer => sharp(buffer).resize({ width: 205 }).png().toBuffer())
        .then(buffer => "data:image/png;base64," + buffer.toString("base64")),
      safePhoto(share.guru.photoUrl),
      QRCode.toDataURL(guruMatchQrUrl(code), { width: 380, margin: 2, errorCorrectionLevel: "H" }),
    ]);
    const community=share.promotionType==="community";
    const name = community?"SitGuru Pet Care":cardText(share.guru.name,34);
    const city = cardText(share.city, 42);
    const state = cardText(share.state, 2);
    const service = community?"Explore local pet care":cardText(GURU_MATCH_SERVICES.find(s => s.key === share.service_key)?.label || "Pet care", 34);
    const initials = name.split(/\s+/).slice(0,2).map(p => p[0] || "").join("").toUpperCase() || "SG";
    return new ImageResponse(
      <div style={{ display:"flex",flexDirection:"column",width:"100%",height:"100%",fontFamily:"GuruSans",
        backgroundColor:"#F4F7FB",color:"#0F2744" }}>
        <div style={{display:"flex",height:192,padding:"24px 36px",alignItems:"center",gap:30,
          backgroundImage:"linear-gradient(110deg,#0F2744,#0D5C3A)"}}>
          <div style={{display:"flex",backgroundColor:"white",borderRadius:16,padding:10,width:215,height:82,
            alignItems:"center",justifyContent:"center"}}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={logo} width={194} height={64} alt="SitGuru" style={{objectFit:"contain"}}/>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <span style={{fontSize:20,letterSpacing:3,color:"#BBF7D0"}}>LOCAL PET CARE</span>
            <span style={{fontSize:44,color:"white"}}>Need pet care nearby?</span>
            <span style={{fontSize:22,color:"#D1FAE5"}}>{community?"Explore pet care in your community.":"Meet a SitGuru Guru in your community."}</span>
          </div>
        </div>
        <div style={{display:"flex",height:355,margin:"24px 30px 10px",padding:26,borderRadius:24,
          backgroundColor:"#FFFFFF",border:"2px solid #DCE8E5",gap:25,alignItems:"center"}}>
          <div style={{display:"flex",height:170,width:170,borderRadius:85,overflow:"hidden",
            alignItems:"center",justifyContent:"center",backgroundColor:"#DCFCE7",flexShrink:0}}>
            {photo
              ? <img src={photo} width={170} height={170} alt="" style={{objectFit:"cover"}}/>
              : <span style={{fontSize:56,color:"#0D5C3A"}}>{initials}</span>}
          </div>
          <div style={{display:"flex",flexDirection:"column",justifyContent:"center",gap:17,flexGrow:1,
            width:590,minWidth:0}}>
            <span style={{fontSize:name.length > 24 ? 31 : 39,lineHeight:1.15}}>{name}</span>
            <span style={{fontSize:25,color:"#475569"}}>{city}, {state}</span>
            <span style={{fontSize:30,color:"#0D5C3A"}}>{service}</span>
            <span style={{fontSize:18,color:"#2563EB"}}>{community?"Find local pet care options on SitGuru":"Explore services and availability on SitGuru"}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
            padding:12,borderRadius:18,backgroundColor:"#F8FAFC",border:"1px solid #E2E8F0",
            width:222,gap:6,flexShrink:0}}>
            <img src={qr} width={188} height={188} alt="QR code" />
            <span style={{fontSize:13}}>{community?"Scan to find pet care":"Scan to meet this Guru"}</span>
          </div>
        </div>
        <div style={{display:"flex",padding:"6px 44px",fontSize:18,color:"#475569"}}>
          {community?"sitguru.com · Find providers and confirm services before booking":"sitguru.com · Check availability and pet compatibility with the Guru"}
        </div>
      </div>,
      {width:1200,height:630,fonts:[{name:"GuruSans",data:font,weight:700,style:"normal"}],
        headers:{"Cache-Control":"private, no-store",
          "Content-Disposition":'inline; filename="sitguru-guru-share.png"'}}
    );
  } catch (error) {
    console.error("Unable to render Guru Match PNG", error);
    return new Response("Card image temporarily unavailable", { status: 503 });
  }
}
