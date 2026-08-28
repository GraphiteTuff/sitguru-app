import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAdminApi } from "@/lib/admin/access";
import { uploadEventImageWithClient } from "@/lib/community/event-images-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const admin = await requireAdminApi();

  if (!admin.identity) {
    return NextResponse.json({ error: "Admin access required." }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const uploaded = await uploadEventImageWithClient(supabase, admin.identity.id, file);

    return NextResponse.json({
      ok: true,
      ...uploaded,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
