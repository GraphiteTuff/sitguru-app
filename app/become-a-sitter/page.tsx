"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AuthUser = {
  id: string;
  email?: string;
};

type GuruProfile = {
  display_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state?: string | null;
  hourly_rate?: number | null;
};

export default function BecomeGuruPage() {
  const [user, setUser] = useState<AuthUser | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [rate, setRate] = useState("");

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.auth.getUser();
      const currentUser = data.user;

      if (!currentUser) {
        setUser(null);
        return;
      }

      setUser({
        id: currentUser.id,
        email: currentUser.email,
      });

      const { data: guru } = await supabase
        .from("gurus")
        .select("display_name, bio, city, state, hourly_rate")
        .eq("user_id", currentUser.id)
        .maybeSingle<GuruProfile>();

      if (guru) {
        setDisplayName(guru.display_name || "");
        setBio(guru.bio || "");
        setCity(guru.city || "");
        setState(guru.state || "");
        setRate(guru.hourly_rate ? String(guru.hourly_rate) : "");
      }
    }

    void load();
  }, []);

  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    await supabase
      .from("profiles")
      .update({
        role: "sitter",
      })
      .eq("id", user.id);

    await supabase.from("user_roles").upsert({
      user_id: user.id,
      role: "guru",
    });

    const { error } = await supabase.from("gurus").upsert({
      user_id: user.id,
      display_name: displayName,
      bio,
      city,
      state,
      hourly_rate: Number(rate),
      is_verified: false,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Guru profile saved! 🎉");
    window.location.href = "/guru/dashboard";
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold">Become a Guru 🐾</h1>

          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="text"
              placeholder="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full rounded border p-3"
              required
            />

            <textarea
              placeholder="Tell pet owners about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full rounded border p-3"
              rows={4}
              required
            />

            <input
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full rounded border p-3"
              required
            />

            <input
              type="text"
              placeholder="State"
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded border p-3"
              required
            />

            <input
              type="number"
              placeholder="Hourly Rate ($)"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full rounded border p-3"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-emerald-600 py-3 text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Guru Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}