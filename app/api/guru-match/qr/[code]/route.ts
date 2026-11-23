import { NextResponse } from "next/server";
import QRCode from "qrcode";
import {findApprovedShare,guruMatchQrUrl} from "@/lib/guru-match/service";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function GET(_request:Request,{params}:{params:Promise<{code:string}>}){
  const {code}=await params;
  if(!await findApprovedShare(code))return new Response("Not found",{status:404});
  const png=await QRCode.toBuffer(guruMatchQrUrl(code),{type:"png",width:480,margin:2,errorCorrectionLevel:"H"});
  return new NextResponse(new Uint8Array(png),{
    headers:{"Content-Type":"image/png","Cache-Control":"private, no-store",
      "Content-Disposition":`inline; filename="sitguru-guru-qr.png"`},
  });
}
