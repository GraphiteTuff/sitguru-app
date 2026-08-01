/**
 * One-shot wipe of Admin Message Center conversations + messages.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/clear-admin-message-center.ts
 */

async function main() {
  const { clearAdminMessageCenter } = await import(
    "../lib/messaging/admin-thread-purge"
  );

  console.log("Clearing Admin Message Center…");
  const result = await clearAdminMessageCenter();

  if (!result.ok) {
    console.error("Clear failed:", result.error);
    process.exit(1);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        conversationsDeleted: result.conversationsDeleted,
        messagesDeleted: result.messagesDeleted,
        orphanMessagesDeleted: result.orphanMessagesDeleted,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
