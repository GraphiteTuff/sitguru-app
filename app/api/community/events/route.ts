import { NextRequest, NextResponse } from "next/server";
import { fetchPublicEvents } from "@/lib/community/queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const events = await fetchPublicEvents({
    q: searchParams.get("q") || undefined,
    city: searchParams.get("city") || undefined,
    state: searchParams.get("state") || undefined,
    category: searchParams.get("category") || undefined,
    petFriendly: searchParams.get("petFriendly") === "true",
    isFree:
      searchParams.get("isFree") === "true"
        ? true
        : searchParams.get("isFree") === "false"
          ? false
          : undefined,
    from: searchParams.get("from") || undefined,
    to: searchParams.get("to") || undefined,
    limit: Number(searchParams.get("limit") || 24),
    offset: Number(searchParams.get("offset") || 0),
  });

  return NextResponse.json({ events });
}
