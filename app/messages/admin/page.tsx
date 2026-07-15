// app/messages/admin/page.tsx
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  subject?: string | null;
  topic?: string | null;
  status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  last_message_at?: string | null;
  last_message_preview?: string | null;
};

type ProfileRow = {
  id: string;
  role?: string | null;
  account_type?: string | null;
  created_at?: string | null;
  first_name?: string | null;
  full_name?: string | null;
  email?: string | null;
};

type GuruRow = {
  id?: string | number | null;
  user_id?: string | null;
  email?: string | null;
};

type MessageRoleContext = "customer" | "guru" | "ambassador" | "admin";

type UserRoleRow = {
  role?: string | null;
};

type AmbassadorRow = {
  id?: string | null;
  user_id?: string | null;
  email?: string | null;
  login_email?: string | null;
  contact_email?: string | null;
  dashboard_enabled?: boolean | null;
  login_enabled?: boolean | null;
  status?: string | null;
};

type SearchParamValue = string | string[] | undefined;

type AdminMessageSearchParams = Record<string, SearchParamValue>;

function normalizeRoleValue(role?: string | null) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "";
  if (value === "provider" || value === "sitter") return "guru";
  if (value === "pet_parent" || value === "pet-parent") return "customer";
  if (value === "owner" || value === "pet_owner" || value === "pet-owner") {
    return "customer";
  }
  if (value.includes("ambassador")) return "ambassador";

  return value;
}

function cleanText(value?: string | null) {
  return String(value || "").trim();
}

function getDashboardHref(role?: string | null) {
  const normalized = normalizeRoleValue(role);

  if (normalized === "guru") return "/guru/dashboard";
  if (normalized === "admin") return "/admin";
  if (normalized === "ambassador") return "/ambassador/dashboard";

  return "/customer/dashboard";
}

function normalizeMessageRoleContext(value?: string | null): MessageRoleContext | "" {
  const normalized = normalizeRoleValue(value);

  if (normalized === "customer") return "customer";
  if (normalized === "guru") return "guru";
  if (normalized === "ambassador") return "ambassador";
  if (normalized === "admin") return "admin";

  return "";
}

function hasRoleValue(values: string[], wantedRole: MessageRoleContext) {
  if (wantedRole === "customer") {
    return values.some((value) => {
      const role = normalizeRoleValue(value);
      return (
        role === "customer" ||
        role === "pet_parent" ||
        role === "pet-parent" ||
        role === "pet_owner" ||
        role === "pet-owner" ||
        role === "owner" ||
        role === "both"
      );
    });
  }

  if (wantedRole === "guru") {
    return values.some((value) => {
      const role = normalizeRoleValue(value);
      return (
        role === "guru" ||
        role === "provider" ||
        role === "sitter" ||
        role === "walker" ||
        role === "future_guru" ||
        role === "future-guru" ||
        role === "both"
      );
    });
  }

  if (wantedRole === "ambassador") {
    return values.some((value) => normalizeRoleValue(value).includes("ambassador"));
  }

  if (wantedRole === "admin") {
    return values.some((value) => normalizeRoleValue(value).includes("admin"));
  }

  return false;
}

function getFirstParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] || "" : value || "";
}

function isSafeInternalPath(value: string) {
  return (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !value.includes("://") &&
    !value.includes("\\")
  );
}

function getDefaultReturnPath(roleContext: MessageRoleContext) {
  if (roleContext === "guru") return "/guru/dashboard";
  if (roleContext === "ambassador") return "/ambassador/dashboard";
  if (roleContext === "admin") return "/admin";

  return "/customer/dashboard";
}

function getSafeReturnPath(
  value: SearchParamValue,
  roleContext: MessageRoleContext,
) {
  const requestedPath = cleanText(getFirstParam(value));
  const fallback = getDefaultReturnPath(roleContext);

  if (!requestedPath || !isSafeInternalPath(requestedPath)) {
    return fallback;
  }

  if (
    roleContext === "ambassador" &&
    !requestedPath.startsWith("/ambassador/")
  ) {
    return fallback;
  }

  if (roleContext === "guru" && !requestedPath.startsWith("/guru/")) {
    return fallback;
  }

  if (
    roleContext === "customer" &&
    !requestedPath.startsWith("/customer/")
  ) {
    return fallback;
  }

  if (roleContext === "admin" && !requestedPath.startsWith("/admin")) {
    return fallback;
  }

  return requestedPath;
}

function buildThreadRedirect({
  conversationId,
  roleContext,
  source,
  returnTo,
}: {
  conversationId: string;
  roleContext: MessageRoleContext;
  source?: string;
  returnTo?: string;
}) {
  const query = new URLSearchParams();
  query.set("role", roleContext);
  query.set(
    "source",
    cleanText(source) ||
      (roleContext === "ambassador"
        ? "ambassador_dashboard"
        : "admin_support"),
  );
  query.set(
    "returnTo",
    returnTo || getDefaultReturnPath(roleContext),
  );

  return `/messages/${conversationId}?${query.toString()}`;
}

function isDuplicateDirectThreadError(error?: { code?: string; message?: string } | null) {
  const code = String(error?.code || "").trim();
  const message = String(error?.message || "").toLowerCase();

  return (
    code === "23505" ||
    message.includes("duplicate key") ||
    message.includes("conversations_unique_direct_thread_idx")
  );
}

async function findExistingAdminSupportConversation({
  participantUserId,
  adminUserId,
  isGuruUser,
}: {
  participantUserId: string;
  adminUserId: string;
  isGuruUser: boolean;
}) {
  const [customerAdminResult, guruAdminResult, legacyReverseResult] =
    await Promise.all([
      supabaseAdmin
        .from("conversations")
        .select("*")
        .eq("customer_id", participantUserId)
        .eq("guru_id", adminUserId)
        .order("updated_at", { ascending: false })
        .limit(1),

      isGuruUser
        ? supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("guru_id", participantUserId)
            .eq("customer_id", adminUserId)
            .order("updated_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),

      /**
       * Legacy cleanup lookup:
       * If an old customer account was accidentally saved as guru_id and admin as customer_id,
       * find it so we can correct and reuse it.
       */
      !isGuruUser
        ? supabaseAdmin
            .from("conversations")
            .select("*")
            .eq("guru_id", participantUserId)
            .eq("customer_id", adminUserId)
            .order("updated_at", { ascending: false })
            .limit(1)
        : Promise.resolve({ data: [], error: null }),
    ]);

  return (
    ((customerAdminResult.data ?? [])[0] as ConversationRow | undefined) ||
    ((guruAdminResult.data ?? [])[0] as ConversationRow | undefined) ||
    ((legacyReverseResult.data ?? [])[0] as ConversationRow | undefined) ||
    null
  );
}

async function findExistingAmbassadorAdminConversation({
  participantUserId,
  adminUserId,
}: {
  participantUserId: string;
  adminUserId: string;
}) {
  const { data: participantRows, error: participantError } =
    await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .eq("user_id", participantUserId)
      .limit(200);

  if (participantError) {
    console.error(
      "Ambassador support participant lookup failed:",
      participantError.message,
    );
    return null;
  }

  const possibleConversationIds = Array.from(
    new Set(
      (
        (participantRows || []) as Array<{
          conversation_id?: string | null;
          user_id?: string | null;
        }>
      )
        .map((row) => cleanText(row.conversation_id))
        .filter(Boolean),
    ),
  );

  if (possibleConversationIds.length === 0) return null;

  const { data: sharedParticipantRows, error: sharedParticipantError } =
    await supabaseAdmin
      .from("conversation_participants")
      .select("conversation_id,user_id")
      .in("conversation_id", possibleConversationIds)
      .limit(500);

  if (sharedParticipantError) {
    console.error(
      "Ambassador support shared participant lookup failed:",
      sharedParticipantError.message,
    );
    return null;
  }

  const participantSets = new Map<string, Set<string>>();

  for (const row of (sharedParticipantRows || []) as Array<{
    conversation_id?: string | null;
    user_id?: string | null;
  }>) {
    const conversationId = cleanText(row.conversation_id);
    const userId = cleanText(row.user_id);

    if (!conversationId || !userId) continue;

    const users = participantSets.get(conversationId) || new Set<string>();
    users.add(userId);
    participantSets.set(conversationId, users);
  }

  const exactDirectConversationIds = possibleConversationIds.filter(
    (conversationId) => {
      const users = participantSets.get(conversationId);

      return (
        users?.size === 2 &&
        users.has(participantUserId) &&
        users.has(adminUserId)
      );
    },
  );

  if (exactDirectConversationIds.length === 0) return null;

  const { data: conversations, error: conversationsError } =
    await supabaseAdmin
      .from("conversations")
      .select("*")
      .in("id", exactDirectConversationIds)
      .in("topic", ["ambassador_support", "admin_support"])
      .order("updated_at", { ascending: false })
      .limit(1);

  if (conversationsError) {
    console.error(
      "Ambassador support conversation lookup failed:",
      conversationsError.message,
    );
    return null;
  }

  return ((conversations || []) as ConversationRow[])[0] || null;
}

async function findRequestedAdminSupportConversation({
  conversationId,
  participantUserId,
  adminUserId,
}: {
  conversationId: string;
  participantUserId: string;
  adminUserId: string;
}) {
  if (!conversationId) return null;

  const { data: participantRows, error: participantError } =
    await supabaseAdmin
      .from("conversation_participants")
      .select("user_id")
      .eq("conversation_id", conversationId)
      .in("user_id", [participantUserId, adminUserId]);

  if (participantError) {
    console.error(
      "Requested support conversation participant check failed:",
      participantError.message,
    );
    return null;
  }

  const userIds = new Set(
    ((participantRows || []) as Array<{ user_id?: string | null }>)
      .map((row) => cleanText(row.user_id))
      .filter(Boolean),
  );

  if (
    !userIds.has(participantUserId) ||
    !userIds.has(adminUserId)
  ) {
    return null;
  }

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();

  if (error) {
    console.error(
      "Requested support conversation lookup failed:",
      error.message,
    );
    return null;
  }

  return (data || null) as ConversationRow | null;
}

async function getAmbassadorAccessForUser(
  userId: string,
  email?: string | null,
) {
  const { data: byUserId, error: userIdError } = await supabaseAdmin
    .from("ambassadors")
    .select(
      "id,user_id,email,login_email,contact_email,dashboard_enabled,login_enabled,status",
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (userIdError) {
    console.error(
      "Ambassador message access lookup by user ID failed:",
      userIdError.message,
    );
  }

  let ambassador = byUserId as AmbassadorRow | null;
  const cleanEmail = cleanText(email).toLowerCase();

  if (!ambassador && cleanEmail) {
    const emailColumns = ["login_email", "contact_email", "email"] as const;

    for (const column of emailColumns) {
      const { data, error } = await supabaseAdmin
        .from("ambassadors")
        .select(
          "id,user_id,email,login_email,contact_email,dashboard_enabled,login_enabled,status",
        )
        .eq(column, cleanEmail)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(
          `Ambassador message access lookup by ${column} failed:`,
          error.message,
        );
        continue;
      }

      if (data) {
        ambassador = data as AmbassadorRow;
        break;
      }
    }
  }

  if (!ambassador) return null;

  const status = cleanText(ambassador.status).toLowerCase();
  const isAllowed =
    ambassador.dashboard_enabled === true &&
    ambassador.login_enabled === true &&
    status !== "archived" &&
    status !== "inactive" &&
    status !== "not_a_fit";

  return isAllowed ? ambassador : null;
}

async function getGuruRecordForConfirmedGuru(
  userId: string,
  email?: string | null,
) {
  const byUserId = await supabaseAdmin
    .from("gurus")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!byUserId.error && byUserId.data) {
    return byUserId.data as GuruRow;
  }

  if (email) {
    const byEmail = await supabaseAdmin
      .from("gurus")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (!byEmail.error && byEmail.data) {
      return byEmail.data as GuruRow;
    }
  }

  return null;
}

async function getPrimaryAdminProfile() {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("id, role, account_type, created_at, first_name, full_name, email")
    .eq("role", "admin")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as ProfileRow;
}

async function addParticipantIfMissing(
  conversationId: string,
  userId: string,
  role: string,
) {
  const safeConversationId = cleanText(conversationId);
  const safeUserId = cleanText(userId);
  const safeRole = cleanText(role).toLowerCase();

  if (!safeConversationId || !safeUserId) return;

  const { error } = await supabaseAdmin
    .from("conversation_participants")
    .upsert(
      {
        conversation_id: safeConversationId,
        user_id: safeUserId,
        role: safeRole || null,
        is_muted: false,
        is_archived: false,
      },
      {
        onConflict: "conversation_id,user_id",
        ignoreDuplicates: false,
      },
    );

  if (error) {
    console.error(
      "Unable to synchronize conversation participant:",
      error.message,
    );
  }
}

async function updateParticipantRole({
  conversationId,
  userId,
  role,
}: {
  conversationId: string;
  userId: string;
  role: string;
}) {
  await supabaseAdmin
    .from("conversation_participants")
    .update({
      role,
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId)
    .eq("user_id", userId);
}

async function createNotificationIfPossible({
  userId,
  title,
  body,
  href,
}: {
  userId: string;
  title: string;
  body: string;
  href: string;
}) {
  try {
    await supabaseAdmin.from("notifications").insert({
      user_id: userId,
      title,
      body,
      type: "message",
      href,
      is_read: false,
    });
  } catch {
    // Notifications should never block opening the admin support thread.
  }
}

export default async function AdminMessageEntryPage({
  searchParams,
}: {
  searchParams?: Promise<AdminMessageSearchParams>;
}) {
  const params = (await searchParams) || {};

  const petName = cleanText(
    getFirstParam(params.petName) || getFirstParam(params.pet),
  );
  const bookingId = cleanText(
    getFirstParam(params.booking_id) || getFirstParam(params.bookingId),
  );
  const requestedConversationId = cleanText(
    getFirstParam(params.conversation_id) ||
      getFirstParam(params.conversationId) ||
      getFirstParam(params.conversation),
  );
  const requestedRoleContext = normalizeMessageRoleContext(
    getFirstParam(params.role) ||
      getFirstParam(params.as) ||
      getFirstParam(params.contextRole),
  );
  const loginRole =
    requestedRoleContext === "ambassador"
      ? "ambassador"
      : requestedRoleContext === "guru"
        ? "guru"
        : "pet_parent";

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    const loginParams = new URLSearchParams();
    loginParams.set("mode", "phone");
    loginParams.set("role", loginRole);
    loginParams.set(
      "next",
      `/messages/admin?role=${encodeURIComponent(
        requestedRoleContext || "customer",
      )}`,
    );

    redirect(`/login?${loginParams.toString()}`);
  }

  const [
    currentProfileResult,
    userRolesResult,
    guruAccessResult,
    ambassadorAccess,
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("id, role, account_type, created_at, first_name, full_name, email")
      .eq("id", user.id)
      .maybeSingle(),
    supabaseAdmin.from("user_roles").select("role").eq("user_id", user.id),
    supabaseAdmin
      .from("gurus")
      .select("id,user_id,email")
      .eq("user_id", user.id)
      .limit(1),
    getAmbassadorAccessForUser(user.id, user.email),
  ]);

  const currentProfile = (currentProfileResult.data ?? null) as ProfileRow | null;
  const userRoleRows = (userRolesResult.data || []) as UserRoleRow[];
  const roleValues = [
    currentProfile?.role || "",
    currentProfile?.account_type || "",
    ...userRoleRows.map((row) => row.role || ""),
  ].filter(Boolean);

  const hasGuruAccess =
    hasRoleValue(roleValues, "guru") || Boolean((guruAccessResult.data || []).length);
  const hasAmbassadorAccess =
    hasRoleValue(roleValues, "ambassador") || Boolean(ambassadorAccess);
  const hasCustomerAccess =
    hasRoleValue(roleValues, "customer") ||
    (!hasGuruAccess && !hasAmbassadorAccess) ||
    requestedRoleContext === "customer";
  const hasAdminAccess = hasRoleValue(roleValues, "admin");

  const allowedRoleContexts = new Set<MessageRoleContext>();
  if (hasCustomerAccess) allowedRoleContexts.add("customer");
  if (hasGuruAccess) allowedRoleContexts.add("guru");
  if (hasAmbassadorAccess) allowedRoleContexts.add("ambassador");
  if (hasAdminAccess) allowedRoleContexts.add("admin");

  const fallbackRoleContext = normalizeMessageRoleContext(
    currentProfile?.role || currentProfile?.account_type,
  ) || (hasAmbassadorAccess ? "ambassador" : hasGuruAccess ? "guru" : "customer");

  const currentUserRole: MessageRoleContext =
    requestedRoleContext && allowedRoleContexts.has(requestedRoleContext)
      ? requestedRoleContext
      : fallbackRoleContext;

  const adminProfile = await getPrimaryAdminProfile();

  if (!adminProfile?.id) {
    redirect("/messages");
  }

  const adminUserId = String(adminProfile.id).trim();

  /**
   * IMPORTANT:
   * Do not classify a user as a Guru just because an old row exists in public.gurus.
   * The user's current profile role/account_type must explicitly say guru.
   * This prevents customer accounts like Amy Jones from being pulled into Guru flows.
   */
  const isGuruUser = currentUserRole === "guru";
  const isAmbassadorUser = currentUserRole === "ambassador";

  const guruRecord = isGuruUser
    ? await getGuruRecordForConfirmedGuru(user.id, user.email)
    : null;

  const guruParticipantId =
    String(guruRecord?.user_id || user.id).trim() || user.id;

  const participantUserId = isGuruUser ? guruParticipantId : user.id;
  const participantRole = isGuruUser
    ? "guru"
    : isAmbassadorUser
      ? "ambassador"
      : "customer";

  const dashboardHref = getDashboardHref(currentUserRole);
  const returnTo = getSafeReturnPath(params.returnTo, currentUserRole);
  const messageSource =
    cleanText(getFirstParam(params.source)) ||
    (isAmbassadorUser ? "ambassador_dashboard" : "admin_support");

  const requestedConversation =
    await findRequestedAdminSupportConversation({
      conversationId: requestedConversationId,
      participantUserId,
      adminUserId,
    });

  const existingConversation = requestedConversation || (isAmbassadorUser
    ? await findExistingAmbassadorAdminConversation({
        participantUserId,
        adminUserId,
      })
    : await findExistingAdminSupportConversation({
        participantUserId,
        adminUserId,
        isGuruUser,
      }));

  if (existingConversation?.id) {
    /**
     * If the current user is a customer, force the conversation shape to:
     * customer_id = current user
     * guru_id = admin profile
     *
     * This keeps Amy Customer ↔ SitGuru Admin clean even if a previous thread
     * was created while Amy had stale Guru data.
     */
    if (!isGuruUser && !isAmbassadorUser) {
      await supabaseAdmin
        .from("conversations")
        .update({
          customer_id: participantUserId,
          guru_id: adminUserId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConversation.id);
    }

    await addParticipantIfMissing(
      existingConversation.id,
      participantUserId,
      participantRole,
    );
    await addParticipantIfMissing(existingConversation.id, adminUserId, "admin");

    await updateParticipantRole({
      conversationId: existingConversation.id,
      userId: participantUserId,
      role: participantRole,
    });

    await updateParticipantRole({
      conversationId: existingConversation.id,
      userId: adminUserId,
      role: "admin",
    });


    redirect(
      buildThreadRedirect({
        conversationId: existingConversation.id,
        roleContext: participantRole as MessageRoleContext,
        source: messageSource,
        returnTo,
      }),
    );
  }

  const nowIso = new Date().toISOString();

  const subjectParts = ["Direct Admin Support"];
  if (petName) {
    subjectParts.push(`for ${petName}`);
  }
  if (bookingId) {
    subjectParts.push(`Booking #${bookingId}`);
  }

  const subject = subjectParts.join(" · ");
  const preview = petName
    ? `Admin support thread created for ${petName}.`
    : "Admin support thread created.";

  const insertPayload: Record<string, unknown> = {
    booking_id: bookingId || null,
    started_by_user_id: user.id,
    subject,
    status: "open",
    topic: isAmbassadorUser ? "ambassador_support" : "admin_support",
    last_message_at: nowIso,
    last_message_preview: preview,
    created_at: nowIso,
    updated_at: nowIso,
  };

  if (isGuruUser) {
    insertPayload.customer_id = adminUserId;
    insertPayload.guru_id = participantUserId;
  } else if (!isAmbassadorUser) {
    insertPayload.customer_id = participantUserId;
    insertPayload.guru_id = adminUserId;
  }

  const { data: insertedConversation, error: insertConversationError } =
    await supabaseAdmin
      .from("conversations")
      .insert(insertPayload)
      .select("*")
      .single();

  let conversationToUse = (insertedConversation ?? null) as ConversationRow | null;
  const createdNewConversation = Boolean(insertedConversation?.id);

  if (insertConversationError || !conversationToUse?.id) {
    const recoveredConversation = isDuplicateDirectThreadError(
      insertConversationError,
    )
      ? isAmbassadorUser
        ? await findExistingAmbassadorAdminConversation({
            participantUserId,
            adminUserId,
          })
        : await findExistingAdminSupportConversation({
            participantUserId,
            adminUserId,
            isGuruUser,
          })
      : null;

    if (recoveredConversation?.id) {
      conversationToUse = recoveredConversation;
    } else {
      console.error(
        "Admin support conversation create error:",
        insertConversationError?.message || "Unknown error",
      );
      redirect(dashboardHref);
    }
  }

  if (!conversationToUse?.id) {
    redirect(dashboardHref);
  }

  /**
   * A duplicate direct-thread error means the conversation already exists.
   * Reuse it and normalize it instead of failing the page.
   */
  if (!isGuruUser && !isAmbassadorUser) {
    await supabaseAdmin
      .from("conversations")
      .update({
        customer_id: participantUserId,
        guru_id: adminUserId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", conversationToUse.id);
  }

  await addParticipantIfMissing(
    conversationToUse.id,
    participantUserId,
    participantRole,
  );
  await addParticipantIfMissing(conversationToUse.id, adminUserId, "admin");

  await updateParticipantRole({
    conversationId: conversationToUse.id,
    userId: participantUserId,
    role: participantRole,
  });

  await updateParticipantRole({
    conversationId: conversationToUse.id,
    userId: adminUserId,
    role: "admin",
  });


  const threadHref = buildThreadRedirect({
    conversationId: conversationToUse.id,
    roleContext: participantRole as MessageRoleContext,
    source: messageSource,
    returnTo,
  });

  if (createdNewConversation) {
    await createNotificationIfPossible({
      userId: participantUserId,
      title: "SitGuru Admin support is ready",
      body: "Your private SitGuru Admin Support conversation is open.",
      href: threadHref,
    });
  }

  redirect(threadHref);
}