import { NextResponse } from "next/server";
import {
  createGuruCredential,
  findGuruForUser,
  getGuruCredentialWorkspace,
  requireSignedInUser,
} from "@/lib/credentials/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await requireSignedInUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in as a Guru." }, { status: 401 });
  }

  const workspace = await getGuruCredentialWorkspace(user.id);
  return NextResponse.json({ ok: true, ...workspace });
}

export async function POST(request: Request) {
  const user = await requireSignedInUser(request);
  if (!user) {
    return NextResponse.json({ error: "Please sign in as a Guru." }, { status: 401 });
  }

  const guru = await findGuruForUser(user.id);
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;

  try {
    const created = await createGuruCredential({
      userId: user.id,
      guruId: guru?.id != null ? String(guru.id) : null,
      typeSlug: String(body.typeSlug || ""),
      providerId: body.providerId ? String(body.providerId) : null,
      customProviderName: body.customProviderName ? String(body.customProviderName) : null,
      credentialName: body.credentialName ? String(body.credentialName) : null,
      reference: body.reference ? String(body.reference) : null,
      issueDate: body.issueDate ? String(body.issueDate) : null,
      expirationDate: body.expirationDate ? String(body.expirationDate) : null,
      verificationUrl: body.verificationUrl ? String(body.verificationUrl) : null,
      submissionNotes: body.submissionNotes ? String(body.submissionNotes) : null,
      metadata:
        body.metadata && typeof body.metadata === "object"
          ? (body.metadata as Record<string, unknown>)
          : {},
      status: "submitted",
    });

    return NextResponse.json({ ok: true, credential: created });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to add credential.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
