import { NextRequest, NextResponse } from "next/server";
import { resolveCommunityGeography } from "@/lib/community/geography-queries";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const zip = searchParams.get("zip");
  const slug = searchParams.get("slug");
  const geoid = searchParams.get("geoid");
  const county = searchParams.get("county");
  const state = searchParams.get("state");

  if (!zip && !slug && !geoid && !(county && state)) {
    return NextResponse.json(
      {
        ok: false,
        error: "Provide zip, slug, geoid, or county+state.",
      },
      { status: 400 },
    );
  }

  try {
    const resolved = await resolveCommunityGeography({
      zip,
      slug,
      geoid,
      county,
      state,
    });

    if (!resolved) {
      return NextResponse.json(
        {
          ok: false,
          error: "Location could not be resolved.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(resolved);
  } catch (error) {
    console.warn("GET /api/search/resolve:", error);
    return NextResponse.json(
      {
        ok: false,
        error: "Could not resolve that location right now.",
      },
      { status: 500 },
    );
  }
}
