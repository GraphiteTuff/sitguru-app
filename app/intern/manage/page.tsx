import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import InternTeamDesk from "@/components/internship/InternTeamDesk";
import { getAdminIdentity } from "@/lib/admin/access";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";
import { canEditRequirements, canGiveCeoReview, internshipActorKind, isPortalUserId } from "@/lib/internship/manager-access";
import { loadManagerDashboard } from "@/lib/internship/manager-data";
import { internReadiness } from "@/lib/onboarding/data";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Growth Manager login used for Ava's assigned intern desk preview. */
const AVA_MANAGER_EMAIL = "ava@sitguru.com";

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
  const founderPersonal = isFounderPersonalMarketplaceEmail(actor.email);
  // Founder personal marketplace preview uses supervisor visibility so Jason can
  // open Ava's assigned desk (manager filter) without becoming HQ Super Admin.
  const kind = founderPersonal
    ? "supervisor"
    : internshipActorKind({ role: actor.role, isSuperUser: actor.isSuperUser });
  if (kind !== "manager" && kind !== "supervisor") {
    return (
      <main className="mx-auto max-w-lg px-4 py-10">
        <section className="overflow-hidden rounded-[2rem] border border-rose-100 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.08)]">
          <h1 className="text-2xl font-black text-slate-950">Manager access required</h1>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            This desk is for assigned intern managers and the formal supervisor. Intern records stay private.
          </p>
          <Link href="/intern" className="mt-4 inline-flex min-h-11 items-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white transition hover:bg-[#102417]">
            Intern portal
          </Link>
        </section>
      </main>
    );
  }

  const params = searchParams ? await searchParams : {};
  let requestedManager = kind === "supervisor" ? first(params.manager) : "";
  if (founderPersonal && !requestedManager) {
    const { data: avaProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", AVA_MANAGER_EMAIL)
      .maybeSingle();
    if (avaProfile?.id && isPortalUserId(String(avaProfile.id))) {
      redirect(`/intern/manage?manager=${avaProfile.id}`);
    }
  }
  const managerFilter = isPortalUserId(requestedManager) ? requestedManager : "";
  const managerProfile = managerFilter
    ? await supabaseAdmin.from("profiles").select("full_name,email").eq("id", managerFilter).maybeSingle()
    : { data: null };
  const managerName = String(managerProfile.data?.full_name || managerProfile.data?.email || "this manager");
  const data = await loadManagerDashboard({
    actorUserId: actor.id,
    actorKind: kind,
    managerUserId: managerFilter || null,
  });
  const ok = first(params.ok);
  const error = first(params.error);
  const readiness = await Promise.all(
    data.interns.map(async (intern) => ({
      id: intern.id,
      name: intern.fullName,
      userId: intern.userId,
      onboarding: intern.userId ? await internReadiness(intern.userId) : null,
    })),
  );
  const internIds = data.interns.map((intern) => intern.id);
  const waiting = internIds.length
    ? await supabaseAdmin.from("timekeeper_weeks").select("intern_id,week_number,status").eq("status", "submitted").in("intern_id", internIds)
    : { data: [] };
  const byId = new Map(data.interns.map((intern) => [intern.id, intern]));
  const avatarFor = (internId: string) => byId.get(internId)?.avatarUrl || "";
  const nameFor = (internId: string, fallback: string) => {
    const intern = byId.get(internId);
    return intern ? intern.preferredName || intern.fullName : fallback;
  };
  const required = data.cards.reduce((sum, card) => sum + Number(card.summary.requiredHours || 0), 0);
  const approved = data.cards.reduce((sum, card) => sum + Number(card.summary.approvedHours || 0), 0);
  const requirementPending = data.cards.some((card) => card.summary.pendingRequirement) || required <= 0;
  const openQuestions = data.questions.filter((item) => item.status === "open");
  const todayLabel = new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/New_York",
  });

  return (
    <Suspense fallback={<div className="min-h-40" />}>
    <InternTeamDesk
      todayLabel={todayLabel}
      managerNote={managerFilter ? `${managerName}'s intern desk.` : ""}
      supervisorNote={!managerFilter && kind === "supervisor"}
      canEdit={!founderPersonal && canEditRequirements(kind)}
      canCeo={!founderPersonal && canGiveCeoReview(kind)}
      notice={ok ? { kind: "ok", message: ok } : error ? { kind: "error", message: error } : null}
      activeInterns={data.interns.length}
      openReviews={(waiting.data || []).length + data.reviews.length}
      openQuestions={openQuestions.length}
      completionLabel={requirementPending ? "Pending" : `${Math.min(100, Math.round((approved / required) * 100))}%`}
      completionDetail={requirementPending ? "University hours are not confirmed yet" : `${approved} approved of ${required} required`}
      interns={data.interns.map((intern) => {
        const card = data.cards.find((item) => item.id === intern.id);
        const ready = readiness.find((item) => item.id === intern.id);
        const attention = card?.paceTone === "behind" || (card?.awaitingReview || 0) > 0;
        return {
          id: intern.id,
          userId: intern.userId || "",
          name: intern.preferredName || intern.fullName,
          avatarUrl: intern.avatarUrl || "",
          role: intern.internshipTitle || intern.academicProgram || card?.role || "Intern",
          focus: card?.currentAssignment || card?.milestone || "No current assignment",
          hoursLabel: card?.summary.pendingRequirement
            ? "Requirement pending"
            : `${card?.summary.approvedHours ?? 0} / ${card?.summary.requiredHours ?? "—"}`,
          status: card?.paceLabel || intern.status.replaceAll("_", " "),
          attention,
          onboarding: ready?.onboarding
            ? `Onboarding ${ready.onboarding.percent}% · status only, no personnel files`
            : "Onboarding package not assigned",
          onboardingItems: ready?.onboarding?.items.map((item) => ({ title: item.title, status: item.status })) || [],
          credits: intern.credits,
          requiredHours: intern.requiredHours,
          plannedWeeklyHours: intern.plannedWeeklyHours ?? null,
          internshipWeeks: intern.internshipWeeks ?? null,
          academicStartDate: intern.academicStartDate || "",
          academicEndDate: intern.academicEndDate || "",
          semester: intern.semester || "",
          academicYear: intern.academicYear || "",
          requirementStatus: intern.requirementStatus || "pending",
          universityVerificationStatus: intern.universityVerificationStatus || "pending",
          dayToDayManagerName: intern.dayToDayManagerName || "Ava",
          siteSupervisorName: intern.siteSupervisorName || "Jason",
          universityNotes: intern.universityNotes || "",
        };
      })}
      reviews={data.reviews.map((item) => ({
        id: item.id,
        internId: item.internId,
        internName: nameFor(item.internId, item.internName),
        avatarUrl: avatarFor(item.internId),
        targetType: item.targetType,
        title: item.title,
        weekLabel: item.weekLabel,
        submittedAt: item.submittedAt,
        hours: item.hours,
        statusLabel: item.statusLabel,
        evidence: item.evidence,
        ceo: item.ceo,
      }))}
      questions={data.questions.map((item) => ({
        id: item.id,
        internId: item.internId,
        internName: nameFor(item.internId, item.internName),
        avatarUrl: avatarFor(item.internId),
        question: item.question,
        status: item.status,
        urgency: item.urgency,
        targetTitle: item.targetTitle || "",
        askedAt: item.askedAt,
        answer: item.answer || "",
      }))}
      weeks={(waiting.data || []).map((week) => ({
        internId: String(week.intern_id),
        weekNumber: String(week.week_number),
        internName: nameFor(String(week.intern_id), "Intern"),
        avatarUrl: avatarFor(String(week.intern_id)),
      }))}
      notices={data.notices}
      activity={[
        ...data.reviews.slice(0, 4).map((item) => ({
          id: item.id,
          name: nameFor(item.internId, item.internName),
          avatarUrl: avatarFor(item.internId),
          text: `${nameFor(item.internId, item.internName)} · ${item.title}`,
          when: item.submittedAt ? item.submittedAt.slice(0, 10) : item.statusLabel,
        })),
        ...openQuestions.slice(0, 2).map((item) => ({
          id: item.id,
          name: nameFor(item.internId, item.internName),
          avatarUrl: avatarFor(item.internId),
          text: item.question,
          when: item.askedAt ? item.askedAt.slice(0, 10) : "Open",
        })),
      ]}
    />
    </Suspense>
  );
}
