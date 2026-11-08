import Link from "next/link";
import type { ReactNode } from "react";
import { DESK_BANNER, DESK_UI } from "@/lib/portal/desk-ui";
import type { ResourceGroup } from "@/lib/manager/resource-catalog";

export default function ManagerResourceLibrary({
  groups,
  query,
  empty,
  children,
}: {
  groups: ResourceGroup[];
  query: string;
  empty: boolean;
  children?: ReactNode;
}) {
  return (
    <div className="space-y-5 pb-28 lg:pb-8">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-[1.4fr_0.8fr]">
          <div className="p-4 sm:p-5">
            <h1 className="text-2xl font-black tracking-tight text-[#0F2744] sm:text-3xl">Resources</h1>
            <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
              Find guidance and reference documents. Do the work from the Manager Toolkit.
            </p>
            <Link href="/manager/toolkit" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-[#2563EB] px-4 text-sm font-bold !text-white">
              Open Toolkit
            </Link>
          </div>
          <div className="relative min-h-28">
            <img src={DESK_BANNER} alt="" className="h-full min-h-28 w-full object-cover object-center" />
          </div>
        </div>
      </section>

      <form action="/manager/resources" method="get" role="search">
        <label className="block">
          <span className="sr-only">Search resources</span>
          <input
            name="q"
            defaultValue={query}
            placeholder="Search guides, policies, SOPs, and work systems..."
            className={DESK_UI.search}
          />
        </label>
      </form>

      {empty ? (
        <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600" role="status">
          No resources match that search.
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.id} className={`${DESK_UI.card} p-4`}>
            <h2 className="text-lg font-black text-[#0F2744]">{group.title}</h2>
            <p className="mt-1 text-sm font-medium text-slate-600">{group.subtitle}</p>
            <ul className="mt-3 space-y-3">
              {group.items.map((item) => (
                <li key={item.label}>
                  {item.href ? (
                    item.external ? (
                      <a className="font-bold text-[#2563EB] hover:underline" href={item.href} target="_blank" rel="noreferrer">
                        {item.label}
                      </a>
                    ) : (
                      <Link className="font-bold text-[#2563EB] hover:underline" href={item.href}>
                        {item.label}
                      </Link>
                    )
                  ) : (
                    <p className="font-bold text-[#0F2744]">{item.label}</p>
                  )}
                  <p className="text-xs font-medium text-slate-500">{item.unavailable || item.detail}</p>
                </li>
              ))}
            </ul>
            {group.id === "m365" ? <div className="mt-4 space-y-4">{children}</div> : null}
          </section>
        ))}
      </div>
    </div>
  );
}
