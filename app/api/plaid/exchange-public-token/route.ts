import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlaidEnvironment, plaidClient } from "@/lib/plaid";

type ExchangeBody = {
  public_token?: string;
  metadata?: {
    institution?: {
      institution_id?: string | null;
      name?: string | null;
    } | null;
    accounts?: {
      id?: string;
      name?: string;
      mask?: string;
      type?: string;
      subtype?: string;
      verification_status?: string | null;
    }[];
  };
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = (await request.json().catch(() => ({}))) as ExchangeBody;

  if (!body.public_token) {
    return NextResponse.json(
      { error: "Missing public_token." },
      { status: 400 },
    );
  }

  try {
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: body.public_token,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    const institutionId = body.metadata?.institution?.institution_id || null;
    const institutionName = body.metadata?.institution?.name || null;

    await supabaseAdmin.from("admin_plaid_items").upsert(
      {
        user_id: user.id,
        item_id: itemId,
        access_token: accessToken,
        institution_id: institutionId,
        institution_name: institutionName,
        plaid_environment: getPlaidEnvironment(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "item_id",
      },
    );

    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken,
    });

    const accounts = accountsResponse.data.accounts || [];

    for (const account of accounts) {
      await supabaseAdmin.from("admin_plaid_accounts").upsert(
        {
          user_id: user.id,
          item_id: itemId,
          account_id: account.account_id,
          name: account.name,
          official_name: account.official_name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          current_balance: account.balances.current,
          available_balance: account.balances.available,
          iso_currency_code: account.balances.iso_currency_code,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "account_id",
        },
      );
    }

    return NextResponse.json({
      ok: true,
      item_id: itemId,
      accounts_count: accounts.length,
    });
  } catch (error) {
    console.error("Plaid public token exchange error:", error);

    return NextResponse.json(
      { error: "Unable to exchange Plaid public token." },
      { status: 500 },
    );
  }
}