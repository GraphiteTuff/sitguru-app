"use client";

/**
 * Multi-Pet Profile Center — canonical pet contract + responsive layout.
 * Mobile: single column + swipeable trait strip
 * md: 2-col (parent telemetry | pet cards)
 * lg: 3-col inside max-w-7xl
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  PawPrint,
  Plus,
  Trash2,
} from "lucide-react";
import { getPetBreedOptions } from "@/lib/pets/breeds";
import {
  buildCanonicalPetWritePayload,
  calculatePetCompletion,
  CANONICAL_PET_SELECT,
  EMPTY_CANONICAL_PET_FORM,
  hasMedicalFlag,
  normalizeCanonicalPet,
  PET_SIZE_OPTIONS,
  PET_SPECIES_OPTIONS,
  PET_TRAIT_TABS,
  petToForm,
  type CanonicalPet,
  type CanonicalPetForm,
  type PetTraitTabId,
} from "@/lib/pets/canonical";
import { supabase } from "@/lib/supabase";
import PetMediaManager from "@/components/media/PetMediaManager";

type ParentTelemetry = {
  userId: string;
  displayName?: string | null;
  email?: string | null;
  phone?: string | null;
  zip?: string | null;
  profileCompletion?: number;
};

type Props = {
  parent: ParentTelemetry;
  /** Keep dashboard booking cards in sync. */
  onPetsChange?: (pets: CanonicalPet[]) => void;
};

async function loadPetsForUser(userId: string): Promise<CanonicalPet[]> {
  const attempts = ["user_id", "owner_id"] as const;
  for (const column of attempts) {
    const { data, error } = await supabase
      .from("pets")
      .select(CANONICAL_PET_SELECT)
      .eq(column, userId)
      .order("created_at", { ascending: false });

    if (!error && Array.isArray(data)) {
      return data
        .map((row) =>
          normalizeCanonicalPet(row as unknown as Record<string, unknown>),
        )
        .filter((pet): pet is CanonicalPet => Boolean(pet));
    }
  }
  return [];
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full min-h-[48px] rounded-2xl border border-slate-300 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none focus:border-emerald-500";

export default function MultiPetProfileCenter({ parent, onPetsChange }: Props) {
  const [pets, setPets] = useState<CanonicalPet[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [traitTab, setTraitTab] = useState<PetTraitTabId>("basics");
  const [form, setForm] = useState<CanonicalPetForm>(EMPTY_CANONICAL_PET_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  const breedOptions = useMemo(
    () => getPetBreedOptions(form.species === "cat" ? "cat" : "dog"),
    [form.species],
  );

  const selectedPet = useMemo(
    () => pets.find((p) => p.id === selectedId) || pets[0] || null,
    [pets, selectedId],
  );

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const rows = await loadPetsForUser(parent.userId);
      setPets(rows);
      onPetsChange?.(rows);
      if (!selectedId && rows[0]) setSelectedId(rows[0].id);
      if (selectedId && !rows.some((p) => p.id === selectedId)) {
        setSelectedId(rows[0]?.id || null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load pets.");
    } finally {
      setLoading(false);
    }
  }, [parent.userId, onPetsChange, selectedId]);

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parent.userId]);

  const scrollToPassportEditor = useCallback(() => {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => nameInputRef.current?.focus(), 280);
  }, []);

  const startCreate = useCallback(() => {
    setEditingId(null);
    setForm(EMPTY_CANONICAL_PET_FORM);
    setTraitTab("basics");
    setMessage("");
    setError("");
    scrollToPassportEditor();
    if (typeof window !== "undefined") {
      const nextUrl = `${window.location.pathname}${window.location.search}#new-pet-passport`;
      const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
      if (currentUrl !== nextUrl) {
        window.history.replaceState(null, "", nextUrl);
      }
    }
  }, [scrollToPassportEditor]);

  useEffect(() => {
    function applyPetHash() {
      const hash = window.location.hash;
      if (hash === "#new-pet-passport" || hash === "#add-pet") {
        setEditingId(null);
        setForm(EMPTY_CANONICAL_PET_FORM);
        setTraitTab("basics");
        window.setTimeout(() => {
          editorRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
          nameInputRef.current?.focus();
        }, 80);
      } else if (hash === "#multi-pet-center") {
        document
          .getElementById("multi-pet-center")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    applyPetHash();
    window.addEventListener("hashchange", applyPetHash);
    return () => window.removeEventListener("hashchange", applyPetHash);
  }, []);

  function startEdit(pet: CanonicalPet) {
    setEditingId(pet.id);
    setSelectedId(pet.id);
    setForm(petToForm(pet));
    setTraitTab("basics");
    setMessage("");
    setError("");
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!form.name.trim()) {
      setError("Pet name is required.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");

    const payload = buildCanonicalPetWritePayload(form, parent.userId);

    try {
      if (editingId) {
        const { data, error: updateError } = await supabase
          .from("pets")
          .update(payload)
          .eq("id", editingId)
          .select(CANONICAL_PET_SELECT)
          .maybeSingle();

        if (updateError) throw updateError;
        const normalized = normalizeCanonicalPet(
          (data || { ...payload, id: editingId }) as unknown as Record<
            string,
            unknown
          >,
        );
        if (normalized) {
          setPets((prev) => {
            const next = prev.map((p) => (p.id === editingId ? normalized : p));
            onPetsChange?.(next);
            return next;
          });
        }
        setMessage("Pet passport updated.");
      } else {
        const { data, error: insertError } = await supabase
          .from("pets")
          .insert(payload)
          .select(CANONICAL_PET_SELECT)
          .maybeSingle();

        if (insertError) throw insertError;
        const normalized = normalizeCanonicalPet(
          data as unknown as Record<string, unknown>,
        );
        if (normalized) {
          const next = [normalized, ...pets];
          setPets(next);
          onPetsChange?.(next);
          setSelectedId(normalized.id);
          setEditingId(normalized.id);
        }
        setMessage("Pet passport created.");
      }
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save pet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(petId: string) {
    if (!window.confirm("Remove this pet passport?")) return;
    setError("");
    const { error: deleteError } = await supabase
      .from("pets")
      .delete()
      .eq("id", petId);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    const next = pets.filter((p) => p.id !== petId);
    setPets(next);
    onPetsChange?.(next);
    if (editingId === petId) startCreate();
    if (selectedId === petId) setSelectedId(next[0]?.id || null);
    setMessage("Pet removed.");
  }

  function patchForm<K extends keyof CanonicalPetForm>(
    key: K,
    value: CanonicalPetForm[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const completion = calculatePetCompletion(form);

  return (
    <section
      id="multi-pet-center"
      className="mx-auto w-full max-w-7xl scroll-mt-24 px-4"
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Parent / admin telemetry */}
        <aside className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:col-span-1">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
            Parent profile
          </p>
          <h2 className="mt-2 text-xl font-black text-slate-950">
            {parent.displayName || "Pet Parent"}
          </h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-slate-500">User ID</dt>
              <dd className="truncate font-mono text-xs text-slate-800">
                {parent.userId}
              </dd>
            </div>
            {parent.email ? (
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-slate-500">Email</dt>
                <dd className="truncate font-semibold text-slate-800">
                  {parent.email}
                </dd>
              </div>
            ) : null}
            {parent.phone ? (
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-slate-500">Phone</dt>
                <dd className="font-semibold text-slate-800">{parent.phone}</dd>
              </div>
            ) : null}
            {parent.zip ? (
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-slate-500">Care ZIP</dt>
                <dd className="font-semibold text-slate-800">{parent.zip}</dd>
              </div>
            ) : null}
            <div className="flex justify-between gap-3">
              <dt className="font-bold text-slate-500">Pets</dt>
              <dd className="font-black text-emerald-700">{pets.length}</dd>
            </div>
            {typeof parent.profileCompletion === "number" ? (
              <div className="flex justify-between gap-3">
                <dt className="font-bold text-slate-500">Profile</dt>
                <dd className="font-black text-slate-900">
                  {parent.profileCompletion}%
                </dd>
              </div>
            ) : null}
          </dl>
          <Link
            href="/customer/dashboard/profile"
            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-sm font-black text-slate-800"
          >
            Open setup hub
          </Link>
        </aside>

        {/* Pet cards */}
        <div className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:col-span-1 lg:col-span-2">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.18em] text-emerald-700">
                Multi-Pet Profile Center
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">
                Pet Passports
              </h2>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Save with just a pet name — add breed, routines, and medical
                details anytime.
              </p>
            </div>
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
            >
              <Plus className="h-5 w-5" />
              Add pet
            </button>
          </div>

          {loading ? (
            <div className="mt-6 flex items-center gap-2 text-sm font-bold text-slate-600">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading pets…
            </div>
          ) : pets.length === 0 ? (
            <button
              type="button"
              onClick={startCreate}
              className="mt-6 w-full rounded-[1.4rem] border border-dashed border-emerald-200 bg-emerald-50/70 p-6 text-center transition hover:border-emerald-400 hover:bg-emerald-50"
            >
              <PawPrint className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-3 font-black text-slate-950">Add your first pet</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">
                Opens the New pet passport form below. Add name, species, and
                care notes, then save.
              </p>
            </button>
          ) : (
            <div className="mt-5 flex gap-3 overflow-x-auto pb-2 scrollbar-none md:grid md:grid-cols-2 md:overflow-visible lg:grid-cols-3">
              {pets.map((pet) => {
                const score = calculatePetCompletion(petToForm(pet));
                const active = pet.id === (selectedPet?.id || "");
                return (
                  <button
                    key={pet.id}
                    type="button"
                    onClick={() => startEdit(pet)}
                    className={`min-w-[220px] rounded-[1.4rem] border p-3 text-left transition md:min-w-0 ${
                      active
                        ? "border-emerald-400 bg-emerald-50 ring-2 ring-emerald-200"
                        : "border-slate-200 bg-slate-50 hover:border-emerald-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                        {pet.photo_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={pet.photo_url}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <PawPrint className="h-5 w-5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-black text-slate-950">
                          {pet.name}
                        </p>
                        <p className="truncate text-xs font-bold text-slate-500">
                          {[pet.species, pet.breed, pet.size]
                            .filter(Boolean)
                            .join(" · ") || "Add details"}
                        </p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-2">
                      <span className="text-[11px] font-black text-emerald-700">
                        {score}% ready
                      </span>
                      {hasMedicalFlag(pet) ? (
                        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-700">
                          Medical
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Editor */}
        <div
          id="new-pet-passport"
          ref={editorRef}
          className="scroll-mt-24 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm md:col-span-2 lg:col-span-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-black text-slate-950">
                {editingId ? `Editing ${form.name || "pet"}` : "New pet passport"}
              </h3>
              <p className="text-sm font-bold text-slate-500">
                Name is enough to save · Passport details {completion}% filled
              </p>
            </div>
            {editingId ? (
              <button
                type="button"
                onClick={() => handleDelete(editingId)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-black text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </button>
            ) : null}
          </div>

          {/* Mobile swipeable trait strip */}
          <div className="mt-4 flex gap-2 overflow-x-auto whitespace-nowrap px-0 pb-1 scrollbar-none md:flex-wrap md:overflow-visible">
            {PET_TRAIT_TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setTraitTab(tab.id)}
                className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full px-5 py-2.5 text-sm font-black transition ${
                  traitTab === tab.id
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {error ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-bold text-rose-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          ) : null}
          {message ? (
            <div className="mt-4 flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-bold text-emerald-800">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
              {message}
            </div>
          ) : null}

          <form onSubmit={handleSave} className="mt-4 space-y-4">
            {traitTab === "basics" ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Field label="Name *">
                  <input
                    ref={nameInputRef}
                    required
                    className={inputClass}
                    value={form.name}
                    onChange={(e) => patchForm("name", e.target.value)}
                    placeholder="Pet name"
                    autoComplete="off"
                  />
                </Field>
                <Field label="Species">
                  <select
                    className={inputClass}
                    value={form.species}
                    onChange={(e) => patchForm("species", e.target.value)}
                  >
                    <option value="">Select</option>
                    {PET_SPECIES_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Size">
                  <select
                    className={inputClass}
                    value={form.size}
                    onChange={(e) => patchForm("size", e.target.value)}
                  >
                    <option value="">Select</option>
                    {PET_SIZE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Breed">
                  <input
                    list="canonical-breed-options"
                    className={inputClass}
                    value={form.breed}
                    onChange={(e) => patchForm("breed", e.target.value)}
                  />
                  <datalist id="canonical-breed-options">
                    {breedOptions.map((breed) => (
                      <option key={breed} value={breed} />
                    ))}
                  </datalist>
                </Field>
                <Field label="Age">
                  <input
                    className={inputClass}
                    value={form.age}
                    onChange={(e) => patchForm("age", e.target.value)}
                  />
                </Field>
                <Field label="Weight">
                  <input
                    className={inputClass}
                    value={form.weight}
                    onChange={(e) => patchForm("weight", e.target.value)}
                  />
                </Field>
                <Field label="General notes">
                  <textarea
                    rows={3}
                    className={inputClass}
                    value={form.notes}
                    onChange={(e) => patchForm("notes", e.target.value)}
                  />
                </Field>
              </div>
            ) : null}

            {editingId ? (
              <div className="mt-4">
                <PetMediaManager
                  petId={editingId}
                  userId={parent.userId}
                  onPrimaryMediaChange={(mediaKind, url) => {
                    if (mediaKind === "photo") patchForm("photo_url", url || "");
                    else patchForm("video_url", url || "");
                  }}
                />
              </div>
            ) : traitTab === "basics" ? (
              <p className="mt-3 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">
                Tip: enter a name and tap Create passport — photos and extra
                tabs unlock after the first save.
              </p>
            ) : null}

            {traitTab === "behavior" ? (
              <details className="rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white" open>
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
                  Behavioral options
                  <span className="ml-2 text-xs font-bold text-slate-500">
                    Advanced
                  </span>
                </summary>
                <div className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 md:grid-cols-2">
                  {(
                    [
                      ["personality", "Personality"],
                      ["temperament", "Temperament"],
                      ["energy_level", "Energy level"],
                      ["good_with_people", "Good with people"],
                      ["good_with_pets", "Good with pets"],
                      ["separation_anxiety", "Separation anxiety"],
                      ["triggers", "Triggers"],
                      ["favorite_things", "Favorite things"],
                      ["bite_history", "Bite history"],
                      ["escape_risk", "Escape risk"],
                    ] as const
                  ).map(([key, label]) => (
                    <Field key={key} label={label}>
                      <textarea
                        rows={2}
                        className={inputClass}
                        value={form[key]}
                        onChange={(e) => patchForm(key, e.target.value)}
                      />
                    </Field>
                  ))}
                </div>
              </details>
            ) : null}

            {traitTab === "routines" ? (
              <details className="rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
                  Routines & access notes
                  <span className="ml-2 text-xs font-bold text-slate-500">
                    Advanced
                  </span>
                </summary>
                <div className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 md:grid-cols-2">
                  {(
                    [
                      ["feeding_routine", "Feeding routine"],
                      ["potty_routine", "Potty routine"],
                      ["walking_instructions", "Walking instructions"],
                      ["sleeping_location", "Sleeping location"],
                      ["crate_trained", "Crate trained"],
                      ["care_instructions", "Care instructions"],
                      ["entry_notes", "Entry / access notes"],
                      ["supplies_location", "Supplies location"],
                      ["restricted_areas", "Restricted areas"],
                      ["house-adjacent", "Booking notes for Gurus"],
                    ] as const
                  ).map(([key, label]) =>
                    key === "house-adjacent" ? (
                      <Field key={key} label={label}>
                        <textarea
                          rows={2}
                          className={inputClass}
                          value={form.booking_notes}
                          onChange={(e) =>
                            patchForm("booking_notes", e.target.value)
                          }
                        />
                      </Field>
                    ) : (
                      <Field key={key} label={label}>
                        <textarea
                          rows={2}
                          className={inputClass}
                          value={form[key as keyof CanonicalPetForm] as string}
                          onChange={(e) =>
                            patchForm(
                              key as keyof CanonicalPetForm,
                              e.target.value,
                            )
                          }
                        />
                      </Field>
                    ),
                  )}
                </div>
              </details>
            ) : null}

            {traitTab === "medical" ? (
              <details className="rounded-2xl border border-slate-200 bg-slate-50/70 open:bg-white">
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-slate-900 [&::-webkit-details-marker]:hidden">
                  Medical & safety notes
                  <span className="ml-2 text-xs font-bold text-slate-500">
                    Advanced
                  </span>
                </summary>
                <div className="grid grid-cols-1 gap-3 border-t border-slate-200 p-4 md:grid-cols-2">
                  <Field label="Medical notes">
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={form.medical_notes}
                      onChange={(e) =>
                        patchForm("medical_notes", e.target.value)
                      }
                      placeholder="Medications, dosing, special handling"
                    />
                  </Field>
                  <Field label="Allergies">
                    <textarea
                      rows={3}
                      className={inputClass}
                      value={form.allergies}
                      onChange={(e) => patchForm("allergies", e.target.value)}
                    />
                  </Field>
                  <Field label="Medical conditions">
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={form.medical_conditions}
                      onChange={(e) =>
                        patchForm("medical_conditions", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Safety notes">
                    <textarea
                      rows={2}
                      className={inputClass}
                      value={form.safety_notes}
                      onChange={(e) => patchForm("safety_notes", e.target.value)}
                    />
                  </Field>
                  <Field label="Vet name">
                    <input
                      className={inputClass}
                      value={form.vet_name}
                      onChange={(e) => patchForm("vet_name", e.target.value)}
                    />
                  </Field>
                  <Field label="Vet phone">
                    <input
                      className={inputClass}
                      value={form.vet_phone}
                      onChange={(e) => patchForm("vet_phone", e.target.value)}
                    />
                  </Field>
                  <Field label="Emergency contact name">
                    <input
                      className={inputClass}
                      value={form.emergency_contact_name}
                      onChange={(e) =>
                        patchForm("emergency_contact_name", e.target.value)
                      }
                    />
                  </Field>
                  <Field label="Emergency contact phone">
                    <input
                      className={inputClass}
                      value={form.emergency_contact_phone}
                      onChange={(e) =>
                        patchForm("emergency_contact_phone", e.target.value)
                      }
                    />
                  </Field>
                </div>
              </details>
            ) : null}

            <div className="sticky bottom-0 z-10 -mx-5 border-t border-slate-100 bg-white/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <button
                type="submit"
                disabled={saving || !form.name.trim()}
                className="inline-flex min-h-[52px] w-full items-center justify-center rounded-2xl bg-[#0D5C3A] px-5 text-base font-black text-white hover:bg-[#09462c] disabled:opacity-60 md:w-auto md:min-w-[200px]"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…
                  </>
                ) : editingId ? (
                  "Save passport"
                ) : (
                  "Create passport"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
