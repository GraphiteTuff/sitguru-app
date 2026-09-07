import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import { internHelpMediaAllowed } from "@/lib/internship/intern-help";

export const dynamic = "force-dynamic";

const MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  await requireInternHelpAccess();
  const relative = ((await params).path || []).join("/");
  if (!internHelpMediaAllowed(relative)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "docs", "intern-guide", relative);
    const bytes = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
