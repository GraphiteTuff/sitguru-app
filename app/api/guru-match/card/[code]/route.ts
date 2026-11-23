import { NextResponse } from "next/server";
import sharp from "sharp";
import QRCode from "qrcode";
import {findApprovedShare,guruMatchQrUrl} from "@/lib/guru-match/service";
import {GURU_MATCH_SERVICES} from "@/lib/guru-match/matching";

export const runtime="nodejs";export const dynamic="force-dynamic";
function xml(value:string){
  return value.replace(/&/g,"&amp;").replace(/</g,"&lt;")
    .replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&apos;");
}
async function publicGuruPhoto(raw:string|null){
  if(!raw)return "";
  try{
    const url=new URL(raw);
    if(url.protocol!=="https:" || url.hostname!=="mmtjhxnzuglbyumbsjhs.supabase.co" ||
      !url.pathname.startsWith("/storage/v1/object/public/guru-photos/"))return "";
    const response=await fetch(url.toString(),{cache:"no-store",signal:AbortSignal.timeout(4500)});
    if(!response.ok||!response.headers.get("content-type")?.startsWith("image/"))return "";
    if(Number(response.headers.get("content-length")||0)>2000000)return "";
    const file=Buffer.from(await response.arrayBuffer());
    if(file.length>2000000)return "";
    const png=await sharp(file).resize(190,190,{fit:"cover"}).png().toBuffer();
    return `<image x="86" y="289" width="190" height="190" clip-path="url(#circle)" href="data:image/png;base64,${png.toString("base64")}"/>`;
  }catch{return "";}
}
export async function GET(_request:Request,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  const share=await findApprovedShare(code);
  if(!share)return new Response("Not found",{status:404});
  const qrcode=await QRCode.toDataURL(guruMatchQrUrl(code),{width:260,margin:2,errorCorrectionLevel:"H"});
  const picture=await publicGuruPhoto(share.guru.photoUrl);
  const service=GURU_MATCH_SERVICES.find(x=>x.key===share.service_key)?.label||"Pet care";
  const title=xml(share.guru.name.slice(0,42));
  const city=xml(share.city.slice(0,60)+", "+share.state);
  const label=xml(service);
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
    <defs>
      <linearGradient id="hero" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0F2744"/><stop offset="1" stop-color="#0D5C3A"/></linearGradient>
      <clipPath id="circle"><circle cx="181" cy="384" r="95"/></clipPath>
    </defs>
    <rect width="1200" height="630" fill="#F4F7FB"/>
    <rect width="1200" height="208" fill="url(#hero)"/>
    <text x="78" y="71" font-family="Arial, sans-serif" font-size="30" fill="#BBF7D0" font-weight="bold">SitGuru  •  LOCAL PET CARE</text>
    <text x="78" y="137" font-family="Arial, sans-serif" font-size="49" fill="#FFFFFF" font-weight="bold">Need trusted pet care nearby?</text>
    <text x="80" y="180" font-family="Arial, sans-serif" font-size="24" fill="#E5F7F0">Meet a local SitGuru Guru and explore their services.</text>
    <rect x="56" y="238" width="1088" height="336" rx="34" fill="#FFFFFF"/>
    <circle cx="181" cy="384" r="95" fill="#DCFCE7"/>
    ${picture}
    ${picture?"":'<text x="140" y="407" font-family="Arial, sans-serif" font-size="72" fill="#0D5C3A">🐾</text>'}
    <text x="309" y="323" font-family="Arial, sans-serif" font-size="37" fill="#0F2744" font-weight="bold">${title}</text>
    <text x="310" y="368" font-family="Arial, sans-serif" font-size="23" fill="#475569">${city}</text>
    <text x="310" y="410" font-family="Arial, sans-serif" font-size="28" fill="#0D5C3A" font-weight="bold">${label}</text>
    <rect x="310" y="444" width="418" height="54" rx="18" fill="#EFF6FF"/>
    <text x="330" y="479" font-family="Arial, sans-serif" font-size="21" fill="#1D4ED8" font-weight="bold">View services &amp; availability on SitGuru</text>
    <rect x="840" y="259" width="271" height="279" rx="16" fill="#F8FAFC"/>
    <image x="857" y="266" width="237" height="237" href="${qrcode}"/>
    <text x="874" y="526" font-family="Arial, sans-serif" font-size="19" fill="#0F2744" font-weight="bold">Scan to meet this Guru</text>
    <text x="76" y="606" font-family="Arial, sans-serif" font-size="16" fill="#475569">sitguru.com • Match availability and pet needs directly with the Guru</text>
  </svg>`;
  const png=await sharp(Buffer.from(svg)).png().toBuffer();
  return new NextResponse(new Uint8Array(png),{
    headers:{"Content-Type":"image/png","Cache-Control":"private, no-store",
      "Content-Disposition":'attachment; filename="sitguru-guru-share.png"'},
  });
}
