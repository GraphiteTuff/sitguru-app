"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Pet = {
  id: string;
  name: string;
  breed: string | null;
  age: string | null;
  photo_url: string | null;
  notes: string | null;
};

export default function CustomerPetsPage() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    name: "",
    breed: "",
    age: "",
    photo_url: "",
    notes: "",
  });

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      window.location.href = "/customer/login";
      return;
    }

    const { data } = await supabase
      .from("pets")
      .select("id, name, breed, age, photo_url, notes")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    setPets(data || []);
    setLoading(false);
  }

  async function addPet(e: React.FormEvent) {
    e.preventDefault();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    await supabase.from("pets").insert({
      owner_id: user.id,
      name: form.name,
      breed: form.breed,
      age: form.age,
      photo_url: form.photo_url,
      notes: form.notes,
    });

    setForm({
      name: "",
      breed: "",
      age: "",
      photo_url: "",
      notes: "",
    });

    loadPets();
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        Loading pets...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] p-6">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <h1 className="text-4xl font-black text-slate-900">
          Your Pets 🐾
        </h1>
        <p className="text-slate-600 mt-2">
          Add and manage your pets so Gurus can provide better care.
        </p>

        {/* ADD PET FORM */}
        <form
          onSubmit={addPet}
          className="mt-6 bg-white p-6 rounded-2xl shadow space-y-4"
        >
          <h2 className="text-xl font-bold">Add a Pet</h2>

          <input
            required
            placeholder="Pet name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Breed"
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Age"
            value={form.age}
            onChange={(e) => setForm({ ...form, age: e.target.value })}
            className="w-full border rounded-xl p-3"
          />

          <input
            placeholder="Photo URL (optional)"
            value={form.photo_url}
            onChange={(e) => setForm({ ...form, photo_url: e.target.value })}
            className="w-full border rounded-xl p-3"
          />

          <textarea
            placeholder="Notes for your Guru"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border rounded-xl p-3"
          />

          <button className="w-full bg-emerald-500 text-black font-bold py-3 rounded-xl hover:bg-emerald-400">
            Add Pet
          </button>
        </form>

        {/* PET LIST */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          {pets.map((pet) => (
            <div
              key={pet.id}
              className="bg-white rounded-2xl shadow p-5"
            >
              {pet.photo_url && (
                <img
                  src={pet.photo_url}
                  alt={pet.name}
                  className="w-full h-40 object-cover rounded-xl mb-3"
                />
              )}

              <h3 className="text-xl font-bold">{pet.name}</h3>

              <p className="text-sm text-gray-500">
                {pet.breed || "Unknown breed"} • {pet.age || "Age not set"}
              </p>

              {pet.notes && (
                <p className="mt-3 text-sm text-slate-700">
                  {pet.notes}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}