import { NextResponse } from "next/server";
import { requireReadsStaffApi } from "@/lib/reads/access";
import { fetchStaffContent } from "@/lib/reads/queries";
import { upsertReadsContent } from "@/lib/reads/workflow";

export async function GET(request: Request) {
  const auth = await requireReadsStaffApi("intern");
  if (auth.response) return auth.response;

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status") || undefined;
  const contentType = searchParams.get("contentType") || undefined;
  const mine = searchParams.get("mine") === "1";

  const rows = await fetchStaffContent({
    status,
    contentType,
    createdBy:
      mine || auth.identity.staffRole === "intern"
        ? auth.identity.id
        : undefined,
  });

  return NextResponse.json({ items: rows });
}

export async function POST(request: Request) {
  const auth = await requireReadsStaffApi("intern");
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await upsertReadsContent(auth.identity, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save content.",
      },
      { status: 400 },
    );
  }
}
