import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlaidEnvironment, plaidClient } from "@/lib/plaid";

type PlaidLinkMetadata = {
  institution?: {
    institution_id?: string | null;
    name?: string | null;
  } | null;
  accounts?: Array<{
    id?: string | null;
    account_id?: string | null;
    name?: string | null;
    mask?: string | null;
    type?: string | null;
    subtype?: string | null;
  }> | null;
  link_session_id?: string | null;
};

function getErrorMessage(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response
  ) {
    return JSON.stringify(error.response.data);
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unable to exchange Plaid public token.";
}

async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Unauthorized. Please sign in as admin again." },
        { status: 401 },
      ),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role, email")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Plaid exchange profile lookup error:", profileError);

    return {
      user: null,
      response: NextResponse.json(
        { error: "Unable to verify admin profile." },
        { status: 500 },
      ),
    };
  }

  if (profile?.role !== "admin") {
    return {
      user: null,
      response: NextResponse.json(
        { error: "Admin access required." },
        { status: 403 },
      ),
    };
  }

  return {
    user,
    response: null,
  };
}

function getBusinessAccountFlag(account: {
  name?: string | null;
  official_name?: string | null;
  subtype?: string | null;
}) {
  const combinedName = `${account.name || ""} ${
    account.official_name || ""
  }`.toLowerCase();

  const subtype = String(account.subtype || "").toLowerCase();

  const isCheckingOrSavings = subtype === "checking" || subtype === "savings";
  const looksBusiness = combinedName.includes("business");

  return isCheckingOrSavings && looksBusiness;
}

async function savePlaidItem({
  userId,
  itemId,
  accessToken,
  institutionId,
  institutionName,
  plaidEnvironment,
  raw,
}: {
  userId: string;
  itemId: string;
  accessToken: string;
  institutionId: string | null;
  institutionName: string | null;
  plaidEnvironment: string;
  raw: unknown;
}) {
  const now = new Date().toISOString();

  const fullPayload = {
    user_id: userId,
    item_id: itemId,
    access_token: accessToken,
    institution_id: institutionId,
    institution_name: institutionName,
    plaid_environment: plaidEnvironment,
    transactions_cursor: null,
    transactions_last_synced_at: null,
    raw,
    updated_at: now,
  };

  const { error: fullError } = await supabaseAdmin
    .from("admin_plaid_items")
    .upsert(fullPayload, {
      onConflict: "item_id",
    });

  if (!fullError) {
    return;
  }

  console.warn(
    "Plaid item full upsert failed. Trying minimal payload:",
    fullError.message,
  );

  const minimalPayload = {
    user_id: userId,
    item_id: itemId,
    access_token: accessToken,
    institution_name: institutionName,
    plaid_environment: plaidEnvironment,
    transactions_cursor: null,
    transactions_last_synced_at: null,
    updated_at: now,
  };

  const { error: minimalError } = await supabaseAdmin
    .from("admin_plaid_items")
    .upsert(minimalPayload, {
      onConflict: "item_id",
    });

  if (minimalError) {
    throw new Error(`Unable to save Plaid item: ${minimalError.message}`);
  }
}

async function savePlaidAccount({
  userId,
  itemId,
  plaidEnvironment,
  account,
}: {
  userId: string;
  itemId: string;
  plaidEnvironment: string;
  account: {
    account_id: string;
    balances?: {
      available?: number | null;
      current?: number | null;
      iso_currency_code?: string | null;
      unofficial_currency_code?: string | null;
    } | null;
    mask?: string | null;
    name?: string | null;
    official_name?: string | null;
    type?: string | null;
    subtype?: string | null;
  };
}) {
  const now = new Date().toISOString();

  const isBusinessAccount = getBusinessAccountFlag({
    name: account.name,
    official_name: account.official_name,
    subtype: account.subtype,
  });

  const fullPayload = {
    user_id: userId,
    item_id: itemId,
    account_id: account.account_id,
    name: account.name || null,
    official_name: account.official_name || null,
    mask: account.mask || null,
    type: account.type || null,
    subtype: account.subtype || null,
    available_balance: account.balances?.available ?? null,
    current_balance: account.balances?.current ?? null,
    iso_currency_code: account.balances?.iso_currency_code || null,
    unofficial_currency_code: account.balances?.unofficial_currency_code || null,
    plaid_environment: plaidEnvironment,
    is_business_account: isBusinessAccount,
    raw: account,
    updated_at: now,
  };

  const { error: fullError } = await supabaseAdmin
    .from("admin_plaid_accounts")
    .upsert(fullPayload, {
      onConflict: "account_id",
    });

  if (!fullError) {
    return;
  }

  console.warn(
    "Plaid account full upsert failed. Trying minimal payload:",
    fullError.message,
  );

  const minimalPayload = {
    user_id: userId,
    item_id: itemId,
    account_id: account.account_id,
    name: account.name || null,
    official_name: account.official_name || null,
    mask: account.mask || null,
    type: account.type || null,
    subtype: account.subtype || null,
    plaid_environment: plaidEnvironment,
    updated_at: now,
  };

  const { error: minimalError } = await supabaseAdmin
    .from("admin_plaid_accounts")
    .upsert(minimalPayload, {
      onConflict: "account_id",
    });

  if (minimalError) {
    throw new Error(`Unable to save Plaid account: ${minimalError.message}`);
  }
}

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdminUser();

  if (adminCheck.response || !adminCheck.user) {
    return adminCheck.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    public_token?: string;
    metadata?: PlaidLinkMetadata;
  };

  const publicToken = String(body.public_token || "").trim();

  if (!publicToken) {
    return NextResponse.json(
      { error: "Missing Plaid public_token." },
      { status: 400 },
    );
  }

  const currentPlaidEnvironment = getPlaidEnvironment();

  try {
    const exchangeResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken,
    });

    const accessToken = exchangeResponse.data.access_token;
    const itemId = exchangeResponse.data.item_id;

    if (!accessToken || !itemId) {
      return NextResponse.json(
        { error: "Plaid did not return an access token or item id." },
        { status: 500 },
      );
    }

    const [itemResponse, accountsResponse] = await Promise.all([
      plaidClient.itemGet({
        access_token: accessToken,
      }),
      plaidClient.accountsGet({
        access_token: accessToken,
      }),
    ]);

    const institutionId =
      itemResponse.data.item.institution_id ||
      body.metadata?.institution?.institution_id ||
      null;

    const institutionName =
      body.metadata?.institution?.name ||
      itemResponse.data.item.institution_name ||
      null;

    await savePlaidItem({
      userId: adminCheck.user.id,
      itemId,
      accessToken,
      institutionId,
      institutionName,
      plaidEnvironment: currentPlaidEnvironment,
      raw: {
        item: itemResponse.data.item,
        metadata: body.metadata || null,
      },
    });

    const accounts = accountsResponse.data.accounts || [];

    for (const account of accounts) {
      await savePlaidAccount({
        userId: adminCheck.user.id,
        itemId,
        plaidEnvironment: currentPlaidEnvironment,
        account: {
          account_id: account.account_id,
          balances: account.balances,
          mask: account.mask,
          name: account.name,
          official_name: account.official_name,
          type: account.type,
          subtype: account.subtype,
        },
      });
    }

    const businessAccounts = accounts.filter((account) =>
      getBusinessAccountFlag({
        name: account.name,
        official_name: account.official_name,
        subtype: account.subtype,
      }),
    );

    return NextResponse.json({
      ok: true,
      message: "Plaid connection saved successfully.",
      plaid_environment: currentPlaidEnvironment,
      item_id: itemId,
      institution_name: institutionName,
      accounts_saved: accounts.length,
      business_accounts_detected: businessAccounts.length,
      next_step: "Run Sync Transactions from the SitGuru Plaid dashboard.",
    });
  } catch (error) {
    console.error("Plaid public token exchange error:", error);

    return NextResponse.json(
      {
        error: getErrorMessage(error),
        plaid_environment: currentPlaidEnvironment,
      },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "This endpoint is active, but it only accepts POST requests from Plaid Link.",
      endpoint: "/api/plaid/exchange-token",
    },
    { status: 405 },
  );
}