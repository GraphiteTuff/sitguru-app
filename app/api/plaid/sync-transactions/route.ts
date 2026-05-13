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

type PlaidAccountRow = {
  account_id: string;
  item_id: string;
  name?: string | null;
  official_name?: string | null;
  subtype?: string | null;
};

type AutoCategory = {
  sitguru_category: string;
  sitguru_category_type: string;
  sitguru_report_section: string;
  is_excluded_from_reports: boolean;
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

function isBusinessCheckingOrSavings(account: PlaidAccountRow) {
  const name = `${account.name || ""} ${account.official_name || ""}`.toLowerCase();
  const subtype = String(account.subtype || "").toLowerCase();

  return (subtype === "checking" || subtype === "savings") && name.includes("business");
}

function autoCategorizeTransaction(transaction: {
  name?: string | null;
  merchant_name?: string | null;
  amount?: number | null;
}): AutoCategory {
  const text = `${transaction.name || ""} ${transaction.merchant_name || ""}`.toLowerCase();
  const amount = Number(transaction.amount || 0);

  if (text.includes("transfer from savings") || text.includes("transfer to checking")) {
    return {
      sitguru_category: "Transfer Between Accounts",
      sitguru_category_type: "transfer",
      sitguru_report_section: "Transfers",
      is_excluded_from_reports: false,
    };
  }

  if (text.includes("stripe")) {
    return {
      sitguru_category: "Stripe Deposit",
      sitguru_category_type: "income",
      sitguru_report_section: "Revenue",
      is_excluded_from_reports: false,
    };
  }

  if (text.includes("apple")) {
    return {
      sitguru_category: "Software / SaaS",
      sitguru_category_type: "expense",
      sitguru_report_section: "Operating Expenses",
      is_excluded_from_reports: false,
    };
  }

  if (
    text.includes("grok") ||
    text.includes("xai") ||
    text.includes("ngrok") ||
    text.includes("supabase") ||
    text.includes("vercel") ||
    text.includes("twilio") ||
    text.includes("google")
  ) {
    return {
      sitguru_category: "Software / SaaS",
      sitguru_category_type: "expense",
      sitguru_report_section: "Operating Expenses",
      is_excluded_from_reports: false,
    };
  }

  if (
    text.includes("meta") ||
    text.includes("facebook") ||
    text.includes("penny") ||
    text.includes("pennypower")
  ) {
    return {
      sitguru_category: "Marketing / Advertising",
      sitguru_category_type: "expense",
      sitguru_report_section: "Operating Expenses",
      is_excluded_from_reports: false,
    };
  }

  if (text.includes("checkr")) {
    return {
      sitguru_category: "Legal / Professional",
      sitguru_category_type: "expense",
      sitguru_report_section: "Operating Expenses",
      is_excluded_from_reports: false,
    };
  }

  if (text.includes("dfas")) {
    return {
      sitguru_category: "Owner Contribution",
      sitguru_category_type: "owner_equity",
      sitguru_report_section: "Owner Equity",
      is_excluded_from_reports: false,
    };
  }

  if (text.includes("refund")) {
    return {
      sitguru_category: "Refunds",
      sitguru_category_type: "expense",
      sitguru_report_section: "Refunds",
      is_excluded_from_reports: false,
    };
  }

  if (amount < 0) {
    return {
      sitguru_category: "Other Income",
      sitguru_category_type: "income",
      sitguru_report_section: "Revenue",
      is_excluded_from_reports: false,
    };
  }

  if (amount > 0) {
    return {
      sitguru_category: "Uncategorized",
      sitguru_category_type: "expense",
      sitguru_report_section: "Needs Review",
      is_excluded_from_reports: false,
    };
  }

  return {
    sitguru_category: "Uncategorized",
    sitguru_category_type: "uncategorized",
    sitguru_report_section: "Needs Review",
    is_excluded_from_reports: false,
  };
}

async function applyAutoCategory({
  userId,
  transactionId,
  category,
}: {
  userId: string;
  transactionId: string;
  category: AutoCategory;
}) {
  const { error } = await supabaseAdmin
    .from("admin_plaid_transactions")
    .update({
      sitguru_category: category.sitguru_category,
      sitguru_category_type: category.sitguru_category_type,
      sitguru_report_section: category.sitguru_report_section,
      is_excluded_from_reports: category.is_excluded_from_reports,
      review_status:
        category.sitguru_category === "Uncategorized"
          ? "needs_review"
          : "auto_categorized",
      categorized_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("transaction_id", transactionId)
    .eq("manually_categorized", false);

  if (error) {
    console.error("Plaid auto-category update error:", error);
  }
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

    const itemIds = items.map((item) => item.item_id);

    const { data: accountRows, error: accountError } = await supabaseAdmin
      .from("admin_plaid_accounts")
      .select("account_id, item_id, name, official_name, subtype")
      .eq("user_id", adminCheck.user.id)
      .in("item_id", itemIds);

    if (accountError) {
      console.error("Plaid business account lookup error:", accountError);

      return NextResponse.json(
        { error: "Unable to load business checking/savings accounts." },
        { status: 500 },
      );
    }

    const businessAccounts = ((accountRows || []) as PlaidAccountRow[]).filter(
      isBusinessCheckingOrSavings,
    );

    const allowedAccountIds = new Set(
      businessAccounts.map((account) => account.account_id),
    );

    if (!allowedAccountIds.size) {
      return NextResponse.json(
        {
          error:
            "No Business Checking or Business Savings accounts are saved for this Plaid environment.",
        },
        { status: 404 },
      );
    }

    let totalAdded = 0;
    let totalModified = 0;
    let totalRemoved = 0;
    let skippedTransactions = 0;
    let autoCategorized = 0;
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
          if (!allowedAccountIds.has(transaction.account_id)) {
            skippedTransactions += 1;
            continue;
          }

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
          } else {
            const category = autoCategorizeTransaction(transaction);
            await applyAutoCategory({
              userId: item.user_id,
              transactionId: transaction.transaction_id,
              category,
            });
            autoCategorized += 1;
            totalAdded += 1;
          }
        }

        for (const transaction of modified) {
          if (!allowedAccountIds.has(transaction.account_id)) {
            skippedTransactions += 1;
            continue;
          }

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
          } else {
            const category = autoCategorizeTransaction(transaction);
            await applyAutoCategory({
              userId: item.user_id,
              transactionId: transaction.transaction_id,
              category,
            });
            autoCategorized += 1;
            totalModified += 1;
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
          } else {
            totalRemoved += 1;
          }
        }

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
      message:
        "Business checking/savings transactions synced and auto-categorized successfully.",
      plaid_environment: currentPlaidEnvironment,
      items_synced: syncedItems.length,
      business_accounts_synced: allowedAccountIds.size,
      item_ids: syncedItems,
      added: totalAdded,
      modified: totalModified,
      removed: totalRemoved,
      auto_categorized: autoCategorized,
      skipped_non_business_transactions: skippedTransactions,
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