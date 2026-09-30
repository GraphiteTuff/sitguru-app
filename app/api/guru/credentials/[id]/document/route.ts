import { NextResponse } from "next/server";
import {
  requireSignedInUser,
  saveCredentialDocument,
} from "@/lib/credentials/server";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSignedInUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in as a Guru." }, { status: 401 });
  }

  const { id } = await context.params;
  const form = await request.formData();
  const file = form.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a PDF, JPG, or PNG." }, { status: 400 });
  }

  try {
    const saved = await saveCredentialDocument({
      userId: user.id,
      credentialId: id,
      file,
    });
    return NextResponse.json({ ok: true, ...saved });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
