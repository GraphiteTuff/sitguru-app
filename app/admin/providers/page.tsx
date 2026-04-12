"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type GuruRow = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  middle_initial?: string | null;
  last_name?: string | null;
  city?: string | null;
  state?: string | null;
  approval_status?: string | null;
  is_active?: boolean | null;
  pet_types?: string[] | string | null;
  created_at?: string | null;
};

function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

function getFullName(profile: GuruRow) {
  const first = profile.first_name?.trim() || "";
  const mi = profile.middle_initial?.trim() || "";
  const last = profile.last_name?.trim() || "";

  const full = [first, mi ? `${mi}.` : "", last].filter(Boolean).join(" ").trim();
  return full || "Guru";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function normalizePetTypes(value: GuruRow["pet_types"]): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v));
  return [String(value)];
}

function statusBadgeClasses(status?: string | null) {
  const value = String(status || "").toLowerCase();

  if (value === "approved") {
    return "bg-emerald-50 text-emerald-700 border border-emerald-200";
  }

  if (value === "pending") {
    return "bg-amber-50 text-amber-700 border border-amber-200";
  }

  if (value === "rejected") {
    return "bg-red-50 text-red-700 border border-red-200";
  }

  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export default function AdminGurusPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [gurus, setGurus] = useState<GuruRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  async function loadPage() {
    setLoading(true);
    setError("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/admin/login");
      return;
    }

    const { data: myProfile, error: myProfileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (myProfileError || !myProfile || myProfile.role !== "admin") {
      await supabase.auth.signOut();
      router.push("/admin/login");
      return;
    }

    setAdminProfile(myProfile as AdminProfile);

    const { data, error: gurusError } = await supabase
      .from("profiles")
      .select(
        "id, role, first_name, middle_initial, last_name, city, state, approval_status, is_active, pet_types, created_at"
      )
      .in("role", ["sitter", "walker", "caretaker", "guru"])
      .order("created_at", { ascending: false });

    if (gurusError) {
      setError(gurusError.message);
      setLoading(false);
      return;
    }

    setGurus((data as GuruRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-gurus-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          void loadPage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id]);

  const filteredGurus = useMemo(() => {
    const term = search.trim().toLowerCase();

    if (!term) return gurus;

    return gurus.filter((guru) => {
      const fullName = getFullName(guru).toLowerCase();
      const city = String(guru.city || "").toLowerCase();
      const state = String(guru.state || "").toLowerCase();
      const role = String(guru.role || "").toLowerCase();
      const status = String(guru.approval_status || "").toLowerCase();

      return (
        fullName.includes(term) ||
        city.includes(term) ||
        state.includes(term) ||
        role.includes(term) ||
        status.includes(term)
      );
    });
  }, [gurus, search]);

  const stats = useMemo(() => {
    const approved = gurus.filter(
      (g) => String(g.approval_status || "").toLowerCase() === "approved"
    ).length;

    const pending = gurus.filter(
      (g) => String(g.approval_status || "").toLowerCase() === "pending"
    ).length;

    const active = gurus.filter((g) => g.is_active !== false).length;

    const sitters = gurus.filter((g) => String(g.role || "").toLowerCase() === "sitter").length;
    const walkers = gurus.filter((g) => String(g.role || "").toLowerCase() === "walker").length;
    const caretakers = gurus.filter((g) => String(g.role || "").toLowerCase() === "caretaker").length;

    return {
      total: gurus.length,
      approved,
      pending,
      active,
      sitters,
      walkers,
      caretakers,
    };
  }, [gurus]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-6">
            <p className="text-lg font-semibold text-slate-900">Loading guru management...</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru HQ</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              Guru Management
            </h1>
            <p className="mt-2 text-slate-600">
              Review sitters, walkers, caretakers, approval status, activity, and profile coverage.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => {
                void loadPage();
              }}
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </button>

            <Link
              href="/admin"
              className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {error ? (
          <Card className="p-6">
            <p className="text-sm font-semibold text-red-600">Error</p>
            <p className="mt-2 text-slate-700">{error}</p>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Total Gurus</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.total}</p>
            <p className="mt-2 text-sm text-slate-600">All sitters, walkers, and caretakers.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Approved</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.approved}</p>
            <p className="mt-2 text-sm text-slate-600">Gurus ready for marketplace visibility.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Pending</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.pending}</p>
            <p className="mt-2 text-sm text-slate-600">Gurus waiting for admin review.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Active</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.active}</p>
            <p className="mt-2 text-sm text-slate-600">Currently active guru accounts.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Sitters</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.sitters}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Walkers</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.walkers}</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Caretakers</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{stats.caretakers}</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Guru directory</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Marketplace guru list</h2>
              <p className="mt-2 text-sm text-slate-600">
                Search by name, city, state, role, or approval status.
              </p>
            </div>

            <div className="w-full lg:max-w-md">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search gurus..."
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 placeholder:text-slate-400 focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {filteredGurus.length > 0 ? (
              filteredGurus.map((guru) => {
                const petTypes = normalizePetTypes(guru.pet_types);

                return (
                  <div
                    key={guru.id}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <p className="text-base font-black text-slate-900">
                          {getFullName(guru)}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {guru.role || "guru"}
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBadgeClasses(
                              guru.approval_status
                            )}`}
                          >
                            {guru.approval_status || "unknown"}
                          </span>

                          <span className="rounded-full bg-slate-200 px-3 py-1 text-xs font-semibold text-slate-700">
                            {guru.is_active === false ? "inactive" : "active"}
                          </span>
                        </div>

                        <p className="mt-3 text-sm text-slate-600">
                          {[guru.city, guru.state].filter(Boolean).join(", ") || "Location not set"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Created {formatDate(guru.created_at)}
                        </p>

                        {petTypes.length > 0 ? (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {petTypes.map((type) => (
                              <span
                                key={`${guru.id}-${type}`}
                                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                              >
                                {type}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>

                      <div className="flex shrink-0 flex-wrap gap-2">
                        <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                          View profile
                        </button>

                        <button className="rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100">
                          Approve
                        </button>

                        <button className="rounded-full border border-red-300 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100">
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No gurus found for this search.
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}