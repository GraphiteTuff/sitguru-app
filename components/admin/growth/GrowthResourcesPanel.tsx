import Link from "next/link";
import { ExternalLink } from "lucide-react";
import {
  getGrowthResourceLinks,
  type GrowthResourceLink,
} from "@/lib/admin/growth/operating-model";

export default function GrowthResourcesPanel({
  intern = false,
  email = null,
  links,
}: {
  intern?: boolean;
  /** Viewer email — Teams shortcuts only for @sitguru.com. */
  email?: string | null;
  links?: GrowthResourceLink[];
}) {
  const items = links || getGrowthResourceLinks({ intern, email });

  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm font-semibold text-slate-600">
        Teams communicates. Planner manages work. Growth Workspace measures
        outcomes. These links open the systems SitGuru already uses — they are
        not rebuilt here.
      </p>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 px-4 py-4 text-sm font-semibold text-slate-600">
          Configure optional{" "}
          <code className="text-xs">NEXT_PUBLIC_SITGURU_TEAMS_GROWTH_URL</code>,{" "}
          <code className="text-xs">NEXT_PUBLIC_SITGURU_PLANNER_GROWTH_URL</code>
          , and{" "}
          <code className="text-xs">NEXT_PUBLIC_SITGURU_BRAND_KIT_URL</code> to
          surface Teams / Planner / Brand Kit shortcuts.
        </p>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item) => {
          const className =
            "flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-emerald-100 bg-slate-50 px-4 py-3 text-sm font-black text-emerald-950";
          const body = (
            <>
              <span className="min-w-0">
                <span className="block break-words">{item.label}</span>
                <span className="mt-0.5 block text-xs font-semibold text-slate-500">
                  {item.detail}
                </span>
              </span>
              {item.external ? (
                <ExternalLink size={16} className="shrink-0 text-emerald-700" />
              ) : null}
            </>
          );
          if (item.external) {
            return (
              <a
                key={item.id}
                href={item.href}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {body}
              </a>
            );
          }
          return (
            <Link key={item.id} href={item.href} className={className}>
              {body}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
