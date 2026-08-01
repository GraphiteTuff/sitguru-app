/**
 * GET /api/search/gurus?petId=...
 * Public Guru search with optional pet compatibility ranking.
 */

import { NextRequest, NextResponse } from "next/server";
import { CANONICAL_PET_SELECT, normalizeCanonicalPet } from "@/lib/pets/canonical";
import {
  rankGurusForPet,
  type MatchGuruCandidate,
  type MatchPetProfile,
} from "@/lib/search/matching-engine";
import { supabaseAdmin } from "@/utils/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type AnyRow = Record<string, unknown>;

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getOrigin(req: NextRequest) {
  const proto = req.headers.get("x-forwarded-proto") || "https";
  const host =
    req.headers.get("x-forwarded-host") ||
    req.headers.get("host") ||
    "localhost:3000";
  return `${proto}://${host}`.replace(/\/+$/, "");
}

async function loadPetProfile(petId: string): Promise<MatchPetProfile | null> {
  const { data, error } = await supabaseAdmin
    .from("pets")
    .select(CANONICAL_PET_SELECT)
    .eq("id", petId)
    .maybeSingle();

  if (error || !data) {
    console.warn("[search/gurus] pet load skipped:", error?.message);
    return null;
  }

  const row = data as unknown as AnyRow;
  const pet = normalizeCanonicalPet(row);
  if (!pet?.id) return null;

  return {
    id: pet.id,
    name: pet.name,
    breed: pet.breed,
    energy_level: pet.energy_level,
    medical_notes: pet.medical_notes,
    allergies: pet.allergies,
    medical_conditions: pet.medical_conditions,
    medications: clean(row.medications),
  };
}

async function loadBreedHistoryByGuru(
  guruIds: string[],
): Promise<Record<string, string[]>> {
  const history: Record<string, string[]> = {};
  if (guruIds.length === 0) return history;

  try {
    const { data, error } = await supabaseAdmin
      .from("bookings")
      .select("guru_id, sitter_id, provider_id, pet_breed, breed")
      .limit(1000);

    if (error || !data) {
      console.warn("[search/gurus] breed history skipped:", error?.message);
      return history;
    }

    const idSet = new Set(guruIds);
    for (const row of data as AnyRow[]) {
      const guruId =
        clean(row.guru_id) || clean(row.sitter_id) || clean(row.provider_id);
      if (!guruId || !idSet.has(guruId)) continue;
      const breed = clean(row.pet_breed) || clean(row.breed);
      if (!breed) continue;
      history[guruId] = [...new Set([...(history[guruId] || []), breed])];
    }
  } catch (error) {
    console.warn("[search/gurus] breed history soft-failed:", error);
  }

  return history;
}

async function loadPublicGurus(req: NextRequest) {
  const origin = getOrigin(req);
  const cookie = req.headers.get("cookie") || "";
  const url = new URL("/api/gurus/public-search", origin);

  // Forward useful location filters if present
  const zip = req.nextUrl.searchParams.get("zip");
  const city = req.nextUrl.searchParams.get("city");
  const state = req.nextUrl.searchParams.get("state");
  const q = req.nextUrl.searchParams.get("q");
  if (zip) url.searchParams.set("zip", zip);
  if (city) url.searchParams.set("city", city);
  if (state) url.searchParams.set("state", state);
  if (q) url.searchParams.set("q", q);

  const response = await fetch(url.toString(), {
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Public Guru search failed (${response.status})`);
  }

  const payload = (await response.json()) as { gurus?: AnyRow[] };
  return Array.isArray(payload.gurus) ? payload.gurus : [];
}

export async function GET(req: NextRequest) {
  try {
    const petId = clean(req.nextUrl.searchParams.get("petId"));
    let gurus = await loadPublicGurus(req);

    // Cap scoring set for responsiveness while covering active marketplace
    if (gurus.length > 120) {
      gurus = gurus.slice(0, 120);
    }

    if (!petId) {
      return NextResponse.json({
        ok: true,
        pet: null,
        gurus: gurus.map((guru) => ({
          ...guru,
          match_score: null,
          match_headline: null,
          match_reasons: [],
        })),
        ranked: false,
      });
    }

    const pet = await loadPetProfile(petId);
    if (!pet) {
      return NextResponse.json(
        {
          ok: false,
          error: "Pet profile not found for matching.",
          gurus,
          ranked: false,
        },
        { status: 404 },
      );
    }

    const guruIds = Array.from(
      new Set(
        gurus
          .map((guru) => clean(guru.id))
          .filter(Boolean),
      ),
    );
    const breedHistory = await loadBreedHistoryByGuru(guruIds);

    const candidates: MatchGuruCandidate[] = gurus.map((guru) => {
      const id = clean(guru.id);
      return {
        ...guru,
        id,
        pastBreeds: breedHistory[id] || [],
      };
    });

    const ranked = rankGurusForPet(pet, candidates);

    return NextResponse.json({
      ok: true,
      pet: {
        id: pet.id,
        name: pet.name,
        breed: pet.breed,
        energy_level: pet.energy_level,
      },
      gurus: ranked,
      ranked: true,
      scoring: {
        energy_max: 30,
        medical_max: 40,
        breed_max: 20,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Guru search matching failed.";
    console.error("[search/gurus]", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
