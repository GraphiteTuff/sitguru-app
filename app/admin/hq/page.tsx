"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  role?: string | null;
  first_name?: string | null;
  middle_initial?: string | null;
  last_name?: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getFullName(profile: Profile) {
  const first = profile.first_name?.trim() || "";
  const mi = profile.middle_initial?.trim() || "";
  const last = profile.last_name?.trim() || "";
  const full = [first, mi, last].filter(Boolean).join(" ").trim();

  return full || "Admin User";
}

export default function AdminHqPage() {
  const router = useRouter();

  const [admins, setAdmins] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

    const { data, error: adminsError } = await supabase
      .from("profiles")
      .select("id, role, first_name, middle_initial, last_name, created_at")
      .eq("role", "admin")
      .order("created_at", { ascending: false });

    if (adminsError) {
      setError(adminsError.message);
      setLoading(false);
      return;
    }

    setAdmins((data as Profile[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-6">
            <p className="text-lg font-semibold text-slate-900">Loading HQ staff accounts...</p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru HQ</p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              HQ Staff Accounts
            </h1>
            <p className="mt-2 text-slate-600">
              Internal admin users, staff access, and headquarters account overview.
            </p>
          </div>

          <Link
            href="/admin"
            className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>

        {error ? (
          <Card className="p-6">
            <p className="text-sm font-semibold text-red-600">Error</p>
            <p className="mt-2 text-slate-700">{error}</p>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Total Admin Accounts</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{admins.length}</p>
            <p className="mt-2 text-sm text-slate-600">All accounts with admin role access.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Role Type</p>
            <p className="mt-3 text-4xl font-black text-slate-900">Admin</p>
            <p className="mt-2 text-sm text-slate-600">Executive and internal business access.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Access Scope</p>
            <p className="mt-3 text-4xl font-black text-slate-900">Full</p>
            <p className="mt-2 text-sm text-slate-600">HQ-level control of platform systems.</p>
          </Card>
        </div>

        <Card className="p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-slate-500">Directory</p>
              <h2 className="mt-1 text-2xl font-black text-slate-900">Admin staff list</h2>
              <p className="mt-2 text-sm text-slate-600">
                Live list of users in the profiles table with the admin role.
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3">
            {admins.length > 0 ? (
              admins.map((admin) => (
                <div
                  key={admin.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-900">{getFullName(admin)}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {admin.role || "admin"} • Created {formatDate(admin.created_at)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-semibold text-emerald-700">
                        {admin.role || "admin"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        Created {formatDate(admin.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                No admin accounts found yet.
              </div>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}