import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ZipLookupResponse = {
  zip: string;
  city: string;
  state: string;
  stateName?: string;
};

type ZippopotamPlace = {
  "place name"?: string;
  state?: string;
  "state abbreviation"?: string;
};

type ZippopotamResponse = {
  "post code"?: string;
  country?: string;
  "country abbreviation"?: string;
  places?: ZippopotamPlace[];
};

function cleanZip(value: string | null) {
  return String(value || "")
    .replace(/\D/g, "")
    .slice(0, 5);
}

export async function GET(req: NextRequest) {
  try {
    const zip = cleanZip(req.nextUrl.searchParams.get("zip"));

    if (!zip || zip.length !== 5) {
      return NextResponse.json(
        {
          error: "A valid 5-digit ZIP code is required.",
        },
        { status: 400 },
      );
    }

    const response = await fetch(`https://api.zippopotam.us/us/${zip}`, {
      cache: "force-cache",
      next: {
        revalidate: 60 * 60 * 24 * 30,
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "ZIP code not found.",
        },
        { status: 404 },
      );
    }

    const data = (await response.json()) as ZippopotamResponse;
    const place = data.places?.[0];

    const payload: ZipLookupResponse = {
      zip,
      city: place?.["place name"] || "",
      state: place?.["state abbreviation"] || "",
      stateName: place?.state || "",
    };

    if (!payload.city || !payload.state) {
      return NextResponse.json(
        {
          error: "ZIP code lookup did not return city/state information.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json(payload);
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