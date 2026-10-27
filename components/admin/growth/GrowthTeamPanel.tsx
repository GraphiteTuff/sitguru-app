import Link from "next/link";
import type { GrowthTeamMember } from "@/lib/admin/growth/team-summary";
import GrowthEmptyState from "@/components/admin/growth/GrowthEmptyState";

export default function GrowthTeamPanel({
  members,
  intern = false,
}: {
  members: GrowthTeamMember[];
  intern?: boolean;
}) {
  if (intern) {
    return (
      <div className="space-y-3 pt-4">
        <p className="text-sm font-semibold text-slate-600">
          Formal hours, university requirements, and weekly check-ins live in
          the Intern Portal. Production assignments live in Microsoft Planner —
          not here.
        </p>
        <Link
          href="/intern"
          className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
          style={{ background: "#0D5C3A" }}
        >
          Open Intern Portal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3 pt-4">
      <p className="text-sm font-semibold text-slate-600">
        Assigned interns for the Growth Manager. Oversight stays in Manager
        Desk. Work assignments stay in Planner.
      </p>
      {members.length === 0 ? (
        <GrowthEmptyState
          title="No assigned interns yet"
          detail="Admin assigns intern managers separately. This panel updates dynamically — no hardcoded names."
          action={
            <Link
              href="/intern/manage"
              className="inline-flex min-h-11 items-center rounded-2xl px-4 text-sm font-black !text-white"
              style={{ background: "#0D5C3A" }}
            >
              Open Intern Team Desk
            </Link>
          }
        />
      ) : (
        <ul className="space-y-2">
          {members.map((member) => (
            <li
              key={member.id}
              className="rounded-2xl border border-slate-100 bg-slate-50 p-3"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="break-words font-black text-slate-950">
                    {member.name}
                  </p>
                  <p className="mt-1 break-words text-xs font-semibold text-slate-500">
                    {member.statusLabel}
                    {member.school ? ` · ${member.school}` : ""}
                    {member.program ? ` · ${member.program}` : ""}
                  </p>
                  <p className="mt-1 text-xs font-semibold text-emerald-800">
                    Hours submitted {member.hoursSubmitted} · approved{" "}
                    {member.hoursApproved}
                  </p>
                </div>
                <Link
                  href={member.managerDeskHref}
                  className="inline-flex min-h-11 items-center rounded-2xl border border-emerald-200 bg-white px-3 text-sm font-black text-emerald-900"
                >
                  Intern Team Desk
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
