"use client";

/**
 * Admin filter panel for canonical pet columns (species, size, breed, medical_notes).
 * Prefer structured attributes over free-text parsing.
 */

import { useMemo, useState } from "react";
import { Filter, PawPrint } from "lucide-react";
import {
  hasMedicalFlag,
  normalizeCanonicalPet,
  petMatchesAdminFilters,
  type CanonicalPet,
} from "@/lib/pets/canonical";

type Props = {
  pets: Record<string, unknown>[];
  title?: string;
};

export default function PetCanonicalFilters({
  pets,
  title = "Canonical pet attribute filters",
}: Props) {
  const [species, setSpecies] = useState("");
  const [size, setSize] = useState("");
  const [breed, setBreed] = useState("");
  const [medicalOnly, setMedicalOnly] = useState(false);

  const normalized = useMemo(
    () =>
      pets
        .map((row) => normalizeCanonicalPet(row))
        .filter((pet): pet is CanonicalPet => Boolean(pet)),
    [pets],
  );

  const speciesOptions = useMemo(() => {
    const set = new Set(
      normalized.map((p) => p.species).filter((v): v is string => Boolean(v)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [normalized]);

  const sizeOptions = useMemo(() => {
    const set = new Set(
      normalized.map((p) => p.size).filter((v): v is string => Boolean(v)),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [normalized]);

  const filtered = useMemo(
    () =>
      normalized.filter((pet) =>
        petMatchesAdminFilters(pet, {
          species: species || undefined,
          size: size || undefined,
          breed: breed || undefined,
          hasMedicalNotes: medicalOnly ? true : undefined,
        }),
      ),
    [normalized, species, size, breed, medicalOnly],
  );

  const medicalCount = normalized.filter(hasMedicalFlag).length;

  return (
    <section className="rounded-3xl border border-[#DDE8DF] bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-[#007F3D]">
            Admin telemetry
          </p>
          <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-[#102033]">
            {title}
          </h2>
          <p className="mt-1 text-sm font-semibold text-[#536471]">
            Filter by species · size · breed · medical_notes (user_id-bound pets)
          </p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-black text-[#007F3D] ring-1 ring-emerald-100">
          <Filter className="h-3.5 w-3.5" />
          {filtered.length} / {normalized.length}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#536471]">
            Species
          </span>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="w-full rounded-2xl border border-[#DDE8DF] bg-[#F9FCFA] px-3 py-2.5 text-sm font-semibold text-[#102033]"
          >
            <option value="">All species</option>
            {speciesOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#536471]">
            Size
          </span>
          <select
            value={size}
            onChange={(e) => setSize(e.target.value)}
            className="w-full rounded-2xl border border-[#DDE8DF] bg-[#F9FCFA] px-3 py-2.5 text-sm font-semibold text-[#102033]"
          >
            <option value="">All sizes</option>
            {sizeOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-bold text-[#536471]">
            Breed contains
          </span>
          <input
            type="search"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
            placeholder="e.g. Labrador"
            className="w-full rounded-2xl border border-[#DDE8DF] bg-[#F9FCFA] px-3 py-2.5 text-sm font-semibold text-[#102033] outline-none focus:border-emerald-500"
          />
        </label>

        <label className="flex items-end gap-3 rounded-2xl border border-[#DDE8DF] bg-[#F9FCFA] px-3 py-2.5">
          <input
            type="checkbox"
            checked={medicalOnly}
            onChange={(e) => setMedicalOnly(e.target.checked)}
            className="h-4 w-4 accent-emerald-600"
          />
          <span className="text-sm font-bold text-[#102033]">
            Medical flags only ({medicalCount})
          </span>
        </label>
      </div>

      <div className="mt-5 max-h-72 overflow-y-auto rounded-2xl border border-[#E4EEE6]">
        {filtered.length === 0 ? (
          <div className="p-5 text-sm font-semibold text-[#536471]">
            No pets match these canonical filters.
          </div>
        ) : (
          <ul className="divide-y divide-[#E4EEE6]">
            {filtered.slice(0, 40).map((pet) => (
              <li
                key={pet.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0 flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-[#007F3D]">
                    <PawPrint className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-black text-[#102033]">
                      {pet.name}
                    </p>
                    <p className="truncate text-xs font-bold text-[#6D7C72]">
                      {[pet.species, pet.breed, pet.size]
                        .filter(Boolean)
                        .join(" · ") || "No attributes"}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {pet.user_id ? (
                    <span className="rounded-full bg-slate-50 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-600 ring-1 ring-slate-200">
                      user_id {pet.user_id.slice(0, 8)}…
                    </span>
                  ) : null}
                  {hasMedicalFlag(pet) ? (
                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700 ring-1 ring-rose-100">
                      medical_notes
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
