"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type BookingRow = {
  id: string;
  price?: number | null;
  status?: string | null;
  booking_date?: string | null;
  created_at?: string | null;
};

type FinanceSnapshotRow = {
  id: string;
  snapshot_date: string;
  gross_booking_volume?: number | null;
  platform_revenue?: number | null;
  guru_payouts?: number | null;
  refunds?: number | null;
  net_revenue?: number | null;
  created_at?: string | null;
};

type ExpenseLedgerRow = {
  id: string;
  expense_date: string;
  category?: string | null;
  vendor?: string | null;
  description?: string | null;
  amount?: number | null;
  payment_method?: string | null;
  notes?: string | null;
  created_at?: string | null;
};

type ChartPoint = {
  label: string;
  value: number;
};

const BREAKEVEN_TARGETS = {
  daily: 250,
  weekly: 1750,
  monthly: 7500,
  yearly: 90000,
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

function money(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function percentOfTarget(value: number, target: number) {
  if (!target) return 0;
  return Math.round((value / target) * 100);
}

function LineChart({
  points,
  stroke = "#10b981",
}: {
  points: ChartPoint[];
  stroke?: string;
}) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const width = 100;
  const height = 50;

  const polyline = points
    .map((point, index) => {
      const x = (index / Math.max(points.length - 1, 1)) * width;
      const y = height - (point.value / max) * height;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div>
      <div className="h-56 rounded-3xl border border-slate-200 bg-slate-50 p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="none">
          <polyline fill="none" stroke={stroke} strokeWidth="2.5" points={polyline} />
        </svg>
      </div>
      <div className="mt-3 flex justify-between text-xs font-medium text-slate-500">
        {points.map((point) => (
          <span key={point.label}>{point.label}</span>
        ))}
      </div>
    </div>
  );
}

function getPeriodRevenueFromBookings(
  bookings: BookingRow[],
  period: "daily" | "weekly" | "monthly" | "yearly",
) {
  const now = new Date();

  return bookings.reduce((sum, booking) => {
    const rawDate = booking.booking_date || booking.created_at;
    if (!rawDate) return sum;

    const bookingDate = new Date(rawDate);
    if (Number.isNaN(bookingDate.getTime())) return sum;

    let include = false;

    if (period === "daily") {
      include =
        bookingDate.getFullYear() === now.getFullYear() &&
        bookingDate.getMonth() === now.getMonth() &&
        bookingDate.getDate() === now.getDate();
    }

    if (period === "weekly") {
      const diffDays = (now.getTime() - bookingDate.getTime()) / (1000 * 60 * 60 * 24);
      include = diffDays >= 0 && diffDays <= 7;
    }

    if (period === "monthly") {
      include =
        bookingDate.getFullYear() === now.getFullYear() &&
        bookingDate.getMonth() === now.getMonth();
    }

    if (period === "yearly") {
      include = bookingDate.getFullYear() === now.getFullYear();
    }

    return include ? sum + Number(booking.price || 0) : sum;
  }, 0);
}

export default function AdminFinancePage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [snapshots, setSnapshots] = useState<FinanceSnapshotRow[]>([]);
  const [expenses, setExpenses] = useState<ExpenseLedgerRow[]>([]);
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

    const [
      { data: bookingRows, error: bookingsError },
      { data: snapshotRows, error: snapshotsError },
      { data: expenseRows, error: expensesError },
    ] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, price, status, booking_date, created_at")
        .order("booking_date", { ascending: false })
        .limit(1000),
      supabase
        .from("finance_snapshots")
        .select(
          "id, snapshot_date, gross_booking_volume, platform_revenue, guru_payouts, refunds, net_revenue, created_at",
        )
        .order("snapshot_date", { ascending: true })
        .limit(365),
      supabase
        .from("expense_ledger")
        .select("id, expense_date, category, vendor, description, amount, payment_method, notes, created_at")
        .order("expense_date", { ascending: false })
        .limit(500),
    ]);

    if (bookingsError || snapshotsError || expensesError) {
      setError(
        bookingsError?.message ||
          snapshotsError?.message ||
          expensesError?.message ||
          "Unable to load finance data.",
      );
      setLoading(false);
      return;
    }

    setBookings((bookingRows as BookingRow[]) || []);
    setSnapshots((snapshotRows as FinanceSnapshotRow[]) || []);
    setExpenses((expenseRows as ExpenseLedgerRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    loadPage();
  }, []);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-finance-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "finance_snapshots" },
        () => {
          void loadPage();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_ledger" },
        () => {
          void loadPage();
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bookings" },
        () => {
          void loadPage();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id]);

  const finance = useMemo(() => {
    const grossBookingVolume =
      snapshots.length > 0
        ? snapshots.reduce((sum, row) => sum + Number(row.gross_booking_volume || 0), 0)
        : bookings.reduce((sum, row) => sum + Number(row.price || 0), 0);

    const platformRevenue =
      snapshots.length > 0
        ? snapshots.reduce((sum, row) => sum + Number(row.platform_revenue || 0), 0)
        : grossBookingVolume * 0.2;

    const guruPayouts =
      snapshots.length > 0
        ? snapshots.reduce((sum, row) => sum + Number(row.guru_payouts || 0), 0)
        : grossBookingVolume * 0.8;

    const refunds =
      snapshots.length > 0
        ? snapshots.reduce((sum, row) => sum + Number(row.refunds || 0), 0)
        : 0;

    const netRevenue =
      snapshots.length > 0
        ? snapshots.reduce((sum, row) => sum + Number(row.net_revenue || 0), 0)
        : platformRevenue - refunds;

    const dailyRevenue =
      snapshots.length > 0
        ? Number(snapshots[snapshots.length - 1]?.platform_revenue || 0)
        : getPeriodRevenueFromBookings(bookings, "daily") * 0.2;

    const weeklyRevenue = getPeriodRevenueFromBookings(bookings, "weekly") * 0.2;
    const monthlyRevenue = getPeriodRevenueFromBookings(bookings, "monthly") * 0.2;
    const yearlyRevenue = getPeriodRevenueFromBookings(bookings, "yearly") * 0.2;

    const totalExpenses = expenses.reduce((sum, row) => sum + Number(row.amount || 0), 0);

    const expenseByCategory = new Map<string, number>();
    expenses.forEach((expense) => {
      const key = expense.category || "Uncategorized";
      expenseByCategory.set(key, (expenseByCategory.get(key) || 0) + Number(expense.amount || 0));
    });

    const topExpenseCategories = Array.from(expenseByCategory.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value]) => ({ label, value }));

    const revenueTrend =
      snapshots.length > 0
        ? snapshots.slice(-8).map((row) => ({
            label: new Date(row.snapshot_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: Number(row.platform_revenue || 0),
          }))
        : [{ label: "Start", value: 0 }];

    const grossTrend =
      snapshots.length > 0
        ? snapshots.slice(-8).map((row) => ({
            label: new Date(row.snapshot_date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            value: Number(row.gross_booking_volume || 0),
          }))
        : [{ label: "Start", value: 0 }];

    const assets = netRevenue;
    const liabilities = guruPayouts;
    const equity = assets - liabilities;

    const projectedMonthlyRevenue = monthlyRevenue * 1.2;
    const projectedQuarterRevenue = projectedMonthlyRevenue * 3;
    const operatingCashFlow = netRevenue - totalExpenses;

    return {
      grossBookingVolume,
      platformRevenue,
      guruPayouts,
      refunds,
      netRevenue,
      dailyRevenue,
      weeklyRevenue,
      monthlyRevenue,
      yearlyRevenue,
      totalExpenses,
      topExpenseCategories,
      revenueTrend,
      grossTrend,
      assets,
      liabilities,
      equity,
      projectedMonthlyRevenue,
      projectedQuarterRevenue,
      operatingCashFlow,
      dailyBreakEvenPercent: percentOfTarget(dailyRevenue, BREAKEVEN_TARGETS.daily),
      weeklyBreakEvenPercent: percentOfTarget(weeklyRevenue, BREAKEVEN_TARGETS.weekly),
      monthlyBreakEvenPercent: percentOfTarget(monthlyRevenue, BREAKEVEN_TARGETS.monthly),
      yearlyBreakEvenPercent: percentOfTarget(yearlyRevenue, BREAKEVEN_TARGETS.yearly),
    };
  }, [bookings, snapshots, expenses]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">Loading finance...</Card>
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
              Finance
            </h1>
            <p className="mt-2 text-slate-600">
              Revenue periods, breakeven analysis, accounting structure, and financial management.
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
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Daily</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{money(finance.dailyRevenue)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {finance.dailyBreakEvenPercent}% of daily target
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Weekly</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{money(finance.weeklyRevenue)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {finance.weeklyBreakEvenPercent}% of weekly target
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Monthly</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{money(finance.monthlyRevenue)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {finance.monthlyBreakEvenPercent}% of monthly target
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Yearly</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{money(finance.yearlyRevenue)}</p>
            <p className="mt-2 text-sm text-slate-600">
              {finance.yearlyBreakEvenPercent}% of yearly target
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Breakeven analysis</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Platform revenue trend</h2>
            <p className="mt-2 text-sm text-slate-600">
              Track revenue movement over time and compare against internal breakeven targets.
            </p>
            <div className="mt-6">
              <LineChart points={finance.revenueTrend} />
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Gross booking volume</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Booking volume trend</h2>
            <p className="mt-2 text-sm text-slate-600">
              Track customer demand and gross booking dollars processed through SitGuru.
            </p>
            <div className="mt-6">
              <LineChart points={finance.grossTrend} stroke="#06b6d4" />
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-4">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Gross Booking Volume</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{money(finance.grossBookingVolume)}</p>
            <p className="mt-2 text-sm text-slate-600">Total booking dollars processed on platform.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Platform Revenue</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{money(finance.platformRevenue)}</p>
            <p className="mt-2 text-sm text-slate-600">Estimated fees retained by SitGuru.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Guru Payouts</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{money(finance.guruPayouts)}</p>
            <p className="mt-2 text-sm text-slate-600">Amount owed or paid to gurus.</p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Refunds</p>
            <p className="mt-3 text-4xl font-black text-slate-900">{money(finance.refunds)}</p>
            <p className="mt-2 text-sm text-slate-600">Refund exposure and customer recovery.</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Balance sheet view</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Snapshot summary</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Assets</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{money(finance.assets)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Liabilities</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{money(finance.liabilities)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Equity</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{money(finance.equity)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Pro forma</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Projected revenue</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Projected next month</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {money(finance.projectedMonthlyRevenue)}
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Projected next quarter</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {money(finance.projectedQuarterRevenue)}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Cash flow</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Operating cash flow</h2>

            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Net revenue</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{money(finance.netRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Expenses</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{money(finance.totalExpenses)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-500">Operating cash flow</p>
                <p className="mt-2 text-2xl font-black text-slate-900">
                  {money(finance.operatingCashFlow)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Expense ledger</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Tax-ready expense categories</h2>
            <p className="mt-2 text-sm text-slate-600">
              Use clear categories for tax preparation and future accounting exports.
            </p>

            <div className="mt-6 grid gap-3">
              {expenses.length > 0 ? (
                expenses.slice(0, 12).map((expense) => (
                  <div key={expense.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-bold text-slate-900">
                          {expense.description || expense.vendor || "Expense entry"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {expense.category || "Uncategorized"} {expense.vendor ? `• ${expense.vendor}` : ""}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatDate(expense.expense_date)} {expense.payment_method ? `• ${expense.payment_method}` : ""}
                        </p>
                      </div>
                      <p className="text-lg font-black text-slate-900">
                        {money(Number(expense.amount || 0))}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No expense entries yet.
                </div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Expense categories</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">Category totals</h2>

            <div className="mt-6 grid gap-3">
              {finance.topExpenseCategories.length > 0 ? (
                finance.topExpenseCategories.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-700">{item.label}</p>
                      <p className="text-sm font-black text-slate-900">{money(item.value)}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No category totals yet.
                </div>
              )}
            </div>

            <div className="mt-6 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <p className="text-sm font-semibold text-slate-700">Accounting integration ready</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                Reserve this section for future QuickBooks, Xero, or accounting export integration.
                Once ready, use this area for sync status, export buttons, and reconciliation tools.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}