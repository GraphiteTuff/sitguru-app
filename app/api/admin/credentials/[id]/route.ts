import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/admin/access";
import { dispatchNotification } from "@/lib/notifications";
import {
  reviewCredential,
  signedCredentialDocumentUrl,
} from "@/lib/credentials/server";

export const dynamic = "force-dynamic";

const GURU_COPY = {
  verify: {
    title: "Your credential is on your profile 🐾",
    body: "SitGuru reviewed it and Pet Parents can now see this highlight on your Guru profile.",
    type: "credential_verified",
  },
  reject: {
    title: "We need a little more information",
    body: "We couldn't verify this credential yet. Please review the note and update your submission whenever you're ready.",
    type: "credential_rejected",
  },
  revoke: {
    title: "A credential highlight was updated",
    body: "SitGuru removed the public verified status for one of your credentials. You can submit updated information anytime.",
    type: "credential_revoked",
  },
} as const;

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const { id } = await context.params;
  const body = (await request.json().catch(() => ({}))) as {
    action?: "verify" | "reject" | "revoke";
    note?: string;
    rejectionReason?: string;
  };

  if (!body.action || !["verify", "reject", "revoke"].includes(body.action)) {
    return NextResponse.json({ error: "Choose verify, reject, or revoke." }, { status: 400 });
  }

  try {
    const result = await reviewCredential({
      adminId: admin.identity.id,
      credentialId: id,
      action: body.action,
      note: body.note,
      rejectionReason: body.rejectionReason,
    });
    const copy = GURU_COPY[body.action];
    await dispatchNotification({
      userId: result.ownerUserId,
      title: copy.title,
      body: body.action === "reject" && body.rejectionReason
        ? body.rejectionReason
        : copy.body,
      type: copy.type,
      href: "/guru/dashboard/credentials",
      channels: ["in_app"],
    });
    return NextResponse.json({ ok: true, status: result.status });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const admin = await requireAdminApi();
  if (admin.response) return admin.response;

  const { id } = await context.params;
  try {
    const url = await signedCredentialDocumentUrl({
      credentialId: id,
      requesterId: admin.identity.id,
      admin: true,
    });
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to open document.";
    return NextResponse.json({ ok: false, error: message }, { status: 404 });
  }
}
