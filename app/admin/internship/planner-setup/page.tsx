import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { readMicrosoftGraphConfig } from "@/lib/microsoft/graph";
import { plannerConfigurationReady } from "@/lib/microsoft/planner-automation";
import { testPlannerAppOnlyConnection } from "./actions";

export const dynamic = "force-dynamic";

export default async function PlannerSetupPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.isSuperUser) redirect("/admin/login");
  const config = readMicrosoftGraphConfig();
  const query = searchParams ? await searchParams : {};
  const first = (key: string) => {
    const value = query[key];
    return String(Array.isArray(value) ? value[0] : value || "").slice(0, 300);
  };
  const result = first("result");
  const planReady = Boolean(config.planId && config.readyBucketId);
  const autoReady = plannerConfigurationReady({
    graphConfigured: config.configured,
    planId: config.planId,
    bucketId: config.readyBucketId,
    enabled: config.plannerAutomationEnabled,
  });

  return (
    <main className="mx-auto max-w-4xl space-y-5 px-4 pb-16">
      <Link href="/admin/internship/portal" className="inline-flex min-h-11 items-center text-sm font-bold text-blue-700">← Internship admin</Link>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <p className="text-xs font-black uppercase tracking-widest text-blue-700">Administrator · Microsoft 365</p>
        <h1 className="mt-2 text-3xl font-black text-slate-950">Microsoft Planner connection</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Verify SitGuru's Microsoft Graph application can write to the shared internship plan.
          This test creates one temporary task in Ready to Start and immediately deletes it.
          It does not modify internship assignments or turn on automatic task creation.
        </p>
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase text-slate-500">Application credentials</dt>
            <dd className="mt-1 text-sm font-black text-slate-950">{config.configured ? "Configured" : "Missing"}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase text-slate-500">Planner plan and bucket</dt>
            <dd className="mt-1 text-sm font-black text-slate-950">{planReady ? "Configured" : "Missing"}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase text-slate-500">Production task automation</dt>
            <dd className="mt-1 text-sm font-black text-slate-950">{autoReady ? "Enabled" : "Disabled (safe)"}</dd>
          </div>
          <div className="rounded-2xl bg-slate-50 p-4">
            <dt className="text-xs font-bold uppercase text-slate-500">Target bucket</dt>
            <dd className="mt-1 text-sm font-black text-slate-950">Ready to Start</dd>
          </div>
        </dl>
        <a href="https://planner.cloud.microsoft/ui/web/plan/0RlWrqHLSky2BFoyHLH21WUAGqtx/view/board" target="_blank" rel="noreferrer" className="mt-4 inline-flex text-sm font-bold text-blue-700 underline">
          Open internship Planner board
        </a>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <h2 className="text-xl font-black text-slate-950">Test app-only task creation and cleanup</h2>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          This uses the registered SitGuru application credentials, not your personal Microsoft 365 login.
          If cleanup fails, this page will show the test task ID so you can delete the temporary item.
        </p>
        {result === "pass" ? (
          <p role="status" className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">
            Test passed. {first("message")}
          </p>
        ) : result === "fail" ? (
          <p role="alert" className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-900">
            Test needs attention: {first("message")}
            {first("taskId") ? ` Temporary task ID: ${first("taskId")}` : ""}
          </p>
        ) : null}
        <form action={testPlannerAppOnlyConnection} className="mt-5">
          <button type="submit" disabled={!config.configured || !planReady} className="inline-flex min-h-12 items-center rounded-full bg-blue-700 px-5 text-sm font-black !text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-300">
            Test Microsoft Planner connection
          </button>
        </form>
        <p className="mt-3 text-xs font-medium text-slate-500">Available only to SitGuru super administrators. Automatic task creation is controlled separately in Vercel.</p>
      </section>
    </main>
  );
}
