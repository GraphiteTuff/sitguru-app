import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

function getErrorMessage(error: unknown) {
  if (!error) return "Unable to load Plaid accounts.";

  if (typeof error === "string") return error;

  if (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
  }

  return "Unable to load Plaid accounts.";
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json(
      { error: "Unauthorized. Please sign in as admin again." },
      { status: 401 },
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Plaid accounts profile lookup error:", profileError);

    return NextResponse.json(
      { error: "Unable to verify admin profile." },
      { status: 500 },
    );
  }

  if (profile?.role !== "admin") {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 },
    );
  }

  const { data: accounts, error } = await supabaseAdmin
    .from("admin_plaid_accounts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Plaid accounts load error:", error);

    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }

  return NextResponse.json({
    accounts: accounts || [],
  });
}