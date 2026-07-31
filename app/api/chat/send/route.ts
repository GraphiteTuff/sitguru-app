// app/api/chat/send/route.ts
/**
 * Platform messaging engine alias — same handler as /api/messaging/send,
 * which also records ACTIVE_WALK rows into the global chat intelligence ledger.
 */

export { POST, dynamic, runtime } from "@/app/api/messaging/send/route";
