import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getPlaidEnvironment, plaidClient } from "@/lib/plaid";

type PlaidItemRow = {
  id: string;
  user_id: string;
  item_id: string;
  access_token: string;
  institution_name?: string | null;
  plaid_environment?: string | null;
  transactions_cursor?: string | null;
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

  return "Unable to sync Plaid transactions.";
}

function asDateString(value?: string | null) {
  if (!value) return null;
  return value;
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
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError) {
    console.error("Plaid transactions profile lookup error:", profileError);

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

export async function POST(request: NextRequest) {
  const adminCheck = await requireAdminUser();

  if (adminCheck.response || !adminCheck.user) {
    return adminCheck.response;
  }

  const body = (await request.json().catch(() => ({}))) as {
    item_id?: string;
  };

  const currentPlaidEnvironment = getPlaidEnvironment();

  try {
    let itemQuery = supabaseAdmin
      .from("admin_plaid_items")
      .select(
        "id, user_id, item_id, access_token, institution_name, plaid_environment, transactions_cursor",
      )
      .eq("user_id", adminCheck.user.id)
      .eq("plaid_environment", currentPlaidEnvironment)
      .order("created_at", { ascending: false });

    if (body.item_id) {
      itemQuery = itemQuery.eq("item_id", body.item_id);
    }

    const { data: itemRows, error: itemError } = await itemQuery;

    if (itemError) {
      console.error("Plaid item lookup error:", itemError);

      return NextResponse.json(
        { error: "Unable to load Plaid items." },
        { status: 500 },
      );
    }

    const items = (itemRows || []) as PlaidItemRow[];

    if (!items.length) {
      return NextResponse.json(
        {
          error: `No connected Plaid items found for Plaid environment "${currentPlaidEnvironment}". Connect NFCU Business Checking again in the current environment.`,
        },
        { status: 404 },
      );
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    const syncedItems: string[] = [];

    for (const item of items) {
      let cursor = item.transactions_cursor || undefined;
      let hasMore = true;
      let pageCount = 0;

      while (hasMore) {
        pageCount += 1;

        const syncResponse = await plaidClient.transactionsSync({
          access_token: item.access_token,
          cursor,
          count: 500,
        });

        const added = syncResponse.data.added || [];
        const modified = syncResponse.data.modified || [];
        const removed = syncResponse.data.removed || [];

        for (const transaction of added) {
          const { error: insertError } = await supabaseAdmin
            .from("admin_plaid_transactions")
            .upsert(
              {
                user_id: item.user_id,
                item_id: item.item_id,
                account_id: transaction.account_id,
                transaction_id: transaction.transaction_id,
                name: transaction.name,
                merchant_name: transaction.merchant_name || null,
                amount: transaction.amount,
                iso_currency_code: transaction.iso_currency_code || null,
                unofficial_currency_code:
                  transaction.unofficial_currency_code || null,
                date: asDateString(transaction.date),
                authorized_date: asDateString(transaction.authorized_date),
                pending: transaction.pending,
                payment_channel: transaction.payment_channel || null,
                category: transaction.category || null,
                category_id: transaction.category_id || null,
                personal_finance_category:
                  transaction.personal_finance_category || null,
                raw: transaction,
                removed_at: null,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "transaction_id",
              },
            );

          if (insertError) {
            console.error("Plaid transaction insert error:", insertError);
          }
        }

        for (const transaction of modified) {
          const { error: updateError } = await supabaseAdmin
            .from("admin_plaid_transactions")
            .upsert(
              {
                user_id: item.user_id,
                item_id: item.item_id,
                account_id: transaction.account_id,
                transaction_id: transaction.transaction_id,
                name: transaction.name,
                merchant_name: transaction.merchant_name || null,
                amount: transaction.amount,
                iso_currency_code: transaction.iso_currency_code || null,
                unofficial_currency_code:
                  transaction.unofficial_currency_code || null,
                date: asDateString(transaction.date),
                authorized_date: asDateString(transaction.authorized_date),
                pending: transaction.pending,
                payment_channel: transaction.payment_channel || null,
                category: transaction.category || null,
                category_id: transaction.category_id || null,
                personal_finance_category:
                  transaction.personal_finance_category || null,
                raw: transaction,
                removed_at: null,
                updated_at: new Date().toISOString(),
              },
              {
                onConflict: "transaction_id",
              },
            );

          if (updateError) {
            console.error("Plaid transaction update error:", updateError);
          }
        }

        for (const removedTransaction of removed) {
          const { error: removeError } = await supabaseAdmin
            .from("admin_plaid_transactions")
            .update({
              removed_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("transaction_id", removedTransaction.transaction_id);

          if (removeError) {
            console.error("Plaid transaction remove error:", removeError);
          }
        }

        totalAdded += added.length;
        totalModified += modified.length;
        totalRemoved += removed.length;

        cursor = syncResponse.data.next_cursor;
        hasMore = Boolean(syncResponse.data.has_more);

        if (pageCount > 20) {
          throw new Error(
            `Plaid transaction sync exceeded 20 pages for item ${item.item_id}.`,
          );
        }
      }

      const { error: cursorError } = await supabaseAdmin
        .from("admin_plaid_items")
        .update({
          transactions_cursor: cursor || null,
          transactions_last_synced_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("item_id", item.item_id);

      if (cursorError) {
        console.error("Plaid cursor update error:", cursorError);
      }

      syncedItems.push(item.item_id);
    }

    return NextResponse.json({
      ok: true,
      message: "Plaid transactions synced successfully.",
      plaid_environment: currentPlaidEnvironment,
      items_synced: syncedItems.length,
      item_ids: syncedItems,
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
    });
  } catch (error) {
    const message = getErrorMessage(error);

    console.error("Plaid transactions sync error:", message);

    return NextResponse.json(
      {
        error: message,
        plaid_environment: currentPlaidEnvironment,
      },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}