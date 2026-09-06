import { createElement, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/server";
import { getAdminIdentity, type AdminIdentity } from "@/lib/admin/access";
import { findInternByAccount } from "@/lib/internship/queries";
import { INTERNSHIP_GROWTH_PATH } from "@/lib/internship/intern-growth";
import { canUseGrowthPortal, requireGrowthPortal } from "@/lib/admin/growth/access";
import type { InternshipIntern } from "@/lib/internship/types";

export const GROWTH_ADMIN_BASE = "/admin/growth";
export const GROWTH_INTERN_BASE = INTERNSHIP_GROWTH_PATH;

export type GrowthWorkplaceKind = "admin" | "intern";

export type GrowthWorkplaceActor = {
  id: string;
  email: string;
  isSuperUser: boolean;
  kind: "admin" | "intern";
};

export type GrowthWorkplaceAccess = {
  ok: true;
  kind: GrowthWorkplaceKind;
  basePath: string;
  actor: GrowthWorkplaceActor;
  canApprove: boolean;
};

function internDeniedUI() {
  return createElement(
    "div",
    { className: "mx-auto max-w-xl px-4 py-10" },
    createElement(
      "div",
      {
        className:
          "rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm",
      },
      createElement(
        "p",
        {
          className:
            "text-xs font-black uppercase tracking-[0.24em] text-rose-700",
        },
        "Intern portal",
      ),
      createElement(
        "h1",
        { className: "mt-3 text-3xl font-black tracking-tight text-slate-950" },
        "Growth workplace needs an assigned intern login.",
      ),
      createElement(
        "p",
        { className: "mt-3 text-sm font-semibold leading-6 text-slate-600" },
        "This is the SitGuru Market Growth workbench for the internship — not Admin HQ. Sign in with the account Employer HQ assigned, or open the intern portal.",
      ),
      createElement(
        "a",
        {
          href: "/intern",
          className:
            "mt-6 inline-flex min-h-11 items-center rounded-2xl bg-[#0D5C3A] px-4 text-sm font-black !text-white",
        },
        "Back to intern portal",
      ),
    ),
  );
}

function internToActor(intern: InternshipIntern): GrowthWorkplaceActor {
  return {
    id: intern.userId || intern.id,
    email: intern.email || intern.studentEmail,
    isSuperUser: false,
    kind: "intern",
  };
}

function adminToActor(actor: AdminIdentity): GrowthWorkplaceActor {
  return {
    id: actor.id,
    email: actor.email,
    isSuperUser: actor.isSuperUser,
    kind: "admin",
  };
}

export function growthHref(basePath: string, suffix = "") {
  const path = String(suffix || "").trim();
  if (!path) return basePath;
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export async function currentAssignedIntern() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  return findInternByAccount({
    userId: user.id,
    email: user.email,
  });
}

export async function requireGrowthWorkplace(
  kind: GrowthWorkplaceKind,
): Promise<GrowthWorkplaceAccess | { ok: false; ui: ReactNode }> {
  if (kind === "intern") {
    const intern = await currentAssignedIntern();
    if (intern) {
      return {
        ok: true,
        kind,
        basePath: GROWTH_INTERN_BASE,
        actor: internToActor(intern),
        canApprove: false,
      };
    }

    const admin = await getAdminIdentity();
    if (canUseGrowthPortal(admin) && admin) {
      return {
        ok: true,
        kind,
        basePath: GROWTH_INTERN_BASE,
        actor: adminToActor(admin),
        canApprove: false,
      };
    }

    return { ok: false, ui: internDeniedUI() };
  }

  const access = await requireGrowthPortal();
  if (!access.ok) return access;

  return {
    ok: true,
    kind,
    basePath: GROWTH_ADMIN_BASE,
    actor: adminToActor(access.actor),
    canApprove: access.actor.isSuperUser,
  };
}

export async function requireGrowthActor(): Promise<
  { ok: true; actor: GrowthWorkplaceActor } | { ok: false; error: string }
> {
  const intern = await currentAssignedIntern();
  if (intern) return { ok: true, actor: internToActor(intern) };

  const actor = await getAdminIdentity();
  if (!canUseGrowthPortal(actor) || !actor) {
    return { ok: false, error: "Not allowed." };
  }
  return { ok: true, actor: adminToActor(actor) };
}
