import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

type ContactPayload = {
  fullName?: string;
  email?: string;
  phone?: string;
  topic?: string;
  programInterest?: string;
  message?: string;
  source?: string;
};

function cleanText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizeTopic(value: string) {
  const allowedTopics = new Set([
    "general",
    "pet-parent",
    "guru",
    "programs",
    "partners",
    "investors",
    "press",
    "support",
  ]);

  const normalized = value.trim().toLowerCase();

  return allowedTopics.has(normalized) ? normalized : "general";
}

function getInquiryType(topic: string) {
  if (topic === "pet-parent") return "customer-support";
  if (topic === "guru") return "guru-support";
  if (topic === "programs") return "programs";
  if (topic === "partners") return "partner";
  if (topic === "investors") return "investor";
  if (topic === "press") return "press";
  if (topic === "support") return "support";

  return "general";
}

function buildSubject(topic: string, programInterest: string) {
  const topicLabel = topic
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  if (programInterest) {
    return `Contact Inquiry: ${topicLabel} / ${programInterest}`;
  }

  return `Contact Inquiry: ${topicLabel}`;
}

function createContactRow(payload: Required<ContactPayload>) {
  const topic = normalizeTopic(payload.topic);
  const inquiryType = getInquiryType(topic);
  const subject = buildSubject(topic, payload.programInterest);

  return {
    full_name: payload.fullName,
    name: payload.fullName,
    email: payload.email,
    phone: payload.phone || null,
    topic,
    inquiry_type: inquiryType,
    category: inquiryType,
    program_interest: payload.programInterest || null,
    subject,
    message: payload.message,
    body: payload.message,
    notes: payload.message,
    source: payload.source || "contact-page",
    status: "new",
    created_at: new Date().toISOString(),
  };
}

async function tryInsert(table: string, row: Record<string, unknown>) {
  try {
    const result = await supabaseAdmin.from(table).insert(row).select("id").maybeSingle();

    if (result.error) {
      console.warn(`Contact insert skipped for ${table}:`, result.error);
      return {
        ok: false,
        table,
        id: null,
        error: result.error.message,
      };
    }

    return {
      ok: true,
      table,
      id: result.data?.id || null,
      error: null,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown insert error";

    console.warn(`Contact insert failed for ${table}:`, message);

    return {
      ok: false,
      table,
      id: null,
      error: message,
    };
  }
}

export async function POST(request: Request) {
  let payload: ContactPayload;

  try {
    payload = (await request.json()) as ContactPayload;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body." },
      { status: 400 },
    );
  }

  const fullName = cleanText(payload.fullName);
  const email = cleanText(payload.email).toLowerCase();
  const phone = cleanText(payload.phone);
  const topic = normalizeTopic(cleanText(payload.topic));
  const programInterest = cleanText(payload.programInterest);
  const message = cleanText(payload.message);
  const source = cleanText(payload.source) || "contact-page";

  if (!fullName) {
    return NextResponse.json(
      { error: "Full name is required." },
      { status: 400 },
    );
  }

  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 },
    );
  }

  if (!message) {
    return NextResponse.json(
      { error: "Message is required." },
      { status: 400 },
    );
  }

  const normalizedPayload: Required<ContactPayload> = {
    fullName,
    email,
    phone,
    topic,
    programInterest,
    message,
    source,
  };

  const row = createContactRow(normalizedPayload);

  const contactInsert = await tryInsert("contact_submissions", row);

  if (contactInsert.ok) {
    return NextResponse.json({
      ok: true,
      table: contactInsert.table,
      id: contactInsert.id,
    });
  }

  const fallbackInsert = await tryInsert("network_partner_leads", {
    ...row,
    lead_type: row.inquiry_type,
    company_name: null,
    contact_name: fullName,
  });

  if (fallbackInsert.ok) {
    return NextResponse.json({
      ok: true,
      table: fallbackInsert.table,
      id: fallbackInsert.id,
    });
  }

  const messageFallbackInsert = await tryInsert("messages", {
    sender_id: null,
    recipient_id: null,
    conversation_id: null,
    content: message,
    body: message,
    message_type: row.inquiry_type,
    topic: row.subject,
    status: "new",
    is_read: false,
    created_at: new Date().toISOString(),
  });

  if (messageFallbackInsert.ok) {
    return NextResponse.json({
      ok: true,
      table: messageFallbackInsert.table,
      id: messageFallbackInsert.id,
    });
  }

  return NextResponse.json(
    {
      error:
        "Unable to save contact message. Please check that contact_submissions, network_partner_leads, or messages exists in Supabase.",
    },
    { status: 500 },
  );
}