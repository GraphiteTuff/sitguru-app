import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const publicToken = body?.public_token;

    if (!publicToken || typeof publicToken !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid public_token" },
        { status: 400 }
      );
    }

    // TODO: Replace this placeholder with your real Plaid token exchange logic.
    // This file currently needs a valid exported POST handler so Next.js can build.
    return NextResponse.json({
      success: true,
      message: "Plaid exchange-token route is wired up.",
      public_token_received: true,
    });
  } catch (error) {
    console.error("Plaid exchange-token route error:", error);

    return NextResponse.json(
      { error: "Failed to exchange Plaid token" },
      { status: 500 }
    );
  }
}