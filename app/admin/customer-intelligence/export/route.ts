import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const destination = new URL("/admin/petparents/export", request.url);
  destination.search = request.nextUrl.search;
  return NextResponse.redirect(destination, 308);
}
