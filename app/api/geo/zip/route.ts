import { NextResponse } from "next/server";
import { cleanZipCode, lookupZipLocation } from "@/lib/location/zip-lookup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = cleanZipCode(searchParams.get("zip"));

  if (zip.length !== 5) {
    return NextResponse.json(
      {
        error: "Enter a valid 5-digit ZIP code.",
      },
      { status: 400 },
    );
  }

  try {
    const location = await lookupZipLocation(zip);

    if (!location?.city || !location.state) {
      return NextResponse.json(
        {
          error: "ZIP code was not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      zip: location.zip,
      city: location.city,
      state: location.state,
      stateName: location.stateName || "",
      latitude: location.latitude ?? null,
      longitude: location.longitude ?? null,
    });
  } catch (error) {
    console.error("ZIP lookup failed:", error);

    return NextResponse.json(
      {
        error: "Unable to look up ZIP code right now.",
      },
      { status: 500 },
    );
  }
}
