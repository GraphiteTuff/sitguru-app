import { NextRequest, NextResponse } from "next/server";
import { reverseGeocode } from "@/lib/geocoding/reverseGeocode";
import { nearbyMetroChips } from "@/lib/community/us-metros";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const latitude = Number(req.nextUrl.searchParams.get("lat"));
  const longitude = Number(req.nextUrl.searchParams.get("lng"));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return NextResponse.json(
      { error: "A map location is required." },
      { status: 400 },
    );
  }

  try {
    const place = await reverseGeocode(latitude, longitude);
    const nearby = nearbyMetroChips({
      latitude: place.latitude,
      longitude: place.longitude,
      city: place.city,
      county: place.county,
      state: place.state,
    });

    return NextResponse.json({
      city: place.city,
      county: place.county,
      state: place.state,
      latitude: place.latitude,
      longitude: place.longitude,
      label: place.formattedAddress,
      nearby,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not read this location.",
        nearby: nearbyMetroChips({ latitude, longitude }),
      },
      { status: 400 },
    );
  }
}
