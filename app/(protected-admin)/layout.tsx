"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

function navLinkClasses(isActive: boolean) {
  return [
    "block rounded-2xl px-4 py-3 text-sm font-semibold transition",
    isActive
      ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
      : "text-slate-700 hover:bg-slate-50",
  ].join(" ");
}

export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);

  useEffect(() => {
    async function checkAdmin() {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        router.replace("/admin/login");
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }

      setAdminProfile(profile as AdminProfile);
      setLoading(false);
    }

    checkAdmin();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
          <p className="text-lg font-semibold text-slate-900">Loading admin area...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <aside className="hidden w-72 shrink-0 lg:block">
          <div className="sticky top-6 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-emerald-600">PawNecto Owner Panel</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Admin</h2>
            <p className="mt-2 text-sm text-slate-600">
              ID: {adminProfile?.id || "Owner"}
            </p>

            <nav className="mt-6 space-y-2">
              <Link
                href="/admin"
                className={navLinkClasses(pathname === "/admin")}
              >
                Dashboard
              </Link>

              <Link
                href="/admin/referrals"
                className={navLinkClasses(pathname === "/admin/referrals")}
              >
                Referrals
              </Link>

              <Link
                href="/admin/referrals/settings"
                className={navLinkClasses(pathname === "/admin/referrals/settings")}
              >
                Referral Settings
              </Link>

              <Link
                href="/admin/referrals/commissions"
                className={navLinkClasses(pathname === "/admin/referrals/commissions")}
              >
                Commission Approvals
              </Link>
            </nav>

            <button
              onClick={handleLogout}
              className="mt-6 w-full rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Log out
            </button>
          </div>
        </aside>

        <section className="min-w-0 flex-1">{children}</section>
      </div>
    </main>
  );
}