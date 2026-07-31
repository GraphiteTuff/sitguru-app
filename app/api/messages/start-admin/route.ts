import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type GuruLookupRow = {
  id?: string | number | null;
  user_id?: string | null;
  slug?: string | null;
  full_name?: string | null;
  display_name?: string | null;
  email?: string | null;
};

type ConversationRow = {
  id: string;
  customer_id?: string | null;
  guru_id?: string | null;
  booking_id?: string | null;
  status?: string | null;
  subject?: string | null;
};

type ConversationParticipantRow = {
  conversation_id: string;
  user_id: string;
  role?: string | null;
};

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function buildMessageThreadHref(conversationId: string) {
  return `/messages/${conversationId}`;
}

function getBaseUrl() {
  const raw =
    safeString(process.env.NEXT_PUBLIC_APP_URL) ||
    safeString(process.env.NEXT_PUBLIC_SITE_URL) ||
    "https://www.sitguru.com";

  return raw.replace(/\/+$/, "");
}

function getSupportFromEmail() {
  return (
    safeString(process.env.SITGURU_SUPPORT_FROM) ||
    safeString(process.env.RESEND_FROM_EMAIL) ||
    "SitGuru <support@sitguru.com>"
  );
}

function getSupportReplyToEmail() {
  return (
    safeString(process.env.RESEND_REPLY_TO_EMAIL) ||
    safeString(process.env.SITGURU_SUPPORT_EMAIL) ||
    "support@sitguru.com"
  );
}

function getAdminAlertRecipients() {
  const envRecipients = safeString(process.env.SITGURU_SUPPORT_EMAIL)
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  const fallbackRecipients = [
    "jason@sitguru.com",
    "nette@sitguru.com",
    "support@sitguru.com",
  ];

  return Array.from(new Set([...envRecipients, ...fallbackRecipients]));
}

function buildConversationSubject(params: {
  petName: string | null;
  bookingId: string | null;
  subjectRaw: string | null;
}) {
  const explicit = safeString(params.subjectRaw);
  if (explicit) return explicit;

  const parts: string[] = ["Care conversation"];

  if (params.petName) {
    parts.push(`for ${params.petName}`);
  }

  if (params.bookingId) {
    parts.push(`Booking #${params.bookingId}`);
  }

  return parts.join(" · ");
}

function buildPreviewText(params: {
  petName: string | null;
  initialMessage: string | null;
}) {
  const initial = safeString(params.initialMessage);
  if (initial) {
    return initial.slice(0, 180);
  }

  if (params.petName) {
    return `Conversation started about ${params.petName}.`;
  }

  return "Conversation started.";
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function sendAdminNewMessageEmail(params: {
  conversationId: string;
  customerDisplayName: string;
  guruDisplayName: string;
  customerEmail: string;
  guruEmail: string;
  subject: string;
  messageBody: string;
}) {
  const apiKey = safeString(process.env.RESEND_API_KEY);

  if (!apiKey) {
    console.error("Message email alert skipped: RESEND_API_KEY is missing.");
    return;
  }

  const recipients = getAdminAlertRecipients();

  if (recipients.length === 0) {
    console.error("Message email alert skipped: no admin recipients configured.");
    return;
  }

  const resend = new Resend(apiKey);
  const baseUrl = getBaseUrl();
  const threadUrl = `${baseUrl}${buildMessageThreadHref(params.conversationId)}`;

  const safeCustomerName = escapeHtml(params.customerDisplayName || "Pet Parent");
  const safeGuruName = escapeHtml(params.guruDisplayName || "Guru");
  const safeCustomerEmail = escapeHtml(params.customerEmail || "Not available");
  const safeGuruEmail = escapeHtml(params.guruEmail || "Not available");
  const safeSubject = escapeHtml(params.subject || "New SitGuru message");
  const safeMessage = escapeHtml(params.messageBody || "").replaceAll("\n", "<br />");

  try {
    const result = await resend.emails.send({
      from: getSupportFromEmail(),
      to: recipients,
      replyTo: getSupportReplyToEmail(),
      subject: `New SitGuru message: ${params.customerDisplayName || "Pet Parent"}`,
      html: `
        <div style="font-family: Arial, sans-serif; background: #f6fbf7; padding: 24px;">
          <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 18px; overflow: hidden; border: 1px solid #dcefe2;">
            <div style="background: #0f5132; color: #ffffff; padding: 22px 24px;">
              <h1 style="margin: 0; font-size: 22px;">New SitGuru Message</h1>
              <p style="margin: 8px 0 0; font-size: 14px; color: #d9f7e5;">
                A new message was sent inside SitGuru.
              </p>
            </div>

            <div style="padding: 24px;">
              <p style="margin: 0 0 14px; color: #123524; font-size: 15px;">
                <strong>Subject:</strong> ${safeSubject}
              </p>

              <div style="background: #f3faf5; border: 1px solid #dcefe2; border-radius: 14px; padding: 16px; margin: 18px 0;">
                <p style="margin: 0 0 8px; color: #123524; font-size: 14px;">
                  <strong>From:</strong> ${safeCustomerName}
                </p>
                <p style="margin: 0 0 8px; color: #123524; font-size: 14px;">
                  <strong>Customer Email:</strong> ${safeCustomerEmail}
                </p>
                <p style="margin: 0 0 8px; color: #123524; font-size: 14px;">
                  <strong>Guru:</strong> ${safeGuruName}
                </p>
                <p style="margin: 0; color: #123524; font-size: 14px;">
                  <strong>Guru Email:</strong> ${safeGuruEmail}
                </p>
              </div>

              <div style="margin: 18px 0;">
                <p style="margin: 0 0 8px; color: #123524; font-size: 14px;">
                  <strong>Message:</strong>
                </p>
                <div style="background: #ffffff; border-left: 4px solid #0f8f4f; padding: 14px 16px; color: #123524; font-size: 15px; line-height: 1.5;">
                  ${safeMessage || "No message body provided."}
                </div>
              </div>

              <p style="margin: 22px 0 0;">
                <a href="${threadUrl}" style="display: inline-block; background: #0f8f4f; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 999px; font-weight: 700;">
                  Open SitGuru Message
                </a>
              </p>

              <p style="margin: 18px 0 0; color: #5f7468; font-size: 12px;">
                Conversation ID: ${escapeHtml(params.conversationId)}
              </p>
            </div>
          </div>
        </div>
      `,
      text: [
        "New SitGuru Message",
        "",
        `Subject: ${params.subject}`,
        `From: ${params.customerDisplayName}`,
        `Customer Email: ${params.customerEmail || "Not available"}`,
        `Guru: ${params.guruDisplayName}`,
        `Guru Email: ${params.guruEmail || "Not available"}`,
        "",
        "Message:",
        params.messageBody,
        "",
        `Open message: ${threadUrl}`,
      ].join("\n"),
    });

    if (result.error) {
      console.error("Message email alert failed:", result.error);
      return;
    }

    console.log("Message email alert sent:", result.data?.id ?? "sent");
  } catch (error) {
    console.error("Message email alert error:", error);
  }
}

async function findGuruBySlugOrId(guruSlugOrId: string) {
  const directBySlug = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, slug, full_name, display_name, email")
    .eq("slug", guruSlugOrId)
    .maybeSingle<GuruLookupRow>();

  if (!directBySlug.error && directBySlug.data) {
    return directBySlug.data;
  }

  const directById = await supabaseAdmin
    .from("gurus")
    .select("id, user_id, slug, full_name, display_name, email")
    .eq("id", guruSlugOrId)
    .maybeSingle<GuruLookupRow>();

  if (!directById.error && directById.data) {
    return directById.data;
  }

  const profileBySlug = await supabaseAdmin
    .from("profiles")
    .select("id, slug, full_name, display_name, email")
    .eq("slug", guruSlugOrId)
    .maybeSingle<{
      id?: string | null;
      slug?: string | null;
      full_name?: string | null;
      display_name?: string | null;
      email?: string | null;
    }>();

  if (!profileBySlug.error && profileBySlug.data?.id) {
    return {
      id: profileBySlug.data.id,
      user_id: profileBySlug.data.id,
      slug: profileBySlug.data.slug ?? guruSlugOrId,
      full_name: profileBySlug.data.full_name ?? null,
      display_name: profileBySlug.data.display_name ?? null,
      email: profileBySlug.data.email ?? null,
    } satisfies GuruLookupRow;
  }

  return null;
}

async function findExistingConversationByParticipants(
  userA: string,
  userB: string,
  bookingId: string | null
) {
  const { data: participantRows, error: participantError } = await supabaseAdmin
    .from("conversation_participants")
    .select("conversation_id, user_id, role")
    .in("user_id", [userA, userB]);

  if (participantError) {
    console.error(
      "Existing participant conversation lookup error:",
      participantError.message
    );
    return null;
  }

  const counts = new Map<string, Set<string>>();

  for (const row of (participantRows ?? []) as ConversationParticipantRow[]) {
    const set = counts.get(row.conversation_id) ?? new Set<string>();
    set.add(row.user_id);
    counts.set(row.conversation_id, set);
  }

  const candidateIds = Array.from(counts.entries())
    .filter(([, users]) => users.has(userA) && users.has(userB))
    .map(([conversationId]) => conversationId);

  if (candidateIds.length === 0) {
    return null;
  }

  let query = supabaseAdmin
    .from("conversations")
    .select("id, customer_id, guru_id, booking_id, status, subject")
    .in("id", candidateIds)
    .eq("status", "open")
    .limit(25);

  if (bookingId) {
    query = query.eq("booking_id", bookingId);
  }

  const { data, error } = await query.returns<ConversationRow[]>();

  if (error) {
    console.error("Existing conversation detail lookup error:", error.message);
    return null;
  }

  const exact =
    (data ?? []).find((row) => {
      if (bookingId) {
        return safeString(row.booking_id) === bookingId;
      }
      return true;
    }) ?? null;

  return exact;
}

async function createConversation(params: {
  customerUserId: string;
  guruUserId: string;
  startedByUserId: string;
  bookingId: string | null;
  subject: string | null;
  preview: string | null;
}) {
  const nowIso = new Date().toISOString();

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({
      customer_id: params.customerUserId,
      guru_id: params.guruUserId,
      started_by_user_id: params.startedByUserId,
      booking_id: params.bookingId,
      subject: params.subject,
      status: "open",
      created_at: nowIso,
      updated_at: nowIso,
      last_message_at: params.preview ? nowIso : null,
      last_message_preview: params.preview || null,
    })
    .select("id, customer_id, guru_id, booking_id, status, subject")
    .single<ConversationRow>();

  if (error) {
    throw new Error(error.message || "Unable to create conversation.");
  }

  return data;
}

async function ensureParticipants(
  conversationId: string,
  customerUserId: string,
  guruUserId: string
) {
  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin.from("conversation_participants").upsert(
    [
      {
        conversation_id: conversationId,
        user_id: customerUserId,
        role: "customer",
        created_at: nowIso,
        updated_at: nowIso,
      },
      {
        conversation_id: conversationId,
        user_id: guruUserId,
        role: "guru",
        created_at: nowIso,
        updated_at: nowIso,
      },
    ],
    {
      onConflict: "conversation_id,user_id",
      ignoreDuplicates: false,
    }
  );

  if (error) {
    throw new Error(error.message || "Unable to create conversation participants.");
  }
}

async function insertInitialMessage(params: {
  conversationId: string;
  senderUserId: string;
  recipientUserId: string;
  initialMessage: string | null;
}) {
  const body = safeString(params.initialMessage);
  if (!body) return false;

  const nowIso = new Date().toISOString();

  const { error } = await supabaseAdmin.from("messages").insert({
    conversation_id: params.conversationId,
    sender_id: params.senderUserId,
    recipient_id: params.recipientUserId,
    body,
    content: body,
    created_at: nowIso,
    updated_at: nowIso,
  });

  if (error) {
    throw new Error(error.message || "Unable to create initial message.");
  }

  const { error: updateError } = await supabaseAdmin
    .from("conversations")
    .update({
      last_message_at: nowIso,
      last_message_preview: body.slice(0, 180),
      updated_at: nowIso,
    })
    .eq("id", params.conversationId);

  if (updateError) {
    console.error("Conversation preview update error:", updateError.message);
  }

  return true;
}

async function createGuruNotification(params: {
  guruUserId: string;
  conversationId: string;
  customerDisplayName: string;
  guruDisplayName: string;
  subject: string;
}) {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: params.guruUserId,
    type: "new_message",
    title: `New message from ${params.customerDisplayName || "a customer"}`,
    body: params.subject
      ? params.subject
      : `You have a new message request${
          params.guruDisplayName ? ` for ${params.guruDisplayName}` : ""
        }.`,
    link: buildMessageThreadHref(params.conversationId),
    is_read: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Guru notification insert error:", error.message);
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const guruSlug = safeString(body?.guruSlug);
    const guruId = safeString(body?.guruId);
    const bookingIdRaw = safeString(body?.bookingId);
    const petId = safeString(body?.petId);
    const petName = safeString(body?.petName);
    const subjectRaw = safeString(body?.subject);
    const initialMessage = safeString(body?.initialMessage);

    const guruLookupValue = guruSlug || guruId;

    if (!guruLookupValue) {
      return NextResponse.json({ error: "Missing guru identifier." }, { status: 400 });
    }

    const guru = await findGuruBySlugOrId(guruLookupValue);

    if (!guru?.user_id) {
      return NextResponse.json({ error: "Guru profile not found." }, { status: 404 });
    }

    if (guru.user_id === user.id) {
      return NextResponse.json({ error: "You cannot message yourself." }, { status: 400 });
    }

    const bookingId = bookingIdRaw || null;
    const subject = buildConversationSubject({
      petName: petName || null,
      bookingId,
      subjectRaw: subjectRaw || null,
    });

    const preview = buildPreviewText({
      petName: petName || null,
      initialMessage: initialMessage || null,
    });

    const existingConversation = await findExistingConversationByParticipants(
      user.id,
      guru.user_id,
      bookingId
    );

    let conversationId = existingConversation?.id ?? null;
    let justCreated = false;

    if (!conversationId) {
      const createdConversation = await createConversation({
        customerUserId: user.id,
        guruUserId: guru.user_id,
        startedByUserId: user.id,
        bookingId,
        subject,
        preview,
      });

      conversationId = createdConversation.id;
      justCreated = true;
    }

    await ensureParticipants(conversationId, user.id, guru.user_id);

    let initialMessageInserted = false;

    if (initialMessage && (justCreated || !existingConversation)) {
      initialMessageInserted = await insertInitialMessage({
        conversationId,
        senderUserId: user.id,
        recipientUserId: guru.user_id,
        initialMessage,
      });
    }

    const customerDisplayName =
      safeString(user.user_metadata?.full_name) ||
      safeString(user.user_metadata?.name) ||
      safeString(user.email) ||
      "Customer";

    const guruDisplayName =
      safeString(guru.display_name) ||
      safeString(guru.full_name) ||
      safeString(guru.email) ||
      "Guru";

    await createGuruNotification({
      guruUserId: guru.user_id,
      conversationId,
      customerDisplayName,
      guruDisplayName,
      subject,
    });

    if (initialMessageInserted) {
      await sendAdminNewMessageEmail({
        conversationId,
        customerDisplayName,
        guruDisplayName,
        customerEmail: safeString(user.email),
        guruEmail: safeString(guru.email),
        subject,
        messageBody: initialMessage,
      });
    }

    return NextResponse.json(
      {
        ok: true,
        conversationId,
        petId: petId || null,
        petName: petName || null,
        redirectTo: buildMessageThreadHref(conversationId),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Message start route error:", error);

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to start conversation.",
      },
      { status: 500 }
    );
  }
}