import { createElement, type ReactNode } from "react";
import { getAdminIdentity, type AdminIdentity } from "@/lib/admin/access";
import { isGrowthOnlyRole } from "@/lib/admin/growth-paths";

function AccessRestrictedUI() {
  return createElement(
    "div",
    { className: "min-h-[50vh] px-4 py-8 text-slate-950" },
    createElement(
      "div",
      {
        className:
          "mx-auto max-w-xl rounded-[1.75rem] border border-rose-100 bg-white p-6 shadow-sm",
      },
      createElement(
        "p",
        {
          className:
            "text-xs font-black uppercase tracking-[0.24em] text-rose-700",
        },
        "Access Restricted",
      ),
      createElement(
        "h1",
        { className: "mt-3 text-3xl font-black tracking-tight text-slate-950" },
        "Growth portal access required.",
      ),
      createElement(
        "p",
        { className: "mt-3 text-sm font-semibold leading-6 text-slate-600" },
        "Sign in as a SitGuru Super Admin or Social & Community Manager to open this workspace.",
      ),
    ),
  );
}

export function canUseGrowthPortal(actor: AdminIdentity | null | undefined) {
  if (!actor?.canAccessAdmin) return false;
  return actor.isSuperUser || isGrowthOnlyRole(actor.role);
}

export async function requireGrowthPortal(): Promise<
  { ok: true; actor: AdminIdentity } | { ok: false; ui: ReactNode }
> {
  const actor = await getAdminIdentity();

  if (!canUseGrowthPortal(actor) || !actor) {
    return { ok: false, ui: createElement(AccessRestrictedUI) };
  }

  return { ok: true, actor };
}
