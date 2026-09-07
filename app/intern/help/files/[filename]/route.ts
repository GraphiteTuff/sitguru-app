import { NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import { internHelpFileAllowed } from "@/lib/internship/intern-help";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  await requireInternHelpAccess();
  const filename = (await params).filename;
  if (!internHelpFileAllowed(filename)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const filePath = path.join(process.cwd(), "docs", "intern-guide", "assets", filename);
    const bytes = await readFile(filePath);
    return new NextResponse(bytes, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
