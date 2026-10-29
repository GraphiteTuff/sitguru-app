import Link from "next/link";
import { InternName } from "@/components/portal/PersonFace";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { listGrowthHires } from "@/lib/admin/growth/hire";
import { internPortalPreviewPath } from "@/lib/internship/constants";
import {
  canBrowseAllPortals,
  internshipActorKind,
} from "@/lib/internship/manager-access";
import { listInterns } from "@/lib/internship/queries";
import { listSelectableInternshipStaff } from "@/lib/internship/staff";
import { supabaseAdmin } from "@/lib/supabase/admin";

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

async function browseActor() {
  const actor = await getAdminIdentity();
  if (!actor?.canAccessAdmin) return null;
  const kind = internshipActorKind({
    role: actor.role,
    isSuperUser: actor.isSuperUser,
  });
  const allowed = canBrowseAllPortals({
    actor: kind,
    canAccessAdmin: actor.canAccessAdmin,
    growthOnly: isGrowthOnlyRole(actor.role) && !actor.isSuperUser,
  });
  return allowed ? actor : null;
}

async function growthPeople() {
  const hires = (await listGrowthHires()).filter(
    (hire) => hire.status === "active" && hire.userId,
  );
  const ids = hires.map((hire) => hire.userId);
  const { data } = ids.length
    ? await supabaseAdmin.from("profiles").select("id,full_name,email").in("id", ids)
    : { data: [] };
  const names = new Map(
    (data || []).map((row) => [
      text(row.id),
      text(row.full_name) || text(row.email),
    ]),
  );
  return hires.map((hire) => ({
    userId: hire.userId,
    email: hire.email,
    name: names.get(hire.userId) || hire.email || "Growth manager",
  }));
}

export async function GrowthHireLinks({
  selfHref,
  hrefFor,
  currentUserId,
}: {
  selfHref: string;
  hrefFor: (userId: string) => string;
  currentUserId: string;
}) {
  if (!(await browseActor())) return null;
  const people = await growthPeople();
  if (!people.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={selfHref}
        className={`inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black ${
          currentUserId && !people.some((person) => person.userId === currentUserId)
            ? "bg-[#0D5C3A] !text-white"
            : "border border-emerald-200 bg-white text-emerald-950"
        }`}
      >
        My view
      </Link>
      {people.map((person) => (
        <Link
          key={person.userId}
          href={hrefFor(person.userId)}
          className={`inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black ${
            person.userId === currentUserId
              ? "bg-[#0D5C3A] !text-white"
              : "border border-emerald-200 bg-white text-emerald-950"
          }`}
        >
          {person.name}
        </Link>
      ))}
    </div>
  );
}

export default async function AdminPortalDirectory() {
  const actor = await browseActor();
  if (!actor) return null;

  const [interns, managers, people] = await Promise.all([
    listInterns(),
    listSelectableInternshipStaff("manager"),
    growthPeople(),
  ]);
  const visibleInterns = interns
    .filter((intern) => !intern.isTest)
    .sort((a, b) => (a.preferredName || a.fullName).localeCompare(b.preferredName || b.fullName));

  return (
    <section className="rounded-[1.6rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
        Admin view
      </p>
      <h2 className="mt-1 text-xl font-black text-slate-950">Portals and manager desks</h2>
      <p className="mt-1 text-sm font-semibold text-slate-600">
        Open every intern portal, every manager&apos;s intern desk, and each Growth Manager&apos;s time and onboarding. Preview stays read-only.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link href="/intern/manage" className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
          Every intern desk
        </Link>
        <Link href="/admin/growth" className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-950">
          Growth desk
        </Link>
        <Link href="/admin/growth/messages" className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-950">
          All growth messages
        </Link>
      </div>

      <h3 className="mt-5 text-sm font-black text-slate-950">Manager desks</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {managers.length ? managers.map((manager) => (
          <Link
            key={manager.id}
            href={`/intern/manage?manager=${encodeURIComponent(manager.id)}`}
            className="rounded-2xl border border-emerald-100 bg-[#FAF6EE] px-4 py-3"
          >
            <p className="font-black text-slate-950">{manager.name || manager.email}</p>
            <p className="text-sm font-semibold text-emerald-900">Open this desk</p>
          </Link>
        )) : (
          <p className="text-sm font-semibold text-slate-600">No eligible intern managers yet.</p>
        )}
      </div>

      <h3 className="mt-5 text-sm font-black text-slate-950">Growth managers</h3>
      <div className="mt-2 grid gap-2">
        {people.length ? people.map((person) => (
          <article key={person.userId} className="rounded-2xl border border-emerald-100 px-4 py-3">
            <p className="font-black text-slate-950">{person.name}</p>
            <p className="text-sm font-semibold text-slate-600">{person.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={`/admin/growth/onboarding?user=${encodeURIComponent(person.userId)}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-3 text-sm font-black text-emerald-950">
                Onboarding
              </Link>
              <Link href={`/admin/growth/time?user=${encodeURIComponent(person.userId)}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-3 text-sm font-black text-emerald-950">
                Time
              </Link>
              <Link href={`/intern/manage?manager=${encodeURIComponent(person.userId)}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-3 text-sm font-black text-emerald-950">
                Intern desk
              </Link>
            </div>
          </article>
        )) : (
          <p className="text-sm font-semibold text-slate-600">No active Growth Manager login yet.</p>
        )}
      </div>

      <h3 className="mt-5 text-sm font-black text-slate-950">Intern portals</h3>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {visibleInterns.length ? visibleInterns.map((intern) => (
          <article key={intern.id} className="rounded-2xl border border-emerald-100 px-4 py-3">
            <p className="font-black text-slate-950">
              <InternName name={intern.preferredName || intern.fullName} src={intern.avatarUrl} />
            </p>
            <p className="text-sm font-semibold text-slate-600">{intern.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Link href={internPortalPreviewPath(intern.id)} className="inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-3 text-sm font-black !text-white">
                Portal
              </Link>
              <Link href={`/intern/time?view=${encodeURIComponent(intern.id)}`} className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 px-3 text-sm font-black text-emerald-950">
                Time
              </Link>
            </div>
          </article>
        )) : (
          <p className="text-sm font-semibold text-slate-600">No intern records yet.</p>
        )}
      </div>
    </section>
  );
}
