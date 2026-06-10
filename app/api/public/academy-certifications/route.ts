import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

type AcademyType = "guru" | "pet_parent" | "ambassador";

const VALID_ACADEMY_TYPES = new Set<AcademyType>([
  "guru",
  "pet_parent",
  "ambassador",
]);

function statusMeansComplete(value?: string | null) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();

  return [
    "issued",
    "complete",
    "completed",
    "done",
    "approved",
    "certified",
    "graduate",
    "graduated",
  ].includes(normalized);
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;

    const academyType = String(
      searchParams.get("academyType") || "guru",
    ).trim() as AcademyType;

    const userIds = Array.from(
      new Set(
        String(searchParams.get("userIds") || "")
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      ),
    ).slice(0, 150);

    if (!VALID_ACADEMY_TYPES.has(academyType)) {
      return NextResponse.json(
        {
          error: "Invalid academy type.",
          certifiedUserIds: [],
        },
        { status: 400 },
      );
    }

    if (!userIds.length) {
      return NextResponse.json({
        academyType,
        certifiedUserIds: [],
      });
    }

    const { data, error } = await supabaseAdmin
      .from("academy_certifications")
      .select("user_id, badge_status, certificate_status, issued_at")
      .eq("academy_type", academyType)
      .in("user_id", userIds);

    if (error) {
      console.error("Public academy certification lookup failed:", error);

      return NextResponse.json(
        {
          error: "Unable to load academy certifications.",
          certifiedUserIds: [],
        },
        { status: 500 },
      );
    }

    const certifiedUserIds = (data || [])
      .filter((row) =>
        Boolean(
          row.issued_at ||
            statusMeansComplete(row.badge_status) ||
            statusMeansComplete(row.certificate_status),
        ),
      )
      .map((row) => String(row.user_id || "").trim())
      .filter(Boolean);

    return NextResponse.json({
      academyType,
      certifiedUserIds,
    });
  } catch (error) {
    console.error("Public academy certification route failed:", error);

    return NextResponse.json(
      {
        error: "Unable to load academy certifications.",
        certifiedUserIds: [],
      },
      { status: 500 },
    );
  }
}