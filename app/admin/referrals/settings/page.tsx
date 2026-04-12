"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type ReferralProgramSetting = {
  id: string;
  program_name: string;
  referral_type: "provider_referral" | "customer_referral";
  referred_role: "sitter" | "walker" | "caretaker" | "customer";
  payout_method:
    | "percent_of_platform_fee"
    | "percent_of_booking_total"
    | "fixed_amount";
  percent_value?: number | null;
  fixed_amount?: number | null;
  max_payout_per_booking?: number | null;
  max_payout_per_referred_account?: number | null;
  eligible_completed_bookings: number;
  hold_days: number;
  is_active: boolean;
  notes?: string | null;
  platform_fee_percent?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
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

function formatMoney(value?: number | null) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function getReferralTypeLabel(type?: string | null) {
  if (type === "provider_referral") return "Guru Referral";
  if (type === "customer_referral") return "Customer Referral";
  return type || "—";
}

function getRoleLabel(role?: string | null) {
  if (role === "sitter") return "Sitter";
  if (role === "walker") return "Walker";
  if (role === "caretaker") return "Caretaker";
  if (role === "customer") return "Customer";
  return role || "—";
}

export default function AdminReferralSettingsPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [settings, setSettings] = useState<ReferralProgramSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadPage() {
    setLoading(true);
    setError("");
    setSuccess("");

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      router.push("/admin/login");
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.role !== "admin") {
      await supabase.auth.signOut();
      router.push("/admin/login");
      return;
    }

    setAdminProfile(profile as AdminProfile);

    const { data, error: settingsError } = await supabase
      .from("referral_program_settings")
      .select("*")
      .order("program_name", { ascending: true });

    if (settingsError) {
      setError(settingsError.message);
      setLoading(false);
      return;
    }

    setSettings((data as ReferralProgramSetting[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  function updateLocalSetting<K extends keyof ReferralProgramSetting>(
    id: string,
    field: K,
    value: ReferralProgramSetting[K]
  ) {
    setSettings((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  }

  async function saveSetting(item: ReferralProgramSetting) {
    setSavingId(item.id);
    setError("");
    setSuccess("");

    const payload = {
      program_name: item.program_name,
      referral_type: item.referral_type,
      referred_role: item.referred_role,
      payout_method: item.payout_method,
      percent_value:
        item.payout_method === "fixed_amount" ? null : Number(item.percent_value || 0),
      fixed_amount:
        item.payout_method === "fixed_amount" ? Number(item.fixed_amount || 0) : null,
      max_payout_per_booking: Number(item.max_payout_per_booking || 0),
      max_payout_per_referred_account: Number(item.max_payout_per_referred_account || 0),
      eligible_completed_bookings: Number(item.eligible_completed_bookings || 1),
      hold_days: Number(item.hold_days || 0),
      is_active: Boolean(item.is_active),
      notes: item.notes || null,
      platform_fee_percent: Number(item.platform_fee_percent || 0),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("referral_program_settings")
      .update(payload)
      .eq("id", item.id);

    setSavingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(`Saved ${item.program_name}`);
    await loadPage();
  }

  async function createNewSetting() {
    setError("");
    setSuccess("");

    const { error } = await supabase.from("referral_program_settings").insert({
      program_name: "New Guru Referral Program",
      referral_type: "provider_referral",
      referred_role: "sitter",
      payout_method: "percent_of_platform_fee",
      percent_value: 20,
      fixed_amount: null,
      max_payout_per_booking: 25,
      max_payout_per_referred_account: 50,
      eligible_completed_bookings: 1,
      hold_days: 7,
      is_active: true,
      notes: null,
      platform_fee_percent: 20,
    });

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess("New referral program created");
    await loadPage();
  }

  const grouped = useMemo(() => {
    const guru = settings.filter((s) => s.referral_type === "provider_referral");
    const customer = settings.filter((s) => s.referral_type === "customer_referral");
    return { guru, customer };
  }, [settings]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">
              Loading referral settings...
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-600">SitGuru Admin</p>
            <h1 className="mt-2 text-3xl font-black text-slate-900">
              Referral Program Settings
            </h1>
            <p className="mt-2 text-slate-600">
              Control payout methods, percentages, fixed amounts, caps, and eligibility.
            </p>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/referrals"
              className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Back to Referrals
            </Link>
            <button
              onClick={createNewSetting}
              className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Add Program
            </button>
          </div>
        </div>

        {error ? (
          <Card className="p-4">
            <p className="text-sm font-semibold text-red-700">{error}</p>
          </Card>
        ) : null}

        {success ? (
          <Card className="p-4">
            <p className="text-sm font-semibold text-emerald-700">{success}</p>
          </Card>
        ) : null}

        <Card className="p-6">
          <p className="text-sm font-semibold text-slate-500">Owner access</p>
          <p className="mt-2 text-sm text-slate-700">{adminProfile?.id || "Admin"}</p>
        </Card>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Guru Referral Programs</h2>
            <p className="mt-1 text-slate-600">
              Settings for sitter, walker, and caretaker guru referral incentives.
            </p>
          </div>

          <div className="grid gap-6">
            {grouped.guru.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Program Name
                      </label>
                      <input
                        value={item.program_name}
                        onChange={(e) =>
                          updateLocalSetting(item.id, "program_name", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Referral Type
                        </label>
                        <select
                          value={item.referral_type}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "referral_type",
                              e.target.value as ReferralProgramSetting["referral_type"]
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        >
                          <option value="provider_referral">Guru Referral</option>
                          <option value="customer_referral">Customer Referral</option>
                        </select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Referred Role
                        </label>
                        <select
                          value={item.referred_role}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "referred_role",
                              e.target.value as ReferralProgramSetting["referred_role"]
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        >
                          <option value="sitter">Sitter</option>
                          <option value="walker">Walker</option>
                          <option value="caretaker">Caretaker</option>
                          <option value="customer">Customer</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Payout Method
                      </label>
                      <select
                        value={item.payout_method}
                        onChange={(e) =>
                          updateLocalSetting(
                            item.id,
                            "payout_method",
                            e.target.value as ReferralProgramSetting["payout_method"]
                          )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      >
                        <option value="percent_of_platform_fee">Percent of Platform Fee</option>
                        <option value="percent_of_booking_total">Percent of Booking Total</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>

                    {item.payout_method === "fixed_amount" ? (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Fixed Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.fixed_amount ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(item.id, "fixed_amount", Number(e.target.value))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Percent Value
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.percent_value ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(item.id, "percent_value", Number(e.target.value))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Platform Fee Percent
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.platform_fee_percent ?? 20}
                        onChange={(e) =>
                          updateLocalSetting(item.id, "platform_fee_percent", Number(e.target.value))
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Max Payout Per Booking
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.max_payout_per_booking ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "max_payout_per_booking",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Max Per Referred Account
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.max_payout_per_referred_account ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "max_payout_per_referred_account",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Eligible Completed Bookings
                        </label>
                        <input
                          type="number"
                          value={item.eligible_completed_bookings ?? 1}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "eligible_completed_bookings",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Hold Days
                        </label>
                        <input
                          type="number"
                          value={item.hold_days ?? 7}
                          onChange={(e) =>
                            updateLocalSetting(item.id, "hold_days", Number(e.target.value))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Notes
                      </label>
                      <textarea
                        value={item.notes || ""}
                        onChange={(e) => updateLocalSetting(item.id, "notes", e.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) => updateLocalSetting(item.id, "is_active", e.target.checked)}
                      />
                      <span className="text-sm font-semibold text-slate-700">Program is active</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {getReferralTypeLabel(item.referral_type)}
                    </p>
                    <p className="mt-1">
                      Role: <span className="font-medium">{getRoleLabel(item.referred_role)}</span>
                    </p>
                    <p className="mt-1">
                      Preview:{" "}
                      {item.payout_method === "fixed_amount"
                        ? `${formatMoney(item.fixed_amount)} fixed payout`
                        : `${Number(item.percent_value || 0)}% payout`}
                    </p>
                  </div>

                  <button
                    onClick={() => saveSetting(item)}
                    disabled={savingId === item.id}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingId === item.id ? "Saving..." : "Save Program"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div>
            <h2 className="text-2xl font-black text-slate-900">Customer Referral Programs</h2>
            <p className="mt-1 text-slate-600">
              Settings for direct customer referral incentives and payouts.
            </p>
          </div>

          <div className="grid gap-6">
            {grouped.customer.map((item) => (
              <Card key={item.id} className="p-6">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Program Name
                      </label>
                      <input
                        value={item.program_name}
                        onChange={(e) =>
                          updateLocalSetting(item.id, "program_name", e.target.value)
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Payout Method
                      </label>
                      <select
                        value={item.payout_method}
                        onChange={(e) =>
                          updateLocalSetting(
                            item.id,
                            "payout_method",
                            e.target.value as ReferralProgramSetting["payout_method"]
                          )
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      >
                        <option value="percent_of_platform_fee">Percent of Platform Fee</option>
                        <option value="percent_of_booking_total">Percent of Booking Total</option>
                        <option value="fixed_amount">Fixed Amount</option>
                      </select>
                    </div>

                    {item.payout_method === "fixed_amount" ? (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Fixed Amount
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.fixed_amount ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(item.id, "fixed_amount", Number(e.target.value))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    ) : (
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Percent Value
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.percent_value ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(item.id, "percent_value", Number(e.target.value))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    )}

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Platform Fee Percent
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={item.platform_fee_percent ?? 20}
                        onChange={(e) =>
                          updateLocalSetting(item.id, "platform_fee_percent", Number(e.target.value))
                        }
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Max Payout Per Booking
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.max_payout_per_booking ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "max_payout_per_booking",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Max Per Referred Account
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={item.max_payout_per_referred_account ?? 0}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "max_payout_per_referred_account",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Eligible Completed Bookings
                        </label>
                        <input
                          type="number"
                          value={item.eligible_completed_bookings ?? 1}
                          onChange={(e) =>
                            updateLocalSetting(
                              item.id,
                              "eligible_completed_bookings",
                              Number(e.target.value)
                            )
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-semibold text-slate-700">
                          Hold Days
                        </label>
                        <input
                          type="number"
                          value={item.hold_days ?? 7}
                          onChange={(e) =>
                            updateLocalSetting(item.id, "hold_days", Number(e.target.value))
                          }
                          className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Notes
                      </label>
                      <textarea
                        value={item.notes || ""}
                        onChange={(e) => updateLocalSetting(item.id, "notes", e.target.value)}
                        rows={4}
                        className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-slate-900"
                      />
                    </div>

                    <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={item.is_active}
                        onChange={(e) => updateLocalSetting(item.id, "is_active", e.target.checked)}
                      />
                      <span className="text-sm font-semibold text-slate-700">Program is active</span>
                    </label>
                  </div>
                </div>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                    <p className="font-semibold text-slate-900">
                      {getReferralTypeLabel(item.referral_type)}
                    </p>
                    <p className="mt-1">
                      Role: <span className="font-medium">{getRoleLabel(item.referred_role)}</span>
                    </p>
                    <p className="mt-1">
                      Preview:{" "}
                      {item.payout_method === "fixed_amount"
                        ? `${formatMoney(item.fixed_amount)} fixed payout`
                        : `${Number(item.percent_value || 0)}% payout`}
                    </p>
                  </div>

                  <button
                    onClick={() => saveSetting(item)}
                    disabled={savingId === item.id}
                    className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                  >
                    {savingId === item.id ? "Saving..." : "Save Program"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}