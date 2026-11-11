import { NextResponse } from "next/server";
import { requireReadsStaffApi } from "@/lib/reads/access";
import { upsertTeamPick } from "@/lib/reads/workflow";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireReadsStaffApi("intern");
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("reads_team_picks")
    .select("*, team_member:reads_team_members(*), content:reads_content(*)")
    .order("display_order", { ascending: true })
    .limit(200);

  if (error) {
    return NextResponse.json({ items: [], warning: error.message });
  }
  return NextResponse.json({ items: data || [] });
}

export async function POST(request: Request) {
  const auth = await requireReadsStaffApi("intern");
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await upsertTeamPick(auth.identity, body);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to save team pick.",
      },
      { status: 400 },
    );
  }
}
