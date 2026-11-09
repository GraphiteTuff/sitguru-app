// app/api/messaging/presence/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { createClient } from "@/lib/supabase/server";
import { touchUserPresence } from "@/lib/messaging/presence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = await getAdminIdentity();
  const userId = user?.id || admin?.id || "";

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    isOnline?: boolean;
    deviceLabel?: string;
  };

  const result = await touchUserPresence({
    userId,
    isOnline: body.isOnline !== false,
    deviceLabel: body.deviceLabel,
  });

  return NextResponse.json({ ok: result.ok, error: "error" in result ? result.error : undefined });
}
