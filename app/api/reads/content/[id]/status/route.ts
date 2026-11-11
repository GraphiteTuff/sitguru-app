import { NextResponse } from "next/server";
import { requireReadsStaffApi } from "@/lib/reads/access";
import {
  setReadsFeatured,
  transitionReadsStatus,
} from "@/lib/reads/workflow";
import type { ReadsStatus } from "@/lib/reads/types";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  const auth = await requireReadsStaffApi("intern");
  if (auth.response) return auth.response;

  try {
    const { id } = await params;
    const body = await request.json();

    if (body.action === "feature") {
      const result = await setReadsFeatured(
        auth.identity,
        id,
        Boolean(body.featured),
        body.feature_type || null,
      );
      return NextResponse.json({ ok: true, ...result });
    }

    const toStatus = String(body.status || "") as ReadsStatus;
    if (!toStatus) {
      return NextResponse.json({ error: "status required" }, { status: 400 });
    }

    const result = await transitionReadsStatus(
      auth.identity,
      id,
      toStatus,
      body.note,
      {
        scheduled_at: body.scheduled_at,
      },
    );
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update status.",
      },
      { status: 400 },
    );
  }
}
