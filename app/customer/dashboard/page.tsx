"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Booking = {
  id: string;
  status: string;
  start_time: string;
  notes: string | null;
};

type ProfileRow = {
  first_name: string | null;
  full_name: string | null;
};

type Pet = {
  id: string;
  name: string;
  species: string | null;
  breed: string | null;
  age: string | null;
  weight: string | null;
  temperament: string | null;
  medications: string | null;
  notes: string | null;
  photo_url: string | null;
  video_url: string | null;
};

type RawBookingRow = {
  id?: string | number | null;
  status?: string | null;
  start_time?: string | null;
  date?: string | null;
  notes?: string | null;
};

type RawPetRow = {
  id?: string | number | null;
  name?: string | null;
  species?: string | null;
  breed?: string | null;
  age?: string | null;
  weight?: string | null;
  temperament?: string | null;
  medications?: string | null;
  notes?: string | null;
  photo_url?: string | null;
  video_url?: string | null;
};

const initialPetForm = {
  name: "",
  species: "",
  breed: "",
  age: "",
  weight: "",
  temperament: "",
  medications: "",
  notes: "",
  photo_url: "",
  video_url: "",
};

const routes = {
  findGuru: "/search",
  bookings: "/customer/dashboard#recent-bookings",
  messages: "/messages",
  adminMessages: "/messages/admin",
  search: "/search",
};

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClasses(status: string) {
  const normalized = status.toLowerCase();

  if (normalized === "pending") {
    return "bg-amber-50 text-amber-700 ring-1 ring-amber-200";
  }

  if (normalized === "confirmed") {
    return "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200";
  }

  if (normalized === "completed") {
    return "bg-sky-50 text-sky-700 ring-1 ring-sky-200";
  }

  return "bg-rose-50 text-rose-700 ring-1 ring-rose-200";
}

function getSafeFirstName(profile: ProfileRow | null, email?: string | null) {
  if (profile?.first_name?.trim()) {
    return profile.first_name.trim();
  }

  if (profile?.full_name?.trim()) {
    return profile.full_name.trim().split(" ")[0] || "there";
  }

  if (email?.trim()) {
    const emailPrefix = email.trim().split("@")[0];
    if (emailPrefix) {
      return emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
    }
  }

  return "there";
}

function normalizeBookingRow(row: RawBookingRow): Booking {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    status: row.status?.trim() || "pending",
    start_time:
      row.start_time?.trim() || row.date?.trim() || new Date(0).toISOString(),
    notes: row.notes ?? null,
  };
}

function normalizePetRow(row: RawPetRow): Pet {
  return {
    id: String(row.id ?? crypto.randomUUID()),
    name: row.name?.trim() || "Pet",
    species: row.species ?? null,
    breed: row.breed ?? null,
    age: row.age ?? null,
    weight: row.weight ?? null,
    temperament: row.temperament ?? null,
    medications: row.medications ?? null,
    notes: row.notes ?? null,
    photo_url: row.photo_url ?? null,
    video_url: row.video_url ?? null,
  };
}

function buildPetMessageHref(pet: Pet) {
  const intro = `Hi! I would like to talk about care for ${pet.name}.`;
  return `/messages?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name
  )}&message=${encodeURIComponent(intro)}`;
}

function buildPetAdminHref(pet: Pet) {
  return `/messages/admin?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name
  )}`;
}

function buildPetBookingHref(pet: Pet) {
  return `/search?pet=${encodeURIComponent(pet.id)}&petName=${encodeURIComponent(
    pet.name
  )}`;
}

async function fetchBookingsForUser(userId: string) {
  const attempts: Array<{
    matchColumn: string;
    dateColumn: "start_time" | "date";
  }> = [
    { matchColumn: "pet_owner_id", dateColumn: "start_time" },
    { matchColumn: "customer_id", dateColumn: "start_time" },
    { matchColumn: "user_id", dateColumn: "start_time" },
    { matchColumn: "pet_owner_id", dateColumn: "date" },
    { matchColumn: "customer_id", dateColumn: "date" },
    { matchColumn: "user_id", dateColumn: "date" },
  ];

  for (const attempt of attempts) {
    const selectColumns =
      attempt.dateColumn === "start_time"
        ? "id, status, start_time, notes"
        : "id, status, date, notes";

    const { data, error } = await supabase
      .from("bookings")
      .select(selectColumns)
      .eq(attempt.matchColumn, userId)
      .order(attempt.dateColumn, { ascending: false });

    if (!error) {
      return (data as RawBookingRow[] | null)?.map(normalizeBookingRow) || [];
    }
  }

  return [] as Booking[];
}

async function fetchPetsForUser(userId: string) {
  const attempts: Array<{
    matchColumn: string;
    orderByCreatedAt: boolean;
  }> = [
    { matchColumn: "owner_id", orderByCreatedAt: true },
    { matchColumn: "user_id", orderByCreatedAt: true },
    { matchColumn: "owner_id", orderByCreatedAt: false },
    { matchColumn: "user_id", orderByCreatedAt: false },
  ];

  for (const attempt of attempts) {
    let query = supabase
      .from("pets")
      .select(
        "id, name, species, breed, age, weight, temperament, medications, notes, photo_url, video_url"
      )
      .eq(attempt.matchColumn, userId);

    if (attempt.orderByCreatedAt) {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;

    if (!error) {
      return (data as RawPetRow[] | null)?.map(normalizePetRow) || [];
    }
  }

  return [] as Pet[];
}

export default function CustomerDashboardPage() {
  const router = useRouter();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [firstName, setFirstName] = useState("there");
  const [showPetForm, setShowPetForm] = useState(false);
  const [savingPet, setSavingPet] = useState(false);
  const [petForm, setPetForm] = useState(initialPetForm);
  const [formError, setFormError] = useState("");

  const loadDashboard = useCallback(async () => {
    setFormError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/customer/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, full_name")
      .eq("id", user.id)
      .maybeSingle<ProfileRow>();

    setFirstName(getSafeFirstName(profile ?? null, user.email));

    const [bookingsData, petsData] = await Promise.all([
      fetchBookingsForUser(user.id),
      fetchPetsForUser(user.id),
    ]);

    setBookings(bookingsData);
    setPets(petsData);
    setLoading(false);
  }, [router]);

  useEffect(() => {
    let active = true;

    async function run() {
      try {
        await loadDashboard();
      } finally {
        if (!active) return;
      }
    }

    run();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        router.replace("/customer/login");
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadDashboard, router]);

  const stats = useMemo(() => {
    const upcoming = bookings.filter((booking) => {
      const bookingDate = new Date(booking.start_time).getTime();
      return Number.isFinite(bookingDate) && bookingDate >= Date.now();
    }).length;

    const pending = bookings.filter(
      (booking) => booking.status.toLowerCase() === "pending"
    ).length;

    const confirmed = bookings.filter(
      (booking) => booking.status.toLowerCase() === "confirmed"
    ).length;

    return {
      total: bookings.length,
      upcoming,
      pending,
      confirmed,
      pets: pets.length,
    };
  }, [bookings, pets]);

  async function handleAddPet(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingPet(true);
    setFormError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      router.replace("/customer/login");
      return;
    }

    if (!petForm.name.trim()) {
      setFormError("Pet name is required.");
      setSavingPet(false);
      return;
    }

    const ownerPayload = {
      owner_id: user.id,
      name: petForm.name.trim(),
      species: petForm.species.trim() || null,
      breed: petForm.breed.trim() || null,
      age: petForm.age.trim() || null,
      weight: petForm.weight.trim() || null,
      temperament: petForm.temperament.trim() || null,
      medications: petForm.medications.trim() || null,
      notes: petForm.notes.trim() || null,
      photo_url: petForm.photo_url.trim() || null,
      video_url: petForm.video_url.trim() || null,
    };

    const { error: ownerError } = await supabase.from("pets").insert(ownerPayload);

    if (ownerError) {
      const userPayload = {
        user_id: user.id,
        name: petForm.name.trim(),
        species: petForm.species.trim() || null,
        breed: petForm.breed.trim() || null,
        age: petForm.age.trim() || null,
        weight: petForm.weight.trim() || null,
        temperament: petForm.temperament.trim() || null,
        medications: petForm.medications.trim() || null,
        notes: petForm.notes.trim() || null,
        photo_url: petForm.photo_url.trim() || null,
        video_url: petForm.video_url.trim() || null,
      };

      const { error: userIdError } = await supabase.from("pets").insert(userPayload);

      if (userIdError) {
        setFormError(userIdError.message || "We could not save your pet profile.");
        setSavingPet(false);
        return;
      }
    }

    setPetForm(initialPetForm);
    setShowPetForm(false);
    await loadDashboard();
    setSavingPet(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] px-4 py-10 md:px-6 lg:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-center">
          <div className="rounded-3xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
            <p className="text-base font-semibold text-slate-700">
              Loading your customer dashboard...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f8fafc_0%,#ffffff_45%,#ecfdf5_100%)] px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <section
          id="care-start"
          className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl"
        >
          <div className="bg-gradient-to-r from-emerald-400 via-emerald-300 to-sky-200 px-6 py-8 md:px-8 md:py-10">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-emerald-950/80">
              SitGuru Customer Portal
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              Welcome back, {firstName} 👋
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-900/75 md:text-base">
              Manage your pets, book the right Guru, and keep communication clear.
              Your pets should stay at the center of every booking and message.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={routes.findGuru}
                className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                Find a Guru
              </Link>

              <Link
                href={routes.messages}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                Open Messages
              </Link>

              <Link
                href={routes.adminMessages}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                Message Admin
              </Link>

              <Link
                href={routes.bookings}
                className="inline-flex items-center justify-center rounded-2xl border border-slate-900/10 bg-white/80 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white"
              >
                View Bookings
              </Link>
            </div>
          </div>

          <div className="grid gap-4 px-6 py-6 md:grid-cols-5 md:px-8">
            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">Pets</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.pets}</p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">Total bookings</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.total}</p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">Upcoming</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.upcoming}</p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">Pending</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.pending}</p>
            </div>

            <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200">
              <p className="text-sm font-semibold text-slate-500">Confirmed</p>
              <p className="mt-2 text-3xl font-black text-slate-900">{stats.confirmed}</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-6 lg:grid-cols-[0.72fr_1.28fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Communication center
              </p>

              <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Clear next steps for you and your pets
              </h2>

              <div className="mt-5 grid gap-3">
                <Link
                  href={routes.messages}
                  className="rounded-2xl bg-emerald-500 px-5 py-4 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  Open messages
                </Link>

                <Link
                  href={routes.adminMessages}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Message Admin support
                </Link>

                <Link
                  href={routes.findGuru}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Find a Guru for your pets
                </Link>

                <Link
                  href={routes.bookings}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Review your bookings
                </Link>
              </div>

              <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-sm font-bold text-slate-900">
                  Best experience tip
                </p>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Start with a pet profile, then message or book from that pet’s card
                  so your Guru immediately knows who care is for.
                </p>
              </div>
            </div>

            <div
              id="messages-help"
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Messages
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Better communication for bookings and care
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Use messages to talk with your Guru, confirm care details, ask follow-up
                questions, and contact Admin when you need support.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href={routes.messages}
                  className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Open inbox
                </Link>

                <Link
                  href={routes.adminMessages}
                  className="inline-flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  Start admin support thread
                </Link>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Pet care tips
              </p>

              <div className="mt-5 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-bold text-slate-900">
                    Keep routines updated
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Share feeding times, medications, favorite walks, and home notes
                    so your Guru can deliver smoother care.
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                  <p className="text-sm font-bold text-slate-900">
                    Book with confidence
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    A complete pet profile and clear care details make every request
                    feel easier, warmer, and more premium.
                  </p>
                </div>
              </div>
            </div>

            <div
              id="friendly-shortcuts"
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Friendly shortcuts
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-white p-4 ring-1 ring-emerald-100">
                  <p className="text-lg font-black text-slate-900">🐶 Dogs</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Walks, drop-ins, overnight stays, and loving companionship.
                  </p>
                </div>

                <div className="rounded-2xl bg-gradient-to-br from-sky-50 to-white p-4 ring-1 ring-sky-100">
                  <p className="text-lg font-black text-slate-900">🐱 Cats</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Calm visits, feeding, medications, check-ins, and gentle care.
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                Referral rewards
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                Share SitGuru. Grow the community.
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Invite fellow pet parents to join SitGuru and help grow a trusted care community.
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-200">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Your future referral link
                </p>
                <p className="mt-2 break-all text-sm font-medium text-slate-900">
                  sitguru.com/signup?ref={firstName.toLowerCase()}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    My pets
                  </p>
                  <h2 className="mt-2 text-2xl font-black tracking-tight text-slate-900">
                    Pet profiles your Gurus can understand
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPetForm((value) => !value)}
                  className="inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                >
                  {showPetForm ? "Close pet form" : "Add a pet"}
                </button>
              </div>

              {formError ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {formError}
                </div>
              ) : null}

              {showPetForm ? (
                <form onSubmit={handleAddPet} className="mt-5 grid gap-3">
                  <input
                    required
                    type="text"
                    placeholder="Pet name"
                    value={petForm.name}
                    onChange={(e) => setPetForm({ ...petForm, name: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Species"
                      value={petForm.species}
                      onChange={(e) => setPetForm({ ...petForm, species: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="text"
                      placeholder="Breed"
                      value={petForm.breed}
                      onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <input
                      type="text"
                      placeholder="Age"
                      value={petForm.age}
                      onChange={(e) => setPetForm({ ...petForm, age: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />

                    <input
                      type="text"
                      placeholder="Weight"
                      value={petForm.weight}
                      onChange={(e) => setPetForm({ ...petForm, weight: e.target.value })}
                      className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="Temperament"
                    value={petForm.temperament}
                    onChange={(e) =>
                      setPetForm({ ...petForm, temperament: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />

                  <input
                    type="text"
                    placeholder="Medications"
                    value={petForm.medications}
                    onChange={(e) =>
                      setPetForm({ ...petForm, medications: e.target.value })
                    }
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />

                  <input
                    type="url"
                    placeholder="Photo URL"
                    value={petForm.photo_url}
                    onChange={(e) => setPetForm({ ...petForm, photo_url: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />

                  <input
                    type="url"
                    placeholder="Video URL"
                    value={petForm.video_url}
                    onChange={(e) => setPetForm({ ...petForm, video_url: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />

                  <textarea
                    placeholder="Care notes for your Guru"
                    rows={4}
                    value={petForm.notes}
                    onChange={(e) => setPetForm({ ...petForm, notes: e.target.value })}
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    disabled={savingPet}
                    className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
                  >
                    {savingPet ? "Saving pet..." : "Save pet profile"}
                  </button>
                </form>
              ) : null}

              {pets.length === 0 ? (
                <div className="mt-5 rounded-[1.5rem] border border-dashed border-slate-300 bg-slate-50 p-5">
                  <p className="text-sm font-semibold text-slate-900">No pet profiles yet.</p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Add your first pet profile so booking and Guru communication feel easier.
                  </p>
                </div>
              ) : (
                <div className="mt-5 grid gap-4">
                  {pets.map((pet) => (
                    <div
                      key={pet.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4"
                    >
                      <div className="flex flex-col gap-4 sm:flex-row">
                        <div className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                          {pet.photo_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={pet.photo_url}
                              alt={pet.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">
                              🐾
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-slate-900">{pet.name}</h3>

                            {pet.species ? (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                                {pet.species}
                              </span>
                            ) : null}
                          </div>

                          <p className="mt-1 text-sm text-slate-600">
                            {[pet.breed, pet.age, pet.weight].filter(Boolean).join(" • ") ||
                              "Profile details can be added anytime."}
                          </p>

                          {pet.temperament ? (
                            <p className="mt-2 text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">Temperament:</span>{" "}
                              {pet.temperament}
                            </p>
                          ) : null}

                          {pet.medications ? (
                            <p className="mt-1 text-sm text-slate-700">
                              <span className="font-semibold text-slate-900">Medications:</span>{" "}
                              {pet.medications}
                            </p>
                          ) : null}

                          {pet.notes ? (
                            <p className="mt-2 text-sm leading-6 text-slate-700">{pet.notes}</p>
                          ) : null}

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={buildPetBookingHref(pet)}
                              className="inline-flex items-center rounded-xl bg-emerald-500 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-emerald-400"
                            >
                              Book care
                            </Link>

                            <Link
                              href={buildPetMessageHref(pet)}
                              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                              Message Guru
                            </Link>

                            <Link
                              href={buildPetAdminHref(pet)}
                              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                              Message Admin
                            </Link>

                            <Link
                              href={routes.messages}
                              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                              View messages
                            </Link>

                            {pet.video_url ? (
                              <a
                                href={pet.video_url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                              >
                                View pet video
                              </a>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div
              id="recent-bookings"
              className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                    Recent bookings
                  </p>
                  <h2 className="mt-2 text-3xl font-black tracking-tight text-slate-900">
                    Your pet care activity
                  </h2>
                </div>

                <Link
                  href={routes.bookings}
                  className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-slate-100"
                >
                  View all
                </Link>
              </div>

              {bookings.length === 0 ? (
                <div className="mt-6 rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                  <p className="text-lg font-bold text-slate-900">No bookings yet</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    Start exploring trusted pet care options and request your first booking
                    with a Guru who feels right for your pet.
                  </p>

                  <Link
                    href={routes.findGuru}
                    className="mt-5 inline-flex items-center justify-center rounded-2xl bg-emerald-500 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-emerald-400"
                  >
                    Find a Guru
                  </Link>
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {bookings.map((booking) => (
                    <div
                      key={booking.id}
                      className="rounded-[1.5rem] border border-slate-200 bg-slate-50 p-5"
                    >
                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                        <div className="min-w-0">
                          <p className="text-base font-black text-slate-900">
                            Booking #{booking.id}
                          </p>

                          <p className="mt-1 text-sm font-medium text-slate-500">
                            {booking.start_time === new Date(0).toISOString()
                              ? "Booking date unavailable"
                              : new Date(booking.start_time).toLocaleString()}
                          </p>

                          <p className="mt-3 text-sm leading-6 text-slate-700">
                            {booking.notes?.trim()
                              ? booking.notes
                              : "No booking notes were added for this request."}
                          </p>

                          <div className="mt-4 flex flex-wrap gap-2">
                            <Link
                              href={routes.messages}
                              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                              Open messages
                            </Link>

                            <Link
                              href={routes.adminMessages}
                              className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 transition hover:bg-slate-100"
                            >
                              Get support
                            </Link>
                          </div>
                        </div>

                        <span
                          className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                            booking.status
                          )}`}
                        >
                          {formatStatus(booking.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}