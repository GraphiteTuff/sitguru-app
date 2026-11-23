import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DR_BALDWIN_SLUG, getHomepagePartnerSpotlight } from "@/lib/partners/homepage-spotlight";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("slug") !== DR_BALDWIN_SLUG) return new NextResponse(null, { status: 404 });
  const item = await getHomepagePartnerSpotlight();
  if (!item?.image_path) return new NextResponse(null, { status: 404 });
  const { data, error } = await supabaseAdmin.storage.from("sitguru-community-private").download(item.image_path);
  if (error || !data) return new NextResponse(null, { status: 404 });
  const ext = item.image_path.split(".").pop();
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";
  return new NextResponse(await data.arrayBuffer(), { headers: { "Content-Type": mime, "Cache-Control": "public, max-age=60, must-revalidate", "X-Content-Type-Options": "nosniff" } });
}
