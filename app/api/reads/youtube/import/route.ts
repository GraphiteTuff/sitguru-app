import { NextResponse } from "next/server";
import { requireReadsStaffApi } from "@/lib/reads/access";
import { importYoutubeVideo } from "@/lib/reads/workflow";

export async function POST(request: Request) {
  const auth = await requireReadsStaffApi("intern");
  if (auth.response) return auth.response;

  try {
    const body = await request.json();
    const result = await importYoutubeVideo(auth.identity, {
      urlOrId: String(body.urlOrId || body.url || body.videoId || ""),
      title: body.title,
      description: body.description,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to import YouTube video.",
      },
      { status: 400 },
    );
  }
}
