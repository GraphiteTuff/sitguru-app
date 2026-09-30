import { NextResponse } from "next/server";
import {
  requireSignedInUser,
  signedCredentialDocumentUrl,
  updateOwnCredential,
} from "@/lib/credentials/server";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSignedInUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in as a Guru." }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    await updateOwnCredential({ userId: user.id, credentialId: id, patch: body });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to update credential.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const user = await requireSignedInUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in as a Guru." }, { status: 401 });
  }

  const { id } = await context.params;
  const document = new URL(request.url).searchParams.get("document");
  if (document !== "1") {
    return NextResponse.json({ error: "Unsupported request." }, { status: 400 });
  }

  try {
    const url = await signedCredentialDocumentUrl({
      credentialId: id,
      requesterId: user.id,
      admin: false,
    });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open document.";
    return NextResponse.json({ ok: false, error: message }, { status: 403 });
  }
}
