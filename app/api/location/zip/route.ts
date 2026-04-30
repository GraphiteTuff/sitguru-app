import { NextResponse } from "next/server";

type ZipLookupResponse = {
  "post code"?: string;
  country?: string;
  "country abbreviation"?: string;
  places?: Array<{
    "place name"?: string;
    longitude?: string;
    state?: string;
    "state abbreviation"?: string;
    latitude?: string;
  }>;
};

function cleanZip(value: string | null) {
  return (value || "").replace(/\D/g, "").slice(0, 5);
}

function parseCoordinate(value: string | undefined) {
  if (!value) return null;

  const parsed = Number(value);

  return Number.isFinite(parsed) ? parsed : null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const zip = cleanZip(searchParams.get("zip"));

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
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);

    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      method: "GET",
      signal: controller.signal,
      headers: {
        Accept: "application/json",
      },
      cache: "force-cache",
      next: {
        revalidate: 60 * 60 * 24 * 30,
      },
    });

    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        {
          ok: false,
          error: "ZIP code was not found.",
        },
        { status: 404 },
      );
    }

    const data = (await response.json()) as ZipLookupResponse;
    const place = data.places?.[0];

    const city = place?.["place name"]?.trim() || "";
    const state = place?.["state abbreviation"]?.trim() || "";
    const stateName = place?.state?.trim() || "";
    const latitude = parseCoordinate(place?.latitude);
    const longitude = parseCoordinate(place?.longitude);

    if (!city || !state || latitude === null || longitude === null) {
      return NextResponse.json(
        {
          ok: false,
          error: "ZIP lookup did not return enough location information.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      zip,
      city,
      state,
      stateName,
      latitude,
      longitude,
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