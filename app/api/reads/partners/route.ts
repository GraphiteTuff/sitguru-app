import { NextResponse } from "next/server";
import { requireReadsStaffApi } from "@/lib/reads/access";
import { updatePartnerPipeline } from "@/lib/reads/partners";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET() {
  const auth = await requireReadsStaffApi("manager");
  if (auth.response) return auth.response;

  const { data, error } = await supabaseAdmin
    .from("reads_partners")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(200);

  if (error) {
    return NextResponse.json({ items: [], warning: error.message });
  }
  return NextResponse.json({ items: data || [] });
}

export async function PATCH(request: Request) {
  const auth = await requireReadsStaffApi("manager");
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    if (!body.id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }
    const result = await updatePartnerPipeline(body.id, {
      status: body.status,
      notes_private: body.notes_private,
      escalated_to_admin: body.escalated_to_admin,
      escalation_reason: body.escalation_reason,
      actorId: auth.identity.id,
      actorEmail: auth.identity.email,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to update partner.",
      },
      { status: 400 },
    );
  }
}
