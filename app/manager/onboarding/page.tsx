import Link from "next/link";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { requireGrowthWorkplace } from "@/lib/admin/growth/workplace";
import { GrowthHireLinks } from "@/components/admin/AdminPortalDirectory";
import { GrowthPageFrame, GrowthCard } from "@/components/admin/growth/GrowthPageFrame";
import {
  confirmOnboardingReview,
  followOnboardingSignature,
  openOnboardingDocument,
  startOnboardingReview,
} from "@/lib/onboarding/actions";
import { COMMUNICATIONS_POLICY } from "@/lib/onboarding/communications-policy";
import { loadOnboardingForUser } from "@/lib/onboarding/data";
import { internshipActorKind, staffPreviewUserId } from "@/lib/internship/manager-access";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function ManagerOnboardingPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const access = await requireGrowthWorkplace("manager");
  if (!access.ok) return access.ui;
  const params = searchParams ? await searchParams : {};
  const notice = first(params.ok) || first(params.error);
  const error = Boolean(first(params.error));
  const admin = await getAdminIdentity();
  const kind = internshipActorKind({ role: admin?.role, isSuperUser: admin?.isSuperUser });
  const subjectId = staffPreviewUserId({
    actor: kind,
    canAccessAdmin: admin?.canAccessAdmin,
    growthOnly: Boolean(admin && isGrowthOnlyRole(admin.role) && !admin.isSuperUser),
    actorUserId: access.actor.id,
    requestedUserId: first(params.user),
  });
  const viewingOther = subjectId !== access.actor.id;
  const subject = viewingOther
    ? await supabaseAdmin.from("profiles").select("full_name,email").eq("id", subjectId).maybeSingle()
    : { data: null };
  const subjectName = String(subject.data?.full_name || subject.data?.email || "this person");
  const workspace = await loadOnboardingForUser(subjectId);

  return (
    <GrowthPageFrame
      kicker={viewingOther ? "Admin view" : "Your onboarding"}
      title={viewingOther ? subjectName : "Welcome to SitGuru"}
      detail={viewingOther
        ? "This is their onboarding status. Reviews and signatures stay on their login. Open a file here without marking it reviewed."
        : "Complete the items below. SitGuru tracks the checklist. Legally significant signatures happen with an approved signature provider, and the executed copies stay in the restricted personnel folder."}
    >
      <GrowthHireLinks
        selfHref="/manager/onboarding"
        hrefFor={(userId) => `/manager/onboarding?user=${encodeURIComponent(userId)}`}
        currentUserId={subjectId}
      />
      {notice ? (
        <p className={`rounded-2xl px-4 py-3 text-sm font-semibold ${error ? "bg-rose-50 text-rose-800" : "bg-emerald-50 text-emerald-900"}`}>
          {notice}
        </p>
      ) : null}
      {!workspace ? (
        <GrowthCard>
          <h2 className="text-xl font-black text-slate-950">No package assigned yet</h2>
          <p className="mt-2 text-sm font-semibold text-slate-600">
            When the founder assigns your onboarding, the agreement, reviews, and acknowledgment will show up here.
          </p>
        </GrowthCard>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <GrowthCard>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Progress</p>
              <p className="mt-1 text-3xl font-black text-slate-950">{workspace.percent}%</p>
            </GrowthCard>
            <GrowthCard>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-800">Status</p>
              <p className="mt-1 text-xl font-black text-slate-950">
                {workspace.complete ? "Onboarding complete" : "In progress"}
              </p>
              {workspace.completedAt ? (
                <p className="mt-1 text-sm font-semibold text-slate-600">
                  Completed {workspace.completedAt.slice(0, 10)}
                </p>
              ) : null}
            </GrowthCard>
          </div>
          <div className="grid gap-3">
            {workspace.items.map((item) => (
              <GrowthCard key={item.id}>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">{item.title}</h2>
                    <p className="mt-1 text-xs font-black uppercase tracking-[0.12em] text-emerald-800">
                      {item.versionLabel} · {item.statusText}
                    </p>
                  </div>
                </div>
                {item.title.includes("Messaging") ? (
                  <div className="mt-3 space-y-2 text-sm font-semibold leading-6 text-slate-700">
                    {COMMUNICATIONS_POLICY.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </div>
                ) : null}
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {viewingOther && kind === "supervisor" && item.fileHref ? (
                      <a href={item.fileHref} className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
                        Open document
                      </a>
                  ) : viewingOther ? (
                      <p className="text-sm font-semibold text-slate-600">
                        Status only. This person completes their own review and signature.
                      </p>
                  ) : null}
                  {!viewingOther && item.kind === "review" && item.fileHref ? (
                    <form action={openOnboardingDocument}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="returnTo" value="/manager/onboarding" />
                      <button className="min-h-12 w-full rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
                        Open
                      </button>
                    </form>
                  ) : null}
                  {!viewingOther && item.kind === "review" && !item.fileHref && item.status !== "reviewed" ? (
                    <form action={startOnboardingReview}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="returnTo" value="/manager/onboarding" />
                      <button className="min-h-12 w-full rounded-2xl border border-emerald-200 px-4 text-sm font-black text-emerald-900">
                        Open
                      </button>
                    </form>
                  ) : null}
                  {!viewingOther && item.kind === "review" && item.status !== "reviewed" ? (
                    <form action={confirmOnboardingReview}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="returnTo" value="/manager/onboarding" />
                      <button className="min-h-12 w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-950">
                        I have reviewed this document
                      </button>
                    </form>
                  ) : null}
                  {!viewingOther && item.kind !== "review" && item.signingUrl && !item.locked ? (
                    <form action={followOnboardingSignature}>
                      <input type="hidden" name="itemId" value={item.id} />
                      <input type="hidden" name="returnTo" value="/manager/onboarding" />
                      <button className="min-h-12 w-full rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white">
                        Review & sign
                      </button>
                    </form>
                  ) : null}
                  {item.locked ? (
                    <p className="text-sm font-semibold text-slate-600">
                      This stays locked until the handbook, leadership guide, tools policy, and communications policy are reviewed.
                    </p>
                  ) : null}
                </div>
              </GrowthCard>
            ))}
          </div>
          <p className="text-sm font-semibold text-slate-500">
            Completed agreements are kept in the {workspace.repositoryLabel}. They are not stored in the Manager Portal.
            {workspace.timekeeperEnabled ? " SitGuru Timekeeper orientation is part of this package." : " Timekeeping guidance is in the handbook until SitGuru Timekeeper is enabled."}
          </p>
        </>
      )}
      <Link href="/manager" className="inline-flex min-h-11 items-center text-sm font-black text-emerald-800">
        Back to Manager Portal
      </Link>
    </GrowthPageFrame>
  );
}
