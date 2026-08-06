import { NextResponse } from "next/server";
import { cleanZipCode, lookupZipLocation } from "@/lib/location/zip-lookup";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = cleanZipCode(searchParams.get("zip"));

  if (zip.length !== 5) {
    return NextResponse.json(
      {
        ok: false,
        error: "Please enter a valid 5-digit ZIP code.",
      },
      { status: 400 },
    );
  }

  try {
    const location = await lookupZipLocation(zip);

    if (
      !location ||
      !location.city ||
      !location.state ||
      location.latitude == null ||
      location.longitude == null
    ) {
      return NextResponse.json(
        {
          ok: false,
          error: "ZIP code was not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      zip: location.zip,
      city: location.city,
      state: location.state,
      stateName: location.stateName || "",
      latitude: location.latitude,
      longitude: location.longitude,
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        error: "Could not look up that ZIP code right now.",
      },
      { status: 500 },
    );
  }
}
