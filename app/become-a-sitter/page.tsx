"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BecomeGuruPage() {
  const [user, setUser] = useState<any>(null);

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
      setUser(currentUser);

      if (!currentUser) return;

      // Load existing guru profile if exists
      const { data: guru } = await supabase
        .from("gurus")
        .select("*")
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (guru) {
        setDisplayName(guru.display_name || "");
        setBio(guru.bio || "");
        setCity(guru.city || "");
        setState(guru.state || "");
        setRate(guru.hourly_rate ? String(guru.hourly_rate) : "");
      }
    }

    load();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    // 1. Update profile (light)
    await supabase.from("profiles").update({
      role: "sitter", // keep compatibility
    }).eq("id", user.id);

    // 2. Ensure role exists in user_roles
    await supabase.from("user_roles").upsert({
      user_id: user.id,
      role: "guru",
    });

    // 3. Create/update Guru profile (MAIN TABLE)
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
          <h1 className="mb-6 text-2xl font-bold">
            Become a Guru 🐾
          </h1>

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