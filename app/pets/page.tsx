"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Pet = {
  id: string;
  owner_id?: string | null;
  owner_profile_id?: string | null;
  name: string;
  breed: string | null;
  age: string | null;
  size: string | null;
  weight: string | null;
  temperament: string | null;
  medical_notes: string | null;
  care_instructions: string | null;
  story: string | null;
  is_public: boolean | null;
  created_at?: string | null;
  species: string | null;
  notes: string | null;
  photo_url: string | null;
  video_url: string | null;
  updated_at?: string | null;
  personality: string | null;
  energy_level: string | null;
  good_with_people: string | null;
  good_with_pets: string | null;
  separation_anxiety: string | null;
  triggers: string | null;
  feeding_routine: string | null;
  potty_routine: string | null;
  walking_instructions: string | null;
  sleeping_location: string | null;
  crate_trained: string | null;
  favorite_things: string | null;
  allergies: string | null;
  medical_conditions: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  supplies_location: string | null;
  entry_notes: string | null;
  restricted_areas: string | null;
  safety_notes: string | null;
  bite_history: string | null;
  escape_risk: string | null;
  booking_notes: string | null;
};

type PetForm = {
  name: string;
  species: string;
  breed: string;
  age: string;
  size: string;
  weight: string;
  photo_url: string;
  video_url: string;
  personality: string;
  temperament: string;
  energy_level: string;
  good_with_people: string;
  good_with_pets: string;
  separation_anxiety: string;
  triggers: string;
  feeding_routine: string;
  potty_routine: string;
  walking_instructions: string;
  sleeping_location: string;
  crate_trained: string;
  favorite_things: string;
  medical_notes: string;
  allergies: string;
  medical_conditions: string;
  vet_name: string;
  vet_phone: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  supplies_location: string;
  entry_notes: string;
  restricted_areas: string;
  safety_notes: string;
  bite_history: string;
  escape_risk: string;
  booking_notes: string;
  care_instructions: string;
  story: string;
  notes: string;
};

const emptyForm: PetForm = {
  name: "",
  species: "",
  breed: "",
  age: "",
  size: "",
  weight: "",
  photo_url: "",
  video_url: "",
  personality: "",
  temperament: "",
  energy_level: "",
  good_with_people: "",
  good_with_pets: "",
  separation_anxiety: "",
  triggers: "",
  feeding_routine: "",
  potty_routine: "",
  walking_instructions: "",
  sleeping_location: "",
  crate_trained: "",
  favorite_things: "",
  medical_notes: "",
  allergies: "",
  medical_conditions: "",
  vet_name: "",
  vet_phone: "",
  emergency_contact_name: "",
  emergency_contact_phone: "",
  supplies_location: "",
  entry_notes: "",
  restricted_areas: "",
  safety_notes: "",
  bite_history: "",
  escape_risk: "",
  booking_notes: "",
  care_instructions: "",
  story: "",
  notes: "",
};

const passportFields: Array<keyof PetForm> = [
  "name",
  "species",
  "breed",
  "age",
  "weight",
  "personality",
  "energy_level",
  "feeding_routine",
  "potty_routine",
  "medical_notes",
  "allergies",
  "vet_name",
  "vet_phone",
  "emergency_contact_name",
  "emergency_contact_phone",
  "safety_notes",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function cleanValue(value: string) {
  return value.trim() || null;
}

function calculateCompletion(pet: Partial<PetForm | Pet>) {
  const completed = passportFields.filter((field) => {
    const value = pet[field as keyof typeof pet];
    return typeof value === "string" && value.trim().length > 0;
  }).length;

  return Math.round((completed / passportFields.length) * 100);
}

function completionLabel(score: number) {
  if (score >= 90) return "Fully prepared";
  if (score >= 70) return "Guru ready";
  if (score >= 40) return "Good start";
  return "Needs details";
}

function scoreBarClass(score: number) {
  if (score >= 90) return "bg-emerald-600";
  if (score >= 70) return "bg-lime-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-red-500";
}

function FieldLabel({
  children,
  required = false,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="mb-2 block text-sm font-bold text-slate-800">
      {children} {required && <span className="text-red-500">*</span>}
    </label>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
    >
      <option value="">Select one</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
    />
  );
}

function SectionCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
        {eyebrow}
      </p>
      <h3 className="mt-2 text-xl font-bold text-slate-950">{title}</h3>
      <div className="mt-5 space-y-5">{children}</div>
    </section>
  );
}

export default function PetsPage() {
  const router = useRouter();

  const [pets, setPets] = useState<Pet[]>([]);
  const [form, setForm] = useState<PetForm>(emptyForm);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingPetId, setDeletingPetId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const editingPet = useMemo(
    () => pets.find((pet) => pet.id === editingPetId) ?? null,
    [pets, editingPetId]
  );

  const currentCompletion = calculateCompletion(form);

  useEffect(() => {
    loadPets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function getCurrentUserId() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user?.id) {
      return null;
    }

    return user.id;
  }

  async function loadPets() {
    setLoading(true);
    setError("");
    setMessage("");

    const userId = await getCurrentUserId();

    if (!userId) {
      setPets([]);
      setLoading(false);
      router.push("/login?redirect=/pets");
      return;
    }

    const { data, error } = await supabase
      .from("pets")
      .select(
        `
        id,
        owner_id,
        owner_profile_id,
        name,
        breed,
        age,
        size,
        weight,
        temperament,
        medical_notes,
        care_instructions,
        story,
        is_public,
        created_at,
        species,
        notes,
        photo_url,
        video_url,
        updated_at,
        personality,
        energy_level,
        good_with_people,
        good_with_pets,
        separation_anxiety,
        triggers,
        feeding_routine,
        potty_routine,
        walking_instructions,
        sleeping_location,
        crate_trained,
        favorite_things,
        allergies,
        medical_conditions,
        vet_name,
        vet_phone,
        emergency_contact_name,
        emergency_contact_phone,
        supplies_location,
        entry_notes,
        restricted_areas,
        safety_notes,
        bite_history,
        escape_risk,
        booking_notes
      `
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Pets load error:", error);
      setError(
        "We could not load your Pet Care Passports right now. Please refresh and try again."
      );
      setPets([]);
      setLoading(false);
      return;
    }

    setPets((data ?? []) as Pet[]);
    setLoading(false);
  }

  function updateForm(field: keyof PetForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEditing(pet: Pet) {
    setEditingPetId(pet.id);

    setForm({
      name: pet.name ?? "",
      species: pet.species ?? "",
      breed: pet.breed ?? "",
      age: pet.age ?? "",
      size: pet.size ?? "",
      weight: pet.weight ?? "",
      photo_url: pet.photo_url ?? "",
      video_url: pet.video_url ?? "",
      personality: pet.personality ?? "",
      temperament: pet.temperament ?? "",
      energy_level: pet.energy_level ?? "",
      good_with_people: pet.good_with_people ?? "",
      good_with_pets: pet.good_with_pets ?? "",
      separation_anxiety: pet.separation_anxiety ?? "",
      triggers: pet.triggers ?? "",
      feeding_routine: pet.feeding_routine ?? "",
      potty_routine: pet.potty_routine ?? "",
      walking_instructions: pet.walking_instructions ?? "",
      sleeping_location: pet.sleeping_location ?? "",
      crate_trained: pet.crate_trained ?? "",
      favorite_things: pet.favorite_things ?? "",
      medical_notes: pet.medical_notes ?? "",
      allergies: pet.allergies ?? "",
      medical_conditions: pet.medical_conditions ?? "",
      vet_name: pet.vet_name ?? "",
      vet_phone: pet.vet_phone ?? "",
      emergency_contact_name: pet.emergency_contact_name ?? "",
      emergency_contact_phone: pet.emergency_contact_phone ?? "",
      supplies_location: pet.supplies_location ?? "",
      entry_notes: pet.entry_notes ?? "",
      restricted_areas: pet.restricted_areas ?? "",
      safety_notes: pet.safety_notes ?? "",
      bite_history: pet.bite_history ?? "",
      escape_risk: pet.escape_risk ?? "",
      booking_notes: pet.booking_notes ?? "",
      care_instructions: pet.care_instructions ?? "",
      story: pet.story ?? "",
      notes: pet.notes ?? "",
    });

    setMessage("");
    setError("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingPetId(null);
    setForm(emptyForm);
    setMessage("");
    setError("");
  }

  async function savePet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const trimmedName = form.name.trim();

    if (!trimmedName) {
      setError("Please enter your pet’s name.");
      setSaving(false);
      return;
    }

    const userId = await getCurrentUserId();

    if (!userId) {
      setSaving(false);
      router.push("/login?redirect=/pets");
      return;
    }

    const payload = {
      name: trimmedName,
      species: cleanValue(form.species),
      breed: cleanValue(form.breed),
      age: cleanValue(form.age),
      size: cleanValue(form.size),
      weight: cleanValue(form.weight),
      photo_url: cleanValue(form.photo_url),
      video_url: cleanValue(form.video_url),
      personality: cleanValue(form.personality),
      temperament: cleanValue(form.temperament),
      energy_level: cleanValue(form.energy_level),
      good_with_people: cleanValue(form.good_with_people),
      good_with_pets: cleanValue(form.good_with_pets),
      separation_anxiety: cleanValue(form.separation_anxiety),
      triggers: cleanValue(form.triggers),
      feeding_routine: cleanValue(form.feeding_routine),
      potty_routine: cleanValue(form.potty_routine),
      walking_instructions: cleanValue(form.walking_instructions),
      sleeping_location: cleanValue(form.sleeping_location),
      crate_trained: cleanValue(form.crate_trained),
      favorite_things: cleanValue(form.favorite_things),
      medical_notes: cleanValue(form.medical_notes),
      allergies: cleanValue(form.allergies),
      medical_conditions: cleanValue(form.medical_conditions),
      vet_name: cleanValue(form.vet_name),
      vet_phone: cleanValue(form.vet_phone),
      emergency_contact_name: cleanValue(form.emergency_contact_name),
      emergency_contact_phone: cleanValue(form.emergency_contact_phone),
      supplies_location: cleanValue(form.supplies_location),
      entry_notes: cleanValue(form.entry_notes),
      restricted_areas: cleanValue(form.restricted_areas),
      safety_notes: cleanValue(form.safety_notes),
      bite_history: cleanValue(form.bite_history),
      escape_risk: cleanValue(form.escape_risk),
      booking_notes: cleanValue(form.booking_notes),
      care_instructions: cleanValue(form.care_instructions),
      story: cleanValue(form.story),
      notes: cleanValue(form.notes),
      is_public: false,
      owner_id: userId,
      updated_at: new Date().toISOString(),
    };

    if (editingPetId) {
      const { error } = await supabase
        .from("pets")
        .update(payload)
        .eq("id", editingPetId)
        .eq("owner_id", userId);

      if (error) {
        console.error("Pet update error:", error);
        setError("We could not update this Pet Care Passport. Please try again.");
        setSaving(false);
        return;
      }

      setMessage("Pet Care Passport updated.");
    } else {
      const { error } = await supabase.from("pets").insert(payload);

      if (error) {
        console.error("Pet insert error:", error);
        setError("We could not create this Pet Care Passport. Please try again.");
        setSaving(false);
        return;
      }

      setMessage("Pet Care Passport created.");
    }

    setForm(emptyForm);
    setEditingPetId(null);
    setSaving(false);
    await loadPets();
  }

  async function deletePet(petId: string) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this Pet Care Passport?"
    );

    if (!confirmed) return;

    const userId = await getCurrentUserId();

    if (!userId) {
      router.push("/login?redirect=/pets");
      return;
    }

    setDeletingPetId(petId);
    setError("");
    setMessage("");

    const { error } = await supabase
      .from("pets")
      .delete()
      .eq("id", petId)
      .eq("owner_id", userId);

    if (error) {
      console.error("Pet delete error:", error);
      setError("We could not delete this Pet Care Passport. Please try again.");
      setDeletingPetId(null);
      return;
    }

    if (editingPetId === petId) {
      setEditingPetId(null);
      setForm(emptyForm);
    }

    setMessage("Pet Care Passport deleted.");
    setDeletingPetId(null);
    await loadPets();
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50 via-white to-white">
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-emerald-100 bg-white shadow-sm">
          <div className="grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
            <div>
              <div className="mb-4 inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
                Pet Care Passport
              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
                Better care starts before your Guru arrives.
              </h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600 sm:text-lg">
                Create a complete care profile with your pet’s routine,
                personality, health details, safety notes, and emergency
                instructions so every SitGuru booking starts prepared.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/bookings/new"
                  className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Start a Booking
                </Link>

                <Link
                  href="/dashboard"
                  className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Back to Dashboard
                </Link>
              </div>
            </div>

            <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-6">
              <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                SitGuru Advantage
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950">
                Guru Ready Score
              </h2>

              <p className="mt-3 text-sm leading-6 text-slate-700">
                Each passport includes a readiness score to help pet parents
                complete the most important care and safety information before
                booking.
              </p>

              <div className="mt-5 rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-700">Current form</span>
                  <span className="text-emerald-700">{currentCompletion}%</span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarClass(
                      currentCompletion
                    )}`}
                    style={{ width: `${currentCompletion}%` }}
                  />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-500">
                  {completionLabel(currentCompletion)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {(message || error) && (
          <div
            className={`mb-6 rounded-2xl border px-5 py-4 text-sm font-semibold ${
              error
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            {error || message}
          </div>
        )}

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <form onSubmit={savePet} className="space-y-6">
            <SectionCard
              eyebrow={editingPet ? "Edit Passport" : "Create Passport"}
              title={editingPet ? `Update ${editingPet.name}` : "Pet basics"}
            >
              <div>
                <FieldLabel required>Pet name</FieldLabel>
                <TextInput
                  value={form.name}
                  onChange={(value) => updateForm("name", value)}
                  placeholder="Example: Max"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Species</FieldLabel>
                  <SelectInput
                    value={form.species}
                    onChange={(value) => updateForm("species", value)}
                    options={[
                      "Dog",
                      "Cat",
                      "Bird",
                      "Rabbit",
                      "Reptile",
                      "Fish",
                      "Small animal",
                      "Other",
                    ]}
                  />
                </div>

                <div>
                  <FieldLabel>Breed</FieldLabel>
                  <TextInput
                    value={form.breed}
                    onChange={(value) => updateForm("breed", value)}
                    placeholder="Example: Golden Retriever"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <FieldLabel>Age</FieldLabel>
                  <TextInput
                    value={form.age}
                    onChange={(value) => updateForm("age", value)}
                    placeholder="Example: 4 years"
                  />
                </div>

                <div>
                  <FieldLabel>Size</FieldLabel>
                  <SelectInput
                    value={form.size}
                    onChange={(value) => updateForm("size", value)}
                    options={["Small", "Medium", "Large", "Extra large"]}
                  />
                </div>

                <div>
                  <FieldLabel>Weight</FieldLabel>
                  <TextInput
                    value={form.weight}
                    onChange={(value) => updateForm("weight", value)}
                    placeholder="Example: 42 lbs"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Photo URL</FieldLabel>
                  <TextInput
                    value={form.photo_url}
                    onChange={(value) => updateForm("photo_url", value)}
                    placeholder="Paste an image URL"
                  />
                </div>

                <div>
                  <FieldLabel>Video URL</FieldLabel>
                  <TextInput
                    value={form.video_url}
                    onChange={(value) => updateForm("video_url", value)}
                    placeholder="Optional video URL"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Personality" title="Behavior and comfort">
              <div>
                <FieldLabel>Personality</FieldLabel>
                <TextArea
                  value={form.personality}
                  onChange={(value) => updateForm("personality", value)}
                  placeholder="Example: Sweet, shy at first, warms up after treats."
                />
              </div>

              <div>
                <FieldLabel>Temperament</FieldLabel>
                <TextArea
                  value={form.temperament}
                  onChange={(value) => updateForm("temperament", value)}
                  placeholder="Example: Calm, playful, anxious, protective, independent."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Energy level</FieldLabel>
                  <SelectInput
                    value={form.energy_level}
                    onChange={(value) => updateForm("energy_level", value)}
                    options={["Low", "Medium", "High", "Very high"]}
                  />
                </div>

                <div>
                  <FieldLabel>Separation anxiety?</FieldLabel>
                  <SelectInput
                    value={form.separation_anxiety}
                    onChange={(value) =>
                      updateForm("separation_anxiety", value)
                    }
                    options={["No", "Yes", "Sometimes", "Unsure"]}
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Good with people?</FieldLabel>
                  <SelectInput
                    value={form.good_with_people}
                    onChange={(value) => updateForm("good_with_people", value)}
                    options={["Yes", "No", "Sometimes", "Needs slow intro"]}
                  />
                </div>

                <div>
                  <FieldLabel>Good with other pets?</FieldLabel>
                  <SelectInput
                    value={form.good_with_pets}
                    onChange={(value) => updateForm("good_with_pets", value)}
                    options={["Yes", "No", "Sometimes", "Avoid other pets"]}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Triggers</FieldLabel>
                <TextArea
                  value={form.triggers}
                  onChange={(value) => updateForm("triggers", value)}
                  placeholder="Example: Doorbells, thunder, bikes, other dogs, strangers."
                />
              </div>
            </SectionCard>

            <SectionCard eyebrow="Routine" title="Daily care instructions">
              <div>
                <FieldLabel>Feeding routine</FieldLabel>
                <TextArea
                  value={form.feeding_routine}
                  onChange={(value) => updateForm("feeding_routine", value)}
                  placeholder="Example: 1 cup at 8 AM and 1 cup at 6 PM. Food is in the pantry."
                />
              </div>

              <div>
                <FieldLabel>Potty routine</FieldLabel>
                <TextArea
                  value={form.potty_routine}
                  onChange={(value) => updateForm("potty_routine", value)}
                  placeholder="Example: Walk after meals and before bedtime."
                />
              </div>

              <div>
                <FieldLabel>Walking instructions</FieldLabel>
                <TextArea
                  value={form.walking_instructions}
                  onChange={(value) =>
                    updateForm("walking_instructions", value)
                  }
                  placeholder="Example: Harness only. Avoid dog park. Keep away from large dogs."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Sleeping location</FieldLabel>
                  <TextInput
                    value={form.sleeping_location}
                    onChange={(value) => updateForm("sleeping_location", value)}
                    placeholder="Example: Crate in bedroom"
                  />
                </div>

                <div>
                  <FieldLabel>Crate trained?</FieldLabel>
                  <SelectInput
                    value={form.crate_trained}
                    onChange={(value) => updateForm("crate_trained", value)}
                    options={["Yes", "No", "Sometimes", "Not applicable"]}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Favorite things</FieldLabel>
                <TextArea
                  value={form.favorite_things}
                  onChange={(value) => updateForm("favorite_things", value)}
                  placeholder="Favorite toys, treats, games, comfort items, hiding spots."
                />
              </div>

              <div>
                <FieldLabel>Care instructions</FieldLabel>
                <TextArea
                  value={form.care_instructions}
                  onChange={(value) => updateForm("care_instructions", value)}
                  placeholder="General care instructions your Guru should follow."
                />
              </div>
            </SectionCard>

            <SectionCard eyebrow="Health" title="Medical and emergency details">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Medical notes</FieldLabel>
                  <TextArea
                    value={form.medical_notes}
                    onChange={(value) => updateForm("medical_notes", value)}
                    placeholder="Medication name, dosage, timing, or other medical notes."
                  />
                </div>

                <div>
                  <FieldLabel>Allergies</FieldLabel>
                  <TextArea
                    value={form.allergies}
                    onChange={(value) => updateForm("allergies", value)}
                    placeholder="Food, medication, environmental, or insect allergies."
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Medical conditions</FieldLabel>
                <TextArea
                  value={form.medical_conditions}
                  onChange={(value) => updateForm("medical_conditions", value)}
                  placeholder="Example: Arthritis, seizures, anxiety, recent surgery."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Vet name</FieldLabel>
                  <TextInput
                    value={form.vet_name}
                    onChange={(value) => updateForm("vet_name", value)}
                    placeholder="Example: ABC Animal Hospital"
                  />
                </div>

                <div>
                  <FieldLabel>Vet phone</FieldLabel>
                  <TextInput
                    value={form.vet_phone}
                    onChange={(value) => updateForm("vet_phone", value)}
                    placeholder="Example: 555-555-5555"
                  />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Emergency contact name</FieldLabel>
                  <TextInput
                    value={form.emergency_contact_name}
                    onChange={(value) =>
                      updateForm("emergency_contact_name", value)
                    }
                    placeholder="Someone besides the pet parent"
                  />
                </div>

                <div>
                  <FieldLabel>Emergency contact phone</FieldLabel>
                  <TextInput
                    value={form.emergency_contact_phone}
                    onChange={(value) =>
                      updateForm("emergency_contact_phone", value)
                    }
                    placeholder="Example: 555-555-5555"
                  />
                </div>
              </div>
            </SectionCard>

            <SectionCard eyebrow="Home" title="Access and home instructions">
              <div>
                <FieldLabel>Supplies location</FieldLabel>
                <TextArea
                  value={form.supplies_location}
                  onChange={(value) => updateForm("supplies_location", value)}
                  placeholder="Example: Food in pantry, leash by front door, cleaning supplies under sink."
                />
              </div>

              <div>
                <FieldLabel>Entry notes</FieldLabel>
                <TextArea
                  value={form.entry_notes}
                  onChange={(value) => updateForm("entry_notes", value)}
                  placeholder="Lockbox, door code, parking, alarm notes, or building instructions."
                />
              </div>

              <div>
                <FieldLabel>Restricted areas</FieldLabel>
                <TextArea
                  value={form.restricted_areas}
                  onChange={(value) => updateForm("restricted_areas", value)}
                  placeholder="Rooms, closets, gates, furniture, or outdoor areas to avoid."
                />
              </div>
            </SectionCard>

            <SectionCard eyebrow="Safety" title="Guru safety notes">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <FieldLabel>Bite history?</FieldLabel>
                  <SelectInput
                    value={form.bite_history}
                    onChange={(value) => updateForm("bite_history", value)}
                    options={["No", "Yes", "Unsure", "Only when scared"]}
                  />
                </div>

                <div>
                  <FieldLabel>Escape risk?</FieldLabel>
                  <SelectInput
                    value={form.escape_risk}
                    onChange={(value) => updateForm("escape_risk", value)}
                    options={["No", "Yes", "Sometimes", "High risk"]}
                  />
                </div>
              </div>

              <div>
                <FieldLabel>Safety notes for Guru</FieldLabel>
                <TextArea
                  value={form.safety_notes}
                  onChange={(value) => updateForm("safety_notes", value)}
                  placeholder="Resource guarding, leash reactivity, door dashing, hiding, fear triggers, handling instructions, or anything the Guru must know."
                  rows={5}
                />
              </div>

              <div>
                <FieldLabel>Booking-specific notes</FieldLabel>
                <TextArea
                  value={form.booking_notes}
                  onChange={(value) => updateForm("booking_notes", value)}
                  placeholder="Anything different for the next booking? Example: recovering from surgery, new medication, broken gate, recent behavior changes."
                />
              </div>

              <div>
                <FieldLabel>Pet story</FieldLabel>
                <TextArea
                  value={form.story}
                  onChange={(value) => updateForm("story", value)}
                  placeholder="Tell your Guru anything personal or helpful about your pet."
                />
              </div>

              <div>
                <FieldLabel>Additional notes</FieldLabel>
                <TextArea
                  value={form.notes}
                  onChange={(value) => updateForm("notes", value)}
                  placeholder="Anything else your SitGuru should know."
                />
              </div>

              <div className="rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                <div className="flex items-center justify-between text-sm font-bold">
                  <span className="text-slate-800">Guru Ready Score</span>
                  <span className="text-emerald-700">{currentCompletion}%</span>
                </div>

                <div className="mt-3 h-3 overflow-hidden rounded-full bg-white">
                  <div
                    className={`h-full rounded-full transition-all ${scoreBarClass(
                      currentCompletion
                    )}`}
                    style={{ width: `${currentCompletion}%` }}
                  />
                </div>

                <p className="mt-3 text-xs font-semibold text-slate-600">
                  {completionLabel(currentCompletion)}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Saving..."
                    : editingPet
                    ? "Save Passport"
                    : "Create Passport"}
                </button>

                {editingPet && (
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </SectionCard>
          </form>

          <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm sm:p-8 xl:sticky xl:top-6 xl:h-fit">
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-emerald-700">
                  Saved Passports
                </p>

                <h2 className="mt-2 text-2xl font-bold text-slate-950">
                  Your Pet Care Passports
                </h2>
              </div>

              <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-bold text-slate-700">
                {pets.length} {pets.length === 1 ? "Passport" : "Passports"}
              </div>
            </div>

            {loading ? (
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 text-center">
                <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
                <p className="font-semibold text-slate-700">
                  Loading Pet Care Passports...
                </p>
              </div>
            ) : pets.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-emerald-200 bg-emerald-50 p-8 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-2xl shadow-sm">
                  🐾
                </div>

                <h3 className="text-xl font-bold text-slate-950">
                  No Pet Care Passports yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-600">
                  Create your first passport so your Guru understands your pet’s
                  routine, health needs, and safety details before care begins.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {pets.map((pet) => {
                  const score = calculateCompletion(pet);

                  return (
                    <article
                      key={pet.id}
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                    >
                      <div className="p-5">
                        <div className="flex gap-4">
                          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-3xl bg-emerald-50">
                            {pet.photo_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={pet.photo_url}
                                alt={pet.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xl font-black text-emerald-700">
                                {initials(pet.name)}
                              </div>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <h3 className="text-xl font-bold text-slate-950">
                                  {pet.name}
                                </h3>

                                <p className="mt-1 text-sm font-semibold text-slate-500">
                                  {[pet.species, pet.breed]
                                    .filter(Boolean)
                                    .join(" • ") || "Pet details not listed"}
                                </p>
                              </div>
                            </div>

                            <div className="mt-4">
                              <div className="flex items-center justify-between text-xs font-bold">
                                <span className="text-slate-600">
                                  Guru Ready Score
                                </span>
                                <span className="text-emerald-700">
                                  {score}%
                                </span>
                              </div>

                              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className={`h-full rounded-full ${scoreBarClass(
                                    score
                                  )}`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>

                              <p className="mt-2 text-xs font-semibold text-slate-500">
                                {completionLabel(score)}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-5 grid gap-3 text-sm sm:grid-cols-2">
                          <div className="rounded-2xl bg-slate-50 p-4">
                            <p className="font-bold text-slate-800">Routine</p>
                            <p className="mt-1 line-clamp-3 text-slate-600">
                              {pet.feeding_routine ||
                                pet.potty_routine ||
                                pet.care_instructions ||
                                "No routine added yet."}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-red-50 p-4">
                            <p className="font-bold text-red-800">Safety</p>
                            <p className="mt-1 line-clamp-3 text-red-700">
                              {pet.safety_notes ||
                                pet.triggers ||
                                "No safety notes added yet."}
                            </p>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => startEditing(pet)}
                            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition hover:bg-slate-50"
                          >
                            Edit Passport
                          </button>

                          <button
                            type="button"
                            onClick={() => deletePet(pet.id)}
                            disabled={deletingPetId === pet.id}
                            className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingPetId === pet.id
                              ? "Deleting..."
                              : "Delete"}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}