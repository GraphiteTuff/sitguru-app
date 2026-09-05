import { NextRequest, NextResponse } from "next/server";
import { findInternByAccount } from "@/lib/internship/queries";
import {
  mobileCorsHeaders,
  optionsWithMobileCors,
  resolveRequestUser,
} from "@/lib/supabase/request-auth";

export const dynamic = "force-dynamic";

function json(req: NextRequest, body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, { status, headers: mobileCorsHeaders(req) });
}

export function OPTIONS(req: NextRequest) {
  return optionsWithMobileCors(req);
}

export async function GET(req: NextRequest) {
  const resolved = await resolveRequestUser(req);
  if (!resolved) return json(req, { intern: false });

  const intern = await findInternByAccount({
    userId: resolved.user.id,
    email: resolved.user.email,
  });

  return json(req, { intern: Boolean(intern) });
}
