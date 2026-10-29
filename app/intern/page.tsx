import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";
import { canPreviewInternPortal, internshipActorKind } from "@/lib/internship/manager-access";
import { isFounderPersonalMarketplaceEmail } from "@/lib/admin/super-users";
import InternStudentDashboard from "@/components/internship/InternStudentDashboard";
import InternshipGrowthWorkspace from "@/components/internship/InternshipGrowthWorkspace";
import InternAvatar from "@/components/internship/InternAvatar";
import InternshipBackToProgram from "@/components/internship/InternshipBackToProgram";
import { INTERNSHIP_ADMIN_PATH } from "@/lib/internship/constants";
import {
  documentationInternWorkspace,
  documentationPromoteEvents,
} from "@/lib/internship/documentation-fixture";
import {
  internDocumentationModeEnabled,
  internDocumentationScene,
} from "@/lib/internship/documentation-mode";
import { internOnboardingComplete, INTERNSHIP_ONBOARDING_PATH } from "@/lib/internship/onboarding";
import {
  findInternByAccount,
  findInternById,
  getInternOnboarding,
  getInternWorkspace,
  linkInternUserId,
} from "@/lib/internship/queries";
import { lookupProfileAvatarForUser } from "@/lib/internship/avatar";
import { activateInternAccess } from "@/lib/internship/intern-access-actions";
import { listInternPromoteEvents } from "@/lib/internship/intern-promote-events";
import Link from "next/link";
import { internLegacySectionRedirect } from "@/lib/internship/intern-routes";

export const dynamic = "force-dynamic";

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value || "";
}

export default async function InternPortalPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const params = searchParams ? await searchParams : {};
  const viewId = first(params.view);
  const ok = first(params.ok);
  const error = first(params.error);

  // Flat IA: legacy tab/tool queries redirect to one-click sidebar pages.
  if (!viewId) {
    const flat = internLegacySectionRedirect({
      tab: first(params.tab),
      focus: first(params.focus),
      tool: first(params.tool),
      work: first(params.work),
      edit: first(params.edit),
    });
    if (flat && flat !== "/intern") redirect(flat);
  }

  if (internDocumentationModeEnabled()) {
    const workspace = documentationInternWorkspace(
      internDocumentationScene(first(params.doc)),
    );
    const panel = first(params.panel);
    return (
      <div className="w-full min-w-0 space-y-4">
        {panel === "workspace" ? (
          <InternshipGrowthWorkspace
            data={workspace}
            mode="intern"
            preview={false}
            initialTab={first(params.workspaceTab) || "campaigns"}
          />
        ) : (
          <InternStudentDashboard
            data={workspace}
            events={documentationPromoteEvents()}
            preview={false}
            initialTab={first(params.tab)}
            initialTool={first(params.tool) || null}
            initialWorkFilter={first(params.work)}
            initialDate={first(params.date)}
            initialProfileOpen={first(params.edit) === "page"}
          />
        )}
      </div>
    );
  }

  if (!user) redirect("/intern/login");

  const admin = await getAdminIdentity();
  const ownIntern = await findInternByAccount({
    userId: user.id,
    email: user.email,
  });
  const kind = internshipActorKind({
    role: admin?.role,
    isSuperUser: admin?.isSuperUser,
    isIntern: Boolean(ownIntern),
  });
  const portalAccess = {
    actor: kind,
    canAccessAdmin: admin?.canAccessAdmin,
    growthOnly: Boolean(admin && isGrowthOnlyRole(admin.role) && !admin.isSuperUser),
    actorUserId: user.id,
    actorInternId: ownIntern?.id,
  };
  let intern = ownIntern;
  let preview = false;
  if (viewId) {
    const target = await findInternById(viewId);
    if (
      target &&
      target.id !== ownIntern?.id &&
      canPreviewInternPortal({
        ...portalAccess,
        targetInternId: target.id,
        managerUserId: target.managerUserId,
      })
    ) {
      intern = target;
      preview = true;
    }
  }

  if (!intern) {
    if (admin?.canAccessAdmin) redirect(`${INTERNSHIP_ADMIN_PATH}/portal`);
    if (isFounderPersonalMarketplaceEmail(user.email)) {
      const avatarUrl = await lookupProfileAvatarForUser({
        userId: user.id,
        email: user.email,
        metadata: {
          ...(user.app_metadata || {}),
          ...(user.user_metadata || {}),
        },
      });
      const firstName =
        String(user.user_metadata?.full_name || user.user_metadata?.name || "")
          .trim()
          .split(/\s+/)[0] || "there";
      return (
        <main className="mx-auto max-w-lg px-4 py-10">
          <section
            className="public-dark-section rounded-[1.75rem] p-5 sm:p-6"
            data-brand-green
            style={{ background: "#166534" }}
          >
            <div className="flex items-center gap-4">
              <InternAvatar
                name={firstName}
                email={user.email}
                src={avatarUrl}
                size="lg"
              />
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] !text-white/80">
                  Intern portal
                </p>
                <h1 className="mt-1 text-2xl font-black !text-white">Hey, {firstName}</h1>
              </div>
            </div>
            <p className="mt-4 text-sm font-semibold !text-white/90">
              Your intern workspace opens after SitGuru approves your access request.
            </p>
          </section>
          <section className="rounded-[1.75rem] border border-emerald-100 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-2">
              <Link
                href="/customer/dashboard"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-[#166534] px-4 text-sm font-black !text-white"
              >
                Pet Parent dashboard
              </Link>
              <Link
                href="/intern/request"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-sm font-black text-emerald-900"
              >
                Request internship access
              </Link>
            </div>
          </section>
        </main>
      );
    }
    redirect("/intern/request");
  }

  if (!preview && !intern.userId) {
    await linkInternUserId(intern.id, user.id);
  }

  if (!preview) {
    const ack = await getInternOnboarding(intern.id);
    if (!internOnboardingComplete(ack)) redirect(INTERNSHIP_ONBOARDING_PATH);
    await activateInternAccess(intern.userId || user.id);
  }

  const workspace = await getInternWorkspace(intern.id);
  if (!workspace) redirect("/intern/login");

  const promoteEvents = await listInternPromoteEvents();

  return (
    <div className="w-full min-w-0 space-y-4">
      {preview ? (
        <section className="space-y-3">
          <InternshipBackToProgram />
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.5rem] border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm font-semibold text-amber-950">
              Student view for {workspace.intern.fullName}. Grade work from Employer review.
            </p>
            <Link
              href={`${INTERNSHIP_ADMIN_PATH}/interns/${intern.id}`}
              className="inline-flex min-h-11 items-center rounded-2xl bg-[#166534] px-4 text-xs font-black !text-white"
            >
              Employer review
            </Link>
          </div>
        </section>
      ) : null}
      <InternStudentDashboard
        data={workspace}
        events={promoteEvents}
        preview={preview}
        notice={
          ok
            ? { kind: "ok", message: ok }
            : error
              ? { kind: "error", message: error }
              : null
        }
        initialTab={first(params.tab)}
        initialTool={first(params.tool) || null}
        initialWorkFilter={first(params.work)}
        initialDate={first(params.date)}
        initialProfileOpen={first(params.edit) === "page"}
      />
    </div>
  );
}
