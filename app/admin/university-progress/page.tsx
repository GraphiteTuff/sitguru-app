import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAcademyProgressDashboardData,
  type AcademyProgressRecord,
} from "@/lib/admin/academyProgressResolver";
import AcademyProgressClient from "./AcademyProgressClient";

export const dynamic = "force-dynamic";

export type { AcademyProgressRecord };

const adminRoutes = {
  hr: "/admin/hr",
  university: "/admin/ambassador-training",
  assignments: "/admin/university-assignments",
};

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(Number.isFinite(value) ? value : 0);
}

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/admin/login");
  }

  return user;
}

export default async function AdminUniversityProgressPage() {
  await requireAdmin();

  const data = await getAcademyProgressDashboardData();

  return (
    <main className="w-full min-w-0 space-y-5">
      <section className="rounded-[28px] border border-green-100 bg-gradient-to-br from-white via-[#f7fbf4] to-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
          <div className="min-w-0">
            <Link
              href={adminRoutes.hr}
              className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-2 text-xs font-black text-green-800 shadow-sm ring-1 ring-green-100 transition hover:bg-green-50 hover:text-green-950 sm:text-sm"
            >
              <ArrowLeft size={16} />
              Back to HR
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-black tracking-tight text-green-950 sm:text-4xl xl:text-5xl">
                Academy Progress Tracker
              </h1>
              <span className="rounded-full bg-green-100 px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-green-800 sm:text-xs">
                SitGuru University
              </span>
            </div>

            <p className="mt-3 max-w-5xl text-sm font-semibold leading-6 text-slate-600 sm:text-base sm:leading-7">
              Review SitGuru University progress across Gurus, Pet Parents, and
              Ambassadors. This page uses the shared Admin people resolver so
              names, photos, emails, and roles stay consistent across Admin.
            </p>
          </div>

          <div className="grid w-full shrink-0 gap-3 sm:grid-cols-2 xl:w-auto">
            <Link
              href={adminRoutes.assignments}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl border border-green-200 bg-white px-5 py-3 text-sm font-black text-green-900 shadow-sm transition hover:bg-green-50"
            >
              <ClipboardCheck size={17} />
              Assignment Manager
            </Link>

            <Link
              href={adminRoutes.university}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-green-800 to-emerald-700 px-5 py-3 text-sm font-black text-white shadow-lg shadow-emerald-900/15 transition hover:brightness-105"
            >
              <GraduationCap size={17} />
              Training Manager
            </Link>
          </div>
        </div>
      </section>

      <section className="grid w-full min-w-0 gap-3 rounded-[28px] border border-green-100 bg-white p-3 shadow-sm sm:grid-cols-2 sm:p-4 lg:grid-cols-5">
        <MetricTile label="Total Assigned" value={number(data.metrics.total)} />
        <MetricTile label="Completed" value={number(data.metrics.completed)} />
        <MetricTile label="In Progress" value={number(data.metrics.inProgress)} />
        <MetricTile label="Not Started" value={number(data.metrics.notStarted)} />
        <MetricTile
          label="Needs Cleanup"
          value={number(data.metrics.needsCleanup)}
          tone={data.metrics.needsCleanup > 0 ? "warning" : "default"}
        />
      </section>

      <section className="grid w-full min-w-0 gap-4 xl:grid-cols-4">
        <SummaryCard
          icon={<CheckCircle2 size={22} />}
          title="Completed Academies"
          value={number(data.metrics.completed)}
          detail="People who reached 100% academy completion."
          tone="green"
        />
        <SummaryCard
          icon={<Clock3 size={22} />}
          title="Still In Progress"
          value={number(data.metrics.inProgress)}
          detail="People who started but have not finished."
          tone="amber"
        />
        <SummaryCard
          icon={<BookOpenCheck size={22} />}
          title="Not Started"
          value={number(data.metrics.notStarted)}
          detail="Assigned people with no recorded progress yet."
          tone="slate"
        />
        <SummaryCard
          icon={<ShieldAlert size={22} />}
          title="Needs Cleanup"
          value={number(data.metrics.needsCleanup)}
          detail="Rows missing a person match, name, email, or profile photo."
          tone="rose"
        />
      </section>

      <AcademyProgressClient
        records={data.records}
        completedRecords={data.completedRecords}
      />
    </main>
  );
}

function MetricTile({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "warning";
}) {
  const toneClasses =
    tone === "warning"
      ? "border-rose-100 bg-rose-50 text-rose-900"
      : "border-green-100 bg-[#fbfcf9] text-green-950";

  return (
    <div className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClasses}`}>
      <p className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-500 sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-2xl font-black sm:text-xl">{value}</p>
    </div>
  );
}

function SummaryCard({
  icon,
  title,
  value,
  detail,
  tone,
}: {
  icon: ReactNode;
  title: string;
  value: string;
  detail: string;
  tone: "green" | "amber" | "slate" | "rose";
}) {
  const styles = {
    green: "border-green-100 bg-green-50 text-green-800",
    amber: "border-amber-100 bg-amber-50 text-amber-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    rose: "border-rose-100 bg-rose-50 text-rose-800",
  };

  return (
    <div className="rounded-[24px] border border-[#e3ece5] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${styles[tone]}`}
        >
          {icon}
        </div>
        <p className="text-3xl font-black text-green-950">{value}</p>
      </div>
      <h2 className="text-xl font-black text-slate-950">{title}</h2>
      <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
        {detail}
      </p>
    </div>
  );
}
