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
    <section className="mb-4 rounded-[1.5rem] border border-emerald-100 bg-white p-4 shadow-sm">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-800">
        Portals
      </p>
      <div className="mt-3">
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
            >
              {manager.name}
            </Link>
          ))}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-xs font-black text-slate-500">Interns</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {interns.length ? (
            interns.map((intern) => (
              <Link
                key={intern.id}
                href={`/intern?view=${encodeURIComponent(intern.id)}`}
                className={chip(false)}
              >
                {intern.name}
              </Link>
            ))
          ) : (
            <p className="text-sm font-semibold text-slate-500">No intern portals yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}
