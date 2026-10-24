import Link from "next/link";
import { redirect } from "next/navigation";
import ManagerInternDashboard from "@/components/internship/ManagerInternDashboard";
import { getAdminIdentity } from "@/lib/admin/access";
import { canEditRequirements, canGiveCeoReview, internshipActorKind } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternManagerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await getAdminIdentity();
  if (!actor) redirect("/intern/login?next=/intern/manage");
  const kind = internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <section className="rounded-[1.6rem] border border-rose-100 bg-white p-5">
          <h1 className="text-2xl font-black text-slate-950">Manager access required</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            This desk is for Ava and Jason. Intern records stay private.
          </p>
          <Link href="/intern" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white">
            Intern portal
          </Link>
        </section>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  const data = await loadManagerDashboard({ actorUserId: actor.id, actorKind: kind });
  const ok = first(params.ok);
  const error = first(params.error);

  return (
    <main className="mx-auto w-full max-w-[1100px] overflow-x-hidden px-3 py-4 sm:px-5">
      <ManagerInternDashboard
        cards={data.cards}
        reviews={data.reviews}
        questions={data.questions}
        interns={data.interns}
        canEdit={canEditRequirements(kind)}
        canCeo={canGiveCeoReview(kind)}
        notice={ok ? { kind: "ok", message: ok } : error ? { kind: "error", message: error } : null}
      />
    </main>
  );
}
