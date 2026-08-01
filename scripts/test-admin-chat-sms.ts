/**
 * Controlled Admin Message Center chat test to a real phone.
 *
 * From vs To (do not put both in TWILIO_PHONE_NUMBER):
 *   --from / TWILIO_FROM_NUMBER / TWILIO_PHONE_NUMBER
 *     = SitGuru Twilio sender (must be a number owned in Twilio Console)
 *   --to
 *     = your personal phone that receives the SMS
 *
 * Usage:
 *   npx tsx --env-file=.env.local scripts/test-admin-chat-sms.ts --to 2534552377 --from 2534550369
 *   npx tsx --env-file=.env.local scripts/test-admin-chat-sms.ts 2534552377
 */

import { createSupabaseAdminClient } from "../lib/supabase/admin";

function digitsOnly(value: string) {
  return String(value || "").replace(/\D/g, "");
}

function asString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeUsPhone(phone: string) {
  const digits = digitsOnly(phone);
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return "";
}

function parseCliArgs(argv: string[]) {
  let to = "";
  let from = "";
  let name = "";
  let message = "";
  let media = "";

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--to" || arg === "-t") {
      to = asString(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--from" || arg === "-f") {
      from = asString(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--name" || arg === "-n") {
      name = asString(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--message" || arg === "-m") {
      message = asString(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg === "--media") {
      media = asString(argv[i + 1]);
      i += 1;
      continue;
    }
    if (arg.startsWith("--to=")) {
      to = asString(arg.slice("--to=".length));
      continue;
    }
    if (arg.startsWith("--from=")) {
      from = asString(arg.slice("--from=".length));
      continue;
    }
    if (arg.startsWith("--name=")) {
      name = asString(arg.slice("--name=".length));
      continue;
    }
    if (arg.startsWith("--message=")) {
      message = asString(arg.slice("--message=".length));
      continue;
    }
    if (arg.startsWith("--media=")) {
      media = asString(arg.slice("--media=".length));
      continue;
    }
    if (!arg.startsWith("-") && !to) {
      to = asString(arg);
    }
  }

  return { to, from, name, message, media };
}

function getAppOrigin() {
  return (
    asString(process.env.NEXT_PUBLIC_APP_URL).replace(/\/$/, "") ||
    asString(process.env.NEXT_PUBLIC_SITE_URL).replace(/\/$/, "") ||
    "https://sitguru.com"
  );
}

function twilioConfigured() {
  return Boolean(
    asString(process.env.TWILIO_ACCOUNT_SID) &&
      asString(process.env.TWILIO_AUTH_TOKEN) &&
      (asString(process.env.TWILIO_MESSAGING_SERVICE_SID) ||
        asString(process.env.TWILIO_FROM_NUMBER) ||
        asString(process.env.TWILIO_PHONE_NUMBER) ||
        asString(process.env.TWILIO_FROM_PHONE_NUMBER)),
  );
}

function resolveTwilioFrom(excludeTo?: string, explicitFrom?: string) {
  if (explicitFrom) {
    return normalizeUsPhone(explicitFrom) || asString(explicitFrom);
  }

  // Prefer dedicated FROM vars. Never treat a comma-list of from+to as one From.
  const candidates = [
    asString(process.env.TWILIO_FROM_NUMBER),
    asString(process.env.TWILIO_FROM_PHONE_NUMBER),
    asString(process.env.TWILIO_PHONE_NUMBER),
  ]
    .flatMap((value) => value.split(/[,\s]+/))
    .map((value) => normalizeUsPhone(value) || asString(value))
    .filter(Boolean);

  const exclude = normalizeUsPhone(excludeTo || "") || asString(excludeTo || "");
  const usable = candidates.filter((value) => value !== exclude);
  return usable[0] || "";
}

async function sendTestSms(params: {
  toPhone: string;
  fromPhone?: string;
  bodyText: string;
  mediaUrl?: string;
}) {
  const accountSid = asString(process.env.TWILIO_ACCOUNT_SID);
  const authToken = asString(process.env.TWILIO_AUTH_TOKEN);
  const messagingServiceSid = asString(process.env.TWILIO_MESSAGING_SERVICE_SID);
  const fromPhone = resolveTwilioFrom(params.toPhone, params.fromPhone);
  const mediaUrl = asString(params.mediaUrl);

  if (!accountSid || !authToken || (!messagingServiceSid && !fromPhone)) {
    return {
      ok: false as const,
      skipped: true as const,
      error:
        "Twilio is not configured. Set TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN and either TWILIO_MESSAGING_SERVICE_SID or a single TWILIO_FROM_NUMBER.",
      mode: null,
      fromLast4: null,
    };
  }

  const body = new URLSearchParams({
    To: params.toPhone,
    Body: params.bodyText,
  });

  if (mediaUrl) {
    body.append("MediaUrl", mediaUrl);
  }

  let mode: "messaging_service" | "from_number" = "from_number";
  if (messagingServiceSid) {
    body.set("MessagingServiceSid", messagingServiceSid);
    mode = "messaging_service";
  } else {
    body.set("From", fromPhone);
    mode = "from_number";
  }

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      ok: false as const,
      skipped: false as const,
      mode,
      fromLast4: fromPhone ? fromPhone.slice(-4) : null,
      media: Boolean(mediaUrl),
      error: `Twilio HTTP ${response.status}: ${text.slice(0, 280)}`,
    };
  }

  const payload = (await response.json().catch(() => null)) as {
    sid?: string;
    status?: string;
  } | null;

  return {
    ok: true as const,
    skipped: false as const,
    mode,
    fromLast4: fromPhone ? fromPhone.slice(-4) : null,
    media: Boolean(mediaUrl),
    sid: payload?.sid || null,
    status: payload?.status || null,
  };
}

function profilePhone(row: Record<string, unknown>) {
  for (const key of ["phone", "phone_number", "mobile_phone", "cell_phone", "mobile"]) {
    const value = String(row[key] || "").trim();
    if (value) return value;
  }
  return "";
}

function profileName(row: Record<string, unknown>) {
  const full = String(row.full_name || "").trim();
  if (full) return full;
  const first = String(row.first_name || "").trim();
  const last = String(row.last_name || "").trim();
  return [first, last].filter(Boolean).join(" ") || "SitGuru Tester";
}

function isGenericPersonName(value: string) {
  return /^(sitguru|member|customer|user|guest|tester|test|friend|admin|support)$/i.test(
    value.trim(),
  );
}

function profileFirstName(row: Record<string, unknown> | null, fallbackName: string) {
  const candidates = [
    String(row?.first_name || "").trim().split(/\s+/)[0] || "",
    String(row?.email || "")
      .split("@")[0]
      ?.replace(/[._0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .find((part) => part.length >= 2) || "",
    String(row?.full_name || fallbackName || "").trim().split(/\s+/)[0] || "",
  ];

  for (const raw of candidates) {
    const token = String(raw || "").trim();
    if (!token || isGenericPersonName(token)) continue;
    return token.charAt(0).toUpperCase() + token.slice(1);
  }

  return "friend";
}

function pickRogueSmsCopy(params: {
  firstName: string;
  threadUrl: string;
}) {
  const name = titleCaseName(params.firstName || "Friend");
  const lines = [
    `Hey ${name} — Rogue here, Chief Treat Officer 🦴 SitGuru left a little note in your bowl. Tap when the pack’s ready: ${params.threadUrl}`,
    `Psst ${name}… Rogue (CTO 🦴) slid a SitGuru message under the door. No zoomies required — just a tap: ${params.threadUrl}`,
    `${name}! Rogue, Chief Treat Officer 🦴 checking in — you’ve got a fresh SitGuru ping. Open it before the treats disappear: ${params.threadUrl}`,
    `Wag check, ${name}. Rogue · Chief Treat Officer 🦴 saved you a SitGuru message. One tap, zero guilt trips: ${params.threadUrl}`,
  ];
  return lines[Math.floor(Math.random() * lines.length)]!;
}

function titleCaseName(value: string) {
  const raw = String(value || "").trim();
  if (!raw) return "Friend";
  return raw
    .split(/\s+/)
    .map((part) =>
      part ? part.charAt(0).toUpperCase() + part.slice(1).toLowerCase() : part,
    )
    .join(" ");
}

async function main() {
  const {
    to: toArg,
    from: fromArg,
    name: nameArg,
    message: messageArg,
    media: mediaArg,
  } = parseCliArgs(process.argv.slice(2));
  const rawPhone = toArg || "2534552377";
  const e164 = normalizeUsPhone(rawPhone);
  const last10 = digitsOnly(rawPhone).slice(-10);
  const explicitFrom = fromArg ? normalizeUsPhone(fromArg) || fromArg : "";
  const explicitName = asString(nameArg);
  const explicitMessage = asString(messageArg);
  const explicitMedia = asString(mediaArg);

  if (!e164 || last10.length !== 10) {
    console.error("Invalid --to phone. Use your personal 10-digit US number.");
    process.exit(1);
  }

  if (explicitFrom && explicitFrom === e164) {
    console.error("--from and --to must be different numbers.");
    process.exit(1);
  }

  const supabase = createSupabaseAdminClient();

  // Soft lookup — only columns that commonly exist.
  const { data: profilesByPhone, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, first_name, last_name, role, account_type, phone")
    .ilike("phone", `%${last10}%`)
    .limit(10);

  if (profileError) {
    console.warn("profiles.phone lookup warning:", profileError.message);
  }

  const { data: gurusByPhone } = await supabase
    .from("gurus")
    .select("user_id, email, full_name, first_name, last_name, phone")
    .ilike("phone", `%${last10}%`)
    .limit(10);

  const matchedProfile = ((profilesByPhone || [])[0] || null) as Record<
    string,
    unknown
  > | null;
  const matchedGuru = ((gurusByPhone || [])[0] || null) as Record<
    string,
    unknown
  > | null;

  const recipientUserId =
    String(matchedProfile?.id || matchedGuru?.user_id || "").trim() || null;
  const recipientName = explicitName
    ? explicitName
    : matchedProfile
      ? profileName(matchedProfile)
      : matchedGuru
        ? profileName(matchedGuru)
        : "Jason (SMS Test)";
  const recipientEmail = String(
    matchedProfile?.email || matchedGuru?.email || "",
  ).trim();
  const recipientRole = matchedGuru
    ? "guru"
    : String(matchedProfile?.role || matchedProfile?.account_type || "customer")
        .toLowerCase()
        .includes("guru")
      ? "guru"
      : "customer";

  // Prefer a known admin / superuser profile if available.
  const adminEmail =
    String(process.env.ADMIN_EMAIL || process.env.SUPERUSER_EMAIL || "").trim() ||
    "jason@sitguru.com";

  const { data: adminProfile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, account_type")
    .ilike("email", adminEmail)
    .maybeSingle();

  const adminUserId = String((adminProfile as { id?: string } | null)?.id || "").trim();

  const resolvedFirst = explicitName
    ? explicitName.split(/\s+/)[0] || explicitName
    : profileFirstName(matchedProfile || matchedGuru, recipientName);
  const firstName =
    resolvedFirst === "friend" && !explicitName ? "Jason" : resolvedFirst;

  const now = new Date().toISOString();
  // Placeholder until conversation id exists; rewritten after insert for SMS + DB preview.
  let preview = `Hey ${firstName} — Rogue, Chief Treat Officer 🦴 left you a SitGuru note.`;

  const conversationPayload: Record<string, unknown> = {
    subject: `Rogue · Chief Treat Officer 🦴 · ${firstName}`,
    status: "open",
    topic: "direct_message",
    last_message_preview: preview,
    last_message_at: now,
    created_at: now,
    updated_at: now,
  };

  if (adminUserId) conversationPayload.started_by_user_id = adminUserId;
  if (recipientUserId && recipientRole === "customer") {
    conversationPayload.customer_id = recipientUserId;
  }
  if (recipientUserId && recipientRole === "guru") {
    conversationPayload.guru_id = recipientUserId;
  }

  const { data: conversation, error: conversationError } = await supabase
    .from("conversations")
    .insert(conversationPayload)
    .select("id")
    .single();

  if (conversationError || !conversation?.id) {
    console.error("Conversation create failed:", conversationError?.message);
    process.exit(1);
  }

  const conversationId = String(conversation.id);

  if (adminUserId) {
    await supabase.from("conversation_participants").upsert(
      [
        {
          conversation_id: conversationId,
          user_id: adminUserId,
          role: "admin",
          created_at: now,
          updated_at: now,
        },
        ...(recipientUserId
          ? [
              {
                conversation_id: conversationId,
                user_id: recipientUserId,
                role: recipientRole,
                created_at: now,
                updated_at: now,
              },
            ]
          : []),
      ],
      { onConflict: "conversation_id,user_id", ignoreDuplicates: false },
    );
  }

  const { error: messageError } = await supabase.from("messages").insert({
    conversation_id: conversationId,
    sender_id: adminUserId || null,
    recipient_id: recipientUserId,
    sender_role: "admin",
    recipient_role: recipientRole,
    sender_name_snapshot: "Rogue · Chief Treat Officer 🦴",
    sender_role_snapshot: "admin",
    recipient_name_snapshot: recipientName,
    recipient_email_snapshot: recipientEmail || null,
    recipient_phone_snapshot: e164,
    recipient_role_snapshot: recipientRole,
    content: preview,
    body: preview,
    message_type: "direct_message",
    topic: "direct_message",
    status: "unread",
    is_read: false,
    created_at: now,
    updated_at: now,
  });

  if (messageError) {
    console.error("Message insert failed:", messageError.message);
    process.exit(1);
  }

  if (recipientUserId) {
    const href = `/messages/${conversationId}`;
    await supabase.from("notifications").insert({
      user_id: recipientUserId,
      title: "Rogue · Chief Treat Officer 🦴",
      body: preview,
      type: "message",
      href,
      link: href,
      is_read: false,
      created_at: now,
      updated_at: now,
    });
  }

  const threadUrl = `${getAppOrigin()}/messages/${conversationId}`;
  const smsBody = explicitMessage
    ? explicitMessage.includes("http")
      ? explicitMessage
      : `${explicitMessage} ${threadUrl}`
    : pickRogueSmsCopy({ firstName, threadUrl });
  preview = smsBody;

  await supabase
    .from("conversations")
    .update({
      last_message_preview: smsBody.slice(0, 240),
      updated_at: new Date().toISOString(),
    })
    .eq("id", conversationId);

  await supabase
    .from("messages")
    .update({
      content: smsBody,
      body: smsBody,
      sender_name_snapshot: "Rogue · Chief Treat Officer 🦴",
      updated_at: new Date().toISOString(),
    })
    .eq("conversation_id", conversationId);

  const smsResult = await sendTestSms({
    toPhone: e164,
    fromPhone: explicitFrom || undefined,
    bodyText: smsBody,
    mediaUrl: explicitMedia || undefined,
  });

  console.log(
    JSON.stringify(
      {
        ok: true,
        to: e164,
        fromProvided: Boolean(explicitFrom),
        twilioConfigured: twilioConfigured(),
        voice: "Rogue · Chief Treat Officer 🦴",
        firstName,
        recipientUserId,
        recipientName,
        recipientRole,
        matchedProfilePhone: matchedProfile ? profilePhone(matchedProfile) : null,
        conversationId,
        adminThreadUrl: `${getAppOrigin()}/admin/messages/${conversationId}`,
        publicThreadUrl: threadUrl,
        mediaUrl: explicitMedia || null,
        smsBody,
        sms: smsResult,
        note: recipientUserId
          ? "Linked to an existing account — in-app notification created."
          : "No matching account for this phone — SMS only.",
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
