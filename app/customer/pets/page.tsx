"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
  notes: string | null;
};

type PetForm = {
  name: string;
  breed: string;
  age: string;
  photo_url: string;
  notes: string;
};

const emptyPetForm: PetForm = {
  name: "",
  breed: "",
  age: "",
  photo_url: "",
  notes: "",
};

export default function CustomerPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<PetForm>(emptyPetForm);

  const loadPets = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/customer/login");
      return;
    }

    const { data } = await supabase
      .from("pets")
      .select("id, name, breed, age, photo_url, notes")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setPets(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadPets();
  }, [loadPets]);

  async function addPet(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.assign("/customer/login");
      return;
    }

    await supabase.from("pets").insert({
      owner_id: user.id,
      name: form.name,
      breed: form.breed,
      age: form.age,
      photo_url: form.photo_url,
      notes: form.notes,
    });

    setForm(emptyPetForm);

    await loadPets();
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        Loading pets...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] p-6">
      <div className="mx-auto max-w-5xl">
        {/* HEADER */}
        <h1 className="text-4xl font-black text-slate-900">Your Pets 🐾</h1>

        <p className="mt-2 text-slate-600">
          Add and manage your pets so Gurus can provide better care.
        </p>

        {/* ADD PET FORM */}
        <form
          onSubmit={addPet}
          className="mt-6 space-y-4 rounded-2xl bg-white p-6 shadow"
        >
          <h2 className="text-xl font-bold">Add a Pet</h2>

          <input
            required
            placeholder="Pet name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border p-3"
          />

          <input
            placeholder="Breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            className="w-full rounded-xl border p-3"
          />

          <input
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full rounded-xl border p-3"
          />

          <input
            placeholder="Photo URL (optional)"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            className="w-full rounded-xl border p-3"
          />

          <textarea
            placeholder="Notes for your Guru"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full rounded-xl border p-3"
          />

          <button
            type="submit"
            className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400"
          >
            Add Pet
          </button>
        </form>

        {/* PET LIST */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          {pets.map((pet) => (
            <div key={pet.id} className="rounded-2xl bg-white p-5 shadow">
              {pet.photo_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="mb-3 h-40 w-full rounded-xl object-cover"
                />
              ) : null}

              <h3 className="text-xl font-bold">{pet.name}</h3>

              <p className="text-sm text-gray-500">
                {pet.breed || "Unknown breed"} • {pet.age || "Age not set"}
              </p>

              {pet.notes ? (
                <p className="mt-3 text-sm text-slate-700">{pet.notes}</p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}