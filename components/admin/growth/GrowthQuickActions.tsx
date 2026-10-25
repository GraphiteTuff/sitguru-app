import Link from "next/link";
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  Megaphone,
  Plus,
  Users,
  type LucideIcon,
} from "lucide-react";
import { growthHref, type GrowthWorkplaceAccess } from "@/lib/admin/growth/workplace";

type QuickAction = {
  href: string;
  label: string;
  icon: LucideIcon;
  primary?: boolean;
};

/**
 * Compact, touch-friendly Quick Actions for phones/tablets.
 * Only exposes actions the current Growth workplace role can use.
 */
export default function GrowthQuickActions({
  workplace,
}: {
  workplace: GrowthWorkplaceAccess;
}) {
  const base = workplace.basePath;
  const intern = workplace.kind === "intern";

  const actions: QuickAction[] = [
    {
      href: growthHref(base, "/create?type=event"),
      label: "Add Event post",
      icon: Plus,
      primary: true,
    },
    {
      href: growthHref(base, "/events"),
      label: "Community & Events",
      icon: CalendarDays,
    },
    {
      href: "/admin/sales-marketing/lead-entry",
      label: "Record Event Results",
      icon: ClipboardList,
    },
    {
      href: growthHref(base, "/create"),
      label: "Add Growth Campaign",
      icon: Megaphone,
    },
    {
      href: growthHref(base, "/analytics"),
      label: "Record Growth Insight",
      icon: BarChart3,
    },
    {
      href: intern ? "/intern" : "/intern/manage",
      label: intern ? "Intern portal" : "View Team",
      icon: Users,
    },
  ].filter((action) => {
    // Interns stay inside the Growth + intern portal surface — no Admin lead CRM.
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
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={`${action.href}-${action.label}`}
              href={action.href}
              className={
                action.primary
                  ? "flex min-h-14 items-center gap-2 rounded-2xl px-3 py-2 text-sm font-black !text-white shadow-sm"
                  : "flex min-h-14 items-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm font-black text-emerald-950"
              }
              style={action.primary ? { background: "#0D5C3A" } : undefined}
            >
              <Icon size={18} className="shrink-0" aria-hidden="true" />
              <span className="min-w-0 leading-tight break-words">{action.label}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
