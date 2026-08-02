/**
 * Sweep sitguru.local / journey.amb. automated ambassador test profiles.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/cleanup-test-ambassadors.ts
 */

import { purgeTestAmbassadorProfiles } from "@/lib/actions/admin-ambassador-cleanup";

async function main() {
  console.log("Purging automated ambassador test profiles…");
  const result = await purgeTestAmbassadorProfiles();
  console.log(JSON.stringify(result, null, 2));
  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
