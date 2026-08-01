import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  asActionString,
  getDepartmentLabel,
  isAdminDepartmentKey,
  normalizeDirectoryUser,
  type DirectoryUserContext,
} from "@/lib/admin/user-directory-actions";

type ConversationRow = {
  id: string;
  subject?: string | null;
  status?: string | null;
  topic?: string | null;
  started_by_user_id?: string | null;
  customer_id?: string | null;
  guru_id?: string | null;
  last_message_at?: string | null;
  updated_at?: string | null;
  created_at?: string | null;
};

type ParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
};

type AccessRow = {
  user_id?: string | null;
  role_key?: string | null;
  department_key?: string | null;
  is_active?: boolean | null;
};

export type CreateOrGetAdminConversationInput = {
  adminUserId: string;
  adminEmail?: string | null;
  department?: string | null;
  departmentLabel?: string | null;
  user?: DirectoryUserContext | null;
  threadType?: string | null;
  source?: string | null;
  opener?: string | null;
};

export type CreateOrGetAdminConversationResult = {
  ok: true;
  conversationId: string;
  created: boolean;
  href: string;
  department: string | null;
  departmentLabel: string | null;
};

function normalizeRole(value: unknown) {
  const role = asActionString(value).toLowerCase();
  if (!role) return "user";
  if (role.includes("admin")) return "admin";
  if (role.includes("guru") || role.includes("sitter")) return "guru";
  if (role.includes("ambassador") || role.includes("partner")) return "ambassador";
  if (
    role.includes("customer") ||
    role.includes("parent") ||
    role.includes("pet")
  ) {
    return "customer";
  }
  return role.replace(/\s+/g, "_");
}

function closedStatuses() {
  return new Set(["archived", "deleted", "closed"]);
}

async function safeRows<T>(
  query: PromiseLike<{ data: unknown; error: unknown }>,
  label: string,
): Promise<T[]> {
  try {
    const result = await query;
    if (result.error) {
      console.warn(`createOrGetAdminConversation skipped ${label}:`, result.error);
      return [];
    }
    return Array.isArray(result.data) ? (result.data as T[]) : [];
  } catch (error) {
    console.warn(`createOrGetAdminConversation skipped ${label}:`, error);
    return [];
  }
}

function buildSubject(params: {
  departmentLabel: string | null;
  recipientName: string | null;
}) {
  if (params.departmentLabel && params.recipientName) {
    return `Internal Message: ${params.departmentLabel} · ${params.recipientName}`;
  }
  if (params.departmentLabel) {
    return `Internal Message: ${params.departmentLabel}`;
  }
  if (params.recipientName) {
    return `Direct Message: SitGuru Admin ↔ ${params.recipientName}`;
  }
  return "Internal Message: SitGuru Admin";
}

async function findExistingUserThread(params: {
  adminUserId: string;
  targetUserId: string;
}) {
  const targetRows = await safeRows<ParticipantRow>(
    supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id,user_id,role")
      .eq("user_id", params.targetUserId)
      .limit(200),
    "target_participants",
  );

  const candidateIds = Array.from(
    new Set(
      targetRows
        .map((row) => asActionString(row.conversation_id))
        .filter(Boolean),
    ),
  );

  if (!candidateIds.length) return null;

  const [conversations, participants] = await Promise.all([
    safeRows<ConversationRow>(
      supabaseAdmin
        .from("conversations")
        .select(
          "id,subject,status,topic,started_by_user_id,customer_id,guru_id,last_message_at,updated_at,created_at",
        )
        .in("id", candidateIds),
      "candidate_conversations",
    ),
    safeRows<ParticipantRow>(
      supabaseAdmin
        .from("conversation_participants")
        .select("conversation_id,user_id,role")
        .in("conversation_id", candidateIds),
      "candidate_participants",
    ),
  ]);

  const byConversation = new Map<string, ParticipantRow[]>();
  for (const row of participants) {
    const id = asActionString(row.conversation_id);
    if (!id) continue;
    const list = byConversation.get(id) || [];
    list.push(row);
    byConversation.set(id, list);
  }

  const closed = closedStatuses();

  return (
    conversations
      .filter((conversation) => !closed.has(asActionString(conversation.status).toLowerCase()))
      .filter((conversation) => {
        const rows = byConversation.get(conversation.id) || [];
        const hasTarget = rows.some(
          (row) => asActionString(row.user_id) === params.targetUserId,
        );
        const hasAdmin =
          asActionString(conversation.started_by_user_id) === params.adminUserId ||
          rows.some((row) => {
            const role = normalizeRole(row.role);
            return (
              asActionString(row.user_id) === params.adminUserId ||
              role === "admin" ||
              role === "super_admin" ||
              role === "owner"
            );
          });
        return hasTarget && hasAdmin;
      })
      .sort((a, b) => {
        const aTime = Date.parse(
          asActionString(a.last_message_at) ||
            asActionString(a.updated_at) ||
            asActionString(a.created_at),
        );
        const bTime = Date.parse(
          asActionString(b.last_message_at) ||
            asActionString(b.updated_at) ||
            asActionString(b.created_at),
        );
        return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
      })[0] || null
  );
}

async function findExistingDepartmentThread(params: {
  adminUserId: string;
  departmentLabel: string;
}) {
  const closed = closedStatuses();
  const subjectPrefix = `Internal Message: ${params.departmentLabel}`;

  const conversations = await safeRows<ConversationRow>(
    supabaseAdmin
      .from("conversations")
      .select(
        "id,subject,status,topic,started_by_user_id,customer_id,guru_id,last_message_at,updated_at,created_at",
      )
      .eq("topic", "internal_department")
      .ilike("subject", `${subjectPrefix}%`)
      .order("updated_at", { ascending: false })
      .limit(25),
    "department_conversations",
  );

  return (
    conversations.find((conversation) => {
      const status = asActionString(conversation.status).toLowerCase();
      if (closed.has(status)) return false;
      const subject = asActionString(conversation.subject);
      return subject === subjectPrefix || subject.startsWith(`${subjectPrefix} ·`);
    }) || null
  );
}

async function loadDepartmentMemberIds(department: string, adminUserId: string) {
  if (!department) return [] as Array<{ userId: string; role: string }>;

  const members = await safeRows<AccessRow>(
    supabaseAdmin
      .from("admin_user_access")
      .select("user_id,role_key,department_key,is_active")
      .eq("department_key", department)
      .limit(100),
    "department_members",
  );

  return members
    .map((member) => {
      const userId = asActionString(member.user_id);
      const active = member.is_active === undefined ? true : Boolean(member.is_active);
      if (!active || !userId || userId === adminUserId) return null;
      return {
        userId,
        role: normalizeRole(member.role_key) || "admin",
      };
    })
    .filter(Boolean) as Array<{ userId: string; role: string }>;
}

/**
 * Create or reuse an admin HQ / department / user-context conversation.
 * Safe to call from API routes and server actions.
 */
export async function createOrGetAdminConversation(
  input: CreateOrGetAdminConversationInput,
): Promise<CreateOrGetAdminConversationResult> {
  const adminUserId = asActionString(input.adminUserId);
  if (!adminUserId) {
    throw new Error("Admin user is required.");
  }

  const rawDepartment = asActionString(input.department);
  const department = isAdminDepartmentKey(rawDepartment) ? rawDepartment : rawDepartment || null;
  const departmentLabel = department
    ? asActionString(input.departmentLabel) || getDepartmentLabel(department)
    : asActionString(input.departmentLabel) || null;

  const user = normalizeDirectoryUser(input.user);
  const recipientId = asActionString(user?.id);
  const recipientEmail = asActionString(user?.email);
  const recipientName =
    asActionString(user?.name) ||
    recipientEmail ||
    departmentLabel ||
    "SitGuru Contact";
  const recipientRole = normalizeRole(user?.role);
  const source = asActionString(input.source) || asActionString(user?.source) || "admin_users_directory";

  const threadType = asActionString(input.threadType) ||
    (department ? "internal_department" : recipientId ? "direct_admin" : "internal");

  const topic = department
    ? "internal_department"
    : recipientId
      ? "direct_message"
      : "internal";

  let existing: ConversationRow | null = null;

  if (recipientId) {
    existing = await findExistingUserThread({
      adminUserId,
      targetUserId: recipientId,
    });
  } else if (departmentLabel) {
    existing = await findExistingDepartmentThread({
      adminUserId,
      departmentLabel,
    });
  }

  const now = new Date().toISOString();
  const opener =
    asActionString(input.opener) ||
    (departmentLabel
      ? `Thread opened for ${departmentLabel} from the Admin User Directory.`
      : "Internal staff thread opened from the Admin User Directory.");

  if (existing?.id) {
    const conversationId = existing.id;
    const participantRows: Array<Record<string, unknown>> = [
      {
        conversation_id: conversationId,
        user_id: adminUserId,
        role: "admin",
        created_at: now,
        updated_at: now,
      },
    ];

    if (recipientId && recipientId !== adminUserId) {
      participantRows.push({
        conversation_id: conversationId,
        user_id: recipientId,
        role: recipientRole,
        created_at: now,
        updated_at: now,
      });
    }

    if (department) {
      const members = await loadDepartmentMemberIds(department, adminUserId);
      for (const member of members) {
        participantRows.push({
          conversation_id: conversationId,
          user_id: member.userId,
          role: member.role,
          created_at: now,
          updated_at: now,
        });
      }
    }

    const unique = Array.from(
      new Map(
        participantRows.map((row) => [asActionString(row.user_id), row]),
      ).values(),
    );

    if (unique.length) {
      await supabaseAdmin.from("conversation_participants").upsert(unique, {
        onConflict: "conversation_id,user_id",
        ignoreDuplicates: false,
      });
    }

    const nextSubject = buildSubject({
      departmentLabel,
      recipientName: recipientId ? recipientName : null,
    });

    await supabaseAdmin
      .from("conversations")
      .update({
        subject: nextSubject,
        topic,
        updated_at: now,
        status: "open",
      })
      .eq("id", conversationId);

    return {
      ok: true,
      conversationId,
      created: false,
      href: `/admin/messages/${encodeURIComponent(conversationId)}`,
      department,
      departmentLabel,
    };
  }

  const subject = buildSubject({
    departmentLabel,
    recipientName: recipientId || recipientEmail ? recipientName : null,
  });

  const conversationPayload: Record<string, unknown> = {
    subject,
    status: "open",
    topic,
    started_by_user_id: adminUserId,
    last_message_at: now,
    last_message_preview: opener.slice(0, 240),
    created_at: now,
    updated_at: now,
  };

  if (recipientRole === "guru" && recipientId) {
    conversationPayload.guru_id = recipientId;
  }
  if (recipientRole === "customer" && recipientId) {
    conversationPayload.customer_id = recipientId;
  }

  const { data: conversation, error: conversationError } = await supabaseAdmin
    .from("conversations")
    .insert(conversationPayload)
    .select("id")
    .single();

  if (conversationError || !conversation?.id) {
    throw new Error(
      conversationError?.message || "Unable to create admin conversation.",
    );
  }

  const conversationId = String(conversation.id);
  const participantRows: Array<Record<string, unknown>> = [
    {
      conversation_id: conversationId,
      user_id: adminUserId,
      role: "admin",
      created_at: now,
      updated_at: now,
    },
  ];

  if (recipientId && recipientId !== adminUserId) {
    participantRows.push({
      conversation_id: conversationId,
      user_id: recipientId,
      role: recipientRole,
      created_at: now,
      updated_at: now,
    });
  }

  if (department) {
    const members = await loadDepartmentMemberIds(department, adminUserId);
    for (const member of members) {
      participantRows.push({
        conversation_id: conversationId,
        user_id: member.userId,
        role: member.role,
        created_at: now,
        updated_at: now,
      });
    }
  }

  const unique = Array.from(
    new Map(
      participantRows.map((row) => [asActionString(row.user_id), row]),
    ).values(),
  );

  if (unique.length) {
    const { error: participantError } = await supabaseAdmin
      .from("conversation_participants")
      .upsert(unique, {
        onConflict: "conversation_id,user_id",
        ignoreDuplicates: false,
      });

    if (participantError) {
      console.warn(
        "Admin conversation participants upsert warning:",
        participantError.message,
      );
    }
  }

  const { error: messageError } = await supabaseAdmin.from("messages").insert({
    conversation_id: conversationId,
    sender_id: adminUserId,
    recipient_id: recipientId || null,
    sender_role: "admin",
    recipient_role: recipientId ? recipientRole : null,
    sender_name_snapshot: asActionString(input.adminEmail) || "SitGuru Admin",
    sender_email_snapshot: asActionString(input.adminEmail) || null,
    sender_role_snapshot: "admin",
    recipient_name_snapshot: recipientName,
    recipient_email_snapshot: recipientEmail || null,
    recipient_role_snapshot: recipientId ? recipientRole : null,
    content: opener,
    body: opener,
    message_type: threadType,
    topic,
    status: "unread",
    is_read: false,
    created_at: now,
  });

  if (messageError) {
    console.warn("Admin conversation opener insert warning:", messageError.message);
  }

  return {
    ok: true,
    conversationId,
    created: true,
    href: `/admin/messages/${encodeURIComponent(conversationId)}`,
    department,
    departmentLabel,
  };
}
