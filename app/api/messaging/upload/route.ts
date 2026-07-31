// app/api/messaging/upload/route.ts
/**
 * Upload chat image/video attachments to Supabase Storage (chat-media bucket).
 */

import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const BUCKET = "chat-media";
const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/webm",
]);

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();
    const file = form.get("file");
    const conversationId = String(form.get("conversationId") || "").trim();

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "file is required" },
        { status: 400 },
      );
    }

    if (!conversationId) {
      return NextResponse.json(
        { ok: false, error: "conversationId is required" },
        { status: 400 },
      );
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File must be under 25MB." },
        { status: 400 },
      );
    }

    const mime = file.type || "application/octet-stream";
    if (!ALLOWED.has(mime)) {
      return NextResponse.json(
        { ok: false, error: "Only image/video uploads are supported." },
        { status: 400 },
      );
    }

    const ext =
      mime.split("/")[1]?.replace("quicktime", "mov") ||
      file.name.split(".").pop() ||
      "bin";
    const path = `${conversationId}/${user.id}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(path, buffer, {
        contentType: mime,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            uploadError.message ||
            `Upload failed. Confirm the "${BUCKET}" bucket exists.`,
        },
        { status: 500 },
      );
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(path);

    // Prefer signed URL if bucket is private
    const { data: signed } = await supabaseAdmin.storage
      .from(BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 7);

    return NextResponse.json({
      ok: true,
      media: {
        url: signed?.signedUrl || publicData.publicUrl,
        path,
        bucket: BUCKET,
        mimeType: mime,
        name: file.name,
        size: file.size,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
