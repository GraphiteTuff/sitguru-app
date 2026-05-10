import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";

type AuthUserSummary = {
  email: string;
  created_at: string | null;
  last_sign_in_at: string | null;
  email_confirmed_at: string | null;
};

type AnyRow = Record<string, any>;

const emptyUuid = "00000000-0000-0000-0000-000000000000";

function normalizeText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRole(value: unknown) {
  const role = normalizeText(value).toLowerCase();

  if (role.includes("customer")) return "customer";
  if (role.includes("pet_parent")) return "customer";
  if (role.includes("parent")) return "customer";
  if (role.includes("client")) return "customer";
  if (role.includes("guru")) return "guru";
  if (role.includes("sitter")) return "guru";
  if (role.includes("provider")) return "guru";
  if (role.includes("admin")) return "admin";

  return role || "customer";
}

function getAccountStatus(profile: AnyRow) {
  const accountStatus = normalizeText(profile.account_status).toLowerCase();
  const approvalStatus = normalizeText(profile.approval_status).toLowerCase();

  if (profile.deleted_at) return "deleted";
  if (profile.deactivated_at) return "deactivated";
  if (profile.suspended_at) return "suspended";

  if (
    accountStatus === "active" ||
    accountStatus === "approved" ||
    accountStatus === "pending" ||
    accountStatus === "suspended" ||
    accountStatus === "deactivated" ||
    accountStatus === "deleted"
  ) {
    return accountStatus;
  }

  if (
    approvalStatus === "active" ||
    approvalStatus === "approved" ||
    approvalStatus === "pending" ||
    approvalStatus === "suspended" ||
    approvalStatus === "deactivated" ||
    approvalStatus === "deleted"
  ) {
    return approvalStatus;
  }

  return "active";
}

function getDisplayName(profile: AnyRow, email: string) {
  const fullName = normalizeText(profile.full_name);
  const firstName = normalizeText(profile.first_name);
  const lastName = normalizeText(profile.last_name);
  const name = normalizeText(profile.name);

  if (fullName) return fullName;
  if (name) return name;
  if (firstName || lastName) return `${firstName} ${lastName}`.trim();

  return email ? email.split("@")[0] : "SitGuru User";
}

function calculateCustomerSetupPercent(profile: AnyRow, petCount: number) {
  const basicInfoComplete = Boolean(
    (profile.full_name || profile.first_name) && profile.phone,
  );

  const serviceLocationComplete = Boolean(
    profile.service_address &&
      profile.service_city &&
      profile.service_state &&
      profile.service_zip,
  );

  const petPassportsComplete = petCount > 0;
  const careNotesComplete = Boolean(profile.care_preferences);
  const emergencyContactComplete = Boolean(
    profile.emergency_contact ||
      (profile.emergency_contact_name && profile.emergency_contact_phone),
  );
  const notificationsComplete = Boolean(
    profile.email_notifications ||
      profile.push_notifications ||
      profile.text_notifications,
  );

  const completed = [
    basicInfoComplete,
    serviceLocationComplete,
    petPassportsComplete,
    careNotesComplete,
    emergencyContactComplete,
    notificationsComplete,
  ].filter(Boolean).length;

  return {
    completed,
    total: 6,
    percent: Math.round((completed / 6) * 100),
    basicInfoComplete,
    serviceLocationComplete,
    petPassportsComplete,
    careNotesComplete,
    emergencyContactComplete,
    notificationsComplete,
  };
}

function includesSearch(account: AnyRow, loweredQuery: string) {
  return (
    normalizeText(account.email).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.id).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.full_name).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.first_name).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.display_name).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.phone).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.service_city).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.service_state).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.service_zip).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.deletion_reason).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.suspension_reason).toLowerCase().includes(loweredQuery) ||
    normalizeText(account.guru_cancellation_reason)
      .toLowerCase()
      .includes(loweredQuery)
  );
}

function countByUserId(rows: AnyRow[], keys: string[]) {
  const counts = new Map<string, number>();

  rows.forEach((row) => {
    for (const key of keys) {
      const id = normalizeText(row[key]);

      if (id) {
        counts.set(id, (counts.get(id) || 0) + 1);
        break;
      }
    }
  });

  return counts;
}

async function getAllAuthUsers(supabaseAdmin: any) {
  const users: any[] = [];
  let page = 1;
  const perPage = 1000;

  while (page <= 10) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage,
    });

    if (error) break;

    users.push(...(data?.users || []));

    if (!data?.users || data.users.length < perPage) break;

    page += 1;
  }

  return users;
}

export async function GET(request: NextRequest) {
  try {
    const { supabaseAdmin } = await requireAdminUser(request);

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const role = searchParams.get("role") || "all";
    const query = searchParams.get("query")?.trim() || "";

    let profilesQuery = supabaseAdmin
      .from("profiles")
      .select(
        `
        id,
        email,
        role,
        account_status,
        approval_status,
        full_name,
        first_name,
        last_name,
        phone,
        avatar_url,
        profile_photo_url,
        service_address,
        service_city,
        service_state,
        service_zip,
        care_preferences,
        emergency_contact,
        emergency_contact_name,
        emergency_contact_phone,
        email_notifications,
        push_notifications,
        text_notifications,
        recovery_email,
        recovery_email_verified,
        deactivated_at,
        suspended_at,
        suspension_reason,
        deletion_requested_at,
        deletion_reason,
        deletion_feedback,
        deletion_confirmed_at,
        deleted_at,
        guru_status,
        guru_cancelled_at,
        guru_cancellation_reason,
        created_at,
        updated_at
      `,
      )
      .order("created_at", { ascending: false })
      .limit(1000);

    if (role !== "all") {
      const normalizedRole = normalizeRole(role);

      if (normalizedRole === "customer") {
        profilesQuery = profilesQuery.in("role", [
          "customer",
          "pet_parent",
          "parent",
          "client",
        ]);
      } else if (normalizedRole === "guru") {
        profilesQuery = profilesQuery.in("role", ["guru", "sitter", "provider"]);
      } else if (normalizedRole === "admin") {
        profilesQuery = profilesQuery.in("role", ["admin", "super_admin"]);
      } else {
        profilesQuery = profilesQuery.eq("role", role);
      }
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 400 },
      );
    }

    const profileRows = profiles || [];
    const profileIds = profileRows.map((profile: AnyRow) => profile.id);
    const safeProfileIds = profileIds.length ? profileIds : [emptyUuid];

    const authUsers = await getAllAuthUsers(supabaseAdmin);

    const authUserById = new Map<string, AuthUserSummary>(
      authUsers.map((user) => [
        user.id,
        {
          email: user.email || "",
          created_at: user.created_at || null,
          last_sign_in_at: user.last_sign_in_at || null,
          email_confirmed_at: user.email_confirmed_at || null,
        },
      ]),
    );

    const [
      lifecycleEventsResult,
      deletedAuthEventsResult,
      petsResult,
      bookingsResult,
      messagesResult,
    ] = await Promise.all([
      supabaseAdmin
        .from("account_lifecycle_events")
        .select(
          `
          id,
          user_id,
          email,
          event_type,
          reason,
          feedback,
          performed_by_email,
          created_at
        `,
        )
        .in("user_id", safeProfileIds)
        .order("created_at", { ascending: false }),
      supabaseAdmin
        .from("account_lifecycle_events")
        .select(
          `
          id,
          user_id,
          email,
          role,
          previous_account_status,
          new_account_status,
          previous_guru_status,
          new_guru_status,
          event_type,
          reason,
          feedback,
          performed_by_email,
          created_at
        `,
        )
        .eq("event_type", "account_deleted")
        .order("created_at", { ascending: false })
        .limit(100),
      supabaseAdmin.from("pets").select("id, owner_id").limit(5000),
      supabaseAdmin
        .from("bookings")
        .select("id, customer_id, pet_owner_id, user_id, guru_id, status")
        .limit(5000),
      supabaseAdmin
        .from("messages")
        .select(
          "id, sender_id, recipient_id, customer_id, user_id, read_at, is_read",
        )
        .limit(5000),
    ]);

    const lifecycleEvents = lifecycleEventsResult.data || [];
    const deletedAuthEvents = deletedAuthEventsResult.data || [];
    const pets = petsResult.data || [];
    const bookings = bookingsResult.data || [];
    const messages = messagesResult.data || [];

    const latestEventByUserId = new Map<string, AnyRow>();

    lifecycleEvents.forEach((event: AnyRow) => {
      if (!latestEventByUserId.has(event.user_id)) {
        latestEventByUserId.set(event.user_id, event);
      }
    });

    const petCountByUserId = countByUserId(pets, ["owner_id"]);

    const bookingCountByUserId = countByUserId(bookings, [
      "customer_id",
      "pet_owner_id",
      "user_id",
    ]);

    const messageCountByUserId = new Map<string, number>();

    messages.forEach((message: AnyRow) => {
      const ids = [
        normalizeText(message.sender_id),
        normalizeText(message.recipient_id),
        normalizeText(message.customer_id),
        normalizeText(message.user_id),
      ].filter(Boolean);

      const uniqueIds = Array.from(new Set(ids));

      uniqueIds.forEach((id) => {
        messageCountByUserId.set(id, (messageCountByUserId.get(id) || 0) + 1);
      });
    });

    let accounts = profileRows.map((profile: AnyRow) => {
      const authUser = authUserById.get(profile.id);
      const latestEvent = latestEventByUserId.get(profile.id);
      const email =
        authUser?.email ||
        normalizeText(profile.email) ||
        normalizeText(latestEvent?.email);

      const normalizedRole = normalizeRole(profile.role);
      const accountStatus = getAccountStatus(profile);
      const petCount = petCountByUserId.get(profile.id) || 0;
      const bookingCount = bookingCountByUserId.get(profile.id) || 0;
      const messageCount = messageCountByUserId.get(profile.id) || 0;
      const setup = calculateCustomerSetupPercent(profile, petCount);

      return {
        ...profile,
        role: normalizedRole,
        account_status: accountStatus,
        approval_status: normalizeText(profile.approval_status) || accountStatus,
        email,
        display_name: getDisplayName(profile, email),
        auth_created_at: authUser?.created_at || null,
        last_sign_in_at: authUser?.last_sign_in_at || null,
        email_confirmed_at: authUser?.email_confirmed_at || null,
        latest_event: latestEvent || null,
        auth_user_exists: Boolean(authUser),
        pet_count: petCount,
        booking_count: bookingCount,
        message_count: messageCount,
        setup_completed_steps: setup.completed,
        setup_total_steps: setup.total,
        setup_completion_percent: setup.percent,
        setup_status: setup.percent >= 100 ? "complete" : "incomplete",
        setup,
      };
    });

    if (status !== "all") {
      accounts = accounts.filter((account: AnyRow) => {
        return normalizeText(account.account_status).toLowerCase() === status;
      });
    }

    if (query) {
      const loweredQuery = query.toLowerCase();

      accounts = accounts.filter((account: AnyRow) =>
        includesSearch(account, loweredQuery),
      );
    }

    return NextResponse.json({
      accounts,
      deletedEvents: deletedAuthEvents || [],
      meta: {
        total: accounts.length,
        role,
        status,
        query,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to load admin accounts.",
      },
      { status: 401 },
    );
  }
}