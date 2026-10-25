import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Lightbulb,
  Megaphone,
  Users,
  type LucideIcon,
} from "lucide-react";
import { growthHref, type GrowthWorkplaceAccess } from "@/lib/admin/growth/workplace";
import { getGrowthResourceLinks } from "@/lib/admin/growth/operating-model";

type QuickAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
  external?: boolean;
};

/**
 * Outcome-focused Quick Actions for phones/tablets.
 * Does not expose Planner-style personal task creation.
 */
export default function GrowthQuickActions({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const base = workplace.basePath;
  const intern = workplace.kind === "intern";
  const planner = getGrowthResourceLinks({ intern }).find((item) => item.id === "planner");

  const actions: QuickAction[] = [
    {
      href: `${growthHref(base, "/events")}#record-results`,
      label: "Record Event Results",
      icon: ClipboardList,
      primary: true,
    },
    {
      href: growthHref(base, "/events"),
      label: "Community & Events",
      icon: CalendarDays,
    },
    {
      href: growthHref(base, "/campaigns"),
      label: "Campaign outcomes",
      icon: Megaphone,
    },
    {
      href: growthHref(base, "/intelligence"),
      label: "Record Growth Insight",
      icon: Lightbulb,
    },
    {
      href: growthHref(base, "/analytics"),
      label: "Analytics / Results",
      icon: BarChart3,
    },
    {
      href: intern ? "/intern" : "/intern/manage",
      label: intern ? "Intern Portal" : "Manager Desk",
      icon: Users,
    },
  ];

  if (planner) {
    actions.push({
      href: planner.href,
      label: "Open Planner",
      icon: ClipboardList,
      external: true,
    });
  }

  const visible = actions.filter((action) => {
    if (intern && action.href.includes("#record-results")) return false;
    if (intern && action.href.startsWith("/admin/sales-marketing")) return false;
    return true;
  });

  return (
    <section
      aria-label="Quick actions"
      className="rounded-[1.5rem] border border-emerald-100 bg-white p-3 shadow-sm sm:p-4 lg:hidden"
    >
      <p className="px-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
        Quick actions
      </p>
      <p className="mt-1 px-1 text-xs font-semibold text-slate-500">
        Outcomes in SitGuru. Assignments in Planner.
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {visible.map((action) => {
          const Icon = action.icon;
          const className = action.primary
            ? "flex min-h-14 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black !text-white shadow-sm"
            : "flex min-h-14 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm font-black text-emerald-950";
          const body = (
            <>
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 leading-tight break-words">
                {action.label}
              </span>
            </>
          );
          if (action.external) {
            return (
              <a
                key={`${action.href}-${action.label}`}
                href={action.href}
                target="_blank"
                rel="noreferrer"
                className={className}
                style={action.primary ? { background: "#0D5C3A" } : undefined}
              >
                {body}
              </a>
            );
          }
          return (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={className}
              style={action.primary ? { background: "#0D5C3A" } : undefined}
            >
              {body}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
