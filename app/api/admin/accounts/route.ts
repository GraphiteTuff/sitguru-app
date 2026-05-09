import { NextRequest, NextResponse } from "next/server";
import { requireAdminUser } from "@/lib/supabase/admin";

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
        role,
        account_status,
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
        created_at
      `,
      )
      .order("created_at", { ascending: false })
      .limit(250);

    if (status !== "all") {
      profilesQuery = profilesQuery.eq("account_status", status);
    }

    if (role !== "all") {
      profilesQuery = profilesQuery.eq("role", role);
    }

    const { data: profiles, error: profilesError } = await profilesQuery;

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 400 },
      );
    }

    const profileIds = profiles?.map((profile) => profile.id) || [];

    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    const authUserById = new Map(
      authUsers.users.map((user) => [
        user.id,
        {
          email: user.email || "",
          created_at: user.created_at,
          last_sign_in_at: user.last_sign_in_at,
          email_confirmed_at: user.email_confirmed_at,
        },
      ]),
    );

    const { data: lifecycleEvents } = await supabaseAdmin
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
      .in("user_id", profileIds.length ? profileIds : ["00000000-0000-0000-0000-000000000000"])
      .order("created_at", { ascending: false });

    const latestEventByUserId = new Map();

    lifecycleEvents?.forEach((event) => {
      if (!latestEventByUserId.has(event.user_id)) {
        latestEventByUserId.set(event.user_id, event);
      }
    });

    let accounts =
      profiles?.map((profile) => {
        const authUser = authUserById.get(profile.id);
        const latestEvent = latestEventByUserId.get(profile.id);

        return {
          ...profile,
          email: authUser?.email || latestEvent?.email || "",
          auth_created_at: authUser?.created_at || null,
          last_sign_in_at: authUser?.last_sign_in_at || null,
          email_confirmed_at: authUser?.email_confirmed_at || null,
          latest_event: latestEvent || null,
          auth_user_exists: Boolean(authUser),
        };
      }) || [];

    if (query) {
      const loweredQuery = query.toLowerCase();

      accounts = accounts.filter((account) => {
        return (
          account.email?.toLowerCase().includes(loweredQuery) ||
          account.id?.toLowerCase().includes(loweredQuery) ||
          account.deletion_reason?.toLowerCase().includes(loweredQuery) ||
          account.suspension_reason?.toLowerCase().includes(loweredQuery) ||
          account.guru_cancellation_reason?.toLowerCase().includes(loweredQuery)
        );
      });
    }

    const { data: deletedAuthEvents } = await supabaseAdmin
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
      .limit(100);

    return NextResponse.json({
      accounts,
      deletedEvents: deletedAuthEvents || [],
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