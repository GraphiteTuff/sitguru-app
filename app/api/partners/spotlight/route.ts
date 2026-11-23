import { NextResponse } from "next/server";
import { getHomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight";
export const dynamic = "force-dynamic";
export async function GET() {
  const spotlight = await getHomepagePartnerSpotlight();
  return NextResponse.json({ spotlight }, { headers: { "Cache-Control": "no-store, max-age=0" } });
}
