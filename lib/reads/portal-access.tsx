import { createElement, type ReactNode } from "react";
import Link from "next/link";
import { getReadsIdentity, type ReadsIdentity } from "./access";
import type { ReadsStaffRole } from "./types";

function Restricted({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
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
        title,
      ),
      createElement(
        "p",
        {
          className: "mt-3 text-sm font-semibold leading-6 text-slate-600",
        },
        message,
      ),
      createElement(
        Link,
        {
          href: "/admin/login",
          className:
            "mt-6 inline-flex rounded-full bg-[#0D5C3A] px-4 py-2 text-sm font-black text-white",
        },
        "Sign in",
      ),
    ),
  );
}

const rank: Record<ReadsStaffRole, number> = {
  none: 0,
  intern: 1,
  manager: 2,
  admin: 3,
};

export async function requireReadsPortal(
  minimum: Exclude<ReadsStaffRole, "none">,
): Promise<
  | { ok: true; identity: ReadsIdentity }
  | { ok: false; ui: ReactNode }
> {
  const identity = await getReadsIdentity();
  if (!identity || rank[identity.staffRole] < rank[minimum]) {
    return {
      ok: false,
      ui: createElement(Restricted, {
        title: "Reads staff access required.",
        message:
          minimum === "intern"
            ? "Sign in with an Intern, Manager, or Admin account assigned to Reads & Media."
            : minimum === "manager"
              ? "Sign in with Ava’s Growth Manager role or an Admin account."
              : "Sign in with a Super Admin / Founder account for Reads oversight.",
      }),
    };
  }
  return { ok: true, identity };
}
