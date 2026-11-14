import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CreditCard, GraduationCap, Users } from "lucide-react";
import { getAdminIdentity } from "@/lib/admin/access";
import { listActiveEngagements, listCompensationRates } from "@/lib/staff-time/engagement";
import { currentRate } from "@/lib/staff-time/rates";
import { isoToday } from "@/lib/staff-time/periods";
import { GrowthPageFrame } from "@/components/admin/growth/GrowthPageFrame";
import StaffPeopleDirectory, { type StaffPeopleRow } from "@/components/admin/hr/StaffPeopleDirectory";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function AdminPeoplePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) redirect("/admin/login?next=/admin/hr/people");
  const params = searchParams ? await searchParams : {};
  const today = isoToday();

  const engagements = await listActiveEngagements();
  const people: StaffPeopleRow[] = await Promise.all(
    engagements.map(async (engagement) => {
      const rates = await listCompensationRates(engagement.id);
      const rate = currentRate(rates, today);
      return {
        id: engagement.id,
        userId: engagement.userId,
        displayName: engagement.displayName,
        title: engagement.title,
        email: engagement.email,
        classification: engagement.employmentClassification,
        weeklyMin: engagement.expectedWeeklyMinHours,
        weeklyMax: engagement.expectedWeeklyMaxHours,
        cadence: engagement.paymentCadence,
        startOn: engagement.startOn,
        w9Status: engagement.w9Status,
        rateCents: rate?.hourlyRateCents ?? null,
      };
    }),
  );

  const w9Received = people.filter((person) => person.w9Status === "received").length;
  const ratesSet = people.filter((person) => person.rateCents != null).length;
  const classifiedContractors = people.filter((person) => person.classification.toLowerCase() === "contractor").length;

  return (
    <div className="admin-desk-surface">
    <GrowthPageFrame
      variant="desk"
      kicker="Admin HQ · People & Administration"
      title="Team Members"
      detail="Review active engagements, compensation setup, W-9 readiness and payment coordination in one organized workspace."
      action={
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/hr" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-black text-[#0F2744]">
            <ArrowLeft size={16} aria-hidden="true" /> HR Overview
          </Link>
          <Link href="/admin/hr/people/payments" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#2563EB] px-4 text-sm font-black !text-white hover:bg-[#1D4ED8]">
            <CreditCard size={16} aria-hidden="true" /> Payments
          </Link>
        </div>
      }
    >
      <section aria-label="Team summary" className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Active engagements", value: people.length, help: "Team members with active staff engagements", theme: "border-[#DBEAFE] bg-[#EFF6FF] text-[#1D4ED8]" },
          { label: "Rates configured", value: `${ratesSet}/${people.length}`, help: "Have a current effective hourly rate", theme: "border-[#DCFCE7] bg-[#F0FDF4] text-[#166534]" },
          { label: "W-9 received", value: `${w9Received}/${people.length}`, help: "Status only; private tax data hidden", theme: "border-[#FFEDD5] bg-[#FFF7ED] text-[#C2410C]" },
          { label: "Contractor engagements", value: classifiedContractors, help: "Classification from staff engagement records", theme: "border-[#EDE9FE] bg-[#F5F3FF] text-[#6D28D9]" },
        ].map((stat) => (
          <article key={stat.label} className={`rounded-2xl border p-4 shadow-sm ${stat.theme}`}>
            <p className="text-[11px] font-black uppercase tracking-wider">{stat.label}</p>
            <p className="mt-2 text-3xl font-black">{stat.value}</p>
            <p className="mt-1 text-xs font-medium text-slate-600">{stat.help}</p>
          </article>
        ))}
      </section>

      {first(params.ok) ? <p role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{first(params.ok)}</p> : null}
      {first(params.error) ? <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-900">{first(params.error)}</p> : null}

      <StaffPeopleDirectory people={people} today={today} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Link href="/admin/internship/interns" className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#0F2744] shadow-sm hover:bg-[#EFF6FF]">
          <GraduationCap className="text-[#2563EB]" size={19} aria-hidden="true" /> Manage student interns
        </Link>
        <Link href="/admin/hr" className="flex min-h-16 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-[#0F2744] shadow-sm hover:bg-[#EFF6FF]">
          <Users className="text-[#0D5C3A]" size={19} aria-hidden="true" /> Full HR workforce directory
        </Link>
      </div>
    </GrowthPageFrame>
    </div>
  );
}
