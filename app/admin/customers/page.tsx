import Link from "next/link";
import {
  Archive,
  CalendarDays,
  Download,
  MapPin,
  PawPrint,
  Phone,
  UserRound,
} from "lucide-react";
import { AdminThemeCard } from "@/components/admin/AdminThemeCard";
import { getAdminIdentity } from "@/lib/admin/access";
import {
  getPetParentSummary,
  isNewPetParent,
} from "@/lib/admin/customers/pet-parents";
import PetParentAlertPulse from "@/components/admin/customers/PetParentAlertPulse";

export const dynamic = "force-dynamic";

function number(value: number) {
  return new Intl.NumberFormat("en-US").format(value);
}

function when(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminCustomersPage() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) {
    return (
      <div className="mx-auto max-w-xl rounded-[1.75rem] border border-rose-100 bg-white p-6">
        <h1 className="text-2xl font-black text-slate-950">Admin access required.</h1>
        <p className="mt-2 text-sm font-semibold text-slate-600">
          Sign in with an HQ account to review Pet Parents.
        </p>
      </div>
    );
  }

  const summary = await getPetParentSummary();
  const newest = summary.newest;

  const kpis = [
    { label: "Pet Parents", value: number(summary.total), helper: "Live accounts, Gurus excluded", tone: "emerald" as const, icon: <UserRound size={18} /> },
    { label: "New 24 hours", value: number(summary.new24h), helper: "Just registered", tone: "amber" as const, icon: <PawPrint size={18} /> },
    { label: "New this week", value: number(summary.new7d), helper: "Last 7 days", tone: "sky" as const, icon: <CalendarDays size={18} /> },
    { label: "With pets", value: number(summary.withPets), helper: "Profiles that added a pet", tone: "emerald" as const, icon: <PawPrint size={18} /> },
    { label: "With bookings", value: number(summary.withBookings), helper: "Have used SitGuru", tone: "violet" as const, icon: <CalendarDays size={18} /> },
    { label: "Need follow-up", value: number(summary.incomplete), helper: "Missing pet, phone, or location", tone: "rose" as const, icon: <Phone size={18} /> },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <section
        className="public-dark-section rounded-[1.75rem] p-5 sm:p-7"
        data-brand-green
        style={{ background: "#0D5C3A" }}
      >
        <p className="text-xs font-black uppercase tracking-[0.24em] !text-white">
          Human Resources · Registry
        </p>
        <h1 className="mt-3 text-3xl font-black !text-white sm:text-4xl">
          Pet Parents
        </h1>
        <p className="mt-3 max-w-3xl text-sm font-semibold leading-6 !text-white/90">
          Real SitGuru accounts only — not waitlist rows, not Gurus, not test
          users. New registrations land here and ping the HQ bell.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/admin/customer-intelligence"
            className="inline-flex min-h-12 items-center rounded-2xl bg-white px-4 text-sm font-black text-[#0D5C3A]"
          >
            Full intelligence
          </Link>
          <Link
            href="/admin/customers/archive"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/15 px-4 text-sm font-black !text-white"
          >
            <Archive size={16} />
            Archive
          </Link>
          <Link
            href="/admin/customer-intelligence/export"
            className="inline-flex min-h-12 items-center gap-2 rounded-2xl bg-white/15 px-4 text-sm font-black !text-white"
          >
            <Download size={16} />
            Export
          </Link>
        </div>
      </section>

      <PetParentAlertPulse initialNew24h={summary.new24h} />

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {kpis.map((tile) => (
          <AdminThemeCard
            key={tile.label}
            label={tile.label}
            value={tile.value}
            helper={tile.helper}
            tone={tile.tone}
            icon={tile.icon}
          />
        ))}
      </section>

      <section
        id="new"
        className="rounded-[1.5rem] border border-emerald-100 bg-white p-5 shadow-sm"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
              Incoming
            </p>
            <h2 className="text-lg font-black text-slate-950">Newest Pet Parents</h2>
            <p className="mt-1 text-sm font-semibold text-slate-600">
              {summary.new7d} this week · {summary.withPhone} have a phone ·{" "}
              {summary.withLocation} have a location
            </p>
          </div>
          <Link
            href="/admin/customer-intelligence"
            className="text-sm font-black text-emerald-800"
          >
            Browse all →
          </Link>
        </div>

        <div className="mt-4 space-y-3">
          {newest.map((parent) => (
            <Link
              key={parent.id}
              href={`/admin/customers/${parent.id}`}
              className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-black text-slate-950">{parent.name}</p>
                  {isNewPetParent(parent.createdAt) ? (
                    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-amber-900">
                      New
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 truncate text-xs font-semibold text-slate-500">
                  {parent.email || "No email yet"}
                  {parent.phone ? ` · ${parent.phone}` : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-bold text-slate-600">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {parent.city || parent.zipCode || "Location TBD"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <PawPrint size={12} />
                    {parent.petCount} pet{parent.petCount === 1 ? "" : "s"}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <CalendarDays size={12} />
                    {parent.bookingCount} booking{parent.bookingCount === 1 ? "" : "s"}
                  </span>
                  {parent.phone ? (
                    <span className="inline-flex items-center gap-1">
                      <Phone size={12} />
                      Phone on file
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">
                  Registered
                </p>
                <p className="mt-1 text-sm font-black text-slate-800">
                  {when(parent.createdAt)}
                </p>
                <p className="mt-1 text-xs font-semibold text-slate-500">
                  {parent.source}
                </p>
              </div>
            </Link>
          ))}
          {newest.length === 0 ? (
            <p className="text-sm font-semibold text-slate-600">
              No live Pet Parents yet. New signups will appear here and alert HQ.
            </p>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
        <Link
          href="/admin/customer-intelligence"
          className="flex min-h-20 items-center gap-3 rounded-[1.4rem] border border-emerald-100 bg-white px-4 shadow-sm"
        >
          <UserRound className="h-10 w-10 text-[#0D5C3A]" />
          <span>
            <span className="block font-black text-slate-950">Value & sources</span>
            <span className="text-sm font-semibold text-slate-500">
              Lifetime spend, repeat rate, social
            </span>
          </span>
        </Link>
        <Link
          href="/admin/bookings"
          className="flex min-h-20 items-center gap-3 rounded-[1.4rem] border border-emerald-100 bg-white px-4 shadow-sm"
        >
          <CalendarDays className="h-10 w-10 text-[#0D5C3A]" />
          <span>
            <span className="block font-black text-slate-950">Bookings</span>
            <span className="text-sm font-semibold text-slate-500">
              Who is actually using SitGuru
            </span>
          </span>
        </Link>
        <Link
          href="/admin/customers/archive"
          className="flex min-h-20 items-center gap-3 rounded-[1.4rem] border border-emerald-100 bg-white px-4 shadow-sm"
        >
          <Archive className="h-10 w-10 text-[#0D5C3A]" />
          <span>
            <span className="block font-black text-slate-950">Cleanup</span>
            <span className="text-sm font-semibold text-slate-500">
              Archive, spam, and incomplete
            </span>
          </span>
        </Link>
      </section>
    </div>
  );
}
