import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function safeString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeInterestType(value: string) {
  if (value === "customer" || value === "guru" || value === "both") {
    return value;
  }

  return "customer";
}

function normalizeSource(value: string) {
  const normalized = value.toLowerCase();

  if (!normalized) return "direct";
  if (normalized.length > 50) return normalized.slice(0, 50);

  return normalized;
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeLimit(value: string) {
  const parsed = Number.parseInt(value, 10);

  if (Number.isNaN(parsed) || parsed <= 0) return 25;
  if (parsed > 200) return 200;

  return parsed;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const interestType = safeString(searchParams.get("interestType"));
    const source = safeString(searchParams.get("source")).toLowerCase();
    const search = safeString(searchParams.get("search"));
    const limit = normalizeLimit(safeString(searchParams.get("limit")));

    let query = supabaseAdmin
      .from("launch_waitlist")
      .select(
        `
          id,
          full_name,
          email,
          phone,
          zip_code,
          interest_type,
          pet_types,
          services_offered,
          notes,
          source,
          created_at
        `
      )
      .order("created_at", { ascending: false })
      .limit(limit);

    if (
      interestType &&
      (interestType === "customer" ||
        interestType === "guru" ||
        interestType === "both")
    ) {
      query = query.eq("interest_type", interestType);
    }

    if (source) {
      query = query.eq("source", source);
    }

    if (search) {
      query = query.or(
        [
          `full_name.ilike.%${search}%`,
          `email.ilike.%${search}%`,
          `zip_code.ilike.%${search}%`,
          `notes.ilike.%${search}%`,
          `pet_types.ilike.%${search}%`,
          `services_offered.ilike.%${search}%`,
        ].join(",")
      );
    }

    const { data, error } = await query;

    if (error) {
      console.error("launch_waitlist fetch error:", error);

      return NextResponse.json(
        { error: "Unable to load launch signups right now." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      signups: data || [],
    });
  } catch (error) {
    console.error("launch signup GET route error:", error);

    return NextResponse.json(
      { error: "Something went wrong while loading launch signups." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    const fullName = safeString(body?.fullName);
    const email = safeString(body?.email).toLowerCase();
    const phone = safeString(body?.phone);
    const zipCode = safeString(body?.zipCode);
    const interestType = normalizeInterestType(safeString(body?.interestType));
    const petTypes = safeString(body?.petTypes);
    const servicesOffered = safeString(body?.servicesOffered);
    const notes = safeString(body?.notes);
    const source = normalizeSource(safeString(body?.source));

    if (!fullName || !email) {
      return NextResponse.json(
        { error: "Full name and email are required." },
        { status: 400 }
      );
    }

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin.from("launch_waitlist").insert({
      full_name: fullName,
      email,
      phone: phone || null,
      zip_code: zipCode || null,
      interest_type: interestType,
      pet_types: petTypes || null,
      services_offered: servicesOffered || null,
      notes: notes || null,
      source,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "This email is already on the launch list." },
          { status: 409 }
        );
      }

      console.error("launch_waitlist insert error:", error);

      return NextResponse.json(
        { error: "Unable to save your signup right now." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Successfully added to the SitGuru launch list.",
    });
  } catch (error) {
    console.error("launch signup route error:", error);

    return NextResponse.json(
      { error: "Something went wrong while processing your request." },
      { status: 500 }
    );
  }
}