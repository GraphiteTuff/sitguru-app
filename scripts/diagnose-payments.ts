/**
 * Safe Stripe / PayPal connectivity diagnostic.
 * Prints configuration status and runs lightweight API probes.
 * Never prints secret values.
 *
 * Usage:
 *   npx tsx scripts/diagnose-payments.ts
 */

import Stripe from "stripe";

type Check = { name: string; ok: boolean; detail: string };

const checks: Check[] = [];

function mark(name: string, ok: boolean, detail: string) {
  checks.push({ name, ok, detail });
  const icon = ok ? "OK" : "FAIL";
  console.log(`[${icon}] ${name}: ${detail}`);
}

function present(name: string) {
  const value = process.env[name]?.trim() || "";
  return value.length > 0;
}

function modeHint(value: string | undefined) {
  const v = (value || "").trim();
  if (!v) return "missing";
  if (v.startsWith("sk_test") || v.startsWith("pk_test")) return "test";
  if (v.startsWith("sk_live") || v.startsWith("pk_live")) return "live";
  if (v.toLowerCase().includes("sandbox")) return "sandbox";
  return "set";
}

async function main() {
  console.log("SitGuru payment diagnostic\n");

  mark(
    "STRIPE_SECRET_KEY",
    present("STRIPE_SECRET_KEY"),
    modeHint(process.env.STRIPE_SECRET_KEY),
  );
  mark(
    "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
    present("NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"),
    modeHint(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY),
  );
  mark(
    "STRIPE_WEBHOOK_SECRET",
    present("STRIPE_WEBHOOK_SECRET"),
    present("STRIPE_WEBHOOK_SECRET") ? "set" : "missing",
  );

  mark(
    "PAYPAL_CLIENT_ID",
    present("PAYPAL_CLIENT_ID"),
    present("PAYPAL_CLIENT_ID") ? "set" : "missing",
  );
  mark(
    "PAYPAL_CLIENT_SECRET",
    present("PAYPAL_CLIENT_SECRET"),
    present("PAYPAL_CLIENT_SECRET") ? "set" : "missing",
  );
  mark(
    "PAYPAL_ENV",
    true,
    (process.env.PAYPAL_ENV || "sandbox").trim() || "sandbox",
  );
  mark(
    "PAYPAL_MARKETPLACE_ENABLED",
    true,
    process.env.PAYPAL_MARKETPLACE_ENABLED || "false/unset",
  );

  mark(
    "NEXT_PUBLIC_SUPABASE_URL",
    present("NEXT_PUBLIC_SUPABASE_URL"),
    present("NEXT_PUBLIC_SUPABASE_URL") ? "set" : "missing",
  );
  mark(
    "SUPABASE_SERVICE_ROLE_KEY",
    present("SUPABASE_SERVICE_ROLE_KEY"),
    present("SUPABASE_SERVICE_ROLE_KEY") ? "set" : "missing",
  );

  if (present("STRIPE_SECRET_KEY")) {
    try {
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!.trim(), {
        apiVersion: "2026-03-25.dahlia",
      });
      const balance = await stripe.balance.retrieve();
      mark(
        "Stripe API reachability",
        true,
        `balance available currencies: ${balance.available.map((b) => b.currency).join(",") || "none"}`,
      );

      const accounts = await stripe.accounts.list({ limit: 1 });
      mark(
        "Stripe Connect accounts.list",
        true,
        `reachable (${accounts.data.length} sample account(s) returned)`,
      );
    } catch (error) {
      mark(
        "Stripe API reachability",
        false,
        error instanceof Error ? error.message : "unknown Stripe error",
      );
    }
  } else {
    mark("Stripe API reachability", false, "skipped — missing STRIPE_SECRET_KEY");
  }

  if (present("PAYPAL_CLIENT_ID") && present("PAYPAL_CLIENT_SECRET")) {
    try {
      const env = (process.env.PAYPAL_ENV || "sandbox").toLowerCase();
      const base =
        env === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";
      const auth = Buffer.from(
        `${process.env.PAYPAL_CLIENT_ID!.trim()}:${process.env.PAYPAL_CLIENT_SECRET!.trim()}`,
      ).toString("base64");

      const response = await fetch(`${base}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
      });

      mark(
        "PayPal OAuth token",
        response.ok,
        response.ok
          ? `reachable (${env})`
          : `HTTP ${response.status} (${env})`,
      );
    } catch (error) {
      mark(
        "PayPal OAuth token",
        false,
        error instanceof Error ? error.message : "unknown PayPal error",
      );
    }
  } else {
    mark(
      "PayPal OAuth token",
      false,
      "skipped — missing PAYPAL_CLIENT_ID/SECRET",
    );
  }

  const failed = checks.filter((c) => !c.ok);
  console.log(
    `\nSummary: ${checks.length - failed.length}/${checks.length} checks passed`,
  );

  if (failed.length) {
    console.log(
      "\nTo live-test Stripe/PayPal in this Cloud Agent, add TEST/SANDBOX secrets to the environment:",
    );
    console.log(
      "  STRIPE_SECRET_KEY (sk_test_...), NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY (pk_test_...), STRIPE_WEBHOOK_SECRET",
    );
    console.log(
      "  PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV=sandbox",
    );
    console.log(
      "  NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY",
    );
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
