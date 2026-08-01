import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";
import {
  asActionString,
  getDepartmentLabel,
  isAdminDepartmentKey,
  normalizeDirectoryUser,
} from "@/lib/admin/user-directory-actions";
import { createOrGetAdminConversation } from "@/lib/messaging/create-or-get-admin-conversation";

export const dynamic = "force-dynamic";

type StartPayload = {
  department?: string | null;
  departmentLabel?: string | null;
  threadType?: string | null;
  source?: string | null;
  opener?: string | null;
  user?: {
    id?: string | null;
    email?: string | null;
    name?: string | null;
    role?: string | null;
    source?: string | null;
  } | null;
  recipientId?: string | null;
  recipientEmail?: string | null;
  recipientName?: string | null;
  recipientRole?: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const { adminUser } = await requireAdminUser(request);
    const payload = (await request.json().catch(() => ({}))) as StartPayload;

    const departmentRaw = asActionString(payload.department);
    const department = isAdminDepartmentKey(departmentRaw)
      ? departmentRaw
      : departmentRaw || null;

    const user =
      normalizeDirectoryUser(payload.user) ||
      normalizeDirectoryUser({
        id: payload.recipientId,
        email: payload.recipientEmail,
        name: payload.recipientName,
        role: payload.recipientRole,
        source: payload.source,
      });

    const result = await createOrGetAdminConversation({
      adminUserId: adminUser.id,
      adminEmail: adminUser.email || null,
      department,
      departmentLabel:
        asActionString(payload.departmentLabel) ||
        (department ? getDepartmentLabel(department) : null),
      user,
      threadType: asActionString(payload.threadType) || null,
      source: asActionString(payload.source) || "admin_users_directory",
      opener: asActionString(payload.opener) || null,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unable to start admin conversation.";

    const status =
      message.toLowerCase().includes("unauthorized") ||
      message.toLowerCase().includes("admin")
        ? 401
        : 400;

    return NextResponse.json({ ok: false, error: message }, { status });
  }
}
