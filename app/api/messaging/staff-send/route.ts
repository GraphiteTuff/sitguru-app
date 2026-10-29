import { NextResponse } from "next/server";
import { saveStaffMessage } from "@/lib/messaging/staff-actions";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as {
    conversationId?: string;
    subject?: string;
    body?: string;
    media?: { url: string; mimeType?: string; name?: string }[];
    recipientId?: string;
    audience?: string;
  } | null;
  const saved = await saveStaffMessage({
    conversationId: body?.conversationId,
    subject: body?.subject,
    body: body?.body,
    media: body?.media,
    recipientId: body?.recipientId,
    audience: body?.audience,
    visibility: "participant",
  });
  if (!saved.ok) return NextResponse.json(saved, { status: 400 });
  return NextResponse.json(saved);
}
