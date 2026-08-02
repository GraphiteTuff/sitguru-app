import { createElement, type ReactNode } from "react";
import { getAdminIdentity, type AdminIdentity } from "@/lib/admin/access";

function AccessRestrictedUI() {
  return createElement(
    "div",
    { className: "min-h-screen bg-[#f7fbf8] px-6 py-10 text-slate-950" },
    createElement(
      "div",
      {
        className:
          "mx-auto max-w-3xl rounded-[2rem] border border-rose-100 bg-white p-8 shadow-sm",
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
        {
          className: "mt-3 text-4xl font-black tracking-tight text-slate-950",
        },
        "Admin access required.",
      ),
      createElement(
        "p",
        {
          className: "mt-3 text-sm font-semibold leading-6 text-slate-600",
        },
        "Sign in with an authorized SitGuru admin, sales, or marketing account to open Sales & Marketing.",
      ),
    ),
  );
}

export async function requireSalesMarketingAdmin(): Promise<
  | { ok: true; actor: AdminIdentity }
  | { ok: false; ui: ReactNode }
> {
  const actor = await getAdminIdentity();

  if (!actor?.canAccessAdmin) {
    return {
      ok: false,
      ui: createElement(AccessRestrictedUI),
    };
  }

  return { ok: true, actor };
}
