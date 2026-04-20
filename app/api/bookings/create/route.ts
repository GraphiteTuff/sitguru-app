import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";

type GenericRow = Record<string, any>;

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function firstNonEmpty(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanString(value);
    if (cleaned) return cleaned;
  }
  return "";
}

function normalizeText(value: unknown) {
  return cleanString(value).toLowerCase();
}

function titleFromSlug(value: string) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function normalizeBookingDate(value: string) {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    return trimmed;
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getHourlyAmount(guru: GenericRow) {
  const raw =
    guru.hourly_rate ??
    guru.rate ??
    guru.price ??
    guru.starting_rate ??
    25;

  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 25;
}

async function findFirstExact(
  table: string,
  column: string,
  value: string
): Promise<GenericRow | null> {
  if (!value) return null;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .eq(column, value)
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as GenericRow;
}

async function findFirstInsensitive(
  table: string,
  column: string,
  value: string
): Promise<GenericRow | null> {
  if (!value) return null;

  const { data, error } = await supabaseAdmin
    .from(table)
    .select("*")
    .ilike(column, value)
    .limit(10);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as GenericRow;
}

async function findGuru({
  guruId,
  guruSlug,
}: {
  guruId: string;
  guruSlug: string;
}): Promise<GenericRow | null> {
  if (guruId) {
    const exactAttempts = [
      await findFirstExact("gurus", "id", guruId),
      await findFirstExact("gurus", "profile_id", guruId),
      await findFirstExact("gurus", "user_id", guruId),
    ];

    for (const attempt of exactAttempts) {
      if (attempt) return attempt;
    }
  }

  if (guruSlug) {
    const prettyName = titleFromSlug(guruSlug);

    const slugMatch = await findFirstExact("gurus", "slug", guruSlug);
    if (slugMatch) return slugMatch;

    const fuzzyAttempts = [
      await findFirstInsensitive("gurus", "display_name", prettyName),
      await findFirstInsensitive("gurus", "full_name", prettyName),
      await findFirstInsensitive("gurus", "public_name", prettyName),
      await findFirstInsensitive("gurus", "business_name", prettyName),
    ];

    for (const attempt of fuzzyAttempts) {
      if (attempt) return attempt;
    }
  }

  return null;
}

async function getCustomerProfile(userId: string): Promise<GenericRow | null> {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .limit(1);

  if (error || !data || data.length === 0) {
    return null;
  }

  return data[0] as GenericRow;
}

async function findMatchingPet({
  explicitPetId,
  petName,
  userId,
  profileId,
}: {
  explicitPetId: string;
  petName: string;
  userId: string;
  profileId: string;
}): Promise<GenericRow | null> {
  if (explicitPetId) {
    const exactById = await findFirstExact("pets", "id", explicitPetId);
    if (exactById) {
      return exactById;
    }
  }

  if (!petName) return null;

  const normalizedPetName = normalizeText(petName);
  const candidates: GenericRow[] = [];
  const queries: Array<Promise<{ data: GenericRow[] | null; error: any }>> = [];

  if (userId) {
    queries.push(
      supabaseAdmin
        .from("pets")
        .select("*")
        .eq("owner_id", userId)
        .ilike("name", petName)
        .limit(20)
    );

    queries.push(
      supabaseAdmin
        .from("pets")
        .select("*")
        .eq("owner_id", userId)
        .limit(50)
    );
  }

  if (profileId) {
    queries.push(
      supabaseAdmin
        .from("pets")
        .select("*")
        .eq("owner_profile_id", profileId)
        .ilike("name", petName)
        .limit(20)
    );

    queries.push(
      supabaseAdmin
        .from("pets")
        .select("*")
        .eq("owner_profile_id", profileId)
        .limit(50)
    );
  }

  const results = await Promise.all(queries);

  for (const result of results) {
    if (!result.error && result.data?.length) {
      for (const row of result.data) {
        candidates.push(row);
      }
    }
  }

  const uniqueById = new Map<string, GenericRow>();
  for (const row of candidates) {
    const id = String(row.id ?? "");
    if (id && !uniqueById.has(id)) {
      uniqueById.set(id, row);
    }
  }

  const uniqueCandidates = Array.from(uniqueById.values());

  const exactNameMatch =
    uniqueCandidates.find(
      (row) => normalizeText(row.name) === normalizedPetName
    ) || null;

  if (exactNameMatch) return exactNameMatch;

  const looseNameMatch =
    uniqueCandidates.find((row) =>
      normalizeText(row.name).includes(normalizedPetName)
    ) || null;

  if (looseNameMatch) return looseNameMatch;

  return uniqueCandidates[0] || null;
}

async function findLatestPetPhotoUrl(petId?: string | null) {
  if (!petId) return null;

  const { data, error } = await supabaseAdmin
    .from("pet_media")
    .select("*")
    .eq("pet_id", petId)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error || !data?.length) {
    return null;
  }

  const publicImage =
    data.find(
      (row) =>
        normalizeText(row.visibility) === "public" &&
        normalizeText(row.file_type).includes("image")
    ) ||
    data.find((row) => normalizeText(row.file_type).includes("image")) ||
    null;

  return publicImage?.file_url ? String(publicImage.file_url) : null;
}

async function fetchBookingById(id: string): Promise<GenericRow | null> {
  if (!id) return null;

  const { data, error } = await supabaseAdmin
    .from("bookings")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as GenericRow;
}

async function findRecentlyInsertedBooking(payload: Record<string, any>) {
  let query: any = supabaseAdmin.from("bookings").select("*");

  if (payload.sitter_id) {
    query = query.eq("sitter_id", payload.sitter_id);
  }

  if (payload.customer_id) {
    query = query.eq("customer_id", payload.customer_id);
  }

  if (payload.pet_id) {
    query = query.eq("pet_id", payload.pet_id);
  }

  if (payload.pet_name) {
    query = query.ilike("pet_name", payload.pet_name);
  }

  if (payload.service) {
    query = query.ilike("service", payload.service);
  }

  if (payload.booking_date) {
    query = query.eq("booking_date", payload.booking_date);
  }

  const { data, error } = await query
    .order("created_at", { ascending: false })
    .limit(1);

  if (error || !data?.length) {
    return null;
  }

  return data[0] as GenericRow;
}

async function insertBookingWithFallback(payloads: Record<string, any>[]) {
  let lastError = "Failed to create booking";

  for (const payload of payloads) {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .insert(payload)
      .select("id")
      .maybeSingle();

    if (!error) {
      const insertedId = cleanString(data?.id);

      if (insertedId) {
        const fullBooking = await fetchBookingById(insertedId);
        return {
          data: fullBooking ?? ({ id: insertedId, ...payload } as GenericRow),
          error: null as string | null,
        };
      }

      const recentBooking = await findRecentlyInsertedBooking(payload);

      return {
        data: recentBooking ?? (payload as GenericRow),
        error: null as string | null,
      };
    }

    lastError = error?.message || lastError;
    console.error("Booking insert attempt failed:", error?.message || error);
  }

  return { data: null, error: lastError };
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => null);

    const guruId = firstNonEmpty(body?.guru_id, body?.guruId);
    const guruSlug = firstNonEmpty(body?.guru_slug, body?.guruSlug);

    const explicitPetId = firstNonEmpty(body?.pet_id, body?.petId);
    const forwardedPetName = firstNonEmpty(body?.pet_name, body?.petName);
    const forwardedPetPhotoUrl = firstNonEmpty(
      body?.pet_photo_url,
      body?.petPhotoUrl
    );

    const rawDate = firstNonEmpty(body?.date, body?.booking_date);
    const service = firstNonEmpty(
      body?.service,
      body?.service_name,
      body?.serviceName,
      "General care"
    );
    const notes = firstNonEmpty(body?.notes, body?.care_notes);

    if (!guruId && !guruSlug) {
      return NextResponse.json(
        { error: "Guru selection is required" },
        { status: 400 }
      );
    }

    if (!forwardedPetName) {
      return NextResponse.json(
        { error: "Pet name is required" },
        { status: 400 }
      );
    }

    if (!rawDate) {
      return NextResponse.json(
        { error: "Date is required" },
        { status: 400 }
      );
    }

    const bookingDate = normalizeBookingDate(rawDate);
    const guru = await findGuru({ guruId, guruSlug });

    if (!guru) {
      return NextResponse.json({ error: "Guru not found" }, { status: 404 });
    }

    if (guru.id == null) {
      return NextResponse.json(
        { error: "Guru record is missing its database id." },
        { status: 500 }
      );
    }

    const customerProfile = await getCustomerProfile(user.id);

    const customerName =
      firstNonEmpty(
        customerProfile?.full_name,
        [customerProfile?.first_name, customerProfile?.last_name]
          .filter(Boolean)
          .join(" "),
        user.user_metadata?.full_name,
        user.user_metadata?.name,
        user.email?.split("@")[0]
      ) || "Customer";

    const customerPhone = firstNonEmpty(
      customerProfile?.phone,
      customerProfile?.phone_number,
      customerProfile?.mobile
    );

    const customerCity = firstNonEmpty(customerProfile?.city);
    const customerState = firstNonEmpty(
      customerProfile?.state,
      customerProfile?.state_code
    );

    const resolvedGuruSlug = firstNonEmpty(guru.slug, guruSlug) || null;

    const guruName =
      firstNonEmpty(
        guru.display_name,
        guru.full_name,
        guru.public_name,
        guru.business_name,
        titleFromSlug(resolvedGuruSlug || "")
      ) || "Guru";

    const totalAmount = getHourlyAmount(guru);
    const sitterId = guru.id;

    const matchedPet = await findMatchingPet({
      explicitPetId,
      petName: forwardedPetName,
      userId: user.id,
      profileId: String(customerProfile?.id || user.id),
    });

    const resolvedPetId = firstNonEmpty(matchedPet?.id, explicitPetId) || null;
    const resolvedPetName =
      firstNonEmpty(matchedPet?.name, forwardedPetName) || forwardedPetName;

    const resolvedPetType = firstNonEmpty(
      body?.pet_type,
      body?.petType,
      matchedPet?.species,
      matchedPet?.pet_type
    );

    const resolvedBreed = firstNonEmpty(
      body?.breed,
      body?.pet_breed,
      body?.petBreed,
      matchedPet?.breed
    );

    const resolvedPetPhotoUrl =
      forwardedPetPhotoUrl ||
      (await findLatestPetPhotoUrl(resolvedPetId)) ||
      null;

    const payloadA = {
      sitter_id: sitterId,
      customer_id: user.id,
      pet_id: resolvedPetId,
      pet_photo_url: resolvedPetPhotoUrl,
      guru_slug: resolvedGuruSlug,
      guru_name: guruName,
      assigned_guru_name: guruName,
      customer_name: customerName,
      customer_email: user.email ?? null,
      customer_phone: customerPhone || null,
      pet_name: resolvedPetName,
      pet_type: resolvedPetType || null,
      breed: resolvedBreed || null,
      service,
      service_type: service,
      booking_type: service,
      notes: notes || null,
      address: null,
      city: customerCity || null,
      state: customerState || null,
      booking_date: bookingDate,
      status: "pending",
      payment_status: "unpaid",
      total_amount: totalAmount,
      price: totalAmount,
      amount: totalAmount,
    };

    const payloadB = {
      sitter_id: sitterId,
      customer_id: user.id,
      pet_id: resolvedPetId,
      pet_photo_url: resolvedPetPhotoUrl,
      guru_slug: resolvedGuruSlug,
      guru_name: guruName,
      customer_name: customerName,
      customer_email: user.email ?? null,
      customer_phone: customerPhone || null,
      pet_name: resolvedPetName,
      pet_type: resolvedPetType || null,
      breed: resolvedBreed || null,
      service,
      notes: notes || null,
      booking_date: bookingDate,
      status: "pending",
      payment_status: "unpaid",
      total_amount: totalAmount,
      price: totalAmount,
    };

    const payloadC = {
      sitter_id: sitterId,
      customer_id: user.id,
      pet_id: resolvedPetId,
      pet_photo_url: resolvedPetPhotoUrl,
      customer_name: customerName,
      customer_email: user.email ?? null,
      pet_name: resolvedPetName,
      pet_type: resolvedPetType || null,
      breed: resolvedBreed || null,
      service,
      notes: notes || null,
      booking_date: bookingDate,
      status: "pending",
      payment_status: "unpaid",
      price: totalAmount,
    };

    const payloadD = {
      sitter_id: sitterId,
      pet_id: resolvedPetId,
      pet_photo_url: resolvedPetPhotoUrl,
      pet_name: resolvedPetName,
      pet_type: resolvedPetType || null,
      breed: resolvedBreed || null,
      service,
      notes: notes || null,
      booking_date: bookingDate,
      status: "pending",
      payment_status: "unpaid",
    };

    const payloadE = {
      sitter_id: sitterId,
      pet_name: resolvedPetName,
      service,
      booking_date: bookingDate,
      status: "pending",
      payment_status: "unpaid",
    };

    const { data: booking, error: bookingError } =
      await insertBookingWithFallback([
        payloadA,
        payloadB,
        payloadC,
        payloadD,
        payloadE,
      ]);

    if (bookingError || !booking) {
      console.error("Booking insert failed:", bookingError);
      return NextResponse.json(
        { error: bookingError || "Failed to create booking" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      bookingId: booking.id ?? null,
      booking,
    });
  } catch (error) {
    console.error("Booking create route error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create booking",
      },
      { status: 500 }
    );
  }
}