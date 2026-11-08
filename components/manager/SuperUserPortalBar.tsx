"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { PortalPerson } from "@/lib/admin/growth/super-user-portals";

export default function SuperUserPortalBar({
  managers,
  interns,
}: {
  managers: PortalPerson[];
  interns: PortalPerson[];
}) {
  const viewing = useSearchParams().get("as") || "";
  const chip = (active: boolean) =>
    active
      ? "inline-flex min-h-9 items-center rounded-full bg-[#0D5C3A] px-3 text-xs font-black !text-white"
      : "inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-black text-slate-800";

  return (
    <details className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer list-none px-4 py-3 text-sm font-black text-[#0F2744] [&::-webkit-details-marker]:hidden">
        Team portals
        <span className="ml-2 text-xs font-semibold text-slate-500">
          {managers.length} managers · {interns.length} interns
        </span>
      </summary>
      <div className="space-y-3 px-4 pb-4">
        <p className="text-xs font-semibold text-slate-600">
          Opens an authorized desk preview. You stay signed in as yourself.
        </p>
        <div>
          <p className="text-xs font-black text-slate-500">Managers</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/manager" className={chip(!viewing)}>
              My view
            </Link>
            {managers.map((manager) => (
              <Link
                key={manager.id}
                href={`/manager?as=${encodeURIComponent(manager.id)}`}
                className={chip(viewing === manager.id)}
                aria-label={`Open ${manager.name}'s manager desk`}
              >
                {manager.name}
              </Link>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-black text-slate-500">Interns</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {interns.length ? (
              interns.map((intern) => (
                <Link
                  key={intern.id}
                  href={`/intern?view=${encodeURIComponent(intern.id)}`}
                  className={chip(false)}
                  aria-label={`Preview ${intern.name}'s intern portal`}
                >
                  {intern.name}
                </Link>
              ))
            ) : (
              <p className="text-sm font-semibold text-slate-500">No intern portals yet.</p>
            )}
          </div>
        </div>
      </div>
    </details>
  );
}
