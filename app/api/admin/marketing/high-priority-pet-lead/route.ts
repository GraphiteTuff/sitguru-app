import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { notifyHighPriorityPetLeadSignup } from "@/lib/marketing/notify-high-priority-lead";
import type {
  MarketingLeadInput,
  MarketingLeadPetInput,
} from "@/lib/marketing/high-priority-pet-leads";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * CRM / database webhook receiver for admin_marketing_signup_lead_pets inserts.
 *
 * Auth: Bearer MARKETING_LEAD_WEBHOOK_SECRET (or ADMIN_INTERNAL_API_SECRET).
 * Body shapes accepted:
 *  - { signup_lead_id, pets?: [...] }
 *  - { record: { signup_lead_id, ...pet fields } }  (Supabase DB webhook style)
 *  - { type, record, table }                         (Supabase Database Webhooks)
 */
function getSecret() {
  return (
    String(process.env.MARKETING_LEAD_WEBHOOK_SECRET || "").trim() ||
    String(process.env.ADMIN_INTERNAL_API_SECRET || "").trim() ||
    String(process.env.CRON_SECRET || "").trim()
  );
}

function authorize(request: NextRequest) {
  const secret = getSecret();
  if (!secret) return true; // allow in soft-config; prefer setting a secret in prod

  const header = request.headers.get("authorization") || "";
  const bearer = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : "";
  const querySecret = request.nextUrl.searchParams.get("secret") || "";
  return bearer === secret || querySecret === secret;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function petFromRow(row: Record<string, unknown>): MarketingLeadPetInput {
  return {
    pet_order:
      typeof row.pet_order === "number"
        ? row.pet_order
        : Number(row.pet_order) || null,
    pet_name: asText(row.pet_name) || null,
    pet_type: asText(row.pet_type) || null,
    pet_breed: asText(row.pet_breed) || null,
    pet_birthday_month: asText(row.pet_birthday_month) || null,
    pet_birthday_year: asText(row.pet_birthday_year) || null,
    pet_notes: asText(row.pet_notes) || null,
  };
}

export async function POST(request: NextRequest) {
  if (!authorize(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const record = asRecord(body.record) || asRecord(body);
  const signupLeadId =
    asText(body.signup_lead_id) ||
    asText(body.signupLeadId) ||
    asText(record?.signup_lead_id) ||
    "";

  if (!signupLeadId) {
    return NextResponse.json(
      { error: "signup_lead_id is required" },
      { status: 400 },
    );
  }

  const { data: leadRow, error: leadError } = await supabaseAdmin
    .from("admin_marketing_signup_leads")
    .select(
      "id, full_name, first_name, last_name, email, phone, city, state, zip_code, market_area, lead_type, relationship_category, priority_level, referral_potential, ceo_priority, campaign_source, growth_channel, notes",
    )
    .eq("id", signupLeadId)
    .maybeSingle();

  if (leadError || !leadRow) {
    return NextResponse.json(
      { error: leadError?.message || "Signup lead not found" },
      { status: 404 },
    );
  }

  let pets: MarketingLeadPetInput[] = [];

  if (Array.isArray(body.pets)) {
    pets = body.pets
      .map((row) => asRecord(row))
      .filter((row): row is Record<string, unknown> => Boolean(row))
      .map(petFromRow);
  } else if (record && asText(record.pet_type || record.pet_name || record.pet_breed)) {
    pets = [petFromRow(record)];
  } else {
    const { data: petRows } = await supabaseAdmin
      .from("admin_marketing_signup_lead_pets")
      .select(
        "pet_order, pet_name, pet_type, pet_breed, pet_birthday_month, pet_birthday_year, pet_notes",
      )
      .eq("signup_lead_id", signupLeadId)
      .order("pet_order", { ascending: true });

    pets = ((petRows || []) as Record<string, unknown>[]).map(petFromRow);
  }

  const result = await notifyHighPriorityPetLeadSignup({
    leadId: signupLeadId,
    lead: leadRow as MarketingLeadInput,
    pets,
  });

  return NextResponse.json({
    success: true,
    ...result,
  });
}
