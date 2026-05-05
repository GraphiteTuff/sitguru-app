import { NextResponse } from "next/server";
import { geocodeAddress } from "@/lib/geocoding/geocodeAddress";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const address = body.address;

    if (!address) {
      return NextResponse.json(
        { error: "Address is required." },
        { status: 400 }
      );
    }

    const result = await geocodeAddress(address);

    return NextResponse.json({
      latitude: result.latitude,
      longitude: result.longitude,
      formatted_address: result.formatted_address,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify this location.",
      },
      { status: 400 }
    );
  }
}