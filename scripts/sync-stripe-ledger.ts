/**
 * One-shot: sync Stripe ledger into stripe_transactions / balance / payouts.
 * Usage: npx tsx --env-file=.env.local scripts/sync-stripe-ledger.ts
 */

import { syncStripeLedger } from "../lib/stripe/sync-ledger";

async function main() {
  const result = await syncStripeLedger({
    balanceLimit: 300,
    payoutLimit: 100,
  });
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
