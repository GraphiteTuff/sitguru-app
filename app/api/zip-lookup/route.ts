import { NextRequest, NextResponse } from "next/server";
import { cleanZipCode, lookupZipLocation } from "@/lib/location/zip-lookup";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const zip = cleanZipCode(req.nextUrl.searchParams.get("zip"));

    if (!zip || zip.length !== 5) {
      return NextResponse.json(
        {
          error: "A valid 5-digit ZIP code is required.",
        },
        { status: 400 },
      );
    }

    const location = await lookupZipLocation(zip);

    if (!location?.city || !location.state) {
      return NextResponse.json(
        {
          error: "ZIP code not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      zip: location.zip,
      city: location.city,
      state: location.state,
      stateName: location.stateName || "",
    });
  } catch (error) {
    console.error("ZIP lookup failed:", error);

    return NextResponse.json(
      {
        error: "ZIP lookup failed.",
      },
      { status: 500 },
    );
  }
}
