import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminIdentity } from "@/lib/admin/access";
import { inviteInternshipManager, saveInternshipStaffEligibility } from "@/lib/internship/assignment-actions";
import { canEditRequirements, internshipActorKind } from "@/lib/internship/manager-access";
import { internshipStaffIdentityOk } from "@/lib/internship/staff-eligibility";
import { listInternshipStaffDirectory } from "@/lib/internship/staff";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternshipStaffEligibilityPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  const kind = internshipActorKind({ role: actor?.role, isSuperUser: actor?.isSuperUser });
  if (!actor || !canEditRequirements(kind)) redirect("/admin/login?next=/admin/internship/staff");

  const people = await listInternshipStaffDirectory();
  const params = searchParams ? await searchParams : {};
  const ok = first(params.ok);
  const error = first(params.error);

  return (
    <main className="mx-auto max-w-4xl space-y-4 overflow-x-hidden px-3 pb-10 sm:px-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-3xl font-black text-slate-950">Internship staff eligibility</h1>
        <Link href="/admin/internship/interns" className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
          Intern team
        </Link>
      </div>
      <p className="text-sm font-semibold text-slate-600">
        Add a manager login here. Use their real first and last name and work email. They are marked eligible to manage interns and show up under Assigned manager. Create each intern, including future interns, from the intern team page.
      </p>
      {ok ? <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-900">{ok}</p> : null}
      {error ? <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">{error}</p> : null}
      <form action={inviteInternshipManager} className="grid gap-3 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm sm:grid-cols-2">
        <h2 className="text-lg font-black text-slate-950 sm:col-span-2">Add manager login</h2>
        <label className="block text-sm font-semibold text-slate-800">
          Full name
          <input name="name" required placeholder="First and last name" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base" />
        </label>
        <label className="block text-sm font-semibold text-slate-800">
          Work email
          <input name="email" type="email" required placeholder="name@sitguru.com" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base" />
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800 sm:col-span-2">
          <input type="checkbox" name="invite" defaultChecked className="h-5 w-5" />
          Email a Social Media & Community Growth Manager login
        </label>
        <button className="min-h-12 rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white sm:col-span-2">
          Create manager login
        </button>
      </form>
      {!people.length ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950">
          No staff accounts are available to configure yet.
        </p>
      ) : null}
      <div className="space-y-3">
        {people.map((person) => {
          const ready = internshipStaffIdentityOk({ ...person, canManageInterns: true, canSuperviseInterns: true });
          return (
            <form key={person.id} action={saveInternshipStaffEligibility} className="rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
              <input type="hidden" name="userId" value={person.id} />
              <p className="text-lg font-black text-slate-950">{person.name || "Name missing"}</p>
              <p className="text-sm font-semibold text-slate-600">{person.email || "No email"} · {person.role || "No role"} · {person.active ? "Active" : "Inactive"}</p>
              {!ready ? (
                <p className="mt-2 text-sm font-semibold text-amber-900">
                  This account will stay out of the assignment lists until it has a real first and last name, a work email, and is not a test or customer account.
                </p>
              ) : null}
              <label className="mt-3 block text-sm font-semibold text-slate-800">
                Job title
                <input name="jobTitle" defaultValue={person.jobTitle} placeholder="Title shown in the assignment list" className="mt-1 min-h-12 w-full rounded-xl border border-emerald-100 px-3 text-base" />
              </label>
              <label className="mt-3 flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800">
                <input type="checkbox" name="canManageInterns" defaultChecked={person.canManageInterns} className="h-5 w-5" />
                Eligible to manage interns
              </label>
              <label className="flex min-h-11 items-center gap-3 text-sm font-semibold text-slate-800">
                <input type="checkbox" name="canSuperviseInterns" defaultChecked={person.canSuperviseInterns} className="h-5 w-5" />
                Eligible as formal supervisor
              </label>
              <button className="mt-3 min-h-12 rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white">Save eligibility</button>
            </form>
          );
        })}
      </div>
    </main>
  );
}
