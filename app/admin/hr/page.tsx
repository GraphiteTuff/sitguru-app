"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

type AdminProfile = {
  id: string;
  role?: string | null;
};

type HREmployeeRow = {
  id: string;
  profile_id?: string | null;
  full_name: string;
  department: string;
  role_title: string;
  employment_status?: string | null;
  location?: string | null;
  start_date?: string | null;
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

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusClasses(status?: string | null) {
  const value = String(status || "").toLowerCase();

  if (value === "active") return "border border-emerald-200 bg-emerald-50 text-emerald-700";
  if (value === "leave") return "border border-amber-200 bg-amber-50 text-amber-700";
  if (value === "inactive") return "border border-slate-200 bg-slate-100 text-slate-700";

  return "border border-slate-200 bg-slate-100 text-slate-700";
}

export default function AdminHrPage() {
  const router = useRouter();

  const [adminProfile, setAdminProfile] = useState<AdminProfile | null>(null);
  const [employees, setEmployees] = useState<HREmployeeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

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

    const { data, error: employeesError } = await supabase
      .from("hr_employees")
      .select(
        "id, profile_id, full_name, department, role_title, employment_status, location, start_date, created_at, updated_at"
      )
      .order("created_at", { ascending: false });

    if (employeesError) {
      setError(employeesError.message);
      setLoading(false);
      return;
    }

    setEmployees((data as HREmployeeRow[]) || []);
    setLoading(false);
  }

  useEffect(() => {
    void loadPage();
  }, []);

  useEffect(() => {
    if (!adminProfile?.id) return;

    const channel = supabase
      .channel("admin-hr-live")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "hr_employees" },
        () => {
          void loadPage();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [adminProfile?.id]);

  const filteredEmployees = useMemo(() => {
    return employees.filter((employee) => {
      const haystack = [
        employee.full_name,
        employee.department,
        employee.role_title,
        employee.location,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesQuery = !query.trim() || haystack.includes(query.toLowerCase());
      const matchesDepartment =
        departmentFilter === "all" ||
        String(employee.department || "").toLowerCase() === departmentFilter;
      const matchesStatus =
        statusFilter === "all" ||
        String(employee.employment_status || "").toLowerCase() === statusFilter;

      return matchesQuery && matchesDepartment && matchesStatus;
    });
  }, [employees, query, departmentFilter, statusFilter]);

  const stats = useMemo(() => {
    return {
      total: employees.length,
      active: employees.filter((e) => String(e.employment_status || "").toLowerCase() === "active")
        .length,
      onLeave: employees.filter((e) => String(e.employment_status || "").toLowerCase() === "leave")
        .length,
      inactive: employees.filter((e) => String(e.employment_status || "").toLowerCase() === "inactive")
        .length,
      executive: employees.filter((e) => String(e.department || "").toLowerCase() === "executive")
        .length,
      support: employees.filter((e) => String(e.department || "").toLowerCase() === "support")
        .length,
      tech: employees.filter((e) => String(e.department || "").toLowerCase() === "tech")
        .length,
    };
  }, [employees]);

  const departmentBreakdown = useMemo(() => {
    const map = new Map<string, number>();

    employees.forEach((employee) => {
      const key = employee.department || "unknown";
      map.set(key, (map.get(key) || 0) + 1);
    });

    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [employees]);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-8">
            <p className="text-lg font-semibold text-slate-900">Loading HR / People Ops...</p>
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
              HR / People Ops
            </h1>
            <p className="mt-2 max-w-4xl text-slate-600">
              Internal HQ people operations, staffing visibility, operational role tracking, and
              foundational HR structure to help keep SitGuru organized, viable, and legally supported
              as the company grows.
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
            <p className="text-sm font-semibold text-slate-500">HQ Users</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.total}</p>
            <p className="mt-2 text-sm text-slate-600">Internal employee and HQ records</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Active Staff</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.active}</p>
            <p className="mt-2 text-sm text-slate-600">Currently active team members</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">On Leave</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.onLeave}</p>
            <p className="mt-2 text-sm text-slate-600">Temporary staffing gaps or leave tracking</p>
          </Card>

          <Card className="p-5">
            <p className="text-sm font-semibold text-slate-500">Inactive</p>
            <p className="mt-3 text-3xl font-black text-slate-900">{stats.inactive}</p>
            <p className="mt-2 text-sm text-slate-600">Historical or disabled internal accounts</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">People ops controls</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">HR structure and operational readiness</h2>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Compliance support</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Track internal staff roles, access levels, and team coverage so legal, finance,
                  support, and tech functions are clearly assigned.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Guru and customer support readiness</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  A stable people-ops layer helps SitGuru support gurus, customers, and vendors
                  with clear ownership across departments.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Hiring visibility</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  Keep a simple current-state record of the teams you have now and the staffing
                  categories you may need next.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Future HR expansion</p>
                <p className="mt-2 text-sm leading-7 text-slate-600">
                  This page can later expand into onboarding, policy acknowledgements, payroll handoff,
                  compliance tasks, and employee documentation workflows.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Department breakdown</p>
            <h2 className="mt-2 text-2xl font-black text-slate-900">HQ team distribution</h2>

            <div className="mt-6 space-y-3">
              {departmentBreakdown.length > 0 ? (
                departmentBreakdown.map(([department, count]) => (
                  <div
                    key={department}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 p-4"
                  >
                    <p className="text-sm font-semibold capitalize text-slate-700">{department}</p>
                    <p className="text-lg font-black text-slate-900">{count}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-500">
                  No department records yet.
                </div>
              )}
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">Executive</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.executive}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">Support</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.support}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold text-slate-500">Tech</p>
                <p className="mt-2 text-2xl font-black text-slate-900">{stats.tech}</p>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-6">
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_220px_220px]">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search employee, department, title, or location"
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            />

            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All departments</option>
              <option value="executive">Executive</option>
              <option value="sales">Sales</option>
              <option value="support">Support</option>
              <option value="hr">HR</option>
              <option value="legal">Legal</option>
              <option value="tech">Tech</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none focus:border-emerald-500"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="leave">Leave</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredEmployees.length > 0 ? (
            filteredEmployees.map((employee) => (
              <Card key={employee.id} className="p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-black text-slate-900">{employee.full_name}</h2>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                          employee.employment_status
                        )}`}
                      >
                        {employee.employment_status || "active"}
                      </span>
                    </div>

                    <p className="mt-2 text-sm font-semibold capitalize text-emerald-700">
                      {employee.department}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">{employee.role_title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {employee.location || "Location not listed"}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">Start Date</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">{formatDate(employee.start_date)}</p>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold text-slate-500">Record Updated</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formatDate(employee.updated_at || employee.created_at)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-8 text-center">
              <h3 className="text-xl font-black text-slate-900">No employee records found</h3>
              <p className="mt-2 text-sm text-slate-600">Try another search or filter.</p>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Legal / viability support</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Compliance foundation</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              Keep clear internal role ownership for admin access, support escalation, guru
              review, customer protection, and vendor-facing business operations.
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Guru and customer support</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Operational continuity</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              HR structure helps ensure there is accountable staffing behind guru support, customer
              support, trust and safety, finance follow-up, and internal process ownership.
            </p>
          </Card>

          <Card className="p-6">
            <p className="text-sm font-semibold text-slate-500">Vendor readiness</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900">Growth-ready HQ ops</h3>
            <p className="mt-4 text-sm leading-7 text-slate-600">
              As SitGuru grows, this people-ops foundation can support vendor records, payroll
              workflows, hiring pipelines, policy acknowledgements, and internal permissions.
            </p>
          </Card>
        </div>
      </div>
    </main>
  );
}