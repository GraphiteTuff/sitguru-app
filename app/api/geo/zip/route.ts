import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ZipPlace = {
  "place name"?: string;
  longitude?: string;
  state?: string;
  "state abbreviation"?: string;
  latitude?: string;
};

type ZipResponse = {
  "post code"?: string;
  places?: ZipPlace[];
};

function cleanZip(value: string | null) {
  return String(value || "").replace(/\D/g, "").slice(0, 5);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = cleanZip(searchParams.get("zip"));

  if (zip.length !== 5) {
    return NextResponse.json(
      {
        error: "Enter a valid 5-digit ZIP code.",
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "ZIP code was not found.",
        },
        { status: 404 },
      );
    }

    const data = (await response.json()) as ZipResponse;
    const place = data.places?.[0];

    if (!place) {
      return NextResponse.json(
        {
          error: "ZIP code location was not found.",
        },
        { status: 404 },
      );
    }

    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);

    return NextResponse.json({
      zip,
      city: place["place name"] || "",
      state: place["state abbreviation"] || place.state || "",
      stateName: place.state || "",
      latitude: Number.isFinite(latitude) ? latitude : null,
      longitude: Number.isFinite(longitude) ? longitude : null,
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
