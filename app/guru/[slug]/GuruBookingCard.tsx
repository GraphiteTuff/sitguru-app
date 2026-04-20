"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

type GuruBookingCardProps = {
  guruId: string;
  guruSlug: string;
  guruName: string;
  hourlyRate?: number | null;
  serviceLabel?: string | null;
};

type PetRow = {
  id?: string | number | null;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  age?: string | null;
  weight?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  image_url?: string | null;
};

type CustomerPet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  weight: string | null;
  notes: string | null;
  photoUrl: string | null;
};

function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizePet(row: PetRow): CustomerPet {
  return {
    id: String(row.id ?? ""),
    name: cleanString(row.name) || "Pet",
    species: cleanString(row.species) || null,
    breed: cleanString(row.breed) || null,
    age: cleanString(row.age) || null,
    weight: cleanString(row.weight) || null,
    notes: cleanString(row.notes) || null,
    photoUrl: cleanString(row.photo_url) || cleanString(row.image_url) || null,
  };
}

async function fetchCustomerPets(userId: string) {
  const attempts = [
    { matchColumn: "owner_id" },
    { matchColumn: "user_id" },
    { matchColumn: "owner_profile_id" },
  ];

  for (const attempt of attempts) {
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq(attempt.matchColumn, userId);

    if (!error && Array.isArray(data)) {
      return data
        .map((row) => normalizePet(row as PetRow))
        .filter((pet) => pet.id);
    }
  }

  return [] as CustomerPet[];
}

function formatRate(hourlyRate?: number | null) {
  if (typeof hourlyRate !== "number" || Number.isNaN(hourlyRate)) {
    return "Ask Guru";
  }

  return `$${hourlyRate}/hr`;
}

function PetAvatar({
  pet,
  selected,
}: {
  pet: CustomerPet;
  selected: boolean;
}) {
  if (pet.photoUrl) {
    return (
      <div
        className={`h-16 w-16 overflow-hidden rounded-2xl border ${
          selected ? "border-emerald-400" : "border-slate-200"
        } bg-white`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={pet.photoUrl}
          alt={pet.name}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-xl font-black ${
        selected
          ? "border-emerald-400 bg-emerald-50 text-emerald-700"
          : "border-slate-200 bg-slate-50 text-slate-500"
      }`}
    >
      {pet.name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function GuruBookingCard({
  guruId,
  guruSlug,
  guruName,
  hourlyRate,
  serviceLabel,
}: GuruBookingCardProps) {
  const [pets, setPets] = useState<CustomerPet[]>([]);
  const [loadingPets, setLoadingPets] = useState(true);
  const [selectedPetId, setSelectedPetId] = useState("");
  const [manualPetName, setManualPetName] = useState("");

  useEffect(() => {
    let active = true;

    async function loadPets() {
      setLoadingPets(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (active) {
          setPets([]);
          setLoadingPets(false);
        }
        return;
      }

      const customerPets = await fetchCustomerPets(user.id);

      if (!active) return;

      setPets(customerPets);

      if (customerPets.length === 1) {
        setSelectedPetId(customerPets[0].id);
      }

      setLoadingPets(false);
    }

    loadPets();

    return () => {
      active = false;
    };
  }, []);

  const selectedPet = pets.find((pet) => pet.id === selectedPetId) ?? null;

  const resolvedPetName = selectedPet?.name || manualPetName.trim() || "";
  const resolvedPetPhotoUrl = selectedPet?.photoUrl || "";
  const resolvedPetId = selectedPet?.id || "";
  const canContinue =
    pets.length > 0 ? Boolean(selectedPet) : Boolean(manualPetName.trim());

  const bookingHref = useMemo(() => {
    const params = new URLSearchParams({
      guru_slug: guruSlug,
      guru_id: guruId,
    });

    if (resolvedPetId) {
      params.set("pet_id", resolvedPetId);
    }

    if (resolvedPetName) {
      params.set("pet_name", resolvedPetName);
    }

    if (resolvedPetPhotoUrl) {
      params.set("pet_photo_url", resolvedPetPhotoUrl);
    }

    return `/bookings/new?${params.toString()}`;
  }, [guruId, guruSlug, resolvedPetId, resolvedPetName, resolvedPetPhotoUrl]);

  const messageGuruHref = useMemo(() => {
    const params = new URLSearchParams({
      guru: guruSlug,
    });

    if (resolvedPetId) {
      params.set("pet", resolvedPetId);
    }

    if (resolvedPetName) {
      params.set("petName", resolvedPetName);
      params.set(
        "message",
        `Hi ${guruName}, I would like to talk about care for ${resolvedPetName}.`
      );
    }

    return `/messages/new?${params.toString()}`;
  }, [guruName, guruSlug, resolvedPetId, resolvedPetName]);

  const messageAdminHref = useMemo(() => {
    const params = new URLSearchParams();

    if (resolvedPetId) {
      params.set("pet", resolvedPetId);
    }

    if (resolvedPetName) {
      params.set("petName", resolvedPetName);
    }

    return `/messages/admin?${params.toString()}`;
  }, [resolvedPetId, resolvedPetName]);

  return (
    <aside className="rounded-[28px] border border-white/10 bg-white/95 p-6 text-slate-900 shadow-[0_24px_80px_rgba(15,23,42,0.22)] backdrop-blur md:p-7">
      <div className="space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-700">
            Book this Guru
          </p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-slate-950">
            Request care with {guruName}
          </h2>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            Start with your pet profile so your booking and messages stay clear,
            organized, and easy for this Guru to understand.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Service
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">
                {serviceLabel || "General care"}
              </p>
            </div>

            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                Starting at
              </p>
              <p className="mt-2 text-base font-bold text-slate-900">
                {formatRate(hourlyRate)}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-bold text-slate-900">Best booking flow</p>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Choose the pet first, then continue into booking or messaging. That
            gives your Guru better context from the start.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="block text-sm font-semibold text-slate-800">
              Select your pet
            </label>

            <Link
              href="/customer/dashboard"
              className="text-xs font-semibold text-emerald-700 transition hover:text-emerald-600"
            >
              Manage My Pets
            </Link>
          </div>

          {loadingPets ? (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-semibold text-slate-600">
              Loading your saved pets...
            </div>
          ) : pets.length > 0 ? (
            <div className="grid gap-3">
              {pets.map((pet) => {
                const selected = pet.id === selectedPetId;

                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => setSelectedPetId(pet.id)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selected
                        ? "border-emerald-400 bg-emerald-50 shadow-sm"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <PetAvatar pet={pet} selected={selected} />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-black text-slate-950">
                            {pet.name}
                          </span>

                          {pet.species ? (
                            <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-200">
                              {pet.species}
                            </span>
                          ) : null}
                        </div>

                        <p className="mt-1 text-sm text-slate-600">
                          {[pet.breed, pet.age, pet.weight]
                            .filter(Boolean)
                            .join(" • ") || "Pet profile ready to send with booking"}
                        </p>
                      </div>

                      <div
                        className={`h-5 w-5 rounded-full border-2 ${
                          selected
                            ? "border-emerald-500 bg-emerald-500"
                            : "border-slate-300 bg-white"
                        }`}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm font-semibold leading-6 text-amber-800">
                No saved pets were found yet. Add one in My Pets or enter a pet
                name below as a temporary fallback so you can still continue.
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="pet-name"
                  className="block text-sm font-semibold text-slate-800"
                >
                  Pet name
                </label>

                <input
                  id="pet-name"
                  type="text"
                  value={manualPetName}
                  onChange={(e) => setManualPetName(e.target.value)}
                  placeholder="Enter pet name"
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3.5 text-base font-semibold text-slate-950 placeholder:text-slate-400 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                />
              </div>
            </div>
          )}

          <p className="text-xs leading-5 text-slate-500">
            The selected pet is carried into booking and messaging so care stays
            tied to the right animal from the start.
          </p>
        </div>

        {resolvedPetName ? (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
              Selected pet
            </p>

            <div className="mt-3 flex items-center gap-4">
              {resolvedPetPhotoUrl ? (
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resolvedPetPhotoUrl}
                    alt={resolvedPetName}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-200 bg-white text-lg font-black text-slate-700">
                  {resolvedPetName.charAt(0).toUpperCase()}
                </div>
              )}

              <div className="min-w-0">
                <p className="text-base font-black text-slate-950">
                  {resolvedPetName}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  This pet will be included with your booking request and
                  conversation context.
                </p>
              </div>
            </div>
          </div>
        ) : null}

        <div className="grid gap-3">
          <Link
            href={canContinue ? bookingHref : "/customer/dashboard"}
            aria-disabled={!canContinue}
            className={`inline-flex min-h-[56px] items-center justify-center rounded-2xl px-5 py-3 text-base font-black transition ${
              canContinue
                ? "bg-slate-950 text-white hover:bg-slate-800"
                : "pointer-events-none bg-slate-200 text-slate-500"
            }`}
          >
            {canContinue ? "Continue to booking" : "Select a pet to continue"}
          </Link>

          <Link
            href={canContinue ? messageGuruHref : "/messages"}
            aria-disabled={!canContinue}
            className={`inline-flex min-h-[52px] items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold transition ${
              canContinue
                ? "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50"
                : "pointer-events-none border border-slate-200 bg-slate-100 text-slate-400"
            }`}
          >
            Message Guru first
          </Link>

          <Link
            href={messageAdminHref}
            className="inline-flex min-h-[52px] items-center justify-center rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50"
          >
            Message Admin for help
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <p className="text-sm font-bold text-slate-900">What happens next</p>

          <div className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
            <p>1. Choose the pet that needs care.</p>
            <p>2. Continue to booking or message the Guru first.</p>
            <p>3. SitGuru carries your pet context forward so communication stays clear.</p>
          </div>
        </div>
      </div>
    </aside>
  );
}