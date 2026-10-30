import QRCode from "qrcode";
import { guruPublicUrl } from "@/lib/guru/promote";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const slug = new URL(request.url).searchParams.get("slug") || "";
  const url = guruPublicUrl(slug);
  if (!url) return new Response("Invalid profile", { status: 400 });

  const { data } = await supabaseAdmin
    .from("gurus")
    .select("slug")
    .eq("slug", slug)
    .limit(1);

  const found = Array.isArray(data) ? data[0] : null;
  if (!found?.slug) return new Response("Profile not found", { status: 404 });

  const png = await QRCode.toBuffer(url, {
    errorCorrectionLevel: "H",
    margin: 2,
    width: 640,
    color: { dark: "#07132F", light: "#FFFFFF" },
  });

  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
