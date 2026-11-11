import { NextResponse } from "next/server";
import { submitReadsPartnerInquiry } from "@/lib/reads/partners";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      null;
    const result = await submitReadsPartnerInquiry(body, {
      ip,
      userAgent: request.headers.get("user-agent"),
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to submit partnership request.",
      },
      { status: 400 },
    );
  }
}
