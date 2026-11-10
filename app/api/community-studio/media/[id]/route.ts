import { communityActor, communityConfigured, communityMediaUrl } from "@/lib/community-studio/service";
import { resolveRequestUser } from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!communityConfigured()) return new Response("Image unavailable", { status: 404 });
  try {
    let url = await communityMediaUrl(id, null);
    if (!url) {
      const auth = await resolveRequestUser(request);
      url = auth ? await communityMediaUrl(id, await communityActor(auth.user)) : "";
    }
    if (!url) return new Response("Image unavailable", { status: 404 });
    return new Response(null, { status: 302, headers: { Location: url, "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer" } });
  } catch {
    return new Response("Image unavailable", { status: 404 });
  }
}
