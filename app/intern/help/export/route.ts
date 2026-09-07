import { NextResponse } from "next/server";
import { requireInternHelpAccess } from "@/lib/internship/intern-help-access";
import {
  INTERN_GUIDE_DOWNLOAD_NAME,
  internGuideWordBuffer,
} from "@/lib/internship/intern-guide-document";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  await requireInternHelpAccess();
  const bytes = await internGuideWordBuffer();
  return new NextResponse(bytes, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${INTERN_GUIDE_DOWNLOAD_NAME}.docx"`,
      "Cache-Control": "private, no-store",
    },
  });
}
