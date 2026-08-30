import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireEventHostPartnerAccount } from "@/lib/community/partner-access";
import { uploadEventImageWithClient } from "@/lib/community/event-images-server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const access = await requireEventHostPartnerAccount();

  if (!access.ok || !access.userId) {
    return NextResponse.json({ error: access.error }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Image file is required." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const uploaded = await uploadEventImageWithClient(supabase, access.userId, file);

    return NextResponse.json({
      ok: true,
      ...uploaded,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
