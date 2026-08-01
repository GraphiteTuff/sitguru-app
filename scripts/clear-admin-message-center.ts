/**
 * One-shot wipe of Admin Message Center conversations + messages.
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/clear-admin-message-center.ts
 *
 * Kept outside the Next.js tsconfig include (see tsconfig.json exclude)
 * so CLI `main()` helpers do not collide during `next build` typechecks.
 */

async function clearAdminMessageCenterMain() {
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

clearAdminMessageCenterMain().catch((error) => {
  console.error(error);
  process.exit(1);
});
