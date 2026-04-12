"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const US_STATES = [
  { code: "AL", name: "Alabama" },
  { code: "AK", name: "Alaska" },
  { code: "AZ", name: "Arizona" },
  { code: "AR", name: "Arkansas" },
  { code: "CA", name: "California" },
  { code: "CO", name: "Colorado" },
  { code: "CT", name: "Connecticut" },
  { code: "DE", name: "Delaware" },
  { code: "FL", name: "Florida" },
  { code: "GA", name: "Georgia" },
  { code: "HI", name: "Hawaii" },
  { code: "ID", name: "Idaho" },
  { code: "IL", name: "Illinois" },
  { code: "IN", name: "Indiana" },
  { code: "IA", name: "Iowa" },
  { code: "KS", name: "Kansas" },
  { code: "KY", name: "Kentucky" },
  { code: "LA", name: "Louisiana" },
  { code: "ME", name: "Maine" },
  { code: "MD", name: "Maryland" },
  { code: "MA", name: "Massachusetts" },
  { code: "MI", name: "Michigan" },
  { code: "MN", name: "Minnesota" },
  { code: "MS", name: "Mississippi" },
  { code: "MO", name: "Missouri" },
  { code: "MT", name: "Montana" },
  { code: "NE", name: "Nebraska" },
  { code: "NV", name: "Nevada" },
  { code: "NH", name: "New Hampshire" },
  { code: "NJ", name: "New Jersey" },
  { code: "NM", name: "New Mexico" },
  { code: "NY", name: "New York" },
  { code: "NC", name: "North Carolina" },
  { code: "ND", name: "North Dakota" },
  { code: "OH", name: "Ohio" },
  { code: "OK", name: "Oklahoma" },
  { code: "OR", name: "Oregon" },
  { code: "PA", name: "Pennsylvania" },
  { code: "RI", name: "Rhode Island" },
  { code: "SC", name: "South Carolina" },
  { code: "SD", name: "South Dakota" },
  { code: "TN", name: "Tennessee" },
  { code: "TX", name: "Texas" },
  { code: "UT", name: "Utah" },
  { code: "VT", name: "Vermont" },
  { code: "VA", name: "Virginia" },
  { code: "WA", name: "Washington" },
  { code: "WV", name: "West Virginia" },
  { code: "WI", name: "Wisconsin" },
  { code: "WY", name: "Wyoming" },
];

type ProfileRow = {
  full_name?: string | null;
  bio?: string | null;
  city?: string | null;
  state_code?: string | null;
  price?: number | null;
};

export default function BecomeGuruPage() {
  const [user, setUser] = useState<any>(null);

  const [fullName, setFullName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function getUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);

      if (!data.user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, bio, city, state_code, price")
        .eq("id", data.user.id)
        .single<ProfileRow>();

      if (profile) {
        setFullName(profile.full_name || "");
        setBio(profile.bio || "");
        setCity(profile.city || "");
        setStateCode(profile.state_code || "");
        setPrice(profile.price ? String(profile.price) : "");
      }
    }

    void getUser();
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    if (!user) {
      alert("You must be logged in.");
      setLoading(false);
      return;
    }

    const selectedState = US_STATES.find((s) => s.code === stateCode);

    if (!selectedState) {
      alert("Please select a state.");
      setLoading(false);
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        bio,
        city,
        state: selectedState.name,
        state_code: selectedState.code,
        price: Number(price),
        role: "guru",
        account_type: "Guru",
      })
      .eq("id", user.id);

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    alert("Guru profile updated! 🎉");
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-lg px-6 py-16">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-2xl font-bold">Become a Guru 🐾</h1>

          <form onSubmit={handleSave} className="space-y-4">
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
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

            <select
              value={stateCode}
              onChange={(e) => setStateCode(e.target.value)}
              className="w-full rounded border p-3"
              required
            >
              <option value="">Select State</option>
              {US_STATES.map((state) => (
                <option key={state.code} value={state.code}>
                  {state.name} ({state.code})
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Price per night ($)"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded border p-3"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded bg-slate-900 py-3 text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Saving..." : "Save Guru Profile"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}